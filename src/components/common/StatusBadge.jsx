import React from 'react';

import PropTypes from 'prop-types';

import './StatusBadge.css';

/**
 * Status Badge Component
 *
 * Displays a status badge with appropriate styling based on the provided status
 *
 * @param {string} status - Current status (active, warning, error, connecting, offline, etc.)
 * @param {string} size - Size of the badge (default: 'md')
 * @returns {React.Component}
 */
const StatusBadge = ({ status, size = 'md' }) => {
  const getStatusDetails = () => {
    switch (status) {
    case 'active':
      return {
        label: 'Active',
        icon: 'bi-check-circle-fill',
        className: 'status-active',
      };
    case 'warning':
      return {
        label: 'Warning',
        icon: 'bi-exclamation-triangle-fill',
        className: 'status-warning',
      };
    case 'error':
      return {
        label: 'Error',
        icon: 'bi-x-circle-fill',
        className: 'status-error',
      };
    case 'connecting':
      return {
        label: 'Connecting',
        icon: 'bi-hourglass-split',
        className: 'status-connecting',
      };
    case 'offline':
      return {
        label: 'Offline',
        icon: 'bi-wifi-off',
        className: 'status-offline',
      };
    case 'testnet':
      return {
        label: 'Testnet',
        icon: 'bi-lightning-fill',
        className: 'status-testnet',
      };
    default:
      return {
        label: status.charAt(0).toUpperCase() + status.slice(1),
        icon: 'bi-info-circle-fill',
        className: 'status-default',
      };
    }
  };

  const { label, icon, className } = getStatusDetails();
  const sizeClass = `status-badge-${size}`;

  return (
    <div className={`status-badge ${className} ${sizeClass}`}>
      <i className={`bi ${icon}`}></i>
      <span>{label}</span>
    </div>
  );
};

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
};

export default StatusBadge;
