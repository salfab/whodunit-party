import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logging';

const logger = createLogger('api:vote-mystery');

/**
 * POST /api/sessions/[sessionId]/vote-mystery
 * Submit or update a player's vote for the next mystery
 */
export async function POST(
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

    const { mysteryId } = await request.json();

    if (!mysteryId) {
      return NextResponse.json(
        { error: 'mysteryId est requis' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Get current round number for this session
    const { data: rounds, error: roundsError } = await supabase
      .from('rounds')
      .select('round_number')
      .eq('session_id', sessionId)
      .order('round_number', { ascending: false })
      .limit(1);

    if (roundsError) {
      logger('error', 'Error fetching current round', { error: roundsError });
      return NextResponse.json(
        { error: 'Erreur lors de la récupération du tour actuel' },
        { status: 500 }
      );
    }

    // Next round number is current + 1, or 1 if no rounds yet
    const nextRoundNumber = rounds?.[0]?.round_number ? rounds[0].round_number + 1 : 1;

    // Upsert the vote (update if exists, insert if not)
    const { error: voteError } = await supabase
      .from('mystery_votes')
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

    if (voteError) {
      logger('error', 'Error upserting vote', { error: voteError });
      return NextResponse.json(
        { error: 'Erreur lors de l\'enregistrement du vote' },
        { status: 500 }
      );
    }

    logger('info', `Player ${session.playerId} voted for mystery ${mysteryId} in round ${nextRoundNumber}`);

    return NextResponse.json({ success: true, roundNumber: nextRoundNumber });
  } catch (error: any) {
    logger('error', 'Error in vote-mystery', { error });
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
