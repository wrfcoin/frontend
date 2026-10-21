import React from 'react';
import Button, { type ButtonProps as MuiButtonProps } from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import type { SxProps, Theme } from '@mui/material/styles';

type WrfButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type WrfButtonSize = 'sm' | 'md' | 'lg';

export interface WrfButtonProps
  extends Omit<MuiButtonProps, 'variant' | 'size' | 'color'> {
  variant?: WrfButtonVariant;
  size?: WrfButtonSize;
  loading?: boolean;
  className?: string;
  sx?: SxProps<Theme>;
}

const sizeMap: Record<WrfButtonSize, MuiButtonProps['size']> = {
  sm: 'small',
  md: 'medium',
  lg: 'large',
};

const sizeSx: Record<WrfButtonSize, SxProps<Theme>> = {
  sm: { px: 2, py: 0.5, fontSize: '0.8125rem' },
  md: { px: 2.5, py: 1, fontSize: '0.875rem' },
  lg: { px: 3.5, py: 1.5, fontSize: '1rem' },
};

function mapVariant(variant: WrfButtonVariant): {
  muiVariant: MuiButtonProps['variant'];
  muiColor: MuiButtonProps['color'];
  extraSx: SxProps<Theme>;
} {
  switch (variant) {
  case 'primary':
    return { muiVariant: 'contained', muiColor: 'primary', extraSx: {} };
  case 'secondary':
    return { muiVariant: 'contained', muiColor: 'secondary', extraSx: {} };
  case 'outline':
    return { muiVariant: 'outlined', muiColor: 'primary', extraSx: {} };
  case 'ghost':
    return { muiVariant: 'text', muiColor: 'primary', extraSx: {} };
  case 'danger':
    return { muiVariant: 'contained', muiColor: 'error', extraSx: {} };
  }
}

export const WrfButton = React.forwardRef<HTMLButtonElement, WrfButtonProps>(
  function WrfButton(
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      children,
      sx,
      ...rest
    },
    ref,
  ) {
    const { muiVariant, muiColor, extraSx } = mapVariant(variant);

    return (
      <Button
        ref={ref}
        variant={muiVariant}
        color={muiColor}
        size={sizeMap[size]}
        disabled={disabled || loading}
        sx={[sizeSx[size] as any, extraSx as any, ...(Array.isArray(sx) ? sx : [sx])] as SxProps<Theme>}
        {...rest}
      >
        {loading ? (
          <>
            <CircularProgress
              size={size === 'sm' ? 14 : size === 'lg' ? 22 : 18}
              color="inherit"
              sx={{ mr: 1 }}
            />
            {children}
          </>
        ) : (
          children
        )}
      </Button>
    );
  },
);
