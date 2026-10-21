import React from 'react';

interface WrfEmptyStateProps {
  icon?: React.ComponentType<any>;
  title?: React.ReactNode;
  description?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'default' | 'search' | 'error' | 'no-data';
  sx?: Record<string, any>;
  [key: string]: any;
}

declare const WrfEmptyState: React.FC<WrfEmptyStateProps>;
export default WrfEmptyState;
