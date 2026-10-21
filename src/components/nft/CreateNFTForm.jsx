import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import './CreateNFTForm.css';

/**
 * Form for creating a new computational NFT
 */
const CreateNFTForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [newNftId, setNewNftId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    computationType: 'WEATHER_FORECAST',
    computationComplexity: 5,
    resourceRequirements: {
      cpu: 4,
      memory: 8192, // in MB
      disk: 10, // in GB
      gpu: false,
    },
    region: '',
    useLocation: false,
    latitude: '',
    longitude: '',
    contentUri: '', // Optional - could be an IPFS URI or direct URL
  });

  // Handle form input changes
  const handleInputChange = e => {
    const { name, value, type, checked } = e.target;

    if (name === 'useLocation') {
      setFormData(prev => ({
        ...prev,
        useLocation: checked,
      }));

      // If enabling location, try to get current coordinates
      if (checked && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          position => {
            setFormData(prev => ({
              ...prev,
              latitude: position.coords.latitude.toFixed(6),
              longitude: position.coords.longitude.toFixed(6),
            }));
          },
          error => {
            console.error('Error getting geolocation:', error);
          },
        );
      }
      return;
    }

    if (name === 'gpu') {
      setFormData(prev => ({
        ...prev,
        resourceRequirements: {
          ...prev.resourceRequirements,
          gpu: checked,
        },
      }));
      return;
    }

    if (name === 'cpu' || name === 'memory' || name === 'disk') {
      setFormData(prev => ({
        ...prev,
        resourceRequirements: {
          ...prev.resourceRequirements,
          [name]: type === 'number' ? parseInt(value) : value,
        },
      }));
      return;
    }

    if (name === 'computationComplexity') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value),
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Prepare final NFT data
    const nftData = {
      ...formData,
      metadata: formData.useLocation
        ? {
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
        }
        : null,
    };

    // Remove useLocation field as it's only for the form
    delete nftData.useLocation;

    // Remove latitude and longitude from top level if using metadata
    if (nftData.metadata) {
      delete nftData.latitude;
      delete nftData.longitude;
    }

    try {
      const response = await fetch('/api/computational/nft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nftData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create NFT');
      }

      const result = await response.json();
      setSuccess(true);
      setNewNftId(result.nftId);

      // Automatically redirect to the new NFT detail page after a short delay
      setTimeout(() => {
        navigate(`/nft/${result.nftId}`);
      }, 2000);
    } catch (error) {
      console.error('Error creating NFT:', error);
      setError(error.message || 'Failed to create NFT. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render complexity slider markers
  const renderComplexityMarkers = () => {
    return (
      <div className="complexity-markers">
        {Array.from({ length: 11 }, (_, i) => (
          <span key={i} className="complexity-marker">
            {i}
          </span>
        ))}
      </div>
    );
  };

  // Reset form
  const handleReset = () => {
    setFormData({
      name: '',
      description: '',
      computationType: 'WEATHER_FORECAST',
      computationComplexity: 5,
      resourceRequirements: {
        cpu: 4,
        memory: 8192,
        disk: 10,
        gpu: false,
      },
      region: '',
      useLocation: false,
      latitude: '',
      longitude: '',
      contentUri: '',
    });

    setError(null);
    setSuccess(false);
    setNewNftId(null);
  };

  // If successful submission, show success message
  if (success) {
    return (
      <div className="create-nft-container">
        <div className="create-nft-success">
          <div className="success-icon">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z"
                fill="#4CAF50"
              />
            </svg>
          </div>
          <h2>NFT Created Successfully!</h2>
          <p>
            Your computational NFT has been created and added to the blockchain.
          </p>
          <p className="nft-id">NFT ID: {newNftId}</p>
          <div className="success-actions">
            <button className="button secondary" onClick={handleReset}>
              Create Another NFT
            </button>
            <button
              className="button primary"
              onClick={() => navigate(`/nft/${newNftId}`)}
            >
              View Your NFT
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-nft-container">
      <div className="create-nft-header">
        <h2>Create Computational NFT</h2>
        <p>
          Mint a new computational NFT to contribute to climate science tasks
          and earn rewards.
        </p>
      </div>

      {error && (
        <div className="create-nft-error">
          <p>{error}</p>
        </div>
      )}

      <form className="create-nft-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Basic Information</h3>

          <div className="form-group">
            <label htmlFor="name">
              NFT Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter a name for your NFT"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">
              Description <span className="required">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe what this computational NFT represents"
              rows="4"
              required
            ></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="computationType">
              Computation Type <span className="required">*</span>
            </label>
            <select
              id="computationType"
              name="computationType"
              value={formData.computationType}
              onChange={handleInputChange}
              required
            >
              <option value="WEATHER_FORECAST">Weather Forecast</option>
              <option value="CLIMATE_SIMULATION">Climate Simulation</option>
              <option value="AIR_QUALITY">Air Quality</option>
              <option value="GENERIC">Generic</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="region">Region</label>
            <input
              type="text"
              id="region"
              name="region"
              value={formData.region}
              onChange={handleInputChange}
              placeholder="Geographical region (e.g., North America, Europe)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="contentUri">Content URI (Optional)</label>
            <input
              type="text"
              id="contentUri"
              name="contentUri"
              value={formData.contentUri}
              onChange={handleInputChange}
              placeholder="IPFS URI or other content link (e.g., ipfs://...)"
            />
            <span className="help-text">
              Link to visualization or additional content
            </span>
          </div>
        </div>

        <div className="form-section">
          <h3>Computational Complexity</h3>

          <div className="form-group slider-group">
            <label htmlFor="computationComplexity">
              Complexity Level:{' '}
              <span className="complexity-value">
                {formData.computationComplexity}
              </span>
            </label>
            <input
              type="range"
              id="computationComplexity"
              name="computationComplexity"
              min="1"
              max="10"
              step="1"
              value={formData.computationComplexity}
              onChange={handleInputChange}
            />
            {renderComplexityMarkers()}
            <div className="complexity-description">
              <span>Simple computations</span>
              <span>Complex simulations</span>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Resource Requirements</h3>

          <div className="resource-requirements-grid">
            <div className="form-group">
              <label htmlFor="cpu">
                CPU Cores <span className="required">*</span>
              </label>
              <input
                type="number"
                id="cpu"
                name="cpu"
                min="1"
                max="64"
                value={formData.resourceRequirements.cpu}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="memory">
                Memory (MB) <span className="required">*</span>
              </label>
              <input
                type="number"
                id="memory"
                name="memory"
                min="512"
                max="65536"
                step="512"
                value={formData.resourceRequirements.memory}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="disk">
                Disk Space (GB) <span className="required">*</span>
              </label>
              <input
                type="number"
                id="disk"
                name="disk"
                min="1"
                max="1000"
                value={formData.resourceRequirements.disk}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group checkbox-group">
              <input
                type="checkbox"
                id="gpu"
                name="gpu"
                checked={formData.resourceRequirements.gpu}
                onChange={handleInputChange}
              />
              <label htmlFor="gpu">Requires GPU</label>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Location Data</h3>

          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="useLocation"
              name="useLocation"
              checked={formData.useLocation}
              onChange={handleInputChange}
            />
            <label htmlFor="useLocation">Add Geographical Coordinates</label>
          </div>

          {formData.useLocation && (
            <div className="location-fields">
              <div className="form-group">
                <label htmlFor="latitude">
                  Latitude <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="latitude"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  placeholder="e.g., 40.7128"
                  required={formData.useLocation}
                />
              </div>

              <div className="form-group">
                <label htmlFor="longitude">
                  Longitude <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="longitude"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  placeholder="e.g., -74.0060"
                  required={formData.useLocation}
                />
              </div>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="button secondary"
            onClick={handleReset}
          >
            Reset
          </button>
          <button type="submit" className="button primary" disabled={loading}>
            {loading ? 'Creating NFT...' : 'Create NFT'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateNFTForm;
