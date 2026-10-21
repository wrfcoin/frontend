import DemoSurfaceGate from '../common/DemoSurfaceGate';
import React, { useState, useEffect } from 'react';
import './iExecStyles.css';

/**
 * iExec Dashboard Component
 *
 * This component provides a dashboard interface for the iExec integration
 * with Wrfcoin Core. It displays network status, available workers,
 * and allows for task submission and management.
 */
const IExecDashboardSample = () => {
  const [networkStatus, setNetworkStatus] = useState({
    status: 'loading',
    activeWorkers: 0,
    totalWorkers: 0,
    cpuCores: 0,
    gpuCount: 0,
    marketVolume: 0,
  });

  const [workers, setWorkers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [dataset, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    // Fetch network status
    fetchNetworkStatus();

    // Fetch workers
    fetchWorkers();

    // Fetch tasks
    fetchTasks();

    // Fetch datasets
    fetchDatasets();

    // Set up periodic refresh
    const refreshInterval = setInterval(() => {
      fetchNetworkStatus();
      fetchTasks();
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, []);

  const fetchNetworkStatus = async () => {
    try {
      const response = await fetch('/api/iexec/status');
      if (response.ok) {
        const data = await response.json();
        setNetworkStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch iExec network status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const response = await fetch('/api/iexec/workers');
      if (response.ok) {
        const data = await response.json();
        setWorkers(Array.isArray(data.workers) ? data.workers : []);
      }
    } catch (error) {
      console.error('Failed to fetch iExec workers:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/iexec/tasks');
      if (response.ok) {
        const data = await response.json();
        setTasks(Array.isArray(data.tasks) ? data.tasks : []);
      }
    } catch (error) {
      console.error('Failed to fetch iExec tasks:', error);
    }
  };

  const fetchDatasets = async () => {
    try {
      const response = await fetch('/api/iexec/datasets');
      if (response.ok) {
        const data = await response.json();
        setDatasets(Array.isArray(data.datasets) ? data.datasets : []);
      }
    } catch (error) {
      console.error('Failed to fetch iExec datasets:', error);
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
    <div className="iexec-dashboard">
      <h1>iExec Network</h1>

      <div className="dashboard-tabs">
        <button
          className={`tab-button ${selectedTab === 'overview' ? 'active' : ''}`}
          onClick={() => setSelectedTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-button ${selectedTab === 'workers' ? 'active' : ''}`}
          onClick={() => setSelectedTab('workers')}
        >
          Workers
        </button>
        <button
          className={`tab-button ${selectedTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setSelectedTab('tasks')}
        >
          Tasks
        </button>
        <button
          className={`tab-button ${selectedTab === 'datasets' ? 'active' : ''}`}
          onClick={() => setSelectedTab('datasets')}
        >
          Datasets
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
                    <span className="stat-label">Active Workers:</span>
                    <span className="stat-value">
                      {networkStatus.activeWorkers}/{networkStatus.totalWorkers}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">CPU Cores:</span>
                    <span className="stat-value">{networkStatus.cpuCores}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">GPUs:</span>
                    <span className="stat-value">{networkStatus.gpuCount}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Market Volume:</span>
                    <span className="stat-value">
                      {networkStatus.marketVolume} RLC
                    </span>
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

          {selectedTab === 'workers' && (
            <div className="workers-list">
              <h2>Available Workers</h2>
              {workers.length === 0 ? (
                <p>No workers found</p>
              ) : (
                <table className="workers-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Region</th>
                      <th>CPU Cores</th>
                      <th>GPU</th>
                      <th>Price (RLC/h)</th>
                      <th>Reliability</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workers.map(worker => (
                      <tr key={worker.id}>
                        <td>{worker.id}</td>
                        <td>{worker.name}</td>
                        <td>{worker.region}</td>
                        <td>{worker.cpuCores}</td>
                        <td>
                          {worker.gpuEnabled
                            ? `${worker.gpuModel || 'Yes'}`
                            : 'No'}
                        </td>
                        <td>{worker.pricePerHour}</td>
                        <td>{(worker.reliability * 100).toFixed(1)}%</td>
                        <td>
                          <span
                            className={getStatusIndicatorClass(
                              worker.status.toLowerCase(),
                            )}
                          >
                            {worker.status}
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
                      <th>Worker</th>
                      <th>Price</th>
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
                        <td>{task.workerId || '-'}</td>
                        <td>{task.price} RLC</td>
                        <td>
                          <span className={getTaskStatusClass(task.status)}>
                            {task.status}
                          </span>
                        </td>
                        <td>
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

          {selectedTab === 'datasets' && (
            <div className="datasets-list">
              <h2>Available Datasets</h2>
              {dataset.length === 0 ? (
                <p>No datasets found</p>
              ) : (
                <table className="datasets-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Size</th>
                      <th>Owner</th>
                      <th>Price</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataset.map(ds => (
                      <tr key={ds.id}>
                        <td>{ds.id}</td>
                        <td>{ds.name}</td>
                        <td>{ds.type}</td>
                        <td>{ds.size}</td>
                        <td>{ds.owner}</td>
                        <td>{ds.price} RLC</td>
                        <td>
                          <button
                            className="button-small"
                            onClick={() => {
                              /* Handle use */
                            }}
                          >
                            Use
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
                iExec Network
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default function IExecDashboard(props) {
  return <DemoSurfaceGate testId="iexec-compute" title="iExec compute is unavailable"
    description="The iexec API is not served by the testnet. Any enabled preview is illustrative.">
    <IExecDashboardSample {...props} />
  </DemoSurfaceGate>;
}
