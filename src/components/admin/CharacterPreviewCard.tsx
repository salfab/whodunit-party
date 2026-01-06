'use client';

import { useState, useRef, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { keyframes } from '@mui/material/styles';

interface CharacterPreviewCardProps {
  imagePath?: string;
  characterName: string;
  occupation?: string;
  role: 'investigator' | 'guilty' | 'innocent';
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

// Unified elegant card design
const cardDesign = {
  gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  accentColor: '#e4c98b', // Elegant gold
  borderColor: '#3d5a80',
};

// Spoiler-free role label - only shows "Enquêteur" or "Suspect"
const getSpoilerFreeRoleLabel = (role: 'investigator' | 'guilty' | 'innocent') => {
  return role === 'investigator' ? 'ENQUÊTEUR' : 'SUSPECT';
};

export default function CharacterPreviewCard({
  imagePath,
  characterName,
  occupation,
  role,
}: CharacterPreviewCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [cardHeight, setCardHeight] = useState<number | null>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const roleLabel = getSpoilerFreeRoleLabel(role);
  
  // Determine the image to show
  const displayImage = imagePath || `/characters/${role === 'investigator' ? 'investigator' : 'suspect_01'}.jpg`;

  // Update card height when image loads or resizes
  const updateCardHeight = () => {
    if (frontRef.current) {
      setCardHeight(frontRef.current.offsetHeight);
    }
  };

  useEffect(() => {
    if (frontRef.current) {
      // Use ResizeObserver to track size changes
      const observer = new ResizeObserver(updateCardHeight);
      observer.observe(frontRef.current);
      return () => observer.disconnect();
    }
  }, []);

  const handleImageLoad = () => {
    // Update height after image loads
    updateCardHeight();
  };

  const handleCardClick = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIsFlipped(!isFlipped);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // Determine which animation to use
  const getAnimation = () => {
    if (isAnimating) {
      return `${isFlipped ? flipToBack : flipToFront} 0.6s ease-in-out forwards`;
    }
    return undefined;
  };

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 200,
        margin: '0 auto',
      }}
    >
      {/* Card container for flip animation */}
      <Box
        onClick={handleCardClick}
        sx={{
          position: 'relative',
          cursor: 'pointer',
          transformStyle: 'preserve-3d',
          animation: getAnimation(),
          transform: isFlipped && !isAnimating 
            ? 'perspective(1000px) rotateY(180deg)' 
            : 'perspective(1000px) rotateY(0deg)',
          height: cardHeight || 'auto',
        }}
      >
        {/* Front of card - Character Image */}
        <Box
          ref={frontRef}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            backfaceVisibility: 'hidden',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            backgroundColor: '#1a1a2e',
          }}
        >
          {!imageError ? (
            <Box
              component="img"
              src={displayImage}
              alt={characterName}
              onError={handleImageError}
              onLoad={handleImageLoad}
              sx={{
                display: 'block',
                width: '100%',
                height: 'auto',
                objectFit: 'contain',
              }}
            />
          ) : (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: cardDesign.gradient,
              }}
            >
              <Typography
                sx={{
                  color: cardDesign.accentColor,
                  fontWeight: 600,
                  textAlign: 'center',
                  p: 2,
                }}
              >
                {characterName}
              </Typography>
            </Box>
          )}
          
          {/* Name overlay at bottom */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.4) 80%, transparent 100%)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              alignItems: 'center',
              padding: '16px 8px 12px',
            }}
          >
            <Typography
              sx={{
                color: '#ffd700',
                textAlign: 'center',
                fontWeight: 600,
                textShadow: '0 3px 12px rgba(0,0,0,0.9), 0 1px 3px rgba(0,0,0,0.8)',
                letterSpacing: '0.05em',
                fontSize: 'clamp(0.8rem, 3vw, 1rem)',
                lineHeight: 1.2,
                wordBreak: 'break-word',
              }}
            >
              {characterName}
            </Typography>
            {occupation && (
              <Typography
                sx={{
                  color: 'rgba(255,255,255,0.7)',
                  textAlign: 'center',
                  fontStyle: 'italic',
                  mt: 0.5,
                  textShadow: '0 2px 8px rgba(0,0,0,0.9)',
                  fontSize: 'clamp(0.6rem, 2vw, 0.8rem)',
                  lineHeight: 1.2,
                }}
              >
                {occupation}
              </Typography>
            )}
          </Box>

          {/* Tap hint */}
          <Typography
            sx={{
              position: 'absolute',
              top: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '0.6rem',
              color: 'rgba(255,255,255,0.5)',
              backgroundColor: 'rgba(0,0,0,0.5)',
              padding: '2px 8px',
              borderRadius: '8px',
            }}
          >
            cliquez pour retourner
          </Typography>
        </Box>

        {/* Back of card - Role reveal (spoiler-free) */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            background: cardDesign.gradient,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 2,
            border: `2px solid ${cardDesign.borderColor}`,
          }}
        >
          {/* Decorative top border */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: cardDesign.accentColor,
            }}
          />

          {/* Elegant corner decorations */}
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              width: 16,
              height: 16,
              borderTop: `1px solid ${cardDesign.accentColor}`,
              borderLeft: `1px solid ${cardDesign.accentColor}`,
              opacity: 0.5,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              width: 16,
              height: 16,
              borderTop: `1px solid ${cardDesign.accentColor}`,
              borderRight: `1px solid ${cardDesign.accentColor}`,
              opacity: 0.5,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              width: 16,
              height: 16,
              borderBottom: `1px solid ${cardDesign.accentColor}`,
              borderLeft: `1px solid ${cardDesign.accentColor}`,
              opacity: 0.5,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              width: 16,
              height: 16,
              borderBottom: `1px solid ${cardDesign.accentColor}`,
              borderRight: `1px solid ${cardDesign.accentColor}`,
              opacity: 0.5,
            }}
          />

          {/* Character name - prominent */}
          <Typography
            variant="h6"
            sx={{
              color: cardDesign.accentColor,
              fontWeight: 600,
              textAlign: 'center',
              mb: 0.5,
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              fontSize: 'clamp(0.9rem, 3vw, 1.1rem)',
            }}
          >
            {characterName}
          </Typography>
          {occupation && (
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontStyle: 'italic',
                textAlign: 'center',
                mb: 1.5,
                fontSize: 'clamp(0.7rem, 2vw, 0.85rem)',
              }}
            >
              {occupation}
            </Typography>
          )}

          {/* Decorative line */}
          <Box
            sx={{
              width: '40%',
              height: '1px',
              background: `linear-gradient(90deg, transparent, ${cardDesign.accentColor}, transparent)`,
              mb: 2,
            }}
          />

          {/* Role label - spoiler-free (Enquêteur or Suspect) */}
          <Typography
            sx={{
              color: 'rgba(255, 255, 255, 1)',
              fontSize: '0.85rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              fontWeight: 300,
            }}
          >
            {roleLabel}
          </Typography>

          {/* Bottom decorative line */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: cardDesign.accentColor,
            }}
          />

          {/* Tap hint on back */}
          <Typography
            sx={{
              position: 'absolute',
              bottom: 16,
              fontSize: '0.5rem',
              color: 'rgba(255,255,255,0.3)',
              letterSpacing: '0.05em',
            }}
          >
            cliquez pour retourner
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
