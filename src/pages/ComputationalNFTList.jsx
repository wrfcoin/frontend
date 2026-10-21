import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import axios from 'axios';
import './ComputationalNFTList.css';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Chip,
  Grid,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Science as ScienceIcon,
  Computer as ComputeIcon,
  Timeline as TimelineIcon,
  Park as EcoIcon,
  School as SchoolIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';

const ComputationalNFTList = () => {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({
    computationType: '',
    environment: '',
    status: '',
  });
  const [sortBy, setSortBy] = useState('created');
  const [sortDirection, setSortDirection] = useState('desc');

  // Load available computation types and environments
  const [computationTypes, setComputationTypes] = useState([]);
  const [environments, setEnvironments] = useState([]);

  // Modal state for NFT details
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchNFTs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/computational/nfts');
      const records = Array.isArray(response.data) ? response.data : response.data?.nfts;
      if (!Array.isArray(records) || records.some(record =>
        !record || typeof record !== 'object' || record.id == null || typeof record.name !== 'string',
      )) throw new Error('Invalid computational NFT list response.');
      setNfts(records);
    } catch (err) {
      console.error('Error fetching NFTs:', err);
      setNfts([]);
      setError('Computational NFTs are unavailable. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch NFTs and filter metadata from the API.
  useEffect(() => {
    const fetchComputationTypes = async () => {
      try {
        const response = await axios.get('/api/computational/types');
        // Handle different possible response formats
        if (Array.isArray(response.data)) {
          setComputationTypes(response.data);
        } else if (response.data && Array.isArray(response.data.types)) {
          setComputationTypes(response.data.types);
        } else {
          // Fallback to default types if API fails
          setComputationTypes([
            'Weather Forecast',
            'Climate Model',
            'Air Quality',
            'Traffic Analysis',
            'Financial Model',
            'Image Processing',
            'Data Mining',
          ]);
        }
      } catch (err) {
        console.error('Error fetching computation types:', err);
        // Fallback to default types if API fails
        setComputationTypes([
          'Weather Forecast',
          'Climate Model',
          'Air Quality',
          'Traffic Analysis',
          'Financial Model',
          'Image Processing',
          'Data Mining',
        ]);
      }
    };

    const fetchEnvironments = async () => {
      try {
        const response = await axios.get('/api/computational/environments');
        // Handle different possible response formats
        if (Array.isArray(response.data)) {
          setEnvironments(response.data);
        } else if (response.data && Array.isArray(response.data.environments)) {
          setEnvironments(response.data.environments);
        } else {
          // Fallback to default environments if API fails
          setEnvironments([
            'Docker Container',
            'WASM Sandbox',
            'Native Execution',
            'Serverless Function',
            'Isolated VM',
          ]);
        }
      } catch (err) {
        console.error('Error fetching environments:', err);
        // Fallback to default environments if API fails
        setEnvironments([
          'Docker Container',
          'WASM Sandbox',
          'Native Execution',
          'Serverless Function',
          'Isolated VM',
        ]);
      }
    };

    fetchNFTs();
    fetchComputationTypes();
    fetchEnvironments();
  }, [fetchNFTs]);

  // Filter NFTs based on current filter settings
  const filteredNFTs = nfts.filter(nft => {
    // Filter by computation type if set
    if (
      filter.computationType &&
      nft.computationType !== filter.computationType
    ) {
      return false;
    }

    // Filter by environment if set
    if (filter.environment && nft.executionEnvironment !== filter.environment) {
      return false;
    }

    // Filter by status if set
    if (filter.status && nft.status !== filter.status) {
      return false;
    }

    return true;
  });

  // Sort NFTs based on current sort settings
  const sortedNFTs = [...filteredNFTs].sort((a, b) => {
    let valueA, valueB;

    switch (sortBy) {
    case 'name':
      valueA = a.name.toLowerCase();
      valueB = b.name.toLowerCase();
      break;
    case 'created':
      valueA = new Date(a.created).getTime();
      valueB = new Date(b.created).getTime();
      break;
    case 'updated':
      valueA = new Date(a.updated).getTime();
      valueB = new Date(b.updated).getTime();
      break;
    case 'type':
      valueA = a.computationType;
      valueB = b.computationType;
      break;
    case 'environment':
      valueA = a.executionEnvironment;
      valueB = b.executionEnvironment;
      break;
    case 'executionCount':
      valueA = a.executionCount || 0;
      valueB = b.executionCount || 0;
      break;
    default:
      valueA = a.id;
      valueB = b.id;
    }

    // Apply sort direction
    if (sortDirection === 'asc') {
      return valueA > valueB ? 1 : -1;
    } else {
      return valueA < valueB ? 1 : -1;
    }
  });

  const handleFilterChange = e => {
    const { name, value } = e.target;
    setFilter(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNFTClick = nft => {
    setSelectedNFT(nft);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedNFT(null);
  };

  const handleSortChange = e => {
    setSortBy(e.target.value);
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const clearFilters = () => {
    setFilter({
      computationType: '',
      environment: '',
      status: '',
    });
  };

  if (loading) {
    return (
      <div className="computational-nft-list loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading computational NFTs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="computational-nft-list error">
        <div className="error-message">
          <h3>Computational NFTs unavailable</h3>
          <p>{error}</p>
          <Button
            variant="contained"
            onClick={fetchNFTs}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="computational-nft-list">
      <div className="page-header">
        <h2>Computational NFTs</h2>
        <Button component={Link} to="/nft" variant="contained">
          Create NFT
        </Button>
      </div>

      <div className="filters-container">
        <div className="filters">
          <div className="filter-group">
            <label htmlFor="computationType">Type:</label>
            <select
              id="computationType"
              name="computationType"
              value={filter.computationType}
              onChange={handleFilterChange}
            >
              <option value="">All Types</option>
              {computationTypes.map(type => (
                <option key={type.id || type} value={type.id || type}>
                  {type.name || type}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="environment">Environment:</label>
            <select
              id="environment"
              name="environment"
              value={filter.environment}
              onChange={handleFilterChange}
            >
              <option value="">All Environments</option>
              {environments.map(env => (
                <option key={env.id || env} value={env.id || env}>
                  {env.name || env}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="status">Status:</label>
            <select
              id="status"
              name="status"
              value={filter.status}
              onChange={handleFilterChange}
            >
              <option value="">All Statuses</option>
              <option value="ready">Ready</option>
              <option value="created">Created</option>
              <option value="executing">Executing</option>
              <option value="error">Error</option>
            </select>
          </div>

          <Button variant="outlined" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>

        <div className="sort-controls">
          <label htmlFor="sortBy">Sort by:</label>
          <select id="sortBy" value={sortBy} onChange={handleSortChange}>
            <option value="created">Creation Date</option>
            <option value="updated">Last Updated</option>
            <option value="name">Name</option>
            <option value="type">Type</option>
            <option value="environment">Environment</option>
            <option value="executionCount">Execution Count</option>
          </select>
          <Button
            variant="text"
            size="small"
            onClick={toggleSortDirection}
            title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortDirection === 'asc' ? '↑' : '↓'}
          </Button>
        </div>
      </div>

      {sortedNFTs.length === 0 ? (
        <div className="empty-list">
          <p>No computational NFTs found.</p>
          <Button component={Link} to="/nft" variant="contained">
            Create your first computational NFT
          </Button>
        </div>
      ) : (
        <div className="nft-grid">
          {sortedNFTs.map(nft => (
            <Link
              to={`/nfts/computational/${nft.id}`}
              key={nft.id}
              className="nft-card"
            >
              <div className={`nft-status status-${nft.status}`}>
                {nft.status}
              </div>
              <div className="nft-content">
                <h3 className="nft-title">{nft.name}</h3>
                <div className="nft-details">
                  <div className="nft-detail">
                    <span className="label">Type:</span>
                    <span className="value">{nft.computationType}</span>
                  </div>
                  <div className="nft-detail">
                    <span className="label">Environment:</span>
                    <span className="value">{nft.executionEnvironment}</span>
                  </div>
                  {nft.resourceTier && (
                    <div className="nft-detail">
                      <span className="label">Tier:</span>
                      <span className="value">{nft.resourceTier}</span>
                    </div>
                  )}
                  <div className="nft-detail">
                    <span className="label">Executions:</span>
                    <span className="value">{nft.executionCount || 0}</span>
                  </div>
                </div>
                {nft.description && (
                  <p className="nft-description">{nft.description}</p>
                )}
                <div className="nft-footer">
                  <span className="nft-creator">By: {nft.creator}</span>
                  <span className="nft-date">
                    {new Date(nft.created).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ComputationalNFTList;
