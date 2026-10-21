import React, { useState, useEffect } from 'react';

import axios from 'axios';

import './WorkflowIntegration.css';

const WorkflowIntegration = ({ nftId, nftDetails }) => {
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [workflows, setWorkflows] = useState([]);
  const [linkedWorkflows, setLinkedWorkflows] = useState([]);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [triggerType, setTriggerType] = useState('manual');
  const [triggerEvents, setTriggerEvents] = useState([]);
  const [schedule, setSchedule] = useState('');

  // Fetch n8n status and workflows on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get n8n connection status
        const statusResponse = await axios.get('/api/n8n/status');
        setConnectionStatus(statusResponse.data);

        if (statusResponse.data.connected) {
          // Get available workflows
          const workflowsResponse = await axios.get('/api/n8n/workflows');
          setWorkflows(workflowsResponse.data);

          // Get workflows linked to this NFT
          const linkedWorkflowsResponse = await axios.get(
            `/api/n8n/nft/${nftId}/workflows`,
          );
          setLinkedWorkflows(linkedWorkflowsResponse.data);
        }
      } catch (error) {
        console.error('Error fetching n8n data:', error);
        setErrorMessage(
          'Failed to load n8n integration data. Please try again later.',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [nftId]);

  const handleLinkWorkflow = async e => {
    e.preventDefault();

    if (!selectedWorkflow) {
      setErrorMessage('Please select a workflow to link');
      return;
    }

    try {
      setLoading(true);

      const workflowData = {
        workflowId: selectedWorkflow,
        triggerType,
        triggerEvents: triggerEvents.length > 0 ? triggerEvents : undefined,
        schedule: schedule || undefined,
      };

      const response = await axios.post(
        `/api/n8n/nft/${nftId}/workflows`,
        workflowData,
      );

      // Add the newly linked workflow to the list
      setLinkedWorkflows([...linkedWorkflows, response.data]);

      // Reset form
      setSelectedWorkflow(null);
      setTriggerType('manual');
      setTriggerEvents([]);
      setSchedule('');
      setShowLinkForm(false);

      // Show success message
      setSuccessMessage('Workflow linked successfully');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Error linking workflow:', error);
      setErrorMessage('Failed to link workflow. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkWorkflow = async workflowId => {
    try {
      setLoading(true);

      await axios.delete(`/api/n8n/nft/${nftId}/workflows/${workflowId}`);

      // Remove the unlinked workflow from the list
      setLinkedWorkflows(
        linkedWorkflows.filter(wf => wf.workflowId !== workflowId),
      );

      // Show success message
      setSuccessMessage('Workflow unlinked successfully');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Error unlinking workflow:', error);
      setErrorMessage('Failed to unlink workflow. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteWorkflow = async workflowId => {
    try {
      setLoading(true);

      const response = await axios.post(
        `/api/n8n/nft/${nftId}/workflows/${workflowId}/execute`,
      );

      // Update the link's last run timestamp
      const updatedLinks = linkedWorkflows.map(link => {
        if (link.workflowId === workflowId) {
          return { ...link, lastRun: new Date().toISOString() };
        }
        return link;
      });

      setLinkedWorkflows(updatedLinks);

      // Show success message
      setSuccessMessage('Workflow executed successfully');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Error executing workflow:', error);
      setErrorMessage('Failed to execute workflow. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerTypeChange = e => {
    const newTriggerType = e.target.value;
    setTriggerType(newTriggerType);

    // Reset related fields
    if (newTriggerType === 'manual') {
      setTriggerEvents([]);
      setSchedule('');
    }
  };

  const handleTriggerEventToggle = event => {
    if (triggerEvents.includes(event)) {
      setTriggerEvents(triggerEvents.filter(e => e !== event));
    } else {
      setTriggerEvents([...triggerEvents, event]);
    }
  };

  // If still loading data
  if (loading && !connectionStatus) {
    return (
      <div className="workflows-loading">
        <div className="spinner"></div>
        <p>Loading n8n integration...</p>
      </div>
    );
  }

  // If n8n is not connected
  if (!connectionStatus?.connected) {
    return (
      <div className="not-connected">
        <h3>n8n Integration Not Available</h3>
        <p>The connection to n8n workflow engine could not be established.</p>
        <p>
          Please configure the n8n integration in your settings to enable
          workflow automation for your NFTs.
        </p>
        <a href="/settings/integrations" className="configure-link">
          Configure n8n Integration
        </a>
      </div>
    );
  }

  return (
    <div className="workflows-container">
      <div
        className={`n8n-status ${connectionStatus?.connected ? 'connected' : 'disconnected'}`}
      >
        <div className="status-indicator"></div>
        <span className="status-text">
          {connectionStatus?.connected
            ? 'Connected to n8n'
            : 'Not connected to n8n'}
        </span>
        <span className="status-url">{connectionStatus?.baseUrl}</span>
      </div>

      {errorMessage && (
        <div className="error-message">
          {errorMessage}
          <button className="dismiss-btn" onClick={() => setErrorMessage(null)}>
            Dismiss
          </button>
        </div>
      )}

      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}

      <div className="workflows-content">
        <div className="workflows-section">
          <h3>Linked Workflows</h3>

          {linkedWorkflows.length === 0 ? (
            <div className="no-workflows">
              <p>No workflows linked to this NFT yet</p>
            </div>
          ) : (
            <div className="linked-workflows-list">
              {linkedWorkflows.map(link => (
                <div key={link.id} className="workflow-item">
                  <div className="workflow-header">
                    <h4>{link.name}</h4>
                    <div className="workflow-actions">
                      <button
                        className="run-btn"
                        onClick={() => handleExecuteWorkflow(link.workflowId)}
                      >
                        Run
                      </button>
                      <button
                        className="unlink-btn"
                        onClick={() => handleUnlinkWorkflow(link.workflowId)}
                      >
                        Unlink
                      </button>
                    </div>
                  </div>
                  <div className="workflow-details">
                    <p>Trigger: {link.triggerType}</p>
                    {link.lastRun && (
                      <p>Last Run: {new Date(link.lastRun).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!showLinkForm && (
            <button
              className="submit-btn"
              style={{ marginTop: '1rem' }}
              onClick={() => setShowLinkForm(true)}
            >
              Link New Workflow
            </button>
          )}
        </div>

        {showLinkForm ? (
          <div className="workflows-section">
            <h3>Link a Workflow</h3>
            <form className="link-workflow-form" onSubmit={handleLinkWorkflow}>
              <div className="form-group">
                <label htmlFor="workflow">Select Workflow</label>
                <select
                  id="workflow"
                  value={selectedWorkflow || ''}
                  onChange={e => setSelectedWorkflow(e.target.value)}
                  required
                >
                  <option value="">-- Select a workflow --</option>
                  {workflows.map(workflow => (
                    <option
                      key={workflow.id}
                      value={workflow.id}
                      disabled={linkedWorkflows.some(
                        link => link.workflowId === workflow.id,
                      )}
                    >
                      {workflow.name}{' '}
                      {linkedWorkflows.some(
                        link => link.workflowId === workflow.id,
                      )
                        ? '(Already Linked)'
                        : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="triggerType">Trigger Type</label>
                <select
                  id="triggerType"
                  value={triggerType}
                  onChange={handleTriggerTypeChange}
                  required
                >
                  <option value="manual">Manual</option>
                  <option value="event">On Event</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>

              {triggerType === 'event' && (
                <div className="form-group">
                  <label>Trigger Events</label>
                  <div className="checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={triggerEvents.includes('execution.started')}
                        onChange={() =>
                          handleTriggerEventToggle('execution.started')
                        }
                      />
                      NFT Execution Started
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={triggerEvents.includes('execution.completed')}
                        onChange={() =>
                          handleTriggerEventToggle('execution.completed')
                        }
                      />
                      NFT Execution Completed
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={triggerEvents.includes('ownership.changed')}
                        onChange={() =>
                          handleTriggerEventToggle('ownership.changed')
                        }
                      />
                      Ownership Changed
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={triggerEvents.includes('verification.passed')}
                        onChange={() =>
                          handleTriggerEventToggle('verification.passed')
                        }
                      />
                      Verification Passed
                    </label>
                  </div>
                </div>
              )}

              {triggerType === 'scheduled' && (
                <div className="form-group">
                  <label htmlFor="schedule">Schedule (cron expression)</label>
                  <input
                    type="text"
                    id="schedule"
                    value={schedule}
                    onChange={e => setSchedule(e.target.value)}
                    placeholder="e.g., 0 0 * * * (daily at midnight)"
                    required={triggerType === 'scheduled'}
                  />
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowLinkForm(false);
                    setSelectedWorkflow(null);
                    setTriggerType('manual');
                    setTriggerEvents([]);
                    setSchedule('');
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Link Workflow
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="workflows-section">
            <h3>Available Workflows</h3>

            {workflows.length === 0 ? (
              <div className="no-workflows">
                <p>No workflows available in n8n</p>
              </div>
            ) : (
              <div className="workflows-grid">
                {workflows.map(workflow => (
                  <div key={workflow.id} className="workflow-card">
                    <h4>{workflow.name}</h4>
                    <div className="workflow-meta">
                      <span>ID: {workflow.id.substring(0, 8)}...</span>
                      {workflow.active ? (
                        <span className="workflow-tag">Active</span>
                      ) : (
                        <span
                          className="workflow-tag"
                          style={{ backgroundColor: 'var(--text-tertiary)' }}
                        >
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowIntegration;
