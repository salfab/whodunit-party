'use client';

import { Box, Typography } from '@mui/material';

interface JoinCodeDisplayProps {
  code: string;
}

export function JoinCodeDisplay({ code }: JoinCodeDisplayProps) {
  return (
    <Box sx={{ textAlign: 'center', mb: 4 }}>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        Code d'accès
      </Typography>
      <Typography
        variant="h3"
        sx={{
          fontFamily: 'monospace',
          letterSpacing: 4,
          color: 'primary.main',
        }}
      >
        {code}
      </Typography>
    </Box>
  );
}
