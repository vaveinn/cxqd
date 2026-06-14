import { createTheme } from '@mui/material/styles';
import { darkPalette, lightPalette } from './palette';

export const createAppTheme = (mode: 'dark' | 'light') => {
  const p = mode === 'dark' ? darkPalette : lightPalette;

  return createTheme({
    palette: {
      mode,
      primary: {
        main: p.primary,
        light: p.accent,
        dark: mode === 'dark' ? '#059669' : '#047857',
      },
      background: {
        default: p.bg,
        paper: p.surface,
      },
      text: {
        primary: p.text,
        secondary: p.textMuted,
      },
      error: {
        main: p.danger,
      },
      warning: {
        main: p.warning,
      },
      success: {
        main: p.cta,
      },
      divider: p.border,
    },
    typography: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      h1: { fontWeight: 300, fontSize: '2.5rem' },
      h2: { fontWeight: 400, fontSize: '2rem' },
      h3: { fontWeight: 500, fontSize: '1.5rem' },
      h4: { fontWeight: 500, fontSize: '1.25rem' },
      h5: { fontWeight: 600, fontSize: '1.1rem' },
      h6: { fontWeight: 600, fontSize: '1rem' },
      body1: { fontWeight: 400, fontSize: '1rem' },
      body2: { fontWeight: 400, fontSize: '0.875rem' },
      button: { fontWeight: 600, textTransform: 'none' },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: p.bg,
            transition: 'background-color 300ms ease',
          },
          '*': {
            scrollbarWidth: 'thin',
            scrollbarColor: `${p.border} transparent`,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            transition: 'background-color 300ms ease, box-shadow 300ms ease',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            backgroundColor: p.glassBg,
            border: `1px solid ${p.glassBorder}`,
            borderRadius: 16,
            boxShadow: mode === 'dark'
              ? '0 4px 24px rgba(0, 0, 0, 0.3)'
              : '0 4px 24px rgba(0, 0, 0, 0.08)',
            transition: 'all 300ms ease',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: p.sidebar,
            borderRight: 'none',
            backgroundImage: 'none',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            backgroundColor: mode === 'dark'
              ? 'rgba(14, 35, 24, 0.75)'
              : 'rgba(240, 253, 244, 0.75)',
            borderBottom: `1px solid ${p.glassBorder}`,
            boxShadow: 'none',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            padding: '10px 24px',
            fontWeight: 600,
            transition: 'all 200ms ease',
          },
          containedPrimary: {
            backgroundColor: p.primary,
            '&:hover': {
              backgroundColor: p.accent,
              boxShadow: `0 4px 16px ${p.primary}40`,
              transform: 'translateY(-1px)',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
              transition: 'all 200ms ease',
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: p.primary,
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: p.accent,
                borderWidth: 2,
              },
            },
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            margin: '2px 8px',
            transition: 'all 200ms ease',
            '&.Mui-selected': {
              backgroundColor: `${p.primary}25`,
              borderLeft: `3px solid ${p.primary}`,
              '&:hover': {
                backgroundColor: `${p.primary}35`,
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 500,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${p.border}`,
          },
        },
      },
    },
  });
};
