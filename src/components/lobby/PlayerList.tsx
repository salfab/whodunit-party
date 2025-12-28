'use client';

import { Typography, List, ListItem, ListItemText, Chip, IconButton, Tooltip, Box } from '@mui/material';
import { CheckCircle, PersonRemove } from '@mui/icons-material';
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
  onRemovePlayer?: (playerId: string, playerName: string) => void;
}

export function PlayerList({ players, currentPlayerId, readyStates, minPlayers, onRemovePlayer }: PlayerListProps) {
  return (
    <>
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }} data-testid="lobby-player-count">
        Joueurs ({players.length}/{minPlayers} minimum)
      </Typography>

      <List sx={{ mb: 3 }} data-testid="lobby-player-list">
        <AnimatePresence>
          {players.map((player) => {
            const isCurrentPlayer = player.id === currentPlayerId;
            const isReady = readyStates.get(player.id);
            
            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                data-testid={`lobby-player-${player.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <ListItem
                  secondaryAction={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {isReady && (
                        <CheckCircle color="success" data-testid={`lobby-player-ready-${player.name.toLowerCase().replace(/\s+/g, '-')}`} />
                      )}
                      {!isCurrentPlayer && onRemovePlayer && (
                        <Tooltip title="Retirer ce joueur">
                          <IconButton
                            size="small"
                            onClick={() => onRemovePlayer(player.id, player.name)}
                            sx={{
                              color: 'text.secondary',
                              '&:hover': {
                                color: 'error.main',
                              },
                            }}
                            data-testid={`lobby-kick-${player.name.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            <PersonRemove fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  }
                >
                  <ListItemText primary={player.name} />
                  {isCurrentPlayer && (
                    <Chip label="Vous" color="primary" size="small" sx={{ mr: 1 }} data-testid="lobby-player-you-badge" />
                  )}
                </ListItem>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </List>
    </>
  );
}
