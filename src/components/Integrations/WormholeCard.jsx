import React, { useState, useEffect } from 'react';
import { WrfBadge, WrfButton, WrfInput, WrfSelect } from '../DesignSystem';
import './IntegrationCards.css';

const WormholeCard = () => {
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
          chainId: 2,
          status: 'active',
          tokenSupport: true,
          nftSupport: true,
        },
        {
          id: 'solana',
          name: 'Solana',
          chainId: 1,
          status: 'active',
          tokenSupport: true,
          nftSupport: true,
        },
        {
          id: 'bsc',
          name: 'BNB Chain',
          chainId: 4,
          status: 'active',
          tokenSupport: true,
          nftSupport: true,
        },
        {
          id: 'polygon',
          name: 'Polygon',
          chainId: 5,
          status: 'active',
          tokenSupport: true,
          nftSupport: true,
        },
        {
          id: 'avalanche',
          name: 'Avalanche',
          chainId: 6,
          status: 'active',
          tokenSupport: true,
          nftSupport: true,
        },
        {
          id: 'aptos',
          name: 'Aptos',
          chainId: 22,
          status: 'planned',
          tokenSupport: true,
          nftSupport: false,
        },
        {
          id: 'sui',
          name: 'Sui',
          chainId: 21,
          status: 'planned',
          tokenSupport: true,
          nftSupport: false,
        },
      ]);

      setRecentTransfers([
        {
          id: 'wh-tx-001',
          source: 'wrfcoin-testnet',
          sourceChain: 'Wrfcoin Testnet',
          destination: 'ethereum',
          destChain: 'Ethereum',
          type: 'NFT',
          asset: 'Climate Model #1234',
          vaa: '0x7a23b4...',
          status: 'completed',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'wh-tx-002',
          source: 'solana',
          sourceChain: 'Solana',
          destination: 'wrfcoin-testnet',
          destChain: 'Wrfcoin Testnet',
          type: 'Token',
          asset: '5 SOL',
          vaa: '0x3f92a1...',
          status: 'completed',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'wh-tx-003',
          source: 'wrfcoin-testnet',
          sourceChain: 'Wrfcoin Testnet',
          destination: 'polygon',
          destChain: 'Polygon',
          type: 'NFT',
          asset: 'Air Quality Model #5678',
          vaa: '0x1d8f7b...',
          status: 'pending',
          timestamp: new Date().toISOString(),
        },
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  const renderOverviewTab = () => (
    <div className="wormhole-overview">
      <div className="status-panel">
        <div className="status-box">
          <h3>Wormhole Protocol</h3>
          <WrfBadge color="warning">Testnet</WrfBadge>
          <p>Cross-chain messaging protocol is running</p>
        </div>
        <div className="status-box">
          <h3>Connected Chains</h3>
          <WrfBadge color="success">
            {connectedChains.filter(c => c.status === 'active').length} Active
          </WrfBadge>
          <p>Chains connected via Wormhole VAAs</p>
        </div>
        <div className="status-box">
          <h3>NFT Bridge</h3>
          <WrfBadge color="warning">Testnet</WrfBadge>
          <p>Cross-chain NFT transfers are enabled</p>
        </div>
        <div className="status-box">
          <h3>Token Bridge</h3>
          <WrfBadge color="success">Enabled</WrfBadge>
          <p>Cross-chain token transfers active</p>
        </div>
      </div>

      <div className="integration-details">
        <h3>Wormhole Integration</h3>
        <p>
          Wrfcoin integrates with Wormhole to enable cross-chain
          interoperability for computational NFTs and meteorological data. This
          allows seamless transfer of climate model NFTs and tokens between
          Wrfcoin and other major blockchains including Ethereum, Solana, and
          more.
        </p>
        <div className="feature-list">
          <div className="feature">
            <i className="bi bi-image"></i>
            <span>
              Cross-chain NFT bridge for transferring computational climate
              models
            </span>
          </div>
          <div className="feature">
            <i className="bi bi-coin"></i>
            <span>
              Token bridge for cross-chain value transfer and governance
            </span>
          </div>
          <div className="feature">
            <i className="bi bi-envelope"></i>
            <span>
              Generic message passing for cross-chain climate data verification
            </span>
          </div>
          <div className="feature">
            <i className="bi bi-shield-check"></i>
            <span>
              Guardian network ensures transaction security and verification
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderChainsTab = () => (
    <div className="wormhole-chains-tab">
      <h3>Wormhole Connected Chains</h3>
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
                    className={`bi bi-hdd-network ${chain.status === 'active' ? 'text-success' : 'text-warning'}`}
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
    <div className="wormhole-transfers-tab">
      <h3>Recent Cross-Chain Transfers</h3>
      <table className="transfers-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>From</th>
            <th>To</th>
            <th>Type</th>
            <th>Asset</th>
            <th>VAA</th>
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
                <span className="monospace-text">{tx.vaa}</span>
              </td>
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
        <h4>New NFT Bridge Transfer</h4>
        <div className="form-group">
          <label>Computational NFT</label>
          <WrfSelect>
            <option>Select NFT</option>
            <option value="nft-1234">Climate Model #1234 (WRF-ARW)</option>
            <option value="nft-5678">Air Quality Model #5678 (CMAQ)</option>
            <option value="nft-9012">Climate Projection #9012 (CESM)</option>
          </WrfSelect>
        </div>
        <div className="form-group">
          <label>Destination Chain</label>
          <WrfSelect>
            <option>Select Destination</option>
            {connectedChains
              .filter(c => c.status === 'active' && c.nftSupport)
              .map(chain => (
                <option key={chain.id} value={chain.id}>
                  {chain.name}
                </option>
              ))}
          </WrfSelect>
        </div>
        <div className="form-group">
          <label>Recipient Address</label>
          <WrfInput
            type="text"
            placeholder="Enter destination address"
          />
        </div>
        <WrfButton variant="primary">Initiate NFT Transfer</WrfButton>
      </div>
    </div>
  );

  const renderMessageTab = () => (
    <div className="wormhole-message-tab">
      <h3>Cross-Chain Messaging</h3>

      <div className="message-status">
        <div className="status-item">
          <i className="bi bi-shield-check"></i>
          <div className="status-details">
            <h4>Guardian Network</h4>
            <WrfBadge color="success">19 Active</WrfBadge>
          </div>
        </div>
        <div className="status-item">
          <i className="bi bi-clock-history"></i>
          <div className="status-details">
            <h4>Average Finality</h4>
            <span>~15 minutes</span>
          </div>
        </div>
        <div className="status-item">
          <i className="bi bi-clipboard-check"></i>
          <div className="status-details">
            <h4>VAA Success Rate</h4>
            <span>99.7% Success</span>
          </div>
        </div>
      </div>

      <div className="message-services">
        <h4>Climate Data Messaging Services</h4>
        <div className="service-cards">
          <div className="service-card">
            <div className="service-header">
              <h5>Computational Results</h5>
              <WrfBadge color="success">Available</WrfBadge>
            </div>
            <p>Cross-chain transfer of computational model results</p>
            <div className="service-destinations">
              <small>Available destinations: Ethereum, Solana, Polygon</small>
            </div>
            <WrfButton variant="primary" size="sm">Configure</WrfButton>
          </div>

          <div className="service-card">
            <div className="service-header">
              <h5>Data Verification</h5>
              <WrfBadge color="success">Available</WrfBadge>
            </div>
            <p>Cross-chain verification of climate data authenticity</p>
            <div className="service-destinations">
              <small>Available destinations: All EVM chains</small>
            </div>
            <WrfButton variant="primary" size="sm">Configure</WrfButton>
          </div>

          <div className="service-card">
            <div className="service-header">
              <h5>Model Training Coordination</h5>
              <WrfBadge color="warning">Testnet</WrfBadge>
            </div>
            <p>Coordinate distributed training across chains</p>
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
    <div className="wormhole-card-container">
      {loading ? (
        <div className="loading-indicator">
          <i className="bi bi-hourglass-split"></i>
          <span>Loading Wormhole Integration...</span>
        </div>
      ) : (
        <>
          <div className="wormhole-tabs">
            <div
              className={`wormhole-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <i className="bi bi-grid"></i> Overview
            </div>
            <div
              className={`wormhole-tab ${activeTab === 'chains' ? 'active' : ''}`}
              onClick={() => setActiveTab('chains')}
            >
              <i className="bi bi-diagram-3"></i> Connected Chains
            </div>
            <div
              className={`wormhole-tab ${activeTab === 'transfers' ? 'active' : ''}`}
              onClick={() => setActiveTab('transfers')}
            >
              <i className="bi bi-arrow-left-right"></i> NFT Bridge
            </div>
            <div
              className={`wormhole-tab ${activeTab === 'message' ? 'active' : ''}`}
              onClick={() => setActiveTab('message')}
            >
              <i className="bi bi-envelope"></i> Messaging
            </div>
          </div>

          <div className="wormhole-content">
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'chains' && renderChainsTab()}
            {activeTab === 'transfers' && renderTransfersTab()}
            {activeTab === 'message' && renderMessageTab()}
          </div>
        </>
      )}
    </div>
  );
};

export default WormholeCard;
