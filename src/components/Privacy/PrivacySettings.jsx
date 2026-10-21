import React, { useState, useEffect } from 'react';
import './PrivacySettings.css';
import blockchainService from '../../services/blockchainService.ts';

const PrivacySettings = () => {
  const [privacyStatus, setPrivacyStatus] = useState({
    zeroKnowledgeProofs: false,
    bulletproofs: false,
    ringSignatures: false,
    confidentialTransactions: false,
    stealthAddresses: false,
  });

  const [privacyLevel, setPrivacyLevel] = useState('Standard');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFeature, setSelectedFeature] = useState(null);

  // Fetch privacy status from blockchain
  useEffect(() => {
    const fetchPrivacyStatus = async () => {
      setIsLoading(true);
      try {
        const status = await blockchainService.getPrivacyStatus();
        setPrivacyStatus(status);

        // Determine privacy level based on enabled features
        const enabledCount = Object.values(status).filter(Boolean).length;
        if (enabledCount === 0) {
          setPrivacyLevel('Standard');
        } else if (enabledCount === 1) {
          setPrivacyLevel('Basic');
        } else if (enabledCount === 2) {
          setPrivacyLevel('Medium');
        } else if (enabledCount === 3 || enabledCount === 4) {
          setPrivacyLevel('High');
        } else {
          setPrivacyLevel('Maximum');
        }
      } catch (error) {
        console.error('Error fetching privacy status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrivacyStatus();
  }, []);

  // Handle selecting a feature to learn more about
  const handleFeatureSelect = feature => {
    setSelectedFeature(feature);
  };

  // Toggle a privacy feature (in a real implementation, this would interact with the blockchain)
  const toggleFeature = feature => {
    setPrivacyStatus(prev => ({
      ...prev,
      [feature]: !prev[feature],
    }));
  };

  // Get privacy level strength as a percentage for the progress bar
  const getPrivacyStrength = () => {
    switch (privacyLevel) {
    case 'Standard':
      return 10;
    case 'Basic':
      return 30;
    case 'Medium':
      return 50;
    case 'High':
      return 80;
    case 'Maximum':
      return 100;
    default:
      return 0;
    }
  };

  // Get privacy level color
  const getPrivacyLevelColor = () => {
    switch (privacyLevel) {
    case 'Standard':
      return 'var(--danger-color)';
    case 'Basic':
      return 'var(--warning-color)';
    case 'Medium':
      return 'var(--info-color)';
    case 'High':
      return 'var(--success-color-light)';
    case 'Maximum':
      return 'var(--success-color)';
    default:
      return 'var(--text-color-secondary)';
    }
  };

  // Feature descriptions
  const featureDescriptions = {
    zeroKnowledgeProofs: {
      title: 'Zero-Knowledge Proofs',
      description:
        'Zero-knowledge proofs allow one party to prove to another that a statement is true, without revealing any specific information beyond the validity of the statement itself.',
      impact:
        'Enables private verification of computational results, transaction validity, and identity without exposing sensitive data.',
      tradeoffs:
        'Higher computational overhead and larger proof sizes compared to standard verification methods.',
    },
    bulletproofs: {
      title: 'Bulletproofs',
      description:
        'Bulletproofs are a type of non-interactive zero-knowledge proof protocol that enable efficient verification of a statement without revealing any underlying data.',
      impact:
        'Allows for very efficient range proofs to ensure transaction amounts are positive without revealing the actual amounts.',
      tradeoffs:
        'Verification is computationally intensive though proof sizes are much smaller than traditional zk-proofs.',
    },
    ringSignatures: {
      title: 'Ring Signatures',
      description:
        'Ring signatures allow a user to sign a message on behalf of a "ring" of users, hiding which specific member\'s key was used to create the signature.',
      impact:
        'Provides sender anonymity by making it impossible to determine which member of a group initiated a transaction.',
      tradeoffs:
        'Larger transaction sizes as ring size increases, and requires careful key image tracking to prevent double-spending.',
    },
    confidentialTransactions: {
      title: 'Confidential Transactions',
      description:
        'Confidential Transactions conceal the amount being transferred in a transaction while still allowing validation that inputs and outputs balance.',
      impact:
        'Prevents blockchain analysis from tracking wealth and transaction patterns based on amounts.',
      tradeoffs:
        'Increases transaction size and computational verification cost.',
    },
    stealthAddresses: {
      title: 'Stealth Addresses',
      description:
        'Stealth addresses create one-time addresses for each transaction, ensuring that multiple payments to the same recipient cannot be linked on the blockchain.',
      impact: 'Prevents address reuse tracking and improves recipient privacy.',
      tradeoffs:
        'Requires more complex wallet management and scanning of the blockchain.',
    },
  };

  if (isLoading) {
    return (
      <div className="privacy-settings" style={{ paddingTop: '20px' }}>
        <div className="loading">Loading privacy settings...</div>
      </div>
    );
  }

  return (
    <div className="privacy-settings" style={{ paddingTop: '20px' }}>
      <div className="privacy-level-indicator">
        <div className="privacy-level-label">
          <span>Privacy Level:</span>
          <span
            className="privacy-level"
            style={{ color: getPrivacyLevelColor() }}
          >
            {privacyLevel}
          </span>
        </div>
        <div className="privacy-level-bar">
          <div
            className="privacy-level-progress"
            style={{
              width: `${getPrivacyStrength()}%`,
              backgroundColor: getPrivacyLevelColor(),
            }}
          ></div>
        </div>
      </div>

      <div className="privacy-features">
        <h3>Privacy Features</h3>
        <ul className="feature-list">
          {Object.entries(privacyStatus).map(([feature, enabled]) => (
            <li
              key={feature}
              className={`feature-item ${enabled ? 'enabled' : 'disabled'}`}
            >
              <div className="feature-header">
                <div className="feature-title">
                  <span className="feature-indicator"></span>
                  <span>{featureDescriptions[feature]?.title || feature}</span>
                </div>
                <div className="feature-controls">
                  <button
                    className="feature-info-btn"
                    onClick={() => handleFeatureSelect(feature)}
                  >
                    <i className="bi bi-info-circle"></i>
                  </button>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => toggleFeature(feature)}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {selectedFeature && (
        <div className="feature-details">
          <h3>
            {featureDescriptions[selectedFeature]?.title || selectedFeature}
          </h3>
          <p className="feature-description">
            {featureDescriptions[selectedFeature]?.description}
          </p>

          <div className="feature-detail-grid">
            <div className="feature-detail-card">
              <h4>Impact on Privacy</h4>
              <p>{featureDescriptions[selectedFeature]?.impact}</p>
            </div>
            <div className="feature-detail-card">
              <h4>Performance Tradeoffs</h4>
              <p>{featureDescriptions[selectedFeature]?.tradeoffs}</p>
            </div>
          </div>

          <button
            className="close-details-btn"
            onClick={() => setSelectedFeature(null)}
          >
            Close
          </button>
        </div>
      )}

      <div className="privacy-explanation">
        <h3>Understanding Privacy Levels</h3>
        <ul className="privacy-levels-list">
          <li>
            <span
              className="level-name"
              style={{ color: 'var(--danger-color)' }}
            >
              Standard
            </span>
            <span className="level-description">
              No privacy enhancements. All transaction data is fully visible on
              the blockchain.
            </span>
          </li>
          <li>
            <span
              className="level-name"
              style={{ color: 'var(--warning-color)' }}
            >
              Basic
            </span>
            <span className="level-description">
              Entry-level privacy with one feature enabled. Offers minimal
              protection against casual observation.
            </span>
          </li>
          <li>
            <span className="level-name" style={{ color: 'var(--info-color)' }}>
              Medium
            </span>
            <span className="level-description">
              Two privacy features working together. Provides reasonable
              protection for most users.
            </span>
          </li>
          <li>
            <span
              className="level-name"
              style={{ color: 'var(--success-color-light)' }}
            >
              High
            </span>
            <span className="level-description">
              Three or four privacy features active. Strong privacy guarantees
              with minimal information leakage.
            </span>
          </li>
          <li>
            <span
              className="level-name"
              style={{ color: 'var(--success-color)' }}
            >
              Maximum
            </span>
            <span className="level-description">
              All privacy features enabled. Highest level of anonymity and
              transaction privacy available.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default PrivacySettings;
