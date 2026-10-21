import React, { useState, useEffect } from 'react';
import { WrfButton, WrfInput, WrfSelect } from '../DesignSystem';
import './IntegrationCards.css';

/**
 * Perplexity Integration Card Component
 *
 * This component displays details about the Perplexity integration and
 * allows users to configure their Perplexity API key.
 */
const PerplexityCard = () => {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState('unconfigured'); // unconfigured, testing, connected, error
  const [errorMessage, setErrorMessage] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [model, setModel] = useState('llama-3.1-sonar-small-128k-online');
  const [maxTokens, setMaxTokens] = useState(2048);
  const [temperature, setTemperature] = useState(0.2);

  // Fetch current configuration on mount
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/ai-plugins/config/perplexity');
      const data = await response.json();

      if (data.success && data.config) {
        if (data.config.apiKey) {
          // Mask the API key
          setApiKey('••••••••••••••••••••••••••••••');
          setStatus(data.config.connected ? 'connected' : 'configured');
        }

        if (data.config.model) {
          setModel(data.config.model);
        }

        if (data.config.maxTokens) {
          setMaxTokens(data.config.maxTokens);
        }

        if (data.config.temperature) {
          setTemperature(data.config.temperature);
        }
      }
    } catch (error) {
      console.error('Error fetching Perplexity configuration:', error);
    }
  };

  const saveConfig = async () => {
    // Clear previous messages
    setSaveMessage('');
    setErrorMessage('');

    if (!apiKey || apiKey === '••••••••••••••••••••••••••••••') {
      setErrorMessage('Please enter your Perplexity API key');
      return;
    }

    setStatus('testing');

    try {
      const response = await fetch('/api/ai-plugins/config/perplexity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey,
          model,
          maxTokens,
          temperature,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus('connected');
        setSaveMessage('Configuration saved successfully!');
        // Mask the API key after saving
        setApiKey('••••••••••••••••••••••••••••••');
        setShowApiKey(false);
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Failed to save API key');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('Network error: Could not connect to server');
      console.error('Error saving Perplexity API key:', error);
    }
  };

  const testConnection = async () => {
    // Skip if no API key is configured
    if (!apiKey || apiKey === '••••••••••••••••••••••••••••••') {
      setErrorMessage('Please enter your Perplexity API key');
      return;
    }

    setStatus('testing');
    setSaveMessage('');
    setErrorMessage('');

    try {
      const response = await fetch('/api/ai-plugins/test/perplexity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey,
          model,
          maxTokens,
          temperature,
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
      console.error('Error testing Perplexity API connection:', error);
    }
  };

  const handleChangeApiKey = e => {
    setApiKey(e.target.value);
    // If key was previously masked and user starts typing, we're changing it
    if (e.target.value !== '••••••••••••••••••••••••••••••') {
      setShowApiKey(true);
    }
  };

  const modelOptions = [
    { value: 'llama-3.1-sonar-small-128k-online', label: 'Llama 3.1 Sonar Small (128k)' },
    { value: 'llama-3.1-sonar-large-128k-online', label: 'Llama 3.1 Sonar Large (128k)' },
    { value: 'llama-3.1-sonar-huge-128k-online', label: 'Llama 3.1 Sonar Huge (128k)' },
  ];

  return (
    <div className="integration-detail-card">
      <div className="card-header">
        <div className="integration-icon">
          <img src="/assets/icons/perplexity-logo.svg" alt="Perplexity Logo" />
        </div>
        <div className="integration-title">
          <h2>Perplexity</h2>
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
          Perplexity provides powerful real-time information search and data
          analysis capabilities. Connect your Perplexity API key to enhance
          Wrfcoin with up-to-date information search, real-time data analysis,
          and meteorological insights.
        </p>

        <div className="features-list">
          <h4>Features:</h4>
          <ul>
            <li>Real-time information search for weather and climate data</li>
            <li>Current and historical trend analysis</li>
            <li>Immediate answers to weather-related questions</li>
            <li>Integration with powerful Llama 3.1 Sonar models</li>
            <li>Citations and sources for factual information</li>
            <li>Context-aware responses for meteorological queries</li>
          </ul>
        </div>

        <div className="configuration-section">
          <h4>Configuration</h4>

          <div className="form-group">
            <label htmlFor="perplexity-api-key">API Key</label>
            <div className="api-key-input">
              <WrfInput
                type={showApiKey ? 'text' : 'password'}
                id="perplexity-api-key"
                value={apiKey}
                onChange={handleChangeApiKey}
                placeholder="Enter your Perplexity API key"
              />
              <button
                type="button"
                className="toggle-visibility"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <small>
              Find your API key in the{' '}
              <a
                href="https://www.perplexity.ai/settings/api"
                target="_blank"
                rel="noopener noreferrer"
              >
                Perplexity API Settings
              </a>
            </small>
          </div>

          <div className="form-group">
            <WrfSelect
              label="Model"
              id="model"
              value={model}
              onChange={e => setModel(e.target.value)}
              options={modelOptions}
            />
            <small>
              Choose the model size based on your needs and performance
              requirements
            </small>
          </div>

          <div className="form-group">
            <WrfInput
              type="number"
              label="Max Output Tokens"
              id="max-tokens"
              value={maxTokens}
              onChange={e => setMaxTokens(parseInt(e.target.value) || 2048)}
              slotProps={{ htmlInput: { min: 1, max: 8192 } }}
            />
            <small>Maximum number of tokens to generate in responses</small>
          </div>

          <div className="form-group">
            <WrfInput
              type="number"
              label="Temperature"
              id="temperature"
              value={temperature}
              onChange={e => setTemperature(parseFloat(e.target.value) || 0.2)}
              slotProps={{ htmlInput: { min: 0, max: 1, step: 0.1 } }}
            />
            <small>
              Controls randomness: lower values are more focused, higher values
              more creative (0-1)
            </small>
          </div>

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
            href="https://docs.perplexity.ai/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Perplexity Docs
          </a>
          <a
            href="https://www.perplexity.ai/settings/api"
            target="_blank"
            rel="noopener noreferrer"
          >
            Get API Key
          </a>
          <a
            href="https://docs.perplexity.ai/docs/model-cards"
            target="_blank"
            rel="noopener noreferrer"
          >
            Model Information
          </a>
        </div>
      </div>
    </div>
  );
};

export default PerplexityCard;
