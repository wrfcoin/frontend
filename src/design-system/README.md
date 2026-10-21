# WRFCoin Design System — Token API Reference

> Single source of truth: `src/theme/tokens.ts`
> Last updated: April 2026

---

## Overview

The WRFCoin design system has three layers. **Always prefer the highest layer available
for your context**:

| Layer | File | Use when |
|-------|------|----------|
| 1. JS/TS constants | `src/theme/tokens.ts` | MUI theme, inline `sx` props, any TypeScript |
| 2. CSS custom properties | `src/styles/theme.css` (`.dashboard-v2`) | Plain CSS/SCSS files |
| 3. Legacy compat aliases | `src/index.css` | Only for legacy components not yet migrated |

The `WrfThemeProvider` (in `src/components/DesignSystem/WrfThemeProvider.tsx`) applies
`.dashboard-v2` and `.dark-mode` / `.light-mode` classes to `<body>` so that CSS variables
from layer 2 are always available.

---

## Importing Tokens in TypeScript

```ts
// Preferred: import from the DesignSystem barrel (re-exports everything)
import { primary, bgPrimary, spacing, radii, cssVars } from '@/components/DesignSystem/tokens';

// Direct import from core token file
import { primary, success, fontFamily } from '@/theme/tokens';
```

---

## Color Palette

### Brand

| Token | Value | CSS variable |
|-------|-------|-------------|
| `primary` | `#3B82F6` | `--accent-primary` |
| `primaryLight` | `#60A5FA` | — |
| `primaryDark` | `#2563EB` | — |
| `accentPurple` | `#8B5CF6` | `--accent-purple` |
| `accentCyan` | `#06B6D4` | `--accent-cyan` |
| `accentOrange` | `#F97316` | `--accent-orange` |
| `accentPink` | `#EC4899` | `--accent-pink` |

### Semantic Status

| Token | Value | CSS variable |
|-------|-------|-------------|
| `success` | `#10B981` | — |
| `warning` | `#F59E0B` | — |
| `error` | `#EF4444` | — |
| `info` | `#0EA5E9` | — |

### Backgrounds (dark mode)

| Token | Value | CSS variable |
|-------|-------|-------------|
| `bgPrimary` | `#0F172A` | `--bg-primary` |
| `bgSecondary` | `#1E293B` | `--bg-secondary` |
| `bgTertiary` | `#334155` | `--bg-tertiary` |
| `bgHover` | `#475569` | `--bg-hover` |

### Backgrounds (light mode)

| Token | Value | CSS variable |
|-------|-------|-------------|
| `bgPrimaryLight` | `#F8FAFC` | `--bg-primary` (light) |
| `bgSecondaryLight` | `#FFFFFF` | `--bg-secondary` (light) |
| `bgTertiaryLight` | `#F1F5F9` | `--bg-tertiary` (light) |

### Text

| Token | Value | Context |
|-------|-------|---------|
| `textPrimary` | `#F8FAFC` | Dark mode body text |
| `textSecondary` | `#94A3B8` | Dark mode secondary text |
| `textMuted` | `#64748B` | Muted / placeholder |
| `textPrimaryLight` | `#0F172A` | Light mode body text |
| `textSecondaryLight` | `#475569` | Light mode secondary |

### Domain / Category Colors

```ts
import { categoryColors } from '@/theme/tokens';
// { weather, mining, staking, governance, environmental, bridge }
```

| Key | Value | CSS variable |
|-----|-------|-------------|
| `weather` | `#0EA5E9` | `--color-weather` |
| `mining` | `#A855F7` | `--color-mining` |
| `staking` | `#22C55E` | `--color-staking` |
| `governance` | `#14B8A6` | `--color-governance` |
| `environmental` | `#84CC16` | `--color-environmental` |
| `bridge` | `#F97316` | `--color-bridge` |

---

## Spacing Scale (8px grid)

```ts
import { spacing, spacingUnit } from '@/theme/tokens';
// spacingUnit = 8 (used as MUI theme spacing factor)
```

| Key | px value | MUI shorthand |
|-----|----------|--------------|
| `xxs` | 4 | `0.5` |
| `xs` | 8 | `1` |
| `sm` | 12 | `1.5` |
| `md` | 16 | `2` |
| `lg` | 24 | `3` |
| `xl` | 32 | `4` |
| `2xl` | 48 | `6` |
| `3xl` | 64 | `8` |

In DesignSystem components, use the `spacingScale` export which has a 4px base:

```ts
import { spacingScale } from '@/components/DesignSystem/tokens';
// { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 }
```

---

## Border Radius

```ts
import { radii } from '@/theme/tokens';
// { none: 0, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, full: 9999 }
```

---

## Typography

