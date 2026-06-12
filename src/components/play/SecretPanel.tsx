'use client';

import { Box, Paper, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { DecoRubric } from '@/components/shared/DecoRubric';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface SecretPanelProps {
  title: string;
  emoji?: string;
  content: string;
  visible: boolean;
  onToggleVisibility: () => void;
}

export default function SecretPanel({ title, emoji, content, visible, onToggleVisibility }: SecretPanelProps) {
  return (
    <Box sx={{ mb: 4 }} data-testid={`play-secret-panel-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <DecoRubric component="h2">
          {emoji ? `${emoji} ` : ''}{title}
        </DecoRubric>
        <IconButton onClick={onToggleVisibility} size="small" data-testid={`play-secret-toggle-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          {visible ? <VisibilityOff /> : <Visibility />}
        </IconButton>
      </Box>
      <Paper
        elevation={1}
        sx={{
          p: 2,
          bgcolor: 'rgba(7, 8, 10, 0.32)',
          minHeight: '80px',
          borderColor: 'divider',
          filter: visible ? 'none' : 'blur(7px)',
          transition: 'filter 0.3s ease',
          '& p, & li, & span': {
            color: 'text.primary',
          },
          '& strong': {
            color: 'secondary.light',
            fontWeight: 700,
          },
        }}
        data-testid={`play-secret-content-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </Paper>
    </Box>
  );
}
