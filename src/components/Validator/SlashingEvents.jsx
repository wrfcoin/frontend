import React from 'react';
import './Validator.css';

/**
 * Displays slashing events that occurred on the network
 */
const SlashingEvents = ({ slashingEvents, loading, error }) => {
  if (loading) {
    return <div className="validator-loading">Loading slashing events...</div>;
  }

  if (error) {
    return <div className="validator-error">{error}</div>;
  }

  // Format date for display
  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="slashing-events-container">
      <h3>Validator Slashing Events</h3>

      {slashingEvents.length === 0 ? (
        <div className="no-slashing-events">
          No slashing events have occurred
        </div>
      ) : (
        <div className="slashing-events-table">
          <div className="slashing-events-header">
            <div className="col-validator">Validator</div>
            <div className="col-reason">Reason</div>
            <div className="col-amount">Amount Slashed</div>
            <div className="col-percentage">% Slashed</div>
            <div className="col-time">Time</div>
          </div>

          <div className="slashing-events-body">
            {slashingEvents.map(event => (
              <div key={event.id} className="slashing-event-row">
                <div className="col-validator">
                  <div className="validator-name">{event.validatorName}</div>
                  <div className="validator-address">
                    {truncateAddress(event.validatorAddress)}
                  </div>
                </div>
                <div className="col-reason">
                  <span
                    className={`reason-badge ${event.reason.toLowerCase()}`}
                  >
                    {formatSlashReason(event.reason)}
                  </span>
                  <div className="reason-details">{event.description}</div>
                </div>
                <div className="col-amount">
                  {event.amountSlashed.toLocaleString()} WRF
                </div>
                <div className="col-percentage">{event.percentageSlashed}%</div>
                <div className="col-time">{formatDate(event.timestamp)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="slashing-explanation">
        <h4>About Slashing</h4>
        <p>
          Slashing is a penalty mechanism in the Wrfcoin network that reduces
          the staked amount of validators who violate protocol rules. Common
          reasons for slashing include:
        </p>
        <ul>
          <li>
            <strong>Downtime:</strong> When a validator is offline for an
            extended period
          </li>
          <li>
            <strong>Double Signing:</strong> When a validator signs conflicting
            blocks
          </li>
          <li>
            <strong>Malicious Behavior:</strong> When a validator attempts to
            manipulate the network
          </li>
          <li>
            <strong>Data Integrity Violation:</strong> When a validator submits
            incorrect weather or computational data
          </li>
        </ul>
      </div>
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

// Format slash reason for display
function formatSlashReason(reason) {
  switch (reason) {
  case 'DOWNTIME':
    return 'Downtime';
  case 'DOUBLE_SIGN':
    return 'Double Signing';
  case 'MALICIOUS':
    return 'Malicious Behavior';
  case 'DATA_VIOLATION':
    return 'Data Violation';
  default:
    return reason;
  }
}

export default SlashingEvents;
