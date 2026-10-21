import React from 'react';
import Card, { type CardProps as MuiCardProps } from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import type { SxProps, Theme } from '@mui/material/styles';

type WrfCardVariant = 'elevated' | 'outlined' | 'filled';

export interface WrfCardProps extends Omit<MuiCardProps, 'variant'> {
  variant?: WrfCardVariant;
  header?: React.ReactNode;
  headerTitle?: string;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  noPadding?: boolean;
  className?: string;
  sx?: SxProps<Theme>;
}

const variantSx: Record<WrfCardVariant, SxProps<Theme>> = {
  elevated: {
    boxShadow: (theme) =>
      theme.palette.mode === 'dark'
        ? '0 4px 6px -1px rgba(0,0,0,0.3), 0 2px 4px -1px rgba(0,0,0,0.2)'
        : '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.06)',
  },
  outlined: {
    boxShadow: 'none',
    border: (theme) =>
      `1px solid ${theme.palette.divider}`,
  },
  filled: {
    boxShadow: 'none',
    bgcolor: (theme) =>
      theme.palette.mode === 'dark'
        ? 'rgba(51, 65, 85, 0.3)'
        : 'rgba(241, 245, 249, 0.8)',
    border: 'none',
  },
};

export const WrfCard = React.forwardRef<HTMLDivElement, WrfCardProps>(
  function WrfCard(
    {
      variant = 'elevated',
      header,
      headerTitle,
      headerAction,
      footer,
      noPadding = false,
      children,
      sx,
      ...rest
    },
    ref,
  ) {
    const showHeader = header || headerTitle || headerAction;

    return (
      <Card
        ref={ref}
        elevation={0}
        sx={[variantSx[variant] as any, ...(Array.isArray(sx) ? sx : [sx])] as SxProps<Theme>}
        {...rest}
      >
        {showHeader && (
          <>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 2.5,
                py: 2,
                minHeight: 56,
              }}
            >
              {header ?? (
                <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                  {headerTitle}
                </Typography>
              )}
              {headerAction && <Box>{headerAction}</Box>}
            </Box>
            <Divider />
          </>
        )}

        {noPadding ? (
          <Box>{children}</Box>
        ) : (
          <CardContent sx={{ px: 2.5, py: 2, '&:last-child': { pb: 2 } }}>
            {children}
          </CardContent>
        )}

        {footer && (
          <>
            <Divider />
            <CardActions sx={{ px: 2.5, py: 1.5 }}>{footer}</CardActions>
          </>
        )}
      </Card>
    );
  },
);
