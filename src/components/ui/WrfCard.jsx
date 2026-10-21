// WrfCard - Themed card component with multiple variants
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { colors, borderRadius, shadows, spacing } from './tokens-compat';

const variantStyles = {
  default: {
    backgroundColor: colors.bg.secondary,
    border: `1px solid ${colors.border.default}`,
  },
  elevated: {
    backgroundColor: colors.bg.secondary,
    border: `1px solid ${colors.border.default}`,
    boxShadow: shadows.lg,
  },
  outlined: {
    backgroundColor: 'transparent',
    border: `1px solid ${colors.border.default}`,
  },
  glass: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    border: '1px solid rgba(51, 65, 85, 0.5)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  },
};

const WrfCard = ({
  variant = 'default',
  children,
  title,
  subtitle,
  action,
  sx = {},
  ...props
}) => {
  const style = variantStyles[variant] || variantStyles.default;

  return (
    <Box
      sx={{
        borderRadius: `${borderRadius.lg}px`,
        padding: `${spacing.lg}px`,
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        ...style,
        ...sx,
      }}
      {...props}
    >
      {(title || action) && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: subtitle ? `${spacing.xs}px` : `${spacing.md}px`,
          }}
        >
          {title && (
            <Typography
              sx={{
                fontSize: '1.125rem',
                fontWeight: 600,
                color: colors.text.primary,
                lineHeight: 1.4,
              }}
            >
              {title}
            </Typography>
          )}
          {action && <Box sx={{ flexShrink: 0, marginLeft: `${spacing.md}px` }}>{action}</Box>}
        </Box>
      )}
      {subtitle && (
        <Typography
          sx={{
            fontSize: '0.875rem',
            color: colors.text.secondary,
            marginBottom: `${spacing.md}px`,
            lineHeight: 1.5,
          }}
        >
          {subtitle}
        </Typography>
      )}
      {children}
    </Box>
  );
};

export default WrfCard;
