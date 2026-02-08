'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface PlayerOption {
  id: string;
  name: string;
  characterName?: string;
  occupation?: string;
}

interface AccusationDialogProps {
  open: boolean;
  onClose: () => void;
  players: PlayerOption[];
  selectedPlayer: string;
  onSelectPlayer: (playerId: string) => void;
  onConfirm: (playerId: string) => void;
  submitting: boolean;
}

const goldAccent = '#e4c98b';

export default function AccusationDialog({
  open,
  onClose,
  players,
  selectedPlayer,
  onSelectPlayer,
  onConfirm,
  submitting,
}: AccusationDialogProps) {
  const handleAccuse = (playerId: string) => {
    onSelectPlayer(playerId);
    // Small delay to show selection before confirming
    setTimeout(() => {
      onConfirm(playerId);
    }, 150);
  };

  return (
    <Dialog
      open={open}
      onClose={() => !submitting && onClose()}
      maxWidth="sm"
      fullWidth
      data-testid="accusation-dialog"
      sx={{
        '& .MuiDialog-container': {
          alignItems: { xs: 'flex-end', sm: 'center' },
        },
      }}
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          backgroundImage: 'none',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
          borderRadius: { xs: '16px 16px 0 0', sm: 2 },
          m: { xs: 0, sm: 2 },
          maxHeight: { xs: '80vh', sm: '90vh' },
          width: { xs: '100%', sm: undefined },
        }
      }}
      BackdropProps={{
        sx: {
          bgcolor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(4px)',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pb: 1,
        pt: 2,
      }}>
        <Typography
          variant="h5"
          component="span"
          sx={{
            fontWeight: 700,
            color: goldAccent,
          }}
        >
          Qui accusez-vous ?
        </Typography>
        <IconButton
          onClick={onClose}
          disabled={submitting}
          size="small"
          sx={{ color: 'text.secondary' }}
          data-testid="accusation-cancel-button"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: { xs: 2, sm: 3 }, pb: 3, overflow: 'auto' }}>
        <Typography
          variant="body2"
          sx={{ mb: 3, color: 'text.secondary', textAlign: 'center' }}
        >
          Choisissez un suspect à accuser
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            pb: 1, // Extra padding at bottom to ensure last item is fully visible
          }}
          data-testid="accusation-player-list"
        >
          {players.map((player) => (
            <Button
              key={player.id}
              onClick={() => handleAccuse(player.id)}
              disabled={submitting}
              variant="outlined"
              fullWidth
              data-testid={`accusation-player-${player.id}`}
              sx={{
                py: 2,
                px: 3,
                borderRadius: 2,
                border: '2px solid',
                borderColor: selectedPlayer === player.id ? '#d32f2f' : 'divider',
                bgcolor: selectedPlayer === player.id ? 'rgba(211, 47, 47, 0.1)' : 'transparent',
                textAlign: 'left',
                justifyContent: 'flex-start',
                textTransform: 'none',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: '#d32f2f',
                  bgcolor: 'rgba(211, 47, 47, 0.08)',
                  transform: 'scale(1.01)',
                },
                '&:active': {
                  transform: 'scale(0.99)',
                },
              }}
            >
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    color: 'text.primary',
                    lineHeight: 1.3,
                  }}
                >
                  {player.name}
                </Typography>
                {(player.characterName || player.occupation) && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                      mt: 0.25,
                    }}
                  >
                    {player.occupation 
                      ? `${player.characterName} — ${player.occupation}`
                      : player.characterName}
                  </Typography>
                )}
              </Box>
            </Button>
          ))}
        </Box>

        {submitting && (
          <Typography
            variant="body2"
            sx={{
              mt: 3,
              textAlign: 'center',
              color: '#d32f2f',
              fontWeight: 500,
            }}
          >
            Accusation en cours...
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}
