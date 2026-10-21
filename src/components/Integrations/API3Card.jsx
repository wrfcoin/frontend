import React, { useState, useEffect } from 'react';
import { WrfButton } from '../DesignSystem';
import './IntegrationCards.css';

const API3Card = ({ integrationState }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [api3Stats, setApi3Stats] = useState({
    totalDapis: 4,
    uptime: '99.9%',
    oracleNodes: 62,
    avgResponseTime: '1.2s',
    governanceProposals: 23,
    activeGovernanceProposals: 2,
    treasurySize: '$23.4M',
    stakedApi3: '37.5M API3',
    lastSync: new Date().toISOString(),
  });

  const [isLoading, setIsLoading] = useState(false);

  const fetchApi3Stats = async () => {
    setIsLoading(true);
    try {
      // In a production environment, this would fetch real data from API3
      // For now, we'll simulate a successful API call
      setTimeout(() => {
        setApi3Stats({
          ...api3Stats,
          lastSync: new Date().toISOString(),
        });
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching API3 stats:', error);
      setIsLoading(false);
    }
  };

  const renderOverviewTab = () => (
    <div className="integration-card-content">
      <div className="integration-description">
        <p>
          API3 provides decentralized API services through first-party oracles,
          enabling direct, tamper-proof data feeds (dAPIs) that can supply
          weather and climate data for Wrfcoin computational NFTs.
        </p>
      </div>

      <div className="integration-stats">
        <div className="stat-item">
          <i className="bi bi-cloud-check"></i>
          <div className="stat-info">
            <span className="stat-value">{api3Stats.totalDapis}</span>
            <span className="stat-label">Available dAPIs</span>
          </div>
        </div>
        <div className="stat-item">
          <i className="bi bi-clock-history"></i>
          <div className="stat-info">
            <span className="stat-value">{api3Stats.uptime}</span>
            <span className="stat-label">Uptime</span>
          </div>
        </div>
        <div className="stat-item">
          <i className="bi bi-shield-check"></i>
          <div className="stat-info">
            <span className="stat-value">{api3Stats.avgResponseTime}</span>
            <span className="stat-label">Avg Response</span>
          </div>
        </div>
      </div>

      <div className="protocol-info">
        <h4>
          <i className="bi bi-info-circle"></i> Protocol Information
        </h4>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Oracle Nodes</span>
            <span className="info-value">{api3Stats.oracleNodes}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Staked API3</span>
            <span className="info-value">{api3Stats.stakedApi3}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Treasury Size</span>
            <span className="info-value">{api3Stats.treasurySize}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDataFeedsTab = () => (
    <div className="integration-card-content">
      <div className="data-feeds">
        <h4>
          <i className="bi bi-cloud-download"></i> Available Data Feeds
        </h4>
        <div className="feeds-list">
          <div className="feed-item">
            <div className="feed-icon">
              <i className="bi bi-thermometer-half"></i>
            </div>
            <div className="feed-details">
              <h5>Global Temperature Index</h5>
              <div className="feed-stats">
                <div className="feed-stat">
                  <span className="stat-label">Current Value</span>
                  <span className="stat-value">+0.92°C</span>
                </div>
                <div className="feed-stat">
                  <span className="stat-label">Update Frequency</span>
                  <span className="stat-value">12 hours</span>
                </div>
                <div className="feed-stat">
                  <span className="stat-label">Heartbeat</span>
                  <span className="stat-value">24 hours</span>
                </div>
              </div>
            </div>
            <div className="feed-actions">
              <WrfButton variant="primary" size="sm">Subscribe</WrfButton>
            </div>
          </div>

          <div className="feed-item">
            <div className="feed-icon">
              <i className="bi bi-cloud"></i>
            </div>
            <div className="feed-details">
              <h5>Atmospheric CO2 Level</h5>
              <div className="feed-stats">
                <div className="feed-stat">
                  <span className="stat-label">Current Value</span>
                  <span className="stat-value">418.3 ppm</span>
                </div>
                <div className="feed-stat">
                  <span className="stat-label">Update Frequency</span>
                  <span className="stat-value">24 hours</span>
                </div>
                <div className="feed-stat">
                  <span className="stat-label">Heartbeat</span>
                  <span className="stat-value">48 hours</span>
                </div>
              </div>
            </div>
            <div className="feed-actions">
              <WrfButton variant="primary" size="sm">Subscribe</WrfButton>
            </div>
          </div>

          <div className="feed-item">
            <div className="feed-icon">
              <i className="bi bi-water"></i>
            </div>
            <div className="feed-details">
              <h5>Sea Level Change</h5>
              <div className="feed-stats">
                <div className="feed-stat">
                  <span className="stat-label">Current Value</span>
                  <span className="stat-value">+3.3 mm/yr</span>
                </div>
                <div className="feed-stat">
                  <span className="stat-label">Update Frequency</span>
                  <span className="stat-value">7 days</span>
                </div>
                <div className="feed-stat">
                  <span className="stat-label">Heartbeat</span>
                  <span className="stat-value">14 days</span>
                </div>
              </div>
            </div>
            <div className="feed-actions">
              <WrfButton variant="primary" size="sm">Subscribe</WrfButton>
            </div>
          </div>

          <div className="feed-item">
            <div className="feed-icon">
              <i className="bi bi-snow"></i>
            </div>
            <div className="feed-details">
              <h5>Arctic Sea Ice Extent</h5>
              <div className="feed-stats">
                <div className="feed-stat">
                  <span className="stat-label">Current Value</span>
                  <span className="stat-value">4.73M km²</span>
                </div>
                <div className="feed-stat">
                  <span className="stat-label">Update Frequency</span>
                  <span className="stat-value">7 days</span>
                </div>
                <div className="feed-stat">
                  <span className="stat-label">Heartbeat</span>
                  <span className="stat-value">14 days</span>
                </div>
              </div>
            </div>
            <div className="feed-actions">
              <WrfButton variant="primary" size="sm">Subscribe</WrfButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGovernanceTab = () => (
    <div className="integration-card-content">
      <div className="governance">
        <div className="governance-stats">
          <div className="governance-stat">
            <span className="stat-label">API3 Price</span>
            <span className="stat-value">$2.87</span>
          </div>
          <div className="governance-stat">
            <span className="stat-label">Total Staked</span>
            <span className="stat-value">37.5M API3</span>
          </div>
          <div className="governance-stat">
            <span className="stat-label">DAO Treasury</span>
            <span className="stat-value">$23.4M</span>
          </div>
        </div>

        <h4 className="mt-4">
          <i className="bi bi-card-list"></i> Recent Proposals
        </h4>
        <ul className="proposal-list">
          <li>
            <span className="proposal-title">Add Weather Data Providers</span>
            <span className="proposal-status approved">Approved</span>
          </li>
          <li>
            <span className="proposal-title">
              Increase Climate Data Feed Updates
            </span>
            <span className="proposal-status in-progress">In Voting</span>
          </li>
          <li>
            <span className="proposal-title">New Infrastructure Funding</span>
            <span className="proposal-status pending">Pending</span>
          </li>
        </ul>

        <div className="governance-actions">
          <WrfButton variant="primary">
            <i className="bi bi-plus-circle"></i> Create Proposal
          </WrfButton>
          <WrfButton variant="secondary">
            <i className="bi bi-card-checklist"></i> View All Proposals
          </WrfButton>
        </div>
      </div>
    </div>
  );

  return (
    <div className="integration-card api3-card">
      <div className="integration-card-header">
        <div className="integration-logo">
          <i className="bi bi-eye"></i>
        </div>
        <div className="integration-title">
          <h3>API3</h3>
          <p>First-Party Oracle Solution</p>
        </div>
        <div className="integration-status">
          <span className="status-badge active">Connected</span>
          <button
            className="refresh-btn"
            onClick={fetchApi3Stats}
            disabled={isLoading}
          >
            {isLoading ? (
              <i className="bi bi-arrow-repeat spinning"></i>
            ) : (
              <i className="bi bi-arrow-repeat"></i>
            )}
          </button>
        </div>
      </div>

      <div className="integration-card-tabs">
        <div
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <i className="bi bi-info-circle"></i> Overview
        </div>
        <div
          className={`tab ${activeTab === 'feeds' ? 'active' : ''}`}
          onClick={() => setActiveTab('feeds')}
        >
          <i className="bi bi-cloud-download"></i> Data Feeds
        </div>
        <div
          className={`tab ${activeTab === 'governance' ? 'active' : ''}`}
          onClick={() => setActiveTab('governance')}
        >
          <i className="bi bi-people"></i> Governance
        </div>
      </div>

      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'feeds' && renderDataFeedsTab()}
      {activeTab === 'governance' && renderGovernanceTab()}

      <div className="integration-card-footer">
        <span className="last-updated">
          Last updated: {new Date(api3Stats.lastSync).toLocaleString()}
        </span>
      </div>
    </div>
  );
};

export default API3Card;
