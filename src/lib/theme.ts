import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#8b0000', // Dark blood red for mystery theme
      light: '#b71c1c',
      dark: '#5f0000',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ffd700', // Gold accent
      light: '#ffed4e',
      dark: '#c7a600',
      contrastText: '#000000',
    },
    error: {
      main: '#ff6b6b', // Bright red for errors/blood
    },
    background: {
      default: '#1a0000', // Very dark red, almost black
      paper: '#2d1010', // Dark red paper
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '3rem',
      fontWeight: 700,
      color: '#ff6b6b',
      textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
    },
    h2: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h5: {
      color: 'rgba(255, 255, 255, 0.7)',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage: 'url("/background.png")',
          backgroundSize: '100% auto',
          backgroundPosition: 'top center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 600,
          padding: '10px 24px',
          fontSize: '1rem',
        },
        contained: {
          backgroundColor: '#8b0000',
          border: '2px solid #ffd700',
          '&:hover': {
            backgroundColor: '#b71c1c',
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 8px rgba(255, 215, 0, 0.3)',
          },
          transition: 'all 0.2s ease-in-out',
        },
        outlined: {
          borderColor: '#ffd700',
          borderWidth: '2px',
          color: '#ffd700',
          '&:hover': {
            borderWidth: '2px',
            borderColor: '#ffed4e',
            backgroundColor: 'rgba(255, 215, 0, 0.1)',
            transform: 'translateY(-2px)',
          },
          transition: 'all 0.2s ease-in-out',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 215, 0, 0.2)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(45, 16, 16, 0.4)',
          backgroundImage: 'none',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 215, 0, 0.2)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'rgba(255, 215, 0, 0.3)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 215, 0, 0.5)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#ffd700',
            },
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: 'rgba(255, 255, 255, 0.7)',
          '&.Mui-focused': {
            color: '#ffd700', // Gold when focused instead of red
          },
        },
      },
    },
  },
});

export default theme;
