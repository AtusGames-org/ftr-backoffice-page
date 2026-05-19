import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import './index.css';
import App from './App.tsx';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#f5b44a' },
    secondary: { main: '#6ae4ff' },
    background: { default: '#0a0a12', paper: '#141320' },
  },
  typography: {
    fontFamily: '"Source Sans 3", "Space Grotesk", system-ui, sans-serif',
    h1: { fontFamily: '"Space Grotesk", "Source Sans 3", system-ui, sans-serif' },
    h2: { fontFamily: '"Space Grotesk", "Source Sans 3", system-ui, sans-serif' },
    h3: { fontFamily: '"Space Grotesk", "Source Sans 3", system-ui, sans-serif' },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiTextField: {
      defaultProps: {
        fullWidth: true,
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
);
