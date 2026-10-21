import React, { useState, useEffect } from 'react';

import axios from 'axios';

import './Settings.css';
import { devLog } from '../../utils/logger';
import DemoSurfaceGate from '../common/DemoSurfaceGate';

// frontend#352: in the demo build this sample's actions are disabled; none of
// them reached a backend, and several reported success after a timer.
const SAMPLE_ACTION = 'Sample only: no module is restarted or toggled.';

const ModuleManagementPageSample = () => {
  const [modules, setModules] = useState({
    servers: [
      {
        id: 'api-server',
        name: 'API Server',
        port: 5001,
        status: 'running',
        enabled: true,
      },
      {
        id: 'compute-networks',
        name: 'Compute Networks Server',
        port: 5002,
        status: 'running',
        enabled: true,
      },
      {
        id: 'storage-networks',
        name: 'Storage Networks Server',
        port: 5004,
        status: 'running',
        enabled: true,
      },
      {
        id: 'iot-sensor-networks',
        name: 'IoT Sensor Networks',
        port: 5006,
        status: 'running',
        enabled: true,
      },
      {
        id: 'cross-chain-protocol',
        name: 'Cross-Chain Protocol Server',
        port: 5003,
        status: 'stopped',
        enabled: false,
      },
      {
        id: 'wvm-dashboard',
        name: 'WVM Dashboard Server',
        port: 5007,
        status: 'stopped',
        enabled: false,
      },
      {
        id: 'websocket-server',
        name: 'WebSocket Server',
        port: 8080,
        status: 'stopped',
        enabled: false,
      },
    ],
    databases: [
      {
        id: 'postgresql',
        name: 'PostgreSQL Database',
        status: 'running',
        enabled: true,
      },
      {
        id: 'governance-db',
        name: 'Governance Database',
        status: 'ready',
        enabled: true,
      },
      {
        id: 'wolfram-db',
        name: 'Wolfram Database',
        status: 'ready',
        enabled: false,
      },
    ],
    workflows: [
      {
        id: 'mainnet-mode',
        name: 'Mainnet Mode',
        status: 'stopped',
        enabled: false,
      },
      {
        id: 'enhanced-testnet',
        name: 'Enhanced Testnet',
        status: 'stopped',
        enabled: false,
      },
      {
        id: 'seed-achievements',
        name: 'Seed Achievements',
        status: 'ready',
        enabled: true,
      },
      {
        id: 'seed-governance',
        name: 'Seed Governance',
        status: 'ready',
        enabled: true,
      },
      {
        id: 'seed-validators',
        name: 'Seed Validators',
        status: 'ready',
        enabled: true,
      },
    ],
  });

  const [systemMetrics, setSystemMetrics] = useState({
    totalMemoryUsage: '2.4 GB',
    cpuUsage: '45%',
    networkConnections: 127,
    activeWorkflows: 8,
    databaseConnections: 12,
  });

  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    fetchModuleStatus();
    const interval = setInterval(fetchModuleStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchModuleStatus = async () => {
    try {
      // In a real implementation, this would fetch from your module management API
      // For now, we'll simulate the data structure
      devLog('Fetching module status...');
    } catch (error) {
      console.error('Failed to fetch module status:', error);
    }
  };

  const handleModuleToggle = async (category, moduleId) => {
    setLoading(true);
    try {
      const module = modules[category].find(m => m.id === moduleId);
      const newStatus = module.enabled ? 'stopped' : 'running';

      // Update local state
      setModules(prev => ({
        ...prev,
        [category]: prev[category].map(m =>
          m.id === moduleId
            ? { ...m, enabled: !m.enabled, status: newStatus }
            : m,
        ),
      }));

      setSnackbar({
        open: true,
        message: `${module.name} ${module.enabled ? 'stopped' : 'started'} successfully`,
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to toggle ${moduleId}`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestartModule = async (category, moduleId) => {
    setLoading(true);
    try {
      const module = modules[category].find(m => m.id === moduleId);

      // Simulate restart process
      setModules(prev => ({
        ...prev,
        [category]: prev[category].map(m =>
          m.id === moduleId ? { ...m, status: 'restarting' } : m,
        ),
      }));

      // After 2 seconds, mark as running
      setTimeout(() => {
        setModules(prev => ({
          ...prev,
          [category]: prev[category].map(m =>
            m.id === moduleId ? { ...m, status: 'running' } : m,
          ),
        }));
      }, 2000);

      setSnackbar({
        open: true,
        message: `${module.name} restarted successfully`,
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to restart ${moduleId}`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestartAll = async () => {
    setLoading(true);
    try {
      setSnackbar({
        open: true,
        message: 'Restarting all enabled modules...',
        severity: 'info',
      });

      // Simulate restart all process
      setTimeout(() => {
        setSnackbar({
          open: true,
          message: 'All modules restarted successfully',
          severity: 'success',
        });
        setLoading(false);
      }, 3000);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to restart all modules',
        severity: 'error',
      });
      setLoading(false);
    }
  };

  const getStatusColor = status => {
    switch (status) {
    case 'running':
      return '#4caf50';
    case 'stopped':
      return '#f44336';
    case 'restarting':
      return '#ff9800';
    case 'ready':
      return '#2196f3';
    default:
      return '#9e9e9e';
    }
  };

  const renderModuleCategory = (title, category, items) => (
    <div className="settings-section" key={category}>
      <div className="settings-section-header">
        <h3>{title}</h3>
        <div className="category-actions">
          <button
            className="btn-restart-category"
            disabled title={SAMPLE_ACTION}
          >
            Restart All
          </button>
        </div>
      </div>

      <div className="module-management-grid">
        <table className="module-table">
          <thead className="module-table-header">
            <tr>
              <th>Module</th>
              <th>Status</th>
              <th>Port/Info</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr className="module-row" key={item.id}>
                <td className="module-title-cell">
                  <div className="module-title">{item.name}</div>
                </td>
                <td className="module-status-cell">
                  <div className="status-text">
                    <span
                      className="status-indicator"
                      style={{ backgroundColor: getStatusColor(item.status) }}
                    ></span>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </div>
                </td>
                <td className="module-info-cell">
                  {item.port ? `Port ${item.port}` : 'System Service'}
                </td>
                <td className="module-actions-cell">
                  <div className="module-actions">
                    <button
                      className="action-btn configure-btn"
                      disabled
                      title={SAMPLE_ACTION}
                    >
                      Configure
                    </button>
                    <button
                      className="action-btn restart-btn"
                      disabled title={SAMPLE_ACTION}
                    >
                      Restart
                    </button>
                    <button
                      className={`action-btn toggle-btn ${item.enabled ? 'disable-btn' : 'enable-btn'}`}
                      disabled title={SAMPLE_ACTION}
                    >
                      {item.enabled ? 'Stop' : 'Start'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="settings-content">
      <div className="settings-section">
        <h2>
          <i className="bi bi-gear-wide-connected"></i> Module Management
        </h2>
        <p className="settings-description">
          Control and monitor all system modules, servers, and workflows. Manage
          your node's architecture and ensure optimal performance across all
          components.
        </p>

        {/* System Metrics Overview */}
        <div className="system-metrics-overview">
          <h3>System Overview</h3>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">Memory Usage</div>
              <div className="metric-value">
                {systemMetrics.totalMemoryUsage}
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-label">CPU Usage</div>
              <div className="metric-value">{systemMetrics.cpuUsage}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Network Connections</div>
              <div className="metric-value">
                {systemMetrics.networkConnections}
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Active Workflows</div>
              <div className="metric-value">
                {systemMetrics.activeWorkflows}
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-label">DB Connections</div>
              <div className="metric-value">
                {systemMetrics.databaseConnections}
              </div>
            </div>
          </div>
        </div>

        {/* Module Categories */}
        {renderModuleCategory('Backend Servers', 'servers', modules.servers)}
        {renderModuleCategory(
          'Database Services',
          'databases',
          modules.databases,
        )}
        {renderModuleCategory(
          'System Workflows',
          'workflows',
          modules.workflows,
        )}

        {/* Global Actions */}
        <div className="settings-section">
          <h3>Global Actions</h3>
          <div className="global-actions-grid">
            <button
              className="global-action-btn restart-all-btn"
              disabled title={SAMPLE_ACTION}
            >
              <i className="bi bi-arrow-clockwise"></i>
              Restart All Services
            </button>
            <button className="global-action-btn backup-btn" disabled title={SAMPLE_ACTION}>
              <i className="bi bi-cloud-download"></i>
              Backup Configuration
            </button>
            <button
              className="global-action-btn maintenance-btn"
              disabled
              title={SAMPLE_ACTION}
            >
              <i className="bi bi-tools"></i>
              Maintenance Mode
            </button>
            <button
              className="global-action-btn health-check-btn"
              disabled
              title={SAMPLE_ACTION}
            >
              <i className="bi bi-heart-pulse"></i>
              Health Check
            </button>
          </div>
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
const ModuleManagementPage = () => (
  <DemoSurfaceGate
    title="Module management is not live"
    description="No backend route lists or restarts platform modules; nothing here controls a running service."
    testId="module-management"
  >
    <ModuleManagementPageSample />
  </DemoSurfaceGate>
);

export default ModuleManagementPage;
