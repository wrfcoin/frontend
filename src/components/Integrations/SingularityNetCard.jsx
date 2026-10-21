import React, { useState, useEffect } from 'react';
import { WrfBadge, WrfButton } from '../DesignSystem';
import './IntegrationCards.css';

/**
 * SingularityNetCard Component
 *
 * This component provides integration with SingularityNET's decentralized AI marketplace,
 * allowing access to AI services for computational models and data processing.
 *
 * @param {Object} integrationState - Current state of the SingularityNET integration
 * @param {Function} onRefresh - Function to refresh the integration status
 */
const SingularityNetCard = ({ integrationState, onRefresh }) => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [selectedModel, setSelectedModel] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState(null);
  const [aiTokenBalance, setAiTokenBalance] = useState('0.00');

  // Simulate SingularityNET connection
  useEffect(() => {
    const connectToSingularityNet = async () => {
      setConnectionStatus('connecting');

      // Simulate connection delay
      setTimeout(() => {
        setConnectionStatus('connected');

        // Simulate available AI models
        setAvailableModels([
          {
            id: 'weather-forecast-ai',
            name: 'Weather Forecast AI',
            description: 'Advanced weather forecasting using deep learning',
            cost: '0.25 AGIX',
            provider: 'MeteoraAI',
            category: 'Weather',
          },
          {
            id: 'climate-model-gpt',
            name: 'Climate Model GPT',
            description: 'Specialized GPT model for climate data analysis',
            cost: '0.42 AGIX',
            provider: 'ClimateNET',
            category: 'Climate',
          },
          {
            id: 'air-quality-predictor',
            name: 'Air Quality Predictor',
            description: 'AI model for predicting air quality metrics',
            cost: '0.18 AGIX',
            provider: 'CleanAirLabs',
            category: 'Air Quality',
          },
          {
            id: 'extreme-weather-detector',
            name: 'Extreme Weather Detector',
            description: 'Early detection of extreme weather patterns',
            cost: '0.33 AGIX',
            provider: 'WeatherShieldAI',
            category: 'Weather',
          },
        ]);

        // Simulate token balance
        setAiTokenBalance('125.50');
      }, 1500);
    };

    if (integrationState === 'testnet' || integrationState === 'on') {
      connectToSingularityNet();
    }
  }, [integrationState]);

  // Handle model selection
  const handleModelSelect = model => {
    setSelectedModel(model);
  };

  // Handle AI service execution
  const handleRunAiService = async () => {
    if (!selectedModel) return;

    setIsProcessing(true);
    setProcessResult(null);

    // Simulate AI processing
    setTimeout(() => {
      setIsProcessing(false);

      // Generate mock result based on selected model
      let result;
      if (selectedModel.id === 'weather-forecast-ai') {
        result = {
          type: 'weather_forecast',
          forecast_period: '7 days',
          region: 'North America',
          generated_on: new Date().toISOString(),
          forecast_data: {
            confidence: '87%',
            data_points: 4328,
            precision: 'high',
            ipfs_data_hash: 'Qmf3Hk7z8NvjTR5LM9eYJ2Y1o2gGZjzL',
          },
        };
      } else if (selectedModel.id === 'climate-model-gpt') {
        result = {
          type: 'climate_analysis',
          model_version: '3.2',
          analysis_period: '2025-2035',
          scenario: 'RCP 4.5',
          generated_on: new Date().toISOString(),
          analysis_data: {
            confidence: '92%',
            data_points: 12500,
            precision: 'very high',
            ipfs_data_hash: 'QmT8jkR3u4Z1YL5FgmP9EWxHjv2i',
          },
        };
      } else if (selectedModel.id === 'air-quality-predictor') {
        result = {
          type: 'air_quality_prediction',
          prediction_period: '72 hours',
          region: 'Urban Centers',
          pollutants: ['PM2.5', 'NO2', 'O3', 'SO2'],
          generated_on: new Date().toISOString(),
          prediction_data: {
            confidence: '85%',
            data_points: 2160,
            precision: 'medium',
            ipfs_data_hash: 'QmZ9vYL4K7jgxT5QmR3pZ1fW2X',
          },
        };
      } else {
        result = {
          type: 'extreme_weather_detection',
          analysis_period: '30 days',
          regions_monitored: [
            'Atlantic Basin',
            'Pacific Northwest',
            'Gulf Region',
          ],
          generated_on: new Date().toISOString(),
          detection_data: {
            confidence: '79%',
            data_points: 8760,
            precision: 'high',
            anomalies_detected: 3,
            ipfs_data_hash: 'QmRtYp3N8K4LmZ5jX1V2F3Xg',
          },
        };
      }

      setProcessResult(result);

      // Simulate token balance reduction
      const cost = parseFloat(selectedModel.cost.split(' ')[0]);
      setAiTokenBalance(prevBalance => {
        const newBalance = (parseFloat(prevBalance) - cost).toFixed(2);
        return newBalance;
      });
    }, 3000);
  };

  // Reset processing state
  const handleReset = () => {
    setSelectedModel(null);
    setProcessResult(null);
  };

  if (integrationState === 'off') {
    return (
      <WrfCard
        className="integration-card singularitynet-card"
        headerTitle={
          <span>
            <i className="bi bi-robot"></i> SingularityNET
            <WrfBadge color="danger">Offline</WrfBadge>
          </span>
        }
      >
        <p>AI services integration is currently disabled</p>
        <p>
          Enable SingularityNET integration in the governance settings to
          access decentralized AI services for computational models.
        </p>
      </WrfCard>
    );
  }

  return (
    <WrfCard
      className="integration-card singularitynet-card"
      headerTitle={
        <span>
          <i className="bi bi-robot"></i> SingularityNET AI Marketplace
          {integrationState === 'testnet' && (
            <WrfBadge color="warning">Testnet</WrfBadge>
          )}
          {integrationState === 'on' && (
            <WrfBadge color="success">Mainnet</WrfBadge>
          )}
        </span>
      }
    >
      <div className="card-subtitle">
        <p>
          Decentralized AI marketplace for computational models and services
        </p>
      </div>
      <div>
        <div className="connection-status">
          {connectionStatus === 'disconnected' && (
            <div className="status-disconnected">
              <i className="bi bi-x-circle"></i> Disconnected from
              SingularityNET
            </div>
          )}
          {connectionStatus === 'connecting' && (
            <div className="status-connecting">
              <i className="bi bi-arrow-repeat spinning"></i> Connecting to
              SingularityNET...
            </div>
          )}
          {connectionStatus === 'connected' && (
            <div className="status-connected">
              <i className="bi bi-check-circle"></i> Connected to SingularityNET
              <div style={{ marginLeft: 'auto' }}>
                <i className="bi bi-coin"></i> {aiTokenBalance} AGIX
              </div>
            </div>
          )}
          {isProcessing && (
            <div className="status-processing">
              <i className="bi bi-arrow-repeat spinning"></i> Processing with AI
              service...
            </div>
          )}
        </div>

        {connectionStatus === 'connected' && !processResult && (
          <>
            <div className="ai-models-section">
              <h4>Available AI Models</h4>
              <div className="models-list">
                {availableModels.map(model => (
                  <div
                    key={model.id}
                    className={`model-item ${selectedModel?.id === model.id ? 'selected' : ''}`}
                    onClick={() => handleModelSelect(model)}
                  >
                    <div className="model-name">
                      <i className="bi bi-cpu"></i>
                      {model.name}
                    </div>
                    <div className="model-description">{model.description}</div>
                    <div className="model-info">
                      <span>
                        <i className="bi bi-tag"></i> {model.cost}
                      </span>
                      <span>
                        <i className="bi bi-building"></i> {model.provider}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="ai-service-actions">
              <WrfButton
                variant="primary"
                disabled={!selectedModel}
                onClick={handleRunAiService}
              >
                <i className="bi bi-play-fill"></i>
                Run AI Service
              </WrfButton>
              <WrfButton
                variant="secondary"
                onClick={handleReset}
                disabled={!selectedModel}
              >
                <i className="bi bi-x"></i>
                Cancel
              </WrfButton>
            </div>
          </>
        )}

        {processResult && (
          <div className="ai-process-result">
            <h4>AI Processing Result</h4>
            <div className="result-header">
              <span className="result-title">
                {processResult.type === 'weather_forecast' &&
                  'Weather Forecast Analysis'}
                {processResult.type === 'climate_analysis' &&
                  'Climate Model Analysis'}
                {processResult.type === 'air_quality_prediction' &&
                  'Air Quality Prediction'}
                {processResult.type === 'extreme_weather_detection' &&
                  'Extreme Weather Detection'}
              </span>
              <span className="result-timestamp">
                {new Date(processResult.generated_on).toLocaleString()}
              </span>
            </div>

            <div className="result-data">
              {processResult.type === 'weather_forecast' && (
                <div className="integration-info">
                  <div className="info-item">
                    <div className="info-label">Period:</div>
                    <div className="info-value">
                      {processResult.forecast_period}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Region:</div>
                    <div className="info-value">{processResult.region}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Confidence:</div>
                    <div className="info-value">
                      {processResult.forecast_data.confidence}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Data Points:</div>
                    <div className="info-value">
                      {processResult.forecast_data.data_points}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">IPFS Hash:</div>
                    <div className="info-value">
                      {processResult.forecast_data.ipfs_data_hash}
                    </div>
                  </div>
                </div>
              )}

              {processResult.type === 'climate_analysis' && (
                <div className="integration-info">
                  <div className="info-item">
                    <div className="info-label">Period:</div>
                    <div className="info-value">
                      {processResult.analysis_period}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Scenario:</div>
                    <div className="info-value">{processResult.scenario}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Model Version:</div>
                    <div className="info-value">
                      {processResult.model_version}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Confidence:</div>
                    <div className="info-value">
                      {processResult.analysis_data.confidence}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Data Points:</div>
                    <div className="info-value">
                      {processResult.analysis_data.data_points}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">IPFS Hash:</div>
                    <div className="info-value">
                      {processResult.analysis_data.ipfs_data_hash}
                    </div>
                  </div>
                </div>
              )}

              {processResult.type === 'air_quality_prediction' && (
                <div className="integration-info">
                  <div className="info-item">
                    <div className="info-label">Period:</div>
                    <div className="info-value">
                      {processResult.prediction_period}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Region:</div>
                    <div className="info-value">{processResult.region}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Pollutants:</div>
                    <div className="info-value">
                      {processResult.pollutants.join(', ')}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Confidence:</div>
                    <div className="info-value">
                      {processResult.prediction_data.confidence}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Data Points:</div>
                    <div className="info-value">
                      {processResult.prediction_data.data_points}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">IPFS Hash:</div>
                    <div className="info-value">
                      {processResult.prediction_data.ipfs_data_hash}
                    </div>
                  </div>
                </div>
              )}

              {processResult.type === 'extreme_weather_detection' && (
                <div className="integration-info">
                  <div className="info-item">
                    <div className="info-label">Period:</div>
                    <div className="info-value">
                      {processResult.analysis_period}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Regions:</div>
                    <div className="info-value">
                      {processResult.regions_monitored.join(', ')}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Anomalies:</div>
                    <div className="info-value">
                      {processResult.detection_data.anomalies_detected}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Confidence:</div>
                    <div className="info-value">
                      {processResult.detection_data.confidence}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Data Points:</div>
                    <div className="info-value">
                      {processResult.detection_data.data_points}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">IPFS Hash:</div>
                    <div className="info-value">
                      {processResult.detection_data.ipfs_data_hash}
                    </div>
                  </div>
                </div>
              )}

              <div className="ai-service-actions" style={{ marginTop: '15px' }}>
                <WrfButton
                  variant="secondary"
                  onClick={handleReset}
                >
                  <i className="bi bi-arrow-counterclockwise"></i>
                  Reset
                </WrfButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </WrfCard>
  );
};

export default SingularityNetCard;
