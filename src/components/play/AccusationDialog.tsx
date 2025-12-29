'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Radio,
} from '@mui/material';

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
  onConfirm: () => void;
  submitting: boolean;
}

export default function AccusationDialog({
  open,
  onClose,
  players,
  selectedPlayer,
  onSelectPlayer,
  onConfirm,
  submitting,
}: AccusationDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={() => !submitting && onClose()}
      maxWidth="sm"
      fullWidth
      data-testid="accusation-dialog"
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          backgroundImage: 'none',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }
      }}
      BackdropProps={{
        sx: {
          bgcolor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
        }
      }}
    >
      <DialogTitle sx={{ 
        fontSize: '1.5rem', 
        fontWeight: 'bold',
        pb: 2,
        borderBottom: '2px solid',
        borderColor: 'divider'
      }}>
        🎯 Sélectionnez le coupable
      </DialogTitle>
      <DialogContent sx={{ pt: 3, mt: 2 }}>
        <List sx={{ py: 0 }} data-testid="accusation-player-list">
          {players.map((player) => (
            <ListItem key={player.id} disablePadding sx={{ mb: 1 }} data-testid={`accusation-player-${player.id}`}>
              <ListItemButton
                selected={selectedPlayer === player.id}
                onClick={() => onSelectPlayer(player.id)}
                sx={{
                  borderRadius: 1,
                  border: '2px solid',
                  borderColor: selectedPlayer === player.id ? 'error.main' : 'divider',
                  '&:hover': {
                    borderColor: 'error.light',
                    bgcolor: 'action.hover',
                  },
                  '&.Mui-selected': {
                    bgcolor: 'error.light',
                    color: 'error.contrastText',
                    '&:hover': {
                      bgcolor: 'error.main',
                    }
                  }
                }}
              >
                <Radio 
                  checked={selectedPlayer === player.id}
                  sx={{
                    color: selectedPlayer === player.id ? 'error.contrastText' : 'inherit',
                    '&.Mui-checked': {
                      color: 'error.contrastText',
                    }
                  }}
                />
                <ListItemText 
                  primary={player.name}
                  secondary={
                    player.occupation 
                      ? `${player.characterName} — ${player.occupation}`
                      : player.characterName
                  }
                  primaryTypographyProps={{
                    fontWeight: selectedPlayer === player.id ? 'bold' : 'normal',
                  }}
                  secondaryTypographyProps={{
                    sx: {
                      color: selectedPlayer === player.id ? 'error.contrastText' : 'text.secondary',
                      opacity: selectedPlayer === player.id ? 0.9 : 0.7,
                    }
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
        <Button 
          onClick={onClose} 
          disabled={submitting}
          variant="outlined"
          data-testid="accusation-cancel-button"
        >
          Annuler
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={!selectedPlayer || submitting}
          data-testid="accusation-confirm-button"
          sx={{
            bgcolor: '#d32f2f',
            '&:hover': {
              bgcolor: '#b71c1c',
            }
          }}
        >
          {submitting ? 'Accusation en cours...' : 'Accuser'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
