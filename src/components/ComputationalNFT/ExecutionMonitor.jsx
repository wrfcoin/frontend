import React, { useState, useEffect, useRef } from 'react';
import computationalWebSocket, {
  NFT_EXECUTION_EVENTS,
} from '../../utils/computationalWebsocket';
import MLEnhancedResultsModal from '../nft/MLEnhancedResultsModal';
import { WrfButton } from '../DesignSystem';
import './ExecutionMonitor.css';

const ExecutionMonitor = ({ nftId }) => {
  const [executionState, setExecutionState] = useState({
    status: 'idle',
    progress: 0,
    logs: [],
    metrics: null,
    startTime: null,
    endTime: null,
    error: null,
    result: null,
  });

  // State for ML-enhanced results modal
  const [showMLModal, setShowMLModal] = useState(false);

  const logsEndRef = useRef(null);

  useEffect(() => {
    // Scroll to bottom of logs
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [executionState.logs]);

  useEffect(() => {
    if (!computationalWebSocket.isConnected) {
      computationalWebSocket.connect();
    }

    // Check current status
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/computational/nfts/${nftId}/status`);

        if (response.ok) {
          const data = await response.json();

          if (data.status !== 'idle') {
            setExecutionState(prev => ({
              ...prev,
              status: data.status,
              progress: data.progress || 0,
              startTime: data.startTime,
              logs: data.logs || [],
              metrics: data.metrics || null,
            }));
          }
        }
      } catch (error) {
        console.error('Error checking NFT execution status:', error);
      }
    };

    checkStatus();

    // Set up event listeners
    const handleStart = data => {
      if (data.nftId === nftId) {
        setExecutionState(prev => ({
          ...prev,
          status: 'running',
          progress: 0,
          startTime: data.timestamp,
          endTime: null,
          error: null,
          result: null,
          logs: [
            ...prev.logs,
            {
              timestamp: data.timestamp,
              message: 'Execution started',
              type: 'info',
            },
          ],
        }));
      }
    };

    const handleProgress = data => {
      if (data.nftId === nftId) {
        setExecutionState(prev => ({
          ...prev,
          status: 'running',
          progress: data.progress,
          metrics: data.metrics || prev.metrics,
          logs: [
            ...prev.logs,
            ...data.logs.map(log => ({
              timestamp: log.timestamp,
              message: log.message,
              type: log.type || 'info',
            })),
          ],
        }));
      }
    };

    const handleComplete = data => {
      if (data.nftId === nftId) {
        setExecutionState(prev => ({
          ...prev,
          status: 'completed',
          progress: 100,
          endTime: data.timestamp,
          result: data.result,
          metrics: data.stats || prev.metrics,
          logs: [
            ...prev.logs,
            {
              timestamp: data.timestamp,
              message: 'Execution completed successfully',
              type: 'success',
            },
          ],
        }));
      }
    };

    const handleError = data => {
      if (data.nftId === nftId) {
        setExecutionState(prev => ({
          ...prev,
          status: 'error',
          endTime: data.timestamp,
          error: data.error,
          logs: [
            ...prev.logs,
            {
              timestamp: data.timestamp,
              message: `Error: ${data.error}`,
              type: 'error',
            },
          ],
        }));
      }
    };

    // Add event listeners
    computationalWebSocket.on(NFT_EXECUTION_EVENTS.START, handleStart);
    computationalWebSocket.on(NFT_EXECUTION_EVENTS.PROGRESS, handleProgress);
    computationalWebSocket.on(NFT_EXECUTION_EVENTS.COMPLETE, handleComplete);
    computationalWebSocket.on(NFT_EXECUTION_EVENTS.ERROR, handleError);

    return () => {
      // Remove event listeners
      computationalWebSocket.off(NFT_EXECUTION_EVENTS.START, handleStart);
      computationalWebSocket.off(NFT_EXECUTION_EVENTS.PROGRESS, handleProgress);
      computationalWebSocket.off(NFT_EXECUTION_EVENTS.COMPLETE, handleComplete);
      computationalWebSocket.off(NFT_EXECUTION_EVENTS.ERROR, handleError);
    };
  }, [nftId]);

  const formatTimestamp = timestamp => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const getExecutionTime = () => {
    if (!executionState.startTime) return '0s';

    const start = new Date(executionState.startTime).getTime();
    const end = executionState.endTime
      ? new Date(executionState.endTime).getTime()
      : Date.now();

    const durationSeconds = Math.floor((end - start) / 1000);

    if (durationSeconds < 60) {
      return `${durationSeconds}s`;
    } else if (durationSeconds < 3600) {
      const minutes = Math.floor(durationSeconds / 60);
      const seconds = durationSeconds % 60;
      return `${minutes}m ${seconds}s`;
    } else {
      const hours = Math.floor(durationSeconds / 3600);
      const minutes = Math.floor((durationSeconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  return (
    <div className="execution-monitor">
      <div className="execution-header">
        <div className="execution-status">
          <div className={`status-indicator ${executionState.status}`}></div>
          <div className="status-details">
            <div className="status-name">
              {executionState.status === 'idle' && 'Not Running'}
              {executionState.status === 'running' && 'Running'}
              {executionState.status === 'completed' && 'Completed'}
              {executionState.status === 'error' && 'Error'}
            </div>
            {executionState.startTime && (
              <div className="status-time">Time: {getExecutionTime()}</div>
            )}
          </div>
        </div>

        {executionState.status === 'running' && (
          <div className="progress-container">
            <div
              className="progress-bar"
              style={{ width: `${executionState.progress}%` }}
            ></div>
            <div className="progress-text">
              {Math.round(executionState.progress)}%
            </div>
          </div>
        )}
      </div>

      {executionState.status !== 'idle' && (
        <div className="monitor-tabs">
          <div className="tab-headers">
            <button className="tab-btn active">Logs</button>
            {executionState.metrics && (
              <button className="tab-btn">Metrics</button>
            )}
            {executionState.result && (
              <button className="tab-btn">Results</button>
            )}
          </div>

          <div className="tab-content">
            <div className="log-container">
              {executionState.logs.length === 0 ? (
                <div className="empty-logs">
                  <p>No logs available</p>
                </div>
              ) : (
                <>
                  <div className="log-entries">
                    {executionState.logs.map((log, index) => (
                      <div key={index} className={`log-entry ${log.type}`}>
                        <span className="log-time">
                          {formatTimestamp(log.timestamp)}
                        </span>
                        <span className="log-message">{log.message}</span>
                      </div>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {executionState.status === 'idle' && (
        <div className="idle-message">
          <p>No active executions for this NFT</p>
          <p>Start an execution from the "Execute" tab</p>
        </div>
      )}

      {executionState.status === 'error' && (
        <div className="error-details">
          <h4>Execution Failed</h4>
          <p className="error-message">{executionState.error}</p>
        </div>
      )}

      {executionState.status === 'completed' && executionState.result && (
        <div className="result-summary">
          <h4>Execution Completed</h4>

          {executionState.result.data?.mlEnhanced && (
            <div className="ml-enhanced-section">
              <div className="ml-enhanced-info">
                <span className="ml-badge">ML Enhanced</span>
                <p>
                  This computational result was enhanced using machine learning
                  for improved accuracy and deeper analysis.
                </p>
              </div>
              <WrfButton
                variant="primary"
                className="view-ml-btn"
                onClick={() => setShowMLModal(true)}
              >
                View ML-Enhanced Analysis
              </WrfButton>
            </div>
          )}

          <div className="result-preview">
            <pre>{JSON.stringify(executionState.result, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* ML-Enhanced Results Modal */}
      {executionState.result && (
        <MLEnhancedResultsModal
          show={showMLModal}
          onClose={() => setShowMLModal(false)}
          results={executionState.result}
          modelType={executionState.result.type || 'WEATHER_FORECAST'}
        />
      )}
    </div>
  );
};

export default ExecutionMonitor;
