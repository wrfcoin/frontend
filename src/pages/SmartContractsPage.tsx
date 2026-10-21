/**
 * Smart Contracts Network Page
 *
 * Dedicated page component for the WRFCoin Smart Contract Graph visualization.
 * Integrates seamlessly with the existing WRFCoin React frontend architecture.
 *
 * Features:
 * - Full-screen interactive D3.js graph visualization
 * - Real-time smart contract network analysis
 * - Comprehensive filtering and search capabilities
 * - Export functionality for PNG, SVG, and JSON formats
 * - Mobile-responsive design with collapsible controls
 * - Integration with WRFCoin backend API endpoints
 * - Accessibility compliance and keyboard navigation
 */

import React, { useEffect, useState } from 'react';
import SmartContractGraphDashboard from '../components/SmartContractGraphDashboard';
import LoadingSpinner from '../components/Loading/LoadingSpinner';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { SmartContractGraphData } from '../types/smartContract';
import { WrfCapabilityReadinessBadge } from '../components/DesignSystem';
import './SmartContractsPage.css';
import { devLog } from '../utils/logger';

interface SmartContractsPageProps {
  className?: string;
}

const SmartContractsPage: React.FC<SmartContractsPageProps> = ({
  className = '',
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<SmartContractGraphData | null>(
    null,
  );
  const [networkStatus, setNetworkStatus] = useState({
    connected: true,
    lastUpdated: new Date(),
  });

  // Set page title
  useEffect(() => {
    document.title = 'Smart Contract Network - WRFCoin';
    return () => {
      document.title = 'WRFCoin'; // Reset title on unmount
    };
  }, []);

  // Fetch initial data on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch smart contract graph data from API
        const response = await fetch('/api/smart-contracts/graph');
        if (response.status === 404) {
          setError('Smart contract data unavailable — the graph endpoint is not currently mounted on this server.');
          setNetworkStatus({ connected: false, lastUpdated: new Date() });
          return;
        }
        if (!response.ok) {
          throw new Error(
            `Failed to fetch contract data: ${response.statusText}`,
          );
        }

        const apiResponse = await response.json();
        const data: SmartContractGraphData = apiResponse.success
          ? apiResponse.data
          : apiResponse;
        setGraphData(data);
        setNetworkStatus({
          connected: true,
          lastUpdated: new Date(),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error loading smart contract data';
        console.error('Failed to load smart contract data:', err);
        setError(message);
        setNetworkStatus({ connected: false, lastUpdated: new Date() });
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();

    // Remove frequent auto-updates to prevent visualization glitching
    // Users can manually refresh if needed
  }, []); // Empty dependency array - only run once on mount

  // Handle node selection for detailed analysis
  const handleNodeSelect = (nodeId: string | null) => {
    if (nodeId) {
      devLog(`Selected smart contract: ${nodeId}`);
      // Future: Could open detailed contract analysis panel
    }
  };

  // Handle data export events
  const handleDataExport = (data: any, format: string) => {
    devLog(`Exported smart contract data as ${format}`);
    // Future: Could send analytics event
  };

  // Handle refresh action
  const handleRefresh = async () => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/smart-contracts/graph');
      if (response.status === 404) {
        setError('Smart contract data unavailable — the graph endpoint is not currently mounted on this server.');
        setNetworkStatus({ connected: false, lastUpdated: new Date() });
        return;
      }
      if (!response.ok) {
        throw new Error(`Failed to refresh data: ${response.statusText}`);
      }

      const apiResponse = await response.json();
      const data = apiResponse.success ? apiResponse.data : apiResponse;
      setGraphData(data);
      setNetworkStatus({
        connected: true,
        lastUpdated: new Date(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error refreshing smart contract data';
      console.error('Failed to refresh data:', err);
      setError(message);
      setNetworkStatus({ connected: false, lastUpdated: new Date() });
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading && !graphData) {
    return (
      <div className="smart-contracts-page loading-state">
        <LoadingSpinner message="Loading smart contract network..." />
      </div>
    );
  }

  // Error / unavailable state
  if (error) {
    return (
      <div className="smart-contracts-page error-state">
        <div className="error-container">
          <div className="error-content">
            <div className="error-icon">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z" />
              </svg>
            </div>
            <h2>Smart Contract Data Unavailable</h2>
            <p>{error}</p>
            <div className="error-actions">
              <button
                className="retry-button"
                onClick={handleRefresh}
                disabled={loading}
              >
                {loading ? 'Retrying...' : 'Try Again'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`smart-contracts-page ${className}`}>
        {/* Page Header */}
        <div className="page-header">
          <div className="header-content">
            <div className="header-title">
              <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                Smart Contract Network
                <WrfCapabilityReadinessBadge featureName="smartContracts" compact />
              </h1>
              <p className="header-description">
                Interactive visualization of the WRFCoin smart contract
                ecosystem. Explore{' '}
                {graphData?.metadata?.totalContracts || '96+'} contracts across{' '}
                {graphData?.metadata?.categories
                  ? Object.keys(graphData.metadata.categories).length
                  : '10'}{' '}
                categories with real-time network analysis.
              </p>
            </div>

            <div className="header-actions">
              <div className="network-status">
                <div
                  className={`status-indicator ${networkStatus.connected ? 'connected' : 'disconnected'}`}
                >
                  <div className="status-dot"></div>
                  <span>{networkStatus.connected ? 'Live' : 'Offline'}</span>
                </div>
                <div className="last-updated">
                  Updated: {networkStatus.lastUpdated.toLocaleTimeString()}
                </div>
              </div>

              <button
                className="refresh-button"
                onClick={handleRefresh}
                disabled={loading}
                title="Refresh network data"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className={loading ? 'spinning' : ''}
                >
                  <path d="M12,4V1L8,5L12,9V6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12H4A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4Z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Help Documentation */}
        <div className="help-section">
          <details className="help-details">
            <summary>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M11,18H13V16H11V18M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20C7.59,20 4,16.41 4,12C7.59,4 4,12A10,10 0 0,0 12,2M12,20C7.59,20 4,16.41 4,12C7.59,4 4,12A10,10 0 0,0 12,2M12,6A4,4 0 0,0 8,10H10A2,2 0 0,1 12,8A2,2 0 0,1 14,10C14,12 11,11.75 11,15H13C13,12.75 16,12.5 16,10A4,4 0 0,0 12,6Z" />
              </svg>
              How to Use the Smart Contract Graph
            </summary>
            <div className="help-content">
              <div className="help-grid">
                <div className="help-section">
                  <h3>Navigation</h3>
                  <ul>
                    <li>
                      <strong>Pan:</strong> Click and drag empty space
                    </li>
                    <li>
                      <strong>Zoom:</strong> Mouse wheel or trackpad pinch
                    </li>
                    <li>
                      <strong>Select:</strong> Click on nodes or edges
                    </li>
                    <li>
                      <strong>Drag:</strong> Click and drag individual nodes
                    </li>
                  </ul>
                </div>

                <div className="help-section">
                  <h3>Contract Categories</h3>
                  <ul>
                    <li>
                      <strong>Core:</strong> WRFToken and primary contracts
                    </li>
                    <li>
                      <strong>DeFi:</strong> AMM, yield farming, liquidity pools
                    </li>
                    <li>
                      <strong>NFT:</strong> Marketplace and computational NFTs
                    </li>
                    <li>
                      <strong>Governance:</strong> DAO voting and proposals
                    </li>
                    <li>
                      <strong>Oracle:</strong> External data feeds
                    </li>
                  </ul>
                </div>

                <div className="help-section">
                  <h3>Visualization Features</h3>
                  <ul>
                    <li>
                      <strong>Node Size:</strong> Indicates contract importance
                      (1-10)
                    </li>
                    <li>
                      <strong>Edge Types:</strong> Different line styles show
                      relationship types
                    </li>
                    <li>
                      <strong>Colors:</strong> 10-category color coding system
                    </li>
                    <li>
                      <strong>Clustering:</strong> Related contracts group
                      together
                    </li>
                  </ul>
                </div>

                <div className="help-section">
                  <h3>Controls</h3>
                  <ul>
                    <li>
                      <strong>Filter:</strong> Show/hide by category, type,
                      audit status
                    </li>
                    <li>
                      <strong>Search:</strong> Find contracts by name or
                      description
                    </li>
                    <li>
                      <strong>Layout:</strong> Switch between visualization
                      layouts
                    </li>
                    <li>
                      <strong>Export:</strong> Save as PNG, SVG, or JSON
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </details>
        </div>

        {/* Main Dashboard */}
        <div className="dashboard-container">
          <SmartContractGraphDashboard
            initialData={graphData ?? undefined}
            showControls={true}
            controlsPosition="left"
            onNodeSelect={handleNodeSelect}
            onDataExport={handleDataExport}
            className="main-dashboard"
          />
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default SmartContractsPage;
