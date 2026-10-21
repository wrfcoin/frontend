import DemoSurfaceGate from '../common/DemoSurfaceGate';
import React, { useState, useEffect } from 'react';
import './TatauCloudStyles.css';

const TatauCloudDashboardSample = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [networkStatus, setNetworkStatus] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [models, setModels] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [jobs, setJobs] = useState([]);
  const [newJob, setNewJob] = useState({
    region: 'north-america',
    resolution: '0.25deg',
    forecastHours: 72,
    variables: [
      'temperature',
      'precipitation',
      'humidity',
      'pressure',
      'windSpeed',
    ],
  });
  const [costEstimate, setCostEstimate] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchTatauCloudData = async () => {
      setIsLoading(true);
      try {
        // Fetch network status
        const statusResponse = await fetch('/api/tataucloud/status');
        const statusData = await statusResponse.json();
        setNetworkStatus(statusData);

        // Fetch compute nodes
        const nodesResponse = await fetch('/api/tataucloud/nodes');
        const nodesData = await nodesResponse.json();
        setNodes(Array.isArray(nodesData) ? nodesData : []);

        // Fetch available models
        const modelsResponse = await fetch('/api/tataucloud/models');
        const modelsData = await modelsResponse.json();
        setModels(Array.isArray(modelsData) ? modelsData : []);

        setError(null);
      } catch (err) {
        console.error('Error fetching TatauCloud data:', err);
        setError('Failed to load TatauCloud data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTatauCloudData();
  }, []);

  const handleJobInputChange = e => {
    const { name, value } = e.target;
    setNewJob({
      ...newJob,
      [name]: name === 'forecastHours' ? parseInt(value, 10) : value,
    });
  };

  const handleVariableChange = variable => {
    const updatedVariables = [...newJob.variables];
    if (updatedVariables.includes(variable)) {
      const index = updatedVariables.indexOf(variable);
      updatedVariables.splice(index, 1);
    } else {
      updatedVariables.push(variable);
    }
    setNewJob({ ...newJob, variables: updatedVariables });
  };

  const handleGetCostEstimate = async () => {
    try {
      const response = await fetch('/api/tataucloud/cost-estimate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newJob),
      });
      const data = await response.json();
      setCostEstimate(data);
    } catch (err) {
      console.error('Error getting cost estimate:', err);
      setError('Failed to get cost estimate. Please try again later.');
    }
  };

  const handleSubmitJob = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/tataucloud/forecast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newJob),
      });
      const data = await response.json();

      // Add the new job to our jobs list
      setJobs([
        ...jobs,
        {
          ...data,
          submittedAt: new Date().toISOString(),
          type: 'Weather Forecast',
        },
      ]);

      // Reset cost estimate
      setCostEstimate(null);

      // Show success message
      alert('Job submitted successfully! Job ID: ' + data.jobId);
    } catch (err) {
      console.error('Error submitting job:', err);
      setError('Failed to submit job. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="tatau-cloud-dashboard">
        <div className="tatau-loading">
          <div className="tatau-spinner"></div>
          <p>Loading TatauCloud data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tatau-cloud-dashboard">
        <div className="tatau-error">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="tatau-cloud-dashboard">
      <header className="tatau-header">
        <h2>TatauCloud Distributed AI/ML Compute</h2>
        <div className="tatau-status-indicator">
          <span
            className={`status-dot ${networkStatus?.status === 'operational' ? 'status-green' : 'status-red'}`}
          ></span>
          <span>Status: {networkStatus?.status}</span>
        </div>
      </header>

      <div className="tatau-tabs">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'nodes' ? 'active' : ''}
          onClick={() => setActiveTab('nodes')}
        >
          Compute Nodes
        </button>
        <button
          className={activeTab === 'models' ? 'active' : ''}
          onClick={() => setActiveTab('models')}
        >
          AI/ML Models
        </button>
        <button
          className={activeTab === 'jobs' ? 'active' : ''}
          onClick={() => setActiveTab('jobs')}
        >
          My Jobs
        </button>
        <button
          className={activeTab === 'submit' ? 'active' : ''}
          onClick={() => setActiveTab('submit')}
        >
          Submit Job
        </button>
      </div>

      <div className="tatau-content">
        {activeTab === 'overview' && (
          <div className="tatau-overview">
            <div className="tatau-stats-grid">
              <div className="tatau-stat-card">
                <h3>Network</h3>
                <p>
                  <strong>Status:</strong> {networkStatus?.status}
                </p>
                <p>
                  <strong>Total Nodes:</strong>{' '}
                  {networkStatus?.nodes?.total || 0}
                </p>
                <p>
                  <strong>Online Nodes:</strong>{' '}
                  {networkStatus?.nodes?.online || 0}
                </p>
                <p>
                  <strong>Network Load:</strong> {networkStatus?.networkLoad}
                </p>
              </div>
              <div className="tatau-stat-card">
                <h3>GPU Resources</h3>
                <p>
                  <strong>Total GPUs:</strong> {networkStatus?.gpus?.total || 0}
                </p>
                <p>
                  <strong>Available GPUs:</strong>{' '}
                  {networkStatus?.gpus?.available || 0}
                </p>
                <p>
                  <strong>Utilization:</strong>{' '}
                  {networkStatus?.gpus?.total
                    ? (
                      (1 -
                          networkStatus.gpus.available /
                            networkStatus.gpus.total) *
                        100
                    ).toFixed(1) + '%'
                    : 'N/A'}
                </p>
              </div>
              <div className="tatau-stat-card">
                <h3>Models</h3>
                <p>
                  <strong>Available Models:</strong> {models?.length || 0}
                </p>
                <p>
                  <strong>Forecast Models:</strong>{' '}
                  {models?.filter(m => m.type === 'forecast')?.length || 0}
                </p>
                <p>
                  <strong>Analysis Models:</strong>{' '}
                  {models?.filter(m => m.type === 'analysis')?.length || 0}
                </p>
              </div>
              <div className="tatau-stat-card">
                <h3>Jobs</h3>
                <p>
                  <strong>My Jobs:</strong> {jobs?.length || 0}
                </p>
                <p>
                  <strong>Active:</strong>{' '}
                  {jobs?.filter(j => j.status === 'running')?.length || 0}
                </p>
                <p>
                  <strong>Completed:</strong>{' '}
                  {jobs?.filter(j => j.status === 'completed')?.length || 0}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'nodes' && (
          <div className="tatau-nodes">
            <h3>Available Compute Nodes ({nodes.length})</h3>
            <div className="tatau-table-container">
              <table className="tatau-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Status</th>
                    <th>GPU Type</th>
                    <th>GPU Count</th>
                    <th>Location</th>
                    <th>Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {nodes.map(node => (
                    <tr key={node.id}>
                      <td>{node.id}</td>
                      <td>
                        <span
                          className={`status-dot ${node.status === 'online' ? 'status-green' : 'status-red'}`}
                        ></span>
                        {node.status}
                      </td>
                      <td>{node.gpuType}</td>
                      <td>{node.gpuCount}</td>
                      <td>{node.location}</td>
                      <td>{node.utilization}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'models' && (
          <div className="tatau-models">
            <h3>Available AI/ML Models ({models.length})</h3>
            <div className="tatau-table-container">
              <table className="tatau-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Parameters</th>
                    <th>Accuracy</th>
                    <th>Dataset</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map(model => (
                    <tr key={model.id}>
                      <td>{model.name}</td>
                      <td>{model.type}</td>
                      <td>{model.parameters}</td>
                      <td>{model.accuracy}</td>
                      <td>{model.dataset}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="tatau-jobs">
            <h3>My Jobs ({jobs.length})</h3>
            {jobs.length === 0 ? (
              <div className="tatau-empty-state">
                <p>You haven't submitted any jobs yet.</p>
                <button onClick={() => setActiveTab('submit')}>
                  Submit a Job
                </button>
              </div>
            ) : (
              <div className="tatau-table-container">
                <table className="tatau-table">
                  <thead>
                    <tr>
                      <th>Job ID</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map(job => (
                      <tr key={job.jobId}>
                        <td>{job.jobId}</td>
                        <td>{job.type}</td>
                        <td>
                          <span
                            className={`status-dot ${
                              job.status === 'completed'
                                ? 'status-green'
                                : job.status === 'running'
                                  ? 'status-blue'
                                  : job.status === 'failed'
                                    ? 'status-red'
                                    : 'status-yellow'
                            }`}
                          ></span>
                          {job.status}
                        </td>
                        <td>{new Date(job.submittedAt).toLocaleString()}</td>
                        <td>
                          <button className="tatau-action-btn">
                            View Details
                          </button>
                          {job.status === 'completed' && (
                            <button className="tatau-action-btn">
                              View Results
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'submit' && (
          <div className="tatau-submit-job">
            <h3>Submit Weather Forecast Job</h3>
            <div className="tatau-form">
              <div className="tatau-form-group">
                <label>Region:</label>
                <select
                  name="region"
                  value={newJob.region}
                  onChange={handleJobInputChange}
                >
                  <option value="north-america">North America</option>
                  <option value="south-america">South America</option>
                  <option value="europe">Europe</option>
                  <option value="asia">Asia</option>
                  <option value="africa">Africa</option>
                  <option value="oceania">Oceania</option>
                  <option value="global">Global</option>
                </select>
              </div>

              <div className="tatau-form-group">
                <label>Resolution:</label>
                <select
                  name="resolution"
                  value={newJob.resolution}
                  onChange={handleJobInputChange}
                >
                  <option value="0.1deg">0.1° (High Resolution)</option>
                  <option value="0.25deg">0.25° (Standard)</option>
                  <option value="0.5deg">0.5° (Medium)</option>
                  <option value="1.0deg">1.0° (Low Resolution)</option>
                </select>
              </div>

              <div className="tatau-form-group">
                <label>Forecast Hours:</label>
                <select
                  name="forecastHours"
                  value={newJob.forecastHours}
                  onChange={handleJobInputChange}
                >
                  <option value="24">24 hours</option>
                  <option value="48">48 hours</option>
                  <option value="72">72 hours</option>
                  <option value="120">120 hours (5 days)</option>
                  <option value="240">240 hours (10 days)</option>
                </select>
              </div>

              <div className="tatau-form-group">
                <label>Weather Variables:</label>
                <div className="tatau-checkbox-grid">
                  {[
                    'temperature',
                    'precipitation',
                    'humidity',
                    'pressure',
                    'windSpeed',
                    'cloudCover',
                    'visibility',
                    'snowDepth',
                  ].map(variable => (
                    <div key={variable} className="tatau-checkbox">
                      <input
                        type="checkbox"
                        id={variable}
                        checked={newJob.variables.includes(variable)}
                        onChange={() => handleVariableChange(variable)}
                      />
                      <label htmlFor={variable}>
                        {variable.charAt(0).toUpperCase() + variable.slice(1)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="tatau-form-actions">
                <button
                  className="tatau-btn"
                  onClick={handleGetCostEstimate}
                  disabled={newJob.variables.length === 0}
                >
                  Get Cost Estimate
                </button>

                <button
                  className="tatau-btn tatau-btn-primary"
                  onClick={handleSubmitJob}
                  disabled={isSubmitting || newJob.variables.length === 0}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Job'}
                </button>
              </div>

              {costEstimate && (
                <div className="tatau-cost-estimate">
                  <h4>Cost Estimate</h4>
                  <p>
                    <strong>Total Cost:</strong> {costEstimate.totalCost}
                  </p>
                  <p>
                    <strong>Estimated Duration:</strong> {costEstimate.duration}
                  </p>
                  <div className="tatau-cost-breakdown">
                    <h5>Cost Breakdown:</h5>
                    <ul>
                      <li>Compute: {costEstimate.breakdown.compute}</li>
                      <li>Network: {costEstimate.breakdown.network}</li>
                      <li>Storage: {costEstimate.breakdown.storage}</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function TatauCloudDashboard(props) {
  return <DemoSurfaceGate testId="tatau-compute" title="Tatau compute is unavailable"
    description="The tatau API is not served by the testnet. Any enabled preview is illustrative.">
    <TatauCloudDashboardSample {...props} />
  </DemoSurfaceGate>;
}
