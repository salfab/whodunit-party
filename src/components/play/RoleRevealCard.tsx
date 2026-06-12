'use client';

import { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { keyframes } from '@mui/material/styles';
import { useCardFlip } from '@/contexts/CardFlipContext';
import { DecoFrame } from '@/components/shared/DecoFrame';
import { DecoDivider } from '@/components/shared/DecoDivider';

interface RoleRevealCardProps {
  imagePath: string;
  characterName: string;
  occupation?: string;
  role: 'investigator' | 'guilty' | 'innocent';
  onImageError?: () => void;
  showNameOverlay?: boolean; // Show name elegantly at bottom of image
  isAccused?: boolean; // Mark the accused player without hiding the portrait
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

// Unified elegant card design - same for all roles
const cardDesign = {
  gradient:
    'linear-gradient(180deg, rgba(184, 150, 95, 0.10), transparent 30%), linear-gradient(135deg, #10141a 0%, #161b22 52%, #0b0d11 100%)',
  accentColor: '#b8965f',
  borderColor: 'rgba(184, 150, 95, 0.34)',
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
  const { hasEverBeenFlipped, markAsFlipped } = useCardFlip();

  const roleLabel = getRoleLabel(role);

  // Occasional hint animation to show the card is interactive
  useEffect(() => {
    if (isFlipped || isAnimating || hasEverBeenFlipped) return;

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
  }, [isFlipped, isAnimating, hasEverBeenFlipped]);

  const handleCardClick = () => {
    if (isAnimating || isHinting) return;
    setShowHintPill(false);
    setIsAnimating(true);
    setIsFlipped(!isFlipped);
    
    // Mark that the user has flipped a card (persists in app state)
    if (!hasEverBeenFlipped) {
      markAsFlipped();
    }
    
    // Animation duration is 600ms
    setTimeout(() => setIsAnimating(false), 600);
  };

  const handleImageError = () => {
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
        width: '100%',
        maxWidth: 640,
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
          width: '100%',
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
            width: '100%',
            aspectRatio: '3 / 2',
            borderRadius: 1,
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            backgroundColor: 'rgba(0, 0, 0, 0.36)',
            border: '1px solid rgba(184, 150, 95, 0.24)',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 0.5,
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
              height: '100%',
              objectFit: 'contain',
              borderRadius: '5px',
            }}
          />
          
          {/* Non-destructive accused marker: keeps the portrait visible. */}
          {isAccused && (
            <Box
              sx={{
                position: 'absolute',
                inset: 8,
                borderRadius: 1,
                border: '2px solid rgba(143, 47, 50, 0.72)',
                boxShadow: 'inset 0 0 0 999px rgba(143, 47, 50, 0.06)',
                pointerEvents: 'none',
              }}
            >
              <Typography
                sx={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  px: 1,
                  py: 0.35,
                  borderRadius: 1,
                  bgcolor: 'rgba(10, 10, 12, 0.72)',
                  color: '#f1ead9',
                  border: '1px solid rgba(143, 47, 50, 0.72)',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                }}
              >
                ACCUSÉ
              </Typography>
            </Box>
          )}
          
          {/* Name overlay for placeholder images */}
          {showNameOverlay && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                minHeight: '30%',
                background: 'linear-gradient(to top, rgba(7,8,10,0.92) 0%, rgba(7,8,10,0.68) 58%, transparent 100%)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                alignItems: 'center',
                padding: '8px 16px 16px',
              }}
            >
              <Typography
                sx={{
                  color: '#f1ead9',
                  textAlign: 'center',
                  fontWeight: 700,
                  textShadow: '0 3px 12px rgba(0,0,0,0.9), 0 1px 3px rgba(0,0,0,0.8)',
                  fontSize: 'clamp(1rem, 4.8vw, 1.75rem)',
                  lineHeight: 1.2,
                  wordBreak: 'break-word',
                }}
              >
                {characterName}
              </Typography>
              {occupation && (
                <Typography
                  sx={{
                    color: 'text.secondary',
                    textAlign: 'center',
                    fontStyle: 'italic',
                    mt: 0.5,
                    textShadow: '0 2px 8px rgba(0,0,0,0.9)',
                    fontSize: 'clamp(0.7rem, 3vw, 1rem)',
                    lineHeight: 1.2,
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
            borderRadius: 1,
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            background: cardDesign.gradient,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 3,
            border: `1px solid ${cardDesign.borderColor}`,
          }}
        >
        {/* Cadre art déco partagé (coins à gradins + filets) */}
        <DecoFrame bottomOrnament={false} />

        {/* Character name - prominent */}
        <Typography
          variant="h5"
          data-testid="character-name"
          sx={{
            position: 'relative',
            fontFamily: '"Lobby Deco Display", "Bodoni MT Condensed", "Bodoni MT", serif',
            color: 'secondary.light',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            textAlign: 'center',
            mb: 1,
            textShadow: '0 4px 14px rgba(0,0,0,0.5)',
          }}
        >
          {characterName}
        </Typography>
        {occupation && (
          <Typography
            variant="subtitle1"
            sx={{
              position: 'relative',
              color: 'text.secondary',
              fontStyle: 'italic',
              textAlign: 'center',
              mb: 2,
            }}
          >
            {occupation}
          </Typography>
        )}

        {/* Séparateur : filets effilés et diamant central */}
        <DecoDivider sx={{ position: 'relative', mb: { xs: 2, sm: 3 } }} />

        {/* Role label - discreet, small text */}
        <Typography
          sx={{
            position: 'relative',
            color: '#f1ead9',
            fontSize: '1rem',
            letterSpacing: '0.24em',
            pl: '0.24em',
            textTransform: 'uppercase',
            fontWeight: 800,
            textShadow: '0 3px 10px rgba(0,0,0,0.55)',
          }}
        >
          {roleLabel}
        </Typography>

        {/* Tap hint on back - also discreet */}
        <Typography
          sx={{
            position: 'relative',
            mt: { xs: 2, sm: 3.5 },
            fontSize: '0.6rem',
            color: 'rgba(241, 234, 217, 0.32)',
            letterSpacing: '0.08em',
          }}
        >
          touchez pour retourner
        </Typography>
      </Box>
    </Box>
  </Box>
  );
}
