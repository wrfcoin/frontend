/**
 * WRFCoin Design System Tokens
 *
 * Re-exports and extends the core theme tokens with design-system-specific
 * scales and color-vision-deficiency-safe palette variants.
 */

// Re-export all core tokens so consumers can import from one place
export {
  // Backgrounds (dark)
  bgPrimary,
  bgSecondary,
  bgTertiary,
  bgHover,
  // Backgrounds (light)
  bgPrimaryLight,
  bgSecondaryLight,
  bgTertiaryLight,
  bgHoverLight,
  // Brand / semantic colors
  primary,
  primaryLight,
  primaryDark,
  success,
  successLight,
  successDark,
  warning,
  warningLight,
  warningDark,
  error,
  errorLight,
  errorDark,
  info,
  infoLight,
  infoDark,
  // Text
  textPrimary,
  textSecondary,
  textMuted,
  textDisabled,
  textPrimaryLight,
  textSecondaryLight,
  textMutedLight,
  textDisabledLight,
  // Category
  categoryColors,
  type CategoryKey,
  // Accents
  accentPurple,
  accentPink,
  accentCyan,
  accentOrange,
  // Spacing
  spacing,
  spacingUnit,
  // Border radius
  radii,
  // Transitions
  transitions,
  durations,
  easings,
  // Shadows
  shadows,
  shadowsLight,
  glows,
  // Z-index
  zIndex,
  // Typography
  fontFamily,
  fontWeight,
  // Borders
  borders,
  // Glass
  glass,
} from '../../theme/tokens';

// ---------------------------------------------------------------------------
// Color Palette (organized by role)
// ---------------------------------------------------------------------------

import {
  primary as _primary,
  primaryLight as _primaryLight,
  primaryDark as _primaryDark,
  success as _success,
  successLight as _successLight,
  successDark as _successDark,
  warning as _warning,
  warningLight as _warningLight,
  warningDark as _warningDark,
  error as _error,
  errorLight as _errorLight,
  errorDark as _errorDark,
  info as _info,
  infoLight as _infoLight,
  infoDark as _infoDark,
  textPrimary as _textPrimary,
  textSecondary as _textSecondary,
  textMuted as _textMuted,
  textDisabled as _textDisabled,
  bgPrimary as _bgPrimary,
  bgSecondary as _bgSecondary,
  bgTertiary as _bgTertiary,
  bgHover as _bgHover,
} from '../../theme/tokens';

/**
 * Text, surface and "light" accent entries follow the body theme: each is a CSS custom property
 * that `src/styles/theme.css` sets to the dark token on `:root` and to the light token under
 * `body.light-mode`, with the dark token as the fallback. The dark theme therefore renders
 * exactly as before, and a component that paints `palette.text.primary` on `palette.background.secondary`
 * stays legible in the light theme instead of drawing slate-50 text on a white card. The `main`
 * and `dark` accents and the neutral scale stay literal hex values: callers append alpha digits
 * to them (`${color}15`), which a `var()` cannot take.
 */
const themed = (name: string, dark: string): string => `var(--wrf-ds-${name}, ${dark})`;

export const palette = {
  primary: { main: _primary, light: _primaryLight, dark: _primaryDark },
  secondary: { main: '#8B5CF6', light: '#A78BFA', dark: '#7C3AED' },
  success: { main: _success, light: themed('success-light', _successLight), dark: _successDark },
  warning: { main: _warning, light: themed('warning-light', _warningLight), dark: _warningDark },
  error: { main: _error, light: themed('error-light', _errorLight), dark: _errorDark },
  info: { main: _info, light: themed('info-light', _infoLight), dark: _infoDark },
  neutral: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
  text: {
    primary: themed('text-primary', _textPrimary),
    secondary: themed('text-secondary', _textSecondary),
    muted: themed('text-muted', _textMuted),
    disabled: themed('text-disabled', _textDisabled),
    /** Inline link text: the light primary on dark cards, blue-700 on light ones. */
    link: themed('text-link', _primaryLight),
  },
  background: {
    primary: themed('bg-primary', _bgPrimary),
    secondary: themed('bg-secondary', _bgSecondary),
    tertiary: themed('bg-tertiary', _bgTertiary),
    hover: themed('bg-hover', _bgHover),
    /** A translucent row or inset inside a card (slate-700 at 30% on dark, slate-100 on light). */
    row: themed('bg-row', 'rgba(51, 65, 85, 0.3)'),
  },
} as const;

// ---------------------------------------------------------------------------
// Color Vision Deficiency Safe Palette
// ---------------------------------------------------------------------------

/**
 * Palette variants optimized for the three major forms of color vision
 * deficiency: protanopia, deuteranopia, and tritanopia.
 *
 * Uses blue/orange as the primary contrast pair (safe for all three types).
 * Avoids red-green confusion by using distinct luminance values and hues
 * separated by at least 30 degrees on the color wheel.
 */
