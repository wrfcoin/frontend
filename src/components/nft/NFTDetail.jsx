import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import './NFTDetail.css';

/**
 * Component to display detailed information about a computational NFT
 */
const NFTDetail = () => {
  const { nftId } = useParams();
  const navigate = useNavigate();
  const [nft, setNft] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch NFT and related task data
  useEffect(() => {
    const fetchNFTData = async () => {
      setLoading(true);
      try {
        // Fetch NFT details
        const nftResponse = await fetch(`/api/computational/nft/${nftId}`);

        if (!nftResponse.ok) {
          if (nftResponse.status === 404) {
            throw new Error('NFT not found');
          }
          throw new Error('Failed to fetch NFT data');
        }

        const nftData = await nftResponse.json();
        setNft(nftData);

        // Fetch related tasks
        const tasksResponse = await fetch(
          `/api/computational/tasks?nftId=${nftId}`,
        );

        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          setTasks(tasksData);
        }
      } catch (error) {
        console.error('Error fetching NFT data:', error);
        setError(error.message || 'Failed to load NFT data');
      } finally {
        setLoading(false);
      }
    };

    fetchNFTData();
  }, [nftId]);

  // Render task status badge
  const renderTaskStatus = status => {
    const statusClasses = {
      PENDING: 'pending',
      ASSIGNED: 'assigned',
      PROCESSING: 'processing',
      COMPLETED: 'completed',
      FAILED: 'failed',
      CANCELLED: 'cancelled',
    };

    const statusClass = statusClasses[status] || 'unknown';

    return <span className={`status-badge ${statusClass}`}>{status}</span>;
  };

  // Render a placeholder if NFT data is not available
  if (loading) {
    return (
      <div className="nft-detail-container">
        <div className="nft-detail-loading">
          <div className="loading-spinner"></div>
          <p>Loading NFT data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="nft-detail-container">
        <div className="nft-detail-error">
          <h2>Error Loading NFT</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button className="button secondary" onClick={() => navigate(-1)}>
              Go Back
            </button>
            <Link to="/nft/browse" className="button primary">
              Browse NFTs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!nft) {
    return (
      <div className="nft-detail-container">
        <div className="nft-detail-error">
          <h2>NFT Not Found</h2>
          <p>The computational NFT you're looking for could not be found.</p>
          <div className="error-actions">
            <button className="button secondary" onClick={() => navigate(-1)}>
              Go Back
            </button>
            <Link to="/nft/browse" className="button primary">
              Browse NFTs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="nft-detail-container">
      <div className="nft-detail-header">
        <div className="nft-detail-title">
          <h2>{nft.name}</h2>
          <span className="nft-id">#{nft.nftId}</span>
        </div>

        <div className="nft-detail-actions">
          <button className="button secondary" onClick={() => navigate(-1)}>
            Back
          </button>
        </div>
      </div>

      <div className="nft-detail-content">
        <div className="nft-detail-main">
          <div className="nft-detail-visualization">
            {nft.contentUri ? (
              <img
                src={
                  nft.contentUri.startsWith('ipfs://')
                    ? `https://ipfs.io/ipfs/${nft.contentUri.replace('ipfs://', '')}`
                    : nft.contentUri
                }
                alt={nft.name}
                onError={e => {
                  e.target.onerror = null;
                  e.target.src = '/placeholder-nft.svg';
                }}
              />
            ) : (
              <div className="nft-placeholder">
                <svg
                  width="200"
                  height="200"
                  viewBox="0 0 200 200"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="200" height="200" fill="#E8F5E9" />
                  <path
                    d="M100 50L50 100L100 150L150 100L100 50Z"
                    fill="#4CAF50"
                  />
                  <path
                    d="M100 70L70 100L100 130L130 100L100 70Z"
                    fill="#81C784"
                  />
                  <path
                    d="M100 90L90 100L100 110L110 100L100 90Z"
                    fill="#E8F5E9"
                  />
                </svg>
                <span>Computational NFT Visualization</span>
              </div>
            )}
          </div>

          <div className="nft-detail-info">
            <div className="info-section">
              <h3>Description</h3>
              <p>{nft.description || 'No description provided.'}</p>
            </div>

            <div className="info-section">
              <h3>Computation Details</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Type</span>
                  <span className="info-value">
                    {nft.computationType.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="info-item">
                  <span className="info-label">Complexity</span>
                  <div className="complexity-meter">
                    <div
                      className="complexity-fill"
                      style={{
                        width: `${(nft.computationComplexity / 10) * 100}%`,
                      }}
                    ></div>
                    <span>{nft.computationComplexity}/10</span>
                  </div>
                </div>

                <div className="info-item">
                  <span className="info-label">Region</span>
                  <span className="info-value">{nft.region || 'Global'}</span>
                </div>

                <div className="info-item">
                  <span className="info-label">Verified</span>
                  <span
                    className={`verification-status ${nft.isVerified ? 'verified' : 'unverified'}`}
                  >
                    {nft.isVerified ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h3>Resource Requirements</h3>
              <div className="info-grid">
                {nft.resourceRequirements && (
                  <>
                    <div className="info-item">
                      <span className="info-label">CPU</span>
                      <span className="info-value">
                        {nft.resourceRequirements.cpu} cores
                      </span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">Memory</span>
                      <span className="info-value">
                        {nft.resourceRequirements.memory / 1024} GB
                      </span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">Disk</span>
                      <span className="info-value">
                        {nft.resourceRequirements.disk} GB
                      </span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">GPU</span>
                      <span className="info-value">
                        {nft.resourceRequirements.gpu
                          ? 'Required'
                          : 'Not Required'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {nft.metadata &&
              nft.metadata.latitude &&
              nft.metadata.longitude && (
              <div className="info-section">
                <h3>Location</h3>
                <div className="location-info">
                  <div className="coordinates">
                    <span>
                      {nft.metadata.latitude}, {nft.metadata.longitude}
                    </span>
                  </div>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${nft.metadata.latitude}&mlon=${nft.metadata.longitude}&zoom=10`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="map-link"
                  >
                      View on Map
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="nft-detail-sidebar">
          <div className="sidebar-section">
            <h3>Ownership</h3>
            <div className="ownership-info">
              <div className="owner-item">
                <span className="owner-label">Creator</span>
                <span className="owner-value">{nft.creator}</span>
              </div>

              <div className="owner-item">
                <span className="owner-label">Current Owner</span>
                <span className="owner-value">{nft.owner || nft.creator}</span>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Tasks</h3>
            {tasks.length > 0 ? (
              <div className="tasks-list">
                {tasks.map(task => (
                  <div key={task.taskId} className="task-item">
                    <div className="task-header">
                      <span className="task-title">{task.title}</span>
                      {renderTaskStatus(task.status)}
                    </div>
                    <p className="task-description">{task.description}</p>
                    <div className="task-footer">
                      <span className="task-date">
                        {new Date(task.createdAt).toLocaleDateString()}
                      </span>
                      <Link
                        to={`/computational/task/${task.taskId}`}
                        className="task-link"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-tasks">
                <p>No tasks associated with this NFT yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFTDetail;
