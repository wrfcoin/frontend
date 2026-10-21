// UI Stub - Avatar components
import React from 'react';

export const Avatar = ({ children, className = '', ...props }) => (
  <div
    className={`avatar ${className}`}
    style={{
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#333',
    }}
    {...props}
  >
    {children}
  </div>
);

export const AvatarImage = ({ src, alt = '', className = '', ...props }) => (
  <img
    src={src}
    alt={alt}
    className={`avatar-image ${className}`}
    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    {...props}
  />
);

export const AvatarFallback = ({ children, className = '', ...props }) => (
  <span
    className={`avatar-fallback ${className}`}
    style={{
      color: '#fff',
      fontSize: '14px',
      fontWeight: '500',
    }}
    {...props}
  >
    {children}
  </span>
);
