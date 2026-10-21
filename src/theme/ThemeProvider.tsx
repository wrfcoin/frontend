/**
 * WRFCoin Theme Provider
 *
 * Wraps MUI's ThemeProvider and CssBaseline, provides dark/light mode toggle
 * via React context, and syncs the body class for CSS variable compatibility
 * with the existing theme.css system.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { darkTheme, lightTheme } from './index';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ThemeMode = 'dark' | 'light';

interface ThemeModeContextValue {
  mode: ThemeMode;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ThemeModeContext = createContext<ThemeModeContextValue | undefined>(undefined);

const STORAGE_KEY = 'wrfcoin-theme-mode';
const LEGACY_STORAGE_KEY = 'darkMode';
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    // Ignore storage failures and keep runtime theme functional.
  }
}

function getInitialMode(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';

  const stored = safeGetItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;

  const legacyStored = safeGetItem(LEGACY_STORAGE_KEY);
  if (legacyStored === 'true') return 'dark';
  if (legacyStored === 'false') return 'light';

  // Default to dark mode per design spec
  return 'dark';
}

// ---------------------------------------------------------------------------
// Provider Component
// ---------------------------------------------------------------------------

interface WrfThemeProviderProps {
  children: React.ReactNode;
  /** Override the initial mode (useful for Storybook / tests) */
  defaultMode?: ThemeMode;
}

export function WrfThemeProvider({ children, defaultMode }: WrfThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(defaultMode ?? getInitialMode);

  const theme = useMemo(() => (mode === 'dark' ? darkTheme : lightTheme), [mode]);

  // Sync body classes for CSS variable compatibility with theme.css
  useIsomorphicLayoutEffect(() => {
    const body = document.body;

    // Always apply dashboard-v2 for the new CSS variable set
    body.classList.add('dashboard-v2');

    if (mode === 'dark') {
      body.classList.add('dark-mode');
      body.classList.remove('light-mode');
    } else {
      body.classList.add('light-mode');
      body.classList.remove('dark-mode');
    }
  }, [mode]);

  // Persist preference
  useEffect(() => {
    safeSetItem(STORAGE_KEY, mode);
    safeSetItem(LEGACY_STORAGE_KEY, String(mode === 'dark'));
  }, [mode]);

  const toggleMode = useCallback(() => {
    setModeState((prev: ThemeMode) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
  }, []);

  const contextValue = useMemo<ThemeModeContextValue>(
    () => ({ mode, toggleMode, setMode, isDark: mode === 'dark' }),
    [mode, toggleMode, setMode],
  );

  return (
    <ThemeModeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeModeContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Whether the dark theme is active, without requiring the provider: pages rendered on their
 * own (tests, Storybook) get the dark default, which is also the app's default.
 */
export function useIsDarkTheme(): boolean {
  const ctx = useContext(ThemeModeContext);
  return ctx ? ctx.isDark : true;
}

export function useThemeMode(): ThemeModeContextValue {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) {
    throw new Error('useThemeMode must be used within a <WrfThemeProvider>');
  }
  return ctx;
}
