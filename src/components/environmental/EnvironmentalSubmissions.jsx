import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { WrfBadge } from '../DesignSystem';
import './EnvironmentalSubmissions.css';

/**
 * Component to display and filter environmental data submissions
 */
const EnvironmentalSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({
    dataType: 'ALL',
    verificationStatus: 'ALL',
    sortBy: 'timestamp',
    sortDirection: 'desc',
  });

  // Load submissions
  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      try {
        let url = '/api/pop/submissions/recent';

        if (filter.dataType !== 'ALL') {
          url += `?dataType=${filter.dataType}`;
        }

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Failed to fetch submissions');
        }

        const data = await response.json();
        setSubmissions(data);
      } catch (error) {
        console.error('Error fetching submissions:', error);
        setError(error.message || 'Failed to load submissions');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [filter.dataType]);

  // Apply client-side filtering and sorting
  const filteredSubmissions = React.useMemo(() => {
    let result = [...submissions];

    // Filter by verification status if needed
    if (filter.verificationStatus !== 'ALL') {
      result = result.filter(
        sub => sub.verificationStatus === filter.verificationStatus,
      );
    }

    // Sort by selected field
    result.sort((a, b) => {
      const aValue = a[filter.sortBy];
      const bValue = b[filter.sortBy];

      if (typeof aValue === 'string') {
        return filter.sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return filter.sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return result;
  }, [submissions, filter]);

  // Handle filter changes
  const handleFilterChange = e => {
    const { name, value } = e.target;
    setFilter(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Get data type display name
  const getDataTypeDisplay = type => {
    switch (type) {
    case 'WEATHER':
      return 'Weather';
    case 'AIR_QUALITY':
      return 'Air Quality';
    case 'WATER_QUALITY':
      return 'Water Quality';
    default:
      return type;
    }
  };

  // Get verification status display with badge
  const getVerificationStatusDisplay = status => {
    switch (status) {
    case 'PENDING':
      return <WrfBadge color="warning">Pending</WrfBadge>;
    case 'VERIFIED':
      return <WrfBadge color="success">Verified</WrfBadge>;
    case 'REJECTED':
      return <WrfBadge color="error">Rejected</WrfBadge>;
    default:
      return <WrfBadge color="default">{status}</WrfBadge>;
    }
  };

  // Format date for display
  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Truncate long strings
  const truncate = (str, length = 10) => {
    if (!str) return '';
    return str.length > length ? `${str.substring(0, length)}...` : str;
  };

  // Render measurement summary based on data type
  const renderMeasurementSummary = submission => {
    const { dataType, measurements } = submission;

    if (!measurements) return 'No measurements';

    switch (dataType) {
    case 'WEATHER':
      return (
        <div className="measurement-summary">
          {measurements.temperature && (
            <span>{measurements.temperature}°C</span>
          )}
          {measurements.humidity && (
            <span>{measurements.humidity}% humidity</span>
          )}
          {measurements.pressure && <span>{measurements.pressure} hPa</span>}
        </div>
      );
    case 'AIR_QUALITY':
      return (
        <div className="measurement-summary">
          {measurements.pm25 && <span>PM2.5: {measurements.pm25} μg/m³</span>}
          {measurements.pm10 && <span>PM10: {measurements.pm10} μg/m³</span>}
          {measurements.ozone && <span>O₃: {measurements.ozone} ppb</span>}
        </div>
      );
    case 'WATER_QUALITY':
      return (
        <div className="measurement-summary">
          {measurements.ph && <span>pH: {measurements.ph}</span>}
          {measurements.dissolvedOxygen && (
            <span>DO: {measurements.dissolvedOxygen} mg/L</span>
          )}
          {measurements.turbidity && (
            <span>Turbidity: {measurements.turbidity} NTU</span>
          )}
        </div>
      );
    default:
      return 'Custom measurements';
    }
  };

  return (
    <div className="environmental-submissions-container">
      <div className="page-header">
        <h2>Environmental Data Submissions</h2>
        <Link to="/pop/submit" className="button primary">
          Submit New Data
        </Link>
      </div>

      <div className="filters-container">
        <div className="filter-group">
          <label htmlFor="dataType">Data Type:</label>
          <select
            id="dataType"
            name="dataType"
            value={filter.dataType}
            onChange={handleFilterChange}
          >
            <option value="ALL">All Types</option>
            <option value="WEATHER">Weather</option>
            <option value="AIR_QUALITY">Air Quality</option>
            <option value="WATER_QUALITY">Water Quality</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="verificationStatus">Status:</label>
          <select
            id="verificationStatus"
            name="verificationStatus"
            value={filter.verificationStatus}
            onChange={handleFilterChange}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="sortBy">Sort By:</label>
          <select
            id="sortBy"
            name="sortBy"
            value={filter.sortBy}
            onChange={handleFilterChange}
          >
            <option value="timestamp">Date</option>
            <option value="dataType">Data Type</option>
            <option value="verificationStatus">Status</option>
            <option value="confidenceScore">Confidence</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="sortDirection">Order:</label>
          <select
            id="sortDirection"
            name="sortDirection"
            value={filter.sortDirection}
            onChange={handleFilterChange}
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-indicator">Loading submissions...</div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="empty-state">
          <p>No submissions found matching your criteria.</p>
          <Link to="/pop/submit" className="button secondary">
            Submit Your First Data
          </Link>
        </div>
      ) : (
        <div className="submissions-table-container">
          <table className="submissions-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Measurements</th>
                <th>Location</th>
                <th>Timestamp</th>
                <th>Status</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.map(submission => (
                <tr key={submission.submissionId}>
                  <td className="id-cell">
                    <Link to={`/pop/submission/${submission.submissionId}`}>
                      {truncate(submission.submissionId, 8)}
                    </Link>
                  </td>
                  <td>{getDataTypeDisplay(submission.dataType)}</td>
                  <td>{renderMeasurementSummary(submission)}</td>
                  <td>
                    {submission.location ? (
                      <>
                        <div>
                          {submission.location.region || 'Unknown Region'}
                        </div>
                        <small>
                          {submission.location.latitude.toFixed(4)},{' '}
                          {submission.location.longitude.toFixed(4)}
                        </small>
                      </>
                    ) : (
                      'No location data'
                    )}
                  </td>
                  <td>{formatDate(submission.timestamp)}</td>
                  <td>
                    {getVerificationStatusDisplay(
                      submission.verificationStatus,
                    )}
                  </td>
                  <td>
                    <div className="confidence-score">
                      <div
                        className="confidence-bar"
                        style={{
                          width: `${(submission.confidenceScore || 0) * 100}%`,
                        }}
                      />
                      <span>
                        {((submission.confidenceScore || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="submissions-footer">
        <p>
          Total: {filteredSubmissions.length} submissions
          {filter.dataType !== 'ALL' || filter.verificationStatus !== 'ALL'
            ? ' (filtered)'
            : ''}
        </p>
      </div>
    </div>
  );
};

export default EnvironmentalSubmissions;
