// WrfBadge - Status badge with animated indicators
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import SyncIcon from '@mui/icons-material/Sync';
import { colors, borderRadius } from './tokens-compat';

const statusConfig = {
  online: {
    color: colors.success.main,
    bg: 'rgba(16, 185, 129, 0.12)',
    label: 'Online',
  },
  offline: {
    color: colors.text.muted,
    bg: 'rgba(100, 116, 139, 0.12)',
    label: 'Offline',
  },
  degraded: {
    color: colors.warning.main,
    bg: 'rgba(245, 158, 11, 0.12)',
    label: 'Degraded',
  },
  pending: {
    color: colors.brand.primary,
    bg: 'rgba(59, 130, 246, 0.12)',
    label: 'Pending',
  },
  syncing: {
    color: colors.brand.primary,
    bg: 'rgba(59, 130, 246, 0.12)',
    label: 'Syncing',
  },
};

const sizeConfig = {
  sm: { fontSize: '0.625rem', padding: '2px 8px', dotSize: 6, iconSize: 10 },
  md: { fontSize: '0.75rem', padding: '4px 12px', dotSize: 8, iconSize: 14 },
  lg: { fontSize: '0.875rem', padding: '6px 16px', dotSize: 10, iconSize: 16 },
};

const pulseKeyframes = {
  '@keyframes wrfBadgePulse': {
    '0%': { boxShadow: '0 0 0 0 currentColor' },
    '70%': { boxShadow: '0 0 0 6px transparent' },
    '100%': { boxShadow: '0 0 0 0 transparent' },
  },
};

const spinKeyframes = {
  '@keyframes wrfBadgeSpin': {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
};

const WrfBadge = ({
  status = 'online',
  label,
  size = 'md',
  pulse = false,
  sx = {},
  ...props
}) => {
  const config = statusConfig[status] || statusConfig.online;
  const sizeStyle = sizeConfig[size] || sizeConfig.md;
  const displayLabel = label || config.label;
  const isSyncing = status === 'syncing';

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: config.bg,
        borderRadius: `${borderRadius.full}px`,
        padding: sizeStyle.padding,
        ...pulseKeyframes,
        ...spinKeyframes,
        ...sx,
      }}
      {...props}
    >
      {isSyncing ? (
        <SyncIcon
          sx={{
            fontSize: `${sizeStyle.iconSize}px`,
            color: config.color,
            animation: 'wrfBadgeSpin 1.2s linear infinite',
          }}
        />
      ) : (
        <Box
          component="span"
          sx={{
            width: `${sizeStyle.dotSize}px`,
            height: `${sizeStyle.dotSize}px`,
            borderRadius: '50%',
            backgroundColor: config.color,
            flexShrink: 0,
            color: config.color,
            animation: pulse && status === 'online'
              ? 'wrfBadgePulse 2s ease-in-out infinite'
              : 'none',
          }}
        />
      )}
      <Typography
        component="span"
        sx={{
          fontSize: sizeStyle.fontSize,
          fontWeight: 500,
          color: config.color,
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}
      >
        {displayLabel}
      </Typography>
    </Box>
  );
};

export default WrfBadge;
