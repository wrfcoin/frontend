import React, { useState, useEffect } from 'react';
import { WrfCard, WrfBadge, WrfDataTable } from '../DesignSystem';
import './IntegrationCards.css';

const BaseCard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [rollupStatus, setRollupStatus] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [batchStats, setBatchStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Mock rollup statistics (would be replaced with real Base API calls)
  const mockRollupStatus = {
    status: 'operational',
    latestL1Block: 19247862,
    latestL2Block: 93458231,
    batchSize: 128,
    averageFee: '$0.010',
    tps: 128,
    activeProvers: 4,
    securityLevel: 'Optimistic Rollup',
  };

  // Mock transaction data
  const mockTransactions = [
    {
      id: 'txb0012345',
      type: 'L1->L2',
      from: 'Wrf1Ab...',
      to: 'Wrf3Cd...',
      value: '250 WRF',
      timestamp: '2 mins ago',
    },
    {
      id: 'txb0012344',
      type: 'L2->L1',
      from: 'Wrf8Gh...',
      to: 'Wrf5Ef...',
      value: '750 WRF',
      timestamp: '5 mins ago',
    },
    {
      id: 'txb0012343',
      type: 'L2',
      from: 'Wrf2Jk...',
      to: 'Wrf7Lm...',
      value: '500 WRF',
      timestamp: '12 mins ago',
    },
    {
      id: 'txb0012342',
      type: 'L1->L2',
      from: 'Wrf9Op...',
      to: 'Wrf4Qr...',
      value: '1200 WRF',
      timestamp: '18 mins ago',
    },
  ];

  // Mock batch processing stats
  const mockBatchStats = {
    totalBatches: 248726,
    pendingBatches: 3,
    averageBatchSize: 128,
    batchesLast24h: 8642,
    gasUsageL1: '42.8 gwei',
    gasUsageL2: '0.21 gwei',
    compressionRatio: '98.2%',
    weatherBatches: 428,
    computationalBatches: 326,
  };

  // Simulating data loading on component mount
  useEffect(() => {
    const loadData = async () => {
      // Simulating API call delay
      setTimeout(() => {
        setRollupStatus(mockRollupStatus);
        setTransactions(mockTransactions);
        setBatchStats(mockBatchStats);
        setIsLoading(false);
      }, 1000);
    };

    loadData();
  }, []);

  // Tab rendering functions
  const renderOverviewTab = () => {
    return (
      <div className="integration-tab-content">
        <WrfCard headerTitle="Base Network Integration" className="integration-info-card">
          <p>
            Base is an Ethereum L2 built by Coinbase on the OP Stack, offering
            enhanced Wrfcoin scaling capabilities while maintaining security.
            This integration enables:
          </p>
          <ul>
            <li>
              Efficient processing of meteorological data with 90%+ cost
              reduction compared to L1
            </li>
            <li>High-throughput handling of weather model computations</li>
            <li>Seamless bridging to Ethereum and Optimism ecosystems</li>
            <li>
              Enhanced compatibility with Coinbase's ecosystem for potential
              market expansion
            </li>
          </ul>

          <h4>
            Integration Status:{' '}
            <WrfBadge color="warning">Testnet</WrfBadge>
          </h4>

          <div className="stats-container">
            <div className="stat-box">
              <span className="stat-value">~98%</span>
              <span className="stat-label">Gas Savings</span>
            </div>
            <div className="stat-box">
              <span className="stat-value">~7 min</span>
              <span className="stat-label">Finality Time</span>
            </div>
            <div className="stat-box">
              <span className="stat-value">
                {isLoading ? '...' : rollupStatus.tps}
              </span>
              <span className="stat-label">TPS</span>
            </div>
          </div>
        </WrfCard>
      </div>
    );
  };

  const renderRollupStatusTab = () => {
    return (
      <div className="integration-tab-content">
        <WrfCard headerTitle="Base Network Status">
          {isLoading ? (
            <div className="loading-spinner">Loading...</div>
          ) : (
            <>
              <div className="status-header">
                <div
                  className={`status-indicator ${rollupStatus.status === 'operational' ? 'status-green' : 'status-red'}`}
                >
                  <i className="bi bi-circle-fill"></i>
                </div>
                <h4>
                  {rollupStatus.status === 'operational'
                    ? 'Operational'
                    : 'Degraded'}
                </h4>
              </div>

              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Latest L1 Block</span>
                  <span className="stat-value">
                    {rollupStatus.latestL1Block}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Latest L2 Block</span>
                  <span className="stat-value">
                    {rollupStatus.latestL2Block}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Batch Size</span>
                  <span className="stat-value">
                    {rollupStatus.batchSize} tx
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Avg. Fee</span>
                  <span className="stat-value">
                    {rollupStatus.averageFee}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">TPS</span>
                  <span className="stat-value">{rollupStatus.tps}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Active Provers</span>
                  <span className="stat-value">
                    {rollupStatus.activeProvers}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Security</span>
                  <span className="stat-value">
                    {rollupStatus.securityLevel}
                  </span>
                </div>
              </div>

              <h4 className="mt-4">Recent Transactions</h4>
              <WrfDataTable
                data={transactions}
                columns={[
                  { key: 'id', label: 'ID', render: (value) => `${value.substring(0, 6)}...` },
                  { key: 'type', label: 'Type' },
                  { key: 'from', label: 'From' },
                  { key: 'to', label: 'To' },
                  { key: 'value', label: 'Value' },
                  { key: 'timestamp', label: 'Time' },
                ]}
              />
            </>
          )}
        </WrfCard>
      </div>
    );
  };

  const renderBatchProcessingTab = () => {
    return (
      <div className="integration-tab-content">
        <WrfCard headerTitle="Batch Processing">
          {isLoading ? (
            <div className="loading-spinner">Loading...</div>
          ) : (
            <>
              <div className="batch-stats">
                <div className="stat-row">
                  <div className="stat-item">
                    <span className="stat-label">Total Batches</span>
                    <span className="stat-value">
                      {batchStats.totalBatches.toLocaleString()}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Pending Batches</span>
                    <span className="stat-value">
                      {batchStats.pendingBatches}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Avg. Batch Size</span>
                    <span className="stat-value">
                      {batchStats.averageBatchSize} tx
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Batches (24h)</span>
                    <span className="stat-value">
                      {batchStats.batchesLast24h.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="batch-info-section">
                <h4>Gas Usage</h4>
                <div className="gas-comparison">
                  <div className="gas-item">
                    <span className="gas-label">L1 Gas</span>
                    <span className="gas-value">{batchStats.gasUsageL1}</span>
                  </div>
                  <div className="gas-arrow">
                    <i className="bi bi-arrow-right"></i>
                  </div>
                  <div className="gas-item">
                    <span className="gas-label">L2 Gas</span>
                    <span className="gas-value">{batchStats.gasUsageL2}</span>
                  </div>
                  <div className="gas-arrow">
                    <i className="bi bi-arrow-right"></i>
                  </div>
                  <div className="gas-item">
                    <span className="gas-label">Savings</span>
                    <span className="gas-value savings">
                      {batchStats.compressionRatio}
                    </span>
                  </div>
                </div>
              </div>

              <div className="batch-info-section">
                <h4>Weather Data Batches</h4>
                <div className="weather-batches">
                  <div className="weather-batch-stat">
                    <div className="mb-2">Weather Forecast Batches:</div>
                    <div className="batch-count">
                      {batchStats.weatherBatches}
                    </div>
                  </div>
                  <div className="weather-batch-stat">
                    <div className="mb-2">Computational Model Batches:</div>
                    <div className="batch-count">
                      {batchStats.computationalBatches}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </WrfCard>
      </div>
    );
  };

  const renderCrossDomainTab = () => {
    return (
      <div className="integration-tab-content">
        <WrfCard headerTitle="Cross-Domain Messaging">
          <div className="cross-domain-diagram">
            <div className="diagram-flow">
              <div className="diagram-box">
                <i className="bi bi-diagram-3"></i>
                <h4>Ethereum L1</h4>
                <p>Base contracts on Ethereum mainnet</p>
              </div>
              <div className="diagram-arrows">
                <div className="arrow-down">
                  <i className="bi bi-arrow-down"></i>
                  <span>L1 → L2</span>
                </div>
                <div className="arrow-up">
                  <i className="bi bi-arrow-up"></i>
                  <span>L2 → L1</span>
                </div>
              </div>
              <div className="diagram-box">
                <i className="bi bi-layers"></i>
                <h4>Base Network</h4>
                <p>Weather data processing layer</p>
              </div>
            </div>
          </div>

          <div className="message-types">
            <div className="message-type-card">
              <div className="message-type-header">
                <h4>L1 → L2 Messages</h4>
              </div>
              <p>
                Sending weather data collection requests from Ethereum to Base
                Network.
              </p>
              <ul className="process-steps">
                <li>Contract call on L1 triggers message.</li>
                <li>Message is batched and submitted to L2.</li>
                <li>L2 contract executes the request.</li>
              </ul>
              <div className="message-type-stats">
                <div>Avg. Time: ~15 minutes</div>
                <div>Avg. Cost: ~0.002 ETH</div>
              </div>
            </div>

            <div className="message-type-card">
              <div className="message-type-header">
                <h4>L2 → L1 Messages</h4>
              </div>
              <p>
                Sending processed weather data and model outputs back to
                Ethereum.
              </p>
              <ul className="process-steps">
                <li>Contract call on L2 triggers message.</li>
                <li>Message proof is generated.</li>
                <li>7-day challenge period.</li>
                <li>Message is finalized on L1.</li>
              </ul>
              <div className="message-type-stats">
                <div>Avg. Time: ~7 days</div>
                <div>Avg. Cost: ~0.001 ETH</div>
              </div>
            </div>
          </div>
        </WrfCard>
      </div>
    );
  };

  return (
    <div className="integration-card">
      <div className="integration-nav">
        <div className="integration-nav-list">
          <div
            className={`integration-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="bi bi-info-circle"></i> Overview
          </div>
          <div
            className={`integration-nav-item ${activeTab === 'rollup-status' ? 'active' : ''}`}
            onClick={() => setActiveTab('rollup-status')}
          >
            <i className="bi bi-layers"></i> Network Status
          </div>
          <div
            className={`integration-nav-item ${activeTab === 'batch-processing' ? 'active' : ''}`}
            onClick={() => setActiveTab('batch-processing')}
          >
            <i className="bi bi-collection"></i> Batch Processing
          </div>
          <div
            className={`integration-nav-item ${activeTab === 'cross-domain' ? 'active' : ''}`}
            onClick={() => setActiveTab('cross-domain')}
          >
            <i className="bi bi-arrow-left-right"></i> Cross-Domain
          </div>
        </div>
      </div>
      <div className="integration-content">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'rollup-status' && renderRollupStatusTab()}
        {activeTab === 'batch-processing' && renderBatchProcessingTab()}
        {activeTab === 'cross-domain' && renderCrossDomainTab()}
      </div>
    </div>
  );
};

export default BaseCard;
