'use client';

import {
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  Radio,
  Box,
} from '@mui/material';

interface MysteryCardProps {
  mystery: {
    id: string;
    title: string;
    author?: string;
    character_count?: number;
    language?: string;
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
  
  const secondaryText = [
    mystery.character_count && `${mystery.character_count} joueurs`,
    flag,
    mystery.author && `par ${mystery.author}`,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <ListItem disablePadding sx={{ mb: 1 }}>
      <ListItemButton
        onClick={onClick}
        selected={selected}
        sx={{
          border: selected ? '2px solid' : '1px solid',
          borderColor: selected ? 'primary.main' : 'divider',
          borderRadius: 1,
        }}
      >
        {showRadio && <Radio checked={selected} sx={{ mr: 1 }} />}
        <ListItemText
          primary={mystery.title}
          secondary={secondaryText || (voteCount > 0 ? `${voteCount} vote(s)` : '0 vote')}
        />
        <Chip
          label={`${voteCount} vote${voteCount !== 1 ? 's' : ''}`}
          color={voteCount > 0 ? 'primary' : 'default'}
          size="small"
          variant={voteCount > 0 ? 'filled' : 'outlined'}
        />
      </ListItemButton>
    </ListItem>
  );
}
