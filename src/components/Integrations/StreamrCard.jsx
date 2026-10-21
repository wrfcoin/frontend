import React, { useState, useEffect } from 'react';
import { WrfCard, WrfBadge, WrfButton, WrfInput, WrfAlert } from '../DesignSystem';

const StreamrCard = () => {
  const [status, setStatus] = useState(null);
  const [streams, setStreams] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [streamName, setStreamName] = useState('');
  const [streamDescription, setStreamDescription] = useState('');
  const [streamData, setStreamData] = useState(
    JSON.stringify(
      {
        temperature: 23.5,
        humidity: 65,
        pressure: 1013.2,
        wind_speed: 5.2,
        timestamp: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
  const [selectedStream, setSelectedStream] = useState(null);
  const [creatingStream, setCreatingStream] = useState(false);
  const [publishingData, setPublishingData] = useState(false);
  const [dataPublished, setDataPublished] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get status
        const statusResponse = await fetch('/api/streamr/status');
        if (!statusResponse.ok) {
          throw new Error(
            `Failed to fetch status: ${statusResponse.statusText}`,
          );
        }
        const statusData = await statusResponse.json();
        setStatus(statusData);

        // Get streams
        const streamsResponse = await fetch('/api/streamr/streams');
        if (!streamsResponse.ok) {
          throw new Error(
            `Failed to fetch streams: ${streamsResponse.statusText}`,
          );
        }
        const streamsData = await streamsResponse.json();
        setStreams(streamsData.streams || []);

        // Get products
        const productsResponse = await fetch('/api/streamr/products');
        if (!productsResponse.ok) {
          throw new Error(
            `Failed to fetch products: ${productsResponse.statusText}`,
          );
        }
        const productsData = await productsResponse.json();
        setProducts(productsData.products || []);

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreateStream = async () => {
    try {
      setCreatingStream(true);
      setError(null);

      const response = await fetch('/api/streamr/streams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: streamName,
          description: streamDescription,
          dataType: 'WEATHER_DATA',
          metadata: {
            region: 'Global',
            sensorTypes: [
              'temperature',
              'humidity',
              'pressure',
              'wind_speed',
              'precipitation',
            ],
            updateInterval: 300, // seconds
            accuracy: 'high',
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create stream: ${response.statusText}`);
      }

      const data = await response.json();

      // Add the new stream to the list
      setStreams(prevStreams => [...prevStreams, data.stream]);

      // Clear form fields
      setStreamName('');
      setStreamDescription('');
      setCreatingStream(false);
    } catch (err) {
      setError(err.message);
      setCreatingStream(false);
    }
  };

  const handlePublishData = async () => {
    if (!selectedStream) return;

    try {
      setPublishingData(true);
      setError(null);
      setDataPublished(false);

      let parsedData;
      try {
        parsedData = JSON.parse(streamData);
      } catch (err) {
        throw new Error('Invalid JSON data format');
      }

      const response = await fetch(
        `/api/streamr/streams/${selectedStream.id}/publish`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(parsedData),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to publish data: ${response.statusText}`);
      }

      const data = await response.json();
      setDataPublished(true);
      setPublishingData(false);

      // Set timeout to hide the success message after 5 seconds
      setTimeout(() => {
        setDataPublished(false);
      }, 5000);
    } catch (err) {
      setError(err.message);
      setPublishingData(false);
    }
  };

  if (loading) {
    return (
      <WrfCard className="integration-card">
        <div className="card-content loading-content">
          <div className="loader"></div>
          <h3>Loading Streamr Integration...</h3>
        </div>
      </WrfCard>
    );
  }

  return (
    <WrfCard className="integration-card streamr-card" headerTitle={
      <>
        <i className="bi bi-broadcast-pin"></i> Streamr Data Streaming
      </>
    }>
      <p className="card-description">
        Streamr provides real-time data streaming for meteorological and
        computational data. Connect to data streams, publish sensor data, and
        create or subscribe to weather data products.
      </p>

      <div className="card-content">
        {error && (
          <WrfAlert severity="error">
            <i className="bi bi-exclamation-triangle"></i> {error}
          </WrfAlert>
        )}

        {dataPublished && (
          <WrfAlert severity="success">
            <i className="bi bi-check-circle"></i> Data published successfully!
          </WrfAlert>
        )}

        <div className="streamr-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <div className="section-header">
              <i className="bi bi-stack"></i> Data Streams
            </div>
            <div className="divider"></div>

            {streams.length === 0 ? (
              <p className="empty-state">
                No streams available. Create your first stream using the form
                below.
              </p>
            ) : (
              <div className="list-container">
                <ul className="data-list">
                  {streams.map(stream => (
                    <li
                      key={stream.id}
                      className={`list-item ${selectedStream && selectedStream.id === stream.id ? 'selected' : ''}`}
                      onClick={() => setSelectedStream(stream)}
                    >
                      <div className="list-item-content">
                        <div className="list-item-title">{stream.name}</div>
                        <div className="list-item-subtitle">
                          {stream.description || 'No description'}
                        </div>
                      </div>
                      <WrfBadge color="primary">
                        {stream.data_type || 'UNKNOWN'}
                      </WrfBadge>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="form-section">
              <h4>Create New Stream</h4>
              <div className="form-group">
                <label htmlFor="streamName">Stream Name</label>
                <WrfInput
                  type="text"
                  id="streamName"
                  value={streamName}
                  onChange={e => setStreamName(e.target.value)}
                  placeholder="Enter stream name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="streamDescription">Description</label>
                <WrfInput
                  type="text"
                  id="streamDescription"
                  value={streamDescription}
                  onChange={e => setStreamDescription(e.target.value)}
                  placeholder="Enter stream description"
                />
              </div>
              <WrfButton
                variant="primary"
                onClick={handleCreateStream}
                disabled={!streamName || creatingStream}
              >
                {creatingStream ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    <span> Creating...</span>
                  </>
                ) : (
                  'Create Stream'
                )}
              </WrfButton>
            </div>
          </div>

          <div>
            <div className="section">
              <div className="section-header">
                <i className="bi bi-cloud-upload"></i> Publish Data
              </div>
              <div className="divider"></div>

              <div className="form-group">
                <label htmlFor="streamData">Stream Data (JSON)</label>
                <textarea
                  id="streamData"
                  className="streamr-textarea"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--wrf-border, #ccc)', fontFamily: 'monospace', fontSize: '14px' }}
                  value={streamData}
                  onChange={e => setStreamData(e.target.value)}
                  rows="4"
                  placeholder="Enter JSON data"
                ></textarea>
              </div>

              <WrfButton
                variant="primary"
                onClick={handlePublishData}
                disabled={!selectedStream || publishingData}
              >
                {publishingData ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    <span> Publishing...</span>
                  </>
                ) : (
                  'Publish Data'
                )}
              </WrfButton>
            </div>

            <div className="section">
              <div className="section-header">
                <i className="bi bi-shop"></i> Data Marketplace
              </div>
              <div className="divider"></div>

              {products.length === 0 ? (
                <p className="empty-state">
                  No marketplace products available.
                </p>
              ) : (
                <div className="list-container">
                  <ul className="data-list">
                    {products.map(product => (
                      <li key={product.id} className="list-item">
                        <div className="list-item-content">
                          <div className="list-item-title">{product.name}</div>
                          <div className="list-item-subtitle">
                            {product.category} | {product.price_amount}{' '}
                            {product.price_token_address ? 'TOKENS' : 'FREE'}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="streamr-card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid var(--wrf-border, #e0e0e0)' }}>
        <div className="stats" style={{ display: 'flex', gap: '8px' }}>
          <WrfBadge color="info">
            <i className="bi bi-broadcast"></i> Subscriptions:{' '}
            {status?.subscriptions || 0}
          </WrfBadge>
          <WrfBadge color="info">
            <i className="bi bi-stack"></i> Streams: {status?.streams || 0}
          </WrfBadge>
        </div>

        <WrfButton variant="secondary" size="sm">Advanced Options</WrfButton>
      </div>
    </WrfCard>
  );
};

export default StreamrCard;
