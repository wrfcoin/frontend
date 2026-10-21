import React, { useState, useEffect } from 'react';
import nftService from '../../services/nftService';
import './CreateNFTForm.css';

// Standardized enum values to match database schema
const COMPUTATION_TYPES = [
  { value: 'WEATHER_FORECAST', label: 'Weather Forecast' },
  { value: 'CLIMATE_SIMULATION', label: 'Climate Simulation' },
  { value: 'AIR_QUALITY', label: 'Air Quality Modeling' },
  { value: 'GENERIC', label: 'Generic Computation' },
];

const COMPUTATION_MODEL_TYPES = [
  { value: 'GFS', label: 'Global Forecast System (GFS)' },
  { value: 'WRF', label: 'Weather Research and Forecasting (WRF)' },
  {
    value: 'ECMWF',
    label: 'European Centre for Medium-Range Weather Forecasts',
  },
  { value: 'CMAQ', label: 'Community Multiscale Air Quality Modeling System' },
  { value: 'CUSTOM', label: 'Custom Model' },
];

const EXECUTION_ENVIRONMENTS = [
  { value: 'WASM', label: 'WebAssembly Sandbox' },
  { value: 'DOCKER', label: 'Docker Container' },
  { value: 'NATIVE', label: 'Native Execution' },
  { value: 'VM', label: 'Virtual Machine' },
];

const STORAGE_PROVIDERS = [
  { value: 'IPFS', label: 'IPFS' },
  { value: 'FILECOIN', label: 'Filecoin' },
  { value: 'ARWEAVE', label: 'Arweave' },
  { value: 'LOCAL', label: 'Local Node Storage' },
];

const DEFAULT_RESOURCE_REQUIREMENTS = {
  cpu_cores: 2,
  memory_mb: 1024,
  storage_mb: 512,
  execution_time_limit_seconds: 300,
  gpu_required: false,
};

const CreateNFTForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    creator: '', // Changed from creatorAddress to match DB schema
    owner: '', // Added owner field to match DB schema
    computationType: COMPUTATION_TYPES[0].value,
    computationModel: COMPUTATION_MODEL_TYPES[0].value,
    executionEnvironment: EXECUTION_ENVIRONMENTS[0].value,
    storageProvider: STORAGE_PROVIDERS[0].value,
    resourceRequirements: DEFAULT_RESOURCE_REQUIREMENTS,
    inputData: '',
    parameters: '',
    regionCode: '',
    regionLatitude: '',
    regionLongitude: '',
    forecastLength: 24, // Default 24-hour forecast for weather models
    updateFrequency: 'hourly',
    modelVersion: '1.0',
    creatorReputation: 0,
    reward: 5,
    metadata: {},
    previewMode: false,
    estimatedCost: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [metadataFields, setMetadataFields] = useState([
    { key: '', value: '' },
  ]);
  const [validationErrors, setValidationErrors] = useState({});
  const [step, setStep] = useState(1);
  const [totalSteps] = useState(4);

  // Handle metadata field changes and update the metadata object
  const handleMetadataChange = (index, field, value) => {
    const updatedFields = [...metadataFields];
    updatedFields[index][field] = value;
    setMetadataFields(updatedFields);

    // Update metadata object
    const metadata = {};
    updatedFields.forEach(item => {
      if (item.key && item.value) {
        metadata[item.key] = item.value;
      }
    });

    setFormData({
      ...formData,
      metadata,
    });
  };

  // Add new metadata field
  const addMetadataField = () => {
    setMetadataFields([...metadataFields, { key: '', value: '' }]);
  };

  // Remove metadata field
  const removeMetadataField = index => {
    const updatedFields = [...metadataFields];
    updatedFields.splice(index, 1);
    setMetadataFields(updatedFields);

    // Update metadata object
    const metadata = {};
    updatedFields.forEach(item => {
      if (item.key && item.value) {
        metadata[item.key] = item.value;
      }
    });

    setFormData({
      ...formData,
      metadata,
    });
  };

  const handleChange = e => {
    const { name, value, type } = e.target;

    if (name === 'resourceRequirements.gpu_required') {
      // Handle boolean checkbox
      setFormData({
        ...formData,
        resourceRequirements: {
          ...formData.resourceRequirements,
          gpu_required: e.target.checked,
        },
      });
    } else if (name.startsWith('resourceRequirements.')) {
      // Handle resource requirements nested object
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        resourceRequirements: {
          ...formData.resourceRequirements,
          [field]: type === 'number' ? parseInt(value, 10) : value,
        },
      });
    } else {
      // Handle regular form fields
      setFormData({
        ...formData,
        [name]:
          type === 'number'
            ? Number.isInteger(parseFloat(value))
              ? parseInt(value, 10)
              : parseFloat(value)
            : value,
      });
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      // If owner is empty, default to the creator
      const owner = formData.owner || formData.creator;

      // Format the data as needed for the API and DB schema
      const nftData = {
        ...formData,
        owner,
        // Convert JSON strings to objects
        parameters: formData.parameters ? JSON.parse(formData.parameters) : {},
        createdAt: new Date().toISOString(),
        status: 'PENDING', // Default status for new NFTs
        tokenStandard: 'ERC721', // Default token standard
      };

      const response = await nftService.createNFT(nftData);

      setSuccessMessage(
        `Computational NFT "${response.title}" created successfully!`,
      );
      // Reset form
      setFormData({
        title: '',
        description: '',
        creator: '',
        owner: '',
        computationType: COMPUTATION_TYPES[0].value,
        computationModel: COMPUTATION_MODEL_TYPES[0].value,
        executionEnvironment: EXECUTION_ENVIRONMENTS[0].value,
        storageProvider: STORAGE_PROVIDERS[0].value,
        resourceRequirements: DEFAULT_RESOURCE_REQUIREMENTS,
        inputData: '',
        parameters: '',
        regionCode: '',
        regionLatitude: '',
        regionLongitude: '',
        forecastLength: 24,
        updateFrequency: 'hourly',
        modelVersion: '1.0',
        creatorReputation: 0,
        reward: 5,
        metadata: {},
      });
      setMetadataFields([{ key: '', value: '' }]);
    } catch (error) {
      setErrorMessage(
        error.message || 'Failed to create NFT. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-nft-container">
      <h2>Create Computational NFT</h2>
      <p className="form-description">
        Create a new computational NFT that runs weather models, climate
        simulations, or other computational tasks on the Wrfcoin blockchain.
        Computational NFTs allow you to tokenize and monetize your computational
        models and algorithms.
      </p>

      {successMessage && (
        <div className="success-message">
          <span>✅</span> {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="error-message">
          <span>❌</span> {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-group">
            <label htmlFor="title">NFT Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., North America 10-day Weather Forecast"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what this computational NFT does..."
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="creator">Creator Wallet Address</label>
            <input
              type="text"
              id="creator"
              name="creator"
              value={formData.creator}
              onChange={handleChange}
              placeholder="Your Wrfcoin wallet address"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="owner">Owner Wallet Address (optional)</label>
            <input
              type="text"
              id="owner"
              name="owner"
              value={formData.owner}
              onChange={handleChange}
              placeholder="Leave blank if same as creator"
            />
            <small>If left blank, the creator will be set as the owner.</small>
          </div>
        </div>

        <div className="form-section">
          <h3>Computation Configuration</h3>
          <div className="form-group">
            <label htmlFor="computationType">Computation Type</label>
            <select
              id="computationType"
              name="computationType"
              value={formData.computationType}
              onChange={handleChange}
              required
            >
              {COMPUTATION_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="computationModel">Computation Model</label>
            <select
              id="computationModel"
              name="computationModel"
              value={formData.computationModel}
              onChange={handleChange}
              required
            >
              {COMPUTATION_MODEL_TYPES.map(model => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="executionEnvironment">Execution Environment</label>
            <select
              id="executionEnvironment"
              name="executionEnvironment"
              value={formData.executionEnvironment}
              onChange={handleChange}
              required
            >
              {EXECUTION_ENVIRONMENTS.map(env => (
                <option key={env.value} value={env.value}>
                  {env.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="storageProvider">Storage Provider</label>
            <select
              id="storageProvider"
              name="storageProvider"
              value={formData.storageProvider}
              onChange={handleChange}
              required
            >
              {STORAGE_PROVIDERS.map(provider => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-section">
          <h3>Resource Requirements</h3>
          <div className="resource-grid">
            <div className="form-group">
              <label htmlFor="resourceRequirements.cpu_cores">CPU Cores</label>
              <input
                type="number"
                id="resourceRequirements.cpu_cores"
                name="resourceRequirements.cpu_cores"
                value={formData.resourceRequirements.cpu_cores}
                onChange={handleChange}
                min="1"
                max="64"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="resourceRequirements.memory_mb">
                Memory (MB)
              </label>
              <input
                type="number"
                id="resourceRequirements.memory_mb"
                name="resourceRequirements.memory_mb"
                value={formData.resourceRequirements.memory_mb}
                onChange={handleChange}
                min="128"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="resourceRequirements.storage_mb">
                Storage (MB)
              </label>
              <input
                type="number"
                id="resourceRequirements.storage_mb"
                name="resourceRequirements.storage_mb"
                value={formData.resourceRequirements.storage_mb}
                onChange={handleChange}
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="resourceRequirements.execution_time_limit_seconds">
                Execution Time Limit (seconds)
              </label>
              <input
                type="number"
                id="resourceRequirements.execution_time_limit_seconds"
                name="resourceRequirements.execution_time_limit_seconds"
                value={
                  formData.resourceRequirements.execution_time_limit_seconds
                }
                onChange={handleChange}
                min="1"
                required
              />
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  id="resourceRequirements.gpu_required"
                  name="resourceRequirements.gpu_required"
                  checked={formData.resourceRequirements.gpu_required}
                  onChange={handleChange}
                />
                GPU Required
              </label>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Model Parameters & Data</h3>

          <div className="form-group">
            <label htmlFor="inputData">Input Data (optional)</label>
            <textarea
              id="inputData"
              name="inputData"
              value={formData.inputData}
              onChange={handleChange}
              placeholder="Input data for the computation model..."
              rows="3"
            />
            <small>
              Sample or template data that the model will process. Can be empty
              if data will be provided at runtime.
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="parameters">Parameters (JSON format)</label>
            <textarea
              id="parameters"
              name="parameters"
              value={formData.parameters}
              onChange={handleChange}
              placeholder='{"resolution": "high", "region": "north_america", "forecast_days": 10}'
              rows="4"
              required
            />
            <small>
              Enter computation parameters in JSON format. For example:
              &#123;&quot;resolution&quot;: &quot;high&quot;,
              &quot;region&quot;: &quot;north_america&quot;,
              &quot;forecast_days&quot;: 10&#125;
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="forecastLength">Forecast Length (hours)</label>
            <input
              type="number"
              id="forecastLength"
              name="forecastLength"
              value={formData.forecastLength}
              onChange={handleChange}
              min="1"
              max="240"
              required={formData.computationType === 'WEATHER_FORECAST'}
            />
            <small>
              For weather forecasts, how many hours into the future the model
              predicts.
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="updateFrequency">Update Frequency</label>
            <select
              id="updateFrequency"
              name="updateFrequency"
              value={formData.updateFrequency}
              onChange={handleChange}
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="on-demand">On Demand</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="modelVersion">Model Version</label>
            <input
              type="text"
              id="modelVersion"
              name="modelVersion"
              value={formData.modelVersion}
              onChange={handleChange}
              placeholder="e.g., 1.0.0"
              required
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Geographic Information</h3>
          <p className="section-description">
            For location-specific models like weather forecasts or air quality
            simulations, specify the geographic region this NFT covers.
          </p>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="regionCode">Region Code</label>
              <input
                type="text"
                id="regionCode"
                name="regionCode"
                value={formData.regionCode}
                onChange={handleChange}
                placeholder="e.g., NYC, LON, TYO"
                maxLength="10"
              />
              <small>Short code for the geographic region (max 10 chars)</small>
            </div>

            <div className="form-group">
              <label htmlFor="regionLatitude">Latitude</label>
              <input
                type="number"
                id="regionLatitude"
                name="regionLatitude"
                value={formData.regionLatitude}
                onChange={handleChange}
                step="0.000001"
                min="-90"
                max="90"
                placeholder="e.g., 40.7128"
              />
            </div>

            <div className="form-group">
              <label htmlFor="regionLongitude">Longitude</label>
              <input
                type="number"
                id="regionLongitude"
                name="regionLongitude"
                value={formData.regionLongitude}
                onChange={handleChange}
                step="0.000001"
                min="-180"
                max="180"
                placeholder="e.g., -74.0060"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Economics & Rewards</h3>

          <div className="form-group">
            <label htmlFor="reward">Reward per Execution (WRF)</label>
            <input
              type="number"
              id="reward"
              name="reward"
              value={formData.reward}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
            />
            <small>
              Reward in WRF tokens paid to nodes that execute this NFT
            </small>
          </div>
        </div>

        <div className="form-section">
          <h3>Additional Metadata</h3>
          <p className="section-description">
            Add custom metadata fields to provide additional information about
            your computational NFT.
          </p>

          {metadataFields.map((field, index) => (
            <div className="metadata-row" key={index}>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Key"
                  value={field.key}
                  onChange={e =>
                    handleMetadataChange(index, 'key', e.target.value)
                  }
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Value"
                  value={field.value}
                  onChange={e =>
                    handleMetadataChange(index, 'value', e.target.value)
                  }
                />
              </div>
              <button
                type="button"
                className="remove-button"
                onClick={() => removeMetadataField(index)}
                disabled={metadataFields.length === 1}
              >
                Remove
              </button>
            </div>
          ))}

          <button
            type="button"
            className="add-button"
            onClick={addMetadataField}
          >
            Add Metadata Field
          </button>
        </div>

        <button
          type="submit"
          className="create-nft-button"
          disabled={isLoading}
        >
          {isLoading ? 'Creating NFT...' : 'Create Computational NFT'}
        </button>
      </form>
    </div>
  );
};

export default CreateNFTForm;
