import React from 'react';
import './PageTitle.css';

const ChevronLeftIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const PageTitle = ({
  title,
  subtitle,
  stats,
  actions,
  showNavigation = false,
  onPrev,
  onNext,
  prevLabel,
  nextLabel,
}) => {
  return (
    <div className="page-title-container">
      <div className="page-title-content">
        <div className="page-title-left">
          <div className="page-title-nav-wrapper">
            {showNavigation && onPrev && (
              <button
                className="page-nav-btn page-nav-prev"
                onClick={onPrev}
                title={prevLabel ? `Go to ${prevLabel}` : 'Previous page'}
                aria-label={prevLabel ? `Go to ${prevLabel}` : 'Previous page'}
              >
                <ChevronLeftIcon />
              </button>
            )}
            <h1 className="page-title">{title}</h1>
            {showNavigation && onNext && (
              <button
                className="page-nav-btn page-nav-next"
                onClick={onNext}
                title={nextLabel ? `Go to ${nextLabel}` : 'Next page'}
                aria-label={nextLabel ? `Go to ${nextLabel}` : 'Next page'}
              >
                <ChevronRightIcon />
              </button>
            )}
          </div>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>

        {stats && (
          <div className="page-stats">
            {Object.entries(stats).map(([key, value]) => (
              <div key={key} className="stat-item">
                <span className="stat-label">{key}</span>
                <span className="stat-value">{value}</span>
              </div>
            ))}
          </div>
        )}

        {actions && <div className="page-actions">{actions}</div>}
      </div>
      <div className="page-title-divider"></div>
    </div>
  );
};

export default PageTitle;
