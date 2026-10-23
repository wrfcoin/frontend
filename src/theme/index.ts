/**
 * WRFCoin MUI Theme
 *
 * Observatory panels with vibrant data overlays - professional meteorological
 * tools blended with consumer app warmth.
 */

import { createTheme, type ThemeOptions, type Theme } from '@mui/material/styles';
import {
  bgPrimary,
  bgSecondary,
  bgTertiary,
  bgHover,
  bgPrimaryLight,
  bgSecondaryLight,
  bgTertiaryLight,
  bgHoverLight,
  primary,
  primaryLight,
  primaryDark,
  primaryDeep,
  primaryDeeper,
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
  textPrimary,
  textSecondary,
  textMuted,
  textDisabled,
  textSecondaryRaised,
  textPrimaryLight,
  textSecondaryLight,
  textDisabledLight,
  categoryColors,
  accentPurple,
  fontFamily,
  fontWeight,
  spacingUnit,
  radii,
  durations,
  easings,
  shadows,
  shadowsLight,
  glows,
  borders,
  glass,
} from './tokens';

// ---------------------------------------------------------------------------
// Module augmentation - extend MUI's type system with WRFCoin-specific tokens
// ---------------------------------------------------------------------------

declare module '@mui/material/styles' {
  interface Palette {
    category: typeof categoryColors;
    accent: { purple: string };
    glow: typeof glows;
  }
  interface PaletteOptions {
    category?: typeof categoryColors;
    accent?: { purple: string };
    glow?: typeof glows;
  }
}

// ---------------------------------------------------------------------------
// Shared options (mode-agnostic)
// ---------------------------------------------------------------------------

const sharedTypography: ThemeOptions['typography'] = {
  fontFamily: fontFamily.display,
  fontWeightLight: fontWeight.light,
  fontWeightRegular: fontWeight.regular,
  fontWeightMedium: fontWeight.medium,
  fontWeightBold: fontWeight.bold,
  h1: {
    fontFamily: fontFamily.display,
    fontWeight: fontWeight.bold,
    fontSize: '2.25rem',
    lineHeight: 1.2,
    letterSpacing: '-0.025em',
  },
  h2: {
    fontFamily: fontFamily.display,
    fontWeight: fontWeight.bold,
    fontSize: '1.875rem',
    lineHeight: 1.25,
    letterSpacing: '-0.02em',
  },
  h3: {
    fontFamily: fontFamily.display,
    fontWeight: fontWeight.semibold,
    fontSize: '1.5rem',
    lineHeight: 1.3,
    letterSpacing: '-0.015em',
  },
  h4: {
    fontFamily: fontFamily.display,
    fontWeight: fontWeight.semibold,
    fontSize: '1.25rem',
    lineHeight: 1.35,
  },
  h5: {
    fontFamily: fontFamily.display,
    fontWeight: fontWeight.medium,
    fontSize: '1.125rem',
    lineHeight: 1.4,
  },
  h6: {
    fontFamily: fontFamily.display,
    fontWeight: fontWeight.medium,
    fontSize: '1rem',
    lineHeight: 1.4,
  },
  subtitle1: {
    fontFamily: fontFamily.display,
    fontWeight: fontWeight.medium,
    fontSize: '1rem',
    lineHeight: 1.5,
    letterSpacing: '0.005em',
  },
  subtitle2: {
    fontFamily: fontFamily.display,
    fontWeight: fontWeight.medium,
    fontSize: '0.875rem',
    lineHeight: 1.5,
    letterSpacing: '0.005em',
  },
  body1: {
    fontFamily: fontFamily.display,
    fontSize: '1rem',
    lineHeight: 1.6,
  },
  body2: {
    fontFamily: fontFamily.display,
    fontSize: '0.875rem',
    lineHeight: 1.6,
  },
  button: {
    fontFamily: fontFamily.display,
    fontWeight: fontWeight.semibold,
    fontSize: '0.875rem',
    textTransform: 'none' as const,
    letterSpacing: '0.01em',
  },
  caption: {
    fontFamily: fontFamily.display,
    fontSize: '0.75rem',
    lineHeight: 1.5,
    letterSpacing: '0.02em',
  },
  overline: {
    fontFamily: fontFamily.mono,
    fontWeight: fontWeight.medium,
    fontSize: '0.6875rem',
    lineHeight: 1.5,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
  },
};

