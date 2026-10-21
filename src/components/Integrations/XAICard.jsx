import React, { useState, useEffect } from 'react';
import { WrfButton, WrfInput, WrfSelect } from '../DesignSystem';
import './IntegrationCards.css';

/**
 * XAI (Grok) Integration Card Component
 *
 * This component displays details about the xAI integration and
 * allows users to configure their xAI API key for Grok models.
 */
const XAICard = () => {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState('unconfigured'); // unconfigured, testing, connected, error
  const [errorMessage, setErrorMessage] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [model, setModel] = useState('grok-2-1212');
  const [maxTokens, setMaxTokens] = useState(2048);
  const [temperature, setTemperature] = useState(0.7);

  // Fetch current configuration on mount
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/ai-plugins/config/xai');
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

        if (data.config.temperature !== undefined) {
          setTemperature(data.config.temperature);
        }
      }
    } catch (error) {
      console.error('Error fetching xAI configuration:', error);
    }
  };

  const saveConfig = async () => {
    // Clear previous messages
    setSaveMessage('');
    setErrorMessage('');

    if (!apiKey || apiKey === '••••••••••••••••••••••••••••••') {
      setErrorMessage('Please enter your xAI API key');
      return;
    }

    setStatus('testing');

    try {
      const response = await fetch('/api/ai-plugins/config/xai', {
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
      console.error('Error saving xAI API key:', error);
    }
  };

  const testConnection = async () => {
    // Skip if no API key is configured
    if (!apiKey || apiKey === '••••••••••••••••••••••••••••••') {
      setErrorMessage('Please enter your xAI API key');
      return;
    }

    setStatus('testing');
    setSaveMessage('');
    setErrorMessage('');

    try {
      const response = await fetch('/api/ai-plugins/test/xai', {
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
      console.error('Error testing xAI API connection:', error);
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
    { value: 'grok-2-1212', label: 'Grok-2 (Text)' },
    { value: 'grok-2-vision-1212', label: 'Grok-2-Vision (Text + Image)' },
    { value: 'grok-vision-beta', label: 'Grok-Vision-Beta (Text + Image)' },
    { value: 'grok-beta', label: 'Grok-Beta (Text)' },
  ];

  return (
    <div className="integration-detail-card">
      <div className="card-header">
        <div className="integration-icon">
          <img src="/assets/icons/xai-logo.svg" alt="xAI Grok Logo" />
        </div>
        <div className="integration-title">
          <h2>xAI (Grok)</h2>
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
          xAI's Grok models provide advanced reasoning, current knowledge, and
          multimodal capabilities. Connect your xAI API key to enhance Wrfcoin
          with powerful weather and climate data analysis.
        </p>

        <div className="features-list">
          <h4>Features:</h4>
          <ul>
            <li>Advanced reasoning for complex weather pattern analysis</li>
            <li>Support for text and image inputs with Grok-vision models</li>
            <li>
              Long context window (up to 131,072 tokens) for comprehensive data
              analysis
            </li>
            <li>Multi-turn conversations for iterative data exploration</li>
            <li>
              Current knowledge integration for up-to-date climate insights
            </li>
            <li>Advanced data visualization interpretation</li>
          </ul>
        </div>

        <div className="configuration-section">
          <h4>Configuration</h4>

          <div className="form-group">
            <label htmlFor="xai-api-key">API Key</label>
            <div className="api-key-input">
              <WrfInput
                type={showApiKey ? 'text' : 'password'}
                id="xai-api-key"
                value={apiKey}
                onChange={handleChangeApiKey}
                placeholder="Enter your xAI API key"
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
                href="https://api.x.ai/"
                target="_blank"
                rel="noopener noreferrer"
              >
                xAI API Portal
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
            <small>Select the appropriate model based on your needs</small>
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
              onChange={e => setTemperature(parseFloat(e.target.value) || 0.7)}
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
            href="https://api.x.ai/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            xAI API Docs
          </a>
          <a href="https://api.x.ai/" target="_blank" rel="noopener noreferrer">
            Get API Key
          </a>
          <a href="https://x.ai/" target="_blank" rel="noopener noreferrer">
            xAI Website
          </a>
        </div>
      </div>
    </div>
  );
};

export default XAICard;
