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

interface TakeoverDialogProps {
  open: boolean;
  playerName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function TakeoverDialog({
  open,
  playerName,
  onConfirm,
  onCancel,
  loading = false,
}: TakeoverDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} data-testid="takeover-dialog">
      <DialogTitle data-testid="takeover-dialog-title">Nom déjà utilisé</DialogTitle>
      <DialogContent data-testid="takeover-dialog-content">
        <DialogContentText>
          Un joueur nommé <strong>{playerName}</strong> existe déjà dans cette partie.
        </DialogContentText>
        <DialogContentText sx={{ mt: 2 }}>
          Si c'est vous, vous pouvez reprendre votre session précédente. Cela vous reconnectera 
          avec votre personnage et vos scores.
        </DialogContentText>
        <DialogContentText sx={{ mt: 2, color: 'warning.main' }}>
          ⚠️ Si quelqu'un d'autre utilisait ce nom, il sera déconnecté.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={loading} data-testid="takeover-cancel-button">
          Choisir un autre nom
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
          data-testid="takeover-confirm-button"
        >
          {loading ? 'Connexion...' : 'Reprendre ma session'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
