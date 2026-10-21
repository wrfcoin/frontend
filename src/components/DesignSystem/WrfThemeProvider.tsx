/**
 * WrfThemeProvider
 *
 * Design-system-level theme provider that wraps the existing WrfThemeProvider
 * from theme/ and adds system preference detection. This is the recommended
 * entry-point for applications consuming the design system.
 */

import React, { useEffect, useState } from 'react';
import { WrfThemeProvider as CoreThemeProvider, useThemeMode } from '../../theme/ThemeProvider';

type ThemeMode = 'dark' | 'light';

const STORAGE_KEY = 'wrfcoin-theme-mode';

function getSystemPreference(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function getInitialMode(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return getSystemPreference();
}

interface WrfThemeProviderProps {
  children: React.ReactNode;
  /** Override the initial mode (useful for Storybook / tests) */
  defaultMode?: ThemeMode;
}

/**
 * Listens for system color-scheme changes and syncs with user preference.
 * Must be rendered inside <CoreThemeProvider>.
 */
function SystemPreferenceSync() {
  const { setMode } = useThemeMode();

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: light)');

    const handler = (e: MediaQueryListEvent) => {
      // Only auto-switch if the user hasn't explicitly set a preference
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setMode(e.matches ? 'light' : 'dark');
      }
    };

    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [setMode]);

  return null;
}

export function WrfThemeProvider({ children, defaultMode }: WrfThemeProviderProps) {
  const [initialMode] = useState<ThemeMode>(() => defaultMode ?? getInitialMode());

  return (
    <CoreThemeProvider defaultMode={initialMode}>
      <SystemPreferenceSync />
      {children}
    </CoreThemeProvider>
  );
}

// Re-export the hook for convenience
export { useThemeMode } from '../../theme/ThemeProvider';
