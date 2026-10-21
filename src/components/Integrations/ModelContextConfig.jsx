import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { WrfButton, WrfInput, WrfSelect, WrfAlert } from '../DesignSystem';
import './IntegrationCards.css';

const ModelContextConfig = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('config');
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success',
  });
  const [blockchainOperation, setBlockchainOperation] = useState({
    operation: 'getBlockHeight',
    params: '{}',
  });
  const [operationResult, setOperationResult] = useState(null);
  const [operationLoading, setOperationLoading] = useState(false);
  const [config, setConfig] = useState({
    enabled: false,
    endpoint: '',
    apiKey: '',
    contextWindowSize: 8192,
    modelVersion: 'v1',
    useWeatherContext: true,
    useBlockchainContext: true,
    allowGraphIntegration: true,
    enableBlockchainCommands: false,
    blockchainCommandList: 'getBlockHeight,getTransaction,getBalance',
    blockchainWebhookEndpoint: '',
    blockchainEventSubscriptions: [],
  });

  useEffect(() => {
    // Fetch current configuration when component mounts
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/model-context/config');
        if (response.ok) {
          const data = await response.json();
          setConfig({
            ...config,
            ...data,
          });
        } else {
          showNotification('Failed to load configuration', 'error');
        }
      } catch (error) {
        console.error(
          'Error fetching Model Context Protocol configuration:',
          error,
        );
        showNotification(
          'Failed to load configuration: ' + error.message,
          'error',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setConfig({
      ...config,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleNumberChange = e => {
    const { name, value } = e.target;
    setConfig({
      ...config,
      [name]: value === '' ? '' : Number(value),
    });
  };

  const handleBack = () => {
    navigate('/integrations/ai');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/model-context/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        showNotification('Configuration saved successfully', 'success');
      } else {
        const errorData = await response.json();
        showNotification(
          `Failed to save configuration: ${errorData.message || response.statusText}`,
          'error',
        );
      }
    } catch (error) {
      console.error(
        'Error saving Model Context Protocol configuration:',
        error,
      );
      showNotification(
        'Failed to save configuration: ' + error.message,
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleExecuteOperation = async () => {
    setOperationLoading(true);
    setOperationResult(null);

    try {
      let params = {};
      try {
        params = JSON.parse(blockchainOperation.params);
      } catch (e) {
        showNotification('Invalid JSON parameters', 'error');
        setOperationLoading(false);
        return;
      }

      const response = await fetch('/api/model-context/blockchain/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: blockchainOperation.operation,
          params,
        }),
      });

      const result = await response.json();
      setOperationResult(result);

      if (!response.ok) {
        showNotification(
          `Operation failed: ${result.message || response.statusText}`,
          'error',
        );
      }
    } catch (error) {
      console.error('Error executing blockchain operation:', error);
      showNotification('Operation failed: ' + error.message, 'error');
    } finally {
      setOperationLoading(false);
    }
  };

  const handleOperationChange = e => {
    const { name, value } = e.target;
    setBlockchainOperation({
      ...blockchainOperation,
      [name]: value,
    });
  };

  const showNotification = (message, type = 'success') => {
    setNotification({
      show: true,
      message,
      type,
    });

    // Auto-hide notification after 5 seconds
    setTimeout(() => {
      setNotification({ ...notification, show: false });
    }, 5000);
  };

  const operationOptions = [
    { value: 'getBlockHeight', label: 'Get Block Height' },
    { value: 'getBlockByHeight', label: 'Get Block By Height' },
    { value: 'getTransaction', label: 'Get Transaction' },
    { value: 'getBalance', label: 'Get Balance' },
    { value: 'getNetworkStats', label: 'Get Network Stats' },
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading configuration...</p>
      </div>
    );
  }

  return (
    <div className="integration-config-container">
      <div className="config-header">
        <WrfButton variant="ghost" onClick={handleBack}>
          &larr; Back to AI Hub
        </WrfButton>
        <h2>Model Context Protocol Configuration</h2>
      </div>

      <div className="tabs-container">
        <div className="tabs">
          <WrfButton
            variant={activeTab === 'config' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('config')}
          >
            Configuration
          </WrfButton>
          <WrfButton
            variant={activeTab === 'blockchain' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('blockchain')}
          >
            Blockchain Communication
          </WrfButton>
          <WrfButton
            variant={activeTab === 'test' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('test')}
          >
            Test Operations
          </WrfButton>
        </div>
      </div>

      {activeTab === 'config' && (
        <>
          <div className="config-section">
            <h3>Basic Settings</h3>
            <div className="form-divider"></div>

            <div>
              <label className="toggle-label">
                <input
                  type="checkbox"
                  name="enabled"
                  checked={config.enabled}
                  onChange={handleChange}
                />
                <span className="toggle-label-text">
                  Enable Model Context Protocol Integration
                </span>
              </label>
            </div>

            <div>
              <WrfInput
                label="API Endpoint"
                type="text"
                name="endpoint"
                value={config.endpoint}
                onChange={handleChange}
                disabled={!config.enabled}
                placeholder="https://api.modelcontextprotocol.org"
                helperText="The endpoint URL for the Model Context Protocol service"
              />
            </div>

            <div>
              <WrfInput
                label="API Key"
                type="password"
                name="apiKey"
                value={config.apiKey}
                onChange={handleChange}
                disabled={!config.enabled}
                placeholder="Enter your API key"
                helperText="Your Model Context Protocol API key"
              />
            </div>

            <div>
              <WrfInput
                label="Model Version"
                type="text"
                name="modelVersion"
                value={config.modelVersion}
                onChange={handleChange}
                disabled={!config.enabled}
                placeholder="v1"
                helperText="The version of the Model Context Protocol to use"
              />
            </div>

            <div>
              <WrfInput
                label="Context Window Size"
                type="number"
                name="contextWindowSize"
                value={config.contextWindowSize}
                onChange={handleNumberChange}
                disabled={!config.enabled}
                slotProps={{ htmlInput: { min: 1024, max: 65536 } }}
                helperText="Maximum token length for context windows"
              />
            </div>
          </div>

          <div className="config-section">
            <h3>Context Enhancement Settings</h3>
            <div className="form-divider"></div>

            <div>
              <label className="toggle-label">
                <input
                  type="checkbox"
                  name="useWeatherContext"
                  checked={config.useWeatherContext}
                  onChange={handleChange}
                  disabled={!config.enabled}
                />
                <span className="toggle-label-text">
                  Include Weather Data in Context
                </span>
              </label>
              <div className="help-text">
                Automatically include relevant weather data in AI model context
              </div>
            </div>

            <div>
              <label className="toggle-label">
                <input
                  type="checkbox"
                  name="useBlockchainContext"
                  checked={config.useBlockchainContext}
                  onChange={handleChange}
                  disabled={!config.enabled}
                />
                <span className="toggle-label-text">
                  Include Blockchain Data in Context
                </span>
              </label>
              <div className="help-text">
                Automatically include relevant blockchain data in AI model
                context
              </div>
            </div>

            <div>
              <label className="toggle-label">
                <input
                  type="checkbox"
                  name="allowGraphIntegration"
                  checked={config.allowGraphIntegration}
                  onChange={handleChange}
                  disabled={!config.enabled}
                />
                <span className="toggle-label-text">
                  Enable Graph Integration for Knowledge Base
                </span>
              </label>
              <div className="help-text">
                Build and utilize a knowledge graph to enhance context
                understanding
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'blockchain' && (
        <div className="config-section">
          <h3>Blockchain Communication Settings</h3>
          <div className="form-divider"></div>

          <div>
            <label className="toggle-label">
              <input
                type="checkbox"
                name="enableBlockchainCommands"
                checked={config.enableBlockchainCommands}
                onChange={handleChange}
                disabled={!config.enabled}
              />
              <span className="toggle-label-text">
                Enable Direct Blockchain Commands
              </span>
            </label>
            <div className="help-text">
              Allow MCP to execute commands directly on the blockchain
            </div>
          </div>

          <div>
            <WrfInput
              label="Allowed Blockchain Commands"
              type="text"
              name="blockchainCommandList"
              value={config.blockchainCommandList}
              onChange={handleChange}
              disabled={!config.enabled || !config.enableBlockchainCommands}
              placeholder="getBlockHeight,getTransaction,getBalance"
              helperText="Comma-separated list of allowed blockchain commands"
            />
          </div>

          <div>
            <WrfInput
              label="Blockchain Webhook Endpoint"
              type="text"
              name="blockchainWebhookEndpoint"
              value={config.blockchainWebhookEndpoint}
              onChange={handleChange}
              disabled={!config.enabled || !config.enableBlockchainCommands}
              placeholder="https://your-webhook-endpoint.com/blockchain-events"
              helperText="Endpoint where blockchain events will be sent (for subscriptions)"
            />
          </div>

          <div className="form-info">
            <h4>About Blockchain Communication</h4>
            <p>
              The Model Context Protocol can establish bidirectional
              communication with the Wrfcoin blockchain, enabling:
            </p>
            <ul>
              <li>Direct execution of blockchain commands</li>
              <li>Event subscription and notification</li>
              <li>Enhanced context for AI models with live blockchain data</li>
            </ul>
            <p>
              <strong>Note:</strong> Only enable blockchain commands in trusted
              environments as this provides direct access to blockchain
              functionality.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'test' && (
        <div className="config-section">
          <h3>Test Blockchain Operations</h3>
          <div className="form-divider"></div>

          <div>
            <WrfSelect
              label="Operation"
              name="operation"
              value={blockchainOperation.operation}
              onChange={handleOperationChange}
              disabled={!config.enabled || !config.enableBlockchainCommands}
              options={operationOptions}
            />
          </div>

          <div>
            <label>Parameters (JSON)</label>
            <textarea
              name="params"
              value={blockchainOperation.params}
              onChange={handleOperationChange}
              disabled={!config.enabled || !config.enableBlockchainCommands}
              rows={4}
              placeholder={'{\n  "param1": "value1",\n  "param2": "value2"\n}'}
            />
            <div className="help-text">
              JSON parameters for the operation. Example:{' '}
              <code>{'{"height": 1000}'}</code> for getBlockByHeight
            </div>
          </div>

          <WrfButton
            variant="primary"
            onClick={handleExecuteOperation}
            disabled={
              operationLoading ||
              !config.enabled ||
              !config.enableBlockchainCommands
            }
            loading={operationLoading}
          >
            {operationLoading ? 'Executing...' : 'Execute Operation'}
          </WrfButton>

          {operationResult && (
            <div className="operation-result">
              <h4>Result:</h4>
              <pre>{JSON.stringify(operationResult, null, 2)}</pre>
            </div>
          )}

          <div className="form-info">
            <h4>Sample Parameters</h4>
            <ul>
              <li>
                <strong>getBlockHeight</strong>: <code>{'{}'}</code>
              </li>
              <li>
                <strong>getBlockByHeight</strong>:{' '}
                <code>{'{"height": 1000}'}</code>
              </li>
              <li>
                <strong>getTransaction</strong>:{' '}
                <code>{'{"txId": "tx123abc"}'}</code>
              </li>
              <li>
                <strong>getBalance</strong>:{' '}
                <code>{'{"address": "WRF1..."}'}</code>
              </li>
              <li>
                <strong>getNetworkStats</strong>: <code>{'{}'}</code>
              </li>
            </ul>
          </div>
        </div>
      )}

      <div className="form-actions">
        <WrfButton variant="ghost" onClick={handleBack}>
          Cancel
        </WrfButton>
        <WrfButton
          variant="primary"
          onClick={handleSave}
          disabled={saving || !config.enabled}
          loading={saving}
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </WrfButton>
      </div>

      {notification.show && (
        <WrfAlert
          severity={notification.type === 'error' ? 'error' : 'success'}
          dismissible
          onDismiss={() => setNotification({ ...notification, show: false })}
        >
          {notification.message}
        </WrfAlert>
      )}
    </div>
  );
};

export default ModelContextConfig;
