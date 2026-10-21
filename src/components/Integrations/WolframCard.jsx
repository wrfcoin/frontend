import React, { useState, useEffect } from 'react';
import { WrfButton, WrfInput } from '../DesignSystem';
import './IntegrationCards.css';

/**
 * Wolfram Alpha & Wolfram Language Integration Card Component
 *
 * This component displays details about the Wolfram integration and
 * allows users to configure their Wolfram Alpha API key and related settings.
 */
const WolframCard = () => {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState('unconfigured'); // unconfigured, testing, connected, error
  const [errorMessage, setErrorMessage] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [enableComputation, setEnableComputation] = useState(true);
  const [cacheResults, setCacheResults] = useState(true);
  const [includePods, setIncludePods] = useState('*');

  // Fetch current configuration on mount
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/wolfram/config');
      const data = await response.json();

      if (data.success && data.config) {
        if (data.config.apiKey) {
          // Mask the API key
          setApiKey('••••••••••••••••••••••••••••••');
          setStatus(data.config.connected ? 'connected' : 'configured');
        }

        if (data.config.enableComputation !== undefined) {
          setEnableComputation(data.config.enableComputation);
        }

        if (data.config.cacheResults !== undefined) {
          setCacheResults(data.config.cacheResults);
        }

        if (data.config.includePods) {
          setIncludePods(data.config.includePods);
        }
      }
    } catch (error) {
      console.error('Error fetching Wolfram configuration:', error);
    }
  };

  const saveConfig = async () => {
    // Clear previous messages
    setSaveMessage('');
    setErrorMessage('');

    if (!apiKey || apiKey === '••••••••••••••••••••••••••••••') {
      setErrorMessage('Please enter your Wolfram Alpha API key');
      return;
    }

    setStatus('testing');

    try {
      const response = await fetch('/api/wolfram/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey,
          enableComputation,
          cacheResults,
          includePods,
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
      console.error('Error saving Wolfram API key:', error);
    }
  };

  const testConnection = async () => {
    // Skip if no API key is configured
    if (!apiKey || apiKey === '••••••••••••••••••••••••••••••') {
      setErrorMessage('Please enter your Wolfram Alpha API key');
      return;
    }

    setStatus('testing');
    setSaveMessage('');
    setErrorMessage('');

    try {
      const response = await fetch('/api/wolfram/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey,
        }),
      });

      const data = await response.json();

      if (data.success && data.status === 'connected') {
        setStatus('connected');
        setSaveMessage(
          'Connection successful! Wolfram integration is working properly.',
        );
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Connection test failed');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('Network error: Could not connect to server');
      console.error('Error testing Wolfram API connection:', error);
    }
  };

  const runSampleQuery = async () => {
    // Skip if not connected
    if (status !== 'connected') {
      setErrorMessage('Please configure and test your connection first');
      return;
    }

    setSaveMessage('');
    setErrorMessage('');

    try {
      const response = await fetch('/api/wolfram/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'average temperature on earth',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSaveMessage(`Sample query result: ${data.result}`);
      } else {
        setErrorMessage(data.error || 'Sample query failed');
      }
    } catch (error) {
      setErrorMessage('Network error: Could not connect to server');
      console.error('Error running sample Wolfram query:', error);
    }
  };

  const handleChangeApiKey = e => {
    setApiKey(e.target.value);
    // If key was previously masked and user starts typing, we're changing it
    if (e.target.value !== '••••••••••••••••••••••••••••••') {
      setShowApiKey(true);
    }
  };

  return (
    <div className="integration-detail-card">
      <div className="card-header">
        <div className="integration-icon">
          <img src="/assets/icons/wolfram-logo.svg" alt="Wolfram Logo" />
        </div>
        <div className="integration-title">
          <h2>Wolfram Alpha & Language</h2>
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
          The Wolfram Alpha and Wolfram Language integration provides advanced
          computational intelligence capabilities to Wrfcoin Core. Connect your
          Wolfram API key to unlock powerful data analysis, mathematical
          computation, and scientific modeling features.
        </p>

        <div className="features-list">
          <h4>Features:</h4>
          <ul>
            <li>
              Powerful computational knowledge engine for weather data analysis
            </li>
            <li>Advanced mathematical modeling capabilities</li>
            <li>Scientific computing with Wolfram Language</li>
            <li>Natural language query processing for atmospheric data</li>
            <li>Statistical analysis for meteorological datasets</li>
            <li>Integration with climate models for forecasting</li>
          </ul>
        </div>

        <div className="configuration-section">
          <h4>Configuration</h4>

          <div className="form-group">
            <label htmlFor="wolfram-api-key">Wolfram API Key</label>
            <div className="api-key-input">
              <WrfInput
                type={showApiKey ? 'text' : 'password'}
                id="wolfram-api-key"
                value={apiKey}
                onChange={handleChangeApiKey}
                placeholder="Enter your Wolfram Alpha AppID"
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
                href="https://developer.wolframalpha.com/portal/myapps/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Wolfram Developer Portal
              </a>
            </small>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={enableComputation}
                onChange={e => setEnableComputation(e.target.checked)}
              />
              Enable Computational Features (Wolfram Language)
            </label>
            <small>
              Allow execution of computational code using Wolfram Language
            </small>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={cacheResults}
                onChange={e => setCacheResults(e.target.checked)}
              />
              Cache API Results
            </label>
            <small>
              Store results locally to reduce API calls and speed up repeated
              queries
            </small>
          </div>

          <div className="form-group">
            <WrfInput
              type="text"
              label="Include Pods"
              id="include-pods"
              value={includePods}
              onChange={e => setIncludePods(e.target.value)}
              placeholder="*"
            />
            <small>
              Comma-separated list of pods to include in results, or * for all
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
            <WrfButton variant="secondary" onClick={runSampleQuery}>
              Run Sample Query
            </WrfButton>
          </div>
        </div>
      </div>

      <div className="card-footer">
        <div className="external-links">
          <a
            href="https://developer.wolframalpha.com/documentation"
            target="_blank"
            rel="noopener noreferrer"
          >
            Wolfram API Docs
          </a>
          <a
            href="https://developer.wolframalpha.com/portal/myapps/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Get API Key
          </a>
          <a
            href="https://www.wolframalpha.com/examples/science-and-technology/weather-and-meteorology"
            target="_blank"
            rel="noopener noreferrer"
          >
            Wolfram Weather Examples
          </a>
        </div>
      </div>
    </div>
  );
};

export default WolframCard;
