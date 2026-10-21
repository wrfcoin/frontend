import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import './IntegrationCards.css';

const N8nCard = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('unconfigured');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/plugins/n8n/status');

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.status) {
          const { enabled, status: connectionStatus } = data.status;

          if (!enabled) {
            setStatus('unconfigured');
          } else if (connectionStatus === 'connected') {
            setStatus('connected');
          } else if (connectionStatus === 'error') {
            setStatus('error');
          } else {
            setStatus('configured');
          }
        } else {
          setStatus('unconfigured');
        }
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Error fetching n8n status:', error);
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigureClick = () => {
    navigate('/integrations/automation/n8n/config');
  };

  const getStatusText = () => {
    switch (status) {
    case 'connected':
      return 'Connected';
    case 'configured':
      return 'Configured';
    case 'error':
      return 'Connection Error';
    case 'testing':
      return 'Testing Connection';
    default:
      return 'Not Configured';
    }
  };

  return (
    <div className="integration-card">
      <div className="integration-card-header">
        <div className="integration-card-icon">
          <img
            src="/images/integrations/n8n-logo.png"
            alt="n8n Logo"
            onError={e => {
              e.target.onerror = null;
              e.target.src = '/images/integration-fallback.svg';
            }}
          />
        </div>
        <div className="integration-card-title">
          <h3>n8n Workflow Automation</h3>
        </div>
      </div>
      <div className="integration-card-content">
        <p>
          Connect Wrfcoin Core to n8n workflow automation platform to trigger
          actions based on blockchain events and automate cross-system
          workflows.
        </p>
      </div>
      <div className="integration-card-footer">
        <div className="card-status">
          {isLoading ? 'Loading...' : getStatusText()}
        </div>
        <button className="configure-button" onClick={handleConfigureClick}>
          Configure
        </button>
      </div>
    </div>
  );
};

export default N8nCard;
