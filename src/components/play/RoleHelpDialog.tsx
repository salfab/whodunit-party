'use client';

import { Dialog, DialogTitle, DialogContent, IconButton, Box } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface RoleHelpDialogProps {
  open: boolean;
  onClose: () => void;
  helpContent: string;
}

export default function RoleHelpDialog({ open, onClose, helpContent }: RoleHelpDialogProps) {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          backgroundImage: 'none',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        color: 'primary.main',
        fontWeight: 600,
      }}>
        <Box component="span">Aide</Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{
          '& h1': {
            color: 'primary.main',
            fontSize: '1.5rem',
            fontWeight: 600,
            mb: 2,
            mt: 1,
          },
          '& h2': {
            color: 'primary.light',
            fontSize: '1.2rem',
            fontWeight: 600,
            mb: 2,
            mt: 3,
          },
          '& p': {
            color: 'text.primary',
            mb: 2,
            lineHeight: 1.6,
          },
          '& ol, & ul': {
            color: 'text.primary',
            pl: 3,
            mb: 2,
          },
          '& li': {
            mb: 1.5,
            lineHeight: 1.6,
          },
          '& strong': {
            color: 'primary.light',
            fontWeight: 700,
          },
          '& ul ul': {
            mt: 1,
            fontSize: '0.95rem',
            color: 'text.secondary',
          },
        }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {helpContent}
          </ReactMarkdown>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
