// UI Stub - Button component
import React from 'react';

export const Button = ({ children, variant = 'default', size = 'default', className = '', ...props }) => {
  const baseStyle = {
    padding: size === 'sm' ? '6px 12px' : size === 'lg' ? '12px 24px' : '8px 16px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: size === 'sm' ? '12px' : size === 'lg' ? '16px' : '14px',
    fontWeight: '500',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  };

  const variantStyle = {
    default: { background: '#3498db', color: '#fff' },
    ghost: { background: 'transparent', color: '#fff' },
    outline: { background: 'transparent', border: '1px solid #444', color: '#fff' },
    destructive: { background: '#e74c3c', color: '#fff' },
    secondary: { background: '#333', color: '#fff' },
  };

  return (
    <button
      className={`btn ${className}`}
      style={{ ...baseStyle, ...variantStyle[variant] }}
      {...props}
    >
      {children}
    </button>
  );
};
