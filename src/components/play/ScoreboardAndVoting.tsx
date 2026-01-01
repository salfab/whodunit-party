'use client';

import { Box } from '@mui/material';
import { Scoreboard } from '@/components/play';
import { MysteryVotingList } from '@/components/shared/MysteryVotingList';

interface PlayerScore {
  id: string;
  name: string;
  score: number;
}

interface AvailableMystery {
  id: string;
  title: string;
  author?: string;
  character_count?: number;
  language?: string;
  cover_image_url?: string;
  image_path?: string;
}

interface ScoreboardAndVotingProps {
  /** Player scores to display */
  playerScores: PlayerScore[];
  /** Current player ID for highlighting */
  currentPlayerId?: string;
  /** Available mysteries to vote for */
  availableMysteries: AvailableMystery[];
  /** Current user's vote */
  myVote: string | null;
  /** Vote counts by mystery ID */
  voteCounts: Record<string, number>;
  /** Whether user has voted */
  hasVoted?: boolean;
  /** Whether next round is starting */
  startingNextRound?: boolean;
  /** Callback when voting */
  onVote: (mysteryId: string | null) => void;
  /** Whether to allow unvoting */
  allowUnvote?: boolean;
  /** Whether mysteries are loading */
  loading?: boolean;
}

export default function ScoreboardAndVoting({
  playerScores,
  currentPlayerId,
  availableMysteries,
  myVote,
  voteCounts,
  hasVoted = false,
  startingNextRound = false,
  onVote,
  allowUnvote = true,
  loading = false,
}: ScoreboardAndVotingProps) {
  return (
    <Box sx={{ mt: 4 }}>
      <Scoreboard
        playerScores={playerScores}
        currentPlayerId={currentPlayerId}
      />

      <MysteryVotingList
        availableMysteries={availableMysteries}
        myVote={myVote}
        voteCounts={voteCounts}
        hasVoted={hasVoted}
        startingNextRound={startingNextRound}
        onVote={onVote}
        allowUnvote={allowUnvote}
        showTitle={true}
        loading={loading}
      />
    </Box>
  );
}
