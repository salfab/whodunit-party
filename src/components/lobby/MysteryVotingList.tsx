'use client';

import { Box, Typography, List, Paper } from '@mui/material';
import MysteryCard from '@/components/shared/MysteryCard';

interface Mystery {
  id: string;
  title: string;
  author?: string;
  character_count?: number;
  language?: string;
  cover_image_url?: string;
  image_path?: string; // Database field name
}

interface MysteryVotingListProps {
  mysteries: Mystery[];
  availableMysteries: Mystery[];
  votes: Map<string, string>;
  myVote: string | null;
  onVote: (mysteryId: string) => void;
  hasLanguage: boolean;
}

export function MysteryVotingList({ 
  mysteries, 
  availableMysteries, 
  votes, 
  myVote, 
  onVote,
  hasLanguage 
}: MysteryVotingListProps) {
  // Find the voted mystery to show its image
  const votedMystery = myVote ? availableMysteries.find(m => m.id === myVote) : null;
  // Show empty state when no mysteries exist for the language
  if (mysteries.length === 0 && hasLanguage) {
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

  return (
    <Box sx={{ mb: 3 }}>
      {/* Show voted mystery image prominently */}
      {votedMystery && (votedMystery.cover_image_url || votedMystery.image_path) && (
        <Paper elevation={2} sx={{ p: 2, mb: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            ✅ Vous avez voté pour :
          </Typography>
          <Box
            component="img"
            src={votedMystery.cover_image_url || votedMystery.image_path}
            alt={votedMystery.title}
            sx={{
              maxWidth: '100%',
              maxHeight: '250px',
              borderRadius: 2,
              objectFit: 'contain',
              mb: 1,
            }}
          />
          <Typography variant="subtitle1" fontWeight="bold">
            {votedMystery.title}
          </Typography>
        </Paper>
      )}

      {/* Mystery list - always show to allow changing vote */}
      <List>
        {availableMysteries.map((mystery) => {
          const voteCount = Array.from(votes.values()).filter(v => v === mystery.id).length;
          const isSelected = myVote === mystery.id;
          
          return (
            <MysteryCard
              key={mystery.id}
              mystery={mystery}
              selected={isSelected}
              voteCount={voteCount}
              onClick={() => onVote(mystery.id)}
            />
          );
        })}
      </List>
    </Box>
  );
}
