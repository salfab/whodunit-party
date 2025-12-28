import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { validateSession } from '@/lib/auth';
import { createLogger } from '@/lib/logging';

const log = createLogger('api.rounds.submit-accusation');

interface AccusationBody {
  accusedPlayerId: string;
}

/**
 * POST /api/rounds/submit-accusation
 * Investigator accuses a player
 */
export async function POST(request: NextRequest) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body: AccusationBody = await request.json();
    const { accusedPlayerId } = body;

    if (!accusedPlayerId) {
      return NextResponse.json(
        { error: 'Accused player ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Get current mystery ID first
    const { data: gameSessionData } = await (supabase
      .from('game_sessions') as any)
      .select('current_mystery_id')
      .eq('id', session.sessionId)
      .single();
    
    const gameSession = gameSessionData as any;

    if (!gameSession?.current_mystery_id) {
      return NextResponse.json(
        { error: 'No active mystery' },
        { status: 400 }
      );
    }

    // Verify the current player is the investigator for this session
    const { data: assignmentData, error: assignmentError } = await (supabase
      .from('player_assignments') as any)
      .select(`
        *,
        character_sheets (role)
      `)
      .eq('session_id', session.sessionId)
      .eq('player_id', session.playerId)
      .eq('mystery_id', gameSession.current_mystery_id)
      .single();
    
    const assignment = assignmentData as any;

    if (assignmentError || !assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    const characterSheet = assignment.character_sheets as any;
    if (characterSheet.role !== 'investigator') {
      return NextResponse.json(
        { error: 'Only the investigator can make accusations' },
        { status: 403 }
      );
    }

    // Get the accused player's assignment to check their role
    const { data: accusedAssignmentData, error: accusedError } = await (supabase
      .from('player_assignments') as any)
      .select(`
        *,
        character_sheets (role)
      `)
      .eq('session_id', session.sessionId)
      .eq('player_id', accusedPlayerId)
      .eq('mystery_id', gameSession.current_mystery_id)
      .single();
    
    const accusedAssignment = accusedAssignmentData as any;

    if (accusedError || !accusedAssignment) {
      return NextResponse.json(
        { error: 'Accused player not found' },
        { status: 404 }
      );
    }

    const accusedSheet = accusedAssignment.character_sheets as any;
    const wasCorrect = accusedSheet.role === 'guilty';

    // Get current round number for this session
    const { data: existingRoundsData } = await (supabase
      .from('rounds') as any)
      .select('round_number')
      .eq('session_id', session.sessionId)
      .order('round_number', { ascending: false })
      .limit(1);
    
    const existingRounds = existingRoundsData as any;

    const roundNumber = existingRounds && existingRounds.length > 0 
      ? (existingRounds[0].round_number || 0) + 1 
      : 1;

    // Create the round record
    const { data: roundData, error: roundError } = await (supabase
      .from('rounds') as any)
      .insert({
        session_id: session.sessionId,
        mystery_id: gameSession.current_mystery_id,
        investigator_player_id: session.playerId,
        accused_player_id: accusedPlayerId,
        was_correct: wasCorrect,
        round_number: roundNumber,
      })
      .select()
      .single();
    
    const round = roundData as any;

    if (roundError) {
      log('error', 'Failed to create round', { error: roundError.message });
      return NextResponse.json(
        { error: 'Failed to submit accusation' },
        { status: 500 }
      );
    }

    // Calculate and update scores
    const scoreUpdates: Array<{ id: string; increment: number }> = [];

    if (wasCorrect) {
      // Investigator found guilty: +2 points to investigator
      scoreUpdates.push({ id: session.playerId, increment: 2 });
    } else {
      // Investigator accused innocent: +1 point to wrongly accused innocent
      scoreUpdates.push({ id: accusedPlayerId, increment: 1 });
      
      // Find the guilty player and give them +2 points for escaping
      const { data: guiltyAssignmentData } = await (supabase
        .from('player_assignments') as any)
        .select(`
          player_id,
          character_sheets (role)
        `)
        .eq('session_id', session.sessionId)
        .eq('mystery_id', gameSession.current_mystery_id);
      
      const guiltyAssignment = guiltyAssignmentData as any;

      const guiltyPlayer = guiltyAssignment?.find((a: any) => 
        a.character_sheets?.role === 'guilty'
      );

      if (guiltyPlayer) {
        scoreUpdates.push({ id: guiltyPlayer.player_id, increment: 2 });
      }
    }

    // Apply score updates
    for (const update of scoreUpdates) {
      // Use direct update since increment_player_score RPC doesn't exist
      const { data: playerData } = await (supabase
        .from('players') as any)
        .select('score')
        .eq('id', update.id)
        .single();
      
      const player = playerData as any;

      await (supabase
        .from('players') as any)
        .update({ score: (player?.score || 0) + update.increment })
        .eq('id', update.id);
    }

    // Check if all active players have been investigator
    const { data: activePlayersData } = await (supabase
      .from('players') as any)
      .select('id, has_been_investigator')
      .eq('session_id', session.sessionId)
      .eq('status', 'active');
    
    const activePlayers = activePlayersData as any;

    const allHaveBeenInvestigator = activePlayers?.every((p: any) => p.has_been_investigator) || false;

    if (allHaveBeenInvestigator) {
      // Game is complete!
      await (supabase
        .from('game_sessions') as any)
        .update({ status: 'completed' })
        .eq('id', session.sessionId);
    }

    // Generate role-specific messages in French
    const investigatorMessage = wasCorrect 
      ? 'Bravo ! Vous avez trouvé le coupable ! +2 points'
      : 'Erreur ! Vous avez accusé une personne innocente.';
    
    const guiltyMessage = wasCorrect
      ? 'Vous avez été découvert par l\'enquêteur.'
      : 'Le coupable n\'a pas été attrapé ! +2 points';
    
    const innocentMessage = wasCorrect
      ? 'L\'enquêteur a trouvé le coupable.'
      : (accusedSheet.role === 'innocent' && accusedPlayerId === accusedPlayerId
          ? 'Vous êtes innocent et avez été accusé à tort ! +1 point'
          : 'L\'enquêteur s\'est trompé.');

    log('info', 'Accusation submitted', {
      sessionId: session.sessionId,
      investigatorId: session.playerId,
      accusedId: accusedPlayerId,
      wasCorrect,
      gameComplete: allHaveBeenInvestigator,
      roundNumber,
    });

    return NextResponse.json({
      roundId: round.id,
      wasCorrect,
      accusedRole: accusedSheet.role,
      gameComplete: allHaveBeenInvestigator,
      messages: {
        investigator: investigatorMessage,
        guilty: guiltyMessage,
        innocent: innocentMessage,
      },
    });
  } catch (error) {
    log('error', 'Unexpected error submitting accusation', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
