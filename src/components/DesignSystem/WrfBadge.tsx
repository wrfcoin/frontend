import React from 'react';
import Chip, { type ChipProps } from '@mui/material/Chip';
import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';

type WrfBadgeVariant = 'dot' | 'count';
type WrfBadgeStatus = 'active' | 'warning' | 'error' | 'info' | 'neutral';

export interface WrfBadgeProps extends Omit<ChipProps, 'variant' | 'color' | 'size'> {
  variant?: WrfBadgeVariant;
  status?: WrfBadgeStatus;
  count?: number;
  maxCount?: number;
  className?: string;
  sx?: SxProps<Theme>;
}

export const statusColorMap: Record<
  WrfBadgeStatus,
  { bg: string; text: string; lightText: string; dot: string }
> = {
  // `lightText` is the light-theme text: the 700-800 shade of each hue, which holds 4.5:1 over the
  // translucent chip background on a white or slate-100 surface (the 500 shades sat near 2:1 there).
  active: { bg: 'rgba(16, 185, 129, 0.15)', text: '#34D399', lightText: '#065F46', dot: '#10B981' },
  warning: { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B', lightText: '#92400E', dot: '#F59E0B' },
  error: { bg: 'rgba(239, 68, 68, 0.15)', text: '#F87171', lightText: '#991B1B', dot: '#EF4444' },
  info: { bg: 'rgba(14, 165, 233, 0.15)', text: '#38BDF8', lightText: '#075985', dot: '#0EA5E9' },
  neutral: { bg: 'rgba(100, 116, 139, 0.15)', text: '#94A3B8', lightText: '#475569', dot: '#94A3B8' },
};

export const WrfBadge = React.forwardRef<HTMLDivElement, WrfBadgeProps>(
  function WrfBadge(
    {
      variant = 'dot',
      status = 'neutral',
      count,
      maxCount = 99,
      label,
      sx,
      ...rest
    },
    ref,
  ) {
    const colors = statusColorMap[status];
    const displayCount =
      count !== undefined && count > maxCount ? `${maxCount}+` : count;

    const dotIcon =
      variant === 'dot' ? (
        <Box
          component="span"
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: colors.dot,
            flexShrink: 0,
          }}
        />
      ) : undefined;

    const chipLabel =
      variant === 'count' ? displayCount ?? label : label;

    return (
      <Chip
        ref={ref}
        size="small"
        icon={dotIcon}
        label={chipLabel}
        sx={[
          {
            bgcolor: colors.bg,
            color: (theme) => theme.palette.mode === 'dark' ? colors.text : colors.lightText,
            fontWeight: 600,
            fontSize: '0.75rem',
            height: 24,
            '& .MuiChip-icon': {
              ml: '6px',
              mr: '-2px',
            },
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ] as SxProps<Theme>}
        {...rest}
      />
    );
  },
);
