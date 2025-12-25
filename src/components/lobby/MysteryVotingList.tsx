'use client';

import { Box, Typography, List } from '@mui/material';
import MysteryCard from '@/components/shared/MysteryCard';

interface Mystery {
  id: string;
  title: string;
  author?: string;
  character_count?: number;
  language?: string;
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
    <List sx={{ mb: 3 }}>
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
  );
}
