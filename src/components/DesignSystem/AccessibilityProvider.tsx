/**
 * AccessibilityProvider
 *
 * Provides accessibility utilities for the WRFCoin design system:
 * - Skip to main content link
 * - Focus-visible ring styling
 * - ARIA live region for screen-reader announcements
 * - High contrast mode detection
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface A11yContextValue {
  /** Announce a message to screen readers via ARIA live region */
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  /** Whether the user has high contrast mode enabled */
  isHighContrast: boolean;
  /** Whether the user prefers reduced motion */
  isReducedMotion: boolean;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const A11yContext = createContext<A11yContextValue | undefined>(undefined);

export function useAccessibility(): A11yContextValue {
  const ctx = useContext(A11yContext);
  if (!ctx) {
    throw new Error('useAccessibility must be used within <AccessibilityProvider>');
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Global styles (injected once)
// ---------------------------------------------------------------------------

const A11Y_STYLES_ID = 'wrf-a11y-styles';

const a11yCSS = `
/* Skip link - visually hidden until focused */
.wrf-skip-link {
  position: absolute;
  left: -10000px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
  z-index: 2000;
  padding: 12px 24px;
  background: #3B82F6;
  color: #fff;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  border-radius: 0 0 8px 0;
}

.wrf-skip-link:focus {
  position: fixed;
  left: 0;
  top: 0;
  width: auto;
  height: auto;
  outline: 3px solid #60A5FA;
  outline-offset: 2px;
}

/* Focus-visible ring - consistent across all interactive elements */
*:focus-visible {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
}

/* ARIA live region - visually hidden */
.wrf-live-region {
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}
`;

function ensureA11yStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(A11Y_STYLES_ID)) return;
  const style = document.createElement('style');
  style.id = A11Y_STYLES_ID;
  style.textContent = a11yCSS;
  document.head.appendChild(style);
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export interface AccessibilityProviderProps {
  /** The ID of the main content element for skip-link targeting (default: "main-content") */
  mainContentId?: string;
  children: React.ReactNode;
}

export function AccessibilityProvider({
  mainContentId = 'main-content',
  children,
}: AccessibilityProviderProps) {
  const politeRef = useRef<HTMLDivElement>(null);
  const assertiveRef = useRef<HTMLDivElement>(null);

  // Inject global a11y styles
  useEffect(() => { ensureA11yStyles(); }, []);

  // High contrast detection
  const [isHighContrast, setIsHighContrast] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(forced-colors: active)').matches;
  });

  useEffect(() => {
    const mql = window.matchMedia('(forced-colors: active)');
    const handler = (e: MediaQueryListEvent) => setIsHighContrast(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // Reduced motion detection
  const [isReducedMotion, setIsReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // ARIA live region announcements
  const announce = useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      const target = priority === 'assertive' ? assertiveRef.current : politeRef.current;
      if (!target) return;

      // Clear and re-set to trigger screen reader announcement
      target.textContent = '';
      requestAnimationFrame(() => {
        target.textContent = message;
      });
    },
    [],
  );

  const contextValue = useMemo<A11yContextValue>(
    () => ({ announce, isHighContrast, isReducedMotion }),
    [announce, isHighContrast, isReducedMotion],
  );

  return (
    <A11yContext.Provider value={contextValue}>
      {/* Skip to main content link */}
      <a className="wrf-skip-link" href={`#${mainContentId}`}>
        Skip to main content
      </a>

      {/* ARIA live regions */}
      <Box
        ref={politeRef}
        className="wrf-live-region"
        aria-live="polite"
        aria-atomic="true"
        role="status"
      />
      <Box
        ref={assertiveRef}
        className="wrf-live-region"
        aria-live="assertive"
        aria-atomic="true"
        role="alert"
      />

      {children}
    </A11yContext.Provider>
  );
}
