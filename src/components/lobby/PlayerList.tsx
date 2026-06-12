'use client';

import { Avatar, Typography, List, ListItem, Chip, IconButton, Tooltip, Box } from '@mui/material';
import { CheckCircle, Groups, PersonRemove, RadioButtonUnchecked } from '@mui/icons-material';
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
  // eslint-disable-next-line no-unused-vars -- type-level parameter names
  onRemovePlayer?: (playerId: string, playerName: string) => void;
}

export function PlayerList({ players, currentPlayerId, readyStates, minPlayers, onRemovePlayer }: PlayerListProps) {
  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          mb: 1,
          pt: 0.65,
          borderTop: '1px solid rgba(184, 150, 95, 0.18)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.9, color: 'info.light' }}>
          <Groups fontSize="small" />
          <Typography
            variant="subtitle2"
            sx={{
              textTransform: 'uppercase',
              fontWeight: 800,
              fontSize: { xs: '0.75rem', sm: '0.82rem' },
              color: 'info.light',
            }}
          >
            Joueurs
          </Typography>
        </Box>
        <Typography
          variant="subtitle2"
          color="text.primary"
          data-testid="lobby-player-count"
          sx={{ fontWeight: 800, fontSize: { xs: '0.75rem', sm: '0.82rem' }, whiteSpace: 'nowrap' }}
        >
          {players.length} / {minPlayers} minimum
        </Typography>
      </Box>

      <List
        disablePadding
        sx={{ display: 'grid', gap: 0.65 }}
        data-testid="lobby-player-list"
      >
        <AnimatePresence>
          {players.map((player) => {
            const isCurrentPlayer = player.id === currentPlayerId;
            const isReady = readyStates.get(player.id);
            const initials = player.name
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase())
              .join('');
            
            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                data-testid={`lobby-player-${player.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <ListItem
                  sx={{
                    minHeight: 50,
                    px: 1,
                    py: 0.9,
                    borderRadius: 1,
                    gap: 1,
                    bgcolor: isCurrentPlayer ? 'rgba(184, 150, 95, 0.08)' : 'rgba(7, 8, 10, 0.32)',
                    border: '1px solid',
                    borderColor: isCurrentPlayer ? 'rgba(184, 150, 95, 0.48)' : 'rgba(184, 150, 95, 0.2)',
                    boxShadow: isCurrentPlayer ? 'inset 0 0 24px rgba(184, 150, 95, 0.05)' : 'none',
                  }}
                >
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      flexShrink: 0,
                      color: 'text.primary',
                      bgcolor: 'rgba(184, 150, 95, 0.16)',
                      border: '1px solid rgba(184, 150, 95, 0.52)',
                      boxShadow: '0 8px 18px rgba(0, 0, 0, 0.32)',
                      fontSize: '0.9rem',
                      fontWeight: 800,
                    }}
                  >
                    {initials || '?'}
                  </Avatar>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 800,
                          fontSize: { xs: '0.9rem', sm: '0.98rem' },
                          color: 'text.primary',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {player.name}
                      </Typography>
                      {isCurrentPlayer && (
                        <Chip
                          label="Vous"
                          color="info"
                          size="small"
                          sx={{
                            height: 24,
                            fontSize: '0.72rem',
                            flexShrink: 0,
                          }}
                          data-testid="lobby-player-you-badge"
                        />
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
                    {isReady ? (
                      <CheckCircle
                        color="success"
                        sx={{ fontSize: 28 }}
                        data-testid={`lobby-player-ready-${player.name.toLowerCase().replace(/\s+/g, '-')}`}
                      />
                    ) : (
                      <RadioButtonUnchecked sx={{ color: 'rgba(241, 234, 217, 0.28)', fontSize: 28 }} />
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
                </ListItem>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </List>
    </>
  );
}
