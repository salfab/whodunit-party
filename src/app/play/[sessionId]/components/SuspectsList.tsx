'use client';

import { Box, Typography, Card, CardMedia, CardContent, Chip } from '@mui/material';
import { DecoRubric } from '@/components/shared/DecoRubric';
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
      <DecoRubric component="h2" sx={{ mb: 2.5 }}>
        Les suspects
      </DecoRubric>
      
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fill, minmax(190px, 1fr))' },
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
            <Box
              sx={{
                aspectRatio: '3 / 2',
                bgcolor: 'rgba(0, 0, 0, 0.32)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 0.5,
              }}
            >
              <CardMedia
                component="img"
                image={suspect.imagePath || getPlaceholderImage(index)}
                alt={suspect.characterName}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  borderRadius: '5px',
                }}
              />
            </Box>
            
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 600,
                  color: 'secondary.light',
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
                    borderColor: 'secondary.dark',
                    color: 'text.primary',
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
