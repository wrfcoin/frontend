import React from 'react';
import './PageNavigator.css';

const PageNavigator = ({ currentPage, totalPages, onNavigate, title }) => {
  const isFirstPage = currentPage <= 0;
  const isLastPage = currentPage >= totalPages - 1;

  return (
    <div className="page-navigator">
      <button
        className="taskbar-nav-btn"
        onClick={() => !isFirstPage && onNavigate(currentPage - 1)}
        disabled={isFirstPage}
        title={isFirstPage ? 'First page' : 'Previous page'}
        aria-label="Previous page"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <div className="current-location">
        <span>{title}</span>
      </div>

      <button
        className="taskbar-nav-btn"
        onClick={() => !isLastPage && onNavigate(currentPage + 1)}
        disabled={isLastPage}
        title={isLastPage ? 'Last page' : 'Next page'}
        aria-label="Next page"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
};

export default PageNavigator;
