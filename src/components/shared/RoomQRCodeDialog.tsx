'use client';

import { Dialog, DialogTitle, DialogContent, Box, Typography, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';

interface RoomQRCodeDialogProps {
  open: boolean;
  onClose: () => void;
  joinCode: string;
}

export default function RoomQRCodeDialog({ open, onClose, joinCode }: RoomQRCodeDialogProps) {
  const roomUrl = typeof window !== 'undefined' ? `${window.location.origin}/join?code=${joinCode}` : '';

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
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
        pb: 1,
        borderBottom: '2px solid',
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        Rejoindre la partie
        <IconButton 
          onClick={onClose} 
          size="small"
          sx={{ color: 'text.secondary' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, py: 2 }}>
          <Box
            sx={{
              p: 2,
              bgcolor: 'white',
              borderRadius: 2,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <QRCodeSVG value={roomUrl} size={250} level="H" />
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" color="secondary.main" gutterBottom>
              Code: {joinCode}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Scannez ce QR code pour rejoindre ou revenir dans la partie
            </Typography>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
