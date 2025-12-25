'use client';

import { Box } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

interface AccusedOverlayProps {
  isAccused: boolean;
}

export default function AccusedOverlay({ isAccused }: AccusedOverlayProps) {
  return (
    <>
      <AnimatePresence>
        {isAccused && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 2, ease: 'easeIn' }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              zIndex: 1000,
              background: 'linear-gradient(180deg, rgba(139,0,0,0.3) 0%, rgba(139,0,0,0) 30%)',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: '10%',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '3rem',
                fontWeight: 'bold',
                color: '#8b0000',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                animation: 'drip 3s ease-in',
              }}
            >
              ACCUSÉ !
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes drip {
          0% {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateX(-50%) translateY(0);
            opacity: 0.8;
          }
        }
      `}</style>
    </>
  );
}
