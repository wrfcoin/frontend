import React from 'react';
import Skeleton, { type SkeletonProps } from '@mui/material/Skeleton';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import type { SxProps, Theme } from '@mui/material/styles';

type WrfSkeletonVariant = 'text' | 'circle' | 'rect' | 'card';

export interface WrfSkeletonProps extends Omit<SkeletonProps, 'variant'> {
  variant?: WrfSkeletonVariant;
  /** Number of text lines (only for variant="text") */
  lines?: number;
  className?: string;
  sx?: SxProps<Theme>;
}

const muiVariantMap: Record<WrfSkeletonVariant, SkeletonProps['variant']> = {
  text: 'text',
  circle: 'circular',
  rect: 'rectangular',
  card: 'rectangular',
};

export const WrfSkeleton = React.forwardRef<HTMLSpanElement, WrfSkeletonProps>(
  function WrfSkeleton(
    { variant = 'text', lines = 3, width, height, sx, ...rest },
    ref,
  ) {
    if (variant === 'card') {
      return (
        <Box
          ref={ref}
          sx={[
            {
              borderRadius: 2,
              overflow: 'hidden',
            },
            ...(Array.isArray(sx) ? sx : [sx]),
          ] as SxProps<Theme>}
        >
          <Skeleton
            variant="rectangular"
            width="100%"
            height={height ?? 140}
            animation="pulse"
          />
          <Box sx={{ p: 2 }}>
            <Skeleton variant="text" width="60%" sx={{ fontSize: '1.25rem', mb: 1 }} />
            <Skeleton variant="text" width="80%" />
            <Skeleton variant="text" width="40%" />
          </Box>
        </Box>
      );
    }

    if (variant === 'text' && lines > 1) {
      return (
        <Stack
          ref={ref as any}
          spacing={0.75}
          sx={sx}
        >
          {Array.from({ length: lines }, (_, i) => (
            <Skeleton
              key={i}
              variant="text"
              width={i === lines - 1 ? '60%' : '100%'}
              animation="pulse"
              {...rest}
            />
          ))}
        </Stack>
      );
    }

    return (
      <Skeleton
        ref={ref}
        variant={muiVariantMap[variant]}
        width={width ?? (variant === 'circle' ? 40 : undefined)}
        height={height ?? (variant === 'circle' ? 40 : variant === 'rect' ? 120 : undefined)}
        animation="pulse"
        sx={sx}
        {...rest}
      />
    );
  },
);