```ts
import { fontFamily, fontWeight } from '@/theme/tokens';

fontFamily.display  // 'Inter', system-ui, ...
fontFamily.mono     // 'JetBrains Mono', 'Fira Code', ...

fontWeight.light    // 300
fontWeight.regular  // 400
fontWeight.medium   // 500
fontWeight.semibold // 600
fontWeight.bold     // 700
```

Full size scale (from `typographyScale` in `DesignSystem/tokens.ts`):

| Key | fontSize | lineHeight |
|-----|----------|-----------|
| `h1` | 2.25rem | 1.2 |
| `h2` | 1.875rem | 1.25 |
| `h3` | 1.5rem | 1.3 |
| `h4` | 1.25rem | 1.35 |
| `h5` | 1.125rem | 1.4 |
| `h6` | 1rem | 1.4 |
| `body1` | 1rem | 1.6 |
| `body2` | 0.875rem | 1.6 |
| `caption` | 0.75rem | 1.5 |
| `overline` | 0.6875rem | 1.5 |

---

## Shadows & Glows

```ts
import { shadows, shadowsLight, glows } from '@/theme/tokens';
```

Shadow scale: `none | xs | sm | md | lg | xl | 2xl`

Glow effects (dark mode accents): `primary | primaryStrong | success | warning | error | weather | mining | staking`

---

## Animations / Transitions

```ts
import { transitions, durations, easings } from '@/theme/tokens';

transitions.normal  // '250ms cubic-bezier(0.4, 0, 0.2, 1)'
durations.fast      // 150
easings.easeInOut   // 'cubic-bezier(0.4, 0, 0.2, 1)'
```

---

## Z-Index Scale

```ts
import { zIndex } from '@/theme/tokens';
// hide | base | dropdown | sticky | banner | overlay | modal | popover | toast | tooltip
```

---

## CSS Variables (from JS)

Use `cssVars` when you need to reference a CSS variable by name from TypeScript:

```ts
import { cssVars } from '@/components/DesignSystem/tokens';

// In a styled component or sx prop:
sx={{ background: `var(${cssVars.bgPrimary})` }}
sx={{ color: `var(${cssVars.textSecondary})` }}
sx={{ boxShadow: `var(${cssVars.shadowCard})` }}
```

Full `cssVars` key list: `bgPrimary | bgSecondary | bgTertiary | bgHover | accentPrimary |
accentPurple | accentGreen | accentAmber | accentRed | accentPink | accentCyan | accentOrange |
textPrimary | textSecondary | textMuted | textDisabled | borderDefault | borderHover |
borderFocus | glowPrimary | glowSuccess | glowWarning | glowError | shadowCard |
shadowCardHover | shadowElevated | colorWeather | colorMining | colorStaking |
colorGovernance | colorEnvironmental | colorBridge | statusOnline | statusOffline |
statusWarning | statusSyncing | statusIdle | chartBlue | chartPurple | chartGreen |
chartAmber | chartSky | chartTeal`

---

## Color Vision Deficiency (CVD) Safe Palette

For accessibility-critical data visualizations, use the CVD-safe palette:

```ts
import { cvdSafePalette } from '@/components/DesignSystem/tokens';
// Uses blue/orange contrast pair, safe for protanopia, deuteranopia, and tritanopia
```

---

## Component Usage

Import design system components from the barrel:

```ts
import {
  WrfButton,
  WrfCard,
  WrfInput,
  WrfBadge,
  WrfStatCard,
  WrfDataTable,
  WrfAlert,
  WrfModal,
  WrfTabs,
  WrfSkeleton,
  WrfEmptyState,
  WrfTooltip,
  WrfThemeProvider,
  useThemeMode,
} from '@/components/DesignSystem';
```

---

## Theme Provider

```tsx
import { WrfThemeProvider } from '@/components/DesignSystem';

// Wrap your app root:
<WrfThemeProvider>
  <App />
</WrfThemeProvider>

// Access current mode in any component:
import { useThemeMode } from '@/components/DesignSystem';
const { isDark, toggleMode } = useThemeMode();
```

---

## Migration Guide (from legacy)

| Legacy pattern | New pattern |
|---------------|-------------|
| `import Button from '@/components/common/Button'` | `import { WrfButton } from '@/components/DesignSystem'` |
| `import Card from '@/components/common/Card'` | `import { WrfCard } from '@/components/DesignSystem'` |
| `import { colors } from '@/components/ui/tokens'` | `import { palette } from '@/components/DesignSystem/tokens'` |
| Bootstrap class `.btn-primary` | `<WrfButton variant="primary">` |
| Bootstrap class `.btn-outline-primary` | `<WrfButton variant="outline">` |
| CSS var `--primary-color` (#4361ee) | `--accent-primary` / `#3B82F6` |
| CSS var `--success-color` (#2ecc71) | `--status-online` / `#10B981` |

---

_This file is auto-maintained. Do not edit the table values manually — update `src/theme/tokens.ts` and regenerate._
