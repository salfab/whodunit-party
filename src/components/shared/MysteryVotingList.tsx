'use client';

import { Box, Typography, List, Paper, CircularProgress } from '@mui/material';
import MysteryCard from '@/components/shared/MysteryCard';

interface Mystery {
  id: string;
  title: string;
  synopsis?: string;
  author?: string;
  character_count?: number;
  language?: string;
  cover_image_url?: string;
  image_path?: string; // Database field name
}

interface MysteryVotingListProps {
  /** All mysteries (used for empty state detection in lobby) */
  mysteries?: Mystery[];
  /** Mysteries available to vote for */
  availableMysteries: Mystery[];
  /** Vote map (playerId -> mysteryId) - used in lobby mode */
  votes?: Map<string, string>;
  /** Vote counts by mystery ID - used in play mode */
  voteCounts?: Record<string, number>;
  /** Current user's vote */
  myVote: string | null;
  /** Callback when voting. Pass null to support unvoting (lobby mode) */
  onVote: (mysteryId: string | null) => void;
  /** Whether language is set (for empty state) */
  hasLanguage?: boolean;
  /** Whether user has already voted (play mode - hides list after voting) */
  hasVoted?: boolean;
  /** Whether next round is starting (play mode - shows spinner) */
  startingNextRound?: boolean;
  /** Whether to allow unvoting by re-tapping (default: true for lobby, false for play) */
  allowUnvote?: boolean;
  /** Title to show above the voting list */
  title?: string;
  /** Whether to show the title */
  showTitle?: boolean;
}

export function MysteryVotingList({ 
  mysteries = [],
  availableMysteries, 
  votes,
  voteCounts = {},
  myVote, 
  onVote,
  hasLanguage = true,
  hasVoted = false,
  startingNextRound = false,
  allowUnvote = true,
  title = '🎭 Votez pour le prochain mystère',
  showTitle = false,
}: MysteryVotingListProps) {
  // Find the voted mystery to show its image
  const votedMystery = myVote ? availableMysteries.find(m => m.id === myVote) : null;
  
  // Calculate vote count for a mystery
  const getVoteCount = (mysteryId: string): number => {
    if (votes) {
      return Array.from(votes.values()).filter(v => v === mysteryId).length;
    }
    return voteCounts[mysteryId] || 0;
  };

  // Show empty state when no mysteries exist for the language
  if (mysteries.length === 0 && hasLanguage && availableMysteries.length === 0) {
    return (
      <Box 
        sx={{ 
          textAlign: 'center', 
          py: 6, 
          px: 3, 
          mb: 3,
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: 2,
          bgcolor: 'background.paper'
        }}
      >
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Aucun mystère disponible
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Aucun mystère n'a été trouvé pour la langue sélectionnée.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Essayez de changer la langue.
        </Typography>
      </Box>
    );
  }

  if (availableMysteries.length === 0) {
    return null;
  }

  // Play mode: After voting, show confirmation with mystery image
  if (hasVoted && myVote) {
    return (
      <Box sx={{ mt: 4 }}>
        {showTitle && (
          <Typography variant="h5" gutterBottom align="center">
            {title}
          </Typography>
        )}
        {votedMystery && (votedMystery.cover_image_url || votedMystery.image_path) && (
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
            <Box
              component="img"
              src={votedMystery.cover_image_url || votedMystery.image_path}
              alt={votedMystery.title}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                maxWidth: '100%',
                maxHeight: '300px',
                borderRadius: 2,
                objectFit: 'contain',
              }}
            />
          </Box>
        )}
        <Paper elevation={2} sx={{ p: 3 }}>
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
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 3, mt: showTitle ? 4 : 0 }}>
      {showTitle && (
        <Typography variant="h5" gutterBottom align="center">
          {title}
        </Typography>
      )}
      
      {/* Show voted mystery image prominently (lobby mode with allowUnvote) */}
      {allowUnvote && votedMystery && (
        <Paper elevation={2} sx={{ p: 2, mb: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            ✅ Vous avez voté pour :
          </Typography>
          {(votedMystery.cover_image_url || votedMystery.image_path) && (
            <Box
              component="img"
              src={votedMystery.cover_image_url || votedMystery.image_path}
              alt={votedMystery.title}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                maxWidth: '100%',
                maxHeight: '250px',
                borderRadius: 2,
                objectFit: 'contain',
                mb: 1,
              }}
            />
          )}
          <Typography variant="subtitle1" fontWeight="bold">
            {votedMystery.title}
          </Typography>
        </Paper>
      )}

      {/* Mystery list */}
      <List>
        {availableMysteries.map((mystery) => {
          const voteCount = getVoteCount(mystery.id);
          const isSelected = myVote === mystery.id;
          
          return (
            <MysteryCard
              key={mystery.id}
              mystery={mystery}
              selected={isSelected}
              voteCount={voteCount}
              showRadio={!allowUnvote}
              onClick={() => {
                if (allowUnvote) {
                  onVote(isSelected ? null : mystery.id);
                } else {
                  onVote(mystery.id);
                }
              }}
            />
          );
        })}
      </List>
    </Box>
  );
}
