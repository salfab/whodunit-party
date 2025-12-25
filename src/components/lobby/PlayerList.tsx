'use client';

import { Typography, List, ListItem, ListItemText, Chip } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface Player {
  id: string;
  name: string;
}

interface PlayerListProps {
  players: Player[];
  currentPlayerId: string | null;
  readyStates: Map<string, boolean>;
  minPlayers: number;
}

export function PlayerList({ players, currentPlayerId, readyStates, minPlayers }: PlayerListProps) {
  return (
    <>
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }} data-testid="lobby-player-count">
        Joueurs ({players.length}/{minPlayers} minimum)
      </Typography>

      <List sx={{ mb: 3 }} data-testid="lobby-player-list">
        <AnimatePresence>
          {players.map((player) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              data-testid={`lobby-player-${player.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <ListItem
                secondaryAction={
                  readyStates.get(player.id) ? (
                    <CheckCircle color="success" data-testid={`lobby-player-ready-${player.name.toLowerCase().replace(/\s+/g, '-')}`} />
                  ) : null
                }
              >
                <ListItemText primary={player.name} />
                {player.id === currentPlayerId && (
                  <Chip label="Vous" color="primary" size="small" sx={{ mr: 1 }} data-testid="lobby-player-you-badge" />
                )}
              </ListItem>
            </motion.div>
          ))}
        </AnimatePresence>
      </List>
    </>
  );
}
