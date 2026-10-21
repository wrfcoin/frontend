import React, { useState, useEffect } from 'react';
import { WrfCard, WrfBadge, WrfButton } from '../DesignSystem';
import './IntegrationCards.css';

const OptimismCard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [rollupStatus, setRollupStatus] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [batchStats, setBatchStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Mock rollup statistics (would be replaced with real Optimism API calls)
  const mockRollupStatus = {
    status: 'operational',
    latestL1Block: 19245812,
    latestL2Block: 92856723,
    batchSize: 128,
    averageFee: '$0.012',
    tps: 124,
    activeProvers: 3,
    securityLevel: 'Fault Proofs',
  };

  // Mock transactions for demonstration
  const mockTransactions = [
    {
      id: 'tx0x8a21f...3b6e',
      type: 'Weather Data',
      status: 'confirmed',
      fee: '0.00012 ETH',
      time: '30s ago',
      size: '2.3 KB',
    },
    {
      id: 'tx0x7c52a...9f1d',
      type: 'Computational',
      status: 'confirmed',
      fee: '0.00009 ETH',
      time: '45s ago',
      size: '4.8 KB',
    },
    {
      id: 'tx0x3e68b...21ac',
      type: 'NFT Metadata',
      status: 'confirmed',
      fee: '0.00015 ETH',
      time: '1m ago',
      size: '3.1 KB',
    },
    {
      id: 'tx0x9a4db...f72c',
      type: 'Chain Message',
      status: 'confirmed',
      fee: '0.00008 ETH',
      time: '2m ago',
      size: '1.5 KB',
    },
    {
      id: 'tx0x6f73c...4e9b',
      type: 'Sensor Data',
      status: 'confirmed',
      fee: '0.00006 ETH',
      time: '3m ago',
      size: '0.9 KB',
    },
  ];

  // Mock batch statistics
  const mockBatchStats = {
    last24h: 487,
    totalBatches: 285621,
    averageSize: '256 KB',
    compressionRatio: '75%',
    finality: '5-7 minutes',
    dataAvailability: 'Ethereum L1',
  };

  useEffect(() => {
    // Simulate API data loading
    setIsLoading(true);
    setTimeout(() => {
      setRollupStatus(mockRollupStatus);
      setTransactions(mockTransactions);
      setBatchStats(mockBatchStats);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleRefreshStatus = () => {
    setIsLoading(true);
    // In a real implementation, this would fetch fresh status from Optimism endpoints
    setTimeout(() => {
      // Simulate some slight changes in the stats
      const updatedStatus = {
        ...mockRollupStatus,
        latestL1Block:
          mockRollupStatus.latestL1Block + Math.floor(Math.random() * 5),
        latestL2Block:
          mockRollupStatus.latestL2Block + Math.floor(Math.random() * 20),
        tps: mockRollupStatus.tps + Math.floor(Math.random() * 10) - 5,
      };
      setRollupStatus(updatedStatus);
      setIsLoading(false);
    }, 1500);
  };

  const renderOverviewTab = () => {
    return (
      <div className="integration-tab-content">
        <WrfCard headerTitle="Optimism Layer 2 Integration" className="integration-info-card">
          <p>
              Optimism is an EVM-compatible Optimistic Rollup layer 2 solution
              that significantly improves Wrfcoin's scalability while
              maintaining security. This integration enables:
          </p>
          <ul>
            <li>High-throughput processing of weather data transactions</li>
            <li>Lower fees for computational tasks and data storage</li>
            <li>Fault proof systems for verifying computational results</li>
            <li>Cross-domain messaging between L1 and L2</li>
          </ul>

          <h4>
              Integration Status:{' '}
            <WrfBadge color="warning">Testnet</WrfBadge>
          </h4>

          <div className="stats-container">
            <div className="stat-box">
              <span className="stat-value">~100x</span>
              <span className="stat-label">Gas Savings</span>
            </div>
            <div className="stat-box">
              <span className="stat-value">~5 min</span>
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
        <WrfCard headerTitle="Rollup Status">
          <div className="card-header-actions">
            <WrfButton
              variant="primary"
              size="sm"
              onClick={handleRefreshStatus}
              disabled={isLoading}
            >
              <i className="bi bi-arrow-repeat"></i> Refresh
            </WrfButton>
          </div>
          {isLoading ? (
            <div className="loading-spinner">
              <i className="bi bi-arrow-repeat spinning"></i>
              <span>Loading rollup status...</span>
            </div>
          ) : (
            <>
              <div className="status-indicator">
                <span className="status-label">Rollup Status:</span>
                <span
                  className={`status-value ${rollupStatus.status === 'operational' ? 'text-success' : 'text-warning'}`}
                >
                  <i
                    className={`bi bi-circle-fill ${rollupStatus.status === 'operational' ? 'text-success' : 'text-warning'}`}
                  ></i>
                  {rollupStatus.status === 'operational'
                    ? 'Operational'
                    : 'Degraded'}
                </span>
              </div>

              <div className="status-grid">
                <div className="status-item">
                  <span className="status-label">Latest L1 Block:</span>
                  <span className="status-value">
                    {rollupStatus.latestL1Block}
                  </span>
                </div>
                <div className="status-item">
                  <span className="status-label">Latest L2 Block:</span>
                  <span className="status-value">
                    {rollupStatus.latestL2Block}
                  </span>
                </div>
                <div className="status-item">
                  <span className="status-label">Batch Size:</span>
                  <span className="status-value">
                    {rollupStatus.batchSize} tx/batch
                  </span>
                </div>
                <div className="status-item">
                  <span className="status-label">Average Fee:</span>
                  <span className="status-value">
                    {rollupStatus.averageFee}
                  </span>
                </div>
                <div className="status-item">
                  <span className="status-label">
                      Transactions Per Second:
                  </span>
                  <span className="status-value">{rollupStatus.tps} TPS</span>
                </div>
                <div className="status-item">
                  <span className="status-label">Active Provers:</span>
                  <span className="status-value">
                    {rollupStatus.activeProvers}
                  </span>
                </div>
                <div className="status-item">
                  <span className="status-label">Security Level:</span>
                  <span className="status-value">
                    <i className="bi bi-shield-check text-success"></i>{' '}
                    {rollupStatus.securityLevel}
                  </span>
                </div>
              </div>

              <h4 className="mt-4">Recent Transactions</h4>
              <table className="table">
                <thead>
                  <tr>
                    <th>TX ID</th>
                    <th>Type</th>
                    <th>Size</th>
                    <th>Fee</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id}>
                      <td>
                        <code>{tx.id}</code>
                      </td>
                      <td>{tx.type}</td>
                      <td>{tx.size}</td>
                      <td>{tx.fee}</td>
                      <td>{tx.time}</td>
                      <td>
                        <WrfBadge color="success">
                          <i className="bi bi-check-circle"></i> {tx.status}
                        </WrfBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
            <div className="loading-spinner">
              <i className="bi bi-arrow-repeat spinning"></i>
              <span>Loading batch data...</span>
            </div>
          ) : (
            <>
              <div className="batch-stats">
                <h4>Batch Statistics</h4>
                <div className="stats-container">
                  <div className="stat-box">
                    <span className="stat-value">{batchStats.last24h}</span>
                    <span className="stat-label">Last 24 Hours</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-value">
                      {batchStats.totalBatches}
                    </span>
                    <span className="stat-label">Total Batches</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-value">
                      {batchStats.averageSize}
                    </span>
                    <span className="stat-label">Average Size</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-value">
                      {batchStats.compressionRatio}
                    </span>
                    <span className="stat-label">Compression</span>
                  </div>
                </div>

                <div className="batch-info-card">
                  <h4>Optimistic Rollup Process</h4>
                  <ol className="process-steps">
                    <li>
                      <strong>L2 Transaction Submission</strong>
                      <p>
                          Weather data and computational tasks are submitted to
                          the L2 chain
                      </p>
                    </li>
                    <li>
                      <strong>Batch Aggregation</strong>
                      <p>
                          Multiple transactions are aggregated into a single
                          batch
                      </p>
                    </li>
                    <li>
                      <strong>State Computation</strong>
                      <p>
                          The sequencer computes the new state after applying
                          transactions
                      </p>
                    </li>
                    <li>
                      <strong>L1 Data Posting</strong>
                      <p>
                          Transaction data is compressed and posted to L1 as
                          calldata
                      </p>
                    </li>
                    <li>
                      <strong>Fault Proving Period</strong>
                      <p>
                          A 7-day window where invalid state transitions can be
                          challenged
                      </p>
                    </li>
                    <li>
                      <strong>Finalization</strong>
                      <p>
                          After the challenge period, the state transition is
                          finalized
                      </p>
                    </li>
                  </ol>
                </div>

                <div className="batch-stats-detail">
                  <h4>Additional Information</h4>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-label">Finality Time:</span>
                      <span className="stat-value">
                        {batchStats.finality}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Data Availability:</span>
                      <span className="stat-value">
                        {batchStats.dataAvailability}
                      </span>
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
          <div className="cross-domain-info">
            <h4>L1 ↔ L2 Communication</h4>
            <p>
                Optimism enables secure communication between Wrfcoin's L1
                blockchain and the L2 rollup chain. This allows computational
                NFTs and weather data to seamlessly move between layers.
            </p>

            <div className="messaging-diagram">
              <div className="diagram-l1">
                <h5>Layer 1 (Wrfcoin)</h5>
                <div className="diagram-box">
                  <i className="bi bi-database"></i>
                  <span>Base Security</span>
                  <span>Data Availability</span>
                  <span>Cross-Chain Bridge</span>
                </div>
              </div>

              <div className="diagram-arrows">
                <div className="arrow-down">
                  <i className="bi bi-arrow-down"></i>
                  <span>L1 → L2 Message</span>
                  <span>~1-2 min</span>
                </div>
                <div className="arrow-up">
                  <i className="bi bi-arrow-up"></i>
                  <span>L2 → L1 Message</span>
                  <span>~7 days*</span>
                </div>
              </div>

              <div className="diagram-l2">
                <h5>Layer 2 (Optimism)</h5>
                <div className="diagram-box">
                  <i className="bi bi-lightning"></i>
                  <span>High Throughput</span>
                  <span>Low Fees</span>
                  <span>EVM Compatible</span>
                </div>
              </div>
            </div>

            <p>
              <small>* Can be expedited with specialized verification</small>
            </p>

            <h4 className="mt-4">Message Types</h4>
            <div className="message-types">
              <div className="message-type-card">
                <div className="message-type-header">
                  <h5>Weather Data Updates</h5>
                </div>
                <p>
                    High-frequency weather data updates processed on L2, with
                    verified summaries posted to L1 for long-term storage.
                </p>
                <div className="message-type-stats">
                  <span>Storage Savings: ~98%</span>
                  <span>Update Frequency: 5 min</span>
                </div>
              </div>

              <div className="message-type-card">
                <div className="message-type-header">
                  <h5>Computational Tasks</h5>
                </div>
                <p>
                    Complex simulation tasks initiated on L1, computed on L2 for
                    cost efficiency, with results and proofs returned to L1.
                </p>
                <div className="message-type-stats">
                  <span>Fee Reduction: ~94%</span>
                  <span>Computation Time: Variable</span>
                </div>
              </div>

              <div className="message-type-card">
                <div className="message-type-header">
                  <h5>NFT Cross-Layer Transfer</h5>
                </div>
                <p>
                    Computational NFTs can be moved between L1 and L2 to
                    optimize for either security or usability as needed.
                </p>
                <div className="message-type-stats">
                  <span>L1→L2: ~2 min</span>
                  <span>L2→L1: ~7 days</span>
                </div>
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
        <ul className="integration-nav-list">
          <li
            className={`integration-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="bi bi-info-circle"></i> Overview
          </li>
          <li
            className={`integration-nav-item ${activeTab === 'rollup-status' ? 'active' : ''}`}
            onClick={() => setActiveTab('rollup-status')}
          >
            <i className="bi bi-layers"></i> Rollup Status
          </li>
          <li
            className={`integration-nav-item ${activeTab === 'batch-processing' ? 'active' : ''}`}
            onClick={() => setActiveTab('batch-processing')}
          >
            <i className="bi bi-collection"></i> Batch Processing
          </li>
          <li
            className={`integration-nav-item ${activeTab === 'cross-domain' ? 'active' : ''}`}
            onClick={() => setActiveTab('cross-domain')}
          >
            <i className="bi bi-arrow-left-right"></i> Cross-Domain
          </li>
        </ul>
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

export default OptimismCard;
