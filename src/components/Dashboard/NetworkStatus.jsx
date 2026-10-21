import React from 'react';
import { WrfCard } from '../DesignSystem';

const NetworkStatus = ({ status }) => {
  // Instead of using the Tauri API directly, we'll work with the props passed from the parent
  const {
    isNodeRunning,
    isSyncing,
    syncProgress,
    connections,
    networkType,
    version,
  } = status;

  return (
    <WrfCard title="Network Status">
      <div className="network-status">
        <div className="network-status-item">
          <span className="network-status-label">Node Status:</span>
          <span
            className={`network-status-value ${isNodeRunning ? 'running' : 'offline'}`}
          >
            {isNodeRunning ? 'Running' : 'Offline'}
          </span>
        </div>

        {isNodeRunning && (
          <>
            <div className="network-status-item">
              <span className="network-status-label">Sync Status:</span>
              <span
                className={`network-status-value ${isSyncing ? 'syncing' : 'running'}`}
              >
                {isSyncing ? 'Syncing...' : 'Synchronized'}
              </span>
            </div>

            {isSyncing && (
              <div className="progress sync-progress">
                <div
                  className="progress-bar bg-primary"
                  role="progressbar"
                  style={{ width: `${syncProgress}%` }}
                  aria-valuenow={syncProgress}
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  {syncProgress}%
                </div>
              </div>
            )}

            <div className="network-status-item">
              <span className="network-status-label">Connections:</span>
              <span className="network-status-value">{connections}</span>
            </div>

            <div className="network-status-item">
              <span className="network-status-label">Network:</span>
              <span className="network-status-value">{networkType}</span>
            </div>

            <div className="network-status-item">
              <span className="network-status-label">Version:</span>
              <span className="network-status-value">{version}</span>
            </div>
          </>
        )}
      </div>
    </WrfCard>
  );
};

export default NetworkStatus;
