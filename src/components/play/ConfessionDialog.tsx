'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
} from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ConfessionDialogProps {
  open: boolean;
  onClose: () => void;
  darkSecret: string;
}

const goldAccent = '#e4c98b';

export default function ConfessionDialog({
  open,
  onClose,
  darkSecret,
}: ConfessionDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={false}
      data-testid="confession-dialog"
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
          borderRadius: { xs: '16px 16px 0 0', sm: 3 },
          border: `2px solid ${goldAccent}`,
          borderBottom: { xs: 'none', sm: `2px solid ${goldAccent}` },
          overflow: 'hidden',
          m: { xs: 0, sm: 2 },
          maxHeight: { xs: '85vh', sm: '90vh' },
          width: { xs: '100%', sm: undefined },
        }
      }}
      BackdropProps={{
        sx: {
          bgcolor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
        }
      }}
    >
      {/* Gold accent top bar */}
      <Box
        sx={{
          height: 4,
          background: `linear-gradient(90deg, transparent, ${goldAccent}, transparent)`,
        }}
      />
      
      <DialogTitle 
        sx={{ 
          textAlign: 'center',
          pt: 3,
          pb: 1,
        }}
      >
        <Typography
          variant="h4"
          component="span"
          sx={{
            fontWeight: 700,
            color: goldAccent,
            textShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}
        >
          🎭 Vos Aveux
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{
            display: 'block',
            mt: 1,
            color: 'text.secondary',
            fontStyle: 'italic',
          }}
        >
          Lisez à voix haute...
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ px: { xs: 2, sm: 4 }, py: 3 }}>
        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 2,
            border: `1px solid ${goldAccent}40`,
            bgcolor: 'rgba(228, 201, 139, 0.05)',
            '& p, & li, & span': {
              color: 'text.primary',
              fontSize: { xs: '1.05rem', sm: '1.15rem' },
              lineHeight: 1.7,
            },
            '& p': {
              mb: 2,
            },
            '& p:last-child': {
              mb: 0,
            },
            '& strong': {
              color: goldAccent,
            },
          }}
          data-testid="confession-secret"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {darkSecret}
          </ReactMarkdown>
        </Box>
      </DialogContent>

      {/* Gold accent bottom bar */}
      <Box
        sx={{
          height: 1,
          background: `linear-gradient(90deg, transparent, ${goldAccent}60, transparent)`,
          mx: { xs: 2, sm: 4 },
        }}
      />

      <DialogActions sx={{ justifyContent: 'center', pb: 3, pt: 2 }}>
        <Button
          onClick={onClose}
          variant="contained"
          size="large"
          data-testid="confession-close-button"
          sx={{
            px: 4,
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 600,
            bgcolor: goldAccent,
            color: '#1a1a2e',
            borderRadius: 2,
            textTransform: 'none',
            boxShadow: `0 4px 14px rgba(228, 201, 139, 0.4)`,
            '&:hover': {
              bgcolor: '#d4b97b',
              boxShadow: `0 6px 20px rgba(228, 201, 139, 0.5)`,
            },
          }}
        >
          J&apos;ai tout avoué
        </Button>
      </DialogActions>
    </Dialog>
  );
}
