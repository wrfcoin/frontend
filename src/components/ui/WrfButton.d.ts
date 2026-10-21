import React from 'react';

interface WrfButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  children?: React.ReactNode;
  onClick?: React.MouseEventHandler;
  fullWidth?: boolean;
  sx?: Record<string, any>;
  [key: string]: any;
}

declare const WrfButton: React.FC<WrfButtonProps>;
export default WrfButton;
