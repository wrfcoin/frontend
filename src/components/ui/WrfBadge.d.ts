import React from 'react';

interface WrfBadgeProps {
  status?: 'online' | 'offline' | 'degraded' | 'pending' | 'syncing';
  label?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  sx?: Record<string, any>;
  [key: string]: any;
}

declare const WrfBadge: React.FC<WrfBadgeProps>;
export default WrfBadge;
