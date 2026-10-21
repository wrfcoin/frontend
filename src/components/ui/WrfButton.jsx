// WrfButton - Themed button with variants, sizes, and loading state
import React from 'react';
import MuiButton from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { colors, borderRadius } from './tokens-compat';

const variantConfig = {
  primary: {
    backgroundColor: colors.brand.primary,
    color: '#FFFFFF',
    border: 'none',
    '&:hover': {
      backgroundColor: colors.brand.hover,
    },
    '&:active': {
      backgroundColor: colors.brand.active,
    },
  },
  secondary: {
    backgroundColor: 'transparent',
    color: colors.brand.primary,
    border: `1px solid ${colors.brand.primary}`,
    '&:hover': {
      backgroundColor: 'rgba(59, 130, 246, 0.08)',
    },
  },
  ghost: {
    backgroundColor: 'transparent',
    color: colors.text.secondary,
    border: 'none',
    '&:hover': {
      backgroundColor: 'rgba(148, 163, 184, 0.08)',
      color: colors.text.primary,
    },
  },
  danger: {
    backgroundColor: colors.error.main,
    color: '#FFFFFF',
    border: 'none',
    '&:hover': {
      backgroundColor: colors.error.dark,
    },
  },
};

const sizeConfig = {
  sm: {
    padding: '4px 12px',
    fontSize: '0.75rem',
    minHeight: '28px',
  },
  md: {
    padding: '8px 20px',
    fontSize: '0.875rem',
    minHeight: '36px',
  },
  lg: {
    padding: '12px 28px',
    fontSize: '1rem',
    minHeight: '44px',
  },
};

const WrfButton = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  startIcon,
  endIcon,
  children,
  onClick,
  fullWidth = false,
  sx = {},
  ...props
}) => {
  const vStyle = variantConfig[variant] || variantConfig.primary;
  const sStyle = sizeConfig[size] || sizeConfig.md;
  const isDisabled = disabled || loading;

  const spinnerSize = size === 'sm' ? 14 : size === 'lg' ? 22 : 18;

  return (
    <MuiButton
      onClick={onClick}
      disabled={isDisabled}
      fullWidth={fullWidth}
      disableElevation
      disableRipple={false}
      sx={{
        textTransform: 'none',
        borderRadius: `${borderRadius.md}px`,
        fontWeight: 500,
        lineHeight: 1.5,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.15s ease',
        ...vStyle,
        ...sStyle,
        '&.Mui-disabled': {
          opacity: 0.5,
          color: vStyle.color,
          backgroundColor: vStyle.backgroundColor,
          border: vStyle.border,
        },
        ...sx,
      }}
      {...props}
    >
      {loading ? (
        <CircularProgress
          size={spinnerSize}
          sx={{ color: 'inherit' }}
        />
      ) : (
        <>
          {startIcon && <span style={{ display: 'flex', alignItems: 'center' }}>{startIcon}</span>}
          {children}
          {endIcon && <span style={{ display: 'flex', alignItems: 'center' }}>{endIcon}</span>}
        </>
      )}
    </MuiButton>
  );
};

export default WrfButton;
