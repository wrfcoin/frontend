import React from 'react';
import { useLocation } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';

const PageWrapper = ({ children, tabType }) => {
  // Reset the error boundary on each navigation so a crash on one route
  // doesn't block unrelated routes from rendering.
  const { key } = useLocation();

  return (
    <div className="page-container">
      <div className="page-content">
        <ErrorBoundary key={key}>
          {children}
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default PageWrapper;
