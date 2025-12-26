'use client';

import { Box, Typography, Chip } from '@mui/material';

interface WordsToPlaceProps {
  words: string[];
}

export default function WordsToPlace({ words }: WordsToPlaceProps) {
  if (words.length === 0) return null;

  return (
    <Box sx={{ mb: 4 }} data-testid="play-words-section">
      <Typography 
        variant="h6" 
        gutterBottom
        sx={{ 
          color: 'text.primary',
          fontWeight: 600,
          textShadow: '0 1px 3px rgba(0,0,0,0.5)'
        }}
      >
        💬 Trois mots à placer dans la conversation
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }} data-testid="play-words-list">
        {words.map((word, index) => (
          <Chip
            key={index}
            label={word}
            variant="outlined"
            sx={{ 
              fontSize: '1.1rem',
              px: 2,
              py: 3,
              fontWeight: 600,
              borderWidth: '2px',
              '& .MuiChip-label': {
                color: 'text.primary',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)'
              }
            }}
            data-testid={`play-word-${index}`}
          />
        ))}
      </Box>
    </Box>
  );
}
