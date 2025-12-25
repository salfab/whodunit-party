'use client';

import { Box, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface TransitionScreenProps {
  isVisible: boolean;
  title?: string;
  subtitle?: string;
  onComplete?: () => void;
  duration?: number;
}

export default function TransitionScreen({ 
  isVisible, 
  title = 'Nouveau mystère',
  subtitle,
  onComplete,
  duration = 1200
}: TransitionScreenProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowContent(false);
      const contentTimer = setTimeout(() => setShowContent(true), 400);
      const completeTimer = setTimeout(() => {
        if (onComplete) onComplete();
      }, duration);
      
      return () => {
        clearTimeout(contentTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [isVisible, duration, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, rgba(139, 69, 19, 0.95) 0%, rgba(0, 0, 0, 0.98) 100%)',
          }}
        >
          <Box
            sx={{
              textAlign: 'center',
              px: 4,
              maxWidth: 600,
            }}
          >
            {/* Curtain effect */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.3)',
                transformOrigin: 'center',
              }}
            />

            <AnimatePresence>
              {showContent && (
                <>
                  {/* Mystery icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  >
                    <Typography variant="h1" sx={{ fontSize: 80, mb: 3 }}>
                      🎭
                    </Typography>
                  </motion.div>

                  {/* Title */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    <Typography 
                      variant="h2" 
                      component="h1"
                      sx={{ 
                        color: 'primary.light',
                        fontWeight: 700,
                        textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                        mb: 2
                      }}
                    >
                      {title}
                    </Typography>
                  </motion.div>

                  {/* Subtitle */}
                  {subtitle && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: 0.5, duration: 0.5 }}
                    >
                      <Typography 
                        variant="h5" 
                        sx={{ 
                          color: 'text.secondary',
                          fontStyle: 'italic'
                        }}
                      >
                        {subtitle}
                      </Typography>
                    </motion.div>
                  )}

                  {/* Decorative lines */}
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.6, duration: 0.4 }}
                    style={{ marginTop: 32 }}
                  >
                    <Box
                      sx={{
                        height: 2,
                        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                        maxWidth: 400,
                        margin: '0 auto'
                      }}
                    />
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
