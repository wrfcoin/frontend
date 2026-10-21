import DemoSurfaceGate from '../common/DemoSurfaceGate';
import React, { useState, useEffect } from 'react';
import './MPCPrivacyControls.css';

const MPCPrivacyControlsSample = ({ nftId, onPrivacyConfigured }) => {
  const [mpcStatus, setMpcStatus] = useState('disconnected');
  const [privacyLevel, setPrivacyLevel] = useState('standard');
  const [thresholdConfig, setThresholdConfig] = useState({
    required: 3,
    total: 5,
  });
  const [zkProofEnabled, setZkProofEnabled] = useState(false);
  const [registeredPartiesRaw, setRegisteredPartiesRaw] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(false);

  // Ensure registeredParties is always an array
  const registeredParties = Array.isArray(registeredPartiesRaw) ? registeredPartiesRaw : [];

  // Privacy level configurations
  const privacyLevels = {
    basic: {
      name: 'Basic Privacy',
      description:
        'Standard computational execution with basic data protection',
      threshold: { min: 2, max: 3 },
      zkRequired: false,
      features: ['Data encryption', 'Secure transmission'],
    },
    standard: {
      name: 'Standard Privacy',
      description: 'Enhanced privacy with threshold signing and verification',
      threshold: { min: 3, max: 5 },
      zkRequired: false,
      features: [
        'Multi-party computation',
        'Threshold signing',
        'Distributed verification',
      ],
    },
    maximum: {
      name: 'Maximum Privacy',
      description: 'Full privacy protection with zero-knowledge proofs',
      threshold: { min: 5, max: 7 },
      zkRequired: true,
      features: [
        'Zero-knowledge proofs',
        'Private computation',
        'Anonymous execution',
      ],
    },
  };

  useEffect(() => {
    checkMPCServerStatus();
    fetchRegisteredParties();
  }, []);

  const checkMPCServerStatus = async () => {
    try {
      const response = await fetch('/api/mpc/health');
      if (response.ok) {
        setMpcStatus('connected');
      } else {
        setMpcStatus('error');
      }
    } catch (error) {
      setMpcStatus('disconnected');
    }
  };

  const fetchRegisteredParties = async () => {
    try {
      const response = await fetch('/api/mpc/parties');
      if (response.ok) {
        const parties = await response.json();
        setRegisteredPartiesRaw(parties);
      }
    } catch (error) {
      console.error('Failed to fetch registered parties:', error);
    }
  };

  const createPrivateSession = async () => {
    setLoading(true);
    try {
      const sessionConfig = {
        protocol: zkProofEnabled
          ? 'zero_knowledge_computation'
          : 'threshold_signing',
        threshold: thresholdConfig.required,
        participants: registeredParties
          .slice(0, thresholdConfig.total)
          .map(p => p.id),
        metadata: {
          nftId,
          privacyLevel,
          zkProofEnabled,
          computationType: 'environmental_forecast',
        },
      };

      const response = await fetch('/api/mpc/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionConfig),
      });

      if (response.ok) {
        const session = await response.json();
        setActiveSession(session);

        if (onPrivacyConfigured) {
          onPrivacyConfigured({
            sessionId: session.sessionId,
            privacyLevel,
            mpcEnabled: true,
            zkProofEnabled,
          });
        }
      }
    } catch (error) {
      console.error('Failed to create private session:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePrivacyLevel = level => {
    setPrivacyLevel(level);
    const config = privacyLevels[level];

    // Update threshold settings based on privacy level
    setThresholdConfig({
      required: config.threshold.min,
      total: Math.max(config.threshold.max, registeredParties.length),
    });

    // Enable/disable zero-knowledge proofs
    setZkProofEnabled(config.zkRequired);
  };

  const getStatusColor = () => {
    switch (mpcStatus) {
    case 'connected':
      return '#4caf50';
    case 'error':
      return '#ff9800';
    case 'disconnected':
      return '#f44336';
    default:
      return '#9e9e9e';
    }
  };

  const getStatusText = () => {
    switch (mpcStatus) {
    case 'connected':
      return 'MPC Server Online';
    case 'error':
      return 'Connection Issues';
    case 'disconnected':
      return 'MPC Server Offline';
    default:
      return 'Checking Status...';
    }
  };

  return (
    <div className="mpc-privacy-controls">
      <div className="privacy-header">
        <h3>🔐 Privacy & Security Controls</h3>
        <div className="mpc-status">
          <div
            className="status-indicator"
            style={{ backgroundColor: getStatusColor() }}
          ></div>
          <span className="status-text">{getStatusText()}</span>
        </div>
      </div>

      <div className="privacy-level-selection">
        <h4>🛡️ Privacy Level</h4>
        <div className="privacy-levels">
          {Object.entries(privacyLevels).map(([key, level]) => (
            <div
              key={key}
              className={`privacy-level-card ${privacyLevel === key ? 'selected' : ''}`}
              onClick={() => updatePrivacyLevel(key)}
            >
              <div className="level-header">
                <h5>{level.name}</h5>
                <div className="level-indicator">
                  {key === 'basic' && '🔒'}
                  {key === 'standard' && '🔐'}
                  {key === 'maximum' && '🛡️'}
                </div>
              </div>
              <p className="level-description">{level.description}</p>
              <ul className="level-features">
                {level.features.map((feature, index) => (
                  <li key={index}>✓ {feature}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="threshold-configuration">
        <h4>🔢 Threshold Configuration</h4>
        <div className="threshold-settings">
          <div className="threshold-input">
            <label>Required Signatures:</label>
            <input
              type="number"
              min="2"
              max={thresholdConfig.total}
              value={thresholdConfig.required}
              onChange={e =>
                setThresholdConfig({
                  ...thresholdConfig,
                  required: parseInt(e.target.value),
                })
              }
            />
          </div>
          <div className="threshold-input">
            <label>Total Parties:</label>
            <input
              type="number"
              min={thresholdConfig.required}
              max="10"
              value={thresholdConfig.total}
              onChange={e =>
                setThresholdConfig({
                  ...thresholdConfig,
                  total: parseInt(e.target.value),
                })
              }
            />
          </div>
        </div>
        <div className="threshold-info">
          <p>
            Requires {thresholdConfig.required} out of {thresholdConfig.total}{' '}
            parties to agree for computation execution
          </p>
        </div>
      </div>

      <div className="advanced-features">
        <h4>⚡ Advanced Features</h4>
        <div className="feature-toggles">
          <div className="feature-toggle">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={zkProofEnabled}
                onChange={e => setZkProofEnabled(e.target.checked)}
                disabled={privacyLevel === 'maximum'}
              />
              <span className="toggle-slider"></span>
              Zero-Knowledge Proofs
            </label>
            <p className="feature-description">
              Hide computation inputs and intermediate results while proving
              correctness
            </p>
          </div>
        </div>
      </div>

      <div className="registered-parties">
        <h4>👥 Network Participants ({registeredParties.length})</h4>
        <div className="parties-grid">
          {registeredParties.slice(0, 6).map((party, index) => (
            <div key={party.id || index} className="party-card">
              <div className="party-id">
                {party.nodeId || `Node-${index + 1}`}
              </div>
              <div className="party-status online">● Online</div>
            </div>
          ))}
          {registeredParties.length === 0 && (
            <div className="no-parties">
              <p>No parties currently registered</p>
              <button onClick={fetchRegisteredParties} className="refresh-btn">
                🔄 Refresh
              </button>
            </div>
          )}
        </div>
      </div>

      {activeSession ? (
        <div className="active-session">
          <h4>🔐 Active Privacy Session</h4>
          <div className="session-info">
            <div className="session-detail">
              <span>Session ID:</span>
              <code>{activeSession.sessionId}</code>
            </div>
            <div className="session-detail">
              <span>Protocol:</span>
              <span>{activeSession.protocol}</span>
            </div>
            <div className="session-detail">
              <span>Participants:</span>
              <span>{activeSession.participants || thresholdConfig.total}</span>
            </div>
            <div className="session-status success">
              ✅ Privacy session active
            </div>
          </div>
        </div>
      ) : (
        <div className="session-controls">
          <button
            onClick={createPrivateSession}
            disabled={
              loading ||
              mpcStatus !== 'connected' ||
              registeredParties.length < thresholdConfig.required
            }
            className="create-session-btn"
          >
            {loading ? '🔄 Creating Session...' : '🚀 Enable Privacy Mode'}
          </button>
          {mpcStatus !== 'connected' && (
            <p className="warning">
              ⚠️ MPC server must be online to enable privacy features
            </p>
          )}
          {registeredParties.length < thresholdConfig.required && (
            <p className="warning">
              ⚠️ Need at least {thresholdConfig.required} registered parties
            </p>
          )}
        </div>
      )}

      <div className="privacy-benefits">
        <h4>🌟 Privacy Benefits</h4>
        <div className="benefits-grid">
          <div className="benefit-item">
            <span className="benefit-icon">🔒</span>
            <div>
              <h5>Data Protection</h5>
              <p>Environmental data remains encrypted throughout computation</p>
            </div>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">🔐</span>
            <div>
              <h5>Distributed Trust</h5>
              <p>No single party can access complete computation data</p>
            </div>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">🛡️</span>
            <div>
              <h5>Verifiable Results</h5>
              <p>Cryptographic proofs ensure computation integrity</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function MPCPrivacyControls(props) {
  return <DemoSurfaceGate testId="mpc-privacy" title="MPC privacy controls are unavailable"
    description="Private computation services are not available on this testnet.">
    <MPCPrivacyControlsSample {...props} />
  </DemoSurfaceGate>;
}

export default MPCPrivacyControls;
