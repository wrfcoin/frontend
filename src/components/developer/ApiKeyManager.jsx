import DemoSurfaceGate from '../common/DemoSurfaceGate';
/**
 * API Key Manager Component
 * Handles CRUD operations for API keys with advanced security features
 */

import React, { useState, useEffect } from 'react';
import { WrfButton } from '../DesignSystem';
import './ApiKeyManager.css';

const ApiKeyManagerSample = ({ userId }) => {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);
  const [showKeyDetails, setShowKeyDetails] = useState(false);
  const [newApiKey, setNewApiKey] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: ['read'],
    scopes: ['*'],
    rateLimitTier: 'standard',
    expiryDays: 365,
    allowedIps: '',
    allowedDomains: '',
    environment: 'production',
  });

  useEffect(() => {
    loadApiKeys();
  }, [userId]);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/developer/api-keys', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('apiKey')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.data || []);
      } else {
        console.error('Failed to load API keys');
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async e => {
    e.preventDefault();

    try {
      const requestData = {
        ...formData,
        allowedIps: formData.allowedIps
          ? formData.allowedIps.split(',').map(ip => ip.trim())
          : [],
        allowedDomains: formData.allowedDomains
          ? formData.allowedDomains.split(',').map(domain => domain.trim())
          : [],
      };

      const response = await fetch('/api/developer/api-keys', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('apiKey')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        const data = await response.json();
        setNewApiKey(data.data);
        setShowCreateForm(false);
        loadApiKeys();
        resetForm();
      } else {
        const error = await response.json();
        alert(`Error creating API key: ${error.message}`);
      }
    } catch (error) {
      console.error('Error creating API key:', error);
      alert('Failed to create API key. Please try again.');
    }
  };

  const handleDeleteKey = async keyId => {
    if (
      !confirm(
        'Are you sure you want to revoke this API key? This action cannot be undone.',
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/developer/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('apiKey')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'Revoked by user',
        }),
      });

      if (response.ok) {
        loadApiKeys();
      } else {
        const error = await response.json();
        alert(`Error revoking API key: ${error.message}`);
      }
    } catch (error) {
      console.error('Error revoking API key:', error);
      alert('Failed to revoke API key. Please try again.');
    }
  };

  const handleToggleKeyStatus = async (keyId, isActive) => {
    try {
      const response = await fetch(`/api/developer/api-keys/${keyId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('apiKey')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        loadApiKeys();
      } else {
        const error = await response.json();
        alert(`Error updating API key: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating API key:', error);
      alert('Failed to update API key. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      permissions: ['read'],
      scopes: ['*'],
      rateLimitTier: 'standard',
      expiryDays: 365,
      allowedIps: '',
      allowedDomains: '',
      environment: 'production',
    });
  };

  const copyToClipboard = text => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    });
  };

  const formatDate = dateString => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="api-key-manager loading">
        <div className="loading-spinner">Loading API keys...</div>
      </div>
    );
  }

  return (
    <div className="api-key-manager">
      {/* New API Key Success Modal */}
      {newApiKey && (
        <div className="modal-overlay">
          <div className="modal new-key-modal">
            <div className="modal-header">
              <h3>🎉 API Key Created Successfully!</h3>
            </div>
            <div className="modal-body">
              <div className="key-display">
                <label>Your new API key:</label>
                <div className="key-value">
                  <code>{newApiKey.key}</code>
                  <button
                    className="copy-btn"
                    onClick={() => copyToClipboard(newApiKey.key)}
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div className="warning">
                <p>
                  ⚠️ <strong>Important:</strong> Store this key securely. You
                  won't be able to view it again!
                </p>
              </div>
              <div className="key-info">
                <p>
                  <strong>Name:</strong> {newApiKey.name}
                </p>
                <p>
                  <strong>Permissions:</strong>{' '}
                  {newApiKey.permissions.join(', ')}
                </p>
                <p>
                  <strong>Rate Limit:</strong> {newApiKey.rateLimitTier}
                </p>
                <p>
                  <strong>Expires:</strong> {formatDate(newApiKey.expiresAt)}
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <WrfButton
                variant="primary"
                onClick={() => setNewApiKey(null)}
              >
                Got it!
              </WrfButton>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="manager-header">
        <div className="header-left">
          <h3>API Keys</h3>
          <p>Manage your API keys and access tokens</p>
        </div>
        <WrfButton
          variant="primary"
          onClick={() => setShowCreateForm(true)}
        >
          + Create New Key
        </WrfButton>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal create-key-modal">
            <div className="modal-header">
              <h3>Create New API Key</h3>
              <button
                className="close-btn"
                onClick={() => setShowCreateForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateKey}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Production App"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Optional description of what this key is used for"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Permissions</label>
                    <select
                      multiple
                      value={formData.permissions}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          permissions: Array.from(
                            e.target.selectedOptions,
                            option => option.value,
                          ),
                        })
                      }
                    >
                      <option value="read">Read</option>
                      <option value="write">Write</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Rate Limit Tier</label>
                    <select
                      value={formData.rateLimitTier}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          rateLimitTier: e.target.value,
                        })
                      }
                    >
                      <option value="basic">Basic (1K/day)</option>
                      <option value="standard">Standard (10K/day)</option>
                      <option value="premium">Premium (100K/day)</option>
                      <option value="enterprise">Enterprise (1M/day)</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Environment</label>
                    <select
                      value={formData.environment}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          environment: e.target.value,
                        })
                      }
                    >
                      <option value="production">Production</option>
                      <option value="staging">Staging</option>
                      <option value="development">Development</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Expiry (days)</label>
                    <input
                      type="number"
                      value={formData.expiryDays}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          expiryDays: parseInt(e.target.value),
                        })
                      }
                      min="1"
                      max="3650"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Allowed IP Addresses (optional)</label>
                  <input
                    type="text"
                    value={formData.allowedIps}
                    onChange={e =>
                      setFormData({ ...formData, allowedIps: e.target.value })
                    }
                    placeholder="192.168.1.1, 10.0.0.0/8 (comma-separated)"
                  />
                  <small>Leave empty to allow all IPs</small>
                </div>

                <div className="form-group">
                  <label>Allowed Domains (optional)</label>
                  <input
                    type="text"
                    value={formData.allowedDomains}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        allowedDomains: e.target.value,
                      })
                    }
                    placeholder="example.com, app.example.com (comma-separated)"
                  />
                  <small>Leave empty to allow all domains</small>
                </div>
              </div>
              <div className="modal-footer">
                <WrfButton
                  variant="secondary"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </WrfButton>
                <WrfButton variant="primary" type="submit">
                  Create API Key
                </WrfButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* API Keys List */}
      <div className="keys-list">
        {apiKeys.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔑</div>
            <h4>No API Keys Yet</h4>
            <p>Create your first API key to start building with WRFCoin APIs</p>
            <WrfButton
              variant="primary"
              onClick={() => setShowCreateForm(true)}
            >
              Create Your First Key
            </WrfButton>
          </div>
        ) : (
          <div className="keys-grid">
            {apiKeys.map(key => (
              <div
                key={key.id}
                className={`key-card ${key.isActive ? 'active' : 'inactive'}`}
              >
                <div className="key-header">
                  <div className="key-info">
                    <h4>{key.name}</h4>
                    <p className="key-prefix">{key.keyPrefix}</p>
                  </div>
                  <div className="key-status">
                    <span
                      className={`status-badge ${key.isActive ? 'active' : 'inactive'}`}
                    >
                      {key.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {key.description && (
                  <p className="key-description">{key.description}</p>
                )}

                <div className="key-details">
                  <div className="detail-item">
                    <span className="label">Permissions:</span>
                    <span className="value">{key.permissions.join(', ')}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Rate Limit:</span>
                    <span className="value">
                      {key.rateLimitTier} (
                      {key.dailyRequestLimit?.toLocaleString()}/day)
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Environment:</span>
                    <span className="value">{key.environment}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Created:</span>
                    <span className="value">{formatDate(key.createdAt)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Last Used:</span>
                    <span className="value">{formatDate(key.lastUsedAt)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Expires:</span>
                    <span className="value">{formatDate(key.expiresAt)}</span>
                  </div>
                </div>

                <div className="key-actions">
                  <WrfButton
                    variant={key.isActive ? 'outline' : 'primary'}
                    size="sm"
                    onClick={() => handleToggleKeyStatus(key.id, key.isActive)}
                  >
                    {key.isActive ? 'Disable' : 'Enable'}
                  </WrfButton>
                  <WrfButton
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedKey(key);
                      setShowKeyDetails(true);
                    }}
                  >
                    View Details
                  </WrfButton>
                  <WrfButton
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteKey(key.id)}
                  >
                    Revoke
                  </WrfButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default function ApiKeyManager(props) {
  return <DemoSurfaceGate testId="developer-keys" title="Developer API keys are unavailable"
    description="This API is not served by the testnet. Any enabled preview is illustrative.">
    <ApiKeyManagerSample {...props} />
  </DemoSurfaceGate>;
}
