'use client';

import { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { keyframes } from '@mui/material/styles';

interface RoleRevealCardProps {
  imagePath: string;
  characterName: string;
  occupation?: string;
  role: 'investigator' | 'guilty' | 'innocent';
  onImageError?: () => void;
  showNameOverlay?: boolean; // Show name elegantly at bottom of image
  isAccused?: boolean; // Show blood smear overlay
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

// Hint animation - subtle wobble to indicate interactivity
const hintWobble = keyframes`
  0% {
    transform: perspective(1000px) rotateY(0deg);
  }
  25% {
    transform: perspective(1000px) rotateY(-15deg);
  }
  50% {
    transform: perspective(1000px) rotateY(10deg);
  }
  75% {
    transform: perspective(1000px) rotateY(-5deg);
  }
  100% {
    transform: perspective(1000px) rotateY(0deg);
  }
`;

// Fade in animation for hint pill
const fadeIn = keyframes`
  0% { opacity: 0; }
  100% { opacity: 1; }
`;

const fadeOut = keyframes`
  0% { opacity: 1; }
  100% { opacity: 0; }
`;

// Wipe reveal animation for blood smear (diagonal from top-left)
const wipeReveal = keyframes`
  0% {
    clip-path: polygon(0 0, 0 0, 0 0);
  }
  100% {
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
  }
`;

// Unified elegant card design - same for all roles
const cardDesign = {
  gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  accentColor: '#e4c98b', // Elegant gold
  borderColor: '#3d5a80',
};

const getRoleLabel = (role: 'investigator' | 'guilty' | 'innocent') => {
  switch (role) {
    case 'investigator':
      return 'ENQUÊTEUR';
    case 'guilty':
      return 'COUPABLE';
    case 'innocent':
      return 'INNOCENT';
  }
};

export default function RoleRevealCard({
  imagePath,
  characterName,
  occupation,
  role,
  onImageError,
  showNameOverlay = false,
  isAccused = false,
}: RoleRevealCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isHinting, setIsHinting] = useState(false);
  const [showHintPill, setShowHintPill] = useState(false);
  const [imageHidden, setImageHidden] = useState(false);
  const [bloodSmearLoaded, setBloodSmearLoaded] = useState(false);

  const roleLabel = getRoleLabel(role);

  // Occasional hint animation to show the card is interactive
  useEffect(() => {
    if (isFlipped || isAnimating) return;

    // Initial hint after 2 seconds
    const initialTimeout = setTimeout(() => {
      if (!isFlipped && !isAnimating) {
        setShowHintPill(true);
        setIsHinting(true);
        setTimeout(() => {
          setIsHinting(false);
          // Keep pill visible a bit longer then fade out
          setTimeout(() => setShowHintPill(false), 500);
        }, 800);
      }
    }, 2000);

    // Recurring hints every 8-12 seconds (randomized)
    const scheduleNextHint = () => {
      const delay = 8000 + Math.random() * 4000; // 8-12 seconds
      return setTimeout(() => {
        if (!isFlipped && !isAnimating) {
          setShowHintPill(true);
          setIsHinting(true);
          setTimeout(() => {
            setIsHinting(false);
            setTimeout(() => setShowHintPill(false), 500);
          }, 800);
        }
        intervalRef = scheduleNextHint();
      }, delay);
    };

    let intervalRef = scheduleNextHint();

    return () => {
      clearTimeout(initialTimeout);
      clearTimeout(intervalRef);
    };
  }, [isFlipped, isAnimating]);

  const handleCardClick = () => {
    if (isAnimating || isHinting) return;
    setShowHintPill(false);
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

  // Determine which animation to use
  const getAnimation = () => {
    if (isHinting && !isFlipped && !isAnimating) {
      return `${hintWobble} 0.8s ease-in-out`;
    }
    if (isAnimating) {
      return `${isFlipped ? flipToBack : flipToFront} 0.6s ease-in-out forwards`;
    }
    return undefined;
  };

  return (
    <Box
      sx={{
        width: 'fit-content',
        margin: '0 auto',
        mb: 2,
      }}
    >
      {/* Card container for flip animation */}
      <Box
        onClick={handleCardClick}
        data-testid="role-reveal-card"
        data-flipped={isFlipped}
        sx={{
          position: 'relative',
          cursor: 'pointer',
          transformStyle: 'preserve-3d',
          animation: getAnimation(),
          transform: isFlipped && !isAnimating 
            ? 'perspective(1000px) rotateY(180deg)' 
            : 'perspective(1000px) rotateY(0deg)',
        }}
      >
        {/* Hint pill - only visible during hint animation */}
        {showHintPill && !isFlipped && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '0.7rem',
              color: 'rgba(255,255,255,0.9)',
              backgroundColor: 'rgba(0,0,0,0.6)',
              padding: '4px 12px',
              borderRadius: '12px',
              pointerEvents: 'none',
              zIndex: 10,
              animation: isHinting 
                ? `${fadeIn} 0.2s ease-out forwards`
                : `${fadeOut} 0.3s ease-out forwards`,
            }}
          >
            Touchez pour révéler
          </Box>
        )}

        {/* Front of card - Character Image */}
        <Box
          sx={{
            backfaceVisibility: 'hidden',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            backgroundColor: '#000',
            position: 'relative',
          }}
        >
          <Box
            component="img"
            src={imagePath}
            alt={characterName}
            onError={handleImageError}
            sx={{
              display: 'block',
              width: '100%',
              height: 'auto',
            }}
          />
          
          {/* Blood smear overlay for accused players */}
          {isAccused && (
            <Box
              component="img"
              src="/blood_smear.png"
              alt="Blood smear"
              onLoad={() => setBloodSmearLoaded(true)}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                objectPosition: 'top left',
                opacity: 0.85,
                filter: 'drop-shadow(0 0 20px rgba(139, 0, 0, 0.5))',
                animation: bloodSmearLoaded ? `${wipeReveal} 1.5s ease-out forwards` : 'none',
                clipPath: bloodSmearLoaded ? undefined : 'polygon(0 0, 0 0, 0 0)',
                pointerEvents: 'none',
              }}
            />
          )}
          
          {/* Name overlay for placeholder images */}
          {showNameOverlay && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.4) 80%, transparent 100%)',
                padding: '60px 20px 24px',
                backdropFilter: 'blur(4px)',
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  color: '#ffd700',
                  textAlign: 'center',
                  fontWeight: 600,
                  textShadow: '0 3px 12px rgba(0,0,0,0.9), 0 1px 3px rgba(0,0,0,0.8)',
                  letterSpacing: '0.05em',
                }}
              >
                {characterName}
              </Typography>
              {occupation && (
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: 'text.secondary',
                    textAlign: 'center',
                    fontStyle: 'italic',
                    mt: 0.5,
                    textShadow: '0 2px 8px rgba(0,0,0,0.9)',
                  }}
                >
                  {occupation}
                </Typography>
              )}
            </Box>
          )}
        </Box>

        {/* Back of card - Role reveal (elegant business card style) */}
        <Box
          data-testid="role-reveal-card-back"
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
            padding: 3,
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
            top: 16,
            left: 16,
            width: 24,
            height: 24,
            borderTop: `1px solid ${cardDesign.accentColor}`,
            borderLeft: `1px solid ${cardDesign.accentColor}`,
            opacity: 0.5,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 24,
            height: 24,
            borderTop: `1px solid ${cardDesign.accentColor}`,
            borderRight: `1px solid ${cardDesign.accentColor}`,
            opacity: 0.5,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            width: 24,
            height: 24,
            borderBottom: `1px solid ${cardDesign.accentColor}`,
            borderLeft: `1px solid ${cardDesign.accentColor}`,
            opacity: 0.5,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            width: 24,
            height: 24,
            borderBottom: `1px solid ${cardDesign.accentColor}`,
            borderRight: `1px solid ${cardDesign.accentColor}`,
            opacity: 0.5,
          }}
        />

        {/* Character name - prominent */}
        <Typography
          variant="h5"
          sx={{
            color: cardDesign.accentColor,
            fontWeight: 600,
            textAlign: 'center',
            mb: 1,
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          {characterName}
        </Typography>
        {occupation && (
          <Typography
            variant="subtitle1"
            sx={{
              color: 'text.secondary',
              fontStyle: 'italic',
              textAlign: 'center',
              mb: 2,
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
            mb: 3,
          }}
        />

        {/* Role label - discreet, small text */}
        <Typography
          sx={{
            color: 'rgba(255,255,255,0.35)',
            fontSize: '0.7rem',
            letterSpacing: '0.2em',
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

        {/* Tap hint on back - also discreet */}
        <Typography
          sx={{
            position: 'absolute',
            bottom: 20,
            fontSize: '0.6rem',
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: '0.05em',
          }}
        >
          touchez pour retourner
        </Typography>
      </Box>
    </Box>
  </Box>
  );
}
