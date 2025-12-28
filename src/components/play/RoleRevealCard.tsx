'use client';

import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { keyframes } from '@mui/system';

interface RoleRevealCardProps {
  imagePath: string;
  characterName: string;
  role: 'investigator' | 'guilty' | 'innocent';
  onImageError?: () => void;
}

// Flip animation keyframes
const flipToBack = keyframes`
  0% {
    transform: perspective(1000px) rotateY(0deg);
  }
  100% {
    transform: perspective(1000px) rotateY(180deg);
  }
`;

const flipToFront = keyframes`
  0% {
    transform: perspective(1000px) rotateY(180deg);
  }
  100% {
    transform: perspective(1000px) rotateY(360deg);
  }
`;

const getRoleConfig = (role: 'investigator' | 'guilty' | 'innocent') => {
  switch (role) {
    case 'investigator':
      return {
        label: 'ENQUÊTEUR',
        emoji: '🔍',
        gradient: 'linear-gradient(135deg, #1a237e 0%, #283593 50%, #3949ab 100%)',
        accentColor: '#90caf9',
        borderColor: '#5c6bc0',
        description: 'Chargé de découvrir la vérité',
      };
    case 'guilty':
      return {
        label: 'COUPABLE',
        emoji: '🎭',
        gradient: 'linear-gradient(135deg, #b71c1c 0%, #c62828 50%, #d32f2f 100%)',
        accentColor: '#ef9a9a',
        borderColor: '#e53935',
        description: 'Dissimulateur de vérité',
      };
    case 'innocent':
      return {
        label: 'INNOCENT',
        emoji: '✨',
        gradient: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #388e3c 100%)',
        accentColor: '#a5d6a7',
        borderColor: '#43a047',
        description: 'Témoin des événements',
      };
  }
};

export default function RoleRevealCard({
  imagePath,
  characterName,
  role,
  onImageError,
}: RoleRevealCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [imageHidden, setImageHidden] = useState(false);

  const roleConfig = getRoleConfig(role);

  const handleCardClick = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIsFlipped(!isFlipped);
    // Animation duration is 600ms
    setTimeout(() => setIsAnimating(false), 600);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageHidden(true);
    onImageError?.();
  };

  if (imageHidden) {
    return null;
  }

  return (
    <Box
      onClick={handleCardClick}
      sx={{
        width: '100%',
        aspectRatio: '3 / 4',
        position: 'relative',
        cursor: 'pointer',
        transformStyle: 'preserve-3d',
        animation: isAnimating
          ? `${isFlipped ? flipToBack : flipToFront} 0.6s ease-in-out forwards`
          : undefined,
        transform: isFlipped && !isAnimating 
          ? 'perspective(1000px) rotateY(180deg)' 
          : 'perspective(1000px) rotateY(0deg)',
        mb: 2,
        // Subtle hint to tap
        '&::after': !isFlipped ? {
          content: '"Touchez pour révéler"',
          position: 'absolute',
          bottom: 8,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '0.7rem',
          color: 'rgba(255,255,255,0.7)',
          backgroundColor: 'rgba(0,0,0,0.5)',
          padding: '4px 12px',
          borderRadius: '12px',
          pointerEvents: 'none',
          opacity: 0.8,
          zIndex: 10,
        } : {},
      }}
    >
      {/* Front of card - Character Image */}
      <Box
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backfaceVisibility: 'hidden',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}
      >
        <Box
          component="img"
          src={imagePath}
          alt={characterName}
          onError={handleImageError}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        {/* Character name overlay on front */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
            padding: '40px 16px 16px',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: 'white',
              textAlign: 'center',
              fontWeight: 600,
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            }}
          >
            {characterName}
          </Typography>
        </Box>
      </Box>

      {/* Back of card - Role reveal (business card style) */}
      <Box
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          background: roleConfig.gradient,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 3,
          border: `3px solid ${roleConfig.borderColor}`,
        }}
      >
        {/* Decorative top border */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: roleConfig.accentColor,
          }}
        />

        {/* Elegant corner decorations */}
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            width: 30,
            height: 30,
            borderTop: `2px solid ${roleConfig.accentColor}`,
            borderLeft: `2px solid ${roleConfig.accentColor}`,
            opacity: 0.6,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 30,
            height: 30,
            borderTop: `2px solid ${roleConfig.accentColor}`,
            borderRight: `2px solid ${roleConfig.accentColor}`,
            opacity: 0.6,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            width: 30,
            height: 30,
            borderBottom: `2px solid ${roleConfig.accentColor}`,
            borderLeft: `2px solid ${roleConfig.accentColor}`,
            opacity: 0.6,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            width: 30,
            height: 30,
            borderBottom: `2px solid ${roleConfig.accentColor}`,
            borderRight: `2px solid ${roleConfig.accentColor}`,
            opacity: 0.6,
          }}
        />

        {/* Role emoji */}
        <Typography
          sx={{
            fontSize: '4rem',
            mb: 2,
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
          }}
        >
          {roleConfig.emoji}
        </Typography>

        {/* Role label */}
        <Typography
          variant="h4"
          sx={{
            color: 'white',
            fontWeight: 700,
            letterSpacing: '0.15em',
            textShadow: '0 2px 8px rgba(0,0,0,0.4)',
            mb: 1,
          }}
        >
          {roleConfig.label}
        </Typography>

        {/* Decorative line */}
        <Box
          sx={{
            width: '60%',
            height: '2px',
            background: `linear-gradient(90deg, transparent, ${roleConfig.accentColor}, transparent)`,
            mb: 2,
          }}
        />

        {/* Character name */}
        <Typography
          variant="h6"
          sx={{
            color: roleConfig.accentColor,
            fontStyle: 'italic',
            textAlign: 'center',
            mb: 1,
          }}
        >
          {characterName}
        </Typography>

        {/* Role description */}
        <Typography
          variant="body2"
          sx={{
            color: 'rgba(255,255,255,0.8)',
            textAlign: 'center',
            fontStyle: 'italic',
            maxWidth: '80%',
          }}
        >
          {roleConfig.description}
        </Typography>

        {/* Bottom decorative line */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: roleConfig.accentColor,
          }}
        />

        {/* Tap hint on back */}
        <Typography
          sx={{
            position: 'absolute',
            bottom: 20,
            fontSize: '0.65rem',
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          Touchez pour retourner
        </Typography>
      </Box>
    </Box>
  );
}
