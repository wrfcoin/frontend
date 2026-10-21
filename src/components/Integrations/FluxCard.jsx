import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Chip,
  Tabs,
  Tab,
  Alert,
  Button,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
// Using shared integration styles
import './IntegrationsHub.css';
import { sanitizeInput, sanitizeObject } from '../../utils/security';

const FluxCard = ({ integrationState, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [nodeData, setNodeData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchFluxData();
  }, []);

  const fetchFluxData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/flux/status');
      if (!response.ok) {
        throw new Error(
          `Error fetching Flux data: ${sanitizeInput(response.statusText)}`,
        );
      }
      // Sanitize the API response data before setting it to state
      const data = await response.json();
      setNodeData(sanitizeObject(data));
    } catch (err) {
      console.error('Failed to fetch Flux data:', err);
      // Sanitize error message before setting to state
      setError(
        sanitizeInput(err.message) || 'Failed to connect to Flux network',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchFluxData();
    if (onRefresh) onRefresh();
  };

  // Calculate integration status based on integrationState
  const getStatus = () => {
    // Sanitize the input before processing
    const sanitizedState = sanitizeInput(integrationState);

    if (!sanitizedState) return 'active';
    if (sanitizedState === 'off') return 'offline';
    if (sanitizedState === 'testnet') return 'testnet';
    if (sanitizedState.includes('expires')) return 'temporary';
    return 'active';
  };

  const status = getStatus();

  const renderOverviewTab = () => (
    <div className="tab-content">
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box className="stat-card" sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Network Status</Typography>
            <Box className="status-indicator" sx={{ mb: 1 }}>
              {status === 'active' && (
                <Chip label="Active" color="success" size="small" />
              )}
              {status === 'offline' && (
                <Chip label="Offline" color="error" size="small" />
              )}
              {status === 'testnet' && (
                <Chip label="Testnet" color="warning" size="small" />
              )}
              {status === 'temporary' && (
                <Chip label="Temporary Access" color="info" size="small" />
              )}
            </Box>
            <Typography>
              Connected to {sanitizeInput(nodeData?.network) || 'Flux'}{' '}
              network
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box className="stat-card" sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Node Statistics</Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">{sanitizeInput(error)}</Alert>
            ) : (
              <>
                <Typography>
                  <strong>Active Nodes:</strong>{' '}
                  {parseInt(nodeData?.activeNodes) || '0'}
                </Typography>
                <Typography>
                  <strong>Total Apps:</strong>{' '}
                  {parseInt(nodeData?.totalApps) || '0'}
                </Typography>
                <Typography>
                  <strong>Network Uptime:</strong>{' '}
                  {sanitizeInput(nodeData?.uptime) || '0%'}
                </Typography>
              </>
            )}
          </Box>
        </Grid>
      </Grid>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12 }}>
          <Box className="climate-card" sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Climate Computation Resources</Typography>
            <Typography sx={{ mb: 1 }}>
              Resources allocated for weather forecasting and climate data
              processing:
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
              </Box>
            ) : (
              <div className="resource-stats">
                <div className="resource-stat">
                  <span className="stat-label">CPU Cores</span>
                  <span className="stat-value">
                    {parseInt(nodeData?.resources?.cpu) || '0'}
                  </span>
                </div>
                <div className="resource-stat">
                  <span className="stat-label">RAM</span>
                  <span className="stat-value">
                    {parseInt(nodeData?.resources?.ram) || '0'} GB
                  </span>
                </div>
                <div className="resource-stat">
                  <span className="stat-label">Storage</span>
                  <span className="stat-value">
                    {parseInt(nodeData?.resources?.storage) || '0'} GB
                  </span>
                </div>
                <div className="resource-stat">
                  <span className="stat-label">GPU Units</span>
                  <span className="stat-value">
                    {parseInt(nodeData?.resources?.gpu) || '0'}
                  </span>
                </div>
              </div>
            )}
          </Box>
        </Grid>
      </Grid>
    </div>
  );

  const renderComputeTab = () => (
    <div className="tab-content">
      <Box className="compute-card" sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>Compute Services</Typography>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <>
            <div className="compute-services">
              {Array.isArray(nodeData?.services) &&
                nodeData?.services.map((service, index) => {
                  const sanitizedService = {
                    name: sanitizeInput(service.name || ''),
                    status: sanitizeInput(service.status || ''),
                    description: sanitizeInput(service.description || ''),
                    cpuUsage: Math.min(
                      100,
                      Math.max(0, parseInt(service.cpuUsage) || 0),
                    ),
                    memoryUsage: Math.min(
                      100,
                      Math.max(0, parseInt(service.memoryUsage) || 0),
                    ),
                  };

                  return (
                    <div key={index} className="compute-service-item">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <i className="bi bi-cpu"></i>
                        <Typography variant="subtitle2">{sanitizedService.name}</Typography>
                        <Chip
                          label={sanitizedService.status}
                          color={sanitizedService.status === 'active' ? 'success' : 'warning'}
                          size="small"
                          className="service-status"
                        />
                      </Box>
                      <Typography variant="body2" sx={{ mb: 1 }}>{sanitizedService.description}</Typography>
                      <div className="service-stats">
                        <div className="stat-item">
                          <Typography variant="caption" className="stat-label">CPU Usage: {sanitizedService.cpuUsage}%</Typography>
                          <LinearProgress
                            variant="determinate"
                            value={sanitizedService.cpuUsage}
                            sx={{ mt: 0.5 }}
                          />
                        </div>
                        <div className="stat-item">
                          <Typography variant="caption" className="stat-label">Memory Usage: {sanitizedService.memoryUsage}%</Typography>
                          <LinearProgress
                            variant="determinate"
                            value={sanitizedService.memoryUsage}
                            sx={{ mt: 0.5 }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              {!nodeData?.services?.length && (
                <Alert severity="info">
                  No compute services are currently available.
                </Alert>
              )}
            </div>
          </>
        )}
      </Box>
    </div>
  );

  const renderDeploymentTab = () => (
    <div className="tab-content">
      <Box className="deployment-card" sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>Weather Forecast Deployments</Typography>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{sanitizeInput(error)}</Alert>
        ) : (
          <>
            <div className="deployment-list">
              {Array.isArray(nodeData?.deployments) &&
                nodeData?.deployments.map((deployment, index) => {
                  const sanitizedDeployment = {
                    name: sanitizeInput(deployment.name || ''),
                    status: sanitizeInput(deployment.status || ''),
                    description: sanitizeInput(deployment.description || ''),
                    type: sanitizeInput(deployment.type || ''),
                    region: sanitizeInput(deployment.region || ''),
                    tier: sanitizeInput(deployment.tier || ''),
                    uptime: sanitizeInput(deployment.uptime || ''),
                  };

                  return (
                    <div key={index} className="deployment-item">
                      <Box className="deployment-header" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2">
                          <i className="bi bi-cloud"></i>{' '}
                          {sanitizedDeployment.name}
                        </Typography>
                        <Chip
                          label={sanitizedDeployment.status}
                          color={sanitizedDeployment.status === 'running' ? 'success' : sanitizedDeployment.status === 'stopped' ? 'error' : 'warning'}
                          size="small"
                          className="deployment-status"
                        />
                      </Box>
                      <Typography variant="body2" sx={{ mb: 1 }}>{sanitizedDeployment.description}</Typography>
                      <div className="deployment-details">
                        <div className="detail-item">
                          <span className="detail-label">Type:</span>
                          <span className="detail-value">
                            {sanitizedDeployment.type}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Region:</span>
                          <span className="detail-value">
                            {sanitizedDeployment.region}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Resource Tier:</span>
                          <span className="detail-value">
                            {sanitizedDeployment.tier}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Uptime:</span>
                          <span className="detail-value">
                            {sanitizedDeployment.uptime}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              {!nodeData?.deployments?.length && (
                <Alert severity="info">
                  No weather forecast deployments found.
                </Alert>
              )}
            </div>
          </>
        )}
      </Box>
    </div>
  );

  return (
    <div className="integration-card flux-card">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <div>
          <img
            src="/static/images/integrations/flux-logo.png"
            alt="Flux Logo"
            className="integration-logo"
            onError={e => {
              e.target.onerror = null;
              if (
                /^https:\/\/runonflux\.io/.test(
                  'https://runonflux.io/assets/img/icons/flux-logo.svg',
                )
              ) {
                e.target.src =
                  'https://runonflux.io/assets/img/icons/flux-logo.svg';
              } else {
                e.target.src = '/static/images/integrations/default-logo.png';
              }
            }}
          />
        </div>
        <div className="action-buttons">
          <Button
            variant="contained"
            size="small"
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? (
              <>
                <CircularProgress size={14} sx={{ mr: 1 }} />
                Refreshing...
              </>
            ) : (
              <>
                <i className="bi bi-arrow-clockwise"></i> Refresh
              </>
            )}
          </Button>
        </div>
      </Box>

      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="Overview" value="overview" />
        <Tab label="Compute" value="compute" />
        <Tab label="Weather Forecasts" value="deployments" />
      </Tabs>

      <Box sx={{ p: 2 }}>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'compute' && renderComputeTab()}
        {activeTab === 'deployments' && renderDeploymentTab()}
      </Box>
    </div>
  );
};

export default FluxCard;
