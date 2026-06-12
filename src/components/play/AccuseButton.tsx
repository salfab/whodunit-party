'use client';

import { Box, Button } from '@mui/material';

interface AccuseButtonProps {
  onClick: () => void;
}

export default function AccuseButton({ onClick }: AccuseButtonProps) {
  return (
    <Box sx={{ textAlign: 'center', mt: 4 }}>
      <Button
        variant="contained"
        size="large"
        onClick={onClick}
        data-testid="play-accuse-button"
        sx={{ 
          fontSize: '1rem', 
          px: 4, 
          py: 1.35,
          fontWeight: 'bold',
          minWidth: { xs: '100%', sm: 220 },
        }}
      >
        J&apos;accuse
      </Button>
    </Box>
  );
}
