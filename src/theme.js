import { createTheme } from '@mui/material/styles';

/**
 * Service Pilot admin design system.
 * Cool slate surfaces + ink text + field teal for live/ops signals.
 * Avoid purple gradients and generic AI dashboard tropes.
 */
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0F4C81',
      light: '#3B7AB0',
      dark: '#0A355A',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#0D9488',
      light: '#2DD4BF',
      dark: '#0F766E',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#059669',
      light: '#34D399',
      dark: '#047857',
    },
    warning: {
      main: '#D97706',
      light: '#FBBF24',
      dark: '#B45309',
    },
    error: {
      main: '#DC2626',
      light: '#F87171',
      dark: '#B91C1C',
    },
    info: {
      main: '#0284C7',
    },
    background: {
      default: '#F3F5F8',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0B1726',
      secondary: '#5B6B7C',
      disabled: '#94A3B8',
    },
    divider: 'rgba(15, 35, 55, 0.08)',
    action: {
      hover: 'rgba(15, 76, 129, 0.06)',
      selected: 'rgba(15, 76, 129, 0.1)',
    },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Segoe UI", sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700, letterSpacing: '-0.015em' },
    h4: { fontWeight: 700, letterSpacing: '-0.015em', fontSize: '1.5rem' },
    h5: { fontWeight: 650, letterSpacing: '-0.01em' },
    h6: { fontWeight: 650, letterSpacing: '-0.01em' },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600, fontSize: '0.8125rem' },
    body1: { fontSize: '0.9375rem', lineHeight: 1.55 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.5 },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.01em' },
    caption: { fontSize: '0.75rem', lineHeight: 1.4, color: '#5B6B7C' },
    overline: {
      fontSize: '0.6875rem',
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    },
  },
  shape: {
    borderRadius: 10,
  },
  shadows: [
    'none',
    '0 1px 2px rgba(11, 23, 38, 0.04)',
    '0 1px 3px rgba(11, 23, 38, 0.06), 0 1px 2px rgba(11, 23, 38, 0.04)',
    '0 4px 12px rgba(11, 23, 38, 0.06)',
    '0 8px 24px rgba(11, 23, 38, 0.08)',
    '0 12px 32px rgba(11, 23, 38, 0.1)',
    '0 16px 40px rgba(11, 23, 38, 0.1)',
    '0 20px 48px rgba(11, 23, 38, 0.12)',
    '0 24px 56px rgba(11, 23, 38, 0.12)',
    '0 24px 56px rgba(11, 23, 38, 0.12)',
    '0 24px 56px rgba(11, 23, 38, 0.12)',
    '0 24px 56px rgba(11, 23, 38, 0.12)',
    '0 24px 56px rgba(11, 23, 38, 0.12)',
    '0 24px 56px rgba(11, 23, 38, 0.12)',
    '0 24px 56px rgba(11, 23, 38, 0.12)',
    '0 24px 56px rgba(11, 23, 38, 0.12)',
    '0 24px 56px rgba(11, 23, 38, 0.12)',
    '0 24px 56px rgba(11, 23, 38, 0.12)',
    '0 24px 56px rgba(11, 23, 38, 0.12)',
    '0 24px 56px rgba(11, 23, 38, 0.12)',
    '0 24px 56px rgba(11, 23, 38, 0.12)',
    '0 24px 56px rgba(11, 23, 38, 0.12)',
    '0 24px 56px rgba(11, 23, 38, 0.12)',
    '0 24px 56px rgba(11, 23, 38, 0.12)',
    '0 24px 56px rgba(11, 23, 38, 0.12)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#F3F5F8',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          paddingInline: 14,
          minHeight: 36,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        outlined: {
          borderColor: 'rgba(15, 35, 55, 0.14)',
          '&:hover': {
            borderColor: 'rgba(15, 76, 129, 0.4)',
            backgroundColor: 'rgba(15, 76, 129, 0.04)',
          },
        },
        sizeSmall: {
          minHeight: 32,
          fontSize: '0.8125rem',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(11, 23, 38, 0.06), 0 1px 2px rgba(11, 23, 38, 0.04)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid rgba(15, 35, 55, 0.08)',
          boxShadow: '0 1px 2px rgba(11, 23, 38, 0.04)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 6,
        },
        sizeSmall: {
          height: 22,
          fontSize: '0.6875rem',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: '#FFFFFF',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid rgba(15, 35, 55, 0.08)',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#0B1726',
          fontSize: '0.75rem',
          borderRadius: 6,
        },
      },
    },
  },
});

export default theme;
