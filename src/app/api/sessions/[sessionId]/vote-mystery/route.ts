import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logging';
import { MIN_PLAYERS } from '@/lib/constants';

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

    // Handle unvoting (mysteryId is null or undefined)
    if (!mysteryId) {
      const { error: deleteError } = await (supabase
        .from('mystery_votes') as any)
        .delete()
        .eq('session_id', sessionId)
        .eq('player_id', session.playerId)
        .eq('round_number', nextRoundNumber);

      if (deleteError) {
        logger('error', 'Error deleting vote', { error: deleteError });
        return NextResponse.json(
          { error: 'Erreur lors de la suppression du vote' },
          { status: 500 }
        );
      }

      logger('info', `Player ${session.playerId} unvoted for round ${nextRoundNumber}`);
      return NextResponse.json({ success: true, action: 'unvoted', roundNumber: nextRoundNumber });
    }

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
      const { data: activePlayers, count: activePlayerCount, error: playerError } = await (supabase
        .from('players') as any)
        .select('id, name, status', { count: 'exact' })
        .eq('session_id', sessionId)
        .in('status', ['active', 'accused']);

      const { data: voteData, count: voteCount, error: voteCountError } = await (supabase
        .from('mystery_votes') as any)
        .select('player_id', { count: 'exact' })
        .eq('session_id', sessionId)
        .eq('round_number', nextRoundNumber);

      logger('info', `Vote check: ${voteCount}/${activePlayerCount} votes cast for round ${nextRoundNumber}`);
      logger('info', `Active players: ${JSON.stringify(activePlayers)}`);
      logger('info', `Votes: ${JSON.stringify(voteData)}`);
      
      // Additional debugging: check for mismatches
      if (activePlayers && voteData) {
        const activePlayerIds = new Set(activePlayers.map((p: any) => p.id));
        const votedPlayerIds = new Set(voteData.map((v: any) => v.player_id));
        const notVoted = activePlayers.filter((p: any) => !votedPlayerIds.has(p.id));
        const extraVotes = voteData.filter((v: any) => !activePlayerIds.has(v.player_id));
        
        if (notVoted.length > 0) {
          logger('warn', `Players who haven't voted yet: ${JSON.stringify(notVoted)}`);
        }
        if (extraVotes.length > 0) {
          logger('warn', `Votes from non-active players: ${JSON.stringify(extraVotes)}`);
        }
      }

      if (
        !playerError && 
        !voteCountError && 
        activePlayerCount !== null && 
        voteCount !== null && 
        activePlayerCount >= MIN_PLAYERS &&
        voteCount >= activePlayerCount
      ) {
        logger('info', `All ${activePlayerCount} players voted. Triggering next round.`);
        
        // Note: Multiple concurrent votes may reach this point simultaneously
        // This is expected - next-round and distribute-roles have protection
        // against race conditions, so multiple calls are handled gracefully
        
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
          const responseData = await nextRoundResponse.json();
          if (responseData.note) {
            logger('info', 'Next round trigger result', { note: responseData.note });
          } else {
            logger('info', 'Next round triggered successfully');
          }
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
