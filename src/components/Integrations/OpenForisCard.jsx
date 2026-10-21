import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { WrfCard, WrfButton, WrfBadge, WrfAlert } from '../DesignSystem';
import Grid from '@mui/material/Grid';
import { devLog } from '../../utils/logger';

const STATUS_COLORS = {
  on: 'success',
  off: 'danger',
  testnet: 'info',
  error: 'danger',
  pending: 'warning',
  expires: 'warning',
};

/**
 * OpenForis Integration Card Component
 *
 * Displays information and controls for the OpenForis integration:
 * - Collect Earth: For land use monitoring and data collection
 * - Earth Map: For time-series analysis of satellite imagery
 * - Climate Data: For enhanced climate simulations and projections
 */
const OpenForisCard = ({ integrationState, onRefresh }) => {
  const [status, setStatus] = useState({ initialized: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [projects, setProjects] = useState([]);
  const [climateData, setClimateData] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectPlots, setProjectPlots] = useState([]);
  const [stats, setStats] = useState({
    projects: 0,
    plots: 0,
    timeSeries: 0,
    climateData: 0,
  });

  useEffect(() => {
    fetchStatus();
    return () => {
      // Any cleanup if needed
    };
  }, []);

  useEffect(() => {
    if (integrationState && integrationState.status === 'on') {
      fetchStatus();
      if (activeTab === 0) {
        fetchProjects();
      } else if (activeTab === 2) {
        fetchClimateData();
      }
    }
  }, [integrationState, activeTab]);

  // Fetch plots when a project is selected
  useEffect(() => {
    if (
      selectedProject &&
      integrationState &&
      integrationState.status === 'on'
    ) {
      fetchPlots(selectedProject.id);
    }
  }, [selectedProject, integrationState]);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/openforis/status');
      setStatus(response.data);

      // Extract stats
      if (
        response.data &&
        response.data.adapterStatus &&
        response.data.adapterStatus.cacheStats
      ) {
        setStats(response.data.adapterStatus.cacheStats);
      }

      setError(null);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching OpenForis status:', error);
      setError('Failed to connect to OpenForis integration');
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/api/openforis/projects');
      setProjects(response.data || []);
    } catch (error) {
      console.error('Error fetching OpenForis projects:', error);
      setProjects([]);
    }
  };

  const fetchPlots = async projectId => {
    try {
      const response = await axios.get(
        `/api/openforis/projects/${projectId}/plots`,
      );
      setProjectPlots(response.data || []);
    } catch (error) {
      console.error('Error fetching OpenForis plots:', error);
      setProjectPlots([]);
    }
  };

  const fetchClimateData = async () => {
    try {
      const response = await axios.get('/api/openforis/climate');
      setClimateData(response.data || []);
    } catch (error) {
      console.error('Error fetching climate data:', error);
      setClimateData([]);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleRefresh = () => {
    fetchStatus();
    if (activeTab === 0) {
      fetchProjects();
    } else if (activeTab === 2) {
      fetchClimateData();
    }
    if (selectedProject) {
      fetchPlots(selectedProject.id);
    }
    onRefresh && onRefresh();
  };

  const handleProjectSelect = project => {
    setSelectedProject(project);
  };

  const handleCreateForestNFT = async plot => {
    try {
      setLoading(true);
      const result = await axios.post('/api/openforis/blockchain/export', {
        dataType: 'PLOT',
        dataId: plot.id,
      });
      devLog(
        `Forest data exported to blockchain. Transaction ID: ${result.data.transactionId}`,
      );
      setLoading(false);
    } catch (error) {
      console.error('Error exporting to blockchain:', error);
      setLoading(false);
    }
  };

  const handleCreateClimateNFT = async climateDataItem => {
    try {
      setLoading(true);
      const result = await axios.post('/api/openforis/blockchain/export', {
        dataType: 'CLIMATE_DATA',
        dataId: climateDataItem.id,
      });
      devLog(
        `Climate data exported to blockchain. Transaction ID: ${result.data.transactionId}`,
      );
      setLoading(false);
    } catch (error) {
      console.error('Error exporting to blockchain:', error);
      setLoading(false);
    }
  };

  // Collect Earth tab content
  const renderCollectEarthTab = () => {
    return (
      <div style={{ marginTop: '1rem' }}>
        <h6 style={{ fontWeight: 'bold' }}>Forest Monitoring Projects</h6>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          Monitor forest cover changes and land use with Collect Earth data
        </p>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <h6 style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Projects</h6>
            <div style={{ maxHeight: '200px', overflow: 'auto' }}>
              {projects.length > 0 ? (
                projects.map(project => (
                  <div
                    key={project.id}
                    style={{ marginBottom: '0.5rem', padding: '0.5rem', background: 'var(--bg-tertiary)', borderRadius: '8px', cursor: 'pointer', border: selectedProject && selectedProject.id === project.id ? '1px solid var(--accent-primary, #3B82F6)' : '1px solid transparent' }}
                    onClick={() => handleProjectSelect(project)}
                  >
                    <div style={{ fontWeight: 'bold' }}>{project.name}</div>
                    <small style={{ color: 'var(--text-muted)' }}>
                      {project.region} &bull; {project.plotCount || 0} plots
                    </small>
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                  No projects found
                </div>
              )}
            </div>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <h6 style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Plots</h6>
            {selectedProject ? (
              <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                {projectPlots.length > 0 ? (
                  projectPlots.map(plot => (
                    <div key={plot.id} style={{ marginBottom: '0.5rem', padding: '0.5rem', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                      <div style={{ fontWeight: 'bold' }}>{plot.name}</div>
                      <div>
                        <small>
                          {plot.size} ha &bull; {plot.forestType}
                        </small>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                        <small style={{ color: 'var(--text-muted)' }}>
                          Carbon stock: {plot.carbonStock} tC/ha
                        </small>
                        <WrfButton
                          variant="outline"
                          size="sm"
                          onClick={() => handleCreateForestNFT(plot)}
                          disabled={loading}
                        >
                          Create NFT
                        </WrfButton>
                      </div>
                    </div>
                  ))
                ) : (
                  <WrfAlert severity="info">
                    No plots found for this project
                  </WrfAlert>
                )}
              </div>
            ) : (
              <WrfAlert severity="info">
                Select a project to view plots
              </WrfAlert>
            )}
          </Grid>
        </Grid>
      </div>
    );
  };

  // Earth Map tab content
  const renderEarthMapTab = () => {
    return (
      <div style={{ marginTop: '1rem' }}>
        <h6 style={{ fontWeight: 'bold' }}>Earth Map Analysis</h6>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          Satellite time-series analysis for environmental monitoring
        </p>

        <WrfAlert severity="info" sx={{ mb: 2 }}>
          Select a forest plot from the Collect Earth tab first to view Earth
          Map analysis
        </WrfAlert>

        {selectedProject && projectPlots.length > 0 && (
          <div>
            <h6 style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Available Analyses</h6>
            <Grid container spacing={2}>
              {projectPlots.slice(0, 4).map(plot => (
                <Grid size={{ xs: 12, md: 6 }} key={plot.id}>
                  <WrfCard>
                    <h6>{plot.name}</h6>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                      <WrfBadge color="primary">
                        NDVI Analysis
                      </WrfBadge>
                      <WrfBadge color="info">12 months</WrfBadge>
                    </div>
                    <p style={{ marginTop: '0.5rem' }}>
                      Forest cover change:{' '}
                      {(Math.random() * 2 - 1).toFixed(2)}%
                    </p>
                    <WrfButton variant="outline" size="sm" fullWidth sx={{ mt: 1 }}>
                      View Analysis
                    </WrfButton>
                  </WrfCard>
                </Grid>
              ))}
            </Grid>
          </div>
        )}
      </div>
    );
  };

  // Climate Data tab content
  const renderClimateDataTab = () => {
    return (
      <div style={{ marginTop: '1rem' }}>
        <h6 style={{ fontWeight: 'bold' }}>Climate Projections</h6>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          Climate models and projections for enhanced simulations
        </p>

        <Grid container spacing={2}>
          {climateData.length > 0 ? (
            climateData.slice(0, 8).map(data => (
              <Grid size={{ xs: 12, md: 6 }} key={data.id}>
                <WrfCard>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h6>{data.region}</h6>
                    <WrfBadge
                      color={
                        data.scenario === 'RCP2.6'
                          ? 'success'
                          : data.scenario === 'RCP4.5'
                            ? 'info'
                            : data.scenario === 'RCP6.0'
                              ? 'warning'
                              : 'error'
                      }
                    >
                      {data.scenario}
                    </WrfBadge>
                  </div>
                  <p style={{ marginTop: '0.5rem', marginBottom: '0.25rem' }}>
                    Time range: {data.timeRange}
                  </p>
                  <p style={{ marginBottom: '0.25rem' }}>
                    Resolution: {data.resolution}
                  </p>
                  <p style={{ marginBottom: '0.5rem' }}>
                    Model: {data.metadata?.model || 'CMIP6'}
                  </p>
                  <WrfButton
                    variant="outline"
                    size="sm"
                    fullWidth
                    onClick={() => handleCreateClimateNFT(data)}
                    disabled={loading}
                  >
                    Create Climate NFT
                  </WrfButton>
                </WrfCard>
              </Grid>
            ))
          ) : (
            <Grid size={{ xs: 12 }}>
              <WrfAlert severity="info">No climate data available</WrfAlert>
            </Grid>
          )}
        </Grid>
      </div>
    );
  };

  if (loading) {
    return (
      <WrfCard sx={{ height: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="openforis-spinner" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading OpenForis integration...</p>
        </div>
      </WrfCard>
    );
  }

  return (
    <WrfCard sx={{ height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
        <i className="fas fa-tree" style={{ color: 'var(--accent-green, #22C55E)', marginRight: '0.5rem' }}></i>
        <h5 style={{ margin: 0 }}>OpenForis Integration</h5>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.25rem' }}>
          <WrfBadge color={status?.initialized ? 'success' : 'error'}>
            {status?.initialized ? 'Connected' : 'Disconnected'}
          </WrfBadge>

          {status?.testMode && (
            <WrfBadge color="warning">Test Mode</WrfBadge>
          )}
        </div>
      </div>

      <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
        OpenForis environmental and climate data integration for enhanced
        Wrfcoin computational capabilities
      </p>

      {error && (
        <WrfAlert severity="error" sx={{ mb: 2 }}>
          {error}
        </WrfAlert>
      )}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <div style={{ background: 'var(--accent-green, #22C55E)', color: 'white', textAlign: 'center', padding: '0.5rem', borderRadius: '8px' }}>
            <h5 style={{ margin: 0 }}>{stats.projects}</h5>
            <small>Projects</small>
          </div>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <div style={{ background: 'var(--accent-info, #06B6D4)', color: 'white', textAlign: 'center', padding: '0.5rem', borderRadius: '8px' }}>
            <h5 style={{ margin: 0 }}>{stats.plots}</h5>
            <small>Plots</small>
          </div>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <div style={{ background: 'var(--accent-amber, #F59E0B)', color: 'white', textAlign: 'center', padding: '0.5rem', borderRadius: '8px' }}>
            <h5 style={{ margin: 0 }}>{stats.timeSeries}</h5>
            <small>Time Series</small>
          </div>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <div style={{ background: 'var(--accent-red, #EF4444)', color: 'white', textAlign: 'center', padding: '0.5rem', borderRadius: '8px' }}>
            <h5 style={{ margin: 0 }}>{stats.climateData}</h5>
            <small>Climate Models</small>
          </div>
        </Grid>
      </Grid>

      <hr style={{ marginBottom: '1rem' }} />

      <div className="openforis-tabs" style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--border-default, #334155)', marginBottom: '1rem' }}>
        <button
          className={`openforis-tab ${activeTab === 0 ? 'active' : ''}`}
          onClick={e => {
            e.preventDefault();
            handleTabChange(e, 0);
          }}
          style={{ padding: '0.5rem 1rem', border: 'none', background: activeTab === 0 ? 'var(--bg-tertiary)' : 'transparent', borderBottom: activeTab === 0 ? '2px solid var(--accent-primary, #3B82F6)' : '2px solid transparent', cursor: 'pointer', color: activeTab === 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}
        >
          <i className="fas fa-tree" style={{ marginRight: '0.25rem' }}></i> Collect Earth
        </button>
        <button
          className={`openforis-tab ${activeTab === 1 ? 'active' : ''}`}
          onClick={e => {
            e.preventDefault();
            handleTabChange(e, 1);
          }}
          style={{ padding: '0.5rem 1rem', border: 'none', background: activeTab === 1 ? 'var(--bg-tertiary)' : 'transparent', borderBottom: activeTab === 1 ? '2px solid var(--accent-primary, #3B82F6)' : '2px solid transparent', cursor: 'pointer', color: activeTab === 1 ? 'var(--text-primary)' : 'var(--text-muted)' }}
        >
          <i className="fas fa-globe" style={{ marginRight: '0.25rem' }}></i> Earth Map
        </button>
        <button
          className={`openforis-tab ${activeTab === 2 ? 'active' : ''}`}
          onClick={e => {
            e.preventDefault();
            handleTabChange(e, 2);
          }}
          style={{ padding: '0.5rem 1rem', border: 'none', background: activeTab === 2 ? 'var(--bg-tertiary)' : 'transparent', borderBottom: activeTab === 2 ? '2px solid var(--accent-primary, #3B82F6)' : '2px solid transparent', cursor: 'pointer', color: activeTab === 2 ? 'var(--text-primary)' : 'var(--text-muted)' }}
        >
          <i className="fas fa-cloud" style={{ marginRight: '0.25rem' }}></i> Climate Data
        </button>
      </div>

      {activeTab === 0 && renderCollectEarthTab()}
      {activeTab === 1 && renderEarthMapTab()}
      {activeTab === 2 && renderClimateDataTab()}
    </WrfCard>
  );
};

export default OpenForisCard;
