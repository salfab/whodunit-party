'use client';

import { Box, Typography, Button, Alert } from '@mui/material';
import { motion } from 'framer-motion';

interface ReadyStatusBarProps {
  readyCount: number;
  totalPlayers: number;
  isReady: boolean;
  canStart: boolean;
  minPlayers: number;
  availableMysteriesCount: number;
  onReadyToggle: () => void;
  onQuit: () => void;
}

export function ReadyStatusBar({
  readyCount,
  totalPlayers,
  isReady,
  canStart,
  minPlayers,
  availableMysteriesCount,
  onReadyToggle,
  onQuit,
}: ReadyStatusBarProps) {
  const canToggleReady = totalPlayers >= minPlayers && availableMysteriesCount > 0;

  return (
    <>
      {totalPlayers < minPlayers && (
        <Alert severity="info" sx={{ mb: 3 }}>
          En attente d'au moins {minPlayers} joueurs...
        </Alert>
      )}

      {availableMysteriesCount > 0 && availableMysteriesCount < totalPlayers && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          ⚠️ Attention : Seulement {availableMysteriesCount} mystère{availableMysteriesCount > 1 ? 's' : ''} disponible{availableMysteriesCount > 1 ? 's' : ''} pour {totalPlayers} joueurs. La partie se terminera après {availableMysteriesCount} manche{availableMysteriesCount > 1 ? 's' : ''}.
        </Alert>
      )}

      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h6" color={canStart ? 'success.main' : 'text.secondary'}>
          Prêts : {readyCount} / {totalPlayers}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button
          variant={isReady ? 'outlined' : 'contained'}
          size="large"
          onClick={onReadyToggle}
          disabled={!canToggleReady}
        >
          {isReady ? 'Pas prêt' : 'Prêt'}
        </Button>

        <Button variant="outlined" size="large" color="error" onClick={onQuit}>
          Quitter
        </Button>
      </Box>

      {canStart && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Alert severity="success" sx={{ mt: 3 }}>
            Tous les joueurs sont prêts ! Démarrage automatique...
          </Alert>
        </motion.div>
      )}
    </>
  );
}
