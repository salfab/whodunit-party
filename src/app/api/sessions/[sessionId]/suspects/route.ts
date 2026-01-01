import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { validateSession } from '@/lib/auth';
import { createLogger } from '@/lib/logging';

const log = createLogger('api.sessions.suspects');

export interface SuspectInfo {
  id: string;
  playerName: string;
  characterName: string;
  occupation?: string | null;
  imagePath?: string | null;
}

/**
 * GET /api/sessions/[sessionId]/suspects
 * Returns all suspects for the current mystery (excluding the investigator)
 * Does NOT include role information to prevent cheating
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const session = await validateSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (session.sessionId !== sessionId) {
      return NextResponse.json(
        { error: 'Session mismatch' },
        { status: 403 }
      );
    }

    const supabase = await createServiceClient();

    // Get current mystery for the session
    const { data: gameSession, error: sessionError } = await supabase
      .from('game_sessions')
      .select('current_mystery_id')
      .eq('id', sessionId)
      .single();

    if (sessionError || !gameSession?.current_mystery_id) {
      log('error', 'Failed to get current mystery', { error: sessionError?.message });
      return NextResponse.json(
        { error: 'No active mystery' },
        { status: 404 }
      );
    }

    const mysteryId = gameSession.current_mystery_id;

    // Verify the requesting player is the investigator
    const { data: playerAssignment, error: assignmentError } = await (supabase
      .from('player_assignments') as any)
      .select(`
        player_id,
        character_sheets!inner(role)
      `)
      .eq('session_id', sessionId)
      .eq('player_id', session.playerId)
      .eq('mystery_id', mysteryId)
      .single();

    if (assignmentError || !playerAssignment) {
      log('error', 'Failed to verify player assignment', { error: assignmentError?.message });
      return NextResponse.json(
        { error: 'Not assigned to this mystery' },
        { status: 403 }
      );
    }

    // Only investigators can see suspect list with descriptions
    if (playerAssignment.character_sheets?.role !== 'investigator') {
      return NextResponse.json(
        { error: 'Only investigators can view suspect details' },
        { status: 403 }
      );
    }

    // Get all player assignments for this mystery (excluding investigator)
    const { data: assignments, error: assignmentsError } = await (supabase
      .from('player_assignments') as any)
      .select(`
        player_id,
        players!inner(id, name),
        character_sheets!inner(
          character_name,
          occupation,
          image_path,
          role
        )
      `)
      .eq('session_id', sessionId)
      .eq('mystery_id', mysteryId)
      .neq('player_id', session.playerId); // Exclude the investigator

    if (assignmentsError) {
      log('error', 'Failed to fetch suspects', { error: assignmentsError.message });
      return NextResponse.json(
        { error: 'Failed to fetch suspects' },
        { status: 500 }
      );
    }

    // Format response - IMPORTANT: Do NOT include role
    const suspects: SuspectInfo[] = (assignments || [])
      .filter((a: any) => a.character_sheets?.role !== 'investigator')
      .map((a: any) => ({
        id: a.player_id,
        playerName: a.players?.name || 'Unknown',
        characterName: a.character_sheets?.character_name || 'Unknown',
        occupation: a.character_sheets?.occupation,
        imagePath: a.character_sheets?.image_path,
      }));

    log('info', `Returning ${suspects.length} suspects for session ${sessionId}`);

    return NextResponse.json({ suspects });
  } catch (error) {
    log('error', 'Unexpected error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
