import React, { useState, useEffect } from 'react';
import { WrfButton, WrfInput, WrfSelect } from '../DesignSystem';
import './IntegrationCards.css';

/**
 * OpenAI Integration Card Component
 *
 * This component displays details about the OpenAI integration and
 * allows users to configure their OpenAI API key.
 */
const OpenAICard = () => {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState('unconfigured'); // unconfigured, testing, connected, error
  const [errorMessage, setErrorMessage] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [model, setModel] = useState('gpt-4o');
  const [maxTokens, setMaxTokens] = useState(2048);

  // Fetch current configuration on mount
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/ai-plugins/config/openai');
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
      console.error('Error fetching OpenAI configuration:', error);
    }
  };

  const saveConfig = async () => {
    // Clear previous messages
    setSaveMessage('');
    setErrorMessage('');

    if (!apiKey || apiKey === '••••••••••••••••••••••••••••••') {
      setErrorMessage('Please enter your OpenAI API key');
      return;
    }

    setStatus('testing');

    try {
      const response = await fetch('/api/ai-plugins/config/openai', {
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
      console.error('Error saving OpenAI API key:', error);
    }
  };

  const testConnection = async () => {
    // Skip if no API key is configured
    if (!apiKey || apiKey === '••••••••••••••••••••••••••••••') {
      setErrorMessage('Please enter your OpenAI API key');
      return;
    }

    setStatus('testing');
    setSaveMessage('');
    setErrorMessage('');

    try {
      const response = await fetch('/api/ai-plugins/test/openai', {
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
      console.error('Error testing OpenAI API connection:', error);
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
    { value: 'gpt-4o', label: 'GPT-4o (Latest multimodal model)' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { value: 'dall-e-3', label: 'DALL-E 3 (Image generation)' },
    { value: 'whisper-1', label: 'Whisper (Audio transcription)' },
  ];

  return (
    <div className="integration-detail-card">
      <div className="card-header">
        <div className="integration-icon">
          <img src="/assets/icons/openai-logo.svg" alt="OpenAI Logo" />
        </div>
        <div className="integration-title">
          <h2>OpenAI</h2>
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
          OpenAI provides powerful AI models for text, image, and audio
          processing. Connect your OpenAI API key to enhance Wrfcoin with
          advanced AI capabilities for weather data analysis, forecasting, and
          visualization.
        </p>

        <div className="features-list">
          <h4>Features:</h4>
          <ul>
            <li>Powerful text generation for detailed weather reports</li>
            <li>Multimodal capabilities for analyzing weather imagery</li>
            <li>Advanced data interpretation for meteorological insights</li>
            <li>Integration with GPT-4o for supreme reasoning capabilities</li>
            <li>Image generation for weather pattern visualization</li>
            <li>Audio transcription for voice-based weather queries</li>
          </ul>
        </div>

        <div className="configuration-section">
          <h4>Configuration</h4>

          <div className="form-group">
            <label htmlFor="openai-api-key">API Key</label>
            <div className="api-key-input">
              <WrfInput
                type={showApiKey ? 'text' : 'password'}
                id="openai-api-key"
                value={apiKey}
                onChange={handleChangeApiKey}
                placeholder="Enter your OpenAI API key"
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
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
              >
                OpenAI Dashboard
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
              GPT-4o is the latest model with multimodal capabilities
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
            href="https://platform.openai.com/docs/introduction"
            target="_blank"
            rel="noopener noreferrer"
          >
            OpenAI Docs
          </a>
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
          >
            Get API Key
          </a>
          <a
            href="https://openai.com/gpt-4o"
            target="_blank"
            rel="noopener noreferrer"
          >
            About GPT-4o
          </a>
        </div>
      </div>
    </div>
  );
};

export default OpenAICard;
