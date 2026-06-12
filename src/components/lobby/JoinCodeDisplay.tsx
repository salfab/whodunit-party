'use client';

import { Box, Typography } from '@mui/material';

interface JoinCodeDisplayProps {
  code: string;
}

export function JoinCodeDisplay({ code }: JoinCodeDisplayProps) {
  return (
    <Box
      sx={{
        textAlign: 'center',
        width: '100%',
        position: 'relative',
        mt: { xs: 0.15, sm: 0.35 },
      }}
      data-testid="lobby-join-code-section"
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: { xs: 1.1, sm: 1.5 },
          width: '100%',
          mb: { xs: 0.4, sm: 0.65 },
          '&::before, &::after': {
            content: '""',
            height: '1px',
            bgcolor: 'rgba(184, 150, 95, 0.58)',
          },
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: 'block',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'secondary.main',
            fontFamily: '"Bahnschrift Condensed", "Bahnschrift SemiCondensed", "Bahnschrift", "Aptos Display", "Segoe UI", sans-serif',
            fontSize: { xs: '0.95rem', sm: '1.06rem' },
            letterSpacing: { xs: '0.25em', sm: '0.3em' },
            whiteSpace: 'nowrap',
          }}
        >
          Code d'accès
        </Typography>
      </Box>

      <Box
        sx={{
          position: 'relative',
          mx: 'auto',
          width: '100%',
          minHeight: { xs: 104, sm: 136 },
          display: 'grid',
          placeItems: 'center',
        }}
        data-testid="lobby-join-code"
        aria-label={code}
      >
        <Typography
          component="div"
          sx={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            fontFamily: '"Bahnschrift Condensed", "Bahnschrift SemiCondensed", "Arial Narrow", "Arial Black", "Aptos Display", sans-serif',
            fontSize: { xs: '4.85rem', sm: '6.18rem' },
            lineHeight: 0.88,
            fontWeight: 900,
            letterSpacing: { xs: '0.05em', sm: '0.07em' },
            color: '#efe6d2',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            textShadow:
              '0 2px 0 rgba(57, 42, 27, 0.55), 0 10px 25px rgba(0, 0, 0, 0.78)',
            WebkitTextStroke: '0.35px rgba(7, 8, 10, 0.32)',
            transform: 'scaleY(1.12)',
            transformOrigin: 'center',
          }}
        >
          {code.toUpperCase()}
        </Typography>
      </Box>

      <Box
        aria-hidden="true"
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: 0.9,
          width: 'min(42%, 180px)',
          mx: 'auto',
          mt: { xs: -0.15, sm: 0.1 },
        }}
      >
        <Box sx={{ height: '1px', bgcolor: 'rgba(184, 150, 95, 0.58)' }} />
        <Box
          sx={{
            width: 9,
            height: 9,
            border: '1px solid rgba(184, 150, 95, 0.9)',
            transform: 'rotate(45deg)',
          }}
        />
        <Box sx={{ height: '1px', bgcolor: 'rgba(184, 150, 95, 0.58)' }} />
      </Box>
    </Box>
  );
}
