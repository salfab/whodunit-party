import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logging';

const logger = createLogger('api:tally-votes');

/**
 * GET /api/sessions/[sessionId]/tally-votes
 * Count votes for the next round and determine winning mystery
 * Excludes mysteries already played in this session
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

    // Get current round number
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

    // Next round number
    const nextRoundNumber = rounds?.[0]?.round_number ? rounds[0].round_number + 1 : 1;

    // Get all mysteries already played in this session
    const { data: playedRoundsData, error: playedError } = await (supabase
      .from('rounds') as any)
      .select('mystery_id')
      .eq('session_id', sessionId);
    
    const playedRounds = playedRoundsData as any;

    if (playedError) {
      logger('error', 'Error fetching played mysteries', { error: playedError });
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des mystères joués' },
        { status: 500 }
      );
    }

    const playedMysteryIds = new Set(playedRounds?.map((r: any) => r.mystery_id) || []);

    // Get all votes for the next round
    const { data: votesData, error: votesError } = await (supabase
      .from('mystery_votes') as any)
      .select('mystery_id')
      .eq('session_id', sessionId)
      .eq('round_number', nextRoundNumber);
    
    const votes = votesData as any;

    if (votesError) {
      logger('error', 'Error fetching votes', { error: votesError });
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des votes' },
        { status: 500 }
      );
    }

    if (!votes || votes.length === 0) {
      return NextResponse.json({
        voteCounts: {},
        winningMysteryId: null,
        totalVotes: 0,
        roundNumber: nextRoundNumber,
      });
    }

    // Filter out votes for already-played mysteries
    const validVotes = votes.filter((vote: any) => !playedMysteryIds.has(vote.mystery_id));

    // Count votes per mystery
    const voteCounts: Record<string, number> = {};
    validVotes.forEach((vote: any) => {
      voteCounts[vote.mystery_id] = (voteCounts[vote.mystery_id] || 0) + 1;
    });

    // Find the mystery with the most votes
    let winningMysteryId: string | null = null;
    let maxVotes = 0;

    Object.entries(voteCounts).forEach(([mysteryId, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        winningMysteryId = mysteryId;
      }
    });

    // If there's a tie, pick randomly among the tied mysteries
    if (maxVotes > 0) {
      const tiedMysteries = Object.entries(voteCounts)
        .filter(([, count]) => count === maxVotes)
        .map(([mysteryId]) => mysteryId);

      if (tiedMysteries.length > 1) {
        winningMysteryId = tiedMysteries[Math.floor(Math.random() * tiedMysteries.length)];
        logger('info', `Tie detected among ${tiedMysteries.length} mysteries, randomly selected: ${winningMysteryId}`);
      }
    }

    logger('info', `Vote tally for session ${sessionId}, round ${nextRoundNumber}`, { voteCounts });
    logger('info', `Winning mystery: ${winningMysteryId} with ${maxVotes} votes`);

    return NextResponse.json({
      voteCounts,
      winningMysteryId,
      totalVotes: validVotes.length,
      roundNumber: nextRoundNumber,
    });
  } catch (error: any) {
    logger('error', 'Error in tally-votes', { error });
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
