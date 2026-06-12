'use client';

import { Box, Typography, Paper, List, ListItem, ListItemText, Chip } from '@mui/material';
import { DecoRubric } from '@/components/shared/DecoRubric';

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

export default function Scoreboard({ playerScores, currentPlayerId, title = 'Scores' }: ScoreboardProps) {
  const getRank = (index: number) => `${index + 1}.`;

  return (
    <Box sx={{ mt: 4 }}>
      <DecoRubric component="h2" align="center" sx={{ mb: 1.5 }}>
        {title}
      </DecoRubric>
      <Paper elevation={2} sx={{ p: { xs: 1, sm: 2 } }}>
        <List disablePadding>
          {playerScores.map((player, index) => (
            <ListItem
              key={player.id}
              sx={{
                px: 1,
                py: 1,
                borderRadius: 1,
                borderBottom: index < playerScores.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
                bgcolor: player.id === currentPlayerId ? 'rgba(143, 47, 50, 0.16)' : 'transparent',
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h6" sx={{ minWidth: '30px', color: 'secondary.light' }}>
                      {getRank(index)}
                    </Typography>
                    <Typography variant="body1" sx={{ flex: 1 }}>
                      {player.name} {player.id === currentPlayerId ? '(Vous)' : ''}
                    </Typography>
                    <Chip label={`${player.score} pts`} color="secondary" />
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
