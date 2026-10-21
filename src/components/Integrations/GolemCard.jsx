import React, { useState, useEffect } from 'react';

import axios from 'axios';

import './IntegrationsHub.css';
import { sanitizeInput, sanitizeObject } from '../../utils/security';

const GolemCard = () => {
  const [networkStatus, setNetworkStatus] = useState({
    status: 'connecting',
    nodeCount: 0,
    taskCount: 0,
    computeResources: {
      cpuCores: 0,
      memory: 0,
      gpuCount: 0,
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [taskHistory, setTaskHistory] = useState([]);

  useEffect(() => {
    fetchNetworkStatus();
    fetchTaskHistory();

    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      fetchNetworkStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchNetworkStatus = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/golem/status');
      // Sanitize the API response data before setting state
      setNetworkStatus(sanitizeObject(response.data));
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching Golem network status:', error);
      setIsLoading(false);
    }
  };

  const fetchTaskHistory = async () => {
    try {
      const response = await axios.get('/api/golem/tasks');
      // Sanitize the array of task history data before setting state
      const sanitizedTaskHistory = Array.isArray(response.data)
        ? response.data.map(task => sanitizeObject(task))
        : [];
      setTaskHistory(sanitizedTaskHistory);
    } catch (error) {
      console.error('Error fetching Golem task history:', error);
    }
  };

  const submitWeatherForecastTask = async () => {
    try {
      // Even for hardcoded values, apply sanitization as a precaution
      const taskConfig = {
        region: sanitizeInput('North America'),
        resolution: sanitizeInput('0.25deg'),
        forecastHours: 72,
        model: sanitizeInput('WRF-ARW'),
      };

      // Submit the sanitized task configuration
      await axios.post('/api/golem/tasks/weather-forecast', taskConfig);
      fetchTaskHistory(); // Refresh the task list
    } catch (error) {
      console.error('Error submitting weather forecast task:', error);
    }
  };

  const submitClimateSimulationTask = async () => {
    try {
      // Even for hardcoded values, apply sanitization as a precaution
      const taskConfig = {
        model: sanitizeInput('CMIP6'),
        scenario: sanitizeInput('ssp245'),
        timeframe: sanitizeInput('2023-2050'),
        region: sanitizeInput('Global'),
        variables: ['temperature', 'precipitation', 'seaLevel'].map(v =>
          sanitizeInput(v),
        ),
      };

      // Submit the sanitized task configuration
      await axios.post('/api/golem/tasks/climate-simulation', taskConfig);
      fetchTaskHistory(); // Refresh the task list
    } catch (error) {
      console.error('Error submitting climate simulation task:', error);
    }
  };

  return (
    <div className="integration-card-container">
      <div className="integration-card">
        <h2 className="card-title">Golem Network Integration</h2>
        <p className="card-description">
          Golem Network provides decentralized computing power for Wrfcoin's
          weather forecasting, climate simulations, and data processing tasks
          through a global network of providers.
        </p>

        <div className="status-section">
          <h3>Network Status</h3>
          {isLoading ? (
            <div className="loading-indicator">Loading...</div>
          ) : (
            <div className="status-grid">
              <div className="status-item">
                <span className="status-label">Status:</span>
                <span
                  className={`status-value status-${sanitizeInput(networkStatus.status)}`}
                >
                  {sanitizeInput(networkStatus.status) === 'active'
                    ? 'Active'
                    : 'Connecting...'}
                </span>
              </div>
              <div className="status-item">
                <span className="status-label">Providers:</span>
                <span className="status-value">
                  {parseInt(networkStatus.nodeCount) || 0}
                </span>
              </div>
              <div className="status-item">
                <span className="status-label">Active Tasks:</span>
                <span className="status-value">
                  {parseInt(networkStatus.taskCount) || 0}
                </span>
              </div>
              <div className="status-item">
                <span className="status-label">CPU Cores:</span>
                <span className="status-value">
                  {parseInt(networkStatus.computeResources?.cpuCores) || 0}
                </span>
              </div>
              <div className="status-item">
                <span className="status-label">Memory:</span>
                <span className="status-value">
                  {parseInt(networkStatus.computeResources?.memory) || 0} GB
                </span>
              </div>
              <div className="status-item">
                <span className="status-label">GPUs:</span>
                <span className="status-value">
                  {parseInt(networkStatus.computeResources?.gpuCount) || 0}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="actions-section">
          <h3>Submit Task</h3>
          <div className="action-buttons">
            <button
              className="action-button"
              onClick={submitWeatherForecastTask}
              disabled={networkStatus.status !== 'active'}
            >
              Weather Forecast
            </button>
            <button
              className="action-button"
              onClick={submitClimateSimulationTask}
              disabled={networkStatus.status !== 'active'}
            >
              Climate Simulation
            </button>
          </div>
        </div>

        <div className="task-history-section">
          <h3>Recent Tasks</h3>
          {taskHistory.length === 0 ? (
            <p>No tasks have been submitted yet.</p>
          ) : (
            <table className="task-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {taskHistory.slice(0, 5).map(task => (
                  <tr key={sanitizeInput(task.id)}>
                    <td>{sanitizeInput(task.id?.substring(0, 8))}...</td>
                    <td>{sanitizeInput(task.type)}</td>
                    <td
                      className={`status-${sanitizeInput(task.status?.toLowerCase())}`}
                    >
                      {sanitizeInput(task.status)}
                    </td>
                    <td>
                      {task.createdAt
                        ? new Date(task.createdAt).toLocaleString()
                        : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="integration-footer">
          <div className="integration-links">
            <a
              href="https://golem.network"
              target="_blank"
              rel="noopener noreferrer"
            >
              Golem Network Website
            </a>
            <a
              href="https://docs.golem.network"
              target="_blank"
              rel="noopener noreferrer"
            >
              Documentation
            </a>
            <a
              href="https://chat.golem.network"
              target="_blank"
              rel="noopener noreferrer"
            >
              Community
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GolemCard;
