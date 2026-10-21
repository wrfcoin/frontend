import React, { useState, useEffect } from 'react';
import { WrfCard, WrfBadge, WrfAlert, WrfButton } from '../DesignSystem';

/**
 * SuiWalrusCard Component
 *
 * Integration with MystenLabs/walrus - a decentralized blob store using Sui for
 * coordination and governance. This component provides a UI for interacting with
 * the Walrus storage network.
 */
const SuiWalrusCard = () => {
  const [status, setStatus] = useState('disconnected');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [walrusStats, setWalrusStats] = useState({
    totalStorageGB: 0,
    availableStorageGB: 0,
    nodeCount: 0,
    avgResponseTimeMs: 0,
    syncStatus: 'unknown',
  });
  const [storedBlobs, setStoredBlobs] = useState([]);

  // Mock function to simulate connection to Walrus network
  const connectToWalrus = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // This would be an actual API call in production
      // await api.walrus.connect();

      setTimeout(() => {
        setStatus('connected');
        setWalrusStats({
          totalStorageGB: 1282,
          availableStorageGB: 865,
          nodeCount: 47,
          avgResponseTimeMs: 187,
          syncStatus: 'synced',
        });
        setStoredBlobs([
          {
            id: 'walrus-blob-01f2a3b4',
            name: 'Weather Data - EU Region',
            size: '128MB',
            created: '2025-05-14T10:15:23Z',
          },
          {
            id: 'walrus-blob-05e6f7g8',
            name: 'Climate Model Outputs',
            size: '256MB',
            created: '2025-05-15T14:22:12Z',
          },
        ]);
        setIsLoading(false);
      }, 1500);
    } catch (err) {
      setError(`Failed to connect to Walrus network: ${err.message}`);
      setIsLoading(false);
    }
  };

  // Mock function to simulate disconnection from Walrus network
  const disconnectFromWalrus = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // This would be an actual API call in production
      // await api.walrus.disconnect();

      setTimeout(() => {
        setStatus('disconnected');
        setWalrusStats({
          totalStorageGB: 0,
          availableStorageGB: 0,
          nodeCount: 0,
          avgResponseTimeMs: 0,
          syncStatus: 'unknown',
        });
        setStoredBlobs([]);
        setIsLoading(false);
      }, 1000);
    } catch (err) {
      setError(`Failed to disconnect from Walrus network: ${err.message}`);
      setIsLoading(false);
    }
  };

  // Mock function to simulate storing a blob on Walrus
  const storeBlob = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // This would be an actual API call in production
      // await api.walrus.storeBlob({ data, name });

      setTimeout(() => {
        const newBlob = {
          id: `walrus-blob-${Math.random().toString(36).substring(2, 10)}`,
          name: `Air Quality Data - ${new Date().toISOString().slice(0, 10)}`,
          size: '64MB',
          created: new Date().toISOString(),
        };
        setStoredBlobs([...storedBlobs, newBlob]);
        setIsLoading(false);
      }, 2000);
    } catch (err) {
      setError(`Failed to store blob on Walrus: ${err.message}`);
      setIsLoading(false);
    }
  };

  return (
    <WrfCard
      className="integration-card"
      sx={{ mb: 2 }}
      headerTitle="Sui Walrus Integration"
      header={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <i className="bi bi-database-fill" style={{ marginRight: 8 }}></i>
            Sui Walrus Integration
          </div>
          <WrfBadge
            status={status === 'connected' ? 'active' : 'neutral'}
            label={status === 'connected' ? 'Connected' : 'Disconnected'}
          />
        </div>
      }
      footer={
        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          <i className="bi bi-info-circle" style={{ marginRight: 4 }}></i>
          Built on Rust with Sui blockchain integration for decentralized
          governance
        </span>
      }
    >
      {error && <WrfAlert severity="error" sx={{ mb: 2 }}>{error}</WrfAlert>}

      <p style={{ marginBottom: 16 }}>
        MystenLabs/walrus is a decentralized blob store using Sui for
        coordination and governance. This integration enables efficient
        storage of large climate and weather data sets.
      </p>

      {status === 'connected' ? (
        <>
          <h5>Walrus Network Stats</h5>
          <div className="walrus-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total Storage</div>
              <div>{walrusStats.totalStorageGB} GB</div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Available Storage</div>
              <div>{walrusStats.availableStorageGB} GB</div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Nodes</div>
              <div>{walrusStats.nodeCount}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Response Time</div>
              <div>{walrusStats.avgResponseTimeMs} ms</div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Status</div>
              <div>{walrusStats.syncStatus}</div>
            </div>
          </div>

          <h5>Stored Blobs</h5>
          {storedBlobs.length > 0 ? (
            <div className="blob-list" style={{ marginBottom: 16 }}>
              {storedBlobs.map(blob => (
                <div
                  key={blob.id}
                  className="blob-item"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-color, #e0e0e0)' }}
                >
                  <div>
                    <strong>{blob.name}</strong>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>ID: {blob.id}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div>{blob.size}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      {new Date(blob.created).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <WrfAlert severity="info" sx={{ mb: 2 }}>No blobs stored yet.</WrfAlert>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <WrfButton
              variant="primary"
              onClick={storeBlob}
              disabled={isLoading}
              loading={isLoading}
            >
              Store New Blob
            </WrfButton>
            <WrfButton
              variant="danger"
              onClick={disconnectFromWalrus}
              disabled={isLoading}
              loading={isLoading}
            >
              Disconnect
            </WrfButton>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ marginBottom: 16 }}>
            <i className="bi bi-database-fill" style={{ fontSize: '2rem' }}></i>
          </div>
          <p>
            Connect to the Sui Walrus network to store and retrieve weather
            and climate data.
          </p>
          <WrfButton
            variant="primary"
            onClick={connectToWalrus}
            disabled={isLoading}
            loading={isLoading}
          >
            Connect to Walrus
          </WrfButton>
        </div>
      )}
    </WrfCard>
  );
};

export default SuiWalrusCard;
