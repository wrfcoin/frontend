import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { SxProps, Theme } from '@mui/material/styles';
import { palette, spacingScale, borderRadiusScale } from './tokens';
import { glows, shadows } from '../../theme/tokens';

/**
 * Gradient "hero" card for a headline figure (wallet balance, DAO treasury).
 * The value is split so the integer part reads large and the fraction and
 * unit smaller, while the whole figure stays one accessible string for the
 * element carrying `data-testid` / `aria-label`.
 */
export type WrfGradientHeroVariant = 'blue' | 'purple' | 'muted';

const GRADIENTS: Record<WrfGradientHeroVariant, { background: string; glow: string }> = {
  blue: {
    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 55%, #1E3A8A 100%)',
    glow: glows.primaryStrong,
  },
  purple: {
    background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 55%, #4C1D95 100%)',
    glow: glows.mining,
  },
  muted: {
    background: palette.background.secondary,
    glow: 'none',
  },
};

export interface WrfGradientHeroProps {
  /** Small uppercase label above the figure. */
  label: string;
  /** Integer part of the figure (already formatted, e.g. "15,839"). */
  value: React.ReactNode;
  /** Fractional part including the separator (e.g. ".78588754"). */
  fraction?: React.ReactNode;
  /** Unit after the figure (e.g. "WRF"). */
  unit?: React.ReactNode;
  /** One line under the figure (updated time, chain height…). */
  sub?: React.ReactNode;
  /** Optional pill(s) rendered after the sub line. */
  children?: React.ReactNode;
  variant?: WrfGradientHeroVariant;
  /** Attributes for the element wrapping the whole figure (testid, aria-label). */
  valueProps?: Record<string, unknown>;
  sx?: SxProps<Theme>;
}

export const WrfGradientHero = React.forwardRef<HTMLDivElement, WrfGradientHeroProps>(
  function WrfGradientHero(
    { label, value, fraction, unit, sub, children, variant = 'blue', valueProps, sx, ...rest },
    ref,
  ) {
    const look = GRADIENTS[variant];
    const muted = variant === 'muted';
    const foreground = muted ? palette.text.primary : '#FFFFFF';
    const dim = muted ? palette.text.secondary : 'rgba(255,255,255,0.78)';
    return (
      <Box
        ref={ref}
        sx={[
          {
            position: 'relative',
            overflow: 'hidden',
            borderRadius: `${borderRadiusScale.lg}px`,
            padding: { xs: `${spacingScale.lg}px`, md: `${spacingScale.xl}px` },
            background: look.background,
            boxShadow: muted ? 'none' : `${shadows.lg}, ${look.glow}`,
            border: muted ? '1px solid rgba(51, 65, 85, 0.5)' : '1px solid rgba(255,255,255,0.08)',
            color: foreground,
            minHeight: 160,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ] as SxProps<Theme>}
        {...rest}
      >
        {!muted && (
          <Box
            aria-hidden="true"
            sx={{
              position: 'absolute',
              right: -60,
              top: -80,
              width: 260,
              height: 260,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              pointerEvents: 'none',
            }}
          />
        )}
        <Typography
          component="div"
          sx={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: dim, mb: 1 }}
        >
          {label}
        </Typography>
        <Box
          component="div"
          sx={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}
          {...valueProps}
        >
          <Box component="span" sx={{ fontSize: { xs: '2.25rem', md: '3rem' }, fontWeight: 700 }}>{value}</Box>
          {fraction != null && (
            <Box component="span" sx={{ fontSize: { xs: '1.125rem', md: '1.5rem' }, fontWeight: 600, color: dim }}>{fraction}</Box>
          )}
          {unit != null && (
            <Box component="span" sx={{ fontSize: '1.125rem', fontWeight: 600, ml: 1, color: dim }}>{unit}</Box>
          )}
        </Box>
        {sub != null && (
          <Typography component="div" sx={{ mt: 1.5, fontSize: '0.8125rem', color: dim }}>{sub}</Typography>
        )}
        {children != null && (
          <Box sx={{ mt: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>{children}</Box>
        )}
      </Box>
    );
  },
);

export default WrfGradientHero;
