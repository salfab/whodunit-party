'use client';

import { useId } from 'react';
import { Box, Typography } from '@mui/material';
import { motion, useReducedMotion } from 'framer-motion';
import { DecoPediment } from '@/components/shared/DecoPediment';

interface LoadingScreenProps {
  message?: string;
  imageUrl?: string;
}

const RAY_COUNT = 16;
const CYCLE_SECONDS = 2.6;

// Rayons du médaillon, alternés long/court façon cadran ; le délai d'animation
// croît avec l'angle pour produire le balayage lumineux circulaire.
const RAYS = Array.from({ length: RAY_COUNT }, (_, index) => {
  const angle = (index / RAY_COUNT) * Math.PI * 2 - Math.PI / 2;
  const isLong = index % 2 === 0;
  const inner = isLong ? 56 : 61;
  const outer = isLong ? 78 : 73;
  return {
    x1: 100 + Math.cos(angle) * inner,
    y1: 100 + Math.sin(angle) * inner,
    x2: 100 + Math.cos(angle) * outer,
    y2: 100 + Math.sin(angle) * outer,
    width: isLong ? 3.4 : 2,
    delay: (index / RAY_COUNT) * CYCLE_SECONDS,
  };
});

const CARDINAL_DIAMONDS = [
  { cx: 100, cy: 7 },
  { cx: 193, cy: 100 },
  { cx: 100, cy: 193 },
  { cx: 7, cy: 100 },
];

