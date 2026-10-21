import React, { useState, useEffect } from 'react';

import { CircularProgress, Alert, Snackbar } from '@mui/material';
import axios from 'axios';

import './Settings.css';
import { devLog } from '../../utils/logger';

const IntegrationsPage = () => {
  const [integrations, setIntegrations] = useState({
    oracles: [
      { id: 'chainlink', name: 'Chainlink', enabled: true },
      { id: 'pyth', name: 'Pyth Network', enabled: true },
      { id: 'api3', name: 'API3', enabled: false },
    ],
    compute: [
      { id: 'akash', name: 'Akash Network', enabled: true },
      { id: 'bacalhau', name: 'Bacalhau', enabled: true },
      { id: 'render', name: 'Render Network', enabled: false },
      { id: 'golem', name: 'Golem', enabled: true },
      { id: 'icp', name: 'Internet Computer', enabled: false },
    ],
    storage: [
      { id: 'ipfs', name: 'IPFS', enabled: true },
      { id: 'arweave', name: 'Arweave', enabled: false },
      { id: 'filecoin', name: 'Filecoin', enabled: false },
      { id: 'storj', name: 'Storj', enabled: true },
    ],
    crossChain: [
      { id: 'polkadot', name: 'Polkadot/Substrate', enabled: true },
      { id: 'near', name: 'NEAR Protocol', enabled: false },
      { id: 'axelar', name: 'Axelar', enabled: true },
      { id: 'layerzero', name: 'LayerZero', enabled: true },
    ],
    iot: [
      { id: 'helium', name: 'Helium', enabled: false },
      { id: 'sensor-community', name: 'Sensor.Community', enabled: true },
      { id: 'ttn', name: 'The Things Network', enabled: false },
      { id: 'foam', name: 'FOAM Protocol', enabled: true },
    ],
  });

  // New state for workflow management
  const [workflows, setWorkflows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [configProfiles, setConfigProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Fetch workflow data on component mount
  useEffect(() => {
    const fetchWorkflowData = async () => {
      try {
        setLoading(true);

        // Fetch workflows
        const workflowsResponse = await axios.get('/api/modules/workflows');
        // Ensure workflows is always an array
        if (workflowsResponse.data && workflowsResponse.data.data) {
          // Handle nested data structure
          setWorkflows(
            Array.isArray(workflowsResponse.data.data)
              ? workflowsResponse.data.data
              : [],
          );
        } else {
          // Handle flat data structure
          setWorkflows(
            Array.isArray(workflowsResponse.data) ? workflowsResponse.data : [],
          );
        }

        // Fetch categories
        const categoriesResponse = await axios.get('/api/modules/categories');
        // Ensure categories is always an array
        if (categoriesResponse.data && categoriesResponse.data.data) {
          // Handle nested data structure
          setCategories(
            Array.isArray(categoriesResponse.data.data)
              ? categoriesResponse.data.data
              : [],
          );
        } else {
          // Handle flat data structure
          setCategories(
            Array.isArray(categoriesResponse.data)
              ? categoriesResponse.data
              : [],
          );
        }

        // Fetch config profiles
        const profilesResponse = await axios.get('/api/modules/profiles');
        // The API returns profiles in the data property
        setConfigProfiles(
          profilesResponse.data && Array.isArray(profilesResponse.data.data)
            ? profilesResponse.data.data
            : Array.isArray(profilesResponse.data)
              ? profilesResponse.data
              : [],
        );

        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch workflow data:', err);
        setError(
          'Failed to load workflow configuration data. Please try again.',
        );
        setLoading(false);
      }
    };

    fetchWorkflowData();
  }, []);

  // Handle integration toggles (original functionality)
  const handleToggle = (category, id) => {
    setIntegrations({
      ...integrations,
      [category]: integrations[category].map(item =>
        item.id === id ? { ...item, enabled: !item.enabled } : item,
      ),
    });
  };

  const handleCategoryToggle = (category, enabled) => {
    setIntegrations({
      ...integrations,
      [category]: integrations[category].map(item => ({ ...item, enabled })),
    });
  };

  // New handlers for workflow management
  const handleWorkflowToggle = async workflowName => {
    try {
      const workflow = workflows.find(w => w.name === workflowName);

      if (workflow.enabled) {
        await axios.post(`/api/modules/${workflowName}/disable`);
      } else {
        await axios.post(`/api/modules/${workflowName}/enable`);
      }

      // Update local state to reflect the change
      setWorkflows(
        workflows.map(w =>
          w.name === workflowName ? { ...w, enabled: !w.enabled } : w,
        ),
      );

      setSnackbar({
        open: true,
        message: `Workflow ${workflowName} ${workflow.enabled ? 'disabled' : 'enabled'} successfully`,
        severity: 'success',
      });
    } catch (err) {
      console.error('Failed to toggle workflow:', err);
      setSnackbar({
        open: true,
        message: `Failed to toggle workflow ${workflowName}`,
        severity: 'error',
      });
    }
  };

  const handleCategoryWorkflowToggle = async (category, enabled) => {
    try {
      await axios.post(
        `/api/modules/categories/${category}/${enabled ? 'enable' : 'disable'}`,
      );

      // Update local state to reflect changes
      setCategories(
        categories.map(cat =>
          cat.name === category ? { ...cat, enabled } : cat,
        ),
      );

      // Also update the individual workflows in this category
      setWorkflows(
        workflows.map(workflow =>
          workflow.category === category ? { ...workflow, enabled } : workflow,
        ),
      );

      setSnackbar({
        open: true,
        message: `${category} workflows ${enabled ? 'enabled' : 'disabled'} successfully`,
        severity: 'success',
      });
    } catch (err) {
      console.error('Failed to toggle category:', err);
      setSnackbar({
        open: true,
        message: `Failed to toggle ${category} category`,
        severity: 'error',
      });
    }
  };

  const handleLoadProfile = async () => {
    if (!selectedProfile) return;

    try {
      await axios.post(`/api/modules/profiles/${selectedProfile}`);

      // Refresh data after loading profile
      const workflowsResponse = await axios.get('/api/modules/workflows');
      // Process workflows response with the same logic as the initial load
      if (workflowsResponse.data && workflowsResponse.data.data) {
        // Handle nested data structure
        setWorkflows(
          Array.isArray(workflowsResponse.data.data)
            ? workflowsResponse.data.data
            : [],
        );
      } else {
        // Handle flat data structure
        setWorkflows(
          Array.isArray(workflowsResponse.data) ? workflowsResponse.data : [],
        );
      }

      const categoriesResponse = await axios.get('/api/modules/categories');

      // Process categories response with the same logic as the initial load
      if (categoriesResponse.data && categoriesResponse.data.data) {
        // Handle nested data structure
        setCategories(
          Array.isArray(categoriesResponse.data.data)
            ? categoriesResponse.data.data
            : [],
        );
      } else {
        // Handle flat data structure
        setCategories(
          Array.isArray(categoriesResponse.data) ? categoriesResponse.data : [],
        );
      }

      // Show success message first
      setSnackbar({
        open: true,
        message: `Profile ${selectedProfile} loaded successfully`,
        severity: 'success',
      });

      // Then reload the page after a brief delay to allow snackbar to be seen
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error('Failed to load profile:', err);
      setSnackbar({
        open: true,
        message: `Failed to load profile ${selectedProfile}`,
        severity: 'error',
      });
    }
  };

  const handleSaveProfile = async () => {
    const profileName = prompt('Enter a name for this configuration profile:');
    if (!profileName) return;

    const profileDescription = prompt(
      'Enter a description for this profile (optional):',
    );

    try {
      await axios.post('/api/modules/profiles', {
        name: profileName,
        description: profileDescription || '',
      });

      // Refresh profiles after saving
      const profilesResponse = await axios.get('/api/modules/profiles');
      setConfigProfiles(profilesResponse.data);

      setSnackbar({
        open: true,
        message: `Profile ${profileName} saved successfully`,
        severity: 'success',
      });
    } catch (err) {
      console.error('Failed to save profile:', err);
      setSnackbar({
        open: true,
        message: `Failed to save profile ${profileName}`,
        severity: 'error',
      });
    }
  };

  const handleRestartWorkflows = async () => {
    try {
      await axios.post('/api/modules/restart');

      setSnackbar({
        open: true,
        message: 'Workflows restarted successfully',
        severity: 'success',
      });
    } catch (err) {
      console.error('Failed to restart workflows:', err);
      setSnackbar({
        open: true,
        message: 'Failed to restart workflows',
        severity: 'error',
      });
    }
  };

  const handleSubmit = e => {
    e.preventDefault();
    // Save integration settings - in a real app, this would connect to an API
    devLog('Saving integration settings:', integrations);
    setSnackbar({
      open: true,
      message: 'Integration settings saved successfully',
      severity: 'success',
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const renderIntegrationsCategory = (title, category, items) => (
    <div className="settings-section" key={category}>
      <div className="settings-section-header">
        <h3>{title}</h3>
        <div className="category-actions">
          <button
            className="btn-enable-all"
            onClick={() => handleCategoryToggle(category, true)}
          >
            Enable All
          </button>
          <button
            className="btn-disable-all"
            onClick={() => handleCategoryToggle(category, false)}
          >
            Disable All
          </button>
        </div>
      </div>

      <div className="integrations-grid">
        <table className="integration-table">
          <thead className="integration-table-header">
            <tr>
              <th>Integration</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr className="integration-row" key={item.id}>
                <td className="integration-title-cell">
                  <div className="integration-title">{item.name}</div>
                </td>
                <td className="integration-status-cell">
                  <div className="status-text">
                    <span
                      className={`status-indicator ${item.enabled ? 'active' : 'inactive'}`}
                    ></span>
                    {item.enabled ? 'Enabled' : 'Disabled'}
                  </div>
                </td>
                <td className="integration-actions-cell">
                  <div className="integration-actions">
                    <button className="action-btn configure-btn">
                      Configure
                    </button>
                    <button
                      className={`action-btn toggle-btn ${item.enabled ? 'disable-btn' : 'enable-btn'}`}
                      onClick={() => handleToggle(category, item.id)}
                    >
                      {item.enabled ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderWorkflowCategory = category => {
    const categoryWorkflows = workflows.filter(
      workflow => workflow.category === category.name,
    );

    if (categoryWorkflows.length === 0) {
      return null;
    }

    return (
      <div className="settings-section" key={category.name}>
        <div className="settings-section-header">
          <h3>{category.name}</h3>
          <div className="category-actions">
            <button
              className="btn-enable-all"
              onClick={() => handleCategoryWorkflowToggle(category.name, true)}
            >
              Enable All
            </button>
            <button
              className="btn-disable-all"
              onClick={() => handleCategoryWorkflowToggle(category.name, false)}
            >
              Disable All
            </button>
          </div>
        </div>

        <div className="integrations-grid">
          <table className="integration-table">
            <thead className="integration-table-header">
              <tr>
                <th>Workflow</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categoryWorkflows.map(workflow => (
                <tr className="integration-row" key={workflow.name}>
                  <td className="integration-title-cell">
                    <div className="integration-title">
                      {workflow.name}
                      {workflow.description && (
                        <span
                          className="size-indicator"
                          title={workflow.description}
                        >
                          {workflow.description.length > 50
                            ? `${workflow.description.substring(0, 50)}...`
                            : workflow.description}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="integration-status-cell">
                    <div className="status-text">
                      <span
                        className={`status-indicator ${workflow.status === 'running' ? 'active' : workflow.status === 'failed' ? 'inactive' : 'pending'}`}
                      ></span>
                      <span>{workflow.status || 'Unknown'}</span>
                      {workflow.status === 'not_started' && (
                        <span className="sleeping-status"> (Sleeping)</span>
                      )}
                    </div>
                  </td>
                  <td className="integration-actions-cell">
                    <div className="integration-actions">
                      <button
                        className={`action-btn toggle-btn ${workflow.enabled ? 'disable-btn' : 'enable-btn'}`}
                        onClick={() => handleWorkflowToggle(workflow.name)}
                      >
                        {workflow.enabled ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="settings-content loading-container">
        <CircularProgress />
        <p>Loading Wrfcoin Core configuration...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="settings-content">
        <Alert severity="error">{error}</Alert>
        <button
          className="retry-button"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="settings-content">
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert severity={snackbar.severity} onClose={handleCloseSnackbar}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <div className="settings-section">
        <h2>Wrfcoin Core Workflow Management</h2>
        <p>
          Optimize your development environment by enabling or disabling
          blockchain components as needed.
        </p>

        <div className="profile-management">
          <div className="profile-selector">
            <label>Configuration Profiles:</label>
            <select
              value={selectedProfile}
              onChange={e => setSelectedProfile(e.target.value)}
            >
              <option value="">Select a profile</option>
              {configProfiles.map(profile => (
                <option key={profile.name} value={profile.name}>
                  {profile.name}
                </option>
              ))}
            </select>
            <button
              className="profile-button"
              onClick={handleLoadProfile}
              disabled={!selectedProfile}
            >
              Load Profile
            </button>
          </div>
          <div className="profile-actions">
            <button className="save-profile-button" onClick={handleSaveProfile}>
              Save Current Configuration as Profile
            </button>
            <button className="restart-button" onClick={handleRestartWorkflows}>
              Restart All Workflows
            </button>
          </div>
        </div>

        <div className="workflow-dashboard">
          {categories.map(category => renderWorkflowCategory(category))}
        </div>
      </div>

      <div className="settings-section">
        <h2>External Integrations Settings</h2>
        <p>
          Enable or disable integrations with a single click. Toggle entire
          categories or individual integrations.
        </p>

        <form className="settings-form" onSubmit={handleSubmit}>
          {renderIntegrationsCategory(
            'Oracle Networks',
            'oracles',
            integrations.oracles,
          )}
          {renderIntegrationsCategory(
            'Compute Networks',
            'compute',
            integrations.compute,
          )}
          {renderIntegrationsCategory(
            'Storage Solutions',
            'storage',
            integrations.storage,
          )}
          {renderIntegrationsCategory(
            'Cross-Chain Bridges',
            'crossChain',
            integrations.crossChain,
          )}
          {renderIntegrationsCategory('IoT Networks', 'iot', integrations.iot)}

          <div className="settings-action-buttons">
            <button type="submit" className="save-button">
              Save Integration Settings
            </button>
            <button type="button" className="cancel-button">
              Reset to Defaults
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IntegrationsPage;
