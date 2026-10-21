import React from 'react';
import WeatherUndergroundCard from './WeatherUndergroundCard';
import CWOPCard from './CWOPCard';
import AmbientWeatherCard from './AmbientWeatherCard';
import WeatherBugCard from './WeatherBugCard';
import PWSWeatherCard from './PWSWeatherCard';
import OpenWeatherMapCard from './OpenWeatherMapCard';
import NetatmoCard from './NetatmoCard';
import EcowittCard from './EcowittCard';
import './EasyOnboardingSection.css';

/**
 * Easy Onboarding Section for Existing Weather Data Contributors
 * Highlights platforms where users are already sharing data and can easily start earning WRF
 */
const EasyOnboardingSection = () => {
  return (
    <div className="easy-onboarding-section">
      <div className="section-header">
        <div className="header-content">
          <h2>Already Sharing Weather Data?</h2>
          <p>
            Connect your existing weather station in under 5 minutes and start
            earning WRF tokens immediately
          </p>
        </div>
        <div className="header-stats">
          <div className="stat">
            <span className="stat-number">800K+</span>
            <span className="stat-label">Compatible Stations</span>
          </div>
          <div className="stat">
            <span className="stat-number">8</span>
            <span className="stat-label">Supported Platforms</span>
          </div>
          <div className="stat">
            <span className="stat-number">2 min</span>
            <span className="stat-label">Average Setup</span>
          </div>
        </div>
      </div>

      <div className="popular-platforms">
        <h3>Popular Weather Sharing Platforms</h3>
        <div className="platforms-grid">
          <WeatherUndergroundCard />
          <AmbientWeatherCard />
          <CWOPCard />
          <WeatherBugCard />
          <PWSWeatherCard />
          <OpenWeatherMapCard />
          <NetatmoCard />
          <EcowittCard />
        </div>
      </div>

      <div className="benefits-section">
        <h3>Why Connect Your Existing Station?</h3>
        <div className="benefits-grid">
          <div className="benefit">
            <div className="benefit-icon">
              <i className="bi bi-coin"></i>
            </div>
            <div className="benefit-content">
              <h4>Earn WRF Tokens</h4>
              <p>Get 0.1-1.0 WRF per hour for data you're already sharing</p>
            </div>
          </div>
          <div className="benefit">
            <div className="benefit-icon">
              <i className="bi bi-shield-check"></i>
            </div>
            <div className="benefit-content">
              <h4>No Interruption</h4>
              <p>Continue using your current platforms while earning rewards</p>
            </div>
          </div>
          <div className="benefit">
            <div className="benefit-icon">
              <i className="bi bi-gear-wide-connected"></i>
            </div>
            <div className="benefit-content">
              <h4>Automatic Sync</h4>
              <p>Set it once and forget it - automatic data sharing</p>
            </div>
          </div>
          <div className="benefit">
            <div className="benefit-icon">
              <i className="bi bi-graph-up"></i>
            </div>
            <div className="benefit-content">
              <h4>Enhanced Value</h4>
              <p>Your data contributes to climate science and earns rewards</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EasyOnboardingSection;
