/**
 * Theme-aware colour variables for the public pages that hand design-system tokens to their CSS
 * as `--<prefix>-*` custom properties (forecast, governance, downloads). Each page keeps its own
 * dark map; this returns, per theme, the surface, text, border and shadow variables plus the
 * accent colours those stylesheets draw as text (links, chips, code lines, vote counts) and the
 * secondary surfaces they paint inside a card (rows, insets), so the light theme is legible
 * instead of white text on a white page or sky-blue code on a white card.
 *
 * Dark values are exactly the values the pages' own maps and stylesheets used before this helper
 * existed, so the dark theme renders unchanged. Light values are the `*Light` tokens where
 * tokens.ts has them and the 700-900 shade of the same hue otherwise; each holds at least 4.5:1
 * on white, on the slate-100 rows and insets handed out here and on its own translucent chip.
 */
import {
  bgPrimary, bgSecondary, textPrimary, textSecondary, textMuted, borders, shadows,
  bgPrimaryLight, bgSecondaryLight, textPrimaryLight, textSecondaryLight, textMutedLight, shadowsLight,
  primaryLight, info, successLight, errorLight,
} from './tokens';

export type PublicPageSurfaceVars = Record<string, string>;

export function publicPageSurfaceVars(prefix: string, isDark: boolean): PublicPageSurfaceVars {
  const p = `--${prefix}`;
  return isDark
    ? {
      [`${p}-bg-primary`]: bgPrimary,
      [`${p}-bg-secondary`]: bgSecondary,
      [`${p}-text`]: textPrimary,
      [`${p}-text-secondary`]: textSecondary,
      [`${p}-text-muted`]: textMuted,
      [`${p}-border`]: borders.default,
      [`${p}-shadow-md`]: shadows.md,
      // Accent colours drawn as text or icons.
      [`${p}-primary-light`]: primaryLight,
      [`${p}-info`]: info,
      [`${p}-success-light`]: successLight,
      [`${p}-error-light`]: errorLight,
      [`${p}-sky-text`]: '#7DD3FC',
      [`${p}-night-text`]: '#A5B4FC',
      [`${p}-purple-text`]: '#A78BFA',
      [`${p}-code`]: '#BFDBFE',
      // Secondary surfaces painted inside a card.
      [`${p}-row-bg`]: 'rgba(51, 65, 85, 0.3)',
      [`${p}-inset-bg`]: 'rgba(15, 23, 42, 0.6)',
    }
    : {
      [`${p}-bg-primary`]: bgPrimaryLight,
      [`${p}-bg-secondary`]: bgSecondaryLight,
      [`${p}-text`]: textPrimaryLight,
      [`${p}-text-secondary`]: textSecondaryLight,
      [`${p}-text-muted`]: textMutedLight,
      [`${p}-border`]: borders.defaultLight,
      [`${p}-shadow-md`]: shadowsLight.md,
      [`${p}-primary-light`]: '#1D4ED8',
      [`${p}-info`]: '#075985',
      [`${p}-success-light`]: '#047857',
      [`${p}-error-light`]: '#B91C1C',
      [`${p}-sky-text`]: '#0369A1',
      [`${p}-night-text`]: '#4338CA',
      [`${p}-purple-text`]: '#6D28D9',
      [`${p}-code`]: '#1E3A8A',
      [`${p}-row-bg`]: '#F1F5F9',
      [`${p}-inset-bg`]: '#F1F5F9',
    };
}
