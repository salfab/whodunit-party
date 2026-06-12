'use client';

import { Box, Typography } from '@mui/material';
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
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              paddingTop: 24,
            }}
          >
            <Box
              sx={{
                px: 2,
                py: 1,
                borderRadius: 1,
                bgcolor: 'rgba(7, 8, 10, 0.76)',
                border: '1px solid rgba(143, 47, 50, 0.72)',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.36)',
              }}
            >
              <Typography sx={{ color: 'text.primary', fontWeight: 800 }}>
                Accusé
              </Typography>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
