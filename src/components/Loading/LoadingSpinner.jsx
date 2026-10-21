/**
 * Loading Spinner Component
 *
 * Optimized loading component for lazy-loaded modules
 */

import React from 'react';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '200px',
        gap: '16px',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #007bff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      ></div>
      <p
        style={{
          color: '#666',
          fontSize: '14px',
          margin: 0,
        }}
      >
        {message}
      </p>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default LoadingSpinner;
