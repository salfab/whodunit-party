'use client';

import { Box, Typography, Paper, Avatar, Chip } from '@mui/material';
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
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {suspects.map((suspect, index) => (
          <Paper
            key={suspect.id}
            elevation={2}
            sx={{
              p: 2,
              display: 'flex',
              gap: 2,
              alignItems: 'flex-start',
              bgcolor: 'background.paper',
              borderLeft: '4px solid',
              borderColor: 'primary.main',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateX(4px)',
                boxShadow: 4,
              }
            }}
          >
            <Avatar
              src={suspect.imagePath || getPlaceholderImage(index)}
              alt={suspect.characterName}
              sx={{ 
                width: 64, 
                height: 64,
                border: '2px solid',
                borderColor: 'primary.main',
              }}
            >
              <PersonIcon />
            </Avatar>
            
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    color: 'primary.main',
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
                      fontSize: '0.75rem'
                    }}
                  />
                )}
              </Box>
              
              <Typography 
                variant="body2" 
                color="text.secondary"
              >
                Joué par: <strong>{suspect.playerName}</strong>
              </Typography>
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
