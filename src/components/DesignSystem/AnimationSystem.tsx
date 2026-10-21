/**
 * AnimationSystem
 *
 * CSS-keyframe-based animation presets for the WRFCoin design system.
 * Respects `prefers-reduced-motion` automatically.
 * No external animation library required.
 */

import React, { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';

// ---------------------------------------------------------------------------
// Keyframe definitions (injected once via <style>)
// ---------------------------------------------------------------------------

const KEYFRAMES_ID = 'wrf-animation-keyframes';

const keyframesCSS = `
@keyframes wrfFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes wrfSlideUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes wrfSlideDown {
  from { opacity: 0; transform: translateY(-16px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes wrfScaleIn {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .wrf-animate {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`;

function ensureKeyframes() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(KEYFRAMES_ID)) return;
  const style = document.createElement('style');
  style.id = KEYFRAMES_ID;
  style.textContent = keyframesCSS;
  document.head.appendChild(style);
}

// ---------------------------------------------------------------------------
// Animation presets
// ---------------------------------------------------------------------------

export type AnimationPreset = 'fadeIn' | 'slideUp' | 'slideDown' | 'scaleIn';

const animationNames: Record<AnimationPreset, string> = {
  fadeIn: 'wrfFadeIn',
  slideUp: 'wrfSlideUp',
  slideDown: 'wrfSlideDown',
  scaleIn: 'wrfScaleIn',
};

// ---------------------------------------------------------------------------
// useReducedMotion hook
// ---------------------------------------------------------------------------

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return reduced;
}

// ---------------------------------------------------------------------------
// <Animate> component
// ---------------------------------------------------------------------------

export interface AnimateProps {
  /** Which animation preset to apply */
  preset?: AnimationPreset;
  /** Duration in ms (default 250) */
  duration?: number;
  /** Delay in ms (default 0) */
  delay?: number;
  /** Easing function */
  easing?: string;
  /** CSS fill-mode (default 'both') */
  fillMode?: string;
  children: React.ReactNode;
  className?: string;
  sx?: SxProps<Theme>;
}

export function Animate({
  preset = 'fadeIn',
  duration = 250,
  delay = 0,
  easing = 'cubic-bezier(0.4, 0, 0.2, 1)',
  fillMode = 'both',
  children,
  className,
  sx,
}: AnimateProps) {
  useEffect(() => { ensureKeyframes(); }, []);

  return (
    <Box
      className={`wrf-animate ${className ?? ''}`}
      sx={[
        {
          animation: `${animationNames[preset]} ${duration}ms ${easing} ${delay}ms ${fillMode}`,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ] as SxProps<Theme>}
    >
      {children}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// <StaggerChildren> component
// ---------------------------------------------------------------------------

export interface StaggerChildrenProps {
  /** Animation preset for each child */
  preset?: AnimationPreset;
  /** Duration per child in ms */
  duration?: number;
  /** Delay between each child in ms (default 50) */
  staggerDelay?: number;
  /** Initial delay before first child in ms */
  initialDelay?: number;
  children: React.ReactNode;
  className?: string;
  sx?: SxProps<Theme>;
}

export function StaggerChildren({
  preset = 'slideUp',
  duration = 250,
  staggerDelay = 50,
  initialDelay = 0,
  children,
  className,
  sx,
}: StaggerChildrenProps) {
  useEffect(() => { ensureKeyframes(); }, []);
  const reducedMotion = useReducedMotion();

  const childArray = React.Children.toArray(children);

  return (
    <Box className={className} sx={sx}>
      {childArray.map((child, index) => (
        <Box
          key={index}
          className="wrf-animate"
          sx={{
            animation: reducedMotion
              ? 'none'
              : `${animationNames[preset]} ${duration}ms cubic-bezier(0.4, 0, 0.2, 1) ${initialDelay + index * staggerDelay}ms both`,
            opacity: reducedMotion ? 1 : undefined,
          }}
        >
          {child}
        </Box>
      ))}
    </Box>
  );
}
