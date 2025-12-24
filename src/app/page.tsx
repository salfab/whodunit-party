import { Box, Container, Typography, Button } from '@mui/material';

export default function Home() {
  return (
    <Container maxWidth="sm">
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
          Murder Mystery Party Game
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            href="/create-room"
            data-testid="create-room-button"
          >
            Create Room
          </Button>
          <Button
            variant="outlined"
            size="large"
            href="/join"
            data-testid="join-game-button"
          >
            Join Game
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
