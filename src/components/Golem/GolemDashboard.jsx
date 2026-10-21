import DemoSurfaceGate from '../common/DemoSurfaceGate';
import React, { useState, useEffect } from 'react';
import './GolemStyles.css';

/**
 * Golem Network Dashboard Component
 *
 * This component provides a dashboard interface for the Golem Network integration
 * with Wrfcoin Core. It displays network status, available nodes,
 * and allows for task submission and management.
 */
const GolemDashboardSample = () => {
  const [networkStatus, setNetworkStatus] = useState({
    status: 'loading',
    activeProviders: 0,
    totalProviders: 0,
    cpuCores: 0,
    memoryGB: 0,
    storageGB: 0,
    gpus: 0,
  });

  const [providers, setProviders] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    // Fetch network status
    fetchNetworkStatus();

    // Fetch providers
    fetchProviders();

    // Fetch tasks
    fetchTasks();

    // Set up periodic refresh
    const refreshInterval = setInterval(() => {
      fetchNetworkStatus();
      fetchTasks();
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, []);

  const fetchNetworkStatus = async () => {
    try {
      const response = await fetch('/api/golem/status');
      if (response.ok) {
        const data = await response.json();
        setNetworkStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch Golem network status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/golem/providers');
      if (response.ok) {
        const data = await response.json();
        setProviders(Array.isArray(data.providers) ? data.providers : []);
      }
    } catch (error) {
      console.error('Failed to fetch Golem providers:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/golem/tasks');
      if (response.ok) {
        const data = await response.json();
        setTasks(Array.isArray(data.tasks) ? data.tasks : []);
      }
    } catch (error) {
      console.error('Failed to fetch Golem tasks:', error);
    }
  };

  const getStatusIndicatorClass = status => {
    switch (status) {
    case 'operational':
      return 'status-indicator-success';
    case 'degraded':
      return 'status-indicator-warning';
    case 'down':
      return 'status-indicator-error';
    default:
      return 'status-indicator-neutral';
    }
  };

  const getTaskStatusClass = status => {
    switch (status) {
    case 'COMPLETED':
      return 'task-status-completed';
    case 'RUNNING':
      return 'task-status-running';
    case 'FAILED':
      return 'task-status-failed';
    default:
      return 'task-status-pending';
    }
  };

  return (
    <div className="golem-dashboard">
      <h1>Golem Network</h1>

      <div className="dashboard-tabs">
        <button
          className={`tab-button ${selectedTab === 'overview' ? 'active' : ''}`}
          onClick={() => setSelectedTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-button ${selectedTab === 'providers' ? 'active' : ''}`}
          onClick={() => setSelectedTab('providers')}
        >
          Providers
        </button>
        <button
          className={`tab-button ${selectedTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setSelectedTab('tasks')}
        >
          Tasks
        </button>
        <button
          className={`tab-button ${selectedTab === 'submit' ? 'active' : ''}`}
          onClick={() => setSelectedTab('submit')}
        >
          Submit Task
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : (
        <>
          {selectedTab === 'overview' && (
            <div className="network-overview">
              <div className="status-card">
                <h2>Network Status</h2>
                <div className="status-indicator">
                  <span
                    className={getStatusIndicatorClass(networkStatus.status)}
                  ></span>
                  <span>{networkStatus.status}</span>
                </div>

                <div className="status-stats">
                  <div className="stat-item">
                    <span className="stat-label">Active Providers:</span>
                    <span className="stat-value">
                      {networkStatus.activeProviders}/
                      {networkStatus.totalProviders}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">CPU Cores:</span>
                    <span className="stat-value">{networkStatus.cpuCores}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Memory:</span>
                    <span className="stat-value">
                      {networkStatus.memoryGB} GB
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Storage:</span>
                    <span className="stat-value">
                      {networkStatus.storageGB} GB
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">GPUs:</span>
                    <span className="stat-value">{networkStatus.gpus}</span>
                  </div>
                </div>
              </div>

              <div className="task-summary-card">
                <h2>Task Summary</h2>
                {tasks.length === 0 ? (
                  <p>No tasks found</p>
                ) : (
                  <div className="task-summary">
                    <div className="stat-item">
                      <span className="stat-label">Total Tasks:</span>
                      <span className="stat-value">{tasks.length}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Running:</span>
                      <span className="stat-value">
                        {tasks.filter(task => task.status === 'RUNNING').length}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Completed:</span>
                      <span className="stat-value">
                        {
                          tasks.filter(task => task.status === 'COMPLETED')
                            .length
                        }
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Failed:</span>
                      <span className="stat-value">
                        {tasks.filter(task => task.status === 'FAILED').length}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedTab === 'providers' && (
            <div className="providers-list">
              <h2>Available Providers</h2>
              {providers.length === 0 ? (
                <p>No providers found</p>
              ) : (
                <table className="providers-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Region</th>
                      <th>CPU Cores</th>
                      <th>Memory</th>
                      <th>Storage</th>
                      <th>GPU</th>
                      <th>Reliability</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {providers.map(provider => (
                      <tr key={provider.id}>
                        <td>{provider.id}</td>
                        <td>{provider.name}</td>
                        <td>{provider.region}</td>
                        <td>{provider.cpuCores}</td>
                        <td>{provider.memory} GB</td>
                        <td>{provider.storage} GB</td>
                        <td>
                          {provider.gpuEnabled
                            ? `${provider.gpuModel || 'Yes'}`
                            : 'No'}
                        </td>
                        <td>{(provider.reliability * 100).toFixed(1)}%</td>
                        <td>
                          <span
                            className={getStatusIndicatorClass(
                              provider.status.toLowerCase(),
                            )}
                          >
                            {provider.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {selectedTab === 'tasks' && (
            <div className="tasks-list">
              <h2>Tasks</h2>
              {tasks.length === 0 ? (
                <p>No tasks found</p>
              ) : (
                <table className="tasks-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Created</th>
                      <th>Duration</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(task => (
                      <tr key={task.id}>
                        <td>{task.id}</td>
                        <td>{task.name}</td>
                        <td>{task.type}</td>
                        <td>{new Date(task.createdAt).toLocaleString()}</td>
                        <td>{task.duration || '-'}</td>
                        <td>
                          <span className={getTaskStatusClass(task.status)}>
                            {task.status}
                          </span>
                        </td>
                        <td>
                          <button
                            className="button-small"
                            disabled={
                              !['CREATED', 'PENDING', 'RUNNING'].includes(
                                task.status,
                              )
                            }
                            onClick={() => {
                              /* Handle cancel */
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            className="button-small"
                            disabled={task.status !== 'COMPLETED'}
                            onClick={() => {
                              /* Handle view results */
                            }}
                          >
                            Results
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {selectedTab === 'submit' && (
            <div className="submit-task-form">
              <h2>Submit New Task</h2>
              <p>
                Coming soon: Interface to submit computational tasks to the
                Golem Network
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default function GolemDashboard(props) {
  return <DemoSurfaceGate testId="golem-compute" title="Golem compute is unavailable"
    description="The golem API is not served by the testnet. Any enabled preview is illustrative.">
    <GolemDashboardSample {...props} />
  </DemoSurfaceGate>;
}
