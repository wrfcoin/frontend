import React, { useState } from 'react';
import './WeatherStationModal.css';

/**
 * Weather Station Connection Modal
 * Allows users to enter their credentials for various weather platforms
 */
const WeatherStationModal = ({ isOpen, onClose, platform, onConnect }) => {
  const [credentials, setCredentials] = useState({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const platformConfigs = {
    myacurite: {
      name: 'MyAcuRite',
      icon: 'bi-cloud-check',
      color: '#0066cc',
      fields: [
        {
          key: 'email',
          label: 'MyAcuRite Email',
          placeholder: 'your.email@example.com',
          required: true,
          type: 'email',
        },
        {
          key: 'password',
          label: 'MyAcuRite Password',
          placeholder: 'Your account password',
          required: true,
          type: 'password',
        },
        {
          key: 'hubMac',
          label: 'Hub MAC Address (Optional)',
          placeholder: '00:0E:C6:XX:XX:XX',
          required: false,
        },
      ],
      instructions:
        'Use your existing MyAcuRite account credentials. Your hub will be automatically detected, or you can specify a particular hub by MAC address.',
    },
    'weather-underground': {
      name: 'Weather Underground',
      icon: 'bi-cloud-sun',
      color: '#1976d2',
      fields: [
        {
          key: 'stationId',
          label: 'Station ID',
          placeholder: 'KTXAUSTIN123',
          required: true,
        },
        {
          key: 'apiKey',
          label: 'API Key',
          placeholder: 'Your WU API key',
          required: true,
          type: 'password',
        },
      ],
      instructions:
        'Find your Station ID on your Weather Underground dashboard and generate an API key from your account settings.',
    },
    'ambient-weather': {
      name: 'Ambient Weather',
      icon: 'bi-thermometer-half',
      color: '#ff6b35',
      fields: [
        {
          key: 'applicationKey',
          label: 'Application Key',
          placeholder: 'Your app key',
          required: true,
          type: 'password',
        },
        {
          key: 'apiKey',
          label: 'API Key',
          placeholder: 'Your API key',
          required: true,
          type: 'password',
        },
        {
          key: 'macAddress',
          label: 'Device MAC Address',
          placeholder: '00:0E:C6:23:90:DC',
          required: true,
        },
      ],
      instructions:
        'Get your API credentials from the Ambient Weather Network dashboard under "Account" > "API Keys".',
    },
    cwop: {
      name: 'CWOP (NOAA)',
      icon: 'bi-globe-americas',
      color: '#2e7d32',
      fields: [
        {
          key: 'stationId',
          label: 'CWOP Station ID',
          placeholder: 'CW1234',
          required: true,
        },
        {
          key: 'callSign',
          label: 'Call Sign (if applicable)',
          placeholder: 'N0CALL',
          required: false,
        },
      ],
      instructions:
        'Your CWOP station ID is assigned when you register with NOAA. No API key required for basic access.',
    },
    weatherbug: {
      name: 'WeatherBug',
      icon: 'bi-bug',
      color: '#8bc34a',
      fields: [
        {
          key: 'stationId',
          label: 'Station ID',
          placeholder: 'TXAUS0123',
          required: true,
        },
        {
          key: 'apiKey',
          label: 'API Key',
          placeholder: 'Your WeatherBug API key',
          required: true,
          type: 'password',
        },
      ],
      instructions:
        'Find your Station ID in your WeatherBug dashboard and request API access from WeatherBug support.',
    },
    pwsweather: {
      name: 'PWS Weather',
      icon: 'bi-wifi',
      color: '#673ab7',
      fields: [
        {
          key: 'stationId',
          label: 'PWS ID',
          placeholder: 'TXAUSTIN123',
          required: true,
        },
        {
          key: 'password',
          label: 'Station Password',
          placeholder: 'Your station password',
          required: true,
          type: 'password',
        },
      ],
      instructions:
        'Use your PWS Weather station ID and the password you set up when registering your station.',
    },
    openweathermap: {
      name: 'OpenWeatherMap',
      icon: 'bi-cloud-drizzle',
      color: '#ff9800',
      fields: [
        {
          key: 'apiKey',
          label: 'API Key',
          placeholder: 'Your OpenWeatherMap API key',
          required: true,
          type: 'password',
        },
        {
          key: 'stationId',
          label: 'Station ID',
          placeholder: 'Your station ID',
          required: true,
        },
      ],
      instructions:
        'Sign up for a free OpenWeatherMap account and generate an API key from your dashboard.',
    },
    netatmo: {
      name: 'Netatmo Weather',
      icon: 'bi-house-gear',
      color: '#e91e63',
      fields: [
        {
          key: 'clientId',
          label: 'Client ID',
          placeholder: 'Your Netatmo client ID',
          required: true,
        },
        {
          key: 'clientSecret',
          label: 'Client Secret',
          placeholder: 'Your client secret',
          required: true,
          type: 'password',
        },
        {
          key: 'username',
          label: 'Username',
          placeholder: 'Your Netatmo email',
          required: true,
        },
        {
          key: 'password',
          label: 'Password',
          placeholder: 'Your Netatmo password',
          required: true,
          type: 'password',
        },
      ],
      instructions:
        'Create a Netatmo developer app at dev.netatmo.com to get your client credentials.',
    },
    ecowitt: {
      name: 'Ecowitt/Fine Offset',
      icon: 'bi-broadcast',
      color: '#795548',
      fields: [
        {
          key: 'applicationKey',
          label: 'Application Key',
          placeholder: 'Your Ecowitt app key',
          required: true,
          type: 'password',
        },
        {
          key: 'apiKey',
          label: 'API Key',
          placeholder: 'Your API key',
          required: true,
          type: 'password',
        },
        {
          key: 'macAddress',
          label: 'Gateway MAC',
          placeholder: '00:01:02:03:04:05',
          required: true,
        },
      ],
      instructions:
        'Get your API credentials from the Ecowitt app under "More" > "API" or from weather.ecowitt.net.',
    },
  };

  const config = platformConfigs[platform] || {};

  const handleInputChange = (key, value) => {
    setCredentials(prev => ({ ...prev, [key]: value }));
    setError('');
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setError('');

    // Validate required fields
    const missingFields = config.fields
      ?.filter(field => field.required && !credentials[field.key])
      .map(field => field.label);

    if (missingFields?.length > 0) {
      setError(`Please fill in required fields: ${missingFields.join(', ')}`);
      setIsConnecting(false);
      return;
    }

    try {
      // Call the connection handler
      await onConnect(platform, credentials);
      setIsConnecting(false);
      onClose();
    } catch (err) {
      setError(
        err.message || 'Failed to connect. Please check your credentials.',
      );
      setIsConnecting(false);
    }
  };

  return (
    <div className="weather-modal-overlay" onClick={onClose}>
      <div className="weather-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="platform-info">
            <div
              className="platform-icon"
              style={{ backgroundColor: config.color }}
            >
              <i className={`bi ${config.icon}`}></i>
            </div>
            <div>
              <h3>Connect {config.name}</h3>
              <p>Enter your credentials to start earning WRF tokens</p>
            </div>
          </div>
          <button className="close-button" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="modal-body">
          <div className="instructions">
            <h4>Setup Instructions</h4>
            <p>{config.instructions}</p>
          </div>

          <div className="credentials-form">
            <h4>Credentials</h4>
            {config.fields?.map(field => (
              <div key={field.key} className="form-group">
                <label>
                  {field.label}
                  {field.required && <span className="required">*</span>}
                </label>
                <input
                  type={field.type || 'text'}
                  placeholder={field.placeholder}
                  value={credentials[field.key] || ''}
                  onChange={e => handleInputChange(field.key, e.target.value)}
                  required={field.required}
                />
              </div>
            ))}
          </div>

          {error && (
            <div className="error-message">
              <i className="bi bi-exclamation-triangle"></i>
              {error}
            </div>
          )}

          <div className="earning-info">
            <h4>Earning Potential</h4>
            <div className="earning-stats">
              <div className="stat">
                <span className="value">0.1-1.2 WRF</span>
                <span className="label">Per Hour</span>
              </div>
              <div className="stat">
                <span className="value">24/7</span>
                <span className="label">Automatic</span>
              </div>
              <div className="stat">
                <span className="value">Instant</span>
                <span className="label">Payouts</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="connect-button"
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <i className="bi bi-arrow-repeat spin"></i>
                Connecting...
              </>
            ) : (
              <>
                <i className="bi bi-link-45deg"></i>
                Connect & Start Earning
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WeatherStationModal;
