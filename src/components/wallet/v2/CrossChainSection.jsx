/**
 * CrossChainSection Component
 *
 * Cross-chain bridge interface with supported networks and transfers.
 */

import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ExternalLink,
  Shield,
} from 'lucide-react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import './CrossChainSection.css';

// Supported networks
const networks = [
  { id: 'wrf', name: 'WRF Mainnet', symbol: 'WRF', color: '#3B82F6', status: 'active' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', color: '#627EEA', status: 'active' },
  { id: 'polygon', name: 'Polygon', symbol: 'MATIC', color: '#8247E5', status: 'active' },
  { id: 'bsc', name: 'BNB Chain', symbol: 'BNB', color: '#F3BA2F', status: 'active' },
  { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX', color: '#E84142', status: 'active' },
  { id: 'arbitrum', name: 'Arbitrum', symbol: 'ARB', color: '#28A0F0', status: 'active' },
  { id: 'optimism', name: 'Optimism', symbol: 'OP', color: '#FF0420', status: 'active' },
  { id: 'cosmos', name: 'Cosmos', symbol: 'ATOM', color: '#2E3148', status: 'active' },
  { id: 'polkadot', name: 'Polkadot', symbol: 'DOT', color: '#E6007A', status: 'maintenance' },
  { id: 'solana', name: 'Solana', symbol: 'SOL', color: '#14F195', status: 'coming' },
  { id: 'near', name: 'NEAR', symbol: 'NEAR', color: '#00C08B', status: 'coming' },
  { id: 'base', name: 'Base', symbol: 'ETH', color: '#0052FF', status: 'active' },
  { id: 'zksync', name: 'zkSync Era', symbol: 'ETH', color: '#8C8DFC', status: 'active' },
];

// Mock recent bridges
const recentBridges = [
  {
    id: 'b1',
    from: 'ethereum',
    to: 'wrf',
    amount: 0.5,
    symbol: 'ETH',
    value: 861.79,
    status: 'completed',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    hash: '0xabc123...',
  },
  {
    id: 'b2',
    from: 'wrf',
    to: 'polygon',
    amount: 200,
    symbol: 'WRF',
    value: 314.00,
    status: 'pending',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    hash: '0xdef456...',
  },
];

const statusConfig = {
  active: { label: 'Active', color: '#22C55E', icon: CheckCircle },
  maintenance: { label: 'Maintenance', color: '#F59E0B', icon: AlertTriangle },
  coming: { label: 'Coming Soon', color: '#94A3B8', icon: Clock },
};

const NetworkCard = ({ network, onClick, selected }) => {
  const status = statusConfig[network.status];
  const StatusIcon = status.icon;

  return (
    <button
      className={`network-card ${selected ? 'selected' : ''} ${network.status !== 'active' ? 'disabled' : ''}`}
      onClick={() => network.status === 'active' && onClick?.(network)}
      disabled={network.status !== 'active'}
    >
      <div className="network-icon" style={{ background: `${network.color}20`, color: network.color }}>
        {network.symbol.charAt(0)}
      </div>
      <div className="network-info">
        <span className="network-name">{network.name}</span>
        <span className="network-status" style={{ color: status.color }}>
          <StatusIcon size={12} />
          {status.label}
        </span>
      </div>
    </button>
  );
};

const CrossChainSection = () => {
  const [sourceNetwork, setSourceNetwork] = useState(networks[0]);
  const [destNetwork, setDestNetwork] = useState(networks[1]);
  const [amount, setAmount] = useState('');
  const [sourceAnchorEl, setSourceAnchorEl] = useState(null);
  const [destAnchorEl, setDestAnchorEl] = useState(null);

  const swapNetworks = () => {
    const temp = sourceNetwork;
    setSourceNetwork(destNetwork);
    setDestNetwork(temp);
  };

  const activeNetworks = networks.filter(n => n.status === 'active');
  const bridgeFee = amount ? (parseFloat(amount) * 0.001).toFixed(4) : '0';
  const estimatedTime = sourceNetwork.id === 'wrf' || destNetwork.id === 'wrf' ? '~5 min' : '~15 min';

  return (
    <div className="cross-chain-section">
      {/* Bridge Stats */}
      <div className="bridge-stats">
        <div className="bridge-stat">
          <span className="stat-value">{networks.filter(n => n.status === 'active').length}</span>
          <span className="stat-label">Active Networks</span>
        </div>
        <div className="bridge-stat">
          <span className="stat-value">$2.4M</span>
          <span className="stat-label">Total Bridged</span>
        </div>
        <div className="bridge-stat">
          <span className="stat-value">0.1%</span>
          <span className="stat-label">Bridge Fee</span>
        </div>
        <div className="bridge-stat">
          <span className="stat-value">~5 min</span>
          <span className="stat-label">Avg. Time</span>
        </div>
      </div>

      {/* Bridge Interface */}
      <div className="bridge-interface">
        <div className="bridge-header">
          <Shield size={20} />
          <span>Cross-Chain Bridge</span>
        </div>

        <div className="bridge-form">
          {/* Source Network */}
          <div className="network-select-wrapper">
            <label>From Network</label>
            <button className="network-select" onClick={(e) => setSourceAnchorEl(e.currentTarget)}>
              <div className="network-icon-small" style={{ background: `${sourceNetwork.color}20`, color: sourceNetwork.color }}>
                {sourceNetwork.symbol.charAt(0)}
              </div>
              <span>{sourceNetwork.name}</span>
              <ChevronDown size={18} />
            </button>
            <Menu
              anchorEl={sourceAnchorEl}
              open={Boolean(sourceAnchorEl)}
              onClose={() => setSourceAnchorEl(null)}
            >
              {activeNetworks.map(n => (
                <MenuItem
                  key={n.id}
                  selected={n.id === sourceNetwork.id}
                  onClick={() => { setSourceNetwork(n); setSourceAnchorEl(null); }}
                >
                  <div className="network-icon-small" style={{ background: `${n.color}20`, color: n.color }}>
                    {n.symbol.charAt(0)}
                  </div>
                  <span>{n.name}</span>
                </MenuItem>
              ))}
            </Menu>
          </div>

          {/* Swap Button */}
          <button className="swap-networks-btn" onClick={swapNetworks}>
            <RefreshCw size={18} />
          </button>

          {/* Destination Network */}
          <div className="network-select-wrapper">
            <label>To Network</label>
            <button className="network-select" onClick={(e) => setDestAnchorEl(e.currentTarget)}>
              <div className="network-icon-small" style={{ background: `${destNetwork.color}20`, color: destNetwork.color }}>
                {destNetwork.symbol.charAt(0)}
              </div>
              <span>{destNetwork.name}</span>
              <ChevronDown size={18} />
            </button>
            <Menu
              anchorEl={destAnchorEl}
              open={Boolean(destAnchorEl)}
              onClose={() => setDestAnchorEl(null)}
            >
              {activeNetworks.filter(n => n.id !== sourceNetwork.id).map(n => (
                <MenuItem
                  key={n.id}
                  selected={n.id === destNetwork.id}
                  onClick={() => { setDestNetwork(n); setDestAnchorEl(null); }}
                >
                  <div className="network-icon-small" style={{ background: `${n.color}20`, color: n.color }}>
                    {n.symbol.charAt(0)}
                  </div>
                  <span>{n.name}</span>
                </MenuItem>
              ))}
            </Menu>
          </div>

          {/* Amount Input */}
          <div className="amount-input-wrapper">
            <label>Amount</label>
            <div className="amount-input">
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <span className="amount-symbol">WRF</span>
              <button className="max-btn">MAX</button>
            </div>
          </div>

          {/* Bridge Details */}
          {amount && (
            <div className="bridge-details">
              <div className="detail-row">
                <span>Bridge Fee</span>
                <span>{bridgeFee} WRF</span>
              </div>
              <div className="detail-row">
                <span>Estimated Time</span>
                <span>{estimatedTime}</span>
              </div>
              <div className="detail-row">
                <span>You'll Receive</span>
                <span className="receive-amount">{(parseFloat(amount || 0) - parseFloat(bridgeFee)).toFixed(4)} WRF</span>
              </div>
            </div>
          )}

          <button className="bridge-btn" disabled={!amount || parseFloat(amount) <= 0}>
            <ArrowRight size={20} />
            Bridge Tokens
          </button>
        </div>
      </div>

      {/* Supported Networks */}
      <div className="networks-section">
        <h4>Supported Networks ({networks.length})</h4>
        <div className="networks-grid">
          {networks.map(network => (
            <NetworkCard key={network.id} network={network} />
          ))}
        </div>
      </div>

      {/* Recent Bridges */}
      {recentBridges.length > 0 && (
        <div className="recent-bridges">
          <h4>Recent Bridge Transfers</h4>
          <div className="bridges-list">
            {recentBridges.map(bridge => (
              <div key={bridge.id} className={`bridge-item ${bridge.status}`}>
                <div className="bridge-route">
                  <span className="network-badge">{networks.find(n => n.id === bridge.from)?.name}</span>
                  <ArrowRight size={16} />
                  <span className="network-badge">{networks.find(n => n.id === bridge.to)?.name}</span>
                </div>
                <div className="bridge-amount">
                  {bridge.amount} {bridge.symbol}
                </div>
                <div className={`bridge-status ${bridge.status}`}>
                  {bridge.status === 'completed' ? <CheckCircle size={14} /> : <Clock size={14} />}
                  {bridge.status}
                </div>
                <a href="#" className="bridge-link"><ExternalLink size={14} /></a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CrossChainSection;
