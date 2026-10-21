import React, { useState, useEffect } from 'react';
import WeatherUndergroundCard from './WeatherUndergroundCard';
import CWOPCard from './CWOPCard';
import AmbientWeatherCard from './AmbientWeatherCard';
import WeatherBugCard from './WeatherBugCard';
import OpenAQCard from './OpenAQCard';
import SensorCommunityCard from './SensorCommunityCard';
import './DataDeviceIntegrationsHub.css';

/**
 * Data and Device Integrations Hub
 * Showcases easy onboarding for users already sharing weather data
 */
const DataDeviceIntegrationsHub = () => {
  const [activeCategory, setActiveCategory] = useState('weather-stations');
  const [selectedIntegration, setSelectedIntegration] = useState(null);

  const categories = {
    'weather-stations': {
      name: 'Weather Stations',
      description: 'Connect your existing weather station to earn WRF tokens',
      icon: 'bi-thermometer-half',
      integrations: [
        {
          id: 'weather-underground',
          component: WeatherUndergroundCard,
          priority: 'high',
        },
        {
          id: 'ambient-weather',
          component: AmbientWeatherCard,
          priority: 'high',
        },
        { id: 'cwop', component: CWOPCard, priority: 'high' },
        { id: 'weatherbug', component: WeatherBugCard, priority: 'medium' },
      ],
    },
    'air-quality': {
      name: 'Air Quality Networks',
      description: 'Share air quality data and earn rewards',
      icon: 'bi-lungs',
      integrations: [
        { id: 'openaq', component: OpenAQCard, priority: 'high' },
        {
          id: 'sensor-community',
          component: SensorCommunityCard,
          priority: 'high',
        },
      ],
    },
    'iot-devices': {
      name: 'IoT Devices',
      description: 'Connect smart sensors and IoT devices',
      icon: 'bi-cpu',
      integrations: [],
    },
  };

  const renderIntegrationCard = integration => {
    const Component = integration.component;
    return (
      <Component
        key={integration.id}
        onClick={() => setSelectedIntegration(integration.id)}
        isActive={selectedIntegration === integration.id}
      />
    );
  };

  return (
    <div className="data-device-integrations-hub">
      <div className="hub-header">
        <h2>Data & Device Integrations</h2>
        <p className="hub-subtitle">
          Already sharing weather data? Connect your existing stations and
          sensors to start earning WRF tokens immediately.
        </p>
      </div>

      <div className="quick-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="bi bi-people"></i>
          </div>
          <div className="stat-content">
            <h3>450,000+</h3>
            <p>Existing Weather Stations</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="bi bi-clock"></i>
          </div>
          <div className="stat-content">
            <h3>{'< 5 minutes'}</h3>
            <p>Average Setup Time</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="bi bi-coin"></i>
          </div>
          <div className="stat-content">
            <h3>0.1-1.0 WRF</h3>
            <p>Earning Potential/Hour</p>
          </div>
        </div>
      </div>

      <div className="category-tabs">
        {Object.entries(categories).map(([categoryId, category]) => (
          <button
            key={categoryId}
            className={`category-tab ${activeCategory === categoryId ? 'active' : ''}`}
            onClick={() => setActiveCategory(categoryId)}
          >
            <i className={category.icon}></i>
            <span>{category.name}</span>
          </button>
        ))}
      </div>

      <div className="category-content">
        <div className="category-header">
          <h3>{categories[activeCategory].name}</h3>
          <p>{categories[activeCategory].description}</p>
        </div>

        <div className="integrations-grid">
          {categories[activeCategory].integrations.map(renderIntegrationCard)}
        </div>

        {categories[activeCategory].integrations.length === 0 && (
          <div className="coming-soon">
            <i className="bi bi-tools"></i>
            <h4>Coming Soon</h4>
            <p>
              IoT device integrations are currently in development. Check back
              soon!
            </p>
          </div>
        )}
      </div>

      <div className="onboarding-cta">
        <div className="cta-content">
          <h3>Ready to Start Earning?</h3>
          <p>
            Choose any of the integrations above to connect your existing
            weather data sharing setup with Wrfcoin. You'll continue sharing
            with your current platforms while also earning WRF tokens for the
            same data.
          </p>
          <button className="cta-button">
            <i className="bi bi-rocket"></i>
            <span>Get Started Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataDeviceIntegrationsHub;
