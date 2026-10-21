import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import StatusBadge from '../common/StatusBadge';
import InfoBox from '../common/InfoBox';
import { WrfButton } from '../DesignSystem';
import { useIntegrations } from '../../contexts/IntegrationsContext';

/**
 * Helium Integration Card Component
 *
 * Displays information about the Helium Network integration
 * which provides IoT device connectivity and data collection
 */
const HeliumCard = () => {
  const [status, setStatus] = useState('connecting');
  const [deviceCount, setDeviceCount] = useState(0);
  const [hotspotCount, setHotspotCount] = useState(0);
  const [dcBalance, setDcBalance] = useState(0);
  const { integrations } = useIntegrations();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if integration is enabled in the context
    const heliumEnabled = integrations?.iot?.items?.helium?.enabled;

    // Simulate loading data
    const timer = setTimeout(() => {
      setStatus('active');
      setDeviceCount(32);
      setHotspotCount(5);
      setDcBalance(250000);
    }, 1500);

    return () => clearTimeout(timer);
  }, [integrations]);

  return (
    <div className="integration-detail">
      <div className="integration-header">
        <i className="bi bi-broadcast-pin"></i>
        <div className="integration-header-content">
          <h2>Helium Network</h2>
          <p>
            IoT device connectivity and data collection network, focused on
            weather stations and environmental sensors
          </p>
          <StatusBadge status={status} />
        </div>
      </div>

      <div className="integration-description">
        <p>
          Helium Network provides long-range, low-power connectivity for
          Internet of Things (IoT) devices, particularly useful for remote
          weather stations and environmental sensors. The Wrfcoin integration
          with Helium enables secure data collection from distributed sensor
          networks.
        </p>
      </div>

      <div className="integration-stats">
        <div className="stats-container">
          <div className="stat-item">
            <i className="bi bi-device-hdd"></i>
            <div className="stat-content">
              <div className="stat-value">{deviceCount}</div>
              <div className="stat-label">Connected Devices</div>
            </div>
          </div>
          <div className="stat-item">
            <i className="bi bi-broadcast"></i>
            <div className="stat-content">
              <div className="stat-value">{hotspotCount}</div>
              <div className="stat-label">Registered Hotspots</div>
            </div>
          </div>
          <div className="stat-item">
            <i className="bi bi-currency-exchange"></i>
            <div className="stat-content">
              <div className="stat-value">{dcBalance.toLocaleString()}</div>
              <div className="stat-label">Data Credits Balance</div>
            </div>
          </div>
        </div>
      </div>

      <div className="integration-actions">
        <WrfButton
          variant="primary"
          onClick={() => navigate('/sensor-data')}
        >
          <i className="bi bi-graph-up"></i> View Sensor Data
        </WrfButton>
        <WrfButton variant="outlined">
          <i className="bi bi-plus-lg"></i> Register New Device
        </WrfButton>
        <WrfButton variant="outlined">
          <i className="bi bi-gear"></i> Configure
        </WrfButton>
      </div>

      <InfoBox
        type="info"
        title="Helium Network Integration"
        content="This integration uses the Helium Network API to communicate with Wrfcoin-compatible weather stations and environmental sensors. Data is collected, validated, and stored in the Wrfcoin blockchain."
      />

      <h3>Device Types</h3>
      <div className="device-types">
        <div className="device-type-card">
          <div className="device-type-icon">
            <i className="bi bi-cloud-haze2"></i>
          </div>
          <div className="device-type-name">Weather Stations</div>
          <div className="device-type-count">24 Active</div>
        </div>
        <div className="device-type-card">
          <div className="device-type-icon">
            <i className="bi bi-droplet"></i>
          </div>
          <div className="device-type-name">Precipitation Sensors</div>
          <div className="device-type-count">18 Active</div>
        </div>
        <div className="device-type-card">
          <div className="device-type-icon">
            <i className="bi bi-wind"></i>
          </div>
          <div className="device-type-name">Air Quality Monitors</div>
          <div className="device-type-count">12 Active</div>
        </div>
      </div>
    </div>
  );
};

export default HeliumCard;
