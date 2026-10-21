import React, { useState, useEffect } from 'react';
import { WrfButton, WrfInput, WrfSelect } from '../DesignSystem';
import '../Integrations/IntegrationCards.css';

const RenderCard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [renderStatus, setRenderStatus] = useState({
    status: 'testnet',
    activeJobs: 0,
    completedJobs: 0,
    availableNodes: 0,
    creditsBalance: 0,
  });
  const [renderJobs, setRenderJobs] = useState([]);

  useEffect(() => {
    // Initialize with mock data
    fetchRenderNetworkStatus();
    fetchRenderJobs();
  }, []);

  const fetchRenderNetworkStatus = () => {
    setIsRefreshing(true);

    // Simulate API call to Render Network
    setTimeout(() => {
      setRenderStatus({
        status: 'testnet',
        activeJobs: Math.floor(Math.random() * 3),
        completedJobs: Math.floor(Math.random() * 15) + 5,
        availableNodes: Math.floor(Math.random() * 50) + 20,
        creditsBalance: Math.floor(Math.random() * 1000) + 100,
      });
      setIsRefreshing(false);
    }, 1000);
  };

  const fetchRenderJobs = () => {
    // Simulate API call to get render jobs
    const demoJobs = [
      {
        id: 'job-c4d-forecast-viz',
        name: 'Global Weather Visualization',
        type: 'Cinema 4D',
        status: 'completed',
        progress: 100,
        submittedAt: '2025-05-15T14:30:00Z',
        completedAt: '2025-05-15T15:45:00Z',
        duration: '1h 15m',
        cost: 42.5,
        resolution: '4K',
        frames: 120,
      },
      {
        id: 'job-blender-climate-sim',
        name: 'Climate Simulation 3D Model',
        type: 'Blender',
        status: 'rendering',
        progress: 68,
        submittedAt: '2025-05-16T05:15:00Z',
        completedAt: null,
        duration: '45m (est. remaining)',
        cost: 65.0,
        resolution: '8K',
        frames: 240,
      },
      {
        id: 'job-houdini-particle-air',
        name: 'Air Quality Particle Simulation',
        type: 'Houdini',
        status: 'queued',
        progress: 0,
        submittedAt: '2025-05-16T06:10:00Z',
        completedAt: null,
        duration: 'Est. 2h 30m',
        cost: 85.5,
        resolution: '4K',
        frames: 180,
      },
    ];

    setRenderJobs(demoJobs);
  };

  const handleRefresh = () => {
    fetchRenderNetworkStatus();
    fetchRenderJobs();
  };

  const handleCreateJob = e => {
    e.preventDefault();
    // In a real implementation, this would submit a job to Render Network
    alert(
      'Render job submission requested. In a production environment, this would send your job to the Render Network.',
    );
  };

  const renderOverviewTab = () => (
    <div className="integration-card-content">
      <div className="integration-description">
        <p>
          Render Network is a distributed GPU rendering network that allows you
          to render complex 3D scenes, visualizations, and computationally
          intensive graphics using the spare GPU capacity of the network.
        </p>
      </div>

      <div className="integration-stats">
        <div className="stat-item">
          <i className="fas fa-tasks"></i>
          <div className="stat-info">
            <span className="stat-value">{renderStatus.activeJobs}</span>
            <span className="stat-label">Active Jobs</span>
          </div>
        </div>
        <div className="stat-item">
          <i className="fas fa-check-circle"></i>
          <div className="stat-info">
            <span className="stat-value">{renderStatus.completedJobs}</span>
            <span className="stat-label">Completed Jobs</span>
          </div>
        </div>
        <div className="stat-item">
          <i className="fas fa-desktop"></i>
          <div className="stat-info">
            <span className="stat-value">{renderStatus.availableNodes}</span>
            <span className="stat-label">Available Nodes</span>
          </div>
        </div>
        <div className="stat-item">
          <i className="fas fa-coins"></i>
          <div className="stat-info">
            <span className="stat-value">
              {renderStatus.creditsBalance.toLocaleString()} RNDR
            </span>
            <span className="stat-label">Credits Balance</span>
          </div>
        </div>
      </div>

      <div className="protocol-info">
        <h4>
          <i className="fas fa-cube"></i> Supported 3D Software
        </h4>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Blender</span>
            <span className="info-value">Supported</span>
          </div>
          <div className="info-item">
            <span className="info-label">Cinema 4D</span>
            <span className="info-value">Supported</span>
          </div>
          <div className="info-item">
            <span className="info-label">Houdini</span>
            <span className="info-value">Supported</span>
          </div>
          <div className="info-item">
            <span className="info-label">3ds Max</span>
            <span className="info-value">Supported</span>
          </div>
          <div className="info-item">
            <span className="info-label">Maya</span>
            <span className="info-value">Supported</span>
          </div>
          <div className="info-item">
            <span className="info-label">OctaneRender</span>
            <span className="info-value">Supported</span>
          </div>
        </div>
      </div>

      <div className="integration-note">
        <h4>
          <i className="fas fa-lightbulb"></i> Wrfcoin Integration Benefits
        </h4>
        <p>
          The Render Network integration allows Wrfcoin users to create
          high-quality visualizations of weather forecasts, climate simulations,
          and air quality models as computational NFTs, leveraging distributed
          rendering power for faster processing.
        </p>
      </div>
    </div>
  );

  const renderJobsTab = () => (
    <div className="integration-card-content">
      <div className="browser-header">
        <h4>
          <i className="fas fa-tasks"></i> Render Jobs
        </h4>
        <div className="browser-actions">
          <WrfButton
            variant="outline"
            size="sm"
            onClick={() => setActiveTab('create')}
          >
            <i className="fas fa-plus"></i> Create Job
          </WrfButton>
        </div>
      </div>

      <ul className="content-list">
        {renderJobs.map(job => (
          <li
            key={job.id}
            className={`content-item ${job.status === 'rendering' ? 'active' : ''}`}
          >
            <div className="content-info">
              <span className="content-name">{job.name}</span>
              <span className="content-cid">
                <i
                  className={`fas ${job.type === 'Blender' ? 'fa-cube' : job.type === 'Cinema 4D' ? 'fa-film' : 'fa-wind'}`}
                ></i>{' '}
                {job.type} | {job.resolution} | {job.frames} frames
              </span>
              {job.status === 'rendering' && (
                <div
                  className="render-progress-track"
                  style={{ marginTop: '5px', height: '5px', backgroundColor: '#e9ecef', borderRadius: '3px', overflow: 'hidden' }}
                >
                  <div
                    className="render-progress-fill"
                    role="progressbar"
                    style={{ width: `${job.progress}%`, height: '100%', backgroundColor: 'var(--wrf-primary, #1976d2)', transition: 'width 0.3s ease' }}
                    aria-valuenow={job.progress}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>
              )}
            </div>
            <div className="content-meta">
              <span
                className={`status-badge ${job.status === 'rendering' ? 'active' : job.status === 'completed' ? 'success' : 'warning'}`}
              >
                {job.status === 'rendering'
                  ? `${job.progress}%`
                  : job.status === 'completed'
                    ? 'Completed'
                    : 'Queued'}
              </span>
              <span>{job.cost} RNDR</span>
            </div>
          </li>
        ))}
      </ul>

      {renderJobs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <i
            className="fas fa-cubes"
            style={{ fontSize: '24px', color: '#ccc', marginBottom: '10px' }}
          ></i>
          <p>No render jobs found</p>
        </div>
      )}
    </div>
  );

  const renderCreateTab = () => (
    <div className="integration-card-content">
      <h4>
        <i className="fas fa-plus-circle"></i> Submit New Render Job
      </h4>
      <p>Configure a new rendering job for your computational data</p>

      <form onSubmit={handleCreateJob}>
        <div className="form-group">
          <label>Job Name</label>
          <WrfInput
            type="text"
            placeholder="e.g., Global Weather Forecast Visualization"
          />
        </div>

        <div className="form-group">
          <label>Source Type</label>
          <WrfSelect>
            <option value="">Select source type</option>
            <option value="url">URL to 3D File</option>
            <option value="upload">Upload 3D File</option>
            <option value="computational">Computational Model Output</option>
            <option value="blockchain">Blockchain Storage</option>
          </WrfSelect>
        </div>

        <div className="form-group">
          <label>3D Application</label>
          <WrfSelect>
            <option value="blender">Blender</option>
            <option value="c4d">Cinema 4D</option>
            <option value="houdini">Houdini</option>
            <option value="3dsmax">3ds Max</option>
            <option value="maya">Maya</option>
          </WrfSelect>
        </div>

        <div className="form-group">
          <label>Render Engine</label>
          <WrfSelect>
            <option value="octane">OctaneRender</option>
            <option value="cycles">Cycles</option>
            <option value="arnold">Arnold</option>
            <option value="redshift">Redshift</option>
            <option value="vray">V-Ray</option>
          </WrfSelect>
        </div>

        <div className="form-group">
          <label>Output Resolution</label>
          <WrfSelect>
            <option value="1080p">1080p (1920x1080)</option>
            <option value="1440p">1440p (2560x1440)</option>
            <option value="4k">4K (3840x2160)</option>
            <option value="8k">8K (7680x4320)</option>
          </WrfSelect>
        </div>

        <div className="form-group">
          <label>Frame Range</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <WrfInput
              type="number"
              placeholder="Start"
              defaultValue="1"
            />
            <WrfInput
              type="number"
              placeholder="End"
              defaultValue="120"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Output Format</label>
          <WrfSelect>
            <option value="png">PNG Sequence</option>
            <option value="exr">OpenEXR</option>
            <option value="jpg">JPEG Sequence</option>
            <option value="mp4">MP4 Video</option>
          </WrfSelect>
        </div>

        <div className="form-group">
          <label>Priority</label>
          <WrfSelect>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </WrfSelect>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: '20px',
          }}
        >
          <WrfButton
            variant="outline"
            style={{ marginRight: '10px' }}
            onClick={() => setActiveTab('jobs')}
          >
            Cancel
          </WrfButton>
          <WrfButton variant="primary" type="submit">
            Submit Job
          </WrfButton>
        </div>
      </form>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="integration-card-content">
      <h4>
        <i className="fas fa-cogs"></i> Render Network Settings
      </h4>

      <div className="form-group">
        <label>Network Mode</label>
        <WrfSelect>
          <option value="testnet">Testnet</option>
          <option value="mainnet">Mainnet</option>
        </WrfSelect>
        <small className="text-muted">
          Testnet mode uses simulated data for development and testing
        </small>
      </div>

      <div className="form-group">
        <label>API Key (Testnet)</label>
        <WrfInput
          type="password"
          placeholder="Enter API key"
          defaultValue="●●●●●●●●●●●●●●●●"
        />
      </div>

      <div className="form-group">
        <label>Auto-NFT Creation</label>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '10px',
          }}
        >
          <input
            type="checkbox"
            id="autoNFT"
            style={{ marginRight: '10px' }}
            defaultChecked={true}
          />
          <label htmlFor="autoNFT" style={{ margin: 0 }}>
            Automatically create NFT from completed render jobs
          </label>
        </div>
      </div>

      <div className="form-group">
        <label>Default Storage</label>
        <WrfSelect>
          <option value="ipfs">IPFS</option>
          <option value="arweave">Arweave</option>
          <option value="filecoin">Filecoin</option>
          <option value="local">Local Storage</option>
        </WrfSelect>
      </div>

      <div className="form-group">
        <label>Maximum Job Cost (RNDR)</label>
        <WrfInput type="number" defaultValue="1000" />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: '20px',
        }}
      >
        <WrfButton variant="primary">Save Settings</WrfButton>
      </div>
    </div>
  );

  return (
    <div className="integration-card">
      <div className="integration-card-header">
        <div className="integration-logo">
          <i className="fas fa-cubes"></i>
        </div>
        <div className="integration-title">
          <h3>Render Network</h3>
          <p>Distributed GPU rendering for computational visualizations</p>
        </div>
        <div className="integration-status">
          <span className={`status-badge ${renderStatus.status}`}>
            {renderStatus.status === 'active'
              ? 'Active'
              : renderStatus.status === 'testnet'
                ? 'Testnet'
                : 'Inactive'}
          </span>
          <button
            className={`refresh-btn ${isRefreshing ? 'spinning' : ''}`}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <i className="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>

      <div className="integration-card-tabs">
        <div
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <i className="fas fa-info-circle"></i> Overview
        </div>
        <div
          className={`tab ${activeTab === 'jobs' ? 'active' : ''}`}
          onClick={() => setActiveTab('jobs')}
        >
          <i className="fas fa-tasks"></i> Jobs
        </div>
        <div
          className={`tab ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          <i className="fas fa-plus"></i> Create
        </div>
        <div
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <i className="fas fa-cogs"></i> Settings
        </div>
      </div>

      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'jobs' && renderJobsTab()}
      {activeTab === 'create' && renderCreateTab()}
      {activeTab === 'settings' && renderSettingsTab()}

      <div className="integration-card-footer">
        <span>Powered by Render Network v2.3.5</span>
      </div>
    </div>
  );
};

export default RenderCard;
