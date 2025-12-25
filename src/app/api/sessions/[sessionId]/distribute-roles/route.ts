import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logging';
import { MIN_PLAYERS } from '@/lib/constants';

const log = createLogger('api.sessions.distribute-roles');

/**
 * POST /api/sessions/[sessionId]/distribute-roles
 * Distributes character roles to players for a specific mystery
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const { mysteryId } = await request.json();

    if (!mysteryId) {
      return NextResponse.json(
        { error: 'Mystery ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Check if session is already in 'playing' status with this mystery
    // This prevents race conditions when multiple players call this API simultaneously
    const { data: currentSessionData, error: sessionCheckError } = await (supabase
      .from('game_sessions') as any)
      .select('status, current_mystery_id')
      .eq('id', sessionId)
      .single();
    
    const currentSession = currentSessionData as any;

    if (sessionCheckError) {
      log('error', 'Failed to check session status', { error: sessionCheckError.message });
      return NextResponse.json(
        { error: 'Failed to check session status' },
        { status: 500 }
      );
    }

    // If already playing with this mystery, assignments must exist - return success
    if (currentSession.status === 'playing' && currentSession.current_mystery_id === mysteryId) {
      log('info', 'Game already started with this mystery, returning success', { sessionId, mysteryId });
      
      const { count } = await supabase
        .from('player_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId)
        .eq('mystery_id', mysteryId);
      
      return NextResponse.json({
        success: true,
        assignmentCount: count || 0,
        alreadyDistributed: true,
      });
    }

    // Try to atomically update session to 'playing' status
    // This acts as a distributed lock - only one API call will succeed
    // We update if:
    // 1. Status is 'lobby' (first round)
    // 2. Status is 'playing' but current_mystery_id is different (next round)
    const { data: updatedSession, error: lockError } = await (supabase
      .from('game_sessions') as any)
      .update({ status: 'playing', current_mystery_id: mysteryId })
      .eq('id', sessionId)
      .or(`status.eq.lobby,current_mystery_id.neq.${mysteryId}`)
      .select()
      .single();

    // If update failed because status was already 'playing', another API call won
    if (lockError || !updatedSession) {
      log('info', 'Another request already started the game, checking assignments', { sessionId, mysteryId });
      
      // Wait a bit for the winning request to create assignments
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { count } = await supabase
        .from('player_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId)
        .eq('mystery_id', mysteryId);
      
      return NextResponse.json({
        success: true,
        assignmentCount: count || 0,
        alreadyDistributed: true,
      });
    }

    log('info', 'Acquired lock to distribute roles', { sessionId, mysteryId });

    // Get active and accused players (accused players rejoin as active for next round)
    const { data: playersData, error: playersError } = await (supabase
      .from('players') as any)
      .select('id, has_been_investigator, status')
      .eq('session_id', sessionId)
      .in('status', ['active', 'accused'])
      .order('created_at', { ascending: true });
    
    const players = playersData as any;

    if (playersError || !players) {
      log('error', 'Failed to fetch players', { error: playersError?.message });
      return NextResponse.json(
        { error: 'Failed to fetch players' },
        { status: 500 }
      );
    }

    // Reset accused players to active status for the new round
    const accusedPlayers = players.filter((p: any) => p.status === 'accused');
    if (accusedPlayers.length > 0) {
      const { error: updateError } = await (supabase
        .from('players') as any)
        .update({ status: 'active' })
        .in('id', accusedPlayers.map((p: any) => p.id));
      
      if (updateError) {
        log('warn', 'Failed to reset accused players status', { error: updateError.message });
      } else {
        log('info', `Reset ${accusedPlayers.length} accused players to active`);
      }
    }

    if (players.length < MIN_PLAYERS) {
      log('warn', `Not enough players to distribute roles: ${players.length}/${MIN_PLAYERS}`);
      return NextResponse.json(
        { error: `At least ${MIN_PLAYERS} players required` },
        { status: 400 }
      );
    }

    // Get character sheets for the mystery
    const { data: sheetsData, error: sheetsError } = await (supabase
      .from('character_sheets') as any)
      .select('*')
      .eq('mystery_id', mysteryId);
    
    const sheets = sheetsData as any;

    if (sheetsError || !sheets) {
      log('error', 'Failed to fetch character sheets', { error: sheetsError?.message });
      return NextResponse.json(
        { error: 'Failed to fetch character sheets' },
        { status: 500 }
      );
    }

    // Separate sheets by role
    const investigatorSheet = sheets.find((s: any) => s.role === 'investigator');
    const guiltySheet = sheets.find((s: any) => s.role === 'guilty');
    const innocentSheets = sheets.filter((s: any) => s.role === 'innocent');

    if (!investigatorSheet || !guiltySheet) {
      log('error', 'Mystery missing required roles', { mysteryId });
      return NextResponse.json(
        { error: 'Mystery is missing required roles' },
        { status: 400 }
      );
    }

    // Separate players - prioritize those who haven't been investigator
    const neverInvestigators = players.filter((p: any) => !p.has_been_investigator);
    const hasBeenInvestigators = players.filter((p: any) => p.has_been_investigator);
    
    // Select investigator: prioritize never-been-investigator, then pick randomly from rest
    const investigatorCandidates = neverInvestigators.length > 0 ? neverInvestigators : hasBeenInvestigators;
    const investigatorPlayer = investigatorCandidates[Math.floor(Math.random() * investigatorCandidates.length)];
    
    // Shuffle remaining players for guilty/innocent assignment
    const remainingPlayersForRoles = players
      .filter((p: any) => p.id !== investigatorPlayer.id)
      .sort(() => Math.random() - 0.5);

    // Assign investigator and guilty (always distributed)
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

    // Mark investigator as having been investigator
    const { error: updateInvestigatorError } = await (supabase
      .from('players') as any)
      .update({ has_been_investigator: true })
      .eq('id', investigatorPlayer.id);

    if (updateInvestigatorError) {
      log('warn', 'Failed to mark player as having been investigator', { error: updateInvestigatorError.message });
    }

    // Distribute innocent sheets to remaining players
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

    // Delete any existing assignments for this session and mystery (in case of retry/restart)
    // Delete for the specific mystery to avoid conflicts with multi-round games
    const { error: deleteError } = await supabase
      .from('player_assignments')
      .delete()
      .eq('session_id', sessionId)
      .eq('mystery_id', mysteryId);

    if (deleteError) {
      log('warn', 'Failed to clear old assignments', { error: deleteError.message });
    }

    // Insert assignments with upsert to handle any remaining edge cases
    const { error: assignError } = await (supabase
      .from('player_assignments') as any)
      .upsert(assignments, {
        onConflict: 'session_id,player_id,mystery_id',
        ignoreDuplicates: false
      });

    if (assignError) {
      log('error', 'Failed to create assignments', { error: assignError.message });
      return NextResponse.json(
        { error: 'Failed to distribute roles' },
        { status: 500 }
      );
    }

    log('info', 'Roles distributed successfully', {
      sessionId,
      mysteryId,
      playerCount: players.length,
      assignmentCount: assignments.length,
    });

    return NextResponse.json({
      success: true,
      assignmentCount: assignments.length,
    });
  } catch (error) {
    log('error', 'Unexpected error distributing roles', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
