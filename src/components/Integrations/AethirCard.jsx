import { useState, useEffect } from 'react';
import './IntegrationCards.css';

/**
 * AethirCard Component
 *
 * This component provides integration with Aethir cloud service,
 * allowing for efficient climate and weather computation in the cloud.
 */
const AethirCard = ({ integrationState = 'off' }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [instances, setInstances] = useState([]);
  const [weatherWorkloads, setWeatherWorkloads] = useState([]);
  const [resources, setResources] = useState({
    cpuAvailable: 0,
    gpuAvailable: 0,
    memoryAvailable: 0,
    storageAvailable: 0,
  });
  const [usage, setUsage] = useState({
    cpuUsage: 0,
    gpuUsage: 0,
    memoryUsage: 0,
    storageUsage: 0,
  });
  const [isCreatingInstance, setIsCreatingInstance] = useState(false);
  const [isSubmittingWorkload, setIsSubmittingWorkload] = useState(false);
  const [newWorkloadTemplate, setNewWorkloadTemplate] =
    useState('wrf-forecast');

  // Connect to Aethir service
  useEffect(() => {
    if (integrationState === 'on' || integrationState === 'testnet') {
      setConnectionStatus('connecting');

      // Simulate connection delay
      const timer = setTimeout(() => {
        setConnectionStatus('connected');

        // Mock compute instances
        setInstances([
          {
            id: 'aethir-inst-01',
            name: 'Climate Simulation Node',
            status: 'running',
            type: 'gpu-16',
            cpuCores: 16,
            gpuCount: 1,
            gpuType: 'NVIDIA T4',
            memory: 64,
            storage: 512,
            uptime: '72h 34m',
            region: 'us-west-2',
            costPerHour: '$1.45',
          },
          {
            id: 'aethir-inst-02',
            name: 'WRF Data Processing',
            status: 'stopped',
            type: 'cpu-32',
            cpuCores: 32,
            gpuCount: 0,
            gpuType: 'N/A',
            memory: 128,
            storage: 1024,
            uptime: '0h 0m',
            region: 'eu-central-1',
            costPerHour: '$1.20',
          },
          {
            id: 'aethir-inst-03',
            name: 'Air Quality Model',
            status: 'running',
            type: 'gpu-32',
            cpuCores: 32,
            gpuCount: 2,
            gpuType: 'NVIDIA A100',
            memory: 256,
            storage: 2048,
            uptime: '24h 12m',
            region: 'ap-northeast-1',
            costPerHour: '$3.80',
          },
        ]);

        // Mock weather workloads
        setWeatherWorkloads([
          {
            id: 'wrf-job-01',
            name: 'North America 3-Day Forecast',
            type: 'WRF-ARW',
            status: 'completed',
            submittedAt: '2025-05-15T18:30:00Z',
            completedAt: '2025-05-15T21:45:00Z',
            instanceId: 'aethir-inst-01',
            region: 'North America',
            resolution: '3km',
            forecastHours: 72,
            dataSize: '16.4 GB',
            variables: [
              'temperature',
              'precipitation',
              'wind',
              'humidity',
              'pressure',
            ],
            ipfsHash: 'Qmf3YpGZ2eBtYfXEfeFSjnsTrW2JMDDZjwLVsg5XNzVBQ4',
            parameters: {
              boundary: 'GFS',
              physics: 'Thompson',
              dynamics: 'ARW',
              timestep: 15,
            },
          },
          {
            id: 'cmaq-job-01',
            name: 'Urban Air Quality Assessment',
            type: 'CMAQ',
            status: 'running',
            submittedAt: '2025-05-16T03:15:00Z',
            completedAt: null,
            instanceId: 'aethir-inst-03',
            region: 'Urban Cluster',
            resolution: '1km',
            forecastHours: 48,
            dataSize: 'Calculating...',
            variables: ['PM2.5', 'O3', 'NO2', 'SO2', 'CO'],
            ipfsHash: null,
            parameters: {
              emissionInventory: 'NEI2020',
              chemicalMechanism: 'CB6r3',
              aerosol: 'AERO7',
            },
          },
        ]);

        // Mock resource allocation
        setResources({
          cpuAvailable: 128,
          gpuAvailable: 8,
          memoryAvailable: 512,
          storageAvailable: 8192,
        });

        // Mock usage
        setUsage({
          cpuUsage: 48,
          gpuUsage: 3,
          memoryUsage: 320,
          storageUsage: 3584,
        });
      }, 1500);

      return () => clearTimeout(timer);
    } else {
      setConnectionStatus('disconnected');
    }
  }, [integrationState]);

  // Handle instance creation simulation
  const handleCreateInstance = () => {
    setIsCreatingInstance(true);

    // Simulate creation delay
    setTimeout(() => {
      const newInstance = {
        id: 'aethir-inst-04',
        name: 'New Computation Node',
        status: 'starting',
        type: 'gpu-8',
        cpuCores: 8,
        gpuCount: 1,
        gpuType: 'NVIDIA T4',
        memory: 32,
        storage: 512,
        uptime: '0h 0m',
        region: 'us-east-1',
        costPerHour: '$0.95',
      };

      setInstances(prev => [...prev, newInstance]);
      setIsCreatingInstance(false);

      // Simulate instance starting up and changing to running status
      setTimeout(() => {
        setInstances(prev =>
          prev.map(instance =>
            instance.id === 'aethir-inst-04'
              ? { ...instance, status: 'running' }
              : instance,
          ),
        );
      }, 5000);
    }, 3000);
  };

  // Handle submitting a new weather workload
  const handleSubmitWorkload = () => {
    if (connectionStatus !== 'connected') return;

    setIsSubmittingWorkload(true);

    // Simulate API call to submit workload
    setTimeout(() => {
      const id = `aethir-wl-${Math.random().toString(36).substring(2, 10)}`;
      const timestamp = new Date();

      // Create workload based on template
      let newWorkload = {
        id,
        submittedAt: timestamp,
        status: 'submitted',
        instanceId: instances[0]?.id || 'aethir-inst-01',
      };

      // Template-specific properties
      switch (newWorkloadTemplate) {
      case 'wrf-forecast':
        newWorkload = {
          ...newWorkload,
          name: 'WRF Weather Forecast',
          type: 'Weather Forecast',
          region: 'North America',
          resolution: '12km',
          forecastHours: 72,
          variables: [
            'temperature',
            'precipitation',
            'wind_speed',
            'humidity',
            'pressure',
          ],
          dataSize: '2.8 GB',
          parameters: {
            boundary: 'GFS',
            physics: 'Thompson',
            dynamics: 'ARW',
            timestep: 30,
          },
        };
        break;
      case 'cmaq-air-quality':
        newWorkload = {
          ...newWorkload,
          name: 'CMAQ Air Quality Simulation',
          type: 'Air Quality Model',
          region: 'Urban Area - Los Angeles Basin',
          resolution: '4km',
          forecastHours: 48,
          variables: ['PM2.5', 'PM10', 'O3', 'NO2', 'SO2', 'CO'],
          dataSize: '1.6 GB',
          parameters: {
            emissionInventory: 'NEI2022',
            chemicalMechanism: 'CB6r3',
            aerosol: 'AERO7',
          },
        };
        break;
      case 'climate-projection':
        newWorkload = {
          ...newWorkload,
          name: 'Climate Change Projection',
          type: 'Climate Simulation',
          region: 'Global',
          resolution: '0.5 degree',
          forecastYears: 30,
          variables: [
            'temperature',
            'precipitation',
            'sea_level',
            'extreme_events',
            'humidity',
          ],
          dataSize: '5.2 GB',
          parameters: {
            scenario: 'SSP5-8.5',
            oceanModel: 'POP2',
            landModel: 'CLM5',
            timeframe: '2025-2075',
          },
        };
        break;
      }

      // Update workloads with new one
      setWeatherWorkloads(prevWorkloads => [newWorkload, ...prevWorkloads]);

      // Simulate status changes over time
      setTimeout(() => {
        setWeatherWorkloads(prevWorkloads =>
          prevWorkloads.map(w =>
            w.id === id ? { ...w, status: 'processing' } : w,
          ),
        );

        setTimeout(() => {
          setWeatherWorkloads(prevWorkloads =>
            prevWorkloads.map(w =>
              w.id === id ? { ...w, status: 'running' } : w,
            ),
          );

          setTimeout(() => {
            setWeatherWorkloads(prevWorkloads =>
              prevWorkloads.map(w =>
                w.id === id
                  ? {
                    ...w,
                    status: 'completed',
                    ipfsHash: `ipfs://Qm${Math.random().toString(36).substring(2, 15)}`,
                  }
                  : w,
              ),
            );
          }, 12000);
        }, 8000);
      }, 5000);

      setIsSubmittingWorkload(false);
    }, 2000);
  };

  // Handle instance start/stop
  const handleInstanceAction = (id, action) => {
    setInstances(prev =>
      prev.map(instance => {
        if (instance.id === id) {
          if (action === 'start') {
            return { ...instance, status: 'starting' };
          } else if (action === 'stop') {
            return { ...instance, status: 'stopping' };
          } else if (action === 'restart') {
            return { ...instance, status: 'restarting' };
          }
        }
        return instance;
      }),
    );

    // Simulate status change
    setTimeout(() => {
      setInstances(prev =>
        prev.map(instance => {
          if (instance.id === id) {
            if (action === 'start' || action === 'restart') {
              return { ...instance, status: 'running', uptime: '0h 0m' };
            } else if (action === 'stop') {
              return { ...instance, status: 'stopped', uptime: '0h 0m' };
            }
          }
          return instance;
        }),
      );
    }, 3000);
  };

  // Render Overview Tab
  const renderOverviewTab = () => (
    <div className="tab-content">
      <div className="connection-status">
        <div className={`status-indicator ${connectionStatus}`}></div>
        <div className="status-text">
          {connectionStatus === 'disconnected' && 'Disconnected from Aethir'}
          {connectionStatus === 'connecting' && 'Connecting to Aethir...'}
          {connectionStatus === 'connected' && 'Connected to Aethir Cloud'}
        </div>
      </div>

      <div className="integration-info">
        <div className="info-item">
          <div className="info-label">Environment</div>
          <div className="info-value">
            {integrationState === 'testnet'
              ? 'Testnet'
              : integrationState === 'on'
                ? 'Production'
                : 'Offline'}
          </div>
        </div>
        <div className="info-item">
          <div className="info-label">Service Type</div>
          <div className="info-value">Cloud Computing</div>
        </div>
        <div className="info-item">
          <div className="info-label">Active Instances</div>
          <div className="info-value">
            {connectionStatus === 'connected'
              ? instances.filter(i => i.status === 'running').length
              : '0'}
          </div>
        </div>
        <div className="info-item">
          <div className="info-label">Total Instances</div>
          <div className="info-value">
            {connectionStatus === 'connected' ? instances.length : '0'}
          </div>
        </div>
      </div>

      <div className="resource-utilization">
        <h4>Resource Utilization</h4>
        <div className="resource-bars">
          <div className="resource-item">
            <div className="resource-label">CPU</div>
            <div className="aethir-progress">
              <div
                className="aethir-progress-bar"
                role="progressbar"
                style={{
                  width: `${(usage.cpuUsage / resources.cpuAvailable) * 100}%`,
                }}
              >
                {usage.cpuUsage}/{resources.cpuAvailable} Cores
              </div>
            </div>
          </div>
          <div className="resource-item">
            <div className="resource-label">GPU</div>
            <div className="aethir-progress">
              <div
                className="aethir-progress-bar"
                role="progressbar"
                style={{
                  width: `${(usage.gpuUsage / resources.gpuAvailable) * 100}%`,
                }}
              >
                {usage.gpuUsage}/{resources.gpuAvailable} Units
              </div>
            </div>
          </div>
          <div className="resource-item">
            <div className="resource-label">Memory</div>
            <div className="aethir-progress">
              <div
                className="aethir-progress-bar"
                role="progressbar"
                style={{
                  width: `${(usage.memoryUsage / resources.memoryAvailable) * 100}%`,
                }}
              >
                {usage.memoryUsage}/{resources.memoryAvailable} GB
              </div>
            </div>
          </div>
          <div className="resource-item">
            <div className="resource-label">Storage</div>
            <div className="aethir-progress">
              <div
                className="aethir-progress-bar"
                role="progressbar"
                style={{
                  width: `${(usage.storageUsage / resources.storageAvailable) * 100}%`,
                }}
              >
                {usage.storageUsage}/{resources.storageAvailable} GB
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="integration-description">
        <h4>About Aethir Cloud</h4>
        <p>
          Aethir provides scalable cloud computing infrastructure optimized for
          demanding computational workloads like climate modeling, weather
          forecasting, and environmental simulations. The platform offers
          GPU-accelerated computing with high-bandwidth networking for efficient
          distributed computation.
        </p>
      </div>
    </div>
  );

  // Render Instances Tab
  const renderInstancesTab = () => (
    <div className="tab-content">
      <div className="instances-container">
        <div className="instances-header">
          <h4>Compute Instances</h4>
          <WrfButton
            variant="primary"
            size="sm"
            onClick={handleCreateInstance}
            disabled={isCreatingInstance || connectionStatus !== 'connected'}
          >
            <i className="bi bi-plus-circle"></i> New Instance
          </WrfButton>
        </div>

        {isCreatingInstance && (
          <div className="creating-instance">
            <div className="aethir-spinner" role="status">
              <span className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>Creating...</span>
            </div>
            <span className="creating-text">
              Creating new compute instance...
            </span>
          </div>
        )}

        {connectionStatus === 'connected' ? (
          <div className="instances-list">
            {instances.map(instance => (
              <div
                className={`instance-card ${instance.status}`}
                key={instance.id}
              >
                <div className="instance-header">
                  <h5>{instance.name}</h5>
                  <div className={`instance-status ${instance.status}`}>
                    <i
                      className={`bi ${
                        instance.status === 'running'
                          ? 'bi-play-circle'
                          : instance.status === 'stopped'
                            ? 'bi-stop-circle'
                            : instance.status === 'starting'
                              ? 'bi-arrow-clockwise'
                              : instance.status === 'stopping'
                                ? 'bi-arrow-clockwise'
                                : instance.status === 'restarting'
                                  ? 'bi-arrow-repeat'
                                  : 'bi-exclamation-circle'
                      }`}
                    ></i>
                    <span>{instance.status}</span>
                  </div>
                </div>
                <div className="instance-details">
                  <div className="instance-specs">
                    <div className="spec-group">
                      <div className="spec-item">
                        <span className="spec-label">Type:</span>
                        <span className="spec-value">{instance.type}</span>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">Region:</span>
                        <span className="spec-value">{instance.region}</span>
                      </div>
                    </div>
                    <div className="spec-group">
                      <div className="spec-item">
                        <span className="spec-label">CPU:</span>
                        <span className="spec-value">
                          {instance.cpuCores} cores
                        </span>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">GPU:</span>
                        <span className="spec-value">
                          {instance.gpuCount > 0
                            ? `${instance.gpuCount}x ${instance.gpuType}`
                            : 'None'}
                        </span>
                      </div>
                    </div>
                    <div className="spec-group">
                      <div className="spec-item">
                        <span className="spec-label">Memory:</span>
                        <span className="spec-value">{instance.memory} GB</span>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">Storage:</span>
                        <span className="spec-value">
                          {instance.storage} GB
                        </span>
                      </div>
                    </div>
                    <div className="spec-group">
                      <div className="spec-item">
                        <span className="spec-label">Uptime:</span>
                        <span className="spec-value">{instance.uptime}</span>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">Cost:</span>
                        <span className="spec-value">
                          {instance.costPerHour}/hour
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="instance-actions">
                    {instance.status === 'running' && (
                      <>
                        <WrfButton
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            handleInstanceAction(instance.id, 'restart')
                          }
                          sx={{ backgroundColor: 'var(--accent-amber, #F59E0B)', '&:hover': { backgroundColor: 'var(--accent-amber-dark, #D97706)' } }}
                        >
                          <i className="bi bi-arrow-repeat"></i> Restart
                        </WrfButton>
                        <WrfButton
                          variant="danger"
                          size="sm"
                          onClick={() =>
                            handleInstanceAction(instance.id, 'stop')
                          }
                        >
                          <i className="bi bi-stop-circle"></i> Stop
                        </WrfButton>
                      </>
                    )}
                    {instance.status === 'stopped' && (
                      <WrfButton
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          handleInstanceAction(instance.id, 'start')
                        }
                        sx={{ backgroundColor: 'var(--accent-green, #22C55E)', '&:hover': { backgroundColor: 'var(--accent-green-dark, #16A34A)' } }}
                      >
                        <i className="bi bi-play-circle"></i> Start
                      </WrfButton>
                    )}
                    {(instance.status === 'starting' ||
                      instance.status === 'stopping' ||
                      instance.status === 'restarting') && (
                      <div className="action-in-progress">
                        <div
                          className="aethir-spinner aethir-spinner-sm"
                          role="status"
                        >
                          <span className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
                            In progress...
                          </span>
                        </div>
                        <span>
                          {instance.status === 'starting'
                            ? 'Starting...'
                            : instance.status === 'stopping'
                              ? 'Stopping...'
                              : 'Restarting...'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-connection">
            <i className="bi bi-exclamation-triangle"></i>
            <p>Not connected to Aethir Cloud</p>
          </div>
        )}
      </div>
    </div>
  );

  // Render Weather Workloads Tab
  const renderWeatherWorkloadsTab = () => (
    <div className="tab-content">
      <div className="workloads-container">
        <div className="workloads-header">
          <h4>Weather & Climate Workloads</h4>
          <div className="workload-actions">
            <WrfSelect
              value={newWorkloadTemplate}
              onChange={e => setNewWorkloadTemplate(e.target.value)}
              disabled={
                isSubmittingWorkload || connectionStatus !== 'connected'
              }
              options={[
                { value: 'wrf-forecast', label: 'WRF Weather Forecast' },
                { value: 'cmaq-air-quality', label: 'CMAQ Air Quality Model' },
                { value: 'climate-projection', label: 'Climate Change Projection' },
              ]}
              sx={{ minWidth: 200 }}
            />
            <WrfButton
              variant="primary"
              size="sm"
              onClick={handleSubmitWorkload}
              disabled={
                isSubmittingWorkload || connectionStatus !== 'connected'
              }
            >
              <i className="bi bi-play-circle"></i> Submit Workload
            </WrfButton>
          </div>
        </div>

        {isSubmittingWorkload && (
          <div className="submitting-workload">
            <div className="aethir-spinner" role="status">
              <span className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>Submitting...</span>
            </div>
            <span className="submitting-text">
              Submitting new computational workload...
            </span>
          </div>
        )}

        {connectionStatus === 'connected' ? (
          <div className="workloads-list">
            {weatherWorkloads.map(workload => (
              <div
                className={`workload-card ${workload.status}`}
                key={workload.id}
              >
                <div className="workload-header">
                  <h5>{workload.name}</h5>
                  <div className={`workload-status ${workload.status}`}>
                    <i
                      className={`bi ${
                        workload.status === 'completed'
                          ? 'bi-check-circle'
                          : workload.status === 'running' ||
                              workload.status === 'processing'
                            ? 'bi-arrow-repeat'
                            : workload.status === 'submitted'
                              ? 'bi-hourglass'
                              : workload.status === 'failed'
                                ? 'bi-exclamation-circle'
                                : 'bi-question-circle'
                      }`}
                    ></i>
                    <span>{workload.status}</span>
                  </div>
                </div>
                <div className="workload-details">
                  <div className="workload-specs">
                    <div className="spec-group">
                      <div className="spec-item">
                        <span className="spec-label">Type:</span>
                        <span className="spec-value">{workload.type}</span>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">Region:</span>
                        <span className="spec-value">{workload.region}</span>
                      </div>
                    </div>
                    <div className="spec-group">
                      <div className="spec-item">
                        <span className="spec-label">Resolution:</span>
                        <span className="spec-value">
                          {workload.resolution}
                        </span>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">
                          {workload.forecastHours
                            ? 'Forecast Hours:'
                            : 'Forecast Years:'}
                        </span>
                        <span className="spec-value">
                          {workload.forecastHours || workload.forecastYears}
                        </span>
                      </div>
                    </div>
                    <div className="spec-group">
                      <div className="spec-item">
                        <span className="spec-label">Variables:</span>
                        <span className="spec-value">
                          {workload.variables.slice(0, 3).join(', ')}
                          {workload.variables.length > 3
                            ? ` +${workload.variables.length - 3} more`
                            : ''}
                        </span>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">Submitted:</span>
                        <span className="spec-value">
                          {new Date(workload.submittedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="spec-group">
                      <div className="spec-item">
                        <span className="spec-label">Data Size:</span>
                        <span className="spec-value">{workload.dataSize}</span>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">Instance:</span>
                        <span className="spec-value">
                          {instances.find(i => i.id === workload.instanceId)
                            ?.name || workload.instanceId}
                        </span>
                      </div>
                    </div>
                    {workload.ipfsHash && (
                      <div className="spec-group">
                        <div className="spec-item full-width">
                          <span className="spec-label">IPFS Hash:</span>
                          <span className="spec-value ipfs-hash">
                            {workload.ipfsHash}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="workload-actions">
                    {workload.status === 'completed' && (
                      <WrfButton variant="secondary" size="sm" sx={{ backgroundColor: 'var(--accent-green, #22C55E)', '&:hover': { backgroundColor: 'var(--accent-green-dark, #16A34A)' } }}>
                        <i className="bi bi-download"></i> Download Results
                      </WrfButton>
                    )}
                    {workload.status === 'running' ||
                    workload.status === 'processing' ? (
                        <div className="action-in-progress">
                          <div
                            className="aethir-spinner aethir-spinner-sm"
                            role="status"
                          >
                            <span className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>Processing...</span>
                          </div>
                          <span>
                            {workload.status === 'running'
                              ? 'Running...'
                              : 'Processing...'}
                          </span>
                        </div>
                      ) : null}
                    {workload.status === 'failed' && (
                      <WrfButton variant="secondary" size="sm" sx={{ backgroundColor: 'var(--accent-amber, #F59E0B)', '&:hover': { backgroundColor: 'var(--accent-amber-dark, #D97706)' } }}>
                        <i className="bi bi-arrow-repeat"></i> Retry
                      </WrfButton>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-connection">
            <i className="bi bi-exclamation-triangle"></i>
            <p>Not connected to Aethir Cloud</p>
          </div>
        )}
      </div>
    </div>
  );

  // Render Models Tab
  const renderModelsTab = () => (
    <div className="tab-content">
      <div className="models-container">
        <h4>Pre-configured Computational Models</h4>
        <p>
          Aethir provides optimized environments for running climate and weather
          models, with pre-configured images that include commonly used
          scientific software stacks.
        </p>

        {connectionStatus === 'connected' ? (
          <div className="models-grid">
            <div className="model-card">
              <div className="model-header">
                <h5>WRF Weather Research</h5>
                <span className="model-tag">Weather</span>
              </div>
              <div className="model-body">
                <p>
                  Weather Research and Forecasting Model optimized for cloud
                  execution. Includes WRF-ARW dynamic core with physics
                  parameterizations.
                </p>
                <div className="model-specs">
                  <div className="spec-item">
                    <span className="spec-label">Version:</span>
                    <span className="spec-value">4.5.1</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Optimized for:</span>
                    <span className="spec-value">GPU Acceleration</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Included Tools:</span>
                    <span className="spec-value">WPS, ARWpost, UPP</span>
                  </div>
                </div>
                <WrfButton variant="primary" size="sm">
                  <i className="bi bi-cloud-arrow-up"></i> Deploy Model
                </WrfButton>
              </div>
            </div>

            <div className="model-card">
              <div className="model-header">
                <h5>CESM Climate Simulation</h5>
                <span className="model-tag">Climate</span>
              </div>
              <div className="model-body">
                <p>
                  Community Earth System Model for global climate simulations
                  with atmosphere, ocean, land, and sea ice components.
                </p>
                <div className="model-specs">
                  <div className="spec-item">
                    <span className="spec-label">Version:</span>
                    <span className="spec-value">2.2.0</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Optimized for:</span>
                    <span className="spec-value">Multi-node Scaling</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Included Tools:</span>
                    <span className="spec-value">NCL, CIME, CDO</span>
                  </div>
                </div>
                <WrfButton variant="primary" size="sm">
                  <i className="bi bi-cloud-arrow-up"></i> Deploy Model
                </WrfButton>
              </div>
            </div>

            <div className="model-card">
              <div className="model-header">
                <h5>CMAQ Air Quality</h5>
                <span className="model-tag">Air Quality</span>
              </div>
              <div className="model-body">
                <p>
                  Community Multiscale Air Quality Modeling System for air
                  quality research and regulatory applications.
                </p>
                <div className="model-specs">
                  <div className="spec-item">
                    <span className="spec-label">Version:</span>
                    <span className="spec-value">5.4</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Optimized for:</span>
                    <span className="spec-value">CPU Optimization</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Included Tools:</span>
                    <span className="spec-value">SMOKE, MCIP, VERDI</span>
                  </div>
                </div>
                <WrfButton variant="primary" size="sm">
                  <i className="bi bi-cloud-arrow-up"></i> Deploy Model
                </WrfButton>
              </div>
            </div>

            <div className="model-card">
              <div className="model-header">
                <h5>CAM-Chem Chemistry</h5>
                <span className="model-tag">Atmospheric Chemistry</span>
              </div>
              <div className="model-body">
                <p>
                  Community Atmosphere Model with Chemistry for simulating
                  global atmospheric composition and chemistry-climate
                  interactions.
                </p>
                <div className="model-specs">
                  <div className="spec-item">
                    <span className="spec-label">Version:</span>
                    <span className="spec-value">6.3</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Optimized for:</span>
                    <span className="spec-value">GPU Acceleration</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Included Tools:</span>
                    <span className="spec-value">PyCAM, Matplotlib, CIME</span>
                  </div>
                </div>
                <WrfButton variant="primary" size="sm">
                  <i className="bi bi-cloud-arrow-up"></i> Deploy Model
                </WrfButton>
              </div>
            </div>
          </div>
        ) : (
          <div className="no-connection">
            <i className="bi bi-exclamation-triangle"></i>
            <p>Not connected to Aethir Cloud</p>
          </div>
        )}
      </div>
    </div>
  );

  if (integrationState === 'off') {
    return (
      <div className="integration-card aethir-card disabled">
        <div className="card-header">
          <h3>
            <i className="bi bi-cloud"></i> Aethir Cloud Computing
            <WrfBadge color="error">Offline</WrfBadge>
          </h3>
        </div>
        <div className="card-content">
          <p>
            Aethir Cloud integration is currently disabled. Enable it in
            Governance settings to access cloud computing resources for climate
            and weather simulations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="integration-card aethir-card">
      <div className="card-header">
        <h3>
          <i className="bi bi-cloud"></i> Aethir Cloud Computing
          {integrationState === 'testnet' && (
            <WrfBadge color="warning">Testnet</WrfBadge>
          )}
          {integrationState === 'on' && (
            <WrfBadge color="success">Production</WrfBadge>
          )}
        </h3>
        <p>Scalable cloud computing for climate and weather models</p>
      </div>
      <div className="card-content">
        <div className="tabs-container">
          <div className="tabs">
            <div
              className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </div>
            <div
              className={`tab ${activeTab === 'instances' ? 'active' : ''}`}
              onClick={() => setActiveTab('instances')}
            >
              Compute Instances
            </div>
            <div
              className={`tab ${activeTab === 'models' ? 'active' : ''}`}
              onClick={() => setActiveTab('models')}
            >
              Models & Templates
            </div>
          </div>
          <div className="tab-content-container">
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'instances' && renderInstancesTab()}
            {activeTab === 'models' && renderModelsTab()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AethirCard;
