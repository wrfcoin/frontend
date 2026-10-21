import DemoSurfaceGate from '../components/common/DemoSurfaceGate';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import ErrorBoundary from '../components/common/ErrorBoundary';
import axios from 'axios';
import { WrfButton } from '../components/DesignSystem';

import ExecutionForm from '../components/ComputationalNFT/ExecutionForm';
import ExecutionMonitor from '../components/ComputationalNFT/ExecutionMonitor';
import WorkflowIntegration from '../components/ComputationalNFT/WorkflowIntegration';
import computationalWebSocket, {
  NFT_EXECUTION_EVENTS,
} from '../utils/computationalWebsocket';
import './ComputationalNFTPage.css';

const ComputationalNFTPageSample = () => {
  const { nftId } = useParams();
  const navigate = useNavigate();
  const [nft, setNft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [executionHistory, setExecutionHistory] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);

  // Connect to WebSocket when component mounts
  useEffect(() => {
    try {
      if (!computationalWebSocket.isConnected) {
        computationalWebSocket.connect();
      }
    } catch (error) {
      console.warn('Failed to initialize computational WebSocket:', error);
    }

    // Subscribe to execution events for this NFT
    const handleExecutionStart = data => {
      if (data.nftId === nftId) {
        setIsExecuting(true);
        setActiveTab('monitor');
      }
    };

    const handleExecutionComplete = data => {
      if (data.nftId === nftId) {
        setIsExecuting(false);
        // Add to execution history
        setExecutionHistory(prev => [
          {
            timestamp: data.timestamp,
            status: 'completed',
            executionTime: data.stats?.executionTime || 0,
            result: data.result,
          },
          ...prev,
        ]);
      }
    };

    const handleExecutionError = data => {
      if (data.nftId === nftId) {
        setIsExecuting(false);
        // Add to execution history
        setExecutionHistory(prev => [
          {
            timestamp: data.timestamp,
            status: 'error',
            error: data.error,
          },
          ...prev,
        ]);
      }
    };

    // Add event listeners
    try {
      computationalWebSocket.on(
        NFT_EXECUTION_EVENTS.START,
        handleExecutionStart,
      );
      computationalWebSocket.on(
        NFT_EXECUTION_EVENTS.COMPLETE,
        handleExecutionComplete,
      );
      computationalWebSocket.on(
        NFT_EXECUTION_EVENTS.ERROR,
        handleExecutionError,
      );
    } catch (error) {
      console.warn('Failed to subscribe to computational execution events:', error);
    }

    return () => {
      // Remove event listeners
      try {
        computationalWebSocket.off(
          NFT_EXECUTION_EVENTS.START,
          handleExecutionStart,
        );
        computationalWebSocket.off(
          NFT_EXECUTION_EVENTS.COMPLETE,
          handleExecutionComplete,
        );
        computationalWebSocket.off(
          NFT_EXECUTION_EVENTS.ERROR,
          handleExecutionError,
        );
      } catch (error) {
        console.warn('Failed to unsubscribe from computational execution events:', error);
      }
    };
  }, [nftId]);

  // Fetch NFT data
  useEffect(() => {
    if (!nftId) {
      setError('Invalid NFT identifier.');
      setLoading(false);
      return undefined;
    }

    let isMounted = true;
    const controller = new AbortController();

    const fetchNFT = async () => {
      setLoading(true);
      setError(null);
      setNft(null);

      try {
        const response = await axios.get(`/api/computational/nfts/${nftId}`, {
          timeout: 10000,
          signal: controller.signal,
        });

        if (!isMounted) {
          return;
        }

        if (!response?.data) {
          setNft(null);
          setError(null);
          return;
        }

        setNft(response.data);
      } catch (err) {
        if (!isMounted || err?.name === 'CanceledError') {
          return;
        }

        console.error('Error fetching NFT:', err);
        if (err.code === 'ECONNABORTED') {
          setError(
            'Request timed out while loading NFT details. Please try again.',
          );
        } else if (err.response?.status === 404) {
          setNft(null);
          setError(null);
        } else {
          setError('Failed to load NFT details. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const fetchExecutionHistory = async () => {
      try {
        const response = await axios.get(
          `/api/computational/nfts/${nftId}/executions`,
          {
            timeout: 10000,
            signal: controller.signal,
          },
        );
        if (isMounted) {
          setExecutionHistory(response.data || []);
        }
      } catch (err) {
        if (!isMounted || err?.name === 'CanceledError') {
          return;
        }
        console.error('Error fetching execution history:', err);
      }
    };

    fetchNFT();
    fetchExecutionHistory();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [nftId, retryNonce]);

  const handleTabChange = tab => {
    setActiveTab(tab);
  };

  const handleBackToList = () => {
    navigate('/nfts/computational');
  };

  const handleRetry = () => {
    setRetryNonce(previous => previous + 1);
  };

  if (loading) {
    return (
      <div className="computational-nft-page loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading NFT...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="computational-nft-page error">
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
          <WrfButton variant="outline" onClick={handleRetry}>
            Retry
          </WrfButton>
          <WrfButton variant="primary" onClick={handleBackToList}>
            Back to NFT List
          </WrfButton>
        </div>
      </div>
    );
  }

  if (!nft) {
    return (
      <div className="computational-nft-page error">
        <div className="error-message">
          <h3>NFT Not Found</h3>
          <p>The computational NFT you are looking for could not be found.</p>
          <WrfButton variant="primary" onClick={handleBackToList}>
            Back to NFT List
          </WrfButton>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="computational-nft-page">
        <div className="page-header">
          <h2>{nft.name}</h2>
          <WrfButton
            variant="outline"
            onClick={handleBackToList}
          >
          Back to NFT List
          </WrfButton>
        </div>

        {/* NFT Quick Info */}
        <div className="nft-quick-info">
          <div className="info-item">
            <span className="label">ID:</span>
            <span className="value">{nft.id}</span>
          </div>
          <div className="info-item">
            <span className="label">Type:</span>
            <span className="value">{nft.computationType}</span>
          </div>
          <div className="info-item">
            <span className="label">Environment:</span>
            <span className="value">{nft.executionEnvironment}</span>
          </div>
          <div className="info-item">
            <span className="label">Status:</span>
            <span className={`value status-${nft.status}`}>{nft.status}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="nft-tabs">
          <div className="tab-headers">
            <button
              className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => handleTabChange('details')}
            >
            Details
            </button>
            <button
              className={`tab-btn ${activeTab === 'execute' ? 'active' : ''}`}
              onClick={() => handleTabChange('execute')}
              disabled={nft.status !== 'ready'}
            >
            Execute
            </button>
            <button
              className={`tab-btn ${activeTab === 'monitor' ? 'active' : ''}`}
              onClick={() => handleTabChange('monitor')}
            >
            Monitor
            </button>
            <button
              className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => handleTabChange('history')}
            >
            History
            </button>
            <button
              className={`tab-btn ${activeTab === 'workflows' ? 'active' : ''}`}
              onClick={() => handleTabChange('workflows')}
            >
            Workflows
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'details' && (
              <div className="tab-pane">
                <h4>NFT Details</h4>
                <div className="nft-details">
                  <div className="details-section">
                    <h5>Basic Information</h5>
                    <div className="detail-item">
                      <span className="label">Name:</span>
                      <span className="value">{nft.name}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Description:</span>
                      <span className="value">{nft.description}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Creator:</span>
                      <span className="value">{nft.creator}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Owner:</span>
                      <span className="value">{nft.owner}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Created:</span>
                      <span className="value">
                        {new Date(nft.created).toLocaleString()}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Last Updated:</span>
                      <span className="value">
                        {new Date(nft.updated).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="details-section">
                    <h5>Computational Information</h5>
                    <div className="detail-item">
                      <span className="label">Computation Type:</span>
                      <span className="value">{nft.computationType}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Execution Environment:</span>
                      <span className="value">{nft.executionEnvironment}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Resource Tier:</span>
                      <span className="value">{nft.resourceTier}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Execution Count:</span>
                      <span className="value">{nft.executionCount}</span>
                    </div>
                    {nft.lastExecuted && (
                      <div className="detail-item">
                        <span className="label">Last Executed:</span>
                        <span className="value">
                          {new Date(nft.lastExecuted).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {nft.metadata && Object.keys(nft.metadata).length > 0 && (
                    <div className="details-section">
                      <h5>Additional Metadata</h5>
                      <pre className="metadata-json">
                        {JSON.stringify(nft.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'execute' && (
              <div className="tab-pane">
                <h4>Execute NFT</h4>
                <ExecutionForm nftId={nft.id} nftDetails={nft} />
              </div>
            )}

            {activeTab === 'monitor' && (
              <div className="tab-pane">
                <h4>Execution Monitor</h4>
                <ExecutionMonitor nftId={nft.id} />
              </div>
            )}

            {activeTab === 'history' && (
              <div className="tab-pane">
                <h4>Execution History</h4>
                {executionHistory.length === 0 ? (
                  <div className="empty-history">
                    <p>No execution history available for this NFT.</p>
                  </div>
                ) : (
                  <div className="history-list">
                    {executionHistory.map((execution, index) => (
                      <div
                        key={index}
                        className={`history-item ${execution.status}`}
                      >
                        <div className="history-header">
                          <span className="timestamp">
                            {new Date(execution.timestamp).toLocaleString()}
                          </span>
                          <span className={`status status-${execution.status}`}>
                            {execution.status}
                          </span>
                        </div>
                        <div className="history-details">
                          {execution.status === 'completed' ? (
                            <>
                              <div className="execution-time">
                              Execution Time: {execution.executionTime} ms
                              </div>
                              <div className="result-preview">
                                <strong>Result:</strong>
                                <pre>
                                  {JSON.stringify(execution.result, null, 2)}
                                </pre>
                              </div>
                            </>
                          ) : (
                            <div className="error-message">
                              <strong>Error:</strong> {execution.error}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'workflows' && (
              <div className="tab-pane">
                <h4>n8n Workflow Integration</h4>
                <WorkflowIntegration nftId={nft.id} nftDetails={nft} />
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

function ComputationalNFTPage(props) {
  const navigate = useNavigate();
  return <DemoSurfaceGate testId="computational-execution" title="Computational NFT execution is unavailable"
    description="Execution services are not available on this testnet."
    action={<WrfButton variant="primary" onClick={() => navigate('/nfts')}>Back to NFT List</WrfButton>}>
    <ComputationalNFTPageSample {...props} />
  </DemoSurfaceGate>;
}

export default ComputationalNFTPage;
