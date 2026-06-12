'use client';

import {
  ListItem,
  ListItemButton,
  Box,
  Typography,
  Chip,
  Tooltip,
} from '@mui/material';

interface MysteryCardProps {
  mystery: {
    id: string;
    title: string;
    synopsis?: string;
    author?: string;
    character_count?: number;
    language?: string;
    cover_image_url?: string;
    image_path?: string;
  };
  selected?: boolean;
  voteCount?: number;
  showRadio?: boolean;
  onClick?: () => void;
}

const languageLabels: Record<string, string> = {
  fr: 'FR',
  en: 'EN',
  es: 'ES',
  de: 'DE',
  it: 'IT',
};

export default function MysteryCard({
  mystery,
  selected = false,
  voteCount = 0,
  showRadio = false,
  onClick,
}: MysteryCardProps) {
  const language = mystery.language
    ? languageLabels[mystery.language] || mystery.language.toUpperCase()
    : '';
  const imageUrl = mystery.cover_image_url || mystery.image_path;

  const titleDisplay = (
    <Typography 
      variant="body1" 
      fontWeight="medium"
      sx={{
        fontSize: { xs: '0.95rem', sm: '1rem' },
        overflow: { xs: 'visible', sm: 'hidden' },
        textOverflow: { xs: 'clip', sm: 'ellipsis' },
        whiteSpace: { xs: 'normal', sm: 'nowrap' },
      }}
    >
      {mystery.title}
    </Typography>
  );

  const secondaryInfo = [
    mystery.character_count && `${mystery.character_count} joueurs`,
    language,
    mystery.author && `par ${mystery.author}`,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <ListItem disablePadding sx={{ mb: { xs: 0.5, sm: 1 } }}>
      <ListItemButton
        onClick={onClick}
        selected={selected}
        data-testid={`mystery-card-${mystery.id}`}
        data-voted={selected ? 'true' : 'false'}
        aria-disabled={selected && showRadio ? 'true' : 'false'}
        sx={{
          border: '1px solid',
          borderColor: selected ? 'secondary.main' : 'divider',
          borderRadius: 1,
          px: { xs: 1, sm: 1.5 },
          py: { xs: 1, sm: 1.25 },
          bgcolor: selected ? 'rgba(143, 47, 50, 0.18)' : 'rgba(7, 8, 10, 0.2)',
          boxShadow: selected ? '0 0 0 1px rgba(184, 150, 95, 0.32)' : 'none',
          '&:hover': {
            borderColor: selected ? 'secondary.light' : 'secondary.dark',
            bgcolor: selected ? 'rgba(143, 47, 50, 0.22)' : 'rgba(184, 150, 95, 0.06)',
          },
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'flex-start' },
          width: '100%', 
          gap: { xs: 1.25, sm: 1.75 },
        }}>
          {imageUrl && (
            <Box
              sx={{
                width: { xs: '100%', sm: 80 },
                minWidth: { sm: 168 },
                maxWidth: { sm: 188 },
                aspectRatio: '3 / 2',
                borderRadius: 1,
                flexShrink: 0,
                bgcolor: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid',
                borderColor: selected ? 'rgba(184, 150, 95, 0.56)' : 'rgba(184, 150, 95, 0.18)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 0.25,
              }}
            >
              <Box
                component="img"
                src={imageUrl}
                alt={mystery.title}
                sx={{
                  display: 'block',
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  borderRadius: '5px',
                }}
              />
            </Box>
          )}
          <Box sx={{ flex: 1 }}>
            {mystery.title.length > 30 ? (
              <Tooltip title={mystery.title} placement="top">
                {titleDisplay}
              </Tooltip>
            ) : (
              titleDisplay
            )}
            {mystery.synopsis && (
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  fontSize: { xs: '0.82rem', sm: '0.875rem' },
                  mb: 0.75,
                  mt: 0.35,
                  display: '-webkit-box',
                  WebkitLineClamp: { xs: 3, sm: 2 },
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {mystery.synopsis}
              </Typography>
            )}
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.78rem', sm: '0.84rem' } }}
            >
              {secondaryInfo}
            </Typography>
          </Box>
          <Chip
            label={`${voteCount} vote${voteCount !== 1 ? 's' : ''}`}
            color={voteCount > 0 ? 'secondary' : 'default'}
            size="small"
            variant={voteCount > 0 ? 'filled' : 'outlined'}
            data-testid="vote-count"
            sx={{ 
              alignSelf: { xs: 'flex-start', sm: 'flex-start' },
              flexShrink: 0,
            }}
          />
        </Box>
      </ListItemButton>
    </ListItem>
  );
}


