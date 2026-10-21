import React, { useState, useEffect } from 'react';
import { WrfBadge, WrfButton, WrfSelect, WrfInput } from '../DesignSystem';
import InputAdornment from '@mui/material/InputAdornment';
import './IntegrationCards.css';

const LayerZeroCard = () => {
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
          chainId: 101,
          status: 'active',
          tokenSupport: true,
          nftSupport: true,
        },
        {
          id: 'bsc',
          name: 'BNB Chain',
          chainId: 102,
          status: 'active',
          tokenSupport: true,
          nftSupport: true,
        },
        {
          id: 'avalanche',
          name: 'Avalanche',
          chainId: 106,
          status: 'active',
          tokenSupport: true,
          nftSupport: true,
        },
        {
          id: 'polygon',
          name: 'Polygon',
          chainId: 109,
          status: 'active',
          tokenSupport: true,
          nftSupport: true,
        },
        {
          id: 'arbitrum',
          name: 'Arbitrum',
          chainId: 110,
          status: 'active',
          tokenSupport: true,
          nftSupport: true,
        },
        {
          id: 'optimism',
          name: 'Optimism',
          chainId: 111,
          status: 'planned',
          tokenSupport: true,
          nftSupport: true,
        },
        {
          id: 'solana',
          name: 'Solana',
          chainId: 168,
          status: 'planned',
          tokenSupport: true,
          nftSupport: true,
        },
      ]);

      setRecentTransfers([
        {
          id: 'lz-tx-001',
          source: 'wrfcoin-testnet',
          sourceChainId: 999,
          destination: 'ethereum',
          destChainId: 101,
          type: 'NFT',
          nftId: 'WRF-NFT-5123',
          status: 'completed',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'lz-tx-002',
          source: 'bsc',
          sourceChainId: 102,
          destination: 'wrfcoin-testnet',
          destChainId: 999,
          type: 'Token',
          amount: '10 BNB',
          status: 'completed',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'lz-tx-003',
          source: 'wrfcoin-testnet',
          sourceChainId: 999,
          destination: 'avalanche',
          destChainId: 106,
          type: 'NFT',
          nftId: 'WRF-NFT-7891',
          status: 'pending',
          timestamp: new Date().toISOString(),
        },
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  const renderOverviewTab = () => (
    <div className="layerzero-overview">
      <div className="status-panel">
        <div className="status-box">
          <h3>LayerZero Protocol</h3>
          <WrfBadge color="warning">Testnet</WrfBadge>
          <p>Omnichain interoperability protocol is running</p>
        </div>
        <div className="status-box">
          <h3>Connected Chains</h3>
          <WrfBadge color="success">
            {connectedChains.filter(c => c.status === 'active').length} Active
          </WrfBadge>
          <p>Chains connected via LayerZero messaging</p>
        </div>
        <div className="status-box">
          <h3>ONFT Support</h3>
          <WrfBadge color="warning">Testnet</WrfBadge>
          <p>Omnichain NFT standard for computational NFTs</p>
        </div>
        <div className="status-box">
          <h3>Token Transfers</h3>
          <WrfBadge color="success">Enabled</WrfBadge>
          <p>Cross-chain token transfers active</p>
        </div>
      </div>

      <div className="integration-details">
        <h3>LayerZero Integration</h3>
        <p>
          Wrfcoin integrates with LayerZero to enable omnichain functionality
          for computational NFTs and tokens. This allows seamless transfer of
          Wrfcoin assets across multiple blockchain networks including Ethereum,
          BNB Chain, Avalanche, Polygon, and more.
        </p>
        <div className="feature-list">
          <div className="feature">
            <i className="bi bi-diamond"></i>
            <span>
              Omnichain NFT (ONFT) standard support for computational climate
              models
            </span>
          </div>
          <div className="feature">
            <i className="bi bi-arrow-left-right"></i>
            <span>
              Ultra-low latency cross-chain messaging with high security
              guarantees
            </span>
          </div>
          <div className="feature">
            <i className="bi bi-shield-check"></i>
            <span>
              Trustless communication between Wrfcoin and EVM/non-EVM chains
            </span>
          </div>
          <div className="feature">
            <i className="bi bi-gear-wide-connected"></i>
            <span>
              Support for LayerZero v2 architecture with enhanced security
              features
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderChainsTab = () => (
    <div className="layerzero-chains-tab">
      <h3>LayerZero Connected Chains</h3>
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
                    className={`bi bi-diagram-3 ${chain.status === 'active' ? 'text-success' : 'text-warning'}`}
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
    <div className="layerzero-transfers-tab">
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
              <td>
                {tx.source} ({tx.sourceChainId})
              </td>
              <td>
                {tx.destination} ({tx.destChainId})
              </td>
              <td>{tx.type}</td>
              <td>{tx.nftId || tx.amount}</td>
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
        <h4>New ONFT Transfer</h4>
        <div className="form-group">
          <label>Computational NFT</label>
          <WrfSelect>
            <option>Select NFT</option>
            <option value="WRF-NFT-1234">
              WRF-NFT-1234 (WRF-ARW Climate Model)
            </option>
            <option value="WRF-NFT-5678">
              WRF-NFT-5678 (CMAQ Air Quality Model)
            </option>
            <option value="WRF-NFT-9012">
              WRF-NFT-9012 (CESM Climate Projection)
            </option>
          </WrfSelect>
        </div>
        <div className="form-group">
          <label>Destination Chain</label>
          <WrfSelect>
            <option>Select Destination</option>
            {connectedChains
              .filter(c => c.status === 'active')
              .map(chain => (
                <option key={chain.id} value={chain.id}>
                  {chain.name} (Chain ID: {chain.chainId})
                </option>
              ))}
          </WrfSelect>
        </div>
        <WrfButton variant="primary">Initiate ONFT Transfer</WrfButton>
      </div>
    </div>
  );

  const renderConfigTab = () => (
    <div className="layerzero-config-tab">
      <h3>LayerZero Configuration</h3>

      <div className="config-section">
        <h4>Endpoint Configuration</h4>
        <div className="form-group">
          <label>Wrfcoin Endpoint Address</label>
          <WrfInput
            type="text"
            value="0x6C9427E8d770Ad9e5a493D201280Cc178125CEc0"
            readOnly
          />
        </div>
        <div className="form-group">
          <label>Default Relayer</label>
          <WrfSelect>
            <option value="default">LayerZero Default Relayer</option>
            <option value="custom">Custom Relayer</option>
          </WrfSelect>
        </div>
      </div>

      <div className="config-section">
        <h4>ONFT Configuration</h4>
        <div className="form-group">
          <label>ONFT Contract Address</label>
          <WrfInput
            type="text"
            value="0x8A5B41F968F76f3a85Ef3A10895a236e31c3A3C1"
            readOnly
          />
        </div>
        <div className="form-group">
          <label>ONFT Standard</label>
          <WrfSelect>
            <option value="onft721">ONFT721</option>
            <option value="onft1155">ONFT1155</option>
          </WrfSelect>
        </div>
      </div>

      <div className="config-section">
        <h4>Gas Configuration</h4>
        <div className="form-group">
          <label>Gas Limit</label>
          <WrfInput type="text" value="200000" />
        </div>
        <div className="form-group">
          <label>Native Fee</label>
          <WrfInput
            type="text"
            value="0.001"
            InputProps={{ endAdornment: <InputAdornment position="end">ETH</InputAdornment> }}
          />
        </div>
      </div>

      <WrfButton variant="primary">Save Configuration</WrfButton>
    </div>
  );

  return (
    <div className="layerzero-card-container">
      {loading ? (
        <div className="loading-indicator">
          <i className="bi bi-hourglass-split"></i>
          <span>Loading LayerZero Integration...</span>
        </div>
      ) : (
        <>
          <div className="layerzero-tabs">
            <div
              className={`layerzero-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <i className="bi bi-grid"></i> Overview
            </div>
            <div
              className={`layerzero-tab ${activeTab === 'chains' ? 'active' : ''}`}
              onClick={() => setActiveTab('chains')}
            >
              <i className="bi bi-diagram-3"></i> Connected Chains
            </div>
            <div
              className={`layerzero-tab ${activeTab === 'transfers' ? 'active' : ''}`}
              onClick={() => setActiveTab('transfers')}
            >
              <i className="bi bi-arrow-left-right"></i> ONFT Transfers
            </div>
            <div
              className={`layerzero-tab ${activeTab === 'config' ? 'active' : ''}`}
              onClick={() => setActiveTab('config')}
            >
              <i className="bi bi-gear"></i> Configuration
            </div>
          </div>

          <div className="layerzero-content">
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'chains' && renderChainsTab()}
            {activeTab === 'transfers' && renderTransfersTab()}
            {activeTab === 'config' && renderConfigTab()}
          </div>
        </>
      )}
    </div>
  );
};

export default LayerZeroCard;