export const cvdSafePalette = {
  /** Blue - universally distinguishable */
  primary: '#2B6CB0',
  /** Orange - high contrast against blue for all CVD types */
  secondary: '#DD6B20',
  /** Dark teal - distinct from both primary and secondary */
  success: '#0D7377',
  /** Gold/yellow - high luminance, safe for all CVD types */
  warning: '#B7791F',
  /** Dark magenta - distinct from success for tritanopes */
  error: '#9B2C2C',
  /** Desaturated blue - distinct from primary by luminance */
  info: '#4A90D9',
  /** Chart colors (8 stops safe for all CVD types) */
  chartSeries: [
    '#2B6CB0', // Blue
    '#DD6B20', // Orange
    '#0D7377', // Teal
    '#B7791F', // Gold
    '#9B2C2C', // Dark red
    '#6B46C1', // Purple
    '#2C7A7B', // Cyan
    '#975A16', // Brown
  ],
} as const;

// ---------------------------------------------------------------------------
// Typography Scale
// ---------------------------------------------------------------------------

export const typographyScale = {
  h1: { fontSize: '2.25rem', lineHeight: 1.2, letterSpacing: '-0.025em' },
  h2: { fontSize: '1.875rem', lineHeight: 1.25, letterSpacing: '-0.02em' },
  h3: { fontSize: '1.5rem', lineHeight: 1.3, letterSpacing: '-0.015em' },
  h4: { fontSize: '1.25rem', lineHeight: 1.35, letterSpacing: '0' },
  h5: { fontSize: '1.125rem', lineHeight: 1.4, letterSpacing: '0' },
  h6: { fontSize: '1rem', lineHeight: 1.4, letterSpacing: '0' },
  body1: { fontSize: '1rem', lineHeight: 1.6, letterSpacing: '0' },
  body2: { fontSize: '0.875rem', lineHeight: 1.6, letterSpacing: '0' },
  caption: { fontSize: '0.75rem', lineHeight: 1.5, letterSpacing: '0.02em' },
  overline: { fontSize: '0.6875rem', lineHeight: 1.5, letterSpacing: '0.08em' },
} as const;

// ---------------------------------------------------------------------------
// Spacing Scale (4px base unit)
// ---------------------------------------------------------------------------

export const spacingScale = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// ---------------------------------------------------------------------------
// Border Radius Scale
// ---------------------------------------------------------------------------

export const borderRadiusScale = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// ---------------------------------------------------------------------------
// Shadow Scale
// ---------------------------------------------------------------------------

export const shadowScale = {
  none: 'none',
  xs: '0 1px 2px rgba(0, 0, 0, 0.3)',
  sm: '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
} as const;

// ---------------------------------------------------------------------------
// Breakpoints (matching MUI defaults)
// ---------------------------------------------------------------------------

export const breakpoints = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
} as const;

// ---------------------------------------------------------------------------
// Z-Index Scale
// ---------------------------------------------------------------------------

export const zIndexScale = {
  hide: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  toast: 1600,
  tooltip: 1700,
} as const;

// ---------------------------------------------------------------------------
// CSS Custom Property Names
//
// Maps design token names to their corresponding CSS variable names as defined
// in src/styles/theme.css (dashboard-v2 block).  Use these constants when you
// need to reference CSS variables from JS/TS without string literals.
//
// Example:
//   sx={{ background: `var(${cssVars.bgPrimary})` }}
// ---------------------------------------------------------------------------

export const cssVars = {
  // Backgrounds
  bgPrimary: '--bg-primary',
  bgSecondary: '--bg-secondary',
  bgTertiary: '--bg-tertiary',
  bgHover: '--bg-hover',
  // Accent / brand
  accentPrimary: '--accent-primary',
  accentPurple: '--accent-purple',
  accentGreen: '--accent-green',
  accentAmber: '--accent-amber',
  accentRed: '--accent-red',
  accentPink: '--accent-pink',
  accentCyan: '--accent-cyan',
  accentOrange: '--accent-orange',
  // Text
  textPrimary: '--text-primary',
  textSecondary: '--text-secondary',
  textMuted: '--text-muted',
  textDisabled: '--text-disabled',
  // Borders
  borderDefault: '--border-default',
  borderHover: '--border-hover',
  borderFocus: '--border-focus',
  // Glows
  glowPrimary: '--glow-primary',
  glowSuccess: '--glow-success',
  glowWarning: '--glow-warning',
  glowError: '--glow-error',
  // Shadows
  shadowCard: '--shadow-card',
  shadowCardHover: '--shadow-card-hover',
  shadowElevated: '--shadow-elevated',
  // Category
  colorWeather: '--color-weather',
  colorMining: '--color-mining',
  colorStaking: '--color-staking',
  colorGovernance: '--color-governance',
  colorEnvironmental: '--color-environmental',
  colorBridge: '--color-bridge',
  // Status
  statusOnline: '--status-online',
  statusOffline: '--status-offline',
  statusWarning: '--status-warning',
  statusSyncing: '--status-syncing',
  statusIdle: '--status-idle',
  // Chart
  chartBlue: '--chart-blue',
  chartPurple: '--chart-purple',
  chartGreen: '--chart-green',
  chartAmber: '--chart-amber',
  chartSky: '--chart-sky',
  chartTeal: '--chart-teal',
} as const;

export type CssVarKey = keyof typeof cssVars;
