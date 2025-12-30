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

const languageFlags: Record<string, string> = {
  fr: '🇫🇷',
  en: '🇬🇧',
  es: '🇪🇸',
  de: '🇩🇪',
  it: '🇮🇹',
};

export default function MysteryCard({
  mystery,
  selected = false,
  voteCount = 0,
  showRadio = false,
  onClick,
}: MysteryCardProps) {
  const flag = mystery.language ? languageFlags[mystery.language] || '🌍' : '';
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
    flag,
    mystery.author && `par ${mystery.author}`,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <ListItem disablePadding sx={{ mb: { xs: 0.5, sm: 1 } }}>
      <ListItemButton
        onClick={onClick}
        selected={selected}
        sx={{
          border: selected ? '2px solid' : '1px solid',
          borderColor: selected ? 'primary.main' : 'divider',
          borderRadius: 1,
          px: { xs: 1.5, sm: 2 },
          py: { xs: 1, sm: 1.5 },
          '&:hover': {
            borderColor: 'primary.light',
          },
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          width: '100%', 
          gap: { xs: 0.5, sm: 2 },
        }}>
          {imageUrl && (
            <Box
              component="img"
              src={imageUrl}
              alt={mystery.title}
              sx={{
                width: { xs: '100%', sm: 80 },
                height: { xs: 'auto', sm: 60 },
                objectFit: 'cover',
                borderRadius: 1,
                flexShrink: 0,
              }}
            />
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
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  fontStyle: 'italic',
                  mb: 0.5,
                }}
              >
                {mystery.synopsis}
              </Typography>
            )}
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              {secondaryInfo}
            </Typography>
          </Box>
          <Chip
            label={`${voteCount} vote${voteCount !== 1 ? 's' : ''}`}
            color={voteCount > 0 ? 'primary' : 'default'}
            size="small"
            variant={voteCount > 0 ? 'filled' : 'outlined'}
            sx={{ 
              alignSelf: { xs: 'flex-end', sm: 'center' },
            }}
          />
        </Box>
      </ListItemButton>
    </ListItem>
  );
}

