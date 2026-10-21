import React from 'react';
import { Link } from 'react-router';
import './NotFound.css';

/**
 * 404 Not Found component for invalid routes
 */
const NotFound = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you are looking for does not exist or has been moved.</p>

        <div className="not-found-links">
          <Link to="/" className="button primary">
            Back to Home
          </Link>
        </div>

        <div className="not-found-help">
          <h3>Looking for something?</h3>
          <ul>
            <li>
              <Link to="/terms">Terms</Link>
            </li>
            <li>
              <Link to="/security">Security Notice</Link>
            </li>
            <li>
              <Link to="/privacy">Privacy</Link>
            </li>
            <li>
              <Link to="/api-terms">API Terms</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="not-found-graphic">
        <svg
          width="200"
          height="200"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 10L10 100L100 190L190 100L100 10Z"
            stroke="#1E88E5"
            strokeWidth="8"
            fill="none"
          />
          <path
            d="M100 40L40 100L100 160L160 100L100 40Z"
            stroke="#1E88E5"
            strokeWidth="4"
            fill="none"
          />
          <path d="M100 70L70 100L100 130L130 100L100 70Z" fill="#1E88E5" />
          <path
            d="M30 100H170"
            stroke="#E53935"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M170 100L150 80"
            stroke="#E53935"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M170 100L150 120"
            stroke="#E53935"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
};

export default NotFound;
