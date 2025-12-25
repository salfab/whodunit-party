'use client';

import { Box, Typography, Paper, List, ListItem, ListItemText, Chip } from '@mui/material';

interface PlayerScore {
  id: string;
  name: string;
  score: number;
}

interface ScoreboardProps {
  playerScores: PlayerScore[];
  currentPlayerId?: string;
  title?: string;
}

export default function Scoreboard({ playerScores, currentPlayerId, title = '🏆 Scores' }: ScoreboardProps) {
  const getMedal = (index: number) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `${index + 1}.`;
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom align="center">
        {title}
      </Typography>
      <Paper elevation={2} sx={{ p: 3 }}>
        <List>
          {playerScores.map((player, index) => (
            <ListItem
              key={player.id}
              sx={{
                borderBottom: index < playerScores.length - 1 ? '1px solid #eee' : 'none',
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h6" sx={{ minWidth: '30px' }}>
                      {getMedal(index)}
                    </Typography>
                    <Typography variant="body1" sx={{ flex: 1 }}>
                      {player.name} {player.id === currentPlayerId ? '(Vous)' : ''}
                    </Typography>
                    <Chip label={`${player.score} pts`} color="primary" />
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
}