const sharedShape: ThemeOptions['shape'] = {
  borderRadius: radii.sm,
};

const sharedTransitions: ThemeOptions['transitions'] = {
  duration: {
    shortest: durations.fast,
    shorter: durations.fast,
    short: durations.normal,
    standard: durations.normal,
    complex: durations.slow,
    enteringScreen: durations.normal,
    leavingScreen: durations.fast,
  },
  easing: {
    easeInOut: easings.easeInOut,
    easeOut: easings.easeOut,
    easeIn: easings.easeIn,
    sharp: easings.sharp,
  },
};

// ---------------------------------------------------------------------------
// Build MUI shadow array (25 entries required)
// ---------------------------------------------------------------------------

function buildShadowArray(base: Record<string, string>): Theme['shadows'] {
  return [
    'none',
    base.xs,
    base.sm,
    base.sm,
    base.md,
    base.md,
    base.md,
    base.lg,
    base.lg,
    base.lg,
    base.lg,
    base.lg,
    base.xl,
    base.xl,
    base.xl,
    base.xl,
    base.xl,
    base['2xl'],
    base['2xl'],
    base['2xl'],
    base['2xl'],
    base['2xl'],
    base['2xl'],
    base['2xl'],
    base['2xl'],
  ] as Theme['shadows'];
}

