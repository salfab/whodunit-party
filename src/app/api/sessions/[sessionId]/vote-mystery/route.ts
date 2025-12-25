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
    const { data: roundsData, error: roundsError } = await (supabase
      .from('rounds') as any)
      .select('round_number')
      .eq('session_id', sessionId)
      .order('round_number', { ascending: false })
      .limit(1);
    
    const rounds = roundsData as any;

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
    const { error: voteError } = await (supabase
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

    if (voteError) {
      logger('error', 'Error upserting vote', { error: voteError });
      return NextResponse.json(
        { error: 'Erreur lors de l\'enregistrement du vote' },
        { status: 500 }
      );
    }

    logger('info', `Player ${session.playerId} voted for mystery ${mysteryId} in round ${nextRoundNumber}`);

    // Check if all active players have voted
    let nextRoundStarted = false;
    
    try {
      const { count: activePlayerCount, error: playerError } = await (supabase
        .from('players') as any)
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId)
        .in('status', ['active', 'accused']);

      const { count: voteCount, error: voteCountError } = await (supabase
        .from('mystery_votes') as any)
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId)
        .eq('round_number', nextRoundNumber);

      logger('info', `Vote check: ${voteCount}/${activePlayerCount} votes cast for round ${nextRoundNumber}`);

      if (
        !playerError && 
        !voteCountError && 
        activePlayerCount !== null && 
        voteCount !== null && 
        voteCount >= activePlayerCount
      ) {
        logger('info', `All ${activePlayerCount} players voted. Triggering next round.`);
        
        // Trigger next round
        const nextRoundUrl = new URL(`/api/sessions/${sessionId}/next-round`, request.url);
        logger('info', `Triggering next round via ${nextRoundUrl.toString()}`);
        
        const nextRoundResponse = await fetch(nextRoundUrl, {
          method: 'POST',
          headers: {
            // Forward cookies for authentication
            Cookie: request.headers.get('cookie') || '',
          }
        });
        
        if (nextRoundResponse.ok) {
          nextRoundStarted = true;
          logger('info', 'Next round triggered successfully');
        } else {
          const errorText = await nextRoundResponse.text();
          logger('error', 'Failed to trigger next round', { status: nextRoundResponse.status, body: errorText });
          // We don't throw here to ensure the vote is still counted as success
        }
      } else {
        logger('info', `Waiting for more votes. Current: ${voteCount}, Needed: ${activePlayerCount}`);
      }
    } catch (checkError) {
      logger('error', 'Error checking for next round trigger', { error: checkError });
      // Don't fail the vote if the check fails
    }

    return NextResponse.json({ success: true, roundNumber: nextRoundNumber, nextRoundStarted });
  } catch (error: any) {
    logger('error', 'Error in vote-mystery', { error });
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
