import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logging';

const logger = createLogger('api:next-round');

/**
 * POST /api/sessions/[sessionId]/next-round
 * Start the next round with the winning mystery from votes
 * Clears votes, distributes new roles, preserves scores and investigator history
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

    const supabase = await createServiceClient();

    // Tally votes to get winning mystery
    const tallyResponse = await fetch(
      `${request.nextUrl.origin}/api/sessions/${sessionId}/tally-votes`,
      {
        headers: {
          Cookie: request.headers.get('cookie') || '',
        },
      }
    );

    if (!tallyResponse.ok) {
      throw new Error('Erreur lors du comptage des votes');
    }

    const { winningMysteryId, roundNumber } = await tallyResponse.json();

    if (!winningMysteryId) {
      return NextResponse.json(
        { error: 'Aucun vote enregistré ou aucun mystère disponible' },
        { status: 400 }
      );
    }

    // Reset all players to active status (clear 'accused' status from previous round)
    const { error: resetError } = await supabase
      .from('players')
      .update({ status: 'active' })
      .eq('session_id', sessionId)
      .in('status', ['active', 'accused']);

    if (resetError) {
      logger('error', 'Error resetting player statuses', { error: resetError });
      return NextResponse.json(
        { error: 'Erreur lors de la réinitialisation des statuts' },
        { status: 500 }
      );
    }

    // Distribute roles for the new mystery
    const distributeResponse = await fetch(
      `${request.nextUrl.origin}/api/sessions/${sessionId}/distribute-roles`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: request.headers.get('cookie') || '',
        },
        body: JSON.stringify({ mysteryId: winningMysteryId }),
      }
    );

    if (!distributeResponse.ok) {
      const errorData = await distributeResponse.json();
      throw new Error(errorData.error || 'Erreur lors de la distribution des rôles');
    }

    // Clear votes for the current round (they've been tallied and used)
    const { error: clearVotesError } = await supabase
      .from('mystery_votes')
      .delete()
      .eq('session_id', sessionId)
      .eq('round_number', roundNumber);

    if (clearVotesError) {
      logger('warn', 'Error clearing votes (non-critical)', { error: clearVotesError });
      // Don't fail the request if vote clearing fails
    }

    logger('info', `Started next round for session ${sessionId} with mystery ${winningMysteryId}`);

    return NextResponse.json({
      success: true,
      mysteryId: winningMysteryId,
      roundNumber,
    });
  } catch (error: any) {
    logger('error', 'Error in next-round', { error });
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
