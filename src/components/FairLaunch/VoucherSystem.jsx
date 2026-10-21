import React, { useState, useEffect } from 'react';
import './VoucherSystem.css';

/**
 * VoucherSystem Component
 *
 * Manages community vouching for the Community Path registration.
 * Allows users to add vouchers (community members who back their registration).
 */
const VoucherSystem = ({
  onVouchersUpdated,
  requiredVouchers = 5,
  className = '',
}) => {
  const [vouchers, setVouchers] = useState([]);
  const [currentAddress, setCurrentAddress] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [errors, setErrors] = useState({});
  const [suggestions, setSuggestions] = useState([]);

  // Mock community member database (in production, fetch from backend)
  const mockCommunityMembers = [
    {
      address: '0x1234567890123456789012345678901234567890',
      name: 'Alice Weather',
      reputation: 95,
      stake: '2.5 ETH',
    },
    {
      address: '0x2345678901234567890123456789012345678901',
      name: 'Bob Storm',
      reputation: 88,
      stake: '1.8 ETH',
    },
    {
      address: '0x3456789012345678901234567890123456789012',
      name: 'Carol Rain',
      reputation: 92,
      stake: '3.1 ETH',
    },
    {
      address: '0x4567890123456789012345678901234567890123',
      name: 'Dave Climate',
      reputation: 87,
      stake: '1.2 ETH',
    },
    {
      address: '0x5678901234567890123456789012345678901234',
      name: 'Eve Forecast',
      reputation: 91,
      stake: '2.8 ETH',
    },
  ];

  useEffect(() => {
    onVouchersUpdated(vouchers);
  }, [vouchers, onVouchersUpdated]);

  // Validate Ethereum address format
  const isValidAddress = address => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  // Check if address is already added
  const isDuplicateAddress = address => {
    return vouchers.some(
      voucher => voucher.address.toLowerCase() === address.toLowerCase(),
    );
  };

  // Mock validation of community member (in production, check smart contract)
  const validateCommunityMember = async address => {
    setIsValidating(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if address is in mock database
      const member = mockCommunityMembers.find(
        m => m.address.toLowerCase() === address.toLowerCase(),
      );

      if (!member) {
        throw new Error('Address is not an active community member');
      }

      if (parseFloat(member.stake) < 0.5) {
        throw new Error('Community member does not have sufficient stake');
      }

      if (member.reputation < 80) {
        throw new Error('Community member reputation too low');
      }

      return member;
    } finally {
      setIsValidating(false);
    }
  };

  // Handle address input change with suggestions
  const handleAddressChange = value => {
    setCurrentAddress(value);

    if (value.length > 8) {
      // Show suggestions based on partial address match
      const filtered = mockCommunityMembers
        .filter(
          member =>
            member.address.toLowerCase().includes(value.toLowerCase()) ||
            member.name.toLowerCase().includes(value.toLowerCase()),
        )
        .slice(0, 3);

      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  // Add voucher
  const handleAddVoucher = async () => {
    setErrors({});

    if (!currentAddress) {
      setErrors({ address: 'Please enter an address' });
      return;
    }

    if (!isValidAddress(currentAddress)) {
      setErrors({ address: 'Invalid Ethereum address format' });
      return;
    }

    if (isDuplicateAddress(currentAddress)) {
      setErrors({ address: 'This address is already added as a voucher' });
      return;
    }

    if (vouchers.length >= requiredVouchers + 2) {
      setErrors({ limit: 'Maximum number of vouchers reached' });
      return;
    }

    try {
      const member = await validateCommunityMember(currentAddress);

      const newVoucher = {
        id: Date.now(),
        address: currentAddress,
        name: member.name,
        reputation: member.reputation,
        stake: member.stake,
        addedAt: new Date().toISOString(),
        validated: true,
      };

      setVouchers(prev => [...prev, newVoucher]);
      setCurrentAddress('');
      setSuggestions([]);
    } catch (error) {
      setErrors({ validation: error.message });
    }
  };

  // Remove voucher
  const handleRemoveVoucher = voucherId => {
    setVouchers(prev => prev.filter(v => v.id !== voucherId));
    setErrors({});
  };

  // Select suggestion
  const handleSelectSuggestion = member => {
    setCurrentAddress(member.address);
    setSuggestions([]);
  };

  // Calculate progress
  const progress = Math.min((vouchers.length / requiredVouchers) * 100, 100);
  const isComplete = vouchers.length >= requiredVouchers;

  return (
    <div className={`voucher-system ${className}`}>
      <div className="voucher-container">
        {/* Header */}
        <div className="voucher-header">
          <h3 className="voucher-title">Community Vouchers</h3>
          <p className="voucher-description">
            Add {requiredVouchers} active community members to vouch for your
            registration
          </p>

          {/* Progress Indicator */}
          <div className="voucher-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="progress-text">
              {vouchers.length} of {requiredVouchers} vouchers added
              {isComplete && (
                <span className="progress-complete"> ✓ Complete</span>
              )}
            </div>
          </div>
        </div>

        {/* Add Voucher Form */}
        <div className="add-voucher-form">
          <div className="input-section">
            <label htmlFor="voucher-address" className="input-label">
              Community Member Address
            </label>
            <div className="address-input-wrapper">
              <input
                id="voucher-address"
                type="text"
                placeholder="0x... or search by name"
                value={currentAddress}
                onChange={e => handleAddressChange(e.target.value)}
                className={`address-input ${errors.address ? 'error' : ''}`}
                disabled={isValidating}
              />
              <button
                className="add-button"
                onClick={handleAddVoucher}
                disabled={
                  !currentAddress ||
                  isValidating ||
                  vouchers.length >= requiredVouchers + 2
                }
              >
                {isValidating ? (
                  <div className="loading-spinner-small" />
                ) : (
                  'Add Voucher'
                )}
              </button>
            </div>

            {/* Suggestions Dropdown */}
            {suggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {suggestions.map(member => (
                  <button
                    key={member.address}
                    className="suggestion-item"
                    onClick={() => handleSelectSuggestion(member)}
                  >
                    <div className="suggestion-info">
                      <div className="suggestion-name">{member.name}</div>
                      <div className="suggestion-address">{member.address}</div>
                    </div>
                    <div className="suggestion-stats">
                      <span className="reputation">
                        Rep: {member.reputation}
                      </span>
                      <span className="stake">Stake: {member.stake}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Error Messages */}
            {Object.keys(errors).map(key => (
              <div key={key} className="error-message">
                {errors[key]}
              </div>
            ))}
          </div>
        </div>

        {/* Voucher List */}
        {vouchers.length > 0 && (
          <div className="voucher-list">
            <h4 className="list-title">Added Vouchers</h4>
            <div className="voucher-grid">
              {vouchers.map(voucher => (
                <div key={voucher.id} className="voucher-card">
                  <div className="voucher-info">
                    <div className="voucher-name">
                      {voucher.name}
                      {voucher.validated && (
                        <span className="verified-badge">✓</span>
                      )}
                    </div>
                    <div className="voucher-address">
                      {voucher.address.slice(0, 10)}...
                      {voucher.address.slice(-8)}
                    </div>
                    <div className="voucher-stats">
                      <div className="stat">
                        <span className="stat-label">Reputation</span>
                        <span className="stat-value">
                          {voucher.reputation}/100
                        </span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Stake</span>
                        <span className="stat-value">{voucher.stake}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    className="remove-button"
                    onClick={() => handleRemoveVoucher(voucher.id)}
                    aria-label={`Remove ${voucher.name} as voucher`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Requirements Info */}
        <div className="requirements-info">
          <h4 className="info-title">Voucher Requirements</h4>
          <ul className="requirements-list">
            <li>✓ Must be an active WRFCoin network participant</li>
            <li>✓ Must have minimum 0.5 ETH stake</li>
            <li>✓ Must have reputation score above 80</li>
            <li>✓ Cannot vouch for more than 10 people</li>
            <li>✓ Each voucher stakes 0.05 ETH on your behalf</li>
          </ul>
        </div>

        {/* Status Message */}
        {isComplete && (
          <div className="success-message">
            <div className="success-icon">🎉</div>
            <div className="success-text">
              <strong>Vouchers Complete!</strong>
              <br />
              You have enough community backing to proceed with registration.
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="help-section">
          <details className="help-details">
            <summary className="help-summary">
              Need help finding vouchers?
            </summary>
            <div className="help-content">
              <p>Here are some ways to connect with community members:</p>
              <ul>
                <li>Join the WRFCoin Discord server</li>
                <li>Participate in community forums</li>
                <li>Attend virtual meetups and events</li>
                <li>Contribute to open-source projects</li>
                <li>Connect with local weather enthusiasts</li>
              </ul>
              <div className="help-links">
                <a
                  href="https://discord.gg/wrfcoin"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Join Discord
                </a>
                <a href="/community" target="_blank" rel="noopener noreferrer">
                  Browse Community
                </a>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

export default VoucherSystem;
