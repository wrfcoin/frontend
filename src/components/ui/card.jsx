// UI Stub - Card components
import React from 'react';

export const Card = ({ children, className = '', ...props }) => (
  <div className={`card ${className}`} style={{ background: '#16213e', borderRadius: '12px', padding: '16px', marginBottom: '16px' }} {...props}>
    {children}
  </div>
);

export const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`card-header ${className}`} style={{ marginBottom: '12px' }} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '', ...props }) => (
  <h3 className={`card-title ${className}`} style={{ margin: 0, color: '#fff', fontSize: '18px' }} {...props}>
    {children}
  </h3>
);

export const CardContent = ({ children, className = '', ...props }) => (
  <div className={`card-content ${className}`} {...props}>
    {children}
  </div>
);

export const CardDescription = ({ children, className = '', ...props }) => (
  <p className={`card-description ${className}`} style={{ color: '#888', margin: '4px 0 0 0', fontSize: '14px' }} {...props}>
    {children}
  </p>
);

export const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`card-footer ${className}`} style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #333' }} {...props}>
    {children}
  </div>
);
