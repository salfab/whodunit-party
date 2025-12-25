'use client';

import { Box, Typography, Paper, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface SecretPanelProps {
  title: string;
  emoji: string;
  content: string;
  visible: boolean;
  onToggleVisibility: () => void;
}

export default function SecretPanel({ title, emoji, content, visible, onToggleVisibility }: SecretPanelProps) {
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">{emoji} {title}</Typography>
        <IconButton onClick={onToggleVisibility} size="small">
          {visible ? <VisibilityOff /> : <Visibility />}
        </IconButton>
      </Box>
      <Paper
        elevation={1}
        sx={{
          p: 2,
          bgcolor: 'background.default',
          minHeight: '80px',
          filter: visible ? 'none' : 'blur(8px)',
          transition: 'filter 0.3s ease',
        }}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </Paper>
    </Box>
  );
}
