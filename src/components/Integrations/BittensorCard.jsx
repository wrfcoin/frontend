import React, { useState, useEffect } from 'react';
import './IntegrationCards.css';

const BittensorCard = () => {
  const [status, setStatus] = useState('connecting');
  const [networkStats, setNetworkStats] = useState(null);
  const [responses, setResponses] = useState([]);

  useEffect(() => {
    // Simulate connection to Bittensor network
    const timer = setTimeout(() => {
      setStatus('connected');
      setNetworkStats({
        subnet: 'WrfcoinAI',
        totalNodes: 124,
        activeValidators: 36,
        averageStake: '2,450 TAO',
        totalStake: '88,200 TAO',
        validatorReward: '0.0312 TAO/hr',
        blockHeight: 3582914,
        networkEmission: '6.74 TAO/day',
      });
      setResponses([
        {
          id: 'q1',
          query: 'Analyze weather patterns in Brazil over next 5 days',
          timestamp: '12:34:15',
          model: 'MeteoGPT',
          status: 'completed',
        },
        {
          id: 'q2',
          query: 'Generate hurricane prediction model for Gulf Coast',
          timestamp: '10:22:08',
          model: 'AtmostNet',
          status: 'completed',
        },
        {
          id: 'q3',
          query: 'Detect anomalous climatic patterns in Southeast Asia',
          timestamp: '09:15:54',
          model: 'ClimateBERT',
          status: 'completed',
        },
      ]);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleQuerySubmit = () => {
    setStatus('querying');
    setTimeout(() => {
      setStatus('connected');
      const newQuery = {
        id: `q${responses.length + 1}`,
        query:
          'Predict impact of atmospheric rivers on California precipitation',
        timestamp: new Date().toLocaleTimeString(),
        model: 'WeatherNet',
        status: 'completed',
      };
      setResponses([newQuery, ...responses]);
    }, 2000);
  };

  return (
    <div className="integration-card">
      <div className="integration-header">
        <h2>Bittensor Integration</h2>
        <div className={`status-indicator ${status}`}>
          {status === 'connecting' && 'Connecting...'}
          {status === 'connected' && 'Connected'}
          {status === 'querying' && 'Querying Network...'}
          {status === 'error' && 'Connection Error'}
        </div>
      </div>

      <div className="integration-content">
        <div className="integration-section">
          <h3>Network Status</h3>
          <p>
            Bittensor is a decentralized machine learning network that provides
            AI inference capabilities for Wrfcoin's meteorological and climate
            prediction models.
          </p>

          {networkStats && (
            <div className="network-stats grid-stats">
              <div className="stat-card">
                <div className="stat-title">Subnet</div>
                <div className="stat-value">{networkStats.subnet}</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Total Nodes</div>
                <div className="stat-value">{networkStats.totalNodes}</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Active Validators</div>
                <div className="stat-value">
                  {networkStats.activeValidators}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Average Stake</div>
                <div className="stat-value">{networkStats.averageStake}</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Total Stake</div>
                <div className="stat-value">{networkStats.totalStake}</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Validator Reward</div>
                <div className="stat-value">{networkStats.validatorReward}</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Block Height</div>
                <div className="stat-value">{networkStats.blockHeight}</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Network Emission</div>
                <div className="stat-value">{networkStats.networkEmission}</div>
              </div>
            </div>
          )}
        </div>

        <div className="integration-section">
          <h3>Weather AI Query</h3>
          <div className="query-interface">
            <div className="query-form">
              <select className="query-model-select">
                <option value="auto">Auto-select Best Model</option>
                <option value="MeteoGPT">MeteoGPT (General Weather)</option>
                <option value="AtmostNet">AtmostNet (Extreme Weather)</option>
                <option value="ClimateBERT">
                  ClimateBERT (Climate Analytics)
                </option>
                <option value="WeatherNet">WeatherNet (Precipitation)</option>
                <option value="TempFormer">
                  TempFormer (Temperature Modeling)
                </option>
              </select>
              <textarea
                className="query-input"
                placeholder="Enter weather analysis or prediction query..."
                defaultValue="Predict impact of atmospheric rivers on California precipitation"
              />
              <button
                className="query-submit-btn"
                onClick={handleQuerySubmit}
                disabled={status !== 'connected'}
              >
                Submit Query to Network
              </button>
            </div>
          </div>
        </div>

        <div className="integration-section">
          <h3>Recent Responses</h3>
          <div className="responses-list">
            {responses.map(response => (
              <div key={response.id} className="response-item">
                <div className="response-header">
                  <div className="response-title">{response.query}</div>
                  <div className="response-meta">
                    <span className="response-timestamp">
                      {response.timestamp}
                    </span>
                    <span className="response-model">{response.model}</span>
                    <span className={`response-status ${response.status}`}>
                      {response.status}
                    </span>
                  </div>
                </div>
                <div className="response-content">
                  <p className="response-result">
                    {response.id === 'q1' &&
                      'Analysis indicates moderate to heavy rainfall in southern regions of Brazil with potential flooding in coastal areas. Northern regions will experience scattered thunderstorms with decreased intensity over the 5-day period.'}
                    {response.id === 'q2' &&
                      'Hurricane prediction model generated using historical data and current oceanic temperatures. Model indicates 65% probability of Category 3+ hurricane formation in Gulf Coast region within next 30 days.'}
                    {response.id === 'q3' &&
                      'Detected unusual warming pattern in South China Sea correlated with increased atmospheric pressure. Anomaly suggests potential for unseasonable typhoon development earlier than historical averages.'}
                    {response.id !== 'q1' &&
                      response.id !== 'q2' &&
                      response.id !== 'q3' &&
                      'Analysis complete. Atmospheric rivers are projected to deliver 150-200% of normal precipitation to Northern California over the next 10 days, with particularly heavy rainfall in the Sierra Nevada range resulting in potential snowpack increases of 22-30%.'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="integration-footer">
        <p>
          Bittensor integration provides decentralized AI inference for weather
          prediction, climate modeling, and meteorological analysis through a
          distributed network of specialized machine learning models.
        </p>
      </div>
    </div>
  );
};

export default BittensorCard;
