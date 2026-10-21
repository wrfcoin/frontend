import DemoSurfaceGate from '../common/DemoSurfaceGate';
import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

import './IntegrationsHub.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

const BacalhauPanelSample = ({ status = 'testnet' }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [networkStatus, setNetworkStatus] = useState({
    status: 'healthy',
    version: '0.3.17',
    nodeCount: 4,
    activeJobs: 39,
    completedJobs24h: 106,
    totalComputeHours24h: 852,
  });
  const [computeNodes, setComputeNodes] = useState([
    {
      id: 'node1',
      name: 'Bacalhau Compute Node Alpha',
      region: 'us-west',
      status: 'ACTIVE',
      reliability: 0.998,
      availableCPU: 16,
      availableGPU: 1,
      availableMemory: 32768,
      jobsCompleted: 53,
    },
    {
      id: 'node2',
      name: 'Bacalhau Compute Node Beta',
      region: 'eu-central',
      status: 'ACTIVE',
      reliability: 0.995,
      availableCPU: 32,
      availableGPU: 2,
      availableMemory: 65536,
      jobsCompleted: 87,
    },
    {
      id: 'node3',
      name: 'Bacalhau Compute Node Gamma',
      region: 'asia-east',
      status: 'MAINTENANCE',
      reliability: 0.992,
      availableCPU: 8,
      availableGPU: 0,
      availableMemory: 16384,
      jobsCompleted: 41,
    },
    {
      id: 'node4',
      name: 'Bacalhau Compute Node Delta',
      region: 'us-east',
      status: 'ACTIVE',
      reliability: 0.997,
      availableCPU: 24,
      availableGPU: 1,
      availableMemory: 49152,
      jobsCompleted: 69,
    },
  ]);
  const [availableModels, setAvailableModels] = useState([
    {
      id: 'model1',
      name: 'WRF Weather Model',
      type: 'Weather Forecasting',
      description:
        'Weather Research and Forecasting Model for high-resolution forecasting',
      inputFormat: 'NetCDF',
      outputFormat: 'NetCDF, JSON',
      requiresGPU: false,
    },
    {
      id: 'model2',
      name: 'CMAQ Air Quality Model',
      type: 'Air Quality Analysis',
      description: 'Community Multiscale Air Quality Modeling System',
      inputFormat: 'CSV, NetCDF',
      outputFormat: 'NetCDF, CSV, JSON',
      requiresGPU: false,
    },
    {
      id: 'model3',
      name: 'CESM Climate Model',
      type: 'Climate Simulation',
      description: 'Community Earth System Model for climate simulations',
      inputFormat: 'NetCDF',
      outputFormat: 'NetCDF, HDF5',
      requiresGPU: true,
    },
    {
      id: 'model4',
      name: 'CAMx Air Model',
      type: 'Air Quality Analysis',
      description: 'Comprehensive Air Quality Model with extensions',
      inputFormat: 'CSV, HDF5',
      outputFormat: 'CSV, HDF5, JSON',
      requiresGPU: false,
    },
    {
      id: 'model5',
      name: 'MPAS Weather Model',
      type: 'Weather Forecasting',
      description:
        'Model for Prediction Across Scales for global weather prediction',
      inputFormat: 'NetCDF, GRIB',
      outputFormat: 'NetCDF, GRIB, JSON',
      requiresGPU: true,
    },
  ]);
  const [jobHistory, setJobHistory] = useState([
    {
      id: 'bacalhau-4ug77udd',
      name: 'Test Weather Forecast Job',
      status: 'COMPLETED',
      createdAt: '2025-05-15T19:47:19.675Z',
      duration: 3336,
    },
    {
      id: 'bacalhau-dwj53vxv',
      name: 'Weather Forecast - global',
      status: 'COMPLETED',
      createdAt: '2025-05-15T19:47:23.183Z',
      duration: 984,
    },
    {
      id: 'bacalhau-3vzoj5ib',
      name: 'Air Quality Model - urban',
      status: 'COMPLETED',
      createdAt: '2025-05-15T19:47:23.183Z',
      duration: 1733,
    },
    {
      id: 'bacalhau-wz2p03dr',
      name: 'Climate Simulation - rcp45',
      status: 'COMPLETED',
      createdAt: '2025-05-15T19:47:23.184Z',
      duration: 4184,
    },
  ]);
  const [activeTab, setActiveTab] = useState(0);

  // Use the status prop directly
  const governanceStatus = status;
  const isEnabled = status === 'on' || status === 'testnet';

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!isEnabled) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch network status
        const statusResponse = await fetch('/api/bacalhau/status');
        if (!statusResponse.ok) {
          throw new Error('Failed to fetch Bacalhau network status');
        }
        const statusData = await statusResponse.json();
        setNetworkStatus(statusData);

        // Fetch compute nodes
        const nodesResponse = await fetch('/api/bacalhau/nodes');
        if (!nodesResponse.ok) {
          throw new Error('Failed to fetch Bacalhau compute nodes');
        }
        const nodesData = await nodesResponse.json();
        setComputeNodes(nodesData.nodes || []);

        // Fetch available models
        const modelsResponse = await fetch('/api/bacalhau/models');
        if (!modelsResponse.ok) {
          throw new Error('Failed to fetch Bacalhau models');
        }
        const modelsData = await modelsResponse.json();
        setAvailableModels(modelsData.models || []);

        // Fetch job history
        const historyResponse = await fetch(
          '/api/bacalhau/history/wrfcoin-node',
        );
        if (!historyResponse.ok) {
          throw new Error('Failed to fetch Bacalhau job history');
        }
        const historyData = await historyResponse.json();
        setJobHistory(historyData.jobs || []);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching Bacalhau data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [isEnabled]);

  // Handle tab change
  const handleTabChange = index => {
    setActiveTab(index);
  };

  // Generate chart data
  const chartData = {
    labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6'],
    datasets: [
      {
        label: 'Computational Jobs',
        data: [65, 78, 90, 81, 56, 85],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Computational Performance',
      },
    },
  };

  // If Bacalhau integration is disabled
  if (!isEnabled) {
    return (
      <div className="integration-detail">
        <div className="integration-header">
          <i className="bi bi-cpu"></i>
          <div className="integration-header-content">
            <h2>Bacalhau Distributed Computation</h2>
            <p>
              Decentralized computation network for weather, climate, and
              environmental models
            </p>
          </div>
        </div>

        <div className="alert-message info">
          <i className="bi bi-info-circle"></i>
          <span>
            Bacalhau integration is currently disabled. Please enable it in the
            Integration Governance settings.
          </span>
        </div>
      </div>
    );
  }

  // If loading
  if (loading && !networkStatus) {
    return (
      <div className="integration-detail">
        <div className="integration-header">
          <i className="bi bi-cpu"></i>
          <div className="integration-header-content">
            <h2>Bacalhau Distributed Computation</h2>
            <p>
              Decentralized computation network for weather, climate, and
              environmental models
            </p>
          </div>
        </div>

        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  // If error
  if (error && !networkStatus) {
    return (
      <div className="integration-detail">
        <div className="integration-header">
          <i className="bi bi-cpu"></i>
          <div className="integration-header-content">
            <h2>Bacalhau Distributed Computation</h2>
            <p>
              Decentralized computation network for weather, climate, and
              environmental models
            </p>
          </div>
        </div>

        <div className="alert-message error">
          <i className="bi bi-exclamation-triangle"></i>
          <span>Error loading Bacalhau data: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="integration-detail">
      <div className="integration-header">
        <i className="bi bi-cpu"></i>
        <div className="integration-header-content">
          <h2>Bacalhau Distributed Computation</h2>
          <p>
            Decentralized computation network for weather, climate, and
            environmental models
          </p>
        </div>
      </div>

      <div
        className={`status-alert ${networkStatus?.status === 'healthy' ? 'success' : 'warning'}`}
      >
        <i
          className={`bi ${networkStatus?.status === 'healthy' ? 'bi-check-circle' : 'bi-exclamation-triangle'}`}
        ></i>
        <span>
          Network is {networkStatus?.status || 'unknown'} on {status}
          {networkStatus?.version && ` (v${networkStatus.version})`}
        </span>
      </div>

      <div className="network-stats-section">
        <h3>Network Statistics</h3>
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-icon">
              <i className="bi bi-hdd-network"></i>
            </div>
            <div className="stat-value">{networkStatus?.nodeCount || 0}</div>
            <div className="stat-label">Compute Nodes</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="bi bi-activity"></i>
            </div>
            <div className="stat-value">{networkStatus?.activeJobs || 0}</div>
            <div className="stat-label">Active Jobs</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="bi bi-check2-all"></i>
            </div>
            <div className="stat-value">
              {networkStatus?.completedJobs24h || 0}
            </div>
            <div className="stat-label">Completed (24h)</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="bi bi-gpu-card"></i>
            </div>
            <div className="stat-value">
              {networkStatus?.totalComputeHours24h || 0}
            </div>
            <div className="stat-label">Compute Hours</div>
          </div>
        </div>
      </div>

      <div className="integration-tabs">
        <div
          className={`tab ${activeTab === 0 ? 'active' : ''}`}
          onClick={() => handleTabChange(0)}
        >
          Available Models
        </div>
        <div
          className={`tab ${activeTab === 1 ? 'active' : ''}`}
          onClick={() => handleTabChange(1)}
        >
          Compute Nodes
        </div>
        <div
          className={`tab ${activeTab === 2 ? 'active' : ''}`}
          onClick={() => handleTabChange(2)}
        >
          Job History
        </div>
      </div>

      <div className="integration-tab-content">
        {activeTab === 0 && (
          <div className="models-container">
            <h3>Available Computational Models</h3>
            <div className="models-grid">
              {availableModels.map(model => (
                <div className="model-card" key={model.id}>
                  <div className="model-header">
                    <h4>{model.name}</h4>
                    <span className="model-tag">{model.type}</span>
                  </div>
                  <div className="model-details">
                    <p>{model.description}</p>
                    <div className="model-specs">
                      <div className="spec-item">
                        <span className="spec-label">Input:</span>
                        <span className="spec-value">{model.inputFormat}</span>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">Output:</span>
                        <span className="spec-value">{model.outputFormat}</span>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">GPU Required:</span>
                        <span className="spec-value">
                          {model.requiresGPU ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="nodes-container">
            <h3>Active Compute Nodes</h3>
            <div className="nodes-list">
              {computeNodes.map(node => (
                <div className="node-item" key={node.id}>
                  <div className="node-header">
                    <h4>{node.name}</h4>
                    <span
                      className={`node-status ${node.status.toLowerCase()}`}
                    >
                      {node.status}
                    </span>
                  </div>
                  <div className="node-details">
                    <div className="node-specs">
                      <div className="spec-item">
                        <i className="bi bi-geo-alt"></i>
                        <span>{node.region}</span>
                      </div>
                      <div className="spec-item">
                        <i className="bi bi-cpu"></i>
                        <span>{node.availableCPU} cores</span>
                      </div>
                      <div className="spec-item">
                        <i className="bi bi-gpu-card"></i>
                        <span>{node.availableGPU} units</span>
                      </div>
                      <div className="spec-item">
                        <i className="bi bi-memory"></i>
                        <span>
                          {(node.availableMemory / 1024).toFixed(1)} GB
                        </span>
                      </div>
                    </div>
                    <div className="node-stats">
                      <div className="stat-item">
                        <span className="stat-label">Reliability:</span>
                        <span className="stat-value">
                          {(node.reliability * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Jobs Completed:</span>
                        <span className="stat-value">
                          {node.jobsCompleted || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 2 && (
          <div className="history-container">
            <h3>Job History</h3>
            <div className="chart-container" style={{ height: '300px' }}>
              <Line options={chartOptions} data={chartData} />
            </div>

            <div className="job-table">
              <table>
                <thead>
                  <tr>
                    <th>Job ID</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {jobHistory.length > 0 ? (
                    jobHistory.map(job => (
                      <tr key={job.id}>
                        <td>{job.id}</td>
                        <td>{job.name}</td>
                        <td>
                          <span
                            className={`status-badge ${job.status.toLowerCase()}`}
                          >
                            {job.status}
                          </span>
                        </td>
                        <td>{new Date(job.createdAt).toLocaleString()}</td>
                        <td>
                          {job.duration
                            ? `${Math.ceil(job.duration / 60)} mins`
                            : '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="no-data">
                        No job history available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function BacalhauPanel(props) {
  return <DemoSurfaceGate testId="bacalhau-compute" title="Bacalhau compute is unavailable"
    description="The bacalhau API is not served by the testnet. Any enabled preview is illustrative.">
    <BacalhauPanelSample {...props} />
  </DemoSurfaceGate>;
}
