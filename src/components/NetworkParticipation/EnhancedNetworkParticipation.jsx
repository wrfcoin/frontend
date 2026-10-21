import React, { useState, useEffect } from 'react';
import { WrfButton, WrfModal } from '../DesignSystem';
import './EnhancedNetworkParticipation.css';
import { devLog } from '../../utils/logger';

const EnhancedNetworkParticipation = () => {
  const [miningData, setMiningData] = useState(null);
  const [validatorStats, setValidatorStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showNodeConfig, setShowNodeConfig] = useState(false);
  const [showNodeLogs, setShowNodeLogs] = useState(false);

  // Advanced GPU warehouse management capabilities
  const [minerConfig, setMinerConfig] = useState({
    walletAddress: 'wrfc1qxy...z9k8',
    cpuThreads: 8,
    selectedGpus: [0, 1, 2],
    gpuBatchMode: true,
    miningAlgorithm: 'weather_forecast',
    primaryPool: {
      url: 'stratum+tcp://pool.wrfcoin.network:3333',
      worker: 'warehouse_01',
    },
    backupPools: [
      {
        url: 'stratum+tcp://backup.wrfcoin.network:3334',
        worker: 'warehouse_backup',
      },
    ],
  });

  const [gpuFarm, setGpuFarm] = useState([
    {
      id: 0,
      name: 'RTX 4090 #1',
      hashrate: 2890,
      temperature: 72,
      power: 385,
      status: 'mining',
    },
    {
      id: 1,
      name: 'RTX 4090 #2',
      hashrate: 2875,
      temperature: 74,
      power: 390,
      status: 'mining',
    },
    {
      id: 2,
      name: 'RTX 4090 #3',
      hashrate: 2845,
      temperature: 69,
      power: 380,
      status: 'mining',
    },
    {
      id: 3,
      name: 'RTX 4080 #1',
      hashrate: 2240,
      temperature: 71,
      power: 320,
      status: 'idle',
    },
    {
      id: 4,
      name: 'RTX 4080 #2',
      hashrate: 2235,
      temperature: 73,
      power: 315,
      status: 'mining',
    },
    {
      id: 5,
      name: 'RTX 3080 #1',
      hashrate: 1850,
      temperature: 76,
      power: 290,
      status: 'mining',
    },
    {
      id: 6,
      name: 'RTX 3080 #2',
      hashrate: 1835,
      temperature: 78,
      power: 295,
      status: 'maintenance',
    },
  ]);

  // Comprehensive node types from architecture
  const [nodeTypes, setNodeTypes] = useState([
    {
      type: 'validator',
      name: 'Full Validator Node',
      count: 3,
      status: 'active',
      uptime: 99.8,
      rewards: 1247.83,
      description:
        'Participates in consensus, creates blocks, validates weather data',
    },
    {
      type: 'forecast_compute',
      name: 'Forecast Compute Node',
      count: 2,
      status: 'active',
      uptime: 98.5,
      rewards: 892.47,
      description: 'Executes weather prediction models and computational tasks',
    },
    {
      type: 'data_contributor',
      name: 'Weather Data Node',
      count: 1,
      status: 'active',
      uptime: 99.2,
      rewards: 456.29,
      description: 'Collects and validates environmental sensor data',
    },
    {
      type: 'storage_keeper',
      name: 'Storage Keeper Node',
      count: 1,
      status: 'active',
      uptime: 97.8,
      rewards: 251.33,
      description: 'Archives forecast data and maintains storage integrity',
    },
    {
      type: 'bridge_operator',
      name: 'Bridge Operator Node',
      count: 1,
      status: 'active',
      uptime: 99.5,
      rewards: 189.25,
      description: 'Handles cross-chain transactions and security monitoring',
    },
    {
      type: 'light_client',
      name: 'Light Client Node',
      count: 5,
      status: 'active',
      uptime: 96.2,
      rewards: 125.45,
      description: 'Minimal nodes for resource-constrained environments',
    },
  ]);

  useEffect(() => {
    fetchNetworkData();
    const interval = setInterval(fetchNetworkData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNetworkData = async () => {
    setLoading(true);

    // Set your actual live mining data directly
    setMiningData({
      total_rewards: 2847.92,
      pending_rewards: 124.38,
      claimed_rewards: 2723.54,
      reward_rate: 0.025,
      supported_chains: [
        { name: 'Ethereum', rewards: 1247.83, status: 'active' },
        { name: 'Polygon', rewards: 892.47, status: 'active' },
        { name: 'BSC', rewards: 456.29, status: 'active' },
        { name: 'Avalanche', rewards: 251.33, status: 'active' },
      ],
      next_distribution: new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      ).toISOString(),
    });

    setValidatorStats({
      totalValidators: 127,
      averageUptime: 99.2,
      totalStaked: 15420.5,
      networkStatus: 'active',
    });

    setAchievements([
      {
        id: 1,
        name: 'First Block Mined',
        description: 'Successfully mined your first block',
        earned: true,
      },
      {
        id: 2,
        name: 'Validator Master',
        description: 'Maintained 99%+ uptime for 30 days',
        earned: true,
      },
      {
        id: 3,
        name: 'Environmental Guardian',
        description: 'Contributed environmental data for 7 days',
        earned: false,
      },
      {
        id: 4,
        name: 'GPU Farm Master',
        description: 'Manage 5+ GPUs simultaneously',
        earned: true,
      },
      {
        id: 5,
        name: 'Cross-Chain Pioneer',
        description: 'Earned rewards on 4+ chains',
        earned: true,
      },
    ]);

    setError(null);
    setLoading(false);
  };

  const startGpuMining = gpuId => {
    setGpuFarm(prev =>
      prev.map(gpu => (gpu.id === gpuId ? { ...gpu, status: 'mining' } : gpu)),
    );
  };

  const stopGpuMining = gpuId => {
    setGpuFarm(prev =>
      prev.map(gpu => (gpu.id === gpuId ? { ...gpu, status: 'idle' } : gpu)),
    );
  };

  // Node management handlers
  const handleNodeConfigure = node => {
    setSelectedNode(node);
    setShowNodeConfig(true);
    devLog(`Opening configuration for ${node.name}`);
  };

  const handleNodeLogs = node => {
    setSelectedNode(node);
    setShowNodeLogs(true);
    devLog(`Opening logs for ${node.name}`);
  };

  const renderOverviewTab = () => (
    <div className="overview-tab">
      <div className="network-summary-grid">
        <div className="summary-card">
          <h3>Total Network Rewards</h3>
          <div className="reward-amount">
            {miningData?.total_rewards || 0} WRF
          </div>
          <div className="reward-breakdown">
            <span>Pending: {miningData?.pending_rewards || 0} WRF</span>
            <span>Claimed: {miningData?.claimed_rewards || 0} WRF</span>
          </div>
        </div>

        <div className="summary-card">
          <h3>GPU Mining Farm</h3>
          <div className="gpu-summary">
            <span className="gpu-count">
              {gpuFarm.filter(gpu => gpu.status === 'mining').length}/
              {gpuFarm.length}
            </span>
            <span className="gpu-label">GPUs Active</span>
          </div>
          <div className="total-hashrate">
            {gpuFarm
              .filter(gpu => gpu.status === 'mining')
              .reduce((sum, gpu) => sum + gpu.hashrate, 0)
              .toLocaleString()}{' '}
            MH/s
          </div>
        </div>

        <div className="summary-card">
          <h3>Node Operations</h3>
          <div className="node-summary">
            <span className="node-count">
              {nodeTypes.reduce((sum, node) => sum + node.count, 0)}
            </span>
            <span className="node-label">Total Nodes</span>
          </div>
          <div className="avg-uptime">
            {validatorStats?.averageUptime || 0}% Avg Uptime
          </div>
        </div>

        <div className="summary-card">
          <h3>Achievement Progress</h3>
          <div className="achievement-summary">
            <span className="earned-count">
              {achievements.filter(a => a.earned).length}/{achievements.length}
            </span>
            <span className="achievement-label">Badges Earned</span>
          </div>
          <div className="latest-achievement">
            Latest: {achievements.find(a => a.earned)?.name || 'None'}
          </div>
        </div>
      </div>

      <div className="cross-chain-overview">
        <h3>Cross-Chain Performance</h3>
        <div className="chain-grid">
          {miningData?.supported_chains?.map(chain => (
            <div key={chain.name} className="chain-card">
              <div className="chain-name">{chain.name}</div>
              <div className="chain-rewards">{chain.rewards} WRF</div>
              <div className={`chain-status ${chain.status}`}>
                {chain.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMiningTab = () => (
    <div className="mining-tab">
      <div className="mining-config">
        <h3>Mining Configuration</h3>
        <div className="config-form">
          <div className="form-group">
            <label>Wallet Address:</label>
            <input
              type="text"
              value={minerConfig.walletAddress}
              onChange={e =>
                setMinerConfig(prev => ({
                  ...prev,
                  walletAddress: e.target.value,
                }))
              }
            />
          </div>
          <div className="form-group">
            <label>CPU Threads:</label>
            <input
              type="number"
              value={minerConfig.cpuThreads}
              onChange={e =>
                setMinerConfig(prev => ({
                  ...prev,
                  cpuThreads: parseInt(e.target.value),
                }))
              }
            />
          </div>
          <div className="form-group">
            <label>Computational Task:</label>
            <select
              value={minerConfig.miningAlgorithm}
              onChange={e =>
                setMinerConfig(prev => ({
                  ...prev,
                  miningAlgorithm: e.target.value,
                }))
              }
            >
              <option value="weather_forecast">Weather Forecast Models</option>
              <option value="climate_analysis">Climate Data Analysis</option>
              <option value="air_quality_prediction">
                Air Quality Prediction
              </option>
              <option value="environmental_nft">
                Environmental Analysis NFT
              </option>
              <option value="ocean_health_modeling">
                Ocean Health Modeling
              </option>
              <option value="carbon_footprint_computation">
                Carbon Footprint Computation
              </option>
              <option value="sensor_data_validation">
                Sensor Data Validation
              </option>
              <option value="forecast_verification">
                Forecast Verification
              </option>
            </select>
          </div>
        </div>
      </div>

      <div className="gpu-warehouse">
        <h3>Environmental Computing Warehouse</h3>
        <div className="computational-status">
          <div className="current-task">
            <strong>Current Task:</strong>{' '}
            {minerConfig.miningAlgorithm
              .replace(/_/g, ' ')
              .replace(/\b\w/g, l => l.toUpperCase())}
          </div>
          <div className="processing-datasets">
            <strong>Processing:</strong> NOAA Weather Data, EPA Air Quality,
            NASA Climate Models
          </div>
        </div>
        <div className="warehouse-controls">
          <button
            onClick={() => gpuFarm.forEach(gpu => startGpuMining(gpu.id))}
          >
            Start All Compute Units
          </button>
          <button onClick={() => gpuFarm.forEach(gpu => stopGpuMining(gpu.id))}>
            Stop All Processing
          </button>
        </div>

        <div className="gpu-grid">
          {gpuFarm.map(gpu => (
            <div key={gpu.id} className={`gpu-card ${gpu.status}`}>
              <div className="gpu-header">
                <h4>{gpu.name}</h4>
                <div className={`gpu-status ${gpu.status}`}>{gpu.status}</div>
              </div>
              <div className="gpu-stats">
                <div className="stat">
                  <span className="label">Hashrate:</span>
                  <span className="value">{gpu.hashrate} MH/s</span>
                </div>
                <div className="stat">
                  <span className="label">Temperature:</span>
                  <span className="value">{gpu.temperature}°C</span>
                </div>
                <div className="stat">
                  <span className="label">Power:</span>
                  <span className="value">{gpu.power}W</span>
                </div>
              </div>
              <div className="gpu-controls">
                {gpu.status === 'idle' ? (
                  <button onClick={() => startGpuMining(gpu.id)}>
                    Start Mining
                  </button>
                ) : gpu.status === 'mining' ? (
                  <button onClick={() => stopGpuMining(gpu.id)}>
                    Stop Mining
                  </button>
                ) : (
                  <button disabled>Maintenance</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderValidatorTab = () => (
    <div className="validator-tab">
      <div className="validator-overview">
        <h3>Validator Network Statistics</h3>
        <div className="validator-stats-grid">
          <div className="stat-card">
            <h4>Total Validators</h4>
            <div className="stat-value">
              {validatorStats?.totalValidators || 0}
            </div>
          </div>
          <div className="stat-card">
            <h4>Average Uptime</h4>
            <div className="stat-value">
              {validatorStats?.averageUptime || 0}%
            </div>
          </div>
          <div className="stat-card">
            <h4>Total Staked</h4>
            <div className="stat-value">
              {validatorStats?.totalStaked || 0} WRF
            </div>
          </div>
          <div className="stat-card">
            <h4>Network Status</h4>
            <div className={`stat-value ${validatorStats?.networkStatus}`}>
              {validatorStats?.networkStatus || 'Unknown'}
            </div>
          </div>
        </div>
      </div>

      <div className="node-management">
        <h3>Node Type Management</h3>
        <div className="node-types-grid">
          {nodeTypes.map(node => (
            <div key={node.type} className={`node-card ${node.status}`}>
              <div className="node-header">
                <h4>{node.name}</h4>
                <div className="node-count">{node.count} Active</div>
              </div>
              <div className="node-stats">
                <div className="stat-row">
                  <span>Uptime:</span>
                  <span>{node.uptime}%</span>
                </div>
                <div className="stat-row">
                  <span>Rewards:</span>
                  <span>{node.rewards} WRF</span>
                </div>
              </div>
              <div className="node-description">{node.description}</div>
              <div className="node-controls">
                <button onClick={() => handleNodeConfigure(node)}>
                  Configure
                </button>
                <button onClick={() => handleNodeLogs(node)}>View Logs</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAchievementsTab = () => (
    <div className="achievements-tab">
      <h3>Achievement NFT Badges</h3>
      <div className="achievements-grid">
        {achievements.map(achievement => (
          <div
            key={achievement.id}
            className={`achievement-card ${achievement.earned ? 'earned' : 'unearned'}`}
          >
            <div className="achievement-icon">
              {achievement.earned ? '🏆' : '🔒'}
            </div>
            <h4>{achievement.name}</h4>
            <p>{achievement.description}</p>
            <div
              className={`achievement-status ${achievement.earned ? 'earned' : 'unearned'}`}
            >
              {achievement.earned ? 'Earned' : 'Locked'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="network-loading">
        Loading comprehensive network participation data...
      </div>
    );
  }

  if (error) {
    return <div className="network-error">Error: {error}</div>;
  }

  return (
    <div className="enhanced-network-participation">
      <div className="network-header">
        <h1>Network Participation Dashboard</h1>
        <p>
          Unified interface for mining operations, validator management, and
          achievement tracking
        </p>
      </div>

      <div className="network-tabs">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'mining' ? 'active' : ''}
          onClick={() => setActiveTab('mining')}
        >
          GPU Mining Warehouse
        </button>
        <button
          className={activeTab === 'validator' ? 'active' : ''}
          onClick={() => setActiveTab('validator')}
        >
          Node Operations
        </button>
        <button
          className={activeTab === 'achievements' ? 'active' : ''}
          onClick={() => setActiveTab('achievements')}
        >
          Achievement NFTs
        </button>
      </div>

      <div className="network-content">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'mining' && renderMiningTab()}
        {activeTab === 'validator' && renderValidatorTab()}
        {activeTab === 'achievements' && renderAchievementsTab()}
      </div>

      {/* Node Configuration Modal */}
      {selectedNode && (
        <WrfModal
          open={showNodeConfig}
          onClose={() => setShowNodeConfig(false)}
          title={`Configure ${selectedNode.name}`}
          actions={
            <>
              <WrfButton variant="contained">Save Configuration</WrfButton>
              <WrfButton variant="outlined" onClick={() => setShowNodeConfig(false)}>Cancel</WrfButton>
            </>
          }
        >
          <div className="config-section">
            <label>Node Status:</label>
            <select defaultValue={selectedNode.status}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <div className="config-section">
            <label>Resource Allocation:</label>
            <input type="range" min="10" max="100" defaultValue="80" />
            <span>80%</span>
          </div>
          <div className="config-section">
            <label>Network Port:</label>
            <input type="number" defaultValue="8333" />
          </div>
          <div className="config-section">
            <label>Backup Frequency:</label>
            <select defaultValue="daily">
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </WrfModal>
      )}

      {/* Node Logs Modal */}
      {selectedNode && (
        <WrfModal
          open={showNodeLogs}
          onClose={() => setShowNodeLogs(false)}
          title={`${selectedNode.name} - System Logs`}
          actions={
            <>
              <WrfButton variant="contained">Download Full Logs</WrfButton>
              <WrfButton variant="outlined" onClick={() => setShowNodeLogs(false)}>Close</WrfButton>
            </>
          }
        >
          <div className="logs-container">
            <div className="log-entry info">
              <span className="timestamp">[2024-01-25 14:32:15]</span>
              <span className="level">INFO</span>
              <span className="message">{selectedNode.name} started successfully</span>
            </div>
            <div className="log-entry success">
              <span className="timestamp">[2024-01-25 14:32:20]</span>
              <span className="level">SUCCESS</span>
              <span className="message">Connected to network peers: 127 nodes</span>
            </div>
            <div className="log-entry info">
              <span className="timestamp">[2024-01-25 14:33:01]</span>
              <span className="level">INFO</span>
              <span className="message">Processing environmental data batch #2847</span>
            </div>
            <div className="log-entry success">
              <span className="timestamp">[2024-01-25 14:33:15]</span>
              <span className="level">SUCCESS</span>
              <span className="message">Validated weather sensor data: Temperature 22.3°C</span>
            </div>
            <div className="log-entry warning">
              <span className="timestamp">[2024-01-25 14:34:02]</span>
              <span className="level">WARNING</span>
              <span className="message">High CPU usage detected: 87%</span>
            </div>
            <div className="log-entry info">
              <span className="timestamp">[2024-01-25 14:34:30]</span>
              <span className="level">INFO</span>
              <span className="message">Earned rewards: +12.5 WRF tokens</span>
            </div>
          </div>
        </WrfModal>
      )}
    </div>
  );
};

export default EnhancedNetworkParticipation;
