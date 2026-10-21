import React, { useState, useEffect } from 'react';
import DemoSurfaceGate from '../common/DemoSurfaceGate';
import { Radar, Bar, Pie } from 'react-chartjs-2';
import './ShardingDashboard.css';
import blockchainService from '../../services/blockchainService';
import { getWebSocketClient } from '../../services/websocketService';
import PageTitle from '../common/PageTitle';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
} from 'chart.js';
import { devLog } from '../../utils/logger';

// Register the ChartJS components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
);

const ShardingDashboardSample = () => {
  // State for sharding metrics
  const [shards, setShards] = useState([]);
  const [shardMetrics, setShardMetrics] = useState({});
  const [crossShardTransactions, setCrossShardTransactions] = useState([]);
  const [shardDistribution, setShardDistribution] = useState({});
  const [selectedShard, setSelectedShard] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for development (will be replaced with real data)
  useEffect(() => {
    // Simulate loading data from API
    const loadData = async () => {
      setIsLoading(true);
      try {
        // This will be replaced with actual API calls when backend is ready
        // For now, using mock data for demonstration

        // Generate shard data
        const mockShards = [
          {
            id: 1,
            name: 'Weather-NA',
            type: 'Geographic',
            region: 'North America',
            nodeCount: 12,
            txCount: 1254,
          },
          {
            id: 2,
            name: 'Weather-EU',
            type: 'Geographic',
            region: 'Europe',
            nodeCount: 14,
            txCount: 1089,
          },
          {
            id: 3,
            name: 'Weather-APAC',
            type: 'Geographic',
            region: 'Asia Pacific',
            nodeCount: 18,
            txCount: 1642,
          },
          {
            id: 4,
            name: 'Traffic-1H',
            type: 'Temporal',
            timeRange: '0-1 Hour',
            nodeCount: 8,
            txCount: 876,
          },
          {
            id: 5,
            name: 'Traffic-24H',
            type: 'Temporal',
            timeRange: '1-24 Hours',
            nodeCount: 10,
            txCount: 1423,
          },
          {
            id: 6,
            name: 'Computational-1',
            type: 'Computational',
            complexity: 'High',
            nodeCount: 22,
            txCount: 342,
          },
          {
            id: 7,
            name: 'Computational-2',
            type: 'Computational',
            complexity: 'Medium',
            nodeCount: 15,
            txCount: 753,
          },
          {
            id: 8,
            name: 'General-1',
            type: 'General',
            nodeCount: 30,
            txCount: 3421,
          },
        ];

        setShards(mockShards);

        // Generate shard metrics
        const mockMetrics = {
          totalShards: mockShards.length,
          activeShards: mockShards.length - 1,
          totalNodes: mockShards.reduce(
            (acc, shard) => acc + shard.nodeCount,
            0,
          ),
          avgLatency: 120, // milliseconds
          crossShardTPS: 42.5,
          rebalanceEvents: 3,
        };

        setShardMetrics(mockMetrics);

        // Generate cross-shard transactions
        const mockCrossShardTxs = [
          {
            id: 'tx1',
            sourceShardId: 1,
            targetShardId: 8,
            status: 'Completed',
            latency: 135,
            timestamp: Date.now() - 30000,
          },
          {
            id: 'tx2',
            sourceShardId: 3,
            targetShardId: 6,
            status: 'Pending',
            latency: null,
            timestamp: Date.now() - 15000,
          },
          {
            id: 'tx3',
            sourceShardId: 6,
            targetShardId: 2,
            status: 'Completed',
            latency: 142,
            timestamp: Date.now() - 120000,
          },
          {
            id: 'tx4',
            sourceShardId: 8,
            targetShardId: 4,
            status: 'Failed',
            latency: null,
            timestamp: Date.now() - 180000,
          },
          {
            id: 'tx5',
            sourceShardId: 2,
            targetShardId: 7,
            status: 'Completed',
            latency: 128,
            timestamp: Date.now() - 240000,
          },
        ];

        setCrossShardTransactions(mockCrossShardTxs);

        // Generate shard distribution data
        const mockDistribution = {
          labels: ['Weather', 'Traffic', 'Computational', 'General'],
          datasets: [
            {
              label: 'Shard Distribution',
              data: [3, 2, 2, 1],
              backgroundColor: [
                'rgba(54, 162, 235, 0.5)',
                'rgba(255, 206, 86, 0.5)',
                'rgba(153, 102, 255, 0.5)',
                'rgba(255, 159, 64, 0.5)',
              ],
              borderColor: [
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)',
              ],
              borderWidth: 1,
            },
          ],
        };

        setShardDistribution(mockDistribution);

        // Generate verification status
        const mockVerification = {
          totalVerified: 2451,
          pendingVerification: 124,
          failedVerification: 17,
          verificationRate: 98.6, // percentage
        };

        setVerificationStatus(mockVerification);
      } catch (error) {
        console.error('Error loading shard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Get WebSocket client and subscribe to events
    const wsClient = getWebSocketClient();

    // core4 valid channels: blocks, governance, wallet:<addr>, rewards:<id>
    wsClient.addChannels(['blocks']);

    // Subscribe to websocket events for real-time updates
    const handleShardUpdate = data => {
      if (data) {
        // Update shard info when receiving websocket events
        devLog('Received shard update:', data);

        // This will be updated when the backend sends real data
        // For now, we'll just refresh the data on update
        loadData();
      }
    };

    // Register event listeners
    const unsubscribe = wsClient.on('SHARD_UPDATE', handleShardUpdate);

    return () => {
      // Clean up websocket subscription
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Shard radar chart data
  const radarChartData = {
    labels: shards.map(shard => shard.name),
    datasets: [
      {
        label: 'Node Count',
        data: shards.map(shard => shard.nodeCount),
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgb(54, 162, 235)',
        pointBackgroundColor: 'rgb(54, 162, 235)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(54, 162, 235)',
      },
      {
        label: 'Transaction Count (÷100)',
        data: shards.map(shard => shard.txCount / 100),
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgb(255, 99, 132)',
        pointBackgroundColor: 'rgb(255, 99, 132)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(255, 99, 132)',
      },
    ],
  };

  // Cross-shard transaction bar chart data
  const barChartData = {
    labels: ['Completed', 'Pending', 'Failed'],
    datasets: [
      {
        label: 'Cross-shard Transaction Status',
        data: [
          crossShardTransactions.filter(tx => tx.status === 'Completed').length,
          crossShardTransactions.filter(tx => tx.status === 'Pending').length,
          crossShardTransactions.filter(tx => tx.status === 'Failed').length,
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(255, 99, 132, 0.5)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Chart options for better responsiveness
  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
        },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  // Handle shard selection
  const handleShardSelect = shardId => {
    const selected = shards.find(shard => shard.id === shardId);
    setSelectedShard(selected);
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="sharding-dashboard-container full-width-container">
        <PageTitle
          title="Sharding Dashboard"
          subtitle="Monitor and manage Wrfcoin's shard network"
        />
        <div className="loading-indicator">Loading sharding data...</div>
      </div>
    );
  }

  return (
    <div className="sharding-dashboard-container full-width-container">
      <PageTitle
        title="Sharding Dashboard"
        subtitle="Monitor and manage Wrfcoin's shard network"
        stats={{
          'Total Shards': shardMetrics.totalShards,
          'Active Shards': shardMetrics.activeShards,
          'Total Nodes': shardMetrics.totalNodes,
          'Cross-Shard TPS': shardMetrics.crossShardTPS,
        }}
      />

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Total Shards</h3>
          <p className="metric-value">{shardMetrics.totalShards}</p>
        </div>
        <div className="metric-card">
          <h3>Active Shards</h3>
          <p className="metric-value">{shardMetrics.activeShards}</p>
        </div>
        <div className="metric-card">
          <h3>Total Nodes</h3>
          <p className="metric-value">{shardMetrics.totalNodes}</p>
        </div>
        <div className="metric-card">
          <h3>Avg Latency</h3>
          <p className="metric-value">{shardMetrics.avgLatency} ms</p>
        </div>
        <div className="metric-card">
          <h3>Cross-Shard TPS</h3>
          <p className="metric-value">{shardMetrics.crossShardTPS}</p>
        </div>
        <div className="metric-card">
          <h3>Rebalance Events</h3>
          <p className="metric-value">{shardMetrics.rebalanceEvents}</p>
        </div>
      </div>

      {/* Shard Visualization */}
      <div className="chart-container">
        <div className="chart-wrapper">
          <h3>Shard Network Overview</h3>
          <div>
            <Radar data={radarChartData} options={radarOptions} />
          </div>
        </div>
        <div className="chart-wrapper">
          <h3>Shard Type Distribution</h3>
          <div>
            <Pie data={shardDistribution} options={pieOptions} />
          </div>
        </div>
      </div>

      {/* Cross-Shard Transactions */}
      <div className="cross-shard-container">
        <h3>Cross-Shard Transaction Verification</h3>
        <div className="cross-shard-status">
          <Bar data={barChartData} options={barOptions} />
        </div>

        <div className="verification-metrics">
          <div className="verification-card">
            <h4>Total Verified</h4>
            <p>{verificationStatus.totalVerified}</p>
          </div>
          <div className="verification-card">
            <h4>Pending</h4>
            <p>{verificationStatus.pendingVerification}</p>
          </div>
          <div className="verification-card">
            <h4>Failed</h4>
            <p>{verificationStatus.failedVerification}</p>
          </div>
          <div className="verification-card">
            <h4>Success Rate</h4>
            <p>{verificationStatus.verificationRate}%</p>
          </div>
        </div>
      </div>

      {/* Shard List */}
      <div className="shard-list-container">
        <h3>Active Shards</h3>
        <div className="shard-list">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Region/Range</th>
                <th>Nodes</th>
                <th>Transactions</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {shards.map(shard => (
                <tr key={shard.id}>
                  <td>{shard.id}</td>
                  <td>{shard.name}</td>
                  <td>{shard.type}</td>
                  <td>{shard.region || shard.timeRange || '-'}</td>
                  <td>{shard.nodeCount}</td>
                  <td>{shard.txCount}</td>
                  <td>
                    <button
                      className="view-shard-btn"
                      onClick={() => handleShardSelect(shard.id)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cross-Shard Transaction List */}
      <div className="cross-shard-tx-container">
        <h3>Recent Cross-Shard Transactions</h3>
        <div className="cross-shard-tx-list">
          <table>
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Source Shard</th>
                <th>Target Shard</th>
                <th>Status</th>
                <th>Latency</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {crossShardTransactions.map(tx => (
                <tr key={tx.id} className={`status-${tx.status.toLowerCase()}`}>
                  <td>{tx.id}</td>
                  <td>
                    {shards.find(s => s.id === tx.sourceShardId)?.name ||
                      tx.sourceShardId}
                  </td>
                  <td>
                    {shards.find(s => s.id === tx.targetShardId)?.name ||
                      tx.targetShardId}
                  </td>
                  <td>{tx.status}</td>
                  <td>{tx.latency ? `${tx.latency} ms` : '-'}</td>
                  <td>{new Date(tx.timestamp).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Shard Details */}
      {selectedShard && (
        <div className="selected-shard-details">
          <h3>Shard Details: {selectedShard.name}</h3>
          <div className="shard-details-grid">
            <div className="detail-card">
              <h4>Type</h4>
              <p>{selectedShard.type}</p>
            </div>
            <div className="detail-card">
              <h4>Region/Range</h4>
              <p>{selectedShard.region || selectedShard.timeRange || '-'}</p>
            </div>
            <div className="detail-card">
              <h4>Node Count</h4>
              <p>{selectedShard.nodeCount}</p>
            </div>
            <div className="detail-card">
              <h4>Transaction Count</h4>
              <p>{selectedShard.txCount}</p>
            </div>
            <div className="detail-card">
              <h4>Transaction Rate</h4>
              <p>{Math.round(selectedShard.txCount / 24)} tx/hr</p>
            </div>
            <div className="detail-card">
              <h4>Avg Block Time</h4>
              <p>{Math.round(3600 / (selectedShard.txCount / 24))} sec</p>
            </div>
          </div>
          <button className="close-btn" onClick={() => setSelectedShard(null)}>
            Close
          </button>
        </div>
      )}
    </div>
  );
};

// frontend#328: every figure in ShardingDashboardSample is hard-coded or random; nothing
// on the testnet API backs it. Default build: honest not-live, sample never
// mounted. Demo surfaces: sample under a "Sample data" chip.
const ShardingDashboard = (props) => (
  <DemoSurfaceGate
    title="Sharding metrics are not live on the testnet yet"
    description="No sharding route is mounted on the testnet API (shardingRoutes.ts exists but is unmounted); the shard list and metrics in the preview are hard-coded."
    testId="sharding-dashboard"
  >
    <ShardingDashboardSample {...props} />
  </DemoSurfaceGate>
);

export default ShardingDashboard;
