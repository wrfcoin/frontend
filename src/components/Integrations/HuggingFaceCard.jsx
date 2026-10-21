import React, { useState, useEffect } from 'react';
import { WrfButton, WrfInput, WrfSelect } from '../DesignSystem';
import './IntegrationCards.css';

/**
 * HuggingFace Integration Card Component
 *
 * This component displays details about the HuggingFace integration and
 * allows users to configure their HuggingFace API token.
 */
const HuggingFaceCard = () => {
  const [apiToken, setApiToken] = useState('');
  const [status, setStatus] = useState('unconfigured'); // unconfigured, testing, connected, error
  const [errorMessage, setErrorMessage] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [showApiToken, setShowApiToken] = useState(false);
  const [model, setModel] = useState('meta-llama/Llama-2-70b-chat-hf');
  const [customModel, setCustomModel] = useState('');
  const [useCustomModel, setUseCustomModel] = useState(false);

  // Fetch current configuration on mount
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/ai-plugins/config/huggingface');
      const data = await response.json();

      if (data.success && data.config) {
        if (data.config.apiToken) {
          // Mask the API token
          setApiToken('••••••••••••••••••••••••••••••');
          setStatus(data.config.connected ? 'connected' : 'configured');
        }

        if (data.config.model) {
          if (data.config.model.startsWith('custom:')) {
            setUseCustomModel(true);
            setCustomModel(data.config.model.substring(7));
          } else {
            setModel(data.config.model);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching HuggingFace configuration:', error);
    }
  };

  const saveConfig = async () => {
    // Clear previous messages
    setSaveMessage('');
    setErrorMessage('');

    if (!apiToken || apiToken === '••••••••••••••••••••••••••••••') {
      setErrorMessage('Please enter your HuggingFace API token');
      return;
    }

    const selectedModel = useCustomModel ? `custom:${customModel}` : model;

    if (useCustomModel && !customModel) {
      setErrorMessage('Please enter a custom model name');
      return;
    }

    setStatus('testing');

    try {
      const response = await fetch('/api/ai-plugins/config/huggingface', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiToken,
          model: selectedModel,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus('connected');
        setSaveMessage('Configuration saved successfully!');
        // Mask the API token after saving
        setApiToken('••••••••••••••••••••••••••••••');
        setShowApiToken(false);
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Failed to save API token');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('Network error: Could not connect to server');
      console.error('Error saving HuggingFace API token:', error);
    }
  };

  const testConnection = async () => {
    // Skip if no API token is configured
    if (!apiToken || apiToken === '••••••••••••••••••••••••••••••') {
      setErrorMessage('Please enter your HuggingFace API token');
      return;
    }

    const selectedModel = useCustomModel ? `custom:${customModel}` : model;

    if (useCustomModel && !customModel) {
      setErrorMessage('Please enter a custom model name');
      return;
    }

    setStatus('testing');
    setSaveMessage('');
    setErrorMessage('');

    try {
      const response = await fetch('/api/ai-plugins/test/huggingface', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiToken,
          model: selectedModel,
        }),
      });

      const data = await response.json();

      if (data.success && data.status === 'connected') {
        setStatus('connected');
        setSaveMessage('Connection successful!');
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Connection test failed');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('Network error: Could not connect to server');
      console.error('Error testing HuggingFace API connection:', error);
    }
  };

  const handleChangeApiToken = e => {
    setApiToken(e.target.value);
    // If token was previously masked and user starts typing, we're changing it
    if (e.target.value !== '••••••••••••••••••••••••••••••') {
      setShowApiToken(true);
    }
  };

  const modelOptions = [
    { value: 'meta-llama/Llama-2-70b-chat-hf', label: 'LLaMA-2-70B-Chat' },
    { value: 'meta-llama/Llama-2-13b-chat-hf', label: 'LLaMA-2-13B-Chat' },
    { value: 'meta-llama/Llama-2-7b-chat-hf', label: 'LLaMA-2-7B-Chat' },
    { value: 'mistralai/Mistral-7B-Instruct-v0.2', label: 'Mistral-7B-Instruct' },
    { value: 'mistralai/Mixtral-8x7B-Instruct-v0.1', label: 'Mixtral-8x7B-Instruct' },
    { value: 'wrfcoin/weather-forecast-analysis', label: 'WRF Weather Analysis' },
    { value: 'wrfcoin/meteorological-data-processing', label: 'Meteorological Data Processor' },
  ];

  return (
    <div className="integration-detail-card">
      <div className="card-header">
        <div className="integration-icon">
          <img
            src="/assets/icons/huggingface-logo.svg"
            alt="HuggingFace Logo"
          />
        </div>
        <div className="integration-title">
          <h2>HuggingFace</h2>
          <div className={`status-indicator ${status}`}>
            {status === 'unconfigured' && 'Not Configured'}
            {status === 'configured' && 'Configured'}
            {status === 'testing' && 'Testing Connection...'}
            {status === 'connected' && 'Connected'}
            {status === 'error' && 'Error'}
          </div>
        </div>
      </div>

      <div className="card-content">
        <p>
          HuggingFace provides access to thousands of open-source AI models for
          various tasks. Connect your HuggingFace API token to enhance Wrfcoin
          with access to state-of-the-art open models for weather data analysis,
          blockchain insights, and more.
        </p>

        <div className="features-list">
          <h4>Features:</h4>
          <ul>
            <li>Access to thousands of open-source models</li>
            <li>Free and paid model hosting options</li>
            <li>Support for custom model deployment</li>
            <li>Text generation for weather report synthesis</li>
            <li>Text-to-image capabilities for data visualization</li>
            <li>Advanced text classification for data categorization</li>
          </ul>
        </div>

        <div className="configuration-section">
          <h4>Configuration</h4>

          <div className="form-group">
            <label htmlFor="huggingface-api-token">API Token</label>
            <div className="api-key-input">
              <WrfInput
                type={showApiToken ? 'text' : 'password'}
                id="huggingface-api-token"
                value={apiToken}
                onChange={handleChangeApiToken}
                placeholder="Enter your HuggingFace API token"
              />
              <button
                type="button"
                className="toggle-visibility"
                onClick={() => setShowApiToken(!showApiToken)}
              >
                {showApiToken ? 'Hide' : 'Show'}
              </button>
            </div>
            <small>
              Find your API token in the{' '}
              <a
                href="https://huggingface.co/settings/tokens"
                target="_blank"
                rel="noopener noreferrer"
              >
                HuggingFace settings
              </a>
            </small>
          </div>

          <div className="form-group">
            <div className="checkbox-field">
              <input
                type="checkbox"
                id="use-custom-model"
                checked={useCustomModel}
                onChange={() => setUseCustomModel(!useCustomModel)}
              />
              <label htmlFor="use-custom-model">Use custom model</label>
            </div>
          </div>

          {!useCustomModel ? (
            <div className="form-group">
              <WrfSelect
                label="Pre-configured Models"
                id="model"
                value={model}
                onChange={e => setModel(e.target.value)}
                options={modelOptions}
              />
              <small>Choose from popular pre-configured models</small>
            </div>
          ) : (
            <div className="form-group">
              <WrfInput
                type="text"
                label="Custom Model Path"
                id="custom-model"
                value={customModel}
                onChange={e => setCustomModel(e.target.value)}
                placeholder="username/model-name"
              />
              <small>Enter a HuggingFace model repository path</small>
            </div>
          )}

          {errorMessage && <div className="error-message">{errorMessage}</div>}

          {saveMessage && <div className="success-message">{saveMessage}</div>}

          <div className="action-buttons">
            <WrfButton variant="primary" onClick={saveConfig}>
              Save Configuration
            </WrfButton>
            <WrfButton variant="secondary" onClick={testConnection}>
              Test Connection
            </WrfButton>
          </div>
        </div>
      </div>

      <div className="card-footer">
        <div className="external-links">
          <a
            href="https://huggingface.co/docs/api-inference/index"
            target="_blank"
            rel="noopener noreferrer"
          >
            HuggingFace API Docs
          </a>
          <a
            href="https://huggingface.co/settings/tokens"
            target="_blank"
            rel="noopener noreferrer"
          >
            Get API Token
          </a>
          <a
            href="https://huggingface.co/models"
            target="_blank"
            rel="noopener noreferrer"
          >
            Explore Models
          </a>
        </div>
      </div>
    </div>
  );
};

export default HuggingFaceCard;
