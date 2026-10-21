import React, { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import type { SxProps, Theme } from '@mui/material/styles';
import { palette, spacingScale, borderRadiusScale, shadowScale } from './tokens';

interface SparklineProps {
  data: number[];
  color: string;
  width: number;
  height: number;
}

const Sparkline: React.FC<SparklineProps> = ({ data, color, width, height }) => {
  const points = useMemo(() => {
    if (!data || data.length < 2) return '';
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const stepX = width / (data.length - 1);
    return data
      .map((val, i) => `${i * stepX},${height - ((val - min) / range) * height}`)
      .join(' ');
  }, [data, width, height]);

  if (!data || data.length < 2) return null;

  const gradientId = `sparkGrad-${color.replace('#', '')}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${points} ${width},${height}`} fill={`url(#${gradientId})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export interface WrfStatCardProps {
  value: React.ReactNode;
  label: string;
  trend?: number;
  trendLabel?: string;
  icon?: React.ElementType;
  sparklineData?: number[];
  color?: string;
  sx?: SxProps<Theme>;
}

export const WrfStatCard = React.forwardRef<HTMLDivElement, WrfStatCardProps>(
  function WrfStatCard(
    {
      value,
      label,
      trend,
      trendLabel,
      icon: IconComponent,
      sparklineData,
      color = palette.primary.main,
      sx,
      ...rest
    },
    ref,
  ) {
    const hasTrend = typeof trend === 'number';
    const trendIsPositive = hasTrend && trend > 0;
    const trendIsNegative = hasTrend && trend < 0;
    const trendColor = trendIsPositive
      ? palette.success.main
      : trendIsNegative
        ? palette.error.main
        : palette.text.muted;

    return (
      <Box
        ref={ref}
        sx={[
          {
            backgroundColor: palette.background.secondary,
            border: `1px solid rgba(51, 65, 85, 0.5)`,
            borderRadius: `${borderRadiusScale.lg}px`,
            padding: `${spacingScale.lg}px`,
            position: 'relative',
            overflow: 'hidden',
            transition: 'box-shadow 0.2s ease',
            '&:hover': { boxShadow: shadowScale.md },
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ] as SxProps<Theme>}
        {...rest}
      >
        {/* Colored accent line at top */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            backgroundColor: color,
            borderRadius: `${borderRadiusScale.lg}px ${borderRadiusScale.lg}px 0 0`,
          }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: '0.75rem',
                fontWeight: 500,
                color: palette.text.muted,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                mb: `${spacingScale.xs}px`,
              }}
            >
              {label}
            </Typography>

            <Typography
              sx={{
                fontSize: '1.75rem',
                fontWeight: 700,
                color: palette.text.primary,
                lineHeight: 1.2,
                mb: `${spacingScale.sm}px`,
              }}
            >
              {value}
            </Typography>

            {hasTrend && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {trendIsPositive && <ArrowUpwardIcon sx={{ fontSize: 14, color: trendColor }} />}
                {trendIsNegative && <ArrowDownwardIcon sx={{ fontSize: 14, color: trendColor }} />}
                <Typography component="span" sx={{ fontSize: '0.75rem', fontWeight: 600, color: trendColor }}>
                  {Math.abs(trend)}%
                </Typography>
                {trendLabel && (
                  <Typography component="span" sx={{ fontSize: '0.75rem', color: palette.text.muted, ml: '4px' }}>
                    {trendLabel}
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          {IconComponent && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: `${borderRadiusScale.md}px`,
                backgroundColor: `${color}15`,
                flexShrink: 0,
              }}
            >
              <IconComponent sx={{ fontSize: 22, color }} />
            </Box>
          )}
        </Box>

        {sparklineData && sparklineData.length >= 2 && (
          <Box sx={{ mt: `${spacingScale.md}px` }}>
            <Sparkline data={sparklineData} color={color} width={200} height={32} />
          </Box>
        )}
      </Box>
    );
  },
);