// ---------------------------------------------------------------------------
// Dark Theme (default)
// ---------------------------------------------------------------------------

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: primary, light: primaryLight, dark: primaryDark },
    secondary: { main: accentPurple },
    success: { main: success, light: successLight, dark: successDark },
    warning: { main: warning, light: warningLight, dark: warningDark },
    error: { main: error, light: errorLight, dark: errorDark },
    info: { main: info, light: infoLight, dark: infoDark },
    background: {
      default: bgPrimary,
      paper: bgSecondary,
    },
    text: {
      primary: textPrimary,
      secondary: textSecondary,
      disabled: textDisabled,
    },
    divider: borders.default,
    category: categoryColors,
    accent: { purple: accentPurple },
    glow: glows,
  },
  typography: sharedTypography,
  spacing: spacingUnit,
  shape: sharedShape,
  shadows: buildShadowArray(shadows),
  transitions: sharedTransitions,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: bgPrimary,
          color: textPrimary,
          scrollbarColor: `${bgTertiary} ${bgPrimary}`,
          '&::-webkit-scrollbar': {
            width: 8,
          },
          '&::-webkit-scrollbar-track': {
            background: bgPrimary,
          },
          '&::-webkit-scrollbar-thumb': {
            background: bgTertiary,
            borderRadius: 4,
          },
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          background: glass.background,
          backdropFilter: glass.blur,
          WebkitBackdropFilter: glass.blur,
          border: glass.border,
          borderRadius: radii.lg,
          transition: `all ${durations.normal}ms ${easings.easeInOut}`,
          '&:hover': {
            borderColor: borders.hover,
            boxShadow: `${shadows.lg}, ${glows.primary}`,
          },
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: radii.md,
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: radii.lg,
          padding: '8px 20px',
          fontWeight: fontWeight.semibold,
          transition: `all ${durations.normal}ms ${easings.easeInOut}`,
        },
        contained: {
          '&:hover': {
            boxShadow: glows.primary,
          },
        },
        containedPrimary: {
          // White labels need 4.5:1 along the whole gradient, hover included: blue-500 → blue-600 gave
          // 3.7–5.2:1 and the blue-400 hover 2.5–2.9:1. Blue-600 → blue-700 at rest, blue-700 → blue-800
          // on hover (the glow still marks hover on the dark page).
          background: `linear-gradient(135deg, ${primaryDark} 0%, ${primaryDeep} 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, ${primaryDeep} 0%, ${primaryDeeper} 100%)`,
            boxShadow: glows.primaryStrong,
          },
        },
        containedSecondary: {
          backgroundColor: '#7C3AED',
          '&:hover': { backgroundColor: '#6D28D9' },
        },
        containedSuccess: {
          '&:hover': {
            boxShadow: glows.success,
          },
        },
        containedError: {
          '&:hover': {
            boxShadow: glows.error,
          },
        },
        containedWarning: {
          '&:hover': {
            boxShadow: glows.warning,
          },
        },
        outlined: {
          color: primaryLight,
          borderColor: borders.default,
          '&:hover': {
            borderColor: primary,
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
          },
        },
        text: {
          color: primaryLight,
          '&:hover': {
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
          },
        },
      },
    },
    MuiStepIcon: {
      styleOverrides: {
        // The active/completed step circle carries a white number: blue-500 gave 3.7:1, blue-600 holds
        // 5.2:1 and still reads 3.5:1 against the navy page as a component.
        root: {
          '&.Mui-active, &.Mui-completed': { color: primaryDark },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: radii.sm,
          fontWeight: fontWeight.medium,
          fontSize: '0.8125rem',
          height: 28,
        },
        outlined: {
          color: primaryLight,
          borderColor: borders.default,
        },
        filled: {
          backgroundColor: bgTertiary,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: radii.sm,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: borders.default,
            transition: `border-color ${durations.fast}ms ${easings.easeInOut}`,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: borders.hover,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: primary,
            borderWidth: 2,
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: bgTertiary,
          color: textPrimary,
          fontSize: '0.8125rem',
          borderRadius: radii.sm,
          border: glass.border,
          backdropFilter: glass.blur,
          WebkitBackdropFilter: glass.blur,
        },
        arrow: {
          color: bgTertiary,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: glass.background,
          backdropFilter: glass.blurStrong,
          WebkitBackdropFilter: glass.blurStrong,
          border: glass.border,
          borderRadius: radii.lg,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: bgSecondary,
          borderRight: glass.border,
        },
      },
    },
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: glass.blur,
          WebkitBackdropFilter: glass.blur,
          borderBottom: glass.border,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: '3px 3px 0 0',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: fontWeight.medium,
          fontSize: '0.875rem',
          minHeight: 48,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: borders.default,
        },
        head: {
          fontWeight: fontWeight.semibold,
          backgroundColor: bgTertiary,
          color: textSecondaryRaised,
          fontSize: '0.8125rem',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.05em',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: `background-color ${durations.fast}ms ${easings.easeInOut}`,
          '&:hover': {
            backgroundColor: 'rgba(51, 65, 85, 0.3)',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: radii.md,
        },
        standardInfo: {
          backgroundColor: 'rgba(14, 165, 233, 0.1)',
          border: '1px solid rgba(14, 165, 233, 0.3)',
        },
        standardSuccess: {
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
        },
        standardWarning: {
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
        },
        standardError: {
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: radii.full,
          backgroundColor: bgTertiary,
        },
        bar: {
          borderRadius: radii.full,
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(51, 65, 85, 0.4)',
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: {
          fontWeight: fontWeight.semibold,
          fontSize: '0.6875rem',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: bgTertiary,
          color: textPrimary,
          fontWeight: fontWeight.semibold,
        },
      },
    },
  },
});

// ---------------------------------------------------------------------------
// Light Theme
// ---------------------------------------------------------------------------

/**
 * Light-theme brand accents. On the light surfaces blue-500 text and outlines sit at 3.5:1 and blue-600
 * at 4.4:1 on the slate-50 page; blue-700 holds 6:1 there and white on it 6.6:1 for contained buttons.
 * The purple secondary shifts to violet-600 for the same reason. Dark keeps the 500 shades.
 */
