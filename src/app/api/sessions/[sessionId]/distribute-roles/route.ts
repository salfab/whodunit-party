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

    // First, check current session state to implement idempotency
    const { data: currentSession, error: fetchError } = await (supabase
      .from('game_sessions') as any)
      .select('id, status, current_mystery_id')
      .eq('id', sessionId)
      .single();

    if (fetchError || !currentSession) {
      log('error', 'Failed to fetch session', { sessionId, error: fetchError?.message });
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if this mystery is already being played (idempotency check)
    if (currentSession.current_mystery_id === mysteryId && currentSession.status === 'playing') {
      log('info', 'Mystery already being played - skipping role distribution', { sessionId, mysteryId });
      return NextResponse.json(
        { success: true, note: 'Already playing this mystery' },
        { status: 200 }
      );
    }

    // Update session to 'playing' status with the new mystery
    const { data: updatedSession, error: lockError } = await (supabase
      .from('game_sessions') as any)
      .update({ 
        status: 'playing', 
        current_mystery_id: mysteryId,
        updated_at: new Date().toISOString() // Force update to trigger Realtime
      })
      .eq('id', sessionId)
      .select()
      .single();

    // If update failed, something went wrong
    if (lockError || !updatedSession) {
      log('error', 'Failed to update session', { sessionId, mysteryId, lockError: lockError?.message });
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500 }
      );
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
      .select('*, mysteries!inner(language)')
      .eq('mystery_id', mysteryId)
      .eq('mysteries.language', updatedSession.language);
    
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

    log('info', `Found sheets for mystery ${mysteryId}: 1 investigator, 1 guilty, ${innocentSheets.length} innocent`);

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
    
    log('info', `Selected investigator: ${investigatorPlayer.id}`);

    // Shuffle remaining players for guilty/innocent assignment
    const remainingPlayersForRoles = players
      .filter((p: any) => p.id !== investigatorPlayer.id)
      .sort(() => Math.random() - 0.5);

    log('info', `Assigning roles to ${remainingPlayersForRoles.length} remaining players`);

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

    // Insert assignments with upsert to handle race conditions
    log('info', `Inserting ${assignments.length} assignments`, { assignments });

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
