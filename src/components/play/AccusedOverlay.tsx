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
            initial={{ opacity: 0, x: '-100%', y: '-100%', scale: 0.5 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box
              component="img"
              src="/blood_smear.png"
              alt="Blood smear"
              sx={{
                width: '80%',
                height: '80%',
                objectFit: 'contain',
                opacity: 0.85,
                filter: 'drop-shadow(0 0 20px rgba(139, 0, 0, 0.5))',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
