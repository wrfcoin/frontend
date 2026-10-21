import React, { useState, useEffect } from 'react';
import { WrfBadge, WrfButton, WrfSelect, WrfInput } from '../DesignSystem';
import './IntegrationCards.css';

const CosmosCard = () => {
  const [connectedChains, setConnectedChains] = useState([]);
  const [ibcTransfers, setIbcTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Simulate API call to get connected chains
    setTimeout(() => {
      setConnectedChains([
        {
          id: 'osmosis-1',
          name: 'Osmosis',
          status: 'active',
          tokenSupport: true,
        },
        { id: 'juno-1', name: 'Juno', status: 'active', tokenSupport: true },
        {
          id: 'stargaze-1',
          name: 'Stargaze',
          status: 'active',
          tokenSupport: true,
          nftSupport: true,
        },
        {
          id: 'akashnet-2',
          name: 'Akash Network',
          status: 'active',
          tokenSupport: true,
          computeSupport: true,
        },
        {
          id: 'secret-4',
          name: 'Secret Network',
          status: 'planned',
          tokenSupport: true,
          privacySupport: true,
        },
      ]);

      // Simulate IBC transfers
      setIbcTransfers([
        {
          id: 'ibc-tx-001',
          source: 'wrfcoin-testnet',
          destination: 'osmosis-1',
          amount: '50 WRF',
          status: 'completed',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'ibc-tx-002',
          source: 'osmosis-1',
          destination: 'wrfcoin-testnet',
          amount: '25 OSMO',
          status: 'completed',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'ibc-tx-003',
          source: 'wrfcoin-testnet',
          destination: 'akashnet-2',
          amount: '100 WRF',
          status: 'pending',
          timestamp: new Date().toISOString(),
        },
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  const renderOverviewTab = () => (
    <div className="cosmos-overview">
      <div className="status-panel">
        <div className="status-box">
          <h3>IBC Protocol</h3>
          <WrfBadge color="success">Connected</WrfBadge>
          <p>Inter-Blockchain Communication protocol is running</p>
        </div>
        <div className="status-box">
          <h3>Connected Chains</h3>
          <WrfBadge color="success">
            {connectedChains.filter(c => c.status === 'active').length} Active
          </WrfBadge>
          <p>Cosmos ecosystem chains connected via IBC</p>
        </div>
        <div className="status-box">
          <h3>Token Transfers</h3>
          <WrfBadge color="success">Enabled</WrfBadge>
          <p>Cross-chain token transfers active</p>
        </div>
        <div className="status-box">
          <h3>NFT Bridge</h3>
          <WrfBadge color="warning">Testnet</WrfBadge>
          <p>Computational NFTs can be sent to Stargaze</p>
        </div>
      </div>

      <div className="integration-details">
        <h3>Cosmos Ecosystem Integration</h3>
        <p>
          Wrfcoin connects to the Cosmos ecosystem via the Inter-Blockchain
          Communication (IBC) protocol, enabling seamless token transfers,
          cross-chain NFT capabilities, and computational resource sharing with
          Cosmos chains like Akash Network, Osmosis, and Stargaze.
        </p>
        <div className="feature-list">
          <div className="feature">
            <i className="bi bi-arrow-left-right"></i>
            <span>
              Cross-chain token transfers between Wrfcoin and Cosmos chains
            </span>
          </div>
          <div className="feature">
            <i className="bi bi-hdd-network"></i>
            <span>Distributed climate model computing via Akash Network</span>
          </div>
          <div className="feature">
            <i className="bi bi-image"></i>
            <span>Computational NFT marketplace integration with Stargaze</span>
          </div>
          <div className="feature">
            <i className="bi bi-shield-lock"></i>
            <span>Enhanced privacy options using Secret Network (Planned)</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderChainsTab = () => (
    <div className="cosmos-chains-tab">
      <h3>Connected Cosmos Ecosystem Chains</h3>
      <table className="chains-table">
        <thead>
          <tr>
            <th>Chain</th>
            <th>Status</th>
            <th>Features</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {connectedChains.map(chain => (
            <tr key={chain.id}>
              <td>
                <div className="chain-name">
                  <i
                    className={`bi bi-globe2 ${chain.status === 'active' ? 'text-success' : 'text-warning'}`}
                  ></i>
                  <span>{chain.name}</span>
                </div>
              </td>
              <td>
                <WrfBadge
                  color={chain.status === 'active' ? 'success' : 'warning'}
                >
                  {chain.status === 'active' ? 'Active' : 'Planned'}
                </WrfBadge>
              </td>
              <td>
                <div className="features-icons">
                  {chain.tokenSupport && (
                    <i className="bi bi-coin" title="Token Transfers"></i>
                  )}
                  {chain.nftSupport && (
                    <i className="bi bi-image" title="NFT Support"></i>
                  )}
                  {chain.computeSupport && (
                    <i className="bi bi-cpu" title="Compute Resources"></i>
                  )}
                  {chain.privacySupport && (
                    <i
                      className="bi bi-shield-lock"
                      title="Privacy Features"
                    ></i>
                  )}
                </div>
              </td>
              <td>
                <WrfButton variant="primary" size="sm">Connect</WrfButton>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderTransfersTab = () => (
    <div className="cosmos-transfers-tab">
      <h3>Recent IBC Transfers</h3>
      <table className="transfers-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>From</th>
            <th>To</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {ibcTransfers.map(tx => (
            <tr key={tx.id}>
              <td>{tx.id}</td>
              <td>{tx.source}</td>
              <td>{tx.destination}</td>
              <td>{tx.amount}</td>
              <td>
                <WrfBadge
                  color={tx.status === 'completed' ? 'success' : 'warning'}
                >
                  {tx.status}
                </WrfBadge>
              </td>
              <td>{new Date(tx.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="transfer-form">
        <h4>New IBC Transfer</h4>
        <div className="form-group">
          <label>Destination Chain</label>
          <WrfSelect>
            <option>Select Destination</option>
            {connectedChains
              .filter(c => c.status === 'active')
              .map(chain => (
                <option key={chain.id} value={chain.id}>
                  {chain.name}
                </option>
              ))}
          </WrfSelect>
        </div>
        <div className="form-group">
          <label>Amount</label>
          <WrfInput type="text" placeholder="0.00" />
        </div>
        <WrfButton variant="primary">Initiate Transfer</WrfButton>
      </div>
    </div>
  );

  const renderComputeTab = () => (
    <div className="cosmos-compute-tab">
      <h3>Akash Network Computing Resources</h3>
      <div className="compute-status">
        <div className="status-item">
          <i className="bi bi-hdd-rack"></i>
          <div className="status-details">
            <h4>Available Providers</h4>
            <WrfBadge color="success">28 Active</WrfBadge>
          </div>
        </div>
        <div className="status-item">
          <i className="bi bi-cpu"></i>
          <div className="status-details">
            <h4>CPU Cores</h4>
            <span>2,486 Available</span>
          </div>
        </div>
        <div className="status-item">
          <i className="bi bi-gpu-card"></i>
          <div className="status-details">
            <h4>GPU Units</h4>
            <span>342 Available</span>
          </div>
        </div>
        <div className="status-item">
          <i className="bi bi-broadcast-pin"></i>
          <div className="status-details">
            <h4>Geographic Distribution</h4>
            <span>12 Regions</span>
          </div>
        </div>
      </div>

      <div className="climate-models">
        <h4>Available Climate Models</h4>
        <div className="model-cards">
          <div className="model-card">
            <div className="model-header">
              <h5>WRF-ARW</h5>
              <WrfBadge color="success">Available</WrfBadge>
            </div>
            <p>Weather Research and Forecasting Model</p>
            <div className="model-resources">
              <small>CPU: 16+ cores | Memory: 32GB+ | Storage: 100GB+</small>
            </div>
            <WrfButton variant="primary" size="sm">Deploy</WrfButton>
          </div>

          <div className="model-card">
            <div className="model-header">
              <h5>CMAQ</h5>
              <WrfBadge color="success">Available</WrfBadge>
            </div>
            <p>Community Multiscale Air Quality Model</p>
            <div className="model-resources">
              <small>CPU: 8+ cores | Memory: 16GB+ | Storage: 50GB+</small>
            </div>
            <WrfButton variant="primary" size="sm">Deploy</WrfButton>
          </div>

          <div className="model-card">
            <div className="model-header">
              <h5>CESM</h5>
              <WrfBadge color="warning">Testnet</WrfBadge>
            </div>
            <p>Community Earth System Model</p>
            <div className="model-resources">
              <small>CPU: 32+ cores | Memory: 64GB+ | Storage: 200GB+</small>
            </div>
            <WrfButton variant="primary" size="sm">Deploy</WrfButton>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="cosmos-card-container">
      {loading ? (
        <div className="loading-indicator">
          <i className="bi bi-hourglass-split"></i>
          <span>Loading Cosmos Integration...</span>
        </div>
      ) : (
        <>
          <div className="cosmos-tabs">
            <div
              className={`cosmos-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <i className="bi bi-grid"></i> Overview
            </div>
            <div
              className={`cosmos-tab ${activeTab === 'chains' ? 'active' : ''}`}
              onClick={() => setActiveTab('chains')}
            >
              <i className="bi bi-link-45deg"></i> Connected Chains
            </div>
            <div
              className={`cosmos-tab ${activeTab === 'transfers' ? 'active' : ''}`}
              onClick={() => setActiveTab('transfers')}
            >
              <i className="bi bi-arrow-left-right"></i> IBC Transfers
            </div>
            <div
              className={`cosmos-tab ${activeTab === 'compute' ? 'active' : ''}`}
              onClick={() => setActiveTab('compute')}
            >
              <i className="bi bi-cpu"></i> Distributed Computing
            </div>
          </div>

          <div className="cosmos-content">
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'chains' && renderChainsTab()}
            {activeTab === 'transfers' && renderTransfersTab()}
            {activeTab === 'compute' && renderComputeTab()}
          </div>
        </>
      )}
    </div>
  );
};

export default CosmosCard;
