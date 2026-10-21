// WrfStatCard - Metric card with value, trend arrow, and sparkline
import React, { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { colors, borderRadius, spacing, shadows } from './tokens-compat';

const Sparkline = ({ data = [], color = colors.brand.primary, width = 80, height = 32 }) => {
  const points = useMemo(() => {
    if (!data || data.length < 2) return '';
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const stepX = width / (data.length - 1);

    return data
      .map((val, i) => {
        const x = i * stepX;
        const y = height - ((val - min) / range) * height;
        return `${x},${y}`;
      })
      .join(' ');
  }, [data, width, height]);

  if (!data || data.length < 2) return null;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={`sparkGrad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {points && (
        <>
          <polygon
            points={`0,${height} ${points} ${width},${height}`}
            fill={`url(#sparkGrad-${color.replace('#', '')})`}
          />
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
};

const WrfStatCard = ({
  value,
  label,
  trend,
  trendLabel,
  icon: IconComponent,
  sparklineData,
  color = colors.brand.primary,
  sx = {},
  ...props
}) => {
  const trendIsPositive = typeof trend === 'number' && trend > 0;
  const trendIsNegative = typeof trend === 'number' && trend < 0;
  const trendColor = trendIsPositive
    ? colors.success.main
    : trendIsNegative
      ? colors.error.main
      : colors.text.muted;

  return (
    <Box
      sx={{
        backgroundColor: colors.bg.secondary,
        border: `1px solid ${colors.border.default}`,
        borderRadius: `${borderRadius.lg}px`,
        padding: `${spacing.lg}px`,
        position: 'relative',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s ease',
        '&:hover': {
          boxShadow: shadows.md,
        },
        ...sx,
      }}
      {...props}
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
          borderRadius: `${borderRadius.lg}px ${borderRadius.lg}px 0 0`,
        }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Label */}
          <Typography
            sx={{
              fontSize: '0.75rem',
              fontWeight: 500,
              color: colors.text.muted,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: `${spacing.xs}px`,
            }}
          >
            {label}
          </Typography>

          {/* Value */}
          <Typography
            sx={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: colors.text.primary,
              lineHeight: 1.2,
              marginBottom: `${spacing.sm}px`,
            }}
          >
            {value}
          </Typography>

          {/* Trend */}
          {typeof trend === 'number' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {trendIsPositive && (
                <ArrowUpwardIcon sx={{ fontSize: 14, color: trendColor }} />
              )}
              {trendIsNegative && (
                <ArrowDownwardIcon sx={{ fontSize: 14, color: trendColor }} />
              )}
              <Typography
                component="span"
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: trendColor,
                }}
              >
                {Math.abs(trend)}%
              </Typography>
              {trendLabel && (
                <Typography
                  component="span"
                  sx={{
                    fontSize: '0.75rem',
                    color: colors.text.muted,
                    marginLeft: '4px',
                  }}
                >
                  {trendLabel}
                </Typography>
              )}
            </Box>
          )}
        </Box>

        {/* Icon */}
        {IconComponent && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: `${borderRadius.md}px`,
              backgroundColor: `${color}15`,
              flexShrink: 0,
            }}
          >
            <IconComponent sx={{ fontSize: 22, color }} />
          </Box>
        )}
      </Box>

      {/* Sparkline */}
      {sparklineData && sparklineData.length >= 2 && (
        <Box sx={{ marginTop: `${spacing.md}px` }}>
          <Sparkline data={sparklineData} color={color} width={200} height={32} />
        </Box>
      )}
    </Box>
  );
};

export default WrfStatCard;
