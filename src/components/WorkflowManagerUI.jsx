import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { WrfCard } from './DesignSystem';
import './WorkflowManagerUI.css';

const WorkflowManagerUI = () => {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(null);
  const [workflows, setWorkflows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingCategory, setUpdatingCategory] = useState(null);
  const [updatingWorkflow, setUpdatingWorkflow] = useState(null);
  const [restarting, setRestarting] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(null);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileDesc, setNewProfileDesc] = useState('');

  // Map workflows to categories for easier lookup
  const workflowCategoryMap = {
    'Wrfcoin Core': 'core',
    'Database Push': 'storage',
    'API Server': 'network',
    'WebSocket Server': 'network',
    'Mainnet Mode': 'core',
    'Seed Achievements': 'incentives',
    'Generate Schema': 'storage',
    'Test Incentives': 'incentives',
    'Test PoP': 'consensus',
    'Test Privacy': 'privacy',
    'Test Privacy Features': 'privacy',
    'Test Computational DB': 'computational',
    'Test DB Push': 'storage',
    'Test DB Migration': 'storage',
    'Test TypeScript DB': 'computational',
    'Test Fixed Database': 'storage',
    'DB Migrate': 'storage',
    'Create Migration': 'storage',
    'Test IoT Devices': 'weather',
    'Test Cross-Chain': 'crosschain',
    'Test Cross-Chain Integration': 'crosschain',
    'Test Cross-Chain Providers': 'crosschain',
    'Test Achievements': 'incentives',
    'Test Axelar': 'crosschain',
    'Axelar Schema Push': 'crosschain',
    'Test Wormhole': 'crosschain',
    'Test Akash Network': 'computational',
    'Test Near Protocol': 'crosschain',
    'Test Bittensor': 'computational',
    'Test Arweave': 'storage',
    'Seed Governance': 'governance',
    'Test Bacalhau': 'computational',
    'Test Computational Blocks': 'computational',
    'Create Data-Aware Blocks Migration': 'computational',
    'Test Golem': 'computational',
    'Test Storj': 'storage',
    'Test OGC': 'weather',
    'Test BigchainDB': 'storage',
    'Test TTN': 'weather',
    'Test FOAM': 'weather',
    'Test Streamr': 'weather',
    'Test Weather Data Validation': 'weather',
    'Test Weather Station Protocol': 'weather',
    'Test Forecast Compute Node': 'computational',
    'Test Storage Keeper Node': 'storage',
    'Test Validator Node': 'consensus',
    'Test Light Client': 'network',
    'Test Sensor.Community': 'weather',
    'Test SONM': 'computational',
    'Seed Rewards': 'incentives',
    'Seed Validators': 'consensus',
    'Test Luftdaten': 'weather',
    'Test TatauCloud': 'computational',
    'Test Governance': 'governance',
    'Setup Governance DB': 'governance',
    'Setup Wolfram DB': 'oracle',
    'Oracle Schema Migration': 'oracle',
    'Test Workflow Categories': 'core',
    'Test Smart Contract Security': 'security',
    'Test Governance Security': 'governance',
    'Test Weather Parsers': 'weather',
    'Test Slashing Mechanism': 'consensus',
    'Test Sidechain': 'sidechain',
    'Test SDK': 'core',
    'Test SDK Cross-Chain': 'crosschain',
    'Test Governance System': 'governance',
    'Test LayerZero': 'crosschain',
  };

  const filteredWorkflows = useMemo(() => {
    return workflows.filter(workflow => {
      const nameMatch = workflow.name
        .toLowerCase()
        .includes(filterText.toLowerCase());
      const statusMatch =
        statusFilter === 'all' ||
        workflow.status.toLowerCase() === statusFilter.toLowerCase();
      return nameMatch && statusMatch;
    });
  }, [workflows, filterText, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch module configuration
      const configResponse = await axios.get('/api/module-controller/config');
      setConfig(configResponse.data.config);

      // Fetch workflow statuses
      const workflowsResponse = await axios.get(
        '/api/module-controller/workflows',
      );
      setWorkflows(workflowsResponse.data.workflows);

      // Fetch category information
      const categoriesResponse = await axios.get(
        '/api/module-controller/categories',
      );
      setCategories(categoriesResponse.data.categories);

      // Fetch saved profiles
      const profilesResponse = await axios.get(
        '/api/module-controller/profiles',
      );
      setProfiles(profilesResponse.data.profiles);
    } catch (error) {
      console.error('Error fetching workflow manager data:', error);
      // Note: This component doesn't have toast notifications - could be added later
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = async (categoryName, enabled) => {
    setUpdatingCategory(categoryName);
    try {
      await axios.post('/api/module-controller/toggle-category', {
        category: categoryName,
        enabled,
      });

      // Update local state
      setCategories(prev =>
        prev.map(category => {
          if (category.name === categoryName) {
            return {
              ...category,
              status: enabled ? 'active' : 'inactive',
              enabledCount: enabled ? category.totalCount : 0,
            };
          }
          return category;
        }),
      );

      // Update affected workflows
      setWorkflows(prev =>
        prev.map(workflow => {
          if (getWorkflowCategory(workflow.name) === categoryName) {
            return {
              ...workflow,
              enabled,
              status: enabled ? 'running' : 'stopped',
            };
          }
          return workflow;
        }),
      );
    } catch (error) {
      console.error(`Error toggling category ${categoryName}:`, error);
    } finally {
      setUpdatingCategory(null);
    }
  };

  const toggleWorkflow = async (workflowName, enabled) => {
    setUpdatingWorkflow(workflowName);
    try {
      if (enabled) {
        await axios.post('/api/module-controller/enable', {
          module: getWorkflowCategory(workflowName),
        });
      } else {
        await axios.post('/api/module-controller/disable', {
          module: getWorkflowCategory(workflowName),
        });
      }

      // Update local state
      setWorkflows(prev =>
        prev.map(workflow => {
          if (workflow.name === workflowName) {
            return {
              ...workflow,
              enabled,
              status: enabled ? 'running' : 'stopped',
            };
          }
          return workflow;
        }),
      );

      // Update category state if needed
      updateCategoryStatusAfterWorkflowToggle(
        getWorkflowCategory(workflowName),
      );
    } catch (error) {
      console.error(`Error toggling workflow ${workflowName}:`, error);
    } finally {
      setUpdatingWorkflow(null);
    }
  };

  const updateCategoryStatusAfterWorkflowToggle = categoryName => {
    setCategories(prev =>
      prev.map(category => {
        if (category.name === categoryName) {
          // Count enabled workflows in this category
          const categoryWorkflows = workflows.filter(
            w => getWorkflowCategory(w.name) === categoryName,
          );
          const enabledCount = categoryWorkflows.filter(w => w.enabled).length;

          // Update category status
          let status;
          if (enabledCount === 0) {
            status = 'inactive';
          } else if (enabledCount === categoryWorkflows.length) {
            status = 'active';
          } else {
            status = 'partial';
          }

          return {
            ...category,
            status,
            enabledCount,
          };
        }
        return category;
      }),
    );
  };

  const restartAll = async () => {
    setRestarting(true);
    try {
      await axios.post('/api/module-controller/restart');

      // Refresh data after restart
      await fetchData();
    } catch (error) {
      console.error('Error restarting workflows:', error);
    } finally {
      setRestarting(false);
    }
  };

  const saveProfile = async () => {
    if (!newProfileName) return;

    setSavingProfile(true);
    try {
      await axios.post('/api/module-controller/save-profile', {
        name: newProfileName,
        description: newProfileDesc,
      });

      // Refresh profiles
      const profilesResponse = await axios.get(
        '/api/module-controller/profiles',
      );
      setProfiles(profilesResponse.data.profiles);

      // Clear inputs
      setNewProfileName('');
      setNewProfileDesc('');
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSavingProfile(false);
    }
  };

  const loadProfile = async profileName => {
    setLoadingProfile(profileName);
    try {
      await axios.post('/api/module-controller/load-profile', {
        name: profileName,
      });

      // Refresh data after loading profile
      await fetchData();
    } catch (error) {
      console.error(`Error loading profile ${profileName}:`, error);
    } finally {
      setLoadingProfile(null);
    }
  };

  const formatCategoryName = name => {
    // Convert camelCase or snake_case to Title Case
    return name
      .replace(/([A-Z])/g, ' $1') // Insert space before capital letters
      .replace(/_/g, ' ') // Replace underscores with spaces
      .replace(/^./, str => str.toUpperCase()); // Capitalize first letter
  };

  const getStatusClass = status => {
    status = status.toLowerCase();
    if (status === 'running') return 'active';
    if (status === 'stopped') return 'inactive';
    if (status === 'failed') return 'error';
    return 'partial';
  };

  const getWorkflowCategory = workflowName => {
    return workflowCategoryMap[workflowName] || 'other';
  };

  const formatDate = dateString => {
    if (!dateString) return 'N/A';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      return dateString;
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="workflow-manager">
        <h2>Workflow Manager</h2>
        <p className="description">
          Enable or disable Wrfcoin Core components to optimize performance and
          customize your development environment.
        </p>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading modules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="workflow-manager">
      <h2>Workflow Manager</h2>
      <p className="description">
        Enable or disable Wrfcoin Core components to optimize performance and
        customize your development environment.
      </p>

      {/* Module Categories Section */}
      <div className="categories-section">
        <h3>Module Categories</h3>
        <div className="category-cards">
          {categories.map(category => (
            <WrfCard
              key={category.name}
              className={`category-card ${category.status}`}
              headerTitle={formatCategoryName(category.name)}
              headerAction={
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    id={`category-${category.name}`}
                    checked={category.status !== 'inactive'}
                    onChange={e =>
                      toggleCategory(category.name, e.target.checked)
                    }
                    disabled={loading || updatingCategory === category.name}
                  />
                  <label htmlFor={`category-${category.name}`}></label>
                </div>
              }
            >
              <div className="status-indicator">
                <span className={`status-dot ${category.status}`}></span>
                <span className="status-text">{category.status}</span>
              </div>
              <div className="workflow-count">
                <span>
                  {category.enabledCount}/{category.totalCount} workflows
                  enabled
                </span>
              </div>
            </WrfCard>
          ))}
        </div>
      </div>

      {/* Individual Workflows Section */}
      <div className="workflows-section">
        <h3>Individual Workflows</h3>
        <div className="filter-controls">
          <input
            type="text"
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            placeholder="Filter workflows..."
            className="filter-input"
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="status-select"
          >
            <option value="all">All Statuses</option>
            <option value="running">Running</option>
            <option value="stopped">Stopped</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div className="workflow-table-container">
          <table className="workflow-table">
            <thead>
              <tr>
                <th>Workflow Name</th>
                <th>Status</th>
                <th>Category</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkflows.map(workflow => (
                <tr key={workflow.name}>
                  <td>{workflow.name}</td>
                  <td>
                    <span className="status-indicator">
                      <span
                        className={`status-dot ${getStatusClass(workflow.status)}`}
                      ></span>
                      <span className="status-text">{workflow.status}</span>
                    </span>
                  </td>
                  <td>{getWorkflowCategory(workflow.name)}</td>
                  <td>
                    <div className="toggle-switch small">
                      <input
                        type="checkbox"
                        id={`workflow-${workflow.name}`}
                        checked={workflow.enabled}
                        onChange={e =>
                          toggleWorkflow(workflow.name, e.target.checked)
                        }
                        disabled={loading || updatingWorkflow === workflow.name}
                      />
                      <label htmlFor={`workflow-${workflow.name}`}></label>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredWorkflows.length === 0 && (
                <tr>
                  <td colSpan="4" className="no-results">
                    No workflows match your filter criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Configuration Profiles Section */}
      <div className="profiles-section">
        <h3>Configuration Profiles</h3>
        <div className="profiles-controls">
          <div className="save-profile">
            <input
              type="text"
              value={newProfileName}
              onChange={e => setNewProfileName(e.target.value)}
              placeholder="Profile name"
              className="profile-input"
            />
            <input
              type="text"
              value={newProfileDesc}
              onChange={e => setNewProfileDesc(e.target.value)}
              placeholder="Description (optional)"
              className="profile-input"
            />
            <button
              onClick={saveProfile}
              disabled={!newProfileName || savingProfile}
              className="btn save-btn"
            >
              {savingProfile ? 'Saving...' : 'Save Current Config'}
            </button>
          </div>

          {profiles.length > 0 && (
            <div className="profile-list">
              <h4>Saved Profiles</h4>
              <div className="profile-cards">
                {profiles.map(profile => (
                  <div key={profile.name} className="profile-card">
                    <div className="profile-header">
                      <span className="profile-name">{profile.name}</span>
                      <span className="profile-date">
                        {formatDate(profile.createdAt)}
                      </span>
                    </div>
                    <div className="profile-body">
                      <p className="profile-desc">
                        {profile.description || 'No description'}
                      </p>
                    </div>
                    <div className="profile-footer">
                      <button
                        onClick={() => loadProfile(profile.name)}
                        disabled={loadingProfile === profile.name}
                        className="btn load-btn"
                      >
                        {loadingProfile === profile.name
                          ? 'Loading...'
                          : 'Load Profile'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions Section */}
      <div className="actions-section">
        <button
          onClick={restartAll}
          disabled={restarting}
          className="btn restart-btn"
        >
          {restarting ? 'Restarting...' : 'Restart All Workflows'}
        </button>
      </div>
    </div>
  );
};

export default WorkflowManagerUI;
