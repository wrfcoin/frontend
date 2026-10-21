import React from 'react';

interface WrfCardProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  children?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  sx?: Record<string, any>;
  [key: string]: any;
}

declare const WrfCard: React.FC<WrfCardProps>;
export default WrfCard;
