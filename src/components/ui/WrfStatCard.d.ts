import React from 'react';

interface WrfStatCardProps {
  value?: React.ReactNode;
  label?: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  icon?: React.ComponentType<any>;
  sparklineData?: number[];
  color?: string;
  sx?: Record<string, any>;
  [key: string]: any;
}

declare const WrfStatCard: React.FC<WrfStatCardProps>;
export default WrfStatCard;
