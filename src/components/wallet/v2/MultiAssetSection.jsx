/**
 * MultiAssetSection Component
 *
 * Displays portfolio holdings with allocation breakdown,
 * token list, and value tracking.
 */

import React, { useState, useMemo } from 'react';
import {
  PieChart,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  EyeOff,
} from 'lucide-react';
import './MultiAssetSection.css';

// Mock portfolio data
const mockAssets = [
  {
    symbol: 'WRF',
    name: 'WRFCoin',
    balance: 5234.56,
    value: 8234.00,
    price: 1.57,
    change24h: 5.2,
    allocation: 52.4,
    color: '#3B82F6',
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    balance: 2.45,
    value: 4222.78,
    price: 1723.58,
    change24h: -1.3,
    allocation: 26.9,
    color: '#627EEA',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    balance: 1500.00,
    value: 1500.00,
    price: 1.00,
    change24h: 0.01,
    allocation: 9.5,
    color: '#2775CA',
  },
  {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    balance: 0.025,
    value: 1087.50,
    price: 43500.00,
    change24h: 2.1,
    allocation: 6.9,
    color: '#F7931A',
  },
  {
    symbol: 'MATIC',
    name: 'Polygon',
    balance: 450,
    value: 382.50,
    price: 0.85,
    change24h: -2.8,
    allocation: 2.4,
    color: '#8247E5',
  },
  {
    symbol: 'LINK',
    name: 'Chainlink',
    balance: 20,
    value: 280.00,
    price: 14.00,
    change24h: 1.5,
    allocation: 1.8,
    color: '#2A5ADA',
  },
];

// Simple pie chart component
const AllocationChart = ({ assets }) => {
  const total = assets.reduce((sum, a) => sum + a.value, 0);
  let cumulativePercent = 0;

  const slices = assets.map(asset => {
    const percent = (asset.value / total) * 100;
    const startAngle = cumulativePercent * 3.6;
    cumulativePercent += percent;
    const endAngle = cumulativePercent * 3.6;
    return { ...asset, percent, startAngle, endAngle };
  });

  return (
    <div className="allocation-chart">
      <svg viewBox="0 0 100 100" className="pie-chart">
        {slices.map((slice, i) => {
          const radius = 40;
          const circumference = 2 * Math.PI * radius;
          const strokeDasharray = `${(slice.percent / 100) * circumference} ${circumference}`;
          const rotation = slice.startAngle - 90;

          return (
            <circle
              key={slice.symbol}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth="20"
              strokeDasharray={strokeDasharray}
              transform={`rotate(${rotation} 50 50)`}
              className="pie-slice"
            />
          );
        })}
      </svg>
      <div className="chart-center">
        <span className="chart-total">${(total / 1000).toFixed(1)}K</span>
        <span className="chart-label">Total Value</span>
      </div>
    </div>
  );
};

const MultiAssetSection = ({ onSwap }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('value'); // 'value' | 'change' | 'name'
  const [hideSmall, setHideSmall] = useState(false);

  const totalValue = useMemo(() =>
    mockAssets.reduce((sum, a) => sum + a.value, 0),
  [],
  );

  const totalChange = useMemo(() => {
    const weighted = mockAssets.reduce((sum, a) =>
      sum + (a.change24h * a.value), 0,
    );
    return weighted / totalValue;
  }, [totalValue]);

  const filteredAssets = useMemo(() => {
    let assets = [...mockAssets];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      assets = assets.filter(a =>
        a.symbol.toLowerCase().includes(query) ||
        a.name.toLowerCase().includes(query),
      );
    }

    if (hideSmall) {
      assets = assets.filter(a => a.value >= 100);
    }

    assets.sort((a, b) => {
      switch (sortBy) {
      case 'change': return b.change24h - a.change24h;
      case 'name': return a.name.localeCompare(b.name);
      default: return b.value - a.value;
      }
    });

    return assets;
  }, [searchQuery, sortBy, hideSmall]);

  return (
    <div className="multi-asset-section">
      {/* Summary Header */}
      <div className="asset-summary">
        <div className="summary-left">
          <AllocationChart assets={mockAssets} />
        </div>
        <div className="summary-right">
          <div className="summary-stats">
            <div className="summary-stat">
              <span className="stat-label">Total Portfolio Value</span>
              <span className="stat-value large">
                ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">24h Change</span>
              <span className={`stat-value ${totalChange >= 0 ? 'positive' : 'negative'}`}>
                {totalChange >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                {totalChange >= 0 ? '+' : ''}{totalChange.toFixed(2)}%
              </span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Assets</span>
              <span className="stat-value">{mockAssets.length} tokens</span>
            </div>
          </div>
          <div className="allocation-legend">
            {mockAssets.slice(0, 4).map(asset => (
              <div key={asset.symbol} className="legend-item">
                <span className="legend-color" style={{ background: asset.color }} />
                <span className="legend-symbol">{asset.symbol}</span>
                <span className="legend-percent">{asset.allocation.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="asset-controls">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search tokens..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="control-buttons">
          <button
            className={`control-btn ${hideSmall ? 'active' : ''}`}
            onClick={() => setHideSmall(!hideSmall)}
            title="Hide small balances"
          >
            {hideSmall ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="value">Sort by Value</option>
            <option value="change">Sort by Change</option>
            <option value="name">Sort by Name</option>
          </select>
          <button className="add-token-btn">
            <Plus size={18} />
            <span>Add Token</span>
          </button>
        </div>
      </div>

      {/* Asset List */}
      <div className="asset-list">
        <div className="asset-list-header">
          <span className="col-asset">Asset</span>
          <span className="col-balance">Balance</span>
          <span className="col-price">Price</span>
          <span className="col-change">24h</span>
          <span className="col-value">Value</span>
          <span className="col-actions">Actions</span>
        </div>
        {filteredAssets.map(asset => (
          <div key={asset.symbol} className="asset-row">
            <div className="col-asset">
              <div
                className="asset-icon"
                style={{ background: `${asset.color}20`, color: asset.color }}
              >
                {asset.symbol.charAt(0)}
              </div>
              <div className="asset-info">
                <span className="asset-symbol">{asset.symbol}</span>
                <span className="asset-name">{asset.name}</span>
              </div>
            </div>
            <div className="col-balance">
              <span className="balance-amount">{asset.balance.toLocaleString()}</span>
              <span className="balance-symbol">{asset.symbol}</span>
            </div>
            <div className="col-price">
              ${asset.price.toLocaleString('en-US', {
                minimumFractionDigits: asset.price < 1 ? 4 : 2,
                maximumFractionDigits: asset.price < 1 ? 4 : 2,
              })}
            </div>
            <div className={`col-change ${asset.change24h >= 0 ? 'positive' : 'negative'}`}>
              {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
            </div>
            <div className="col-value">
              ${asset.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="col-actions">
              <button className="action-btn-small" onClick={() => onSwap?.(asset)}>
                <ArrowUpDown size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultiAssetSection;
