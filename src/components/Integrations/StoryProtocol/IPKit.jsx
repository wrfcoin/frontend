import React, { useState, useEffect } from 'react';
import { WrfButton, WrfInput, WrfSelect } from '../../DesignSystem';
import DemoSurfaceGate from '../../common/DemoSurfaceGate';

// frontend#352: in the demo build this sample's actions are disabled; none of
// them reached a backend, and several reported success after a timer.
const SAMPLE_ACTION = 'Sample only: no IP asset is registered.';

/**
 * IP Kit Integration Component
 *
 * This component integrates Story Protocol's IPKit for managing intellectual property
 * of weather data and computational models in the NFT marketplace.
 *
 * Key features:
 * - IP Registration for data models
 * - License Management
 * - Rights verification
 * - Weather data IP protection
 */
function IPKitSample() {
  const [ipAssets, setIpAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newAsset, setNewAsset] = useState({
    name: '',
    description: '',
    category: 'WEATHER_DATA',
    license: 'CC_BY_NC',
  });

  // License types
  const licenseTypes = [
    { id: 'CC_BY', name: 'Creative Commons Attribution' },
    { id: 'CC_BY_NC', name: 'Creative Commons Attribution-NonCommercial' },
    { id: 'CC_BY_SA', name: 'Creative Commons Attribution-ShareAlike' },
    { id: 'MIT', name: 'MIT License' },
    { id: 'CUSTOM', name: 'Custom License' },
  ];

  // Asset categories
  const assetCategories = [
    { id: 'WEATHER_DATA', name: 'Weather Data' },
    { id: 'FORECAST_MODEL', name: 'Forecast Model' },
    { id: 'VISUALIZATION', name: 'Data Visualization' },
    { id: 'ANALYSIS_REPORT', name: 'Analysis Report' },
  ];

  // Load mock IP assets
  useEffect(() => {
    // Simulating API call to IPKit
    setTimeout(() => {
      const mockAssets = [
        {
          id: 'ip-001',
          name: 'Global Temperature Dataset 2023',
          description:
            'High-resolution global temperature dataset with measurements from 15,000 stations',
          category: 'WEATHER_DATA',
          license: 'CC_BY_NC',
          created: '2023-08-15',
          owner: 'data_collector',
          verified: true,
        },
        {
          id: 'ip-002',
          name: 'Hurricane Prediction Model v2',
          description:
            'Advanced hurricane path and intensity prediction model using transformers',
          category: 'FORECAST_MODEL',
          license: 'MIT',
          created: '2023-11-02',
          owner: 'algorithm_dev',
          verified: true,
        },
        {
          id: 'ip-003',
          name: 'Drought Patterns Visualization Tool',
          description:
            'Interactive visualization of global drought patterns from 1990-2023',
          category: 'VISUALIZATION',
          license: 'CC_BY_SA',
          created: '2024-01-21',
          owner: 'data_analyzer',
          verified: false,
        },
      ];

      setIpAssets(mockAssets);
      setLoading(false);
    }, 1000);
  }, []);

  // Handle IP asset form changes
  const handleInputChange = e => {
    const { name, value } = e.target;
    setNewAsset(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Register new IP asset
  const handleRegisterAsset = e => {
    e.preventDefault();

    // Simulate registration process
    setLoading(true);

    setTimeout(() => {
      const newIpAsset = {
        id: `ip-${Math.floor(Math.random() * 1000)}`,
        ...newAsset,
        created: new Date().toISOString().split('T')[0],
        owner: 'current_user',
        verified: false,
      };

      setIpAssets(prev => [...prev, newIpAsset]);
      setNewAsset({
        name: '',
        description: '',
        category: 'WEATHER_DATA',
        license: 'CC_BY_NC',
      });

      setLoading(false);
    }, 1500);
  };

  return (
    <div className="ipkit-container">
      <h2>IP Kit Integration</h2>
      <p className="description">
        Manage intellectual property rights for your weather data, models, and
        visualizations using Story Protocol's IPKit.
      </p>

      <div className="ipkit-content">
        <div className="register-asset-form">
          <h3>Register New IP Asset</h3>
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="form-group">
              <label htmlFor="name">Asset Name</label>
              <WrfInput
                type="text"
                id="name"
                name="name"
                value={newAsset.name}
                onChange={handleInputChange}
                required
                fullWidth
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <WrfInput
                id="description"
                name="description"
                value={newAsset.description}
                onChange={handleInputChange}
                multiline
                minRows={3}
                fullWidth
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category</label>
              <WrfSelect
                id="category"
                name="category"
                value={newAsset.category}
                onChange={handleInputChange}
                options={assetCategories.map(category => ({
                  value: category.id,
                  label: category.name,
                }))}
                fullWidth
              />
            </div>

            <div className="form-group">
              <label htmlFor="license">License Type</label>
              <WrfSelect
                id="license"
                name="license"
                value={newAsset.license}
                onChange={handleInputChange}
                options={licenseTypes.map(license => ({
                  value: license.id,
                  label: license.name,
                }))}
                fullWidth
              />
            </div>

            <WrfButton
              type="submit"
              title={SAMPLE_ACTION}
              variant="primary"
              disabled
            >
              {loading ? 'Registering...' : 'Register IP Asset'}
            </WrfButton>
          </form>
        </div>

        <div className="ip-assets-list">
          <h3>Your IP Assets</h3>

          {loading ? (
            <p>Loading IP assets...</p>
          ) : ipAssets.length > 0 ? (
            <div className="assets-grid">
              {ipAssets.map(asset => (
                <div key={asset.id} className="asset-card">
                  <div className="asset-header">
                    <h4>{asset.name}</h4>
                    {asset.verified ? (
                      <span className="verified-badge">✓ Verified</span>
                    ) : (
                      <span className="pending-badge">⌛ Pending</span>
                    )}
                  </div>
                  <p className="asset-description">{asset.description}</p>
                  <div className="asset-details">
                    <span className="asset-category">
                      {assetCategories.find(c => c.id === asset.category)
                        ?.name || asset.category}
                    </span>
                    <span className="asset-license">
                      {licenseTypes.find(l => l.id === asset.license)?.name ||
                        asset.license}
                    </span>
                    <span className="asset-date">Created: {asset.created}</span>
                    <span className="asset-owner">Owner: {asset.owner}</span>
                  </div>
                  <div className="asset-actions">
                    <WrfButton disabled title={SAMPLE_ACTION} variant="outline" size="sm">
                      View Details
                    </WrfButton>
                    <WrfButton disabled title={SAMPLE_ACTION} variant="outline" size="sm">
                      Manage Licenses
                    </WrfButton>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No IP assets found. Register your first asset to get started.</p>
          )}
        </div>
      </div>

      <div className="ipkit-features">
        <h3>IP Kit Features</h3>
        <div className="features-grid">
          <div className="feature-card">
            <h4>IP Registration</h4>
            <p>
              Register intellectual property for weather data and models
              on-chain
            </p>
          </div>
          <div className="feature-card">
            <h4>License Management</h4>
            <p>
              Create and manage sophisticated licensing terms for your assets
            </p>
          </div>
          <div className="feature-card">
            <h4>Rights Verification</h4>
            <p>
              Verify and enforce usage rights for computational models and data
            </p>
          </div>
          <div className="feature-card">
            <h4>Royalty Distribution</h4>
            <p>Automated royalty payments for data and model usage</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// frontend#352: display-only fabricated surface. The default build shows an
// honest not-live state and never mounts the sample.
const IPKit = () => (
  <DemoSurfaceGate
    title="Story Protocol IP registration is not live"
    description="No backend route registers IP assets with Story Protocol; nothing here is registered."
    testId="story-ipkit"
  >
    <IPKitSample />
  </DemoSurfaceGate>
);

export default IPKit;
