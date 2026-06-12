'use client';

import { Box } from '@mui/material';

export function LobbyWordmark() {
  return (
    <Box
      aria-label="Faux Témoignage"
      role="img"
      sx={{
        position: 'relative',
        justifySelf: 'start',
        width: { xs: 132, sm: 154 },
        height: { xs: 58, sm: 67 },
        display: 'grid',
        placeItems: 'center',
        color: 'secondary.main',
        filter: 'drop-shadow(0 8px 18px rgba(0, 0, 0, 0.48))',
      }}
    >
      <Box
        component="svg"
        aria-hidden="true"
        viewBox="0 0 250 108"
        preserveAspectRatio="none"
        sx={{
          width: '100%',
          height: '100%',
          overflow: 'visible',
          display: 'block',
        }}
      >
        <defs>
          <linearGradient id="lobby-wordmark-gold" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#f0d28d" />
            <stop offset="52%" stopColor="#b88948" />
            <stop offset="100%" stopColor="#e3c17b" />
          </linearGradient>
        </defs>

        <g stroke="currentColor" strokeLinecap="square" fill="none">
          <path d="M4 43H54" strokeWidth="1.55" opacity="0.52" />
          <path d="M17 36H54" strokeWidth="2.25" opacity="0.78" />
          <path d="M208 43H246" strokeWidth="1.55" opacity="0.52" />
          <path d="M208 36H234" strokeWidth="2.25" opacity="0.78" />
        </g>

        <g transform="translate(150 13) scale(0.78)" stroke="currentColor" fill="none" strokeLinecap="round">
          <circle cx="15" cy="15" r="13" strokeWidth="3" opacity="0.95" />
          <circle cx="15" cy="15" r="7.6" strokeWidth="1.6" opacity="0.48" />
          <path d="M15 4.5C20.7 7.2 23.6 12.6 23.8 18.7" strokeWidth="1.25" opacity="0.52" />
          <path d="M7 18.5C11.8 15.4 16.3 12.6 20.8 9.7" strokeWidth="1.25" opacity="0.42" />
          <path d="M24.5 25.5L41 42" strokeWidth="4" />
          <path d="M28.5 25.5L44 41" strokeWidth="1.4" opacity="0.72" />
        </g>

        <text
          x="63"
          y="43"
          textLength="82"
          lengthAdjust="spacingAndGlyphs"
          fontFamily='"Lobby Deco Display", "Bodoni MT Condensed", "Bodoni MT", serif'
          fontSize="44"
          fontWeight="700"
          fill="url(#lobby-wordmark-gold)"
          stroke="rgba(7, 8, 10, 0.18)"
          strokeWidth="0.45"
          paintOrder="stroke fill"
        >
          FAUX
        </text>
        <text
          x="14"
          y="90"
          textLength="210"
          lengthAdjust="spacingAndGlyphs"
          fontFamily='"Lobby Deco Display", "Bodoni MT Condensed", "Bodoni MT", serif'
          fontSize="43"
          fontWeight="700"
          fill="url(#lobby-wordmark-gold)"
          stroke="rgba(7, 8, 10, 0.18)"
          strokeWidth="0.45"
          paintOrder="stroke fill"
        >
          TÉMOIGNAGE
        </text>
      </Box>
    </Box>
  );
}
