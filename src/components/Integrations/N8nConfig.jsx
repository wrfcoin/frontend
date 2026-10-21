import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { WrfButton, WrfInput } from '../DesignSystem';
import './IntegrationCards.css';

const N8nConfig = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState({
    apiUrl: '',
    apiKey: '',
    webhookEndpoint: '',
    enabled: false,
    subscribeToBlockEvents: true,
    subscribeToTransactionEvents: true,
    subscribeToWeatherDataEvents: true,
    subscribeToComputationalEvents: true,
    subscribeToGovernanceEvents: false,
    customEventFilters: '',
  });
  const [originalConfig, setOriginalConfig] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [notification, setNotification] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    // Fetch current configuration
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/plugins/n8n/config');

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.config) {
          setConfig(data.config);
          setOriginalConfig(data.config);
        } else {
          showNotification(
            'Error loading configuration: ' + (data.error || 'Unknown error'),
            'error',
          );
        }
      } else {
        showNotification(
          'Failed to load configuration. Server returned: ' + response.status,
          'error',
        );
      }
    } catch (error) {
      showNotification(
        'Error loading configuration: ' + error.message,
        'error',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/plugins/n8n/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setOriginalConfig(config);
          showNotification('Configuration saved successfully!', 'success');
        } else {
          showNotification(
            'Error saving configuration: ' + (data.error || 'Unknown error'),
            'error',
          );
        }
      } else {
        showNotification(
          'Failed to save configuration. Server returned: ' + response.status,
          'error',
        );
      }
    } catch (error) {
      showNotification('Error saving configuration: ' + error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async () => {
    try {
      setIsTesting(true);
      setTestResult(null);

      const response = await fetch('/api/plugins/n8n/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();
      setTestResult(data);

      if (data.success) {
        showNotification('Connection test successful!', 'success');
      } else {
        showNotification(
          'Connection test failed: ' + (data.error || 'Unknown error'),
          'error',
        );
      }
    } catch (error) {
      showNotification('Error testing connection: ' + error.message, 'error');
      setTestResult({
        success: false,
        error: error.message,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const triggerTestEvent = async eventType => {
    try {
      const response = await fetch('/api/plugins/n8n/trigger-test-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventType }),
      });

      const data = await response.json();

      if (data.success) {
        showNotification(
          `Test ${eventType} event triggered successfully!`,
          'success',
        );
      } else {
        showNotification(
          `Failed to trigger test event: ${data.message || data.error || 'Unknown error'}`,
          'error',
        );
      }
    } catch (error) {
      showNotification(
        'Error triggering test event: ' + error.message,
        'error',
      );
    }
  };

  const handleInputChange = e => {
    const { name, value, type, checked } = e.target;
    setConfig({
      ...config,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const hasChanges = () => {
    return JSON.stringify(config) !== JSON.stringify(originalConfig);
  };

  const handleCancel = () => {
    setConfig(originalConfig);
    showNotification('Changes discarded', 'success');
  };

  const handleBack = () => {
    if (hasChanges()) {
      if (
        window.confirm(
          'You have unsaved changes. Are you sure you want to go back?',
        )
      ) {
        navigate('/integrations/automation');
      }
    } else {
      navigate('/integrations/automation');
    }
  };

  if (isLoading) {
    return (
      <div className="integration-config-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading n8n configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="integration-config-container">
      <div className="config-header">
        <button className="back-button" onClick={handleBack}>
          ← Back to Integrations
        </button>
        <h2>n8n Workflow Automation</h2>
      </div>

      <div className="config-section">
        <h3>API Connection</h3>
        <div className="form-divider"></div>

        <div className="config-form-field">
          <label htmlFor="apiUrl">n8n API URL</label>
          <WrfInput
            type="text"
            id="apiUrl"
            name="apiUrl"
            value={config.apiUrl}
            onChange={handleInputChange}
            placeholder="https://your-n8n-instance.com"
          />
          <p className="help-text">
            The URL of your n8n instance (e.g., https://n8n.yourcompany.com)
          </p>
        </div>

        <div className="config-form-field">
          <label htmlFor="apiKey">API Key</label>
          <div className="api-key-input">
            <WrfInput
              type={showApiKey ? 'text' : 'password'}
              id="apiKey"
              name="apiKey"
              value={config.apiKey}
              onChange={handleInputChange}
              placeholder="Your n8n API key"
            />
            <button
              type="button"
              className="toggle-visibility"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? 'Hide' : 'Show'}
            </button>
          </div>
          <p className="help-text">Your n8n API key for authentication</p>
        </div>

        <div className="config-form-field">
          <label htmlFor="webhookEndpoint">Webhook Endpoint (optional)</label>
          <WrfInput
            type="text"
            id="webhookEndpoint"
            name="webhookEndpoint"
            value={config.webhookEndpoint}
            onChange={handleInputChange}
            placeholder="https://your-endpoint.com/webhook"
          />
          <p className="help-text">
            Custom webhook endpoint to receive n8n events (leave blank to use
            default)
          </p>
        </div>

        <div className="form-actions">
          <WrfButton
            variant="outline"
            onClick={testConnection}
            disabled={isTesting}
          >
            {isTesting ? 'Testing...' : 'Test Connection'}
          </WrfButton>
        </div>

        {testResult && (
          <div
            className={testResult.success ? 'success-message' : 'error-message'}
          >
            {testResult.success
              ? testResult.message
              : `Connection failed: ${testResult.error}`}
          </div>
        )}
      </div>

      <div className="config-section">
        <h3>Event Subscriptions</h3>
        <div className="form-divider"></div>

        <div className="config-form-field">
          <label className="toggle-label">
            <input
              type="checkbox"
              name="enabled"
              checked={config.enabled}
              onChange={handleInputChange}
            />
            <span className="toggle-label-text">Enable n8n Integration</span>
          </label>
          <p className="help-text">
            Enable or disable the entire n8n integration
          </p>
        </div>

        <div className="config-form-field">
          <label className="toggle-label">
            <input
              type="checkbox"
              name="subscribeToBlockEvents"
              checked={config.subscribeToBlockEvents}
              onChange={handleInputChange}
              disabled={!config.enabled}
            />
            <span className="toggle-label-text">Subscribe to Block Events</span>
          </label>
          <p className="help-text">
            Receive notifications when new blocks are mined
          </p>
        </div>

        <div className="config-form-field">
          <label className="toggle-label">
            <input
              type="checkbox"
              name="subscribeToTransactionEvents"
              checked={config.subscribeToTransactionEvents}
              onChange={handleInputChange}
              disabled={!config.enabled}
            />
            <span className="toggle-label-text">
              Subscribe to Transaction Events
            </span>
          </label>
          <p className="help-text">
            Receive notifications when new transactions are processed
          </p>
        </div>

        <div className="config-form-field">
          <label className="toggle-label">
            <input
              type="checkbox"
              name="subscribeToWeatherDataEvents"
              checked={config.subscribeToWeatherDataEvents}
              onChange={handleInputChange}
              disabled={!config.enabled}
            />
            <span className="toggle-label-text">
              Subscribe to Weather Data Events
            </span>
          </label>
          <p className="help-text">
            Receive notifications when new weather data is published to the
            blockchain
          </p>
        </div>

        <div className="config-form-field">
          <label className="toggle-label">
            <input
              type="checkbox"
              name="subscribeToComputationalEvents"
              checked={config.subscribeToComputationalEvents}
              onChange={handleInputChange}
              disabled={!config.enabled}
            />
            <span className="toggle-label-text">
              Subscribe to Computational Events
            </span>
          </label>
          <p className="help-text">
            Receive notifications when computational tasks are created or
            completed
          </p>
        </div>

        <div className="config-form-field">
          <label className="toggle-label">
            <input
              type="checkbox"
              name="subscribeToGovernanceEvents"
              checked={config.subscribeToGovernanceEvents}
              onChange={handleInputChange}
              disabled={!config.enabled}
            />
            <span className="toggle-label-text">
              Subscribe to Governance Events
            </span>
          </label>
          <p className="help-text">
            Receive notifications for governance activities like proposals and
            votes
          </p>
        </div>

        <div className="config-form-field">
          <label htmlFor="customEventFilters">
            Custom Event Filters (Advanced)
          </label>
          <WrfInput
            type="text"
            id="customEventFilters"
            name="customEventFilters"
            value={config.customEventFilters}
            onChange={handleInputChange}
            placeholder="type=NFT,amount:100"
            disabled={!config.enabled}
          />
          <p className="help-text">
            Comma-separated list of key-value filters (e.g.,
            type=NFT,amount:100)
          </p>
        </div>
      </div>

      <div className="config-section">
        <h3>Test Events</h3>
        <div className="form-divider"></div>
        <p>
          Send a test event to your n8n instance to verify your workflow trigger
          is working correctly.
        </p>

        <div className="action-buttons">
          <WrfButton
            variant="outline"
            onClick={() => triggerTestEvent('block')}
            disabled={!config.enabled || !config.subscribeToBlockEvents}
          >
            Test Block Event
          </WrfButton>
          <WrfButton
            variant="outline"
            onClick={() => triggerTestEvent('transaction')}
            disabled={!config.enabled || !config.subscribeToTransactionEvents}
          >
            Test Transaction Event
          </WrfButton>
          <WrfButton
            variant="outline"
            onClick={() => triggerTestEvent('weatherData')}
            disabled={!config.enabled || !config.subscribeToWeatherDataEvents}
          >
            Test Weather Data Event
          </WrfButton>
          <WrfButton
            variant="outline"
            onClick={() => triggerTestEvent('computational')}
            disabled={!config.enabled || !config.subscribeToComputationalEvents}
          >
            Test Computational Event
          </WrfButton>
          <WrfButton
            variant="outline"
            onClick={() => triggerTestEvent('governance')}
            disabled={!config.enabled || !config.subscribeToGovernanceEvents}
          >
            Test Governance Event
          </WrfButton>
        </div>
      </div>

      <div className="form-actions">
        <button
          className="cancel-button"
          onClick={handleCancel}
          disabled={!hasChanges() || isSaving}
        >
          Discard Changes
        </button>
        <button
          className={`save-button ${isSaving ? 'saving' : ''} ${!hasChanges() ? 'disabled' : ''}`}
          onClick={saveConfig}
          disabled={!hasChanges() || isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      {notification && (
        <div className={`notification ${notification.type}`}>
          <span className="notification-message">{notification.message}</span>
          <button
            className="notification-close"
            onClick={() => setNotification(null)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default N8nConfig;
