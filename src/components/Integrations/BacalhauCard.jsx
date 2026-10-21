import React, { useState, useEffect } from 'react';
import './IntegrationCards.css';

const BacalhauCard = () => {
  const [status, setStatus] = useState('connecting');
  const [networkStats, setNetworkStats] = useState(null);
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    // Simulate connection to Bacalhau API
    const timer = setTimeout(() => {
      setStatus('connected');
      setNetworkStats({
        status: 'healthy',
        nodeCount: 42,
        activeJobs: 17,
        totalJobsCompleted: 5874,
        avgExecutionTime: '14.3m',
      });
      setJobs([
        {
          id: 'job-wx48z9',
          name: 'Weather Simulation',
          status: 'completed',
          runtime: '38m',
          cpu: '16 vCPU',
          memory: '64 GB',
        },
        {
          id: 'job-a71p0q',
          name: 'Climate Model Training',
          status: 'running',
          runtime: '4h 12m',
          cpu: '32 vCPU',
          memory: '128 GB',
        },
        {
          id: 'job-c93m2r',
          name: 'Air Quality Analysis',
          status: 'queued',
          runtime: '-',
          cpu: '8 vCPU',
          memory: '32 GB',
        },
        {
          id: 'job-t56j8k',
          name: 'Ocean Current Simulation',
          status: 'running',
          runtime: '1h 45m',
          cpu: '24 vCPU',
          memory: '96 GB',
        },
      ]);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmitJob = () => {
    setStatus('processing');
    setTimeout(() => {
      setStatus('connected');
      setJobs([
        {
          id: 'job-n62b5v',
          name: 'New Satellite Data Analysis',
          status: 'queued',
          runtime: '-',
          cpu: '16 vCPU',
          memory: '64 GB',
        },
        ...jobs,
      ]);
      setNetworkStats(prev => ({
        ...prev,
        activeJobs: prev.activeJobs + 1,
      }));
    }, 1500);
  };

  return (
    <div className="integration-card">
      <div className="integration-header">
        <h2>Bacalhau Integration</h2>
        <div className={`status-indicator ${status}`}>
          {status === 'connecting' && 'Connecting...'}
          {status === 'connected' && 'Connected'}
          {status === 'processing' && 'Processing...'}
          {status === 'error' && 'Connection Error'}
        </div>
      </div>

      <div className="integration-content">
        <div className="integration-section">
          <h3>Network Status</h3>
          <p>
            Bacalhau is a distributed computing platform that allows Wrfcoin to
            run complex computational workloads for meteorological modeling and
            climate simulations.
          </p>

          {networkStats && (
            <div className="network-stats">
              <div className="stat-card">
                <div className="stat-title">Network Status</div>
                <div className={`stat-value ${networkStats.status}`}>
                  {networkStats.status}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Active Nodes</div>
                <div className="stat-value">{networkStats.nodeCount}</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Active Jobs</div>
                <div className="stat-value">{networkStats.activeJobs}</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Jobs Completed</div>
                <div className="stat-value">
                  {networkStats.totalJobsCompleted}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Avg. Execution Time</div>
                <div className="stat-value">
                  {networkStats.avgExecutionTime}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="integration-section">
          <h3>Active Computational Jobs</h3>
          <table className="jobs-table">
            <thead>
              <tr>
                <th>Job Name</th>
                <th>Status</th>
                <th>Runtime</th>
                <th>Resources</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => (
                <tr key={job.id}>
                  <td>{job.name}</td>
                  <td>
                    <span className={`status-badge ${job.status}`}>
                      {job.status}
                    </span>
                  </td>
                  <td>{job.runtime}</td>
                  <td>{`${job.cpu}, ${job.memory}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="integration-section">
          <h3>Submit New Computational Job</h3>
          <div className="job-submission">
            <div className="form-row">
              <label>Job Type:</label>
              <select>
                <option>Weather Forecast Simulation</option>
                <option>Climate Model Analysis</option>
                <option>Air Quality Prediction</option>
                <option>Satellite Data Processing</option>
                <option>Custom Docker Container</option>
              </select>
            </div>
            <div className="form-row">
              <label>CPU Resources:</label>
              <select>
                <option>8 vCPU (Basic)</option>
                <option>16 vCPU (Standard)</option>
                <option>32 vCPU (Advanced)</option>
                <option>64 vCPU (High Performance)</option>
              </select>
            </div>
            <div className="form-row">
              <label>Memory:</label>
              <select>
                <option>32 GB</option>
                <option>64 GB</option>
                <option>128 GB</option>
                <option>256 GB</option>
              </select>
            </div>
            <div className="form-row">
              <label>Input Data:</label>
              <select>
                <option>NOAA Weather Dataset</option>
                <option>NASA Earth Observation Data</option>
                <option>EPA Air Quality Measurements</option>
                <option>Custom IPFS Hash</option>
              </select>
            </div>
            <button
              className="submit-job-btn"
              onClick={handleSubmitJob}
              disabled={status !== 'connected'}
            >
              Submit Computational Job
            </button>
          </div>
        </div>
      </div>

      <div className="integration-footer">
        <p>
          Bacalhau integration enables Wrfcoin to perform distributed
          computational tasks for meteorological data processing and climate
          analysis across decentralized compute resources.
        </p>
      </div>
    </div>
  );
};

export default BacalhauCard;
