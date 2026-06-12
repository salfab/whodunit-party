'use client';

import { Typography } from '@mui/material';
import type { TypographyProps } from '@mui/material';
import type { ElementType } from 'react';

/**
 * Rubrique de section art déco : petites capitales dorées espacées, même
 * registre que les libellés du formulaire « rejoindre une partie ».
 */
export function DecoRubric({ sx, ...props }: TypographyProps & { component?: ElementType }) {
  return (
    <Typography
      {...props}
      sx={[
        {
          fontSize: { xs: '0.82rem', sm: '0.88rem' },
          fontWeight: 700,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'secondary.main',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  );
}
