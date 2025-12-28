'use client';

import { Box, Typography, Button, Alert, IconButton, Tooltip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { motion } from 'framer-motion';

interface ReadyStatusBarProps {
  readyCount: number;
  totalPlayers: number;
  canStart: boolean;
  minPlayers: number;
  availableMysteriesCount: number;
  onRefresh: () => void;
  onQuit: () => void;
}

export function ReadyStatusBar({
  readyCount,
  totalPlayers,
  canStart,
  minPlayers,
  availableMysteriesCount,
  onRefresh,
  onQuit,
}: ReadyStatusBarProps) {

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
        <Typography variant="h6" color={canStart ? 'success.main' : 'text.secondary'} data-testid="lobby-ready-count">
          Prêts : {readyCount} / {totalPlayers}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', alignItems: 'center' }}>
        <Tooltip title="Rafraîchir">
          <IconButton
            onClick={onRefresh}
            color="primary"
            size="large"
            data-testid="lobby-refresh-button"
            sx={{
              border: '1px solid',
              borderColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.main',
                color: 'white',
              },
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>

        <Button variant="outlined" size="large" color="error" onClick={onQuit} data-testid="lobby-quit-button">
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
