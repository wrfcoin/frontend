import React, { useState, useEffect } from 'react';
import { WrfButton, WrfInput, WrfSelect } from '../DesignSystem';
import './IntegrationCards.css';

/**
 * Local Model Integration Card Component
 *
 * This component displays details about local AI models that can be used with Wrfcoin
 * and allows users to configure paths to their locally hosted models.
 */
const LocalModelCard = () => {
  const [status, setStatus] = useState('unconfigured'); // unconfigured, testing, connected, error
  const [errorMessage, setErrorMessage] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [modelPath, setModelPath] = useState('');
  const [modelType, setModelType] = useState('llama.cpp');
  const [modelName, setModelName] = useState('');
  const [hostDetails, setHostDetails] = useState({
    host: 'localhost',
    port: 8000,
    useServer: true,
  });

  // Fetch current configuration on mount
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/ai-plugins/config/local');
      const data = await response.json();

      if (data.success && data.config) {
        setStatus(data.config.connected ? 'connected' : 'configured');

        if (data.config.modelPath) {
          setModelPath(data.config.modelPath);
        }

        if (data.config.modelType) {
          setModelType(data.config.modelType);
        }

        if (data.config.modelName) {
          setModelName(data.config.modelName);
        }

        if (data.config.hostDetails) {
          setHostDetails(data.config.hostDetails);
        }
      }
    } catch (error) {
      console.error('Error fetching local model configuration:', error);
    }
  };

  const saveConfig = async () => {
    // Clear previous messages
    setSaveMessage('');
    setErrorMessage('');

    if (!modelPath && !hostDetails.useServer) {
      setErrorMessage('Please enter a valid model path');
      return;
    }

    if (hostDetails.useServer && (!hostDetails.host || !hostDetails.port)) {
      setErrorMessage('Please enter valid server host and port');
      return;
    }

    if (!modelName) {
      setErrorMessage('Please enter a name for your model');
      return;
    }

    setStatus('testing');

    try {
      const response = await fetch('/api/ai-plugins/config/local', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelPath,
          modelType,
          modelName,
          hostDetails,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus('connected');
        setSaveMessage('Configuration saved successfully!');
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Failed to save configuration');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('Network error: Could not connect to server');
      console.error('Error saving local model configuration:', error);
    }
  };

  const testConnection = async () => {
    if (!modelPath && !hostDetails.useServer) {
      setErrorMessage('Please enter a valid model path');
      return;
    }

    if (hostDetails.useServer && (!hostDetails.host || !hostDetails.port)) {
      setErrorMessage('Please enter valid server host and port');
      return;
    }

    setStatus('testing');
    setSaveMessage('');
    setErrorMessage('');

    try {
      const response = await fetch('/api/ai-plugins/test/local', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelPath,
          modelType,
          modelName,
          hostDetails,
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
      console.error('Error testing local model connection:', error);
    }
  };

  const toggleUseServer = () => {
    setHostDetails(prev => ({
      ...prev,
      useServer: !prev.useServer,
    }));
  };

  const modelTypeOptions = [
    { value: 'llama.cpp', label: 'LLaMA.cpp' },
    { value: 'ggml', label: 'GGML' },
    { value: 'onnx', label: 'ONNX' },
    { value: 'transformers', label: 'Hugging Face Transformers' },
    { value: 'gguf', label: 'GGUF' },
    { value: 'ollama', label: 'Ollama' },
    { value: 'localai', label: 'LocalAI' },
    { value: 'custom', label: 'Custom' },
  ];

  return (
    <div className="integration-detail-card">
      <div className="card-header">
        <div className="integration-icon">
          <img
            src="/assets/icons/local-model-logo.svg"
            alt="Local Model Logo"
          />
        </div>
        <div className="integration-title">
          <h2>Local AI Models</h2>
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
          Connect to locally hosted AI models or servers for enhanced privacy
          and control. Use your own models with Wrfcoin to process weather data,
          analyze blockchain information, and generate forecasts without relying
          on external API services.
        </p>

        <div className="features-list">
          <h4>Features:</h4>
          <ul>
            <li>Complete privacy with on-device or self-hosted models</li>
            <li>No API costs or rate limits</li>
            <li>Support for popular open-source model frameworks</li>
            <li>Full control over model parameters and behavior</li>
            <li>Enhanced security for sensitive weather data</li>
            <li>Ability to customize models for meteorological applications</li>
          </ul>
        </div>

        <div className="configuration-section">
          <h4>Configuration</h4>

          <div className="form-group">
            <WrfInput
              type="text"
              label="Model Display Name"
              id="model-name"
              value={modelName}
              onChange={e => setModelName(e.target.value)}
              placeholder="Enter a name for your model"
            />
            <small>
              A friendly name to identify this model in the application
            </small>
          </div>

          <div className="form-group">
            <WrfSelect
              label="Model Type"
              id="model-type"
              value={modelType}
              onChange={e => setModelType(e.target.value)}
              options={modelTypeOptions}
            />
            <small>The framework or format of your local model</small>
          </div>

          <div className="form-group">
            <div className="checkbox-field">
              <input
                type="checkbox"
                id="use-server"
                checked={hostDetails.useServer}
                onChange={toggleUseServer}
              />
              <label htmlFor="use-server">Connect to model server</label>
            </div>
            <small>
              Check if the model is hosted on a server instead of a local file
            </small>
          </div>

          {hostDetails.useServer ? (
            <div className="server-details">
              <div className="form-group">
                <WrfInput
                  type="text"
                  label="Server Host"
                  id="server-host"
                  value={hostDetails.host}
                  onChange={e =>
                    setHostDetails(prev => ({ ...prev, host: e.target.value }))
                  }
                  placeholder="localhost or IP address"
                />
              </div>

              <div className="form-group">
                <WrfInput
                  type="number"
                  label="Server Port"
                  id="server-port"
                  value={hostDetails.port}
                  onChange={e =>
                    setHostDetails(prev => ({
                      ...prev,
                      port: parseInt(e.target.value) || 8000,
                    }))
                  }
                  placeholder="8000"
                />
              </div>
            </div>
          ) : (
            <div className="form-group">
              <WrfInput
                type="text"
                label="Model Path"
                id="model-path"
                value={modelPath}
                onChange={e => setModelPath(e.target.value)}
                placeholder="/path/to/your/model.bin"
              />
              <small>
                Absolute path to your model file on the local file system
              </small>
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
            href="https://github.com/ggerganov/llama.cpp"
            target="_blank"
            rel="noopener noreferrer"
          >
            LLaMA.cpp
          </a>
          <a
            href="https://ollama.ai/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ollama
          </a>
          <a
            href="https://github.com/go-skynet/LocalAI"
            target="_blank"
            rel="noopener noreferrer"
          >
            LocalAI
          </a>
        </div>
      </div>
    </div>
  );
};

export default LocalModelCard;
