'use client';

import { Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Fronton art déco : éventail central flanqué de filets parallèles terminés
 * par des diamants — même langage que DecoFrame. Purement décoratif.
 */
export function DecoPediment({ sx }: { sx?: SxProps<Theme> }) {
  return (
    <Box
      component="svg"
      aria-hidden="true"
      viewBox="0 0 240 28"
      sx={[
        {
          width: 'min(100%, 240px)',
          height: 28,
          display: 'block',
          mx: 'auto',
          color: 'secondary.main',
          overflow: 'visible',
          filter: 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.42))',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <path d="M8 15H76" stroke="currentColor" strokeWidth="1" opacity="0.55" />
      <path d="M28 11H84" stroke="currentColor" strokeWidth="1.6" opacity="0.8" />
      <path d="M164 15H232" stroke="currentColor" strokeWidth="1" opacity="0.55" />
      <path d="M156 11H212" stroke="currentColor" strokeWidth="1.6" opacity="0.8" />
      <path d="M91 8L94 11L91 14L88 11Z" fill="currentColor" opacity="0.9" />
      <path d="M149 8L152 11L149 14L146 11Z" fill="currentColor" opacity="0.9" />
      <path d="M100 21L108 10L120 4L132 10L140 21H100Z" fill="rgba(184, 150, 95, 0.08)" stroke="currentColor" strokeWidth="1.25" />
      <path d="M104 21H136" stroke="currentColor" strokeWidth="1" opacity="0.7" />
      <path d="M108 10L120 23M114 7L120 23M120 4V23M126 7L120 23M132 10L120 23" stroke="currentColor" strokeWidth="0.85" opacity="0.68" />
      <path d="M116 23H124" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" opacity="0.9" />
    </Box>
  );
}
