'use client';

import { Box, Typography, Chip } from '@mui/material';

interface WordsToPlaceProps {
  words: string[];
}

export default function WordsToPlace({ words }: WordsToPlaceProps) {
  if (words.length === 0) return null;

  return (
    <Box sx={{ mb: 4 }} data-testid="play-words-section">
      <Typography variant="h6" gutterBottom>
        💬 Trois mots à placer dans la conversation
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }} data-testid="play-words-list">
        {words.map((word, index) => (
          <Chip
            key={index}
            label={word}
            variant="outlined"
            sx={{ fontSize: '1rem', px: 2, py: 3 }}
            data-testid={`play-word-${index}`}
          />
        ))}
      </Box>
    </Box>
  );
}
