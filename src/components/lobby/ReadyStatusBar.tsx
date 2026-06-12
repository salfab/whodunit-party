'use client';

import { Box, Typography, Alert, IconButton, Tooltip } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
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
  const hasEnoughPlayers = totalPlayers >= minPlayers;

  return (
    <>
      {totalPlayers < minPlayers && (
        <Alert severity="info" sx={{ mb: 1.4, py: 0.75 }}>
          En attente d'au moins {minPlayers} joueurs...
        </Alert>
      )}

      {availableMysteriesCount > 0 && availableMysteriesCount < totalPlayers && (
        <Alert severity="warning" sx={{ mb: 1.4, py: 0.75 }}>
          Attention : seulement {availableMysteriesCount} mystère{availableMysteriesCount > 1 ? 's' : ''} disponible{availableMysteriesCount > 1 ? 's' : ''} pour {totalPlayers} joueurs. La partie se terminera après {availableMysteriesCount} manche{availableMysteriesCount > 1 ? 's' : ''}.
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gap: 1.05,
          pt: 0.8,
          borderTop: '1px solid rgba(184, 150, 95, 0.18)',
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <CheckCircleOutlineIcon
            sx={{
              color: canStart ? 'success.light' : hasEnoughPlayers ? 'error.light' : 'text.secondary',
              fontSize: 30,
            }}
          />
          <Typography
            variant="subtitle1"
            data-testid="lobby-ready-count"
            sx={{
              color: canStart ? 'success.light' : hasEnoughPlayers ? 'error.light' : 'text.secondary',
              fontWeight: 800,
              textTransform: 'uppercase',
            }}
          >
            Prêts
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {readyCount} / {totalPlayers}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: { xs: 2.5, sm: 4 },
            maxWidth: 280,
            mx: 'auto',
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Tooltip title="Rafraîchir">
              <IconButton
                onClick={onRefresh}
                data-testid="lobby-refresh-button"
                aria-label="Rafraîchir"
                sx={{
                  width: 52,
                  height: 52,
                  color: 'info.light',
                  border: '1px solid rgba(184, 150, 95, 0.5)',
                  bgcolor: 'rgba(7, 8, 10, 0.42)',
                  boxShadow: '0 10px 28px rgba(0, 0, 0, 0.35), inset 0 0 18px rgba(184, 150, 95, 0.08)',
                  '&:hover': {
                    color: 'text.primary',
                    bgcolor: 'rgba(184, 150, 95, 0.1)',
                  },
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mt: 0.6,
                color: 'text.primary',
                fontWeight: 700,
              }}
            >
              Actualiser
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <Tooltip title="Quitter">
              <IconButton
                onClick={onQuit}
                data-testid="lobby-quit-button"
                aria-label="Quitter la salle"
                sx={{
                  width: 52,
                  height: 52,
                  color: 'error.light',
                  border: '1px solid rgba(184, 150, 95, 0.5)',
                  bgcolor: 'rgba(7, 8, 10, 0.42)',
                  boxShadow: '0 10px 28px rgba(0, 0, 0, 0.35), inset 0 0 18px rgba(184, 150, 95, 0.08)',
                  '&:hover': {
                    color: 'text.primary',
                    bgcolor: 'rgba(143, 47, 50, 0.18)',
                  },
                }}
              >
                <LogoutIcon />
              </IconButton>
            </Tooltip>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mt: 0.6,
                color: 'text.primary',
                fontWeight: 700,
              }}
            >
              Quitter
            </Typography>
          </Box>
        </Box>
      </Box>

      {canStart && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Alert severity="success" sx={{ mt: 2 }}>
            Tous les joueurs sont prêts ! Démarrage automatique...
          </Alert>
        </motion.div>
      )}
    </>
  );
}
