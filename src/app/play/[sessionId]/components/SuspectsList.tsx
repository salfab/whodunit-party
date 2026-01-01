'use client';

import { Box, Typography, Card, CardMedia, CardContent, Chip } from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import type { SuspectInfo } from '../types';
import { getPlaceholderImage } from '../api';

interface SuspectsListProps {
  suspects: SuspectInfo[];
}

export default function SuspectsList({ suspects }: SuspectsListProps) {
  if (suspects.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Typography 
        variant="h5" 
        gutterBottom
        sx={{ 
          color: 'primary.main',
          fontWeight: 600,
          textShadow: '0 1px 3px rgba(0,0,0,0.5)',
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        🎭 Les Suspects
      </Typography>
      
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 2 
      }}>
        {suspects.map((suspect, index) => (
          <Card
            key={suspect.id}
            elevation={3}
            sx={{
              bgcolor: 'background.paper',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
              }
            }}
          >
            <CardMedia
              component="img"
              image={suspect.imagePath || getPlaceholderImage(index)}
              alt={suspect.characterName}
              sx={{ 
                height: 180,
                objectFit: 'cover',
              }}
            />
            
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 600,
                  color: 'primary.main',
                  lineHeight: 1.2,
                  mb: 0.5,
                }}
              >
                {suspect.characterName}
              </Typography>
              
              {suspect.occupation && (
                <Chip 
                  label={suspect.occupation} 
                  size="small" 
                  variant="outlined"
                  sx={{ 
                    borderColor: 'primary.light',
                    color: 'primary.light',
                    fontSize: '0.7rem',
                    height: 22,
                    mb: 0.5,
                  }}
                />
              )}
              
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ display: 'block' }}
              >
                {suspect.playerName}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
