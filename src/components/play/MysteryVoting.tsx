'use client';

import { Box, Typography, Paper, List, CircularProgress } from '@mui/material';
import MysteryCard from '@/components/shared/MysteryCard';

interface AvailableMystery {
  id: string;
  title: string;
}

interface MysteryVotingProps {
  availableMysteries: AvailableMystery[];
  selectedMystery: string;
  voteCounts: Record<string, number>;
  hasVoted: boolean;
  startingNextRound: boolean;
  onVote: (mysteryId: string) => void;
}

export default function MysteryVoting({
  availableMysteries,
  selectedMystery,
  voteCounts,
  hasVoted,
  startingNextRound,
  onVote,
}: MysteryVotingProps) {
  if (availableMysteries.length === 0) return null;

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom align="center">
        🎭 Votez pour le prochain mystère
      </Typography>
      <Paper elevation={2} sx={{ p: 3 }}>
        {!hasVoted ? (
          <List>
            {availableMysteries.map((mystery) => (
              <MysteryCard
                key={mystery.id}
                mystery={mystery}
                selected={selectedMystery === mystery.id}
                voteCount={voteCounts[mystery.id] || 0}
                showRadio={true}
                onClick={() => onVote(mystery.id)}
              />
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body1" gutterBottom>
              ✅ Vote enregistré !
            </Typography>
            <Typography variant="body2" color="text.secondary">
              En attente des autres joueurs...
            </Typography>
            {startingNextRound && (
              <Box sx={{ mt: 3 }}>
                <CircularProgress />
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Démarrage du prochain tour...
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
}
