import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import StatusBadge from '../common/StatusBadge';
import InfoBox from '../common/InfoBox';
import { useIntegrations } from '../../contexts/IntegrationsContext';
import { WrfButton } from '../DesignSystem';
import DemoSurfaceGate from '../common/DemoSurfaceGate';

// frontend#352: in the demo build this sample's controls are disabled; none of
// them reach a backend.
const SAMPLE_ACTION = 'Sample only: nothing is submitted to SONM.';

/**
 * SONM Network Integration Card Component
 *
 * Displays information about the SONM (Supercomputer Organized by Network Mining)
 * integration, which provides distributed computing capabilities for
 * intensive computational tasks related to meteorological data.
 */
const SonmCardSample = () => {
  const [status, setStatus] = useState('connecting');
  const [workerCount, setWorkerCount] = useState(0);
  const [availableCpuCores, setAvailableCpuCores] = useState(0);
  const [totalCpuCores, setTotalCpuCores] = useState(0);
  const [availableGpu, setAvailableGpu] = useState(0);
  const [totalGpu, setTotalGpu] = useState(0);
  const [marketVolume, setMarketVolume] = useState('0');
  const [activeJobs, setActiveJobs] = useState(0);
  const { integrations } = useIntegrations();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if integration is enabled in the context
    const sonmEnabled = integrations?.compute?.items?.sonm?.enabled;

    // Simulate loading data
    const timer = setTimeout(() => {
      setStatus('active');
      setWorkerCount(317);
      setAvailableCpuCores(120);
      setTotalCpuCores(300);
      setAvailableGpu(4);
      setTotalGpu(7);
      setMarketVolume('243,581.45 SNM');
      setActiveJobs(38);
    }, 1500);

    return () => clearTimeout(timer);
  }, [integrations]);

  return (
    <div className="integration-detail">
      <div className="integration-header">
        <i className="bi bi-hdd-network"></i>
        <div className="integration-header-content">
          <h2>SONM Network</h2>
          <p>
            Distributed computing marketplace for high-performance
            meteorological model execution and data processing
          </p>
          <StatusBadge status={status} />
        </div>
      </div>

      <div className="integration-description">
        <p>
          SONM (Supercomputer Organized by Network Mining) is a decentralized
          fog computing platform that provides distributed computing resources
          for intensive computational tasks. The Wrfcoin integration with SONM
          enables efficient execution of meteorological models, climate
          simulations, and data processing tasks across a global network of
          compute providers.
        </p>
      </div>

      <div className="integration-stats">
        <div className="stats-container">
          <div className="stat-item">
            <i className="bi bi-cpu"></i>
            <div className="stat-content">
              <div className="stat-value">
                {availableCpuCores}/{totalCpuCores}
              </div>
              <div className="stat-label">Available CPU Cores</div>
            </div>
          </div>
          <div className="stat-item">
            <i className="bi bi-gpu-card"></i>
            <div className="stat-content">
              <div className="stat-value">
                {availableGpu}/{totalGpu}
              </div>
              <div className="stat-label">Available GPU Units</div>
            </div>
          </div>
          <div className="stat-item">
            <i className="bi bi-pc-display"></i>
            <div className="stat-content">
              <div className="stat-value">{workerCount}</div>
              <div className="stat-label">Total Workers</div>
            </div>
          </div>
          <div className="stat-item">
            <i className="bi bi-clock-history"></i>
            <div className="stat-content">
              <div className="stat-value">{activeJobs}</div>
              <div className="stat-label">Active Jobs</div>
            </div>
          </div>
        </div>
      </div>

      <div className="integration-actions">
        <WrfButton
          variant="primary"
          onClick={() => navigate('/compute/jobs')}
        >
          <i className="bi bi-list-task"></i> View Jobs
        </WrfButton>
        <WrfButton disabled title={SAMPLE_ACTION} variant="outline">
          <i className="bi bi-plus-lg"></i> Submit Task
        </WrfButton>
        <WrfButton disabled title={SAMPLE_ACTION} variant="secondary">
          <i className="bi bi-gear"></i> Configure
        </WrfButton>
      </div>

      <InfoBox
        type="info"
        title="SONM Network Integration"
        content="This integration leverages SONM's global marketplace of computing resources to execute weather models, climate simulations, and data processing tasks. Resources are dynamically allocated based on computational requirements, geographical proximity, and cost efficiency."
      />

      <h3>Task Types</h3>
      <div className="task-types">
        <div className="task-type-card">
          <div className="task-type-icon">
            <i className="bi bi-cloud"></i>
          </div>
          <div className="task-type-name">Weather Forecasting</div>
          <div className="task-type-description">
            WRF, NAM, and GFS model execution
          </div>
        </div>
        <div className="task-type-card">
          <div className="task-type-icon">
            <i className="bi bi-globe2"></i>
          </div>
          <div className="task-type-name">Climate Modeling</div>
          <div className="task-type-description">
            Long-term global climate simulations
          </div>
        </div>
        <div className="task-type-card">
          <div className="task-type-icon">
            <i className="bi bi-bar-chart"></i>
          </div>
          <div className="task-type-name">Data Processing</div>
          <div className="task-type-description">
            Large-scale weather data analysis
          </div>
        </div>
      </div>

      <h3>Resource Metrics</h3>
      <div className="network-metrics">
        <div className="metric-item">
          <div className="metric-label">Market Volume</div>
          <div className="metric-value">{marketVolume}</div>
        </div>
        <div className="metric-item">
          <div className="metric-label">Forecast Execution Price</div>
          <div className="metric-value">~0.1-0.5 SNM/hour</div>
        </div>
        <div className="metric-item">
          <div className="metric-label">Climate Sim Price</div>
          <div className="metric-value">~0.5-2.0 SNM/hour</div>
        </div>
        <div className="metric-item">
          <div className="metric-label">Data Processing Price</div>
          <div className="metric-value">~0.2-0.8 SNM/hour</div>
        </div>
      </div>
    </div>
  );
};

// frontend#352: display-only fabricated surface. The default build shows an
// honest not-live state and never mounts the sample.
const SonmCard = () => (
  <DemoSurfaceGate
    title="The SONM integration is not live"
    description="No backend route reports SONM workers, capacity, market volume or jobs; nothing is connected."
    testId="sonm"
  >
    <SonmCardSample />
  </DemoSurfaceGate>
);

export default SonmCard;
