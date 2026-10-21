import React, { useState, useEffect } from 'react';
import { WrfButton, WrfInput, WrfSelect } from '../DesignSystem';
import './IntegrationCards.css';

/**
 * Google Gemini Integration Card Component
 *
 * This component displays details about the Google Gemini integration and
 * allows users to configure their Google API key.
 */
const GeminiCard = () => {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState('unconfigured'); // unconfigured, testing, connected, error
  const [errorMessage, setErrorMessage] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [model, setModel] = useState('gemini-1.5-pro');
  const [maxTokens, setMaxTokens] = useState(2048);

  // Fetch current configuration on mount
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/ai-plugins/config/gemini');
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
      }
    } catch (error) {
      console.error('Error fetching Gemini configuration:', error);
    }
  };

  const saveConfig = async () => {
    // Clear previous messages
    setSaveMessage('');
    setErrorMessage('');

    if (!apiKey || apiKey === '••••••••••••••••••••••••••••••') {
      setErrorMessage('Please enter your Google API key');
      return;
    }

    setStatus('testing');

    try {
      const response = await fetch('/api/ai-plugins/config/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey,
          model,
          maxTokens,
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
      console.error('Error saving Gemini API key:', error);
    }
  };

  const testConnection = async () => {
    // Skip if no API key is configured
    if (!apiKey || apiKey === '••••••••••••••••••••••••••••••') {
      setErrorMessage('Please enter your Google API key');
      return;
    }

    setStatus('testing');
    setSaveMessage('');
    setErrorMessage('');

    try {
      const response = await fetch('/api/ai-plugins/test/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey,
          model,
          maxTokens,
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
      console.error('Error testing Gemini API connection:', error);
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
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Recommended)' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    { value: 'gemini-1.0-pro', label: 'Gemini 1.0 Pro' },
    { value: 'gemini-1.0-pro-vision', label: 'Gemini 1.0 Pro Vision' },
  ];

  return (
    <div className="integration-detail-card">
      <div className="card-header">
        <div className="integration-icon">
          <img src="/assets/icons/gemini-logo.svg" alt="Google Gemini Logo" />
        </div>
        <div className="integration-title">
          <h2>Google Gemini</h2>
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
          Google's Gemini models provide powerful multimodal capabilities for
          understanding and analyzing text, images, and code. Connect your
          Google API key to enhance Wrfcoin with Gemini's AI capabilities for
          weather data processing and analysis.
        </p>

        <div className="features-list">
          <h4>Features:</h4>
          <ul>
            <li>
              Advanced multimodal understanding for analyzing weather images and
              data
            </li>
            <li>
              Long context window for processing extensive weather datasets
            </li>
            <li>
              Code generation and interpretation for weather data analysis
            </li>
            <li>Complex reasoning for meteorological pattern recognition</li>
            <li>Enhanced data visualization suggestions and explanations</li>
            <li>Real-time weather data analysis and interpretation</li>
          </ul>
        </div>

        <div className="configuration-section">
          <h4>Configuration</h4>

          <div className="form-group">
            <label htmlFor="google-api-key">API Key</label>
            <div className="api-key-input">
              <WrfInput
                type={showApiKey ? 'text' : 'password'}
                id="google-api-key"
                value={apiKey}
                onChange={handleChangeApiKey}
                placeholder="Enter your Google API key"
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
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google AI Studio
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
              Gemini 1.5 Pro is the recommended model for most use cases
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
            href="https://ai.google.dev/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            Gemini Docs
          </a>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
          >
            Get API Key
          </a>
          <a
            href="https://ai.google.dev/models/gemini"
            target="_blank"
            rel="noopener noreferrer"
          >
            About Gemini Models
          </a>
        </div>
      </div>
    </div>
  );
};

export default GeminiCard;
