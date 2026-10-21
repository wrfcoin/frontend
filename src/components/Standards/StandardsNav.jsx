import React from 'react';
import { Link, useLocation } from 'react-router';
import './StandardsNav.css';

const StandardsNav = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="standards-nav">
      <h2>Ethereum Standards</h2>
      <div className="standards-links">
        <Link
          to="/standards/eip712"
          className={`standard-link ${currentPath.includes('/standards/eip712') ? 'active' : ''}`}
        >
          <div className="standard-icon">
            <i className="bi bi-shield-lock"></i>
          </div>
          <div className="standard-info">
            <div className="standard-title">EIP-712</div>
            <div className="standard-subtitle">Structured Data Signing</div>
          </div>
        </Link>

        <Link
          to="/standards/erc4626"
          className={`standard-link ${currentPath.includes('/standards/erc4626') ? 'active' : ''}`}
        >
          <div className="standard-icon">
            <i className="bi bi-bank"></i>
          </div>
          <div className="standard-info">
            <div className="standard-title">ERC-4626</div>
            <div className="standard-subtitle">Tokenized Vaults</div>
          </div>
        </Link>
      </div>

      <div className="standards-description">
        <p>
          Wrfcoin implements key Ethereum standards to ensure compatibility and
          interoperability with the broader blockchain ecosystem.
        </p>
      </div>
    </div>
  );
};

export default StandardsNav;
