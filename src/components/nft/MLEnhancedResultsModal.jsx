import React from 'react';
import './MLEnhancedResultsModal.css';
import { Icons } from '../common/Icons';

/**
 * Modal component to display ML-enhanced computational results
 */
const MLEnhancedResultsModal = ({
  show,
  onClose,
  results,
  modelType = 'WEATHER_FORECAST',
}) => {
  if (!show) return null;

  // Get the appropriate title based on model type
  const getTitle = () => {
    switch (modelType) {
    case 'WEATHER_FORECAST':
      return 'ML-Enhanced Weather Forecast Results';
    case 'CLIMATE_SIMULATION':
      return 'ML-Enhanced Climate Simulation Results';
    case 'AIR_QUALITY':
      return 'ML-Enhanced Air Quality Analysis Results';
    default:
      return 'ML-Enhanced Computational Results';
    }
  };

  // Function to render appropriate content based on model type
  const renderContent = () => {
    if (!results || !results.data) {
      return (
        <div className="ml-results-error">
          <span className="error-icon">{Icons.alertCircle}</span>
          <p>No results data available to display</p>
        </div>
      );
    }

    const { data } = results;

    // Default case if ML enhancement wasn't available
    if (!data.mlEnhanced) {
      return (
        <div className="ml-results-warning">
          <span className="warning-icon">{Icons.alertTriangle}</span>
          <p>
            ML enhancement unavailable:{' '}
            {data.mlError || 'API key not configured'}
          </p>
          <p>Showing base model results only.</p>
        </div>
      );
    }

    // Render content based on model type
    switch (modelType) {
    case 'WEATHER_FORECAST':
      return renderWeatherForecastResults(data);
    case 'CLIMATE_SIMULATION':
      return renderClimateSimulationResults(data);
    case 'AIR_QUALITY':
      return renderAirQualityResults(data);
    default:
      return (
        <div className="ml-results-generic">
          <p>ML-enhanced computational results available</p>
          <pre>{JSON.stringify(data.mlAnalysis, null, 2)}</pre>
        </div>
      );
    }
  };

  // Render ML-enhanced weather forecast results
  const renderWeatherForecastResults = data => {
    const { mlAnalysis, region, confidenceScore, accuracyImprovement } = data;

    if (!mlAnalysis) return <p>ML analysis data unavailable</p>;

    return (
      <div className="ml-results-weather">
        <div className="ml-metrics">
          <div className="ml-metric">
            <span className="ml-metric-label">Region</span>
            <span className="ml-metric-value">{region}</span>
          </div>
          <div className="ml-metric">
            <span className="ml-metric-label">Accuracy Improvement</span>
            <span className="ml-metric-value">{accuracyImprovement}</span>
          </div>
          <div className="ml-metric">
            <span className="ml-metric-label">Confidence Score</span>
            <span className="ml-metric-value">
              {(confidenceScore * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="ml-analysis-section">
          <h4>Summary</h4>
          <p>{mlAnalysis.summary}</p>
        </div>

        {mlAnalysis.patternAnalysis &&
          mlAnalysis.patternAnalysis.length > 0 && (
          <div className="ml-analysis-section">
            <h4>Pattern Analysis</h4>
            <ul>
              {mlAnalysis.patternAnalysis.map((pattern, idx) => (
                <li key={idx}>{pattern}</li>
              ))}
            </ul>
          </div>
        )}

        {data.extremeWeatherWarnings &&
          data.extremeWeatherWarnings.length > 0 && (
          <div className="ml-analysis-section warnings">
            <h4>Extreme Weather Warnings</h4>
            {data.extremeWeatherWarnings.map((warning, idx) => (
              <div
                key={idx}
                className={`warning-item ${warning.severity.toLowerCase()}`}
              >
                <div className="warning-header">
                  <span className="warning-icon">{Icons.alertTriangle}</span>
                  <span className="warning-type">{warning.type}</span>
                  <span className="warning-severity">{warning.severity}</span>
                </div>
                <p className="warning-details">{warning.details}</p>
                {warning.days && (
                  <div className="warning-days">
                    <span>Affected dates: </span>
                    {warning.days.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {mlAnalysis.recommendations &&
          mlAnalysis.recommendations.length > 0 && (
          <div className="ml-analysis-section">
            <h4>Recommendations</h4>
            <ul className="recommendations-list">
              {mlAnalysis.recommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Render ML-enhanced climate simulation results
  const renderClimateSimulationResults = data => {
    const {
      mlAnalysis,
      region,
      scenario,
      years,
      confidenceScore,
      accuracyImprovement,
    } = data;

    if (!mlAnalysis) return <p>ML analysis data unavailable</p>;

    return (
      <div className="ml-results-climate">
        <div className="ml-metrics">
          <div className="ml-metric">
            <span className="ml-metric-label">Region</span>
            <span className="ml-metric-value">{region}</span>
          </div>
          <div className="ml-metric">
            <span className="ml-metric-label">Scenario</span>
            <span className="ml-metric-value">{scenario}</span>
          </div>
          <div className="ml-metric">
            <span className="ml-metric-label">Years Projected</span>
            <span className="ml-metric-value">{years}</span>
          </div>
          <div className="ml-metric">
            <span className="ml-metric-label">Accuracy Improvement</span>
            <span className="ml-metric-value">{accuracyImprovement}</span>
          </div>
          <div className="ml-metric">
            <span className="ml-metric-label">Confidence</span>
            <span className="ml-metric-value">
              {(confidenceScore * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="ml-analysis-section">
          <h4>Summary</h4>
          <p>{mlAnalysis.summary}</p>
        </div>

        {mlAnalysis.trendAnalysis && mlAnalysis.trendAnalysis.length > 0 && (
          <div className="ml-analysis-section">
            <h4>Trend Analysis</h4>
            <ul>
              {mlAnalysis.trendAnalysis.map((trend, idx) => (
                <li key={idx}>{trend}</li>
              ))}
            </ul>
          </div>
        )}

        {mlAnalysis.keyIndicators && mlAnalysis.keyIndicators.length > 0 && (
          <div className="ml-analysis-section">
            <h4>Key Climate Indicators</h4>
            <div className="key-indicators">
              {mlAnalysis.keyIndicators.map((indicator, idx) => (
                <div key={idx} className="indicator-item">
                  <div className="indicator-header">
                    <span className="indicator-name">
                      {indicator.indicator}
                    </span>
                    <span
                      className={`indicator-confidence ${indicator.confidence}`}
                    >
                      {indicator.confidence}
                    </span>
                  </div>
                  <p className="indicator-trend">{indicator.trend}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {mlAnalysis.impacts && (
          <div className="ml-analysis-section">
            <h4>Climate Impacts</h4>
            <div className="impact-summary">
              <p>{mlAnalysis.impacts.summary}</p>
              <div className="risk-level">
                <span>Overall Risk: </span>
                <span className={`risk ${mlAnalysis.impacts.overallRisk}`}>
                  {mlAnalysis.impacts.overallRisk}
                </span>
              </div>
            </div>

            {mlAnalysis.impacts.details &&
              Object.keys(mlAnalysis.impacts.details).length > 0 && (
              <div className="impact-details">
                {Object.entries(mlAnalysis.impacts.details).map(
                  ([category, impacts]) => (
                    <div key={category} className="impact-category">
                      <h5>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </h5>
                      <ul>
                        {impacts.map((impact, idx) => (
                          <li key={idx}>{impact}</li>
                        ))}
                      </ul>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        )}

        {mlAnalysis.mitigationStrategies &&
          mlAnalysis.mitigationStrategies.length > 0 && (
          <div className="ml-analysis-section">
            <h4>Mitigation Strategies</h4>
            <ul className="strategies-list">
              {mlAnalysis.mitigationStrategies.map((strategy, idx) => (
                <li key={idx}>{strategy}</li>
              ))}
            </ul>
          </div>
        )}

        {mlAnalysis.cascadingEffects &&
          mlAnalysis.cascadingEffects.length > 0 && (
          <div className="ml-analysis-section">
            <h4>Cascading Effects</h4>
            <ul>
              {mlAnalysis.cascadingEffects.map((effect, idx) => (
                <li key={idx}>{effect}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Render ML-enhanced air quality results
  const renderAirQualityResults = data => {
    const {
      mlAnalysis,
      region,
      timeframe,
      confidenceScore,
      accuracyImprovement,
    } = data;

    if (!mlAnalysis) return <p>ML analysis data unavailable</p>;

    return (
      <div className="ml-results-air-quality">
        <div className="ml-metrics">
          <div className="ml-metric">
            <span className="ml-metric-label">Region</span>
            <span className="ml-metric-value">{region}</span>
          </div>
          <div className="ml-metric">
            <span className="ml-metric-label">Timeframe</span>
            <span className="ml-metric-value">{timeframe}</span>
          </div>
          <div className="ml-metric">
            <span className="ml-metric-label">Accuracy Improvement</span>
            <span className="ml-metric-value">{accuracyImprovement}</span>
          </div>
          <div className="ml-metric">
            <span className="ml-metric-label">Confidence</span>
            <span className="ml-metric-value">
              {(confidenceScore * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="ml-analysis-section">
          <h4>Summary</h4>
          <p>{mlAnalysis.summary}</p>
        </div>

        {mlAnalysis.patternAnalysis &&
          mlAnalysis.patternAnalysis.length > 0 && (
          <div className="ml-analysis-section">
            <h4>Pattern Analysis</h4>
            <ul>
              {mlAnalysis.patternAnalysis.map((pattern, idx) => (
                <li key={idx}>{pattern}</li>
              ))}
            </ul>
          </div>
        )}

        {mlAnalysis.healthImpacts && (
          <div className="ml-analysis-section">
            <h4>Health Impacts</h4>
            <div className="health-impacts">
              {Object.entries(mlAnalysis.healthImpacts).map(
                ([group, impact]) => (
                  <div key={group} className="health-impact-item">
                    <h5>{group.split(/(?=[A-Z])/).join(' ')}</h5>
                    <p>{impact}</p>
                  </div>
                ),
              )}
            </div>
          </div>
        )}

        {mlAnalysis.healthRecommendations &&
          mlAnalysis.healthRecommendations.length > 0 && (
          <div className="ml-analysis-section">
            <h4>Health Recommendations</h4>
            <ul className="recommendations-list">
              {mlAnalysis.healthRecommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>
        )}

        {mlAnalysis.sourceAttribution && (
          <div className="ml-analysis-section">
            <h4>Pollution Source Attribution</h4>
            <p className="source-methodology">
              {mlAnalysis.sourceAttribution.methodology}
            </p>
            <div className="source-chart">
              {Object.entries(mlAnalysis.sourceAttribution.sources).map(
                ([source, data]) => (
                  <div key={source} className="source-bar">
                    <div className="source-label">
                      <span>
                        {source.charAt(0).toUpperCase() + source.slice(1)}
                      </span>
                      <span className={`confidence-badge ${data.confidence}`}>
                        {data.confidence}
                      </span>
                    </div>
                    <div className="source-bar-container">
                      <div
                        className="source-bar-fill"
                        style={{ width: `${data.contribution}%` }}
                      >
                        {data.contribution}%
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        )}

        {mlAnalysis.spatiotemporalPatterns && (
          <div className="ml-analysis-section">
            <h4>Temporal Patterns</h4>
            <ul>
              {mlAnalysis.spatiotemporalPatterns.temporalPatterns.map(
                (pattern, idx) => (
                  <li key={idx}>{pattern}</li>
                ),
              )}
            </ul>

            {mlAnalysis.spatiotemporalPatterns.peakPollutionTime && (
              <div className="peak-times">
                <p>
                  <strong>Peak Pollution Time:</strong>{' '}
                  {mlAnalysis.spatiotemporalPatterns.peakPollutionTime}
                </p>
                <p>
                  <strong>Lowest Pollution Time:</strong>{' '}
                  {mlAnalysis.spatiotemporalPatterns.lowestPollutionTime}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="ml-enhanced-modal-overlay">
      <div className="ml-enhanced-modal">
        <div className="ml-enhanced-modal-header">
          <h3>{getTitle()}</h3>
          <button className="close-button" onClick={onClose}>
            {Icons.x}
          </button>
        </div>
        <div className="ml-enhanced-modal-content">{renderContent()}</div>
        <div className="ml-enhanced-modal-footer">
          <div className="ml-powered-by">
            <span>Enhanced by Machine Learning</span>
          </div>
          <button className="close-button-text" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MLEnhancedResultsModal;
