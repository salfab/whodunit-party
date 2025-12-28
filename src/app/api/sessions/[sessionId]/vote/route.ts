
import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logging';

const log = createLogger('api.sessions.vote');

/**
 * POST /api/sessions/[sessionId]/vote
 * Vote for a mystery
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const { mysteryId } = await request.json();

    // Validate session
    const session = await validateSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const supabase = await createServiceClient();

    // Get current round number
    const { data: rounds } = await (supabase
      .from('rounds') as any)
      .select('round_number')
      .eq('session_id', sessionId)
      .order('round_number', { ascending: false })
      .limit(1);
    
    const nextRoundNumber = (rounds && rounds.length > 0) ? rounds[0].round_number + 1 : 1;

    // If mysteryId is null, delete the vote (unvote)
    if (mysteryId === null) {
      const { error } = await (supabase
        .from('mystery_votes') as any)
        .delete()
        .eq('session_id', sessionId)
        .eq('player_id', session.playerId)
        .eq('round_number', nextRoundNumber);

      if (error) {
        log('error', 'Failed to delete vote', { error: error.message });
        return NextResponse.json(
          { error: 'Failed to delete vote' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, action: 'deleted' });
    }

    // Upsert vote
    const { error } = await (supabase
      .from('mystery_votes') as any)
      .upsert(
        {
          session_id: sessionId,
          player_id: session.playerId,
          mystery_id: mysteryId,
          round_number: nextRoundNumber,
        },
        {
          onConflict: 'session_id,player_id,round_number',
        }
      );

    if (error) {
      log('error', 'Failed to submit vote', { error: error.message });
      return NextResponse.json(
        { error: 'Failed to submit vote' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    log('error', 'Unexpected error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
