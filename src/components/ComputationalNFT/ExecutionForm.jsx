import React, { useState } from 'react';

import axios from 'axios';

import { WrfButton } from '../DesignSystem';
import './ExecutionForm.css';
import { devLog } from '../../utils/logger';

const ExecutionForm = ({ nftId, nftDetails }) => {
  const [formData, setFormData] = useState({
    parameters: {},
    resourceAllocation: {
      memory: nftDetails?.computationalSpecs?.memory || 512,
      cpuLimit: nftDetails?.computationalSpecs?.cpuLimit || 1,
      timeLimit: nftDetails?.computationalSpecs?.timeLimit || 60,
    },
    priority: 'normal',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Set up parameter fields based on computation type
  const [parameterFields, setParameterFields] = useState([]);

  React.useEffect(() => {
    if (nftDetails) {
      // Generate parameter fields based on NFT type
      const fields = [];

      if (nftDetails.computationType === 'Weather Forecast') {
        fields.push({
          id: 'location',
          name: 'Location',
          type: 'text',
          description: 'Location for the forecast (e.g., "New York, NY")',
          required: true,
        });
        fields.push({
          id: 'days',
          name: 'Forecast Days',
          type: 'number',
          min: 1,
          max: 10,
          description: 'Number of days to forecast (1-10)',
          required: true,
        });
        fields.push({
          id: 'resolution',
          name: 'Resolution',
          type: 'select',
          options: ['low', 'medium', 'high'],
          description: 'Spatial resolution of the forecast',
          required: true,
        });
      } else if (nftDetails.computationType === 'Climate Model') {
        fields.push({
          id: 'region',
          name: 'Region',
          type: 'text',
          description: 'Geographic region for the model',
          required: true,
        });
        fields.push({
          id: 'scenario',
          name: 'Climate Scenario',
          type: 'select',
          options: ['RCP2.6', 'RCP4.5', 'RCP6.0', 'RCP8.5'],
          description: 'Representative Concentration Pathway scenario',
          required: true,
        });
        fields.push({
          id: 'timeframe',
          name: 'Timeframe',
          type: 'select',
          options: ['2030', '2050', '2070', '2100'],
          description: 'Target year for the projection',
          required: true,
        });
      } else if (nftDetails.computationType === 'Air Quality') {
        fields.push({
          id: 'location',
          name: 'Location',
          type: 'text',
          description: 'Location for air quality assessment',
          required: true,
        });
        fields.push({
          id: 'pollutants',
          name: 'Pollutants',
          type: 'multiselect',
          options: ['PM2.5', 'PM10', 'O3', 'NO2', 'SO2', 'CO'],
          description: 'Pollutants to include in the simulation',
          required: true,
        });
        fields.push({
          id: 'duration',
          name: 'Duration',
          type: 'number',
          min: 1,
          max: 30,
          description: 'Duration of the simulation in days',
          required: true,
        });
      } else {
        // Generic parameters for other computation types
        fields.push({
          id: 'input',
          name: 'Input Data',
          type: 'textarea',
          description: 'Input data for the computation (JSON format)',
          required: true,
        });
      }

      setParameterFields(fields);

      // Initialize parameter values
      const initialParams = {};
      fields.forEach(field => {
        if (field.type === 'number') {
          initialParams[field.id] = field.min || 1;
        } else if (field.type === 'select' && field.options?.length > 0) {
          initialParams[field.id] = field.options[0];
        } else if (field.type === 'multiselect' && field.options?.length > 0) {
          initialParams[field.id] = [field.options[0]];
        } else {
          initialParams[field.id] = '';
        }
      });

      setFormData(prev => ({
        ...prev,
        parameters: initialParams,
      }));
    }
  }, [nftDetails]);

  const handleParameterChange = (id, value) => {
    setFormData(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [id]: value,
      },
    }));
  };

  const handleResourceChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      resourceAllocation: {
        ...prev.resourceAllocation,
        [name]: parseInt(value, 10),
      },
    }));
  };

  const handlePriorityChange = e => {
    setFormData(prev => ({
      ...prev,
      priority: e.target.value,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate required parameters
      const missingParams = parameterFields
        .filter(field => field.required)
        .filter(field => !formData.parameters[field.id])
        .map(field => field.name);

      if (missingParams.length > 0) {
        throw new Error(
          `Missing required parameters: ${missingParams.join(', ')}`,
        );
      }

      // Submit execution request
      const response = await axios.post(
        `/api/computational/nfts/${nftId}/execute`,
        {
          parameters: formData.parameters,
          resourceAllocation: formData.resourceAllocation,
          priority: formData.priority,
        },
      );

      setSuccess(true);
      devLog('Execution started:', response.data);
    } catch (err) {
      console.error('Error executing NFT:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to start execution',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="execution-form">
      {success ? (
        <div className="execution-success">
          <h4>Execution Started Successfully</h4>
          <p>
            Your computational task has been submitted and is now processing.
          </p>
          <p>You can monitor its progress in the "Monitor" tab.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="parameter-section">
            <h5>Computation Parameters</h5>
            <div className="parameter-fields">
              {parameterFields.map(field => (
                <div key={field.id} className="parameter-field">
                  <label htmlFor={field.id}>
                    {field.name}
                    {field.required && <span className="required">*</span>}
                  </label>

                  {field.type === 'text' && (
                    <input
                      type="text"
                      id={field.id}
                      value={formData.parameters[field.id] || ''}
                      onChange={e =>
                        handleParameterChange(field.id, e.target.value)
                      }
                      placeholder={field.description}
                      required={field.required}
                    />
                  )}

                  {field.type === 'number' && (
                    <input
                      type="number"
                      id={field.id}
                      min={field.min}
                      max={field.max}
                      value={formData.parameters[field.id] || field.min || 0}
                      onChange={e =>
                        handleParameterChange(
                          field.id,
                          parseInt(e.target.value, 10),
                        )
                      }
                      required={field.required}
                    />
                  )}

                  {field.type === 'select' && (
                    <select
                      id={field.id}
                      value={formData.parameters[field.id] || ''}
                      onChange={e =>
                        handleParameterChange(field.id, e.target.value)
                      }
                      required={field.required}
                    >
                      {field.options?.map(option => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )}

                  {field.type === 'multiselect' && (
                    <div className="checkbox-group">
                      {field.options?.map(option => (
                        <div key={option} className="checkbox-item">
                          <input
                            type="checkbox"
                            id={`${field.id}-${option}`}
                            checked={(
                              formData.parameters[field.id] || []
                            ).includes(option)}
                            onChange={e => {
                              const currentValues =
                                formData.parameters[field.id] || [];
                              const newValues = e.target.checked
                                ? [...currentValues, option]
                                : currentValues.filter(val => val !== option);

                              handleParameterChange(field.id, newValues);
                            }}
                          />
                          <label htmlFor={`${field.id}-${option}`}>
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}

                  {field.type === 'textarea' && (
                    <textarea
                      id={field.id}
                      value={formData.parameters[field.id] || ''}
                      onChange={e =>
                        handleParameterChange(field.id, e.target.value)
                      }
                      placeholder={field.description}
                      rows={5}
                      required={field.required}
                    />
                  )}

                  <div className="field-description">{field.description}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="resource-section">
            <h5>Resource Allocation</h5>
            <div className="resource-fields">
              <div className="resource-field">
                <label htmlFor="memory">Memory (MB)</label>
                <input
                  type="number"
                  id="memory"
                  name="memory"
                  min="128"
                  max="8192"
                  value={formData.resourceAllocation.memory}
                  onChange={handleResourceChange}
                />
              </div>

              <div className="resource-field">
                <label htmlFor="cpuLimit">CPU Limit (cores)</label>
                <input
                  type="number"
                  id="cpuLimit"
                  name="cpuLimit"
                  min="0.5"
                  max="8"
                  step="0.5"
                  value={formData.resourceAllocation.cpuLimit}
                  onChange={handleResourceChange}
                />
              </div>

              <div className="resource-field">
                <label htmlFor="timeLimit">Time Limit (minutes)</label>
                <input
                  type="number"
                  id="timeLimit"
                  name="timeLimit"
                  min="1"
                  max="1440"
                  value={formData.resourceAllocation.timeLimit}
                  onChange={handleResourceChange}
                />
              </div>
            </div>
          </div>

          <div className="priority-section">
            <h5>Execution Priority</h5>
            <div className="priority-options">
              <div className="priority-option">
                <input
                  type="radio"
                  id="priority-low"
                  name="priority"
                  value="low"
                  checked={formData.priority === 'low'}
                  onChange={handlePriorityChange}
                />
                <label htmlFor="priority-low">
                  <span className="priority-name">Low</span>
                  <span className="priority-desc">
                    Lower cost, longer queue time
                  </span>
                </label>
              </div>

              <div className="priority-option">
                <input
                  type="radio"
                  id="priority-normal"
                  name="priority"
                  value="normal"
                  checked={formData.priority === 'normal'}
                  onChange={handlePriorityChange}
                />
                <label htmlFor="priority-normal">
                  <span className="priority-name">Normal</span>
                  <span className="priority-desc">Standard priority</span>
                </label>
              </div>

              <div className="priority-option">
                <input
                  type="radio"
                  id="priority-high"
                  name="priority"
                  value="high"
                  checked={formData.priority === 'high'}
                  onChange={handlePriorityChange}
                />
                <label htmlFor="priority-high">
                  <span className="priority-name">High</span>
                  <span className="priority-desc">
                    Higher cost, priority execution
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <WrfButton
              type="submit"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Starting Execution...' : 'Start Execution'}
            </WrfButton>
          </div>
        </form>
      )}
    </div>
  );
};

export default ExecutionForm;
