'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
} from '@mui/material';

interface RemovePlayerDialogProps {
  open: boolean;
  playerName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function RemovePlayerDialog({
  open,
  playerName,
  onConfirm,
  onCancel,
  loading = false,
}: RemovePlayerDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} data-testid="remove-player-dialog">
      <DialogTitle data-testid="remove-player-dialog-title">Retirer un joueur</DialogTitle>
      <DialogContent>
        <DialogContentText data-testid="remove-player-dialog-content">
          Êtes-vous sûr de vouloir retirer <strong>{playerName}</strong> de la partie ?
        </DialogContentText>
        <DialogContentText sx={{ mt: 2, color: 'warning.main' }}>
          Cette action est irréversible. Le joueur devra rejoindre à nouveau pour participer.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={loading} data-testid="remove-player-cancel-button">
          Annuler
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
          data-testid="remove-player-confirm-button"
        >
          {loading ? 'Retrait...' : 'Retirer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
