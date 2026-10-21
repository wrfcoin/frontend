import DemoSurfaceGate from '../common/DemoSurfaceGate';
import React, { useState, useEffect } from 'react';
import { Box, Tab, Tabs, Alert, AlertTitle } from '@mui/material';
import './IntegrationsHub.css';
import './IntegrationCards.css';
import './EnhancedIntegrations.css';
import PageTitle from '../common/PageTitle';
import {
  sanitizeHtml,
  sanitizeUrlParam,
  sanitizeId,
  escapeHtml,
} from '../../utils/securityUtils';

// Import existing components
import IntegrationsGridView from './IntegrationsGridView';
import AIIntegrationsHub from './AIIntegrationsHub';

// Import new enhanced components
import AdvancedSearch from './AdvancedSearch';
import StatusMonitorGrid from './StatusMonitorGrid';
import IntegrationWizard from './IntegrationWizard';
import CategoryOptimizer from './CategoryOptimizer';
import EnhancedIntegrationsHub from './EnhancedIntegrationsHub';

/**
 * Enhanced IntegrationsHub - Integrates new advanced features with existing functionality
 *
 * Features:
 * - Advanced search with fuzzy matching and recommendations
 * - Real-time status monitoring with WebSocket updates
 * - Guided integration setup wizard
 * - AI-powered category optimization
 * - Seamless integration with existing components
 */
const IntegrationsHubEnhancedSample = ({ category, integration }) => {
  const [useEnhancedHub, setUseEnhancedHub] = useState(true);
  const [isFeatureEnabled, setIsFeatureEnabled] = useState(true);

  // Check if enhanced features should be enabled
  useEffect(() => {
    // Check localStorage for user preference
    const preference = localStorage.getItem('wrfcoin-enhanced-integrations');
    const enabledByDefault = true; // Feature flag

    setUseEnhancedHub(preference ? JSON.parse(preference) : enabledByDefault);
    setIsFeatureEnabled(enabledByDefault);
  }, []);

  // Sanitize inputs
  const sanitizedCategory = category ? sanitizeId(category) : null;
  const sanitizedIntegration = integration ? sanitizeId(integration) : null;

  // Feature announcement
  const showFeatureAlert =
    isFeatureEnabled &&
    !localStorage.getItem('wrfcoin-enhanced-integrations-seen');

  const handleFeatureAlertClose = () => {
    localStorage.setItem('wrfcoin-enhanced-integrations-seen', 'true');
  };

  const toggleEnhancedHub = () => {
    const newValue = !useEnhancedHub;
    setUseEnhancedHub(newValue);
    localStorage.setItem(
      'wrfcoin-enhanced-integrations',
      JSON.stringify(newValue),
    );
  };

  // If enhanced features are disabled or not available, fall back to original hub
  if (!isFeatureEnabled || !useEnhancedHub) {
    return (
      <div className="integrations-hub full-width-container">
        <div className="integrations-title-section">
          <PageTitle
            title="Integrations Hub"
            subtitle="Connect with external networks, data sources and services"
          />

          {isFeatureEnabled && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <AlertTitle>Enhanced Features Available</AlertTitle>
              Experience our new advanced integrations hub with AI-powered
              search, real-time monitoring, and smart categorization.
              <Box sx={{ mt: 1 }}>
                <button
                  onClick={toggleEnhancedHub}
                  style={{
                    background: '#1976d2',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Try Enhanced Hub
                </button>
              </Box>
            </Alert>
          )}
        </div>

        <div className="integrations-container full-width">
          <div className="integrations-content full-width">
            <div className="integration-content">
              <IntegrationsGridView
                setActiveTab={() => {}}
                filterCategory={sanitizedCategory}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render enhanced hub
  return (
    <div className="enhanced-integrations-hub">
      {/* Feature announcement */}
      {showFeatureAlert && (
        <Alert
          severity="success"
          onClose={handleFeatureAlertClose}
          sx={{ mb: 2 }}
        >
          <AlertTitle>🎉 New Enhanced Integrations Hub!</AlertTitle>
          Welcome to the upgraded integrations experience featuring:
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>
              <strong>Advanced Search:</strong> Smart search with
              recommendations and filters
            </li>
            <li>
              <strong>Real-time Monitoring:</strong> Live status updates and
              performance metrics
            </li>
            <li>
              <strong>Setup Wizard:</strong> Guided integration configuration
            </li>
            <li>
              <strong>AI Optimization:</strong> Smart category suggestions and
              organization
            </li>
          </ul>
          <Box sx={{ mt: 1 }}>
            <button
              onClick={toggleEnhancedHub}
              style={{
                background: 'transparent',
                color: '#1976d2',
                border: '1px solid #1976d2',
                padding: '4px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '8px',
              }}
            >
              Use Classic Hub
            </button>
          </Box>
        </Alert>
      )}

      {/* Enhanced hub component */}
      <EnhancedIntegrationsHub
        category={sanitizedCategory}
        integration={sanitizedIntegration}
      />

      {/* Quick toggle for testing */}
      <div
        style={{
          position: 'fixed',
          bottom: '100px',
          left: '20px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          cursor: 'pointer',
          zIndex: 1000,
        }}
        onClick={toggleEnhancedHub}
      >
        Switch to Classic Hub
      </div>
    </div>
  );
};

const IntegrationsHubEnhanced = (props) => (
  <DemoSurfaceGate
    testId="integrations-enhanced"
    title="Integrations preview is not live on this testnet"
    description="This preview contains illustrative data or simulated actions, not verified testnet results."
  >
    <IntegrationsHubEnhancedSample {...props} />
  </DemoSurfaceGate>
);

export default IntegrationsHubEnhanced;
