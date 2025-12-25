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
        sx={{ 
          fontSize: '1.2rem', 
          px: 4, 
          py: 2,
          fontWeight: 'bold',
          bgcolor: '#d32f2f',
          color: 'white',
          boxShadow: '0 4px 14px 0 rgba(211, 47, 47, 0.39)',
          '&:hover': {
            bgcolor: '#b71c1c',
            boxShadow: '0 6px 20px rgba(211, 47, 47, 0.5)',
          }
        }}
      >
        🔍 J&apos;Accuse!
      </Button>
    </Box>
  );
}
