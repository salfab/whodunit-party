import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logging';
import { validateSession } from '@/lib/auth';
import { MIN_PLAYERS } from '@/lib/constants';

const log = createLogger('api.sessions.mark-ready');

/**
 * POST /api/sessions/[sessionId]/mark-ready
 * Mark player as ready and auto-start game if all players are ready
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const { isReady } = await request.json();

    // Validate session and get player ID
    const session = await validateSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const playerId = session.playerId;

    const supabase = await createServiceClient();

    // Update player ready state
    const { error: updateError } = await supabase
      .from('player_ready_states')
      .upsert(
        {
          session_id: sessionId,
          player_id: playerId,
          is_ready: isReady,
        },
        {
          onConflict: 'session_id,player_id',
        }
      );

    if (updateError) {
      log('error', 'Failed to update ready state', { error: updateError.message });
      return NextResponse.json(
        { error: 'Failed to update ready state' },
        { status: 500 }
      );
    }

    // If marking as NOT ready, just return success
    if (!isReady) {
      return NextResponse.json({ success: true, gameStarted: false });
    }

    // Check if all players are now ready
    const { data: activePlayers, error: playersError } = await supabase
      .from('players')
      .select('id')
      .eq('session_id', sessionId)
      .eq('status', 'active');

    if (playersError || !activePlayers || activePlayers.length < MIN_PLAYERS) {
      return NextResponse.json({ success: true, gameStarted: false });
    }

    const { data: readyStates, error: readyError } = await supabase
      .from('player_ready_states')
      .select('player_id, is_ready')
      .eq('session_id', sessionId)
      .eq('is_ready', true);

    if (readyError) {
      log('error', 'Failed to check ready states', { error: readyError.message });
      return NextResponse.json({ success: true, gameStarted: false });
    }

    const readyCount = readyStates?.length || 0;
    const allReady = readyCount === activePlayers.length;

    log('info', 'Ready check', {
      sessionId,
      activePlayers: activePlayers.length,
      readyCount,
      allReady,
    });

    // If not all ready, just return success
    if (!allReady) {
      return NextResponse.json({ success: true, gameStarted: false });
    }

    // All players are ready! This player triggers game start
    log('info', 'All players ready, starting game', { sessionId });

    // Check if game already started (race condition check)
    const { data: gameSession, error: sessionError } = await supabase
      .from('game_sessions')
      .select('status')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      log('error', 'Failed to check session status', { error: sessionError.message });
      return NextResponse.json({ success: true, gameStarted: false });
    }

    if (gameSession.status === 'playing') {
      // Game already started by another player
      return NextResponse.json({ success: true, gameStarted: true });
    }

    // Get a random mystery
    const { data: mysteries, error: mysteriesError } = await supabase
      .from('mysteries')
      .select('id');

    if (mysteriesError || !mysteries || mysteries.length === 0) {
      log('error', 'Failed to fetch mysteries', { error: mysteriesError?.message });
      return NextResponse.json({ success: true, gameStarted: false });
    }

    const randomMystery = mysteries[Math.floor(Math.random() * mysteries.length)];
    const mysteryId = randomMystery.id;

    // Atomically update session to 'playing' - acts as a distributed lock
    const { data: updatedSession, error: lockError } = await supabase
      .from('game_sessions')
      .update({ status: 'playing', current_mystery_id: mysteryId })
      .eq('id', sessionId)
      .eq('status', 'lobby')
      .select()
      .single();

    // If lock failed, another player already started the game
    if (lockError || !updatedSession) {
      log('info', 'Another player already started the game', { sessionId });
      return NextResponse.json({ success: true, gameStarted: true });
    }

    // We got the lock! Distribute roles
    log('info', 'Acquired lock, distributing roles', { sessionId, mysteryId });

    // Get character sheets for the mystery
    const { data: sheets, error: sheetsError } = await supabase
      .from('character_sheets')
      .select('*')
      .eq('mystery_id', mysteryId);

    if (sheetsError || !sheets) {
      log('error', 'Failed to fetch character sheets', { error: sheetsError?.message });
      return NextResponse.json(
        { error: 'Failed to fetch character sheets' },
        { status: 500 }
      );
    }

    // Get players with investigator tracking
    const { data: playersWithTracking, error: trackingError } = await supabase
      .from('players')
      .select('id, has_been_investigator')
      .eq('session_id', sessionId)
      .eq('status', 'active')
      .order('created_at', { ascending: true });

    if (trackingError || !playersWithTracking) {
      log('error', 'Failed to fetch players', { error: trackingError?.message });
      return NextResponse.json(
        { error: 'Failed to fetch players' },
        { status: 500 }
      );
    }

    // Separate sheets by role
    const investigatorSheet = sheets.find((s) => s.role === 'investigator');
    const guiltySheet = sheets.find((s) => s.role === 'guilty');
    const innocentSheets = sheets.filter((s) => s.role === 'innocent');

    if (!investigatorSheet || !guiltySheet) {
      log('error', 'Mystery missing required roles', { mysteryId });
      return NextResponse.json(
        { error: 'Mystery is missing required roles' },
        { status: 400 }
      );
    }

    // Select investigator (prioritize never-been-investigator)
    const neverInvestigators = playersWithTracking.filter(p => !p.has_been_investigator);
    const hasBeenInvestigators = playersWithTracking.filter(p => p.has_been_investigator);
    const investigatorCandidates = neverInvestigators.length > 0 ? neverInvestigators : hasBeenInvestigators;
    const investigatorPlayer = investigatorCandidates[Math.floor(Math.random() * investigatorCandidates.length)];
    
    // Shuffle remaining players
    const remainingPlayersForRoles = playersWithTracking
      .filter(p => p.id !== investigatorPlayer.id)
      .sort(() => Math.random() - 0.5);

    // Build assignments
    const assignments = [
      {
        session_id: sessionId,
        player_id: investigatorPlayer.id,
        sheet_id: investigatorSheet.id,
        mystery_id: mysteryId,
      },
      {
        session_id: sessionId,
        player_id: remainingPlayersForRoles[0].id,
        sheet_id: guiltySheet.id,
        mystery_id: mysteryId,
      },
    ];

    // Mark investigator
    await supabase
      .from('players')
      .update({ has_been_investigator: true })
      .eq('id', investigatorPlayer.id);

    // Distribute innocent sheets
    const remainingPlayers = remainingPlayersForRoles.slice(1);
    const shuffledInnocentSheets = [...innocentSheets].sort(() => Math.random() - 0.5);

    for (let i = 0; i < remainingPlayers.length && i < shuffledInnocentSheets.length; i++) {
      assignments.push({
        session_id: sessionId,
        player_id: remainingPlayers[i].id,
        sheet_id: shuffledInnocentSheets[i].id,
        mystery_id: mysteryId,
      });
    }

    // Insert assignments
    const { error: assignError } = await supabase
      .from('player_assignments')
      .insert(assignments);

    if (assignError) {
      log('error', 'Failed to create assignments', { error: assignError.message });
      return NextResponse.json(
        { error: 'Failed to distribute roles' },
        { status: 500 }
      );
    }

    log('info', 'Game started successfully', {
      sessionId,
      mysteryId,
      assignmentCount: assignments.length,
    });

    return NextResponse.json({
      success: true,
      gameStarted: true,
      mysteryId,
    });
  } catch (error) {
    log('error', 'Unexpected error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
