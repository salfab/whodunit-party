'use client';

import { Box } from '@mui/material';

/**
 * Cadre décoratif art déco pour panneaux : quatre coins à gradins dessinés en
 * SVG à taille fixe — jamais déformés, quelle que soit la taille du panneau —
 * reliés par des filets extensibles, plus un ornement losange centré sur le
 * rail bas. À poser dans un conteneur en position: relative ; purement
 * décoratif (aria-hidden, pointer-events: none).
 */

const GOLD = 'rgba(205, 178, 120, 0.92)';
const GOLD_SOFT = 'rgba(232, 212, 160, 0.95)';
const INK_FILL = 'rgba(15, 15, 19, 0.97)';

// Géométrie partagée coins/filets : le filet fin (1px) court à 6px du bord,
// le filet épais (2px) à 11px ; les coins font 56px de côté et dessinent les
// mêmes filets aux mêmes offsets pour un raccord exact avec les rails CSS.
const CORNER = 56;
const THIN_OFFSET = 6;
const THICK_OFFSET = 11;

const CORNERS = [
  { key: 'tl', anchor: { top: 0, left: 0 }, deg: 0 },
  { key: 'tr', anchor: { top: 0, right: 0 }, deg: 90 },
  { key: 'br', anchor: { bottom: 0, right: 0 }, deg: 180 },
  { key: 'bl', anchor: { bottom: 0, left: 0 }, deg: 270 },
] as const;

const RAILS = [
  { key: 'top-thin', sx: { top: THIN_OFFSET, left: CORNER, right: CORNER, height: '1px' } },
  { key: 'top-thick', sx: { top: THICK_OFFSET, left: CORNER, right: CORNER, height: '2px' } },
  { key: 'bottom-thin', sx: { bottom: THIN_OFFSET, left: CORNER, right: CORNER, height: '1px' } },
  { key: 'bottom-thick', sx: { bottom: THICK_OFFSET, left: CORNER, right: CORNER, height: '2px' } },
  { key: 'left-thin', sx: { left: THIN_OFFSET, top: CORNER, bottom: CORNER, width: '1px' } },
  { key: 'left-thick', sx: { left: THICK_OFFSET, top: CORNER, bottom: CORNER, width: '2px' } },
  { key: 'right-thin', sx: { right: THIN_OFFSET, top: CORNER, bottom: CORNER, width: '1px' } },
  { key: 'right-thick', sx: { right: THICK_OFFSET, top: CORNER, bottom: CORNER, width: '2px' } },
] as const;

export function DecoFrame({ bottomOrnament = true }: { bottomOrnament?: boolean }) {
  return (
    <Box
      aria-hidden="true"
      sx={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        filter: 'drop-shadow(0 2px 7px rgba(0, 0, 0, 0.45))',
      }}
    >
      {RAILS.map(({ key, sx }) => (
        <Box key={key} sx={{ position: 'absolute', bgcolor: GOLD, ...sx }} />
      ))}

      {CORNERS.map(({ key, anchor, deg }) => (
        <Box
          key={key}
          component="svg"
          viewBox={`0 0 ${CORNER} ${CORNER}`}
          sx={{
            position: 'absolute',
            width: CORNER,
            height: CORNER,
            display: 'block',
            transform: `rotate(${deg}deg)`,
            ...anchor,
          }}
        >
          {/* Filet fin : tourne l'angle d'un seul tenant */}
          <path d="M56 6.5H6.5V56" fill="none" stroke={GOLD} strokeWidth="1" />
          {/* Filet épais : tourne l'angle en deux gradins */}
          <path d="M56 12H22V16H16V22H12V56" fill="none" stroke={GOLD} strokeWidth="2" />
          {/* Diamant posé sur la diagonale du coin */}
          <path d="M26 20.5L31.5 26L26 31.5L20.5 26Z" fill={GOLD} />
          <path d="M26 23.4L28.6 26L26 28.6L23.4 26Z" fill={GOLD_SOFT} />
        </Box>
      ))}

      {/* Ornement central du rail bas : le fond sombre du losange interrompt
          visuellement les filets qui passent derrière */}
      {bottomOrnament && (
        <Box
          component="svg"
          viewBox="0 0 88 26"
          sx={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 88,
            height: 26,
            display: 'block',
          }}
        >
          <path d="M25 14L29 10L33 14L29 18Z" fill={GOLD} />
          <path d="M55 14L59 10L63 14L59 18Z" fill={GOLD} />
          <path d="M44 7.5L53 16.5L44 25.5L35 16.5Z" fill={INK_FILL} stroke={GOLD} strokeWidth="1.25" />
          <path d="M44 13.5L47 16.5L44 19.5L41 16.5Z" fill={GOLD_SOFT} />
        </Box>
      )}
    </Box>
  );
}
