import React, { useState, useEffect } from 'react';
import { WrfButton, WrfInput, WrfSelect } from '../DesignSystem';
import './IntegrationCards.css';

/**
 * Anthropic (Claude) Integration Card Component
 *
 * This component displays details about the Anthropic integration and
 * allows users to configure their Anthropic API key.
 */
const AnthropicCard = () => {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState('unconfigured'); // unconfigured, testing, connected, error
  const [errorMessage, setErrorMessage] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [model, setModel] = useState('claude-3-7-sonnet-20250219');
  const [maxTokens, setMaxTokens] = useState(1024);

  // Fetch current configuration on mount
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/ai-plugins/config/anthropic');
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
      console.error('Error fetching Anthropic configuration:', error);
    }
  };

  const saveConfig = async () => {
    // Clear previous messages
    setSaveMessage('');
    setErrorMessage('');

    if (!apiKey || apiKey === '••••••••••••••••••••••••••••••') {
      setErrorMessage('Please enter your Anthropic API key');
      return;
    }

    setStatus('testing');

    try {
      const response = await fetch('/api/ai-plugins/config/anthropic', {
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
      console.error('Error saving Anthropic API key:', error);
    }
  };

  const testConnection = async () => {
    // Skip if no API key is configured
    if (!apiKey || apiKey === '••••••••••••••••••••••••••••••') {
      setErrorMessage('Please enter your Anthropic API key');
      return;
    }

    setStatus('testing');
    setSaveMessage('');
    setErrorMessage('');

    try {
      const response = await fetch('/api/ai-plugins/test/anthropic', {
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
      console.error('Error testing Anthropic API connection:', error);
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
    { value: 'claude-3-7-sonnet-20250219', label: 'Claude 3.7 Sonnet (Latest)' },
    { value: 'claude-3-5-sonnet-20240620', label: 'Claude 3.5 Sonnet' },
    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
    { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
  ];

  return (
    <div className="integration-detail-card">
      <div className="card-header">
        <div className="integration-icon">
          <img src="/assets/icons/anthropic-logo.svg" alt="Anthropic Logo" />
        </div>
        <div className="integration-title">
          <h2>Anthropic (Claude)</h2>
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
          Anthropic's Claude models provide advanced AI capabilities with strong
          reasoning and comprehensive understanding. Connect your Anthropic API
          key to enhance Wrfcoin with Claude's powerful multimodal capabilities.
        </p>

        <div className="features-list">
          <h4>Features:</h4>
          <ul>
            <li>
              Advanced multimodal capabilities for analyzing text and images
            </li>
            <li>State-of-the-art weather pattern recognition and analysis</li>
            <li>Thoughtful, helpful, and harmless AI responses</li>
            <li>
              Accurate data interpretation for meteorological applications
            </li>
            <li>Enhanced blockchain data analysis and insights</li>
            <li>
              Support for multiple Claude models with different capabilities
            </li>
          </ul>
        </div>

        <div className="configuration-section">
          <h4>Configuration</h4>

          <div className="form-group">
            <label htmlFor="anthropic-api-key">API Key</label>
            <div className="api-key-input">
              <WrfInput
                type={showApiKey ? 'text' : 'password'}
                id="anthropic-api-key"
                value={apiKey}
                onChange={handleChangeApiKey}
                placeholder="Enter your Anthropic API key"
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
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
              >
                Anthropic Console
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
              Claude 3.7 Sonnet is the most recent and recommended model
            </small>
          </div>

          <div className="form-group">
            <WrfInput
              type="number"
              label="Max Output Tokens"
              id="max-tokens"
              value={maxTokens}
              onChange={e => setMaxTokens(parseInt(e.target.value) || 1024)}
              slotProps={{ htmlInput: { min: 1, max: 4096 } }}
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
            href="https://docs.anthropic.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Anthropic Docs
          </a>
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
          >
            Get API Key
          </a>
          <a
            href="https://www.anthropic.com/news/claude-3-7-family"
            target="_blank"
            rel="noopener noreferrer"
          >
            About Claude 3.7
          </a>
        </div>
      </div>
    </div>
  );
};

export default AnthropicCard;
