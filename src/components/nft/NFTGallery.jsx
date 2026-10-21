import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import './NFTGallery.css';

/**
 * Gallery of computational NFTs
 */
const NFTGallery = () => {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    computationType: 'ALL',
    sortBy: 'createdAt',
    sortDirection: 'desc',
  });

  // Fetch NFTs
  useEffect(() => {
    const fetchNFTs = async () => {
      setLoading(true);
      try {
        // In a real application, we would add query parameters for filtering
        const response = await fetch('/api/computational/nfts');

        if (!response.ok) {
          throw new Error('Failed to fetch NFTs');
        }

        const data = await response.json();
        setNfts(data);
      } catch (error) {
        console.error('Error fetching NFTs:', error);
        setError(error.message || 'Failed to load NFTs');
      } finally {
        setLoading(false);
      }
    };

    fetchNFTs();
  }, []);

  // Handle filter changes
  const handleFilterChange = e => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Apply filters and sorting
  const filteredNFTs = React.useMemo(() => {
    let filtered = [...nfts];

    // Filter by computation type
    if (filters.computationType !== 'ALL') {
      filtered = filtered.filter(
        nft => nft.computationType === filters.computationType,
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[filters.sortBy];
      const bValue = b[filters.sortBy];

      if (typeof aValue === 'string') {
        return filters.sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Handle dates
      if (aValue instanceof Date && bValue instanceof Date) {
        return filters.sortDirection === 'asc'
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }

      // Handle other types
      return filters.sortDirection === 'asc'
        ? aValue - bValue
        : bValue - aValue;
    });

    return filtered;
  }, [nfts, filters]);

  // Render computation type badge
  const renderComputationTypeBadge = type => {
    const badgeClasses = {
      WEATHER_FORECAST: 'weather',
      CLIMATE_SIMULATION: 'climate',
      AIR_QUALITY: 'air-quality',
      GENERIC: 'generic',
    };

    const displayNames = {
      WEATHER_FORECAST: 'Weather',
      CLIMATE_SIMULATION: 'Climate',
      AIR_QUALITY: 'Air Quality',
      GENERIC: 'Generic',
    };

    const badgeClass = badgeClasses[type] || 'generic';
    const displayName = displayNames[type] || type;

    return (
      <span className={`computation-badge ${badgeClass}`}>{displayName}</span>
    );
  };

  // Render placeholder content if data is not available
  if (loading) {
    return (
      <div className="nft-gallery-container full-width-container">
        <div className="gallery-header">
          <h2>Computational NFT Gallery</h2>
          <Link to="/nft/create" className="button primary">
            Create New NFT
          </Link>
        </div>
        <div className="gallery-loading">
          <div className="loading-spinner"></div>
          <p>Loading computational NFTs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="nft-gallery-container full-width-container">
        <div className="gallery-header">
          <h2>Computational NFT Gallery</h2>
          <Link to="/nft/create" className="button primary">
            Create New NFT
          </Link>
        </div>
        <div className="gallery-error">
          <h3>Error Loading NFTs</h3>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="button secondary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="nft-gallery-container full-width-container">
      <div className="gallery-header">
        <h2>Computational NFT Gallery</h2>
        <Link to="/nft/create" className="button primary">
          Create New NFT
        </Link>
      </div>

      <div className="gallery-filters">
        <div className="filter-group">
          <label htmlFor="computationType">Computation Type</label>
          <select
            id="computationType"
            name="computationType"
            value={filters.computationType}
            onChange={handleFilterChange}
          >
            <option value="ALL">All Types</option>
            <option value="WEATHER_FORECAST">Weather Forecast</option>
            <option value="CLIMATE_SIMULATION">Climate Simulation</option>
            <option value="AIR_QUALITY">Air Quality</option>
            <option value="GENERIC">Generic</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="sortBy">Sort By</label>
          <select
            id="sortBy"
            name="sortBy"
            value={filters.sortBy}
            onChange={handleFilterChange}
          >
            <option value="createdAt">Date Created</option>
            <option value="name">Name</option>
            <option value="computationComplexity">Complexity</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="sortDirection">Order</label>
          <select
            id="sortDirection"
            name="sortDirection"
            value={filters.sortDirection}
            onChange={handleFilterChange}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      {filteredNFTs.length === 0 ? (
        <div className="empty-gallery">
          <p>
            No computational NFTs found
            {filters.computationType !== 'ALL'
              ? ` with type ${filters.computationType.replace(/_/g, ' ')}`
              : ''}
            .
          </p>
          <Link to="/nft/create" className="button secondary">
            Create Your First NFT
          </Link>
        </div>
      ) : (
        <div className="nft-grid">
          {filteredNFTs.map(nft => (
            <Link to={`/nft/${nft.nftId}`} key={nft.nftId} className="nft-card">
              <div className="nft-card-image">
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
                      width="80"
                      height="80"
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
                  </div>
                )}
                {renderComputationTypeBadge(nft.computationType)}
              </div>

              <div className="nft-card-content">
                <h3 className="nft-title">{nft.name}</h3>
                <p className="nft-description">
                  {nft.description.length > 60
                    ? `${nft.description.substring(0, 60)}...`
                    : nft.description}
                </p>

                <div className="nft-details">
                  <div className="nft-detail-item">
                    <span className="detail-label">Complexity</span>
                    <div className="complexity-indicator">
                      <div
                        className="complexity-bar"
                        style={{
                          width: `${(nft.computationComplexity / 10) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="nft-detail-item">
                    <span className="detail-label">Creator</span>
                    <span className="detail-value">
                      {nft.creator.substring(0, 8)}...
                    </span>
                  </div>
                </div>
              </div>

              <div className="nft-card-footer">
                <span className="nft-id">#{nft.nftId.substring(0, 8)}</span>
                <span className="nft-date">
                  {new Date(nft.createdAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default NFTGallery;
