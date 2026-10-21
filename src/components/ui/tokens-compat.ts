/**
 * @deprecated Legacy token compatibility bridge.
 * New code should import directly from '@/components/DesignSystem/tokens' or '@/theme/tokens'.
 *
 * This file re-exports DesignSystem tokens in the legacy ui/tokens.ts shape
 * so existing ui/ components continue to work without code changes.
 */
import {
  palette,
  spacingScale,
  borderRadiusScale,
  shadowScale,
  typographyScale,
} from '../DesignSystem/tokens';

/** @deprecated Use `palette` from '@/components/DesignSystem/tokens' */
export const colors = {
  bg: {
    primary: palette.background.primary,
    secondary: palette.background.secondary,
    tertiary: palette.background.tertiary,
  },
  text: {
    primary: palette.text.primary,
    secondary: palette.text.secondary,
    muted: palette.text.muted,
  },
  brand: {
    primary: palette.primary.main,
    hover: palette.primary.dark,
    active: palette.primary.dark,
  },
  success: { main: palette.success.main, light: palette.success.light, dark: palette.success.dark },
  warning: { main: palette.warning.main, light: palette.warning.light, dark: palette.warning.dark },
  error: { main: palette.error.main, light: palette.error.light, dark: palette.error.dark },
  border: {
    default: 'rgba(51, 65, 85, 0.5)',
    light: '#475569',
    focus: palette.primary.main,
  },
} as const;

/** @deprecated Use `spacingScale` from '@/components/DesignSystem/tokens' */
export const spacing = spacingScale;

/**
 * @deprecated Use `borderRadiusScale` from '@/components/DesignSystem/tokens'.
 * Note: legacy keys map to different DesignSystem keys (sm=4 -> xs=4, md=8 -> sm=8, etc.)
 */
export const borderRadius = {
  sm: borderRadiusScale.xs,   // 4
  md: borderRadiusScale.sm,   // 8
  lg: borderRadiusScale.md,   // 12
  xl: borderRadiusScale.lg,   // 16
  full: borderRadiusScale.full, // 9999
} as const;

/** @deprecated Use `shadowScale` from '@/components/DesignSystem/tokens' */
export const shadows = {
  sm: shadowScale.sm,
  md: shadowScale.md,
  lg: shadowScale.lg,
  glow: (color: string) => `0 0 20px ${color}33`,
} as const;

/** @deprecated Use `typographyScale` from '@/components/DesignSystem/tokens' */
export const typography = {
  h1: { fontSize: typographyScale.h1.fontSize, fontWeight: 700 },
  h2: { fontSize: typographyScale.h2.fontSize, fontWeight: 600 },
  h3: { fontSize: typographyScale.h3.fontSize, fontWeight: 600 },
  body1: { fontSize: typographyScale.body1.fontSize, fontWeight: 400 },
  body2: { fontSize: typographyScale.body2.fontSize, fontWeight: 400 },
  caption: { fontSize: typographyScale.caption.fontSize, fontWeight: 400 },
} as const;
