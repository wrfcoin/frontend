/**
 * WRFCoin Design Tokens
 *
 * Centralized design token constants for the WRFCoin theme system.
 * All raw values live here; the MUI theme and CSS variables reference these tokens.
 */

// ---------------------------------------------------------------------------
// Color Palette
// ---------------------------------------------------------------------------

/** Deep navy - main app background */
export const bgPrimary = '#0F172A';
/** Slate 800 - card / panel backgrounds */
export const bgSecondary = '#1E293B';
/** Slate 700 - elevated surfaces */
export const bgTertiary = '#334155';
/** Slate 600 - hover states */
export const bgHover = '#475569';

/** Electric blue - primary brand accent */
export const primary = '#3B82F6';
export const primaryLight = '#60A5FA';
export const primaryDark = '#2563EB';
/**
 * Blue-700 / blue-800: fills behind white (or slate-200) labels. White holds 5.2:1 on blue-600,
 * 6.7:1 on blue-700 and 8.7:1 on blue-800; on blue-500 it is 3.7:1 and on blue-400 2.5:1, so
 * neither may sit behind normal-size text.
 */
export const primaryDeep = '#1D4ED8';
export const primaryDeeper = '#1E40AF';

/** Emerald - success states */
export const success = '#10B981';
export const successLight = '#34D399';
export const successDark = '#059669';

/** Amber - warning states */
export const warning = '#F59E0B';
export const warningLight = '#FBBF24';
export const warningDark = '#D97706';

/** Coral red - error / danger states */
export const error = '#EF4444';
export const errorLight = '#F87171';
export const errorDark = '#DC2626';

/** Info - sky blue */
export const info = '#0EA5E9';
export const infoLight = '#38BDF8';
export const infoDark = '#0284C7';

// Text on dark backgrounds
export const textPrimary = '#F8FAFC';
export const textSecondary = '#94A3B8';
export const textMuted = '#94A3B8';
export const textDisabled = '#475569';
/** Secondary text on the raised slate-700 fill (table heads): slate-300 holds 7.0:1 there, slate-400 4.0:1. */
export const textSecondaryRaised = '#CBD5E1';

/**
 * Map overlay panels stay dark (#0F172A at ~0.92) in both themes, so their muted labels use the
 * dark secondary text (slate-400, 7.0:1 there) rather than slate-500 (3.8:1).
 */
export const mapOverlayTextMuted = '#94A3B8';

// Text on light backgrounds
export const textPrimaryLight = '#0F172A';
export const textSecondaryLight = '#475569';
export const textMutedLight = '#64748B';
export const textDisabledLight = '#94A3B8';

// Light mode backgrounds
export const bgPrimaryLight = '#F8FAFC';
export const bgSecondaryLight = '#FFFFFF';
export const bgTertiaryLight = '#F1F5F9';
export const bgHoverLight = '#E2E8F0';

// ---------------------------------------------------------------------------
// Semantic Category Colors (domain-specific accents)
// ---------------------------------------------------------------------------

export const categoryColors = {
  weather: '#0EA5E9',
  mining: '#A855F7',
  staking: '#22C55E',
  governance: '#14B8A6',
  environmental: '#84CC16',
  bridge: '#F97316',
} as const;

export type CategoryKey = keyof typeof categoryColors;

// Additional brand accents used in gradients / charts
export const accentPurple = '#8B5CF6';
export const accentPink = '#EC4899';
export const accentCyan = '#06B6D4';
export const accentOrange = '#F97316';

// ---------------------------------------------------------------------------
// Spacing Scale (8px grid)
// ---------------------------------------------------------------------------

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

/** Base spacing unit in pixels (MUI uses this as the factor) */
export const spacingUnit = 8;

// ---------------------------------------------------------------------------
// Border Radius
// ---------------------------------------------------------------------------

export const radii = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// ---------------------------------------------------------------------------
// Transitions & Animation
// ---------------------------------------------------------------------------

export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
  spring: '500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

export const durations = {
  fast: 150,
  normal: 250,
  slow: 350,
  spring: 500,
} as const;

export const easings = {
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

// ---------------------------------------------------------------------------
// Shadows
// ---------------------------------------------------------------------------

export const shadows = {
  none: 'none',
  xs: '0 1px 2px rgba(0, 0, 0, 0.3)',
  sm: '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
} as const;

// Light mode shadow equivalents
export const shadowsLight = {
  none: 'none',
  xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
} as const;

// Glow effects for dark mode UI accents
export const glows = {
  primary: '0 0 20px rgba(59, 130, 246, 0.15)',
  primaryStrong: '0 0 30px rgba(59, 130, 246, 0.25)',
  success: '0 0 20px rgba(16, 185, 129, 0.15)',
  warning: '0 0 20px rgba(245, 158, 11, 0.15)',
  error: '0 0 20px rgba(239, 68, 68, 0.15)',
  weather: '0 0 20px rgba(14, 165, 233, 0.15)',
  mining: '0 0 20px rgba(168, 85, 247, 0.15)',
  staking: '0 0 20px rgba(34, 197, 94, 0.15)',
} as const;

// ---------------------------------------------------------------------------
// Z-Index Scale
// ---------------------------------------------------------------------------

export const zIndex = {
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
// Typography
// ---------------------------------------------------------------------------

export const fontFamily = {
  display: '\'Inter\', system-ui, -apple-system, sans-serif',
  mono: '\'JetBrains Mono\', \'Fira Code\', \'SF Mono\', monospace',
} as const;

export const fontWeight = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

// ---------------------------------------------------------------------------
// Borders
// ---------------------------------------------------------------------------

export const borders = {
  default: 'rgba(51, 65, 85, 0.5)',
  hover: 'rgba(59, 130, 246, 0.5)',
  focus: 'rgba(59, 130, 246, 0.8)',
  defaultLight: 'rgba(148, 163, 184, 0.3)',
  hoverLight: 'rgba(59, 130, 246, 0.4)',
  focusLight: 'rgba(59, 130, 246, 0.6)',
} as const;

// ---------------------------------------------------------------------------
// Glassmorphism presets
// ---------------------------------------------------------------------------

export const glass = {
  background: 'rgba(30, 41, 59, 0.6)',
  backgroundLight: 'rgba(255, 255, 255, 0.7)',
  blur: 'blur(12px)',
  blurStrong: 'blur(20px)',
  border: '1px solid rgba(51, 65, 85, 0.5)',
  borderLight: '1px solid rgba(148, 163, 184, 0.3)',
} as const;
