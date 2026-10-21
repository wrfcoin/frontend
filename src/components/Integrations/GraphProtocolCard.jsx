import React, { useState, useEffect } from 'react';
import { WrfButton } from '../DesignSystem';
import './IntegrationCards.css';

const GraphProtocolCard = ({ integrationState }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [graphStats, setGraphStats] = useState({
    indexers: 187,
    curators: 4532,
    delegators: 7843,
    subgraphs: 348,
    queryFees: '12.4k GRT',
    validatorRewards: '3.2k GRT',
    deployedSubgraphs: 3,
    lastSync: new Date().toISOString(),
  });

  const [isLoading, setIsLoading] = useState(false);

  const fetchGraphStats = async () => {
    setIsLoading(true);
    try {
      // In a production environment, this would fetch real data from The Graph Protocol
      // For now, we'll simulate a successful API call
      setTimeout(() => {
        setGraphStats({
          ...graphStats,
          subgraphs: graphStats.subgraphs + Math.floor(Math.random() * 5),
          lastSync: new Date().toISOString(),
        });
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching Graph Protocol stats:', error);
      setIsLoading(false);
    }
  };

  const renderOverviewTab = () => (
    <div className="integration-card-content">
      <div className="integration-description">
        <p>
          The Graph Protocol is a decentralized indexing protocol for querying
          blockchain data. It enables efficient queries of meteorological and
          climate data stored on-chain, powering data-rich applications and
          computational NFTs in the Wrfcoin ecosystem.
        </p>
      </div>

      <div className="integration-stats">
        <div className="stat-item">
          <i className="bi bi-database-fill-gear"></i>
          <div className="stat-info">
            <span className="stat-value">{graphStats.subgraphs}</span>
            <span className="stat-label">Subgraphs</span>
          </div>
        </div>
        <div className="stat-item">
          <i className="bi bi-server"></i>
          <div className="stat-info">
            <span className="stat-value">{graphStats.indexers}</span>
            <span className="stat-label">Indexers</span>
          </div>
        </div>
        <div className="stat-item">
          <i className="bi bi-people"></i>
          <div className="stat-info">
            <span className="stat-value">{graphStats.curators}</span>
            <span className="stat-label">Curators</span>
          </div>
        </div>
      </div>

      <div className="protocol-info">
        <h4>
          <i className="bi bi-info-circle"></i> Protocol Information
        </h4>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Deployed Subgraphs</span>
            <span className="info-value">{graphStats.deployedSubgraphs}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Query Fees</span>
            <span className="info-value">{graphStats.queryFees}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Validator Rewards</span>
            <span className="info-value">{graphStats.validatorRewards}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSubgraphsTab = () => (
    <div className="integration-card-content">
      <div className="subgraphs">
        <div className="subgraphs-header">
          <h4>
            <i className="bi bi-diagram-3"></i> Your Subgraphs
          </h4>
          <WrfButton variant="primary" size="sm">
            <i className="bi bi-plus-circle"></i> Deploy Subgraph
          </WrfButton>
        </div>

        <div className="subgraph-list">
          <div className="subgraph-item">
            <div className="subgraph-info">
              <h5>Weather Data Indexer</h5>
              <span className="subgraph-id">QmYZ9SX7wGa...</span>
            </div>
            <div className="subgraph-stats">
              <div className="subgraph-stat">
                <span className="stat-label">Queries (24h)</span>
                <span className="stat-value">1,279</span>
              </div>
              <div className="subgraph-stat">
                <span className="stat-label">Updated</span>
                <span className="stat-value">3 hours ago</span>
              </div>
              <div className="subgraph-actions">
                <WrfButton variant="outline" size="sm">
                  Query
                </WrfButton>
                <WrfButton variant="outline" size="sm">
                  Update
                </WrfButton>
              </div>
            </div>
          </div>

          <div className="subgraph-item">
            <div className="subgraph-info">
              <h5>Climate Models Archive</h5>
              <span className="subgraph-id">QmUV7X2Rvd...</span>
            </div>
            <div className="subgraph-stats">
              <div className="subgraph-stat">
                <span className="stat-label">Queries (24h)</span>
                <span className="stat-value">834</span>
              </div>
              <div className="subgraph-stat">
                <span className="stat-label">Updated</span>
                <span className="stat-value">1 day ago</span>
              </div>
              <div className="subgraph-actions">
                <WrfButton variant="outline" size="sm">
                  Query
                </WrfButton>
                <WrfButton variant="outline" size="sm">
                  Update
                </WrfButton>
              </div>
            </div>
          </div>

          <div className="subgraph-item">
            <div className="subgraph-info">
              <h5>Computational NFT Market</h5>
              <span className="subgraph-id">QmPQ8X9vWR...</span>
            </div>
            <div className="subgraph-stats">
              <div className="subgraph-stat">
                <span className="stat-label">Queries (24h)</span>
                <span className="stat-value">2,451</span>
              </div>
              <div className="subgraph-stat">
                <span className="stat-label">Updated</span>
                <span className="stat-value">5 hours ago</span>
              </div>
              <div className="subgraph-actions">
                <WrfButton variant="outline" size="sm">
                  Query
                </WrfButton>
                <WrfButton variant="outline" size="sm">
                  Update
                </WrfButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGraphiQLTab = () => (
    <div className="integration-card-content">
      <div className="graphiql">
        <h4>
          <i className="bi bi-code-square"></i> GraphiQL Explorer
        </h4>
        <div className="graphiql-area">
          <div className="graphiql-editor">
            <div className="editor-header">
              <span>Query Editor</span>
              <WrfButton variant="primary" size="sm">Run Query</WrfButton>
            </div>
            <div className="editor-content">
              <pre className="editor-code">
                {`query {
  weatherDatasets(first: 5, orderBy: timestamp, orderDirection: desc) {
    id
    name
    location
    timestamp
    temperature
    precipitation
    humidity
    creator {
      id
      address
    }
  }
}`}
              </pre>
            </div>
          </div>

          <div className="graphiql-results">
            <div className="editor-header">
              <span>Results</span>
              <WrfButton variant="outline" size="sm">Copy</WrfButton>
            </div>
            <div className="editor-content">
              <pre className="editor-code results">
                {`{
  "data": {
    "weatherDatasets": [
      {
        "id": "0x1a2b3c4d",
        "name": "Global Temperature Dataset 2025-Q1",
        "location": "Global",
        "timestamp": "1715472000",
        "temperature": "14.2",
        "precipitation": "87.3",
        "humidity": "68.5",
        "creator": {
          "id": "0x742f..3a91",
          "address": "0x742f...3a91"
        }
      },
      {
        "id": "0x5e6f7g8h",
        "name": "North America Climate Analysis",
        "location": "North America",
        "timestamp": "1715385600",
        "temperature": "12.8",
        "precipitation": "65.2",
        "humidity": "54.7",
        "creator": {
          "id": "0x912e..4f67",
          "address": "0x912e...4f67"
        }
      }
      // ... more results
    ]
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="integration-card graph-protocol-card">
      <div className="integration-card-header">
        <div className="integration-logo">
          <i className="bi bi-diagram-3"></i>
        </div>
        <div className="integration-title">
          <h3>The Graph Protocol</h3>
          <p>Decentralized Indexing Protocol</p>
        </div>
        <div className="integration-status">
          <span className="status-badge active">Connected</span>
          <button
            className="refresh-btn"
            onClick={fetchGraphStats}
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
          className={`tab ${activeTab === 'subgraphs' ? 'active' : ''}`}
          onClick={() => setActiveTab('subgraphs')}
        >
          <i className="bi bi-diagram-3"></i> Subgraphs
        </div>
        <div
          className={`tab ${activeTab === 'graphiql' ? 'active' : ''}`}
          onClick={() => setActiveTab('graphiql')}
        >
          <i className="bi bi-code-square"></i> GraphiQL
        </div>
      </div>

      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'subgraphs' && renderSubgraphsTab()}
      {activeTab === 'graphiql' && renderGraphiQLTab()}

      <div className="integration-card-footer">
        <span className="last-updated">
          Last updated: {new Date(graphStats.lastSync).toLocaleString()}
        </span>
      </div>
    </div>
  );
};

export default GraphProtocolCard;
