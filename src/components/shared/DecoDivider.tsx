'use client';

import { Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

/** Séparateur art déco : filets effilés, chevrons et diamant central. */
export function DecoDivider({ sx }: { sx?: SxProps<Theme> }) {
  return (
    <Box
      aria-hidden="true"
      component="svg"
      viewBox="0 0 160 12"
      sx={[
        {
          width: 160,
          height: 12,
          display: 'block',
          flexShrink: 0,
          color: 'secondary.main',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <path d="M10 6H64" stroke="currentColor" strokeWidth="1" opacity="0.55" />
      <path d="M96 6H150" stroke="currentColor" strokeWidth="1" opacity="0.55" />
      <path d="M80 1.5L84.5 6L80 10.5L75.5 6Z" fill="currentColor" opacity="0.9" />
      <path d="M66 6L70 2.8M66 6L70 9.2M94 6L90 2.8M94 6L90 9.2" stroke="currentColor" strokeWidth="0.9" opacity="0.6" />
    </Box>
  );
}
