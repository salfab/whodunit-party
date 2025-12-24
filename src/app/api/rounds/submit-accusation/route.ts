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

    // Verify the current player is the investigator for this session
    const { data: assignment, error: assignmentError } = await supabase
      .from('player_assignments')
      .select(`
        *,
        character_sheets (role)
      `)
      .eq('session_id', session.sessionId)
      .eq('player_id', session.playerId)
      .single();

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
    const { data: accusedAssignment, error: accusedError } = await supabase
      .from('player_assignments')
      .select(`
        *,
        character_sheets (role)
      `)
      .eq('session_id', session.sessionId)
      .eq('player_id', accusedPlayerId)
      .single();

    if (accusedError || !accusedAssignment) {
      return NextResponse.json(
        { error: 'Accused player not found' },
        { status: 404 }
      );
    }

    const accusedSheet = accusedAssignment.character_sheets as any;
    const wasCorrect = accusedSheet.role === 'guilty';

    // Get current mystery ID
    const { data: gameSession } = await supabase
      .from('game_sessions')
      .select('current_mystery_id')
      .eq('id', session.sessionId)
      .single();

    if (!gameSession?.current_mystery_id) {
      return NextResponse.json(
        { error: 'No active mystery' },
        { status: 400 }
      );
    }

    // Create the round record
    const { data: round, error: roundError } = await supabase
      .from('rounds')
      .insert({
        session_id: session.sessionId,
        mystery_id: gameSession.current_mystery_id,
        investigator_player_id: session.playerId,
        accused_player_id: accusedPlayerId,
        was_correct: wasCorrect,
      })
      .select()
      .single();

    if (roundError) {
      log('error', 'Failed to create round', { error: roundError.message });
      return NextResponse.json(
        { error: 'Failed to submit accusation' },
        { status: 500 }
      );
    }

    // Update accused player status
    const { error: updateError } = await supabase
      .from('players')
      .update({ status: 'accused' })
      .eq('id', accusedPlayerId);

    if (updateError) {
      log('error', 'Failed to update player status', { error: updateError.message });
    }

    log('info', 'Accusation submitted', {
      sessionId: session.sessionId,
      investigatorId: session.playerId,
      accusedId: accusedPlayerId,
      wasCorrect,
    });

    return NextResponse.json({
      roundId: round.id,
      wasCorrect,
      accusedRole: accusedSheet.role,
    });
  } catch (error) {
    log('error', 'Unexpected error submitting accusation', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
