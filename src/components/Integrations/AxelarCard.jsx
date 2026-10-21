import React, { useState, useEffect } from 'react';
import { WrfBadge, WrfButton, WrfInput, WrfSelect } from '../DesignSystem';
import './IntegrationCards.css';

const AxelarCard = () => {
  const [connectedChains, setConnectedChains] = useState([]);
  const [recentTransfers, setRecentTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Simulate API call to get connected chains and recent transfers
    setTimeout(() => {
      setConnectedChains([
        {
          id: 'ethereum',
          name: 'Ethereum',
          chainId: 1,
          status: 'active',
          tokenSupport: true,
          nftSupport: true,
        },
        {
          id: 'cosmos',
          name: 'Cosmos Hub',
          chainId: 'cosmoshub-4',
          status: 'active',
          tokenSupport: true,
          nftSupport: false,
        },
        {
          id: 'osmosis',
          name: 'Osmosis',
          chainId: 'osmosis-1',
          status: 'active',
          tokenSupport: true,
          nftSupport: false,
        },
        {
          id: 'polygon',
          name: 'Polygon',
          chainId: 137,
          status: 'active',
          tokenSupport: true,
          nftSupport: true,
        },
        {
          id: 'avalanche',
          name: 'Avalanche',
          chainId: 43114,
          status: 'active',
          tokenSupport: true,
          nftSupport: true,
        },
        {
          id: 'fantom',
          name: 'Fantom',
          chainId: 250,
          status: 'planned',
          tokenSupport: true,
          nftSupport: true,
        },
        {
          id: 'arbitrum',
          name: 'Arbitrum',
          chainId: 42161,
          status: 'planned',
          tokenSupport: true,
          nftSupport: true,
        },
      ]);

      setRecentTransfers([
        {
          id: 'axlr-tx-001',
          source: 'wrfcoin-testnet',
          sourceChain: 'Wrfcoin Testnet',
          destination: 'osmosis-1',
          destChain: 'Osmosis',
          type: 'Token',
          asset: '50 WRF',
          status: 'completed',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'axlr-tx-002',
          source: 'cosmoshub-4',
          sourceChain: 'Cosmos Hub',
          destination: 'wrfcoin-testnet',
          destChain: 'Wrfcoin Testnet',
          type: 'Token',
          asset: '10 ATOM',
          status: 'completed',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'axlr-tx-003',
          source: 'wrfcoin-testnet',
          sourceChain: 'Wrfcoin Testnet',
          destination: 'ethereum',
          destChain: 'Ethereum',
          type: 'GMP',
          asset: 'Computational Results',
          status: 'pending',
          timestamp: new Date().toISOString(),
        },
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  const renderOverviewTab = () => (
    <div className="axelar-overview">
      <div className="status-panel">
        <div className="status-box">
          <h3>Axelar Protocol</h3>
          <WrfBadge color="warning">Testnet</WrfBadge>
          <p>Cross-chain connectivity solution is active</p>
        </div>
        <div className="status-box">
          <h3>Connected Chains</h3>
          <WrfBadge color="success">
            {connectedChains.filter(c => c.status === 'active').length} Active
          </WrfBadge>
          <p>Networks connected via Axelar GMP</p>
        </div>
        <div className="status-box">
          <h3>GMP Messages</h3>
          <WrfBadge color="success">Enabled</WrfBadge>
          <p>General Message Passing active</p>
        </div>
        <div className="status-box">
          <h3>Token Transfers</h3>
          <WrfBadge color="success">Enabled</WrfBadge>
          <p>Cross-chain token transfers active</p>
        </div>
      </div>

      <div className="integration-details">
        <h3>Axelar Integration</h3>
        <p>
          Wrfcoin integrates with Axelar Network to enable secure cross-chain
          communication for computational NFTs, weather data, and token
          transfers between EVM and Cosmos ecosystems. This allows for
          interoperability between Wrfcoin and chains like Cosmos Hub, Osmosis,
          Ethereum, and other major blockchain networks.
        </p>
        <div className="feature-list">
          <div className="feature">
            <i className="bi bi-arrow-left-right"></i>
            <span>
              Cross-chain token transfers between Wrfcoin, EVM chains and Cosmos
              ecosystem
            </span>
          </div>
          <div className="feature">
            <i className="bi bi-envelope"></i>
            <span>
              General Message Passing (GMP) for sending computational model
              results across chains
            </span>
          </div>
          <div className="feature">
            <i className="bi bi-link-45deg"></i>
            <span>
              Interoperability between the Cosmos IBC protocol and EVM networks
            </span>
          </div>
          <div className="feature">
            <i className="bi bi-shield-check"></i>
            <span>
              Secure validator network ensuring transaction verification and
              integrity
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderChainsTab = () => (
    <div className="axelar-chains-tab">
      <h3>Axelar Connected Chains</h3>
      <table className="chains-table">
        <thead>
          <tr>
            <th>Chain</th>
            <th>Chain ID</th>
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
                    className={`bi bi-link-45deg ${chain.status === 'active' ? 'text-success' : 'text-warning'}`}
                  ></i>
                  <span>{chain.name}</span>
                </div>
              </td>
              <td>{chain.chainId}</td>
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
    <div className="axelar-transfers-tab">
      <h3>Recent Cross-Chain Transfers</h3>
      <table className="transfers-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>From</th>
            <th>To</th>
            <th>Type</th>
            <th>Asset</th>
            <th>Status</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {recentTransfers.map(tx => (
            <tr key={tx.id}>
              <td>{tx.id}</td>
              <td>{tx.sourceChain}</td>
              <td>{tx.destChain}</td>
              <td>{tx.type}</td>
              <td>{tx.asset}</td>
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
        <h4>New Cross-Chain Transfer</h4>
        <div className="form-group">
          <label>Asset Type</label>
          <WrfSelect>
            <option value="token">Token</option>
            <option value="gmp">General Message (GMP)</option>
          </WrfSelect>
        </div>
        {/* Asset Selection - showed dynamically when token is selected */}
        <div className="form-group">
          <label>Asset</label>
          <WrfSelect>
            <option>Select Asset</option>
            <option value="wrf">WRF</option>
            <option value="axl-atom">axlATOM</option>
            <option value="axl-usdc">axlUSDC</option>
          </WrfSelect>
        </div>
        <div className="form-group">
          <label>Amount</label>
          <WrfInput type="text" placeholder="0.00" />
        </div>
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
        <WrfButton variant="primary">Initiate Transfer</WrfButton>
      </div>
    </div>
  );

  const renderGmpTab = () => (
    <div className="axelar-gmp-tab">
      <h3>General Message Passing (GMP)</h3>

      <div className="gmp-status">
        <div className="status-item">
          <i className="bi bi-envelope-check"></i>
          <div className="status-details">
            <h4>GMP Status</h4>
            <WrfBadge color="success">Operational</WrfBadge>
          </div>
        </div>
        <div className="status-item">
          <i className="bi bi-clock-history"></i>
          <div className="status-details">
            <h4>Average Message Time</h4>
            <span>~2-5 minutes</span>
          </div>
        </div>
        <div className="status-item">
          <i className="bi bi-patch-check"></i>
          <div className="status-details">
            <h4>Message Reliability</h4>
            <span>99.8% Success Rate</span>
          </div>
        </div>
      </div>

      <div className="gmp-services">
        <h4>Computational Data Services</h4>
        <div className="service-cards">
          <div className="service-card">
            <div className="service-header">
              <h5>Climate Model Results</h5>
              <WrfBadge color="success">Available</WrfBadge>
            </div>
            <p>Send WRF-ARW climate model results across chains</p>
            <div className="service-destinations">
              <small>
                Available destinations: Ethereum, Polygon, Cosmos Hub
              </small>
            </div>
            <WrfButton variant="primary" size="sm">Configure</WrfButton>
          </div>

          <div className="service-card">
            <div className="service-header">
              <h5>Weather Data Oracle</h5>
              <WrfBadge color="success">Available</WrfBadge>
            </div>
            <p>Cross-chain weather data oracle service</p>
            <div className="service-destinations">
              <small>
                Available destinations: All EVM chains, Cosmos ecosystem
              </small>
            </div>
            <WrfButton variant="primary" size="sm">Configure</WrfButton>
          </div>

          <div className="service-card">
            <div className="service-header">
              <h5>Computation Verification</h5>
              <WrfBadge color="warning">Testnet</WrfBadge>
            </div>
            <p>Cross-chain verification of computational results</p>
            <div className="service-destinations">
              <small>Available destinations: Ethereum, Avalanche</small>
            </div>
            <WrfButton variant="primary" size="sm">Configure</WrfButton>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="axelar-card-container">
      {loading ? (
        <div className="loading-indicator">
          <i className="bi bi-hourglass-split"></i>
          <span>Loading Axelar Integration...</span>
        </div>
      ) : (
        <>
          <div className="axelar-tabs">
            <div
              className={`axelar-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <i className="bi bi-grid"></i> Overview
            </div>
            <div
              className={`axelar-tab ${activeTab === 'chains' ? 'active' : ''}`}
              onClick={() => setActiveTab('chains')}
            >
              <i className="bi bi-link-45deg"></i> Connected Chains
            </div>
            <div
              className={`axelar-tab ${activeTab === 'transfers' ? 'active' : ''}`}
              onClick={() => setActiveTab('transfers')}
            >
              <i className="bi bi-arrow-left-right"></i> Token Transfers
            </div>
            <div
              className={`axelar-tab ${activeTab === 'gmp' ? 'active' : ''}`}
              onClick={() => setActiveTab('gmp')}
            >
              <i className="bi bi-envelope"></i> GMP Services
            </div>
          </div>

          <div className="axelar-content">
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'chains' && renderChainsTab()}
            {activeTab === 'transfers' && renderTransfersTab()}
            {activeTab === 'gmp' && renderGmpTab()}
          </div>
        </>
      )}
    </div>
  );
};

export default AxelarCard;