export default function LoadingScreen({ message = 'Chargement...', imageUrl }: LoadingScreenProps) {
  const reduceMotion = useReducedMotion();
  const clipId = useId();

  return (
    <Box
      sx={{
        minHeight: '100svh',
        position: 'relative',
        overflow: 'hidden',
        display: 'grid',
        placeItems: 'center',
        px: 3,
        py: 5,
        backgroundImage:
          'radial-gradient(circle at 50% 18%, rgba(184, 150, 95, 0.18), transparent 20rem), radial-gradient(circle at 12% 86%, rgba(143, 47, 50, 0.14), transparent 18rem), linear-gradient(180deg, rgba(7, 8, 10, 0.54), rgba(7, 8, 10, 0.94))',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0.28,
          backgroundImage:
            'linear-gradient(90deg, rgba(184, 150, 95, 0.08) 1px, transparent 1px), linear-gradient(0deg, rgba(184, 150, 95, 0.045) 1px, transparent 1px)',
          backgroundSize: '78px 78px',
          maskImage: 'radial-gradient(circle at 50% 42%, black, transparent 78%)',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(circle at 50% 50%, transparent 0 18rem, rgba(0, 0, 0, 0.24) 29rem), linear-gradient(180deg, rgba(255,255,255,0.035), transparent 32%)',
        },
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        style={{ position: 'relative', zIndex: 1, width: 'min(100%, 360px)' }}
      >
        <DecoPediment sx={{ mb: { xs: 2.5, sm: 3 } }} />

        <Box
          sx={{
            position: 'relative',
            display: 'grid',
            placeItems: 'center',
            py: { xs: 1, sm: 1.5 },
          }}
        >
          <Box
            aria-hidden="true"
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: 280, sm: 320 },
              height: { xs: 280, sm: 320 },
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(184, 150, 95, 0.16) 0%, rgba(184, 150, 95, 0.05) 42%, transparent 68%)',
            }}
          />

          {/* Médaillon-cadran : filets circulaires, diamants cardinaux et
              rayons illuminés en balayage continu */}
          <Box
            component="svg"
            aria-hidden="true"
            viewBox="0 0 200 200"
            sx={{
              position: 'relative',
              width: { xs: 170, sm: 192 },
              height: { xs: 170, sm: 192 },
              display: 'block',
              color: 'secondary.main',
              filter: 'drop-shadow(0 10px 26px rgba(0, 0, 0, 0.45))',
              '@keyframes deco-ray-sweep': {
                '0%': { opacity: 0.18 },
                '9%': { opacity: 1 },
                '32%': { opacity: 0.42 },
                '100%': { opacity: 0.18 },
              },
              '@keyframes deco-core-breath': {
                '0%, 100%': { transform: 'scale(0.94)' },
                '50%': { transform: 'scale(1.05)' },
              },
              '& [data-ray]': {
                animation: reduceMotion
                  ? 'none'
                  : `deco-ray-sweep ${CYCLE_SECONDS}s linear infinite`,
                opacity: reduceMotion ? 0.6 : undefined,
              },
              '& [data-core]': {
                transformOrigin: 'center',
                transformBox: 'fill-box',
                animation: reduceMotion
                  ? 'none'
                  : `deco-core-breath ${CYCLE_SECONDS}s ease-in-out infinite`,
              },
            }}
          >
            <circle cx="100" cy="100" r="93" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
            <circle cx="100" cy="100" r="86" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.85" />

            {CARDINAL_DIAMONDS.map(({ cx, cy }) => (
              <path
                key={`${cx}-${cy}`}
                d={`M${cx} ${cy - 5}L${cx + 5} ${cy}L${cx} ${cy + 5}L${cx - 5} ${cy}Z`}
                fill="currentColor"
              />
            ))}

            {RAYS.map(({ x1, y1, x2, y2, width, delay }, index) => (
              <line
                key={index}
                data-ray=""
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="currentColor"
                strokeWidth={width}
                strokeLinecap="square"
                style={{ animationDelay: reduceMotion ? undefined : `${delay}s` }}
              />
            ))}

            {imageUrl ? (
              <>
                <defs>
                  <clipPath id={clipId}>
                    <circle cx="100" cy="100" r="46" />
                  </clipPath>
                </defs>
                <circle cx="100" cy="100" r="46" fill="rgba(7, 8, 10, 0.78)" />
                <image
                  href={imageUrl}
                  x="54"
                  y="54"
                  width="92"
                  height="92"
                  preserveAspectRatio="xMidYMid slice"
                  clipPath={`url(#${clipId})`}
                  style={{ filter: 'sepia(0.45) contrast(1.05) brightness(0.8)', opacity: 0.9 }}
                />
                <circle cx="100" cy="100" r="46" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.8" />
              </>
            ) : (
              <g data-core="">
                <path d="M100 70L130 100L100 130L70 100Z" fill="currentColor" opacity="0.92" />
                <path d="M100 82L118 100L100 118L82 100Z" fill="rgba(15, 15, 19, 0.88)" />
                <path d="M100 90.5L109.5 100L100 109.5L90.5 100Z" fill="#ecd9a4" />
              </g>
            )}
          </Box>
        </Box>

        <Box sx={{ mt: { xs: 2.25, sm: 2.75 }, textAlign: 'center' }}>
          <Typography
            component="div"
            sx={{
              mb: 1.25,
              fontFamily: '"Bahnschrift Condensed", "Bahnschrift SemiCondensed", "Bahnschrift", "Aptos Display", "Segoe UI", sans-serif',
              fontSize: { xs: '0.74rem', sm: '0.82rem' },
              fontWeight: 800,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'secondary.main',
            }}
          >
            Faux Témoignage
          </Typography>
          <Typography
            variant="h6"
            color="text.primary"
            sx={{
              minHeight: 32,
              textAlign: 'center',
              fontWeight: 800,
              letterSpacing: '0.01em',
              textShadow: '0 8px 24px rgba(0, 0, 0, 0.58)',
            }}
          >
            {message}
          </Typography>

          <Box
            aria-hidden="true"
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 0.75,
              mt: 2,
            }}
          >
            {[0, 1, 2, 3].map((index) => (
              <motion.span
                key={index}
                animate={reduceMotion ? undefined : { opacity: [0.32, 1, 0.32], y: [0, -3, 0] }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: index * 0.16,
                }}
                style={{
                  width: 7,
                  height: 7,
                  border: '1px solid rgba(184, 150, 95, 0.9)',
                  transform: 'rotate(45deg)',
                  background: 'rgba(7, 8, 10, 0.78)',
                  display: 'inline-block',
                }}
              />
            ))}
          </Box>
        </Box>
      </motion.div>
    </Box>
  );
}
