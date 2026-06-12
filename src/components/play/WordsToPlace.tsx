'use client';

import { Box, Chip } from '@mui/material';
import { DecoRubric } from '@/components/shared/DecoRubric';

interface WordsToPlaceProps {
  words: string[];
}

export default function WordsToPlace({ words }: WordsToPlaceProps) {
  if (words.length === 0) return null;

  return (
    <Box sx={{ mb: 4 }} data-testid="play-words-section">
      <DecoRubric component="h2" sx={{ mb: 1.5 }}>
        Mots à placer
      </DecoRubric>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }} data-testid="play-words-list">
        {words.map((word, index) => (
          <Chip
            key={index}
            label={word}
            variant="outlined"
            sx={{ 
              fontSize: '0.95rem',
              minHeight: 38,
              px: 1,
              fontWeight: 600,
              borderWidth: '1px',
              '& .MuiChip-label': {
                color: 'text.primary',
              }
            }}
            data-testid={`play-word-${index}`}
          />
        ))}
      </Box>
    </Box>
  );
}
