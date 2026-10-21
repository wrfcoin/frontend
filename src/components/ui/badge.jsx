// UI Stub - Badge component
import React from 'react';

export const Badge = ({ children, variant = 'default', className = '', ...props }) => {
  const variantStyle = {
    default: { background: '#3498db', color: '#fff' },
    secondary: { background: '#333', color: '#fff' },
    destructive: { background: '#e74c3c', color: '#fff' },
    outline: { background: 'transparent', border: '1px solid #444', color: '#fff' },
  };

  return (
    <span
      className={`badge ${className}`}
      style={{
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '500',
        display: 'inline-flex',
        alignItems: 'center',
        ...variantStyle[variant],
      }}
      {...props}
    >
      {children}
    </span>
  );
};
