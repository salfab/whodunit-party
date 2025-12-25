'use client';

import { Box, Chip, IconButton, Typography } from '@mui/material';
import { motion } from 'framer-motion';

interface CharacterRoleChipProps {
  role: 'investigator' | 'guilty' | 'innocent';
  roleRevealed: boolean;
  onToggleReveal: () => void;
}

export default function CharacterRoleChip({ role, roleRevealed, onToggleReveal }: CharacterRoleChipProps) {
  const getRoleColor = (r: string) => {
    switch (r) {
      case 'investigator': return 'primary';
      case 'guilty': return 'error';
      case 'innocent': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ textAlign: 'center', mb: 4 }} data-testid="play-role-section">
      {/* Always show Investigator or Suspect */}
      <Chip
        label={role === 'investigator' ? 'ENQUÊTEUR' : 'SUSPECT'}
        color={role === 'investigator' ? 'info' : 'default'}
        sx={{ fontSize: '1rem', px: 2, py: 1.5, mb: 2 }}
        data-testid="play-role-type"
      />
      
      {/* For suspects only: show guilty/innocent reveal */}
      {role !== 'investigator' && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mt: 2 }}>
            {roleRevealed && (
              <Chip
                label={role.toUpperCase()}
                color={getRoleColor(role) as any}
                sx={{ fontSize: '1rem', px: 2, py: 3 }}
                data-testid="play-role-revealed"
              />
            )}
            <IconButton 
              onClick={onToggleReveal}
              color={roleRevealed ? 'primary' : 'default'}
              sx={{ fontSize: '2rem' }}
              data-testid="play-role-reveal-button"
            >
              {roleRevealed ? (role === 'guilty' ? '😈' : '😇') : '❓'}
            </IconButton>
          </Box>
          {roleRevealed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }} data-testid="play-role-description">
                {role === 'guilty' ? 'Vous êtes COUPABLE' : 'Vous êtes INNOCENT'}
              </Typography>
            </motion.div>
          )}
        </Box>
      )}
    </Box>
  );
}
