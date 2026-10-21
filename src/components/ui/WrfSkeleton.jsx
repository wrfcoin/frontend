// WrfSkeleton - Content skeleton loaders for various layout shapes
import React from 'react';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import { colors, borderRadius, spacing } from './tokens-compat';

const skeletonSx = {
  backgroundColor: colors.bg.tertiary,
  '&::after': {
    background: 'linear-gradient(90deg, transparent, rgba(248,250,252,0.04), transparent)',
  },
};

const CardSkeleton = ({ width, height }) => (
  <Box sx={{ width: width || '100%' }}>
    <Skeleton
      variant="rectangular"
      width="100%"
      height={height || 160}
      animation="wave"
      sx={{ ...skeletonSx, borderRadius: `${borderRadius.lg}px` }}
    />
    <Box sx={{ padding: `${spacing.md}px 0` }}>
      <Skeleton variant="text" width="70%" height={24} animation="wave" sx={skeletonSx} />
      <Skeleton variant="text" width="90%" height={18} animation="wave" sx={skeletonSx} />
      <Skeleton variant="text" width="50%" height={18} animation="wave" sx={skeletonSx} />
    </Box>
  </Box>
);

const TableRowSkeleton = ({ width }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: `${spacing.md}px`,
      padding: `${spacing.sm}px 0`,
      width: width || '100%',
    }}
  >
    <Skeleton variant="circular" width={32} height={32} animation="wave" sx={skeletonSx} />
    <Skeleton variant="text" width="25%" height={20} animation="wave" sx={skeletonSx} />
    <Skeleton variant="text" width="20%" height={20} animation="wave" sx={skeletonSx} />
    <Skeleton variant="text" width="15%" height={20} animation="wave" sx={skeletonSx} />
    <Skeleton variant="text" width="10%" height={20} animation="wave" sx={skeletonSx} />
  </Box>
);

const ChartSkeleton = ({ width, height }) => (
  <Skeleton
    variant="rectangular"
    width={width || '100%'}
    height={height || 300}
    animation="wave"
    sx={{ ...skeletonSx, borderRadius: `${borderRadius.md}px` }}
  />
);

const TextSkeleton = ({ width }) => (
  <Box sx={{ width: width || '100%' }}>
    <Skeleton variant="text" width="100%" height={20} animation="wave" sx={skeletonSx} />
    <Skeleton variant="text" width="85%" height={20} animation="wave" sx={skeletonSx} />
    <Skeleton variant="text" width="92%" height={20} animation="wave" sx={skeletonSx} />
    <Skeleton variant="text" width="60%" height={20} animation="wave" sx={skeletonSx} />
  </Box>
);

const AvatarSkeleton = ({ width, height }) => {
  const size = width || height || 40;
  return (
    <Skeleton
      variant="circular"
      width={size}
      height={size}
      animation="wave"
      sx={skeletonSx}
    />
  );
};

const StatCardSkeleton = ({ width }) => (
  <Box
    sx={{
      width: width || '100%',
      backgroundColor: colors.bg.secondary,
      borderRadius: `${borderRadius.lg}px`,
      padding: `${spacing.lg}px`,
      border: `1px solid ${colors.border.default}`,
    }}
  >
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width={80} height={16} animation="wave" sx={skeletonSx} />
        <Skeleton variant="text" width={120} height={36} animation="wave" sx={skeletonSx} />
      </Box>
      <Skeleton variant="circular" width={36} height={36} animation="wave" sx={skeletonSx} />
    </Box>
    <Skeleton
      variant="rectangular"
      width="100%"
      height={40}
      animation="wave"
      sx={{ ...skeletonSx, borderRadius: `${borderRadius.sm}px` }}
    />
  </Box>
);

const variantMap = {
  card: CardSkeleton,
  'table-row': TableRowSkeleton,
  chart: ChartSkeleton,
  text: TextSkeleton,
  avatar: AvatarSkeleton,
  'stat-card': StatCardSkeleton,
};

const WrfSkeleton = ({
  variant = 'text',
  count = 1,
  width,
  height,
  sx = {},
  ...props
}) => {
  const SkeletonComponent = variantMap[variant] || variantMap.text;
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${spacing.sm}px`, ...sx }} {...props}>
      {items.map((i) => (
        <SkeletonComponent key={i} width={width} height={height} />
      ))}
    </Box>
  );
};

export default WrfSkeleton;
