import React, { useState } from 'react';
import PageTitle from '../common/PageTitle';
import WeatherStationModal from './WeatherStationModal';
import MyAcuRiteCard from './MyAcuRiteCard';
import WeatherUndergroundCard from './WeatherUndergroundCard';
import CWOPCard from './CWOPCard';
import AmbientWeatherCard from './AmbientWeatherCard';
import WeatherBugCard from './WeatherBugCard';
import PWSWeatherCard from './PWSWeatherCard';
import OpenWeatherMapCard from './OpenWeatherMapCard';
import NetatmoCard from './NetatmoCard';
import EcowittCard from './EcowittCard';
import './EasyOnboardingSection.css';
import './WeatherDataSharingPage.css';
import { devLog } from '../../utils/logger';

/**
 * Weather Data Sharing Integration Page
 * Dedicated page for existing weather data contributors to connect and earn WRF tokens
 */
const WeatherDataSharingPage = () => {
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePlatformClick = platform => {
    setSelectedPlatform(platform);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPlatform(null);
  };

  const handleConnect = async (platform, credentials) => {
    // Connect to the weather data API and start earning WRF
    devLog('Connecting to', platform, 'with credentials:', credentials);

    // Here we would typically:
    // 1. Validate the credentials with the weather service API
    // 2. Store the connection in our backend
    // 3. Start the automated data collection process
    // 4. Show success notification to user

    alert(
      `Successfully connected to ${platform}! Your weather data collection for WRF tokens will begin shortly.`,
    );
  };

  return (
    <div className="weather-data-sharing-page">
      <div className="page-header">
        <PageTitle
          title="Weather Data Sharing Integrations"
          subtitle="Connect your existing weather station and start earning WRF tokens in minutes"
        />
      </div>

      <div className="sharing-overview">
        <div className="overview-content">
          <div className="overview-text">
            <h2>Already Sharing Weather Data?</h2>
            <p>
              If you're already contributing weather data to popular platforms
              like MyAcuRite, Weather Underground, CWOP, or Ambient Weather, you
              can easily connect to Wrfcoin and start earning WRF tokens without
              any additional hardware or disruption to your existing setup.
            </p>
          </div>
          <div className="overview-stats">
            <div className="stat-card">
              <span className="stat-number">800K+</span>
              <span className="stat-label">Compatible Stations</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">9</span>
              <span className="stat-label">Supported Platforms</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">2 min</span>
              <span className="stat-label">Average Setup Time</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">0.1-1.2</span>
              <span className="stat-label">WRF per Hour</span>
            </div>
          </div>
        </div>
      </div>

      <div className="platforms-section">
        <h3>Supported Weather Data Sharing Platforms</h3>
        <p className="platforms-description">
          Choose your platform below to see detailed setup instructions and
          earning potential.
        </p>

        <div className="platforms-grid">
          <div
            className="platform-card-wrapper"
            onClick={() => handlePlatformClick('myacurite')}
          >
            <MyAcuRiteCard />
          </div>
          <div
            className="platform-card-wrapper"
            onClick={() => handlePlatformClick('weather-underground')}
          >
            <WeatherUndergroundCard />
          </div>
          <div
            className="platform-card-wrapper"
            onClick={() => handlePlatformClick('ambient-weather')}
          >
            <AmbientWeatherCard />
          </div>
          <div
            className="platform-card-wrapper"
            onClick={() => handlePlatformClick('cwop')}
          >
            <CWOPCard />
          </div>
          <div
            className="platform-card-wrapper"
            onClick={() => handlePlatformClick('weatherbug')}
          >
            <WeatherBugCard />
          </div>
          <div
            className="platform-card-wrapper"
            onClick={() => handlePlatformClick('pwsweather')}
          >
            <PWSWeatherCard />
          </div>
          <div
            className="platform-card-wrapper"
            onClick={() => handlePlatformClick('openweathermap')}
          >
            <OpenWeatherMapCard />
          </div>
          <div
            className="platform-card-wrapper"
            onClick={() => handlePlatformClick('netatmo')}
          >
            <NetatmoCard />
          </div>
          <div
            className="platform-card-wrapper"
            onClick={() => handlePlatformClick('ecowitt')}
          >
            <EcowittCard />
          </div>
        </div>
      </div>

      <div className="benefits-section">
        <h3>Why Connect Your Existing Weather Station?</h3>
        <div className="benefits-grid">
          <div className="benefit-item">
            <div className="benefit-icon">
              <i className="bi bi-coin"></i>
            </div>
            <div className="benefit-content">
              <h4>Earn WRF Tokens</h4>
              <p>
                Get 0.1-1.2 WRF per hour for weather data you're already sharing
              </p>
            </div>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">
              <i className="bi bi-shield-check"></i>
            </div>
            <div className="benefit-content">
              <h4>Zero Disruption</h4>
              <p>
                Continue using your existing weather sharing setup without any
                changes
              </p>
            </div>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">
              <i className="bi bi-clock"></i>
            </div>
            <div className="benefit-content">
              <h4>Quick Setup</h4>
              <p>Most integrations take less than 5 minutes to configure</p>
            </div>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">
              <i className="bi bi-graph-up"></i>
            </div>
            <div className="benefit-content">
              <h4>Enhanced Value</h4>
              <p>
                Monetize your weather data while contributing to scientific
                research
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="getting-started-section">
        <h3>Getting Started</h3>
        <div className="steps-grid">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Choose Your Platform</h4>
              <p>
                Select the weather sharing platform you're already using from
                the list above
              </p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Gather Credentials</h4>
              <p>
                Find your station ID, API key, or login credentials for your
                chosen platform
              </p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>Connect & Earn</h4>
              <p>
                Follow the setup guide and start earning WRF tokens
                automatically
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Weather Station Connection Modal */}
      <WeatherStationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        platform={selectedPlatform}
        onConnect={handleConnect}
      />
    </div>
  );
};

export default WeatherDataSharingPage;
