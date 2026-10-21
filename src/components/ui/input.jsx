// UI Stub - Input component
import React from 'react';

export const Input = React.forwardRef(({ className = '', ...props }, ref) => (
  <input
    ref={ref}
    className={`input ${className}`}
    style={{
      padding: '10px 14px',
      background: '#1a1a2e',
      border: '1px solid #333',
      borderRadius: '6px',
      color: '#fff',
      fontSize: '14px',
      width: '100%',
      outline: 'none',
    }}
    {...props}
  />
));

Input.displayName = 'Input';
