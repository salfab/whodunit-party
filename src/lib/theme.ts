import { alpha, createTheme } from '@mui/material/styles';

const ink = '#07080a';
const graphite = '#11141a';
const graphiteRaised = '#181c23';
const ivory = '#f1ead9';
const mutedIvory = '#b8ad98';
const oxblood = '#8f2f32';
const brass = '#b8965f';
const tealGray = '#78939a';

const displayFont = '"Bahnschrift", "Aptos Display", "Segoe UI", "Helvetica Neue", Arial, sans-serif';
const uiFont = '"Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif';

const theme = createTheme({
  shape: {
    borderRadius: 8,
  },
  palette: {
    mode: 'dark',
    primary: {
      main: oxblood,
      light: '#b85b57',
      dark: '#5e1d22',
      contrastText: ivory,
    },
    secondary: {
      main: brass,
      light: '#d5bd88',
      dark: '#7e663e',
      contrastText: '#090a0c',
    },
    success: {
      main: '#7f9d84',
      light: '#a7c2aa',
      dark: '#4b694f',
    },
    info: {
      main: tealGray,
      light: '#9eb2b7',
      dark: '#52686e',
    },
    warning: {
      main: '#c0a16b',
      light: '#ddc58f',
      dark: '#83683d',
    },
    error: {
      main: '#b95353',
      light: '#da7b78',
      dark: '#772c30',
    },
    background: {
      default: ink,
      paper: graphite,
    },
    divider: alpha(brass, 0.22),
    text: {
      primary: ivory,
      secondary: mutedIvory,
      disabled: alpha(mutedIvory, 0.45),
    },
  },
  typography: {
    fontFamily: uiFont,
    h1: {
      fontFamily: displayFont,
      fontSize: 'clamp(2.25rem, 8vw, 4rem)',
      lineHeight: 0.98,
      fontWeight: 700,
      color: ivory,
      letterSpacing: 0,
      textShadow: '0 2px 22px rgba(0, 0, 0, 0.65)',
    },
    h2: {
      fontFamily: displayFont,
      fontSize: 'clamp(1.9rem, 6vw, 3rem)',
      lineHeight: 1.05,
      fontWeight: 700,
      color: ivory,
      letterSpacing: 0,
    },
    h3: {
      fontFamily: displayFont,
      fontSize: 'clamp(1.65rem, 5vw, 2.45rem)',
      lineHeight: 1.08,
      fontWeight: 700,
      color: ivory,
      letterSpacing: 0,
    },
    h4: {
      fontFamily: displayFont,
      fontSize: 'clamp(1.45rem, 4.5vw, 2rem)',
      lineHeight: 1.12,
      fontWeight: 700,
      color: ivory,
      letterSpacing: 0,
    },
    h5: {
      fontFamily: displayFont,
      fontSize: 'clamp(1.22rem, 4vw, 1.55rem)',
      lineHeight: 1.18,
      fontWeight: 700,
      color: ivory,
      letterSpacing: 0,
    },
    h6: {
      fontSize: '1rem',
      lineHeight: 1.3,
      fontWeight: 700,
      color: ivory,
      letterSpacing: 0,
    },
    subtitle1: {
      fontSize: '0.98rem',
      lineHeight: 1.45,
      fontWeight: 600,
      letterSpacing: 0,
    },
    subtitle2: {
      fontSize: '0.82rem',
      lineHeight: 1.35,
      fontWeight: 700,
      letterSpacing: 0,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.65,
      letterSpacing: 0,
    },
    body2: {
      fontSize: '0.88rem',
      lineHeight: 1.5,
      letterSpacing: 0,
    },
    button: {
      fontSize: '0.92rem',
      fontWeight: 700,
      letterSpacing: 0,
      textTransform: 'none',
    },
    caption: {
      fontSize: '0.76rem',
      lineHeight: 1.35,
      letterSpacing: 0,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          minHeight: '100svh',
          color: ivory,
          backgroundColor: ink,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(graphite, 0.78),
          backgroundImage:
            `linear-gradient(135deg, ${alpha('#ffffff', 0.055)} 0%, transparent 42%),
             linear-gradient(180deg, ${alpha(brass, 0.08)} 0%, transparent 38%)`,
          border: `1px solid ${alpha(brass, 0.26)}`,
          boxShadow: `0 28px 90px ${alpha('#000000', 0.52)}`,
          backdropFilter: 'blur(16px)',
        },
        outlined: {
          borderColor: alpha(brass, 0.22),
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: alpha(graphiteRaised, 0.9),
          border: `1px solid ${alpha(brass, 0.18)}`,
          boxShadow: `0 16px 48px ${alpha('#000000', 0.36)}`,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 44,
          borderRadius: 8,
          fontWeight: 700,
          padding: '10px 20px',
          transition: 'background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
          '&:focus-visible': {
            outline: `2px solid ${alpha(brass, 0.9)}`,
            outlineOffset: 2,
          },
        },
        contained: {
          backgroundColor: oxblood,
          color: ivory,
          border: `1px solid ${alpha(brass, 0.42)}`,
          boxShadow: `0 12px 32px ${alpha(oxblood, 0.25)}`,
          '&:hover': {
            backgroundColor: '#a64240',
            boxShadow: `0 16px 40px ${alpha(oxblood, 0.34)}`,
            transform: 'translateY(-1px)',
          },
          '&.Mui-disabled': {
            backgroundColor: alpha(graphiteRaised, 0.85),
            color: alpha(mutedIvory, 0.45),
            borderColor: alpha(brass, 0.12),
          },
        },
        outlined: {
          borderColor: alpha(brass, 0.46),
          color: ivory,
          backgroundColor: alpha('#000000', 0.12),
          '&:hover': {
            borderColor: brass,
            backgroundColor: alpha(brass, 0.08),
            transform: 'translateY(-1px)',
          },
        },
        text: {
          color: mutedIvory,
          '&:hover': {
            color: ivory,
            backgroundColor: alpha(brass, 0.08),
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: mutedIvory,
          borderRadius: 8,
          '&:hover': {
            color: ivory,
            backgroundColor: alpha(brass, 0.09),
          },
          '&:focus-visible': {
            outline: `2px solid ${alpha(brass, 0.9)}`,
            outlineOffset: 2,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 700,
          letterSpacing: 0,
        },
        outlined: {
          borderColor: alpha(brass, 0.34),
          color: ivory,
          backgroundColor: alpha('#000000', 0.12),
        },
        filled: {
          backgroundColor: alpha(oxblood, 0.88),
          color: ivory,
        },
        colorPrimary: {
          backgroundColor: alpha(oxblood, 0.9),
          color: ivory,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: alpha('#000000', 0.18),
            borderRadius: 8,
            '& fieldset': {
              borderColor: alpha(brass, 0.3),
            },
            '&:hover fieldset': {
              borderColor: alpha(brass, 0.55),
            },
            '&.Mui-focused fieldset': {
              borderColor: brass,
              boxShadow: `0 0 0 3px ${alpha(brass, 0.12)}`,
            },
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: mutedIvory,
          '&.Mui-focused': {
            color: brass,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          fontWeight: 700,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&.Mui-selected': {
            backgroundColor: alpha(oxblood, 0.18),
          },
          '&.Mui-selected:hover': {
            backgroundColor: alpha(oxblood, 0.24),
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: `1px solid ${alpha(brass, 0.18)}`,
          backgroundImage: 'none',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
          backgroundColor: graphite,
          backgroundImage:
            `linear-gradient(135deg, ${alpha('#ffffff', 0.035)} 0%, transparent 46%)`,
          border: `1px solid ${alpha(brass, 0.22)}`,
        },
      },
    },
  },
});

export default theme;
