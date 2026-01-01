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

    logger('info', `Received next-round request for session ${sessionId}`);

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
    // Note: This is idempotent - it just counts whatever votes exist at this moment
    let tallyResponse;
    try {
      tallyResponse = await fetch(
        `${request.nextUrl.origin}/api/sessions/${sessionId}/tally-votes`,
        {
          headers: {
            Cookie: request.headers.get('cookie') || '',
          },
        }
      );

      if (!tallyResponse.ok) {
        const errorText = await tallyResponse.text();
        logger('error', 'Failed to tally votes', { status: tallyResponse.status, body: errorText });
        throw new Error('Erreur lors du comptage des votes');
      }
    } catch (error: any) {
      logger('error', 'Exception while tallying votes', { error: error.message });
      throw new Error('Erreur lors du comptage des votes');
    }

    const { winningMysteryId, roundNumber, totalVotes } = await tallyResponse.json();

    if (!winningMysteryId) {
      logger('info', 'No winning mystery (possibly votes changed)', { totalVotes, roundNumber });
      return NextResponse.json(
        { error: 'Aucun vote enregistré ou aucun mystère disponible' },
        { status: 400 }
      );
    }

    logger('info', `Attempting to start round ${roundNumber} with mystery ${winningMysteryId} (${totalVotes} votes)`);

    // Distribute roles for the new mystery
    // Note: distribute-roles has atomic lock - only one call will succeed
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
      const errorText = await distributeResponse.text();
      logger('error', 'Failed to distribute roles', { status: distributeResponse.status, body: errorText });
      
      // If we got an error, check if it's because another call already won the lock
      // In that case, we still consider this a success (the round is starting/started)
      const responseData = await distributeResponse.json().catch(() => ({}));
      if (responseData.note === 'Already processing') {
        logger('info', 'Another request already processing distribute-roles - this is expected');
        return NextResponse.json({
          success: true,
          mysteryId: winningMysteryId,
          roundNumber,
          note: 'Round already being started by another request',
        });
      }
      
      throw new Error(`Erreur lors de la distribution des rôles: ${errorText}`);
    }

    // We do NOT clear votes here anymore.
    // 1. We have round_number in mystery_votes, so old votes don't interfere with new rounds.
    // 2. Clearing votes triggers a realtime event that causes the client to fetch tally-votes and see 0 votes,
    //    which is confusing if the client hasn't transitioned to the next screen yet.
    // 3. Keeping history is generally good.
    
    /* 
    const { error: clearVotesError } = await (supabase
      .from('mystery_votes') as any)
      .delete()
      .eq('session_id', sessionId)
      .eq('round_number', roundNumber);

    if (clearVotesError) {
      logger('warn', 'Error clearing votes (non-critical)', { error: clearVotesError });
    }
    */

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