export const lightAccents = {
  primary: { main: '#1D4ED8', light: primaryDark, dark: '#1E40AF' },
  secondary: { main: '#7C3AED', light: accentPurple, dark: '#6D28D9' },
} as const;

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: lightAccents.primary,
    secondary: lightAccents.secondary,
    success: { main: success, light: successLight, dark: successDark },
    warning: { main: warning, light: warningLight, dark: warningDark },
    error: { main: error, light: errorLight, dark: errorDark },
    info: { main: info, light: infoLight, dark: infoDark },
    background: {
      default: bgPrimaryLight,
      paper: bgSecondaryLight,
    },
    text: {
      primary: textPrimaryLight,
      secondary: textSecondaryLight,
      disabled: textDisabledLight,
    },
    divider: borders.defaultLight,
    category: categoryColors,
    accent: { purple: accentPurple },
    glow: glows,
  },
  typography: sharedTypography,
  spacing: spacingUnit,
  shape: sharedShape,
  shadows: buildShadowArray(shadowsLight),
  transitions: sharedTransitions,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: bgPrimaryLight,
          color: textPrimaryLight,
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          background: glass.backgroundLight,
          backdropFilter: glass.blur,
          WebkitBackdropFilter: glass.blur,
          border: glass.borderLight,
          borderRadius: radii.lg,
          transition: `all ${durations.normal}ms ${easings.easeInOut}`,
          '&:hover': {
            borderColor: borders.hoverLight,
            boxShadow: shadowsLight.lg,
          },
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: radii.md,
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: radii.lg,
          padding: '8px 20px',
          fontWeight: fontWeight.semibold,
          transition: `all ${durations.normal}ms ${easings.easeInOut}`,
        },
        containedPrimary: {
          // White labels need 4.5:1 along the whole gradient, hover included (blue-500/600 gave 3.9–4.3:1, the
          // blue-400 hover 2.9:1): blue-700 → blue-800 at rest, blue-600 → blue-700 on hover.
          background: `linear-gradient(135deg, ${lightAccents.primary.main} 0%, ${lightAccents.primary.dark} 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, ${lightAccents.primary.light} 0%, ${lightAccents.primary.main} 100%)`,
          },
        },
        outlined: {
          borderColor: borders.defaultLight,
          '&:hover': {
            borderColor: primary,
            backgroundColor: 'rgba(59, 130, 246, 0.04)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: radii.sm,
          fontWeight: fontWeight.medium,
          fontSize: '0.8125rem',
          height: 28,
        },
        outlined: {
          borderColor: borders.defaultLight,
        },
        filled: {
          backgroundColor: bgTertiaryLight,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: radii.sm,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: borders.defaultLight,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: borders.hoverLight,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: primary,
            borderWidth: 2,
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: bgPrimaryLight,
          color: textPrimaryLight,
          fontSize: '0.8125rem',
          borderRadius: radii.sm,
          border: glass.borderLight,
          boxShadow: shadowsLight.md,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: radii.lg,
        },
      },
    },
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(248, 250, 252, 0.85)',
          backdropFilter: glass.blur,
          WebkitBackdropFilter: glass.blur,
          borderBottom: glass.borderLight,
          color: textPrimaryLight,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: '3px 3px 0 0',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: fontWeight.medium,
          fontSize: '0.875rem',
          minHeight: 48,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: borders.defaultLight,
        },
        head: {
          fontWeight: fontWeight.semibold,
          backgroundColor: bgTertiaryLight,
          color: textSecondaryLight,
          fontSize: '0.8125rem',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.05em',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: radii.md,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: radii.full,
          backgroundColor: bgTertiaryLight,
        },
        bar: {
          borderRadius: radii.full,
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(148, 163, 184, 0.2)',
        },
      },
    },
  },
});

// Re-export for convenience
export { darkTheme as theme };
export type { Theme };
