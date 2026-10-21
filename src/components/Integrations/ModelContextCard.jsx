import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { WrfCard, WrfButton } from '../DesignSystem';
import './IntegrationCards.css';

const ModelContextCard = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch configuration status
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/ai-plugins/config/modelcontext');
        if (response.ok) {
          const data = await response.json();
          setConfig(data);
          setIsConnected(data.enabled);
        }
      } catch (error) {
        console.error(
          'Error fetching Model Context Protocol configuration:',
          error,
        );
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const handleConfigure = () => {
    navigate('/integrations/ai/modelcontext');
  };

  return (
    <div className="integration-card">
      <div className="card-header">
        <div className="logo-wrapper">
          <div className="integration-logo model-context-logo">MCP</div>
        </div>
        <div className="status-indicator">
          <span
            className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}
          ></span>
          <span className="status-text">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <WrfCard headerTitle="Model Context Protocol">
        <p>
          Integrate with the Model Context Protocol to enhance AI model context
          management, enabling better interoperability between models and
          improved context handling for meteorological and environmental data
          processing.
        </p>

        {loading ? (
          <div className="loading-indicator">Loading configuration...</div>
        ) : config ? (
          <div className="config-summary">
            <div className="config-item">
              <span className="label">Status:</span>
              <span className="value">
                {config.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            {config.endpoint && (
              <div className="config-item">
                <span className="label">Endpoint:</span>
                <span className="value truncate">{config.endpoint}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="config-missing">
            Configuration not available. Click configure to set up.
          </div>
        )}
      </WrfCard>

      <div className="card-footer">
        <WrfButton variant="primary" onClick={handleConfigure}>
          Configure
        </WrfButton>
      </div>
    </div>
  );
};

export default ModelContextCard;
