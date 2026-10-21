import React, { useState } from 'react';
import './Validator.css';

/**
 * Displays a list of validators with filtering and sorting options
 */
const ValidatorList = ({ validators, loading, error }) => {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('stake');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');

  if (loading) {
    return <div className="validator-loading">Loading validators...</div>;
  }

  if (error) {
    return <div className="validator-error">{error}</div>;
  }

  // Apply filters
  let filteredValidators = [...validators];

  if (filter !== 'all') {
    filteredValidators = filteredValidators.filter(
      validator => validator.status.toLowerCase() === filter,
    );
  }

  // Apply search
  if (searchTerm) {
    filteredValidators = filteredValidators.filter(
      validator =>
        validator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        validator.address.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }

  // Apply sorting
  filteredValidators.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
    case 'name':
      comparison = a.name.localeCompare(b.name);
      break;
    case 'stake':
      comparison = a.stake - b.stake;
      break;
    case 'uptime':
      comparison = a.uptime - b.uptime;
      break;
    case 'rewards':
      comparison = a.totalRewards - b.totalRewards;
      break;
    case 'reputation':
      comparison = a.reputation - b.reputation;
      break;
    default:
      comparison = 0;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return (
    <div className="validator-list-container">
      <h3>Validator Network Participants</h3>

      <div className="validator-list-controls">
        <div className="validator-search">
          <input
            type="text"
            placeholder="Search by name or address"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="validator-filters">
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All Validators</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
            <option value="jailed">Jailed</option>
          </select>

          <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="stake">Sort by Stake</option>
            <option value="uptime">Sort by Uptime</option>
            <option value="rewards">Sort by Rewards</option>
            <option value="reputation">Sort by Reputation</option>
            <option value="name">Sort by Name</option>
          </select>

          <button
            className="sort-order-btn"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {filteredValidators.length === 0 ? (
        <div className="no-validators">No validators match your criteria</div>
      ) : (
        <div className="validators-table">
          <div className="validators-table-header">
            <div className="col-name">Name</div>
            <div className="col-address">Address</div>
            <div className="col-stake">Stake</div>
            <div className="col-uptime">Uptime</div>
            <div className="col-rewards">Rewards</div>
            <div className="col-status">Status</div>
          </div>

          <div className="validators-table-body">
            {filteredValidators.map(validator => (
              <div
                key={validator.id}
                className={`validator-row ${validator.status.toLowerCase()}`}
              >
                <div className="col-name">{validator.name}</div>
                <div className="col-address">
                  {truncateAddress(validator.address)}
                </div>
                <div className="col-stake">
                  {validator.stake.toLocaleString()} WRF
                </div>
                <div className="col-uptime">{validator.uptime}%</div>
                <div className="col-rewards">
                  {validator.totalRewards.toLocaleString()} WRF
                </div>
                <div className="col-status">
                  <span
                    className={`status-badge ${validator.status.toLowerCase()}`}
                  >
                    {validator.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to truncate validator addresses
function truncateAddress(address) {
  if (!address) return '';
  return address.length > 16
    ? `${address.substring(0, 8)}...${address.substring(address.length - 4)}`
    : address;
}

export default ValidatorList;
