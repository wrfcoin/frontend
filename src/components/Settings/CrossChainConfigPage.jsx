import React, { useState, useEffect } from 'react';

import axios from 'axios';

import './Settings.css';
import DemoSurfaceGate from '../common/DemoSurfaceGate';

// frontend#352: in the demo build this sample's actions are disabled; none of
// them reached a backend, and several reported success after a timer.
const SAMPLE_ACTION = 'Sample only: bridges are not tested, toggled or saved.';

const CrossChainConfigPageSample = () => {
  const [bridges, setBridges] = useState([
    {
      id: 'polkadot',
      name: 'Polkadot Bridge',
      enabled: true,
      fee: '0.001%',
      assets: 8,
      chains: 5,
      status: 'active',
    },
    {
      id: 'near',
      name: 'NEAR Protocol Bridge',
      enabled: true,
      fee: '0.002%',
      assets: 6,
      chains: 3,
      status: 'active',
    },
    {
      id: 'axelar',
      name: 'Axelar Network',
      enabled: true,
      fee: '0.003%',
      assets: 12,
      chains: 8,
      status: 'active',
    },
    {
      id: 'layerzero',
      name: 'LayerZero',
      enabled: true,
      fee: '0.0025%',
      assets: 15,
      chains: 12,
      status: 'active',
    },
    {
      id: 'wormhole',
      name: 'Wormhole',
      enabled: false,
      fee: '0.005%',
      assets: 9,
      chains: 6,
      status: 'inactive',
    },
    {
      id: 'celer',
      name: 'Celer cBridge',
      enabled: true,
      fee: '0.0015%',
      assets: 7,
      chains: 4,
      status: 'active',
    },
    {
      id: 'multichain',
      name: 'Multichain',
      enabled: false,
      fee: '0.004%',
      assets: 11,
      chains: 7,
      status: 'maintenance',
    },
    {
      id: 'synapse',
      name: 'Synapse Protocol',
      enabled: true,
      fee: '0.0035%',
      assets: 5,
      chains: 3,
      status: 'active',
    },
    {
      id: 'hop',
      name: 'Hop Protocol',
      enabled: false,
      fee: '0.006%',
      assets: 4,
      chains: 2,
      status: 'inactive',
    },
    {
      id: 'stargate',
      name: 'Stargate Finance',
      enabled: true,
      fee: '0.002%',
      assets: 6,
      chains: 4,
      status: 'active',
    },
    {
      id: 'across',
      name: 'Across Protocol',
      enabled: false,
      fee: '0.003%',
      assets: 3,
      chains: 2,
      status: 'inactive',
    },
    {
      id: 'allbridge',
      name: 'Allbridge',
      enabled: true,
      fee: '0.0045%',
      assets: 8,
      chains: 5,
      status: 'active',
    },
    {
      id: 'gravity',
      name: 'Gravity Bridge',
      enabled: false,
      fee: '0.0025%',
      assets: 4,
      chains: 2,
      status: 'inactive',
    },
  ]);

  const [supportedAssets, setSupportedAssets] = useState([
    { symbol: 'WRF', name: 'Wrfcoin', bridges: 13, volume24h: '2.4M' },
    { symbol: 'ETH', name: 'Ethereum', bridges: 12, volume24h: '45.2M' },
    { symbol: 'BTC', name: 'Bitcoin', bridges: 8, volume24h: '78.1M' },
    { symbol: 'USDC', name: 'USD Coin', bridges: 11, volume24h: '156.7M' },
    { symbol: 'USDT', name: 'Tether', bridges: 10, volume24h: '234.8M' },
    { symbol: 'DOT', name: 'Polkadot', bridges: 7, volume24h: '12.3M' },
    { symbol: 'NEAR', name: 'NEAR Protocol', bridges: 6, volume24h: '8.9M' },
    { symbol: 'AVAX', name: 'Avalanche', bridges: 9, volume24h: '23.4M' },
    { symbol: 'MATIC', name: 'Polygon', bridges: 8, volume24h: '34.5M' },
    { symbol: 'SOL', name: 'Solana', bridges: 7, volume24h: '67.2M' },
  ]);

  const [bridgeSettings, setBridgeSettings] = useState({
    autoRouting: true,
    slippageTolerance: 0.5,
    bridgeFeeOptimization: true,
    crossChainSecurity: 'high',
    routingStrategy: 'optimal',
    gasOptimization: true,
    enableFastFinality: true,
    maxBridgeTime: 30,
  });

  const [metrics, setMetrics] = useState({
    totalVolume24h: '642.3M',
    activeBridges: 8,
    totalAssets: 41,
    avgBridgeTime: '4.2min',
    successRate: '99.7%',
  });

  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleBridgeToggle = async bridgeId => {
    setLoading(true);
    try {
      setBridges(prev =>
        prev.map(bridge =>
          bridge.id === bridgeId
            ? {
              ...bridge,
              enabled: !bridge.enabled,
              status: !bridge.enabled ? 'active' : 'inactive',
            }
            : bridge,
        ),
      );

      const bridge = bridges.find(b => b.id === bridgeId);
      setSnackbar({
        open: true,
        message: `${bridge.name} ${bridge.enabled ? 'disabled' : 'enabled'} successfully`,
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to toggle ${bridgeId}`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsChange = e => {
    const { name, value, type, checked } = e.target;
    setBridgeSettings(prev => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? checked
          : type === 'number'
            ? Number(value)
            : value,
    }));
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // In a real implementation, save to API
      setSnackbar({
        open: true,
        message: 'Cross-chain settings saved successfully',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to save settings',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = status => {
    switch (status) {
    case 'active':
      return '#4caf50';
    case 'inactive':
      return '#f44336';
    case 'maintenance':
      return '#ff9800';
    default:
      return '#9e9e9e';
    }
  };

  const handleTestBridge = async bridgeId => {
    setLoading(true);
    try {
      const bridge = bridges.find(b => b.id === bridgeId);
      setSnackbar({
        open: true,
        message: `Testing ${bridge.name} connection...`,
        severity: 'info',
      });

      // Simulate test
      setTimeout(() => {
        setSnackbar({
          open: true,
          message: `${bridge.name} test completed successfully`,
          severity: 'success',
        });
        setLoading(false);
      }, 2000);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Bridge test failed',
        severity: 'error',
      });
      setLoading(false);
    }
  };

  return (
    <div className="settings-content">
      <div className="settings-section">
        <h2>
          <i className="bi bi-diagram-3-fill"></i> Cross-Chain Bridge
          Configuration
        </h2>
        <p className="settings-description">
          Configure and manage your 13 cross-chain bridge protocols supporting
          41 unique assets. Optimize routing, fees, and security settings for
          seamless cross-chain transactions.
        </p>

        {/* Metrics Overview */}
        <div className="bridge-metrics-overview">
          <h3>Bridge Network Overview</h3>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">24h Volume</div>
              <div className="metric-value">${metrics.totalVolume24h}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Active Bridges</div>
              <div className="metric-value">{metrics.activeBridges}/13</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Supported Assets</div>
              <div className="metric-value">{metrics.totalAssets}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Avg Bridge Time</div>
              <div className="metric-value">{metrics.avgBridgeTime}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Success Rate</div>
              <div className="metric-value">{metrics.successRate}</div>
            </div>
          </div>
        </div>

        {/* Bridge Configuration */}
        <div className="settings-section">
          <div className="settings-section-header">
            <h3>Bridge Protocols</h3>
            <div className="category-actions">
              <button disabled title={SAMPLE_ACTION} className="btn-enable-all">Enable All</button>
              <button disabled title={SAMPLE_ACTION} className="btn-disable-all">Disable All</button>
            </div>
          </div>

          <div className="bridge-config-grid">
            <table className="bridge-table">
              <thead className="bridge-table-header">
                <tr>
                  <th>Bridge Protocol</th>
                  <th>Status</th>
                  <th>Fee Rate</th>
                  <th>Assets/Chains</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bridges.map(bridge => (
                  <tr className="bridge-row" key={bridge.id}>
                    <td className="bridge-title-cell">
                      <div className="bridge-title">{bridge.name}</div>
                    </td>
                    <td className="bridge-status-cell">
                      <div className="status-text">
                        <span
                          className="status-indicator"
                          style={{
                            backgroundColor: getStatusColor(bridge.status),
                          }}
                        ></span>
                        {bridge.status.charAt(0).toUpperCase() +
                          bridge.status.slice(1)}
                      </div>
                    </td>
                    <td className="bridge-fee-cell">{bridge.fee}</td>
                    <td className="bridge-assets-cell">
                      {bridge.assets} assets / {bridge.chains} chains
                    </td>
                    <td className="bridge-actions-cell">
                      <div className="bridge-actions">
                        <button
                          className="action-btn configure-btn"
                          disabled
                          title={SAMPLE_ACTION}
                        >
                          Configure
                        </button>
                        <button
                          className="action-btn test-btn"
                          disabled title={SAMPLE_ACTION}
                        >
                          Test
                        </button>
                        <button
                          className={`action-btn toggle-btn ${bridge.enabled ? 'disable-btn' : 'enable-btn'}`}
                          disabled title={SAMPLE_ACTION}
                        >
                          {bridge.enabled ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Supported Assets */}
        <div className="settings-section">
          <h3>Supported Assets</h3>
          <div className="assets-grid">
            <table className="assets-table">
              <thead className="assets-table-header">
                <tr>
                  <th>Asset</th>
                  <th>Supported Bridges</th>
                  <th>24h Volume</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {supportedAssets.map(asset => (
                  <tr className="asset-row" key={asset.symbol}>
                    <td className="asset-title-cell">
                      <div className="asset-title">
                        <strong>{asset.symbol}</strong>
                        <span className="asset-name">{asset.name}</span>
                      </div>
                    </td>
                    <td className="asset-bridges-cell">
                      {asset.bridges}/13 bridges
                    </td>
                    <td className="asset-volume-cell">${asset.volume24h}</td>
                    <td className="asset-status-cell">
                      <span className="status-indicator active"></span>
                      Active
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bridge Settings */}
        <div className="settings-section">
          <h3>Global Bridge Settings</h3>
          <form className="bridge-settings-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="slippageTolerance">
                  Slippage Tolerance (%)
                </label>
                <input
                  type="number"
                  id="slippageTolerance"
                  name="slippageTolerance"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={bridgeSettings.slippageTolerance}
                  onChange={handleSettingsChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="maxBridgeTime">Max Bridge Time (minutes)</label>
                <input
                  type="number"
                  id="maxBridgeTime"
                  name="maxBridgeTime"
                  min="5"
                  max="60"
                  value={bridgeSettings.maxBridgeTime}
                  onChange={handleSettingsChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="crossChainSecurity">Security Level</label>
                <select
                  id="crossChainSecurity"
                  name="crossChainSecurity"
                  value={bridgeSettings.crossChainSecurity}
                  onChange={handleSettingsChange}
                >
                  <option value="standard">Standard</option>
                  <option value="high">High</option>
                  <option value="maximum">Maximum</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="routingStrategy">Routing Strategy</label>
                <select
                  id="routingStrategy"
                  name="routingStrategy"
                  value={bridgeSettings.routingStrategy}
                  onChange={handleSettingsChange}
                >
                  <option value="fastest">Fastest</option>
                  <option value="cheapest">Cheapest</option>
                  <option value="optimal">Optimal</option>
                  <option value="secure">Most Secure</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="autoRouting"
                  name="autoRouting"
                  checked={bridgeSettings.autoRouting}
                  onChange={handleSettingsChange}
                />
                <label htmlFor="autoRouting">Enable Auto-Routing</label>
              </div>
              <div className="form-hint">
                Automatically select the best bridge for each transaction
              </div>
            </div>

            <div className="form-group">
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="bridgeFeeOptimization"
                  name="bridgeFeeOptimization"
                  checked={bridgeSettings.bridgeFeeOptimization}
                  onChange={handleSettingsChange}
                />
                <label htmlFor="bridgeFeeOptimization">
                  Bridge Fee Optimization
                </label>
              </div>
              <div className="form-hint">
                Automatically optimize fees across different bridges
              </div>
            </div>

            <div className="form-group">
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="gasOptimization"
                  name="gasOptimization"
                  checked={bridgeSettings.gasOptimization}
                  onChange={handleSettingsChange}
                />
                <label htmlFor="gasOptimization">Gas Price Optimization</label>
              </div>
              <div className="form-hint">
                Optimize gas prices for cross-chain transactions
              </div>
            </div>

            <div className="form-group">
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="enableFastFinality"
                  name="enableFastFinality"
                  checked={bridgeSettings.enableFastFinality}
                  onChange={handleSettingsChange}
                />
                <label htmlFor="enableFastFinality">Enable Fast Finality</label>
              </div>
              <div className="form-hint">
                Use fast finality modes when available (may increase fees)
              </div>
            </div>

            <div className="settings-action-buttons">
              <button
                type="button"
                className="save-button"
                disabled title={SAMPLE_ACTION}
              >
                <i className="bi bi-save"></i> Save Bridge Settings
              </button>
              <button
                type="button"
                className="test-all-button"
                disabled
                title={SAMPLE_ACTION}
              >
                <i className="bi bi-check-circle"></i> Test All Bridges
              </button>
            </div>
          </form>
        </div>

        {/* Snackbar */}
        {snackbar.open && (
          <div className={`snackbar ${snackbar.severity}`}>
            {snackbar.message}
            <button onClick={() => setSnackbar({ ...snackbar, open: false })}>
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// frontend#352: display-only fabricated surface. The default build shows an
// honest not-live state and never mounts the sample.
const CrossChainConfigPage = () => (
  <DemoSurfaceGate
    title="Cross-chain configuration is not live"
    description="No backend route stores or tests cross-chain bridge settings yet."
    testId="cross-chain-config"
  >
    <CrossChainConfigPageSample />
  </DemoSurfaceGate>
);

export default CrossChainConfigPage;
