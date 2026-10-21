import React, { useState, useEffect } from 'react';
import useWebSocket from '../../hooks/useWebSocket';
import NetworkVisualization3D from './NetworkVisualization3D';
import './NetworkHealthMonitor.css';

/**
 * Network Health Monitor Component
 *
 * Displays comprehensive health metrics and visualization for the Wrfcoin network
 */
const NetworkHealthMonitor = () => {
  const [healthMetrics, setHealthMetrics] = useState({
    networkHashrate: 0,
    blockHeight: 0,
    difficulty: 0,
    activeNodes: 0,
    networkLatency: 0,
    transactionsPerSecond: 0,
    pendingTransactions: 0,
    networkEfficiency: 0,
  });

  const { status, data } = useWebSocket({
    channels: ['blocks', 'governance'],
    onMessage: (event, eventData) => {
      if (event === 'STATE_UPDATE') {
        handleStateUpdate(eventData);
      } else if (event === 'NETWORK_HEALTH') {
        handleNetworkHealthUpdate(eventData);
      }
    },
  });

  // Handle blockchain state updates
  const handleStateUpdate = data => {
    if (data && data.state) {
      const { blockHeight, hashrate, difficulty, pendingTransactions } =
        data.state;

      setHealthMetrics(prev => ({
        ...prev,
        blockHeight,
        networkHashrate: hashrate,
        difficulty,
        pendingTransactions,
      }));
    }
  };

  // Handle network health updates
  const handleNetworkHealthUpdate = data => {
    if (data) {
      const {
        activeNodes,
        networkLatency,
        transactionsPerSecond,
        networkEfficiency,
      } = data;

      setHealthMetrics(prev => ({
        ...prev,
        activeNodes: activeNodes || prev.activeNodes,
        networkLatency: networkLatency || prev.networkLatency,
        transactionsPerSecond:
          transactionsPerSecond || prev.transactionsPerSecond,
        networkEfficiency: networkEfficiency || prev.networkEfficiency,
      }));
    }
  };

  // Calculate health status based on metrics
  const getHealthStatus = () => {
    const { networkLatency, networkEfficiency } = healthMetrics;

    if (networkLatency < 100 && networkEfficiency > 0.8) {
      return 'excellent';
    } else if (networkLatency < 200 && networkEfficiency > 0.6) {
      return 'good';
    } else if (networkLatency < 500 && networkEfficiency > 0.4) {
      return 'fair';
    } else {
      return 'poor';
    }
  };


  return (
    <div className="network-health-monitor">
      <div className="network-health-header">
        <h1>Network Health Monitor</h1>
        <div className={`connection-indicator ${status}`}>
          {status === 'connected' ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      <div className="health-overview">
        <div className="health-status-card">
          <h2>Network Status</h2>
          <div className={`health-status ${getHealthStatus()}`}>
            <span className="status-indicator"></span>
            <span className="status-text">
              {getHealthStatus().charAt(0).toUpperCase() +
                getHealthStatus().slice(1)}
            </span>
          </div>
        </div>

        <div className="metrics-grid">
          <div className="metric-card">
            <h3>Network Hashrate</h3>
            <div className="metric-value">
              {healthMetrics.networkHashrate} H/s
            </div>
          </div>
          <div className="metric-card">
            <h3>Block Height</h3>
            <div className="metric-value">{healthMetrics.blockHeight}</div>
          </div>
          <div className="metric-card">
            <h3>Difficulty</h3>
            <div className="metric-value">{healthMetrics.difficulty}</div>
          </div>
          <div className="metric-card">
            <h3>Active Nodes</h3>
            <div className="metric-value">{healthMetrics.activeNodes}</div>
          </div>
          <div className="metric-card">
            <h3>Network Latency</h3>
            <div className="metric-value">
              {healthMetrics.networkLatency} ms
            </div>
          </div>
          <div className="metric-card">
            <h3>Transactions/Second</h3>
            <div className="metric-value">
              {healthMetrics.transactionsPerSecond}
            </div>
          </div>
          <div className="metric-card">
            <h3>Pending Transactions</h3>
            <div className="metric-value">
              {healthMetrics.pendingTransactions}
            </div>
          </div>
          <div className="metric-card">
            <h3>Network Efficiency</h3>
            <div className="metric-value">
              {(healthMetrics.networkEfficiency * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      <div className="network-visualization">
        <NetworkVisualization3D />
      </div>
    </div>
  );
};

export default NetworkHealthMonitor;
