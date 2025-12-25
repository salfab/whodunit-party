'use client';

import { Box, Container, Typography, Button, IconButton } from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import Link from 'next/link';

export default function Home() {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
        }}
      >
        <IconButton
          component={Link}
          href="/admin/mysteries"
          color="primary"
          size="large"
          aria-label="Admin console"
        >
          <SettingsIcon />
        </IconButton>
      </Box>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <Typography variant="h2" component="h1" textAlign="center">
          🔍 Whodunit Party
        </Typography>
        <Typography variant="h5" textAlign="center" color="text.secondary">
          Jeu de mystère et de meurtre
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            href="/create-room"
            data-testid="create-room-button"
          >
            Créer une salle
          </Button>
          <Button
            variant="outlined"
            size="large"
            href="/join"
            data-testid="join-game-button"
          >
            Rejoindre une partie
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
