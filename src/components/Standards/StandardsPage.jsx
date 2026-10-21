import React, { useState } from 'react';
import { Link, useLocation } from 'react-router';
import PageTitle from '../common/PageTitle';
import './StandardsPage.css';

const StandardsPage = ({ children }) => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const isActive = path => {
    return location.pathname === path || location.pathname.includes(path);
  };

  return (
    <div className="standards-container">
      <PageTitle
        title="Blockchain Standards"
        subtitle="Technical specifications and implementations for blockchain interoperability"
      />

      <div className="standards-content-wrapper">
        <div className="standards-sidebar">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search standards"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-title">Overview</h3>
            <ul className="sidebar-links">
              <li className={isActive('/standards/overview') ? 'active' : ''}>
                <Link to="/standards/overview">What are Standards?</Link>
              </li>
              <li className={isActive('/standards/benefits') ? 'active' : ''}>
                <Link to="/standards/benefits">Key Benefits</Link>
              </li>
            </ul>
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-title">Ethereum Standards</h3>
            <ul className="sidebar-links">
              <li className={isActive('/standards/eip712') ? 'active' : ''}>
                <Link to="/standards/eip712">EIP-712: Typed Data Signing</Link>
              </li>
              <li className={isActive('/standards/erc4626') ? 'active' : ''}>
                <Link to="/standards/erc4626">ERC-4626: Tokenized Vaults</Link>
              </li>
              <li className={isActive('/standards/erc721') ? 'active' : ''}>
                <Link to="/standards/erc721">ERC-721: Non-Fungible Tokens</Link>
              </li>
              <li className={isActive('/standards/erc1155') ? 'active' : ''}>
                <Link to="/standards/erc1155">
                  ERC-1155: Multi-Token Standard
                </Link>
              </li>
            </ul>
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-title">Cross-Chain Standards</h3>
            <ul className="sidebar-links">
              <li className={isActive('/standards/ibc') ? 'active' : ''}>
                <Link to="/standards/ibc">IBC Protocol</Link>
              </li>
              <li className={isActive('/standards/xcmp') ? 'active' : ''}>
                <Link to="/standards/xcmp">XCMP (Polkadot)</Link>
              </li>
            </ul>
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-title">Data Standards</h3>
            <ul className="sidebar-links">
              <li className={isActive('/standards/wrfml') ? 'active' : ''}>
                <Link to="/standards/wrfml">WrfML Data Format</Link>
              </li>
              <li className={isActive('/standards/wxm') ? 'active' : ''}>
                <Link to="/standards/wxm">WXM Protocol</Link>
              </li>
            </ul>
          </div>

          <div className="last-edited">Last edited by Core Dev Team</div>
        </div>

        <div className="standards-content">{children}</div>
      </div>
    </div>
  );
};

export default StandardsPage;
