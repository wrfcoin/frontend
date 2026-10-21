import React, { useState, useEffect } from 'react';
import { WrfCard, WrfButton, WrfBadge, WrfAlert } from '../DesignSystem';

/**
 * OceanProtocolCard Component
 *
 * Integration with Ocean Protocol - a decentralized data exchange protocol to unlock
 * data for AI. This component provides an interface for interacting with the Ocean
 * marketplace for weather and climate data.
 */
const OceanProtocolCard = () => {
  const [status, setStatus] = useState('disconnected');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [publishingStats, setPublishingStats] = useState({
    published: 0,
    consumed: 0,
    totalEarnings: 0,
    dataQualityScore: 0,
  });

  // Mock function to simulate connection to Ocean Protocol
  const connectToOcean = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // This would be an actual API call in production
      // await api.ocean.connect();

      setTimeout(() => {
        setStatus('connected');
        setDatasets([
          {
            id: 'ocean-dataset-1',
            name: 'Global Temperature Anomalies 1880-2025',
            price: '10 OCEAN',
            downloads: 127,
            rating: 4.8,
            size: '2.5 GB',
            lastUpdate: '2025-04-15',
          },
          {
            id: 'ocean-dataset-2',
            name: 'High-Resolution Precipitation Records',
            price: '5 OCEAN',
            downloads: 84,
            rating: 4.6,
            size: '1.8 GB',
            lastUpdate: '2025-05-01',
          },
          {
            id: 'ocean-dataset-3',
            name: 'Climate Model Comparisons',
            price: '15 OCEAN',
            downloads: 62,
            rating: 4.9,
            size: '3.7 GB',
            lastUpdate: '2025-03-22',
          },
        ]);
        setPublishingStats({
          published: 5,
          consumed: 273,
          totalEarnings: 1250,
          dataQualityScore: 92,
        });
        setIsLoading(false);
      }, 1500);
    } catch (err) {
      setError(`Failed to connect to Ocean Protocol: ${err.message}`);
      setIsLoading(false);
    }
  };

  // Mock function to simulate disconnection from Ocean Protocol
  const disconnectFromOcean = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // This would be an actual API call in production
      // await api.ocean.disconnect();

      setTimeout(() => {
        setStatus('disconnected');
        setDatasets([]);
        setPublishingStats({
          published: 0,
          consumed: 0,
          totalEarnings: 0,
          dataQualityScore: 0,
        });
        setIsLoading(false);
      }, 1000);
    } catch (err) {
      setError(`Failed to disconnect from Ocean Protocol: ${err.message}`);
      setIsLoading(false);
    }
  };

  // Mock function to simulate publishing a dataset
  const publishDataset = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // This would be an actual API call in production
      // await api.ocean.publishDataset();

      setTimeout(() => {
        const newDataset = {
          id: `ocean-dataset-${datasets.length + 1}`,
          name: `Weather Patterns ${new Date().toISOString().slice(0, 10)}`,
          price: '8 OCEAN',
          downloads: 0,
          rating: 0,
          size: '1.2 GB',
          lastUpdate: new Date().toISOString().slice(0, 10),
        };

        setDatasets([...datasets, newDataset]);
        setPublishingStats({
          ...publishingStats,
          published: publishingStats.published + 1,
        });

        setIsLoading(false);
      }, 2000);
    } catch (err) {
      setError(`Failed to publish dataset: ${err.message}`);
      setIsLoading(false);
    }
  };

  return (
    <WrfCard
      className="integration-card"
      headerTitle={
        <span>
          <i className="bi bi-water" style={{ marginRight: '8px' }}></i>
          Ocean Protocol Integration
        </span>
      }
      headerAction={
        <WrfBadge color={status === 'connected' ? 'success' : 'info'}>
          {status === 'connected' ? 'Connected' : 'Disconnected'}
        </WrfBadge>
      }
    >
      {error && <WrfAlert severity="error">{error}</WrfAlert>}

      <p className="mb-3">
          Ocean Protocol enables secure, privacy-preserving data sharing for
          weather and climate data. Monetize your high-quality datasets or
          discover valuable datasets for your models.
      </p>

      {status === 'connected' ? (
        <>
          <h5>Your Ocean Data Stats</h5>
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
            <div>
              <div className="small text-muted">Published</div>
              <div>{publishingStats.published} datasets</div>
            </div>
            <div>
              <div className="small text-muted">Consumed</div>
              <div>{publishingStats.consumed} times</div>
            </div>
            <div>
              <div className="small text-muted">Earnings</div>
              <div>{publishingStats.totalEarnings} OCEAN</div>
            </div>
            <div>
              <div className="small text-muted">Quality Score</div>
              <div>{publishingStats.dataQualityScore}/100</div>
            </div>
          </div>

          <h5>Your Datasets</h5>
          {datasets.length > 0 ? (
            <ul className="dataset-list" style={{ listStyle: 'none', padding: 0, marginBottom: '16px' }}>
              {datasets.map(dataset => (
                <li
                  key={dataset.id}
                  className="dataset-list-item"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid var(--wrf-border, #e0e0e0)' }}
                >
                  <div>
                    <div>
                      <strong>{dataset.name}</strong>
                    </div>
                    <div className="small text-muted">
                      {dataset.size} • Last updated: {dataset.lastUpdate}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <WrfBadge color="primary">{dataset.price}</WrfBadge>
                    <div className="small text-muted">
                      {dataset.downloads} downloads • Rating:{' '}
                      {dataset.rating || 'N/A'}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <WrfAlert severity="info">No datasets published yet.</WrfAlert>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <WrfButton
              variant="primary"
              onClick={publishDataset}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span
                    className="loading-spinner loading-spinner-sm"
                    role="status"
                    aria-hidden="true"
                    style={{ marginRight: '4px' }}
                  ></span>
                    Publishing...
                </>
              ) : (
                'Publish New Dataset'
              )}
            </WrfButton>
            <WrfButton
              variant="danger"
              onClick={disconnectFromOcean}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span
                    className="loading-spinner loading-spinner-sm"
                    role="status"
                    aria-hidden="true"
                    style={{ marginRight: '4px' }}
                  ></span>
                    Disconnecting...
                </>
              ) : (
                'Disconnect'
              )}
            </WrfButton>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <i className="bi bi-water" style={{ fontSize: '2rem' }}></i>
          </div>
          <p>
              Connect to Ocean Protocol to publish and monetize your weather and
              climate data or access valuable datasets.
          </p>
          <WrfButton
            variant="success"
            onClick={connectToOcean}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span
                  className="loading-spinner loading-spinner-sm"
                  role="status"
                  aria-hidden="true"
                  style={{ marginRight: '4px' }}
                ></span>
                  Connecting...
              </>
            ) : (
              'Connect to Ocean Protocol'
            )}
          </WrfButton>
        </div>
      )}
      <div className="integration-card-footer" style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--wrf-text-secondary, #6c757d)' }}>
        <i className="bi bi-info-circle" style={{ marginRight: '4px' }}></i>
        Decentralized data marketplace for AI and compute-to-data capabilities
      </div>
    </WrfCard>
  );
};

export default OceanProtocolCard;
