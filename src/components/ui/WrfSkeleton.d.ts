import React from 'react';

interface WrfSkeletonProps {
  variant?: 'card' | 'table-row' | 'chart' | 'text' | 'avatar' | 'stat-card';
  count?: number;
  width?: number | string;
  height?: number | string;
  sx?: Record<string, any>;
  [key: string]: any;
}

declare const WrfSkeleton: React.FC<WrfSkeletonProps>;
export default WrfSkeleton;
