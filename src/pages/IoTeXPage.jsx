import React from 'react';
import { WrfSelect } from '../components/DesignSystem';
import '../styles/iotex.css';

/**
 * IoTeX Integration Page for Wrfcoin
 *
 * This page showcases the integration with IoTeX technologies:
 * 1. W3bstream for secure weather data collection
 * 2. Device attestation for weather stations
 * 3. Cross-chain functionality
 */
const IoTeXPage = () => {
  return (
    <div className="iotex-page-container">
      <div className="iotex-header">
        <h2>IoTeX Integration</h2>
        <p className="description">
          Wrfcoin integrates with IoTeX technologies to enhance the security and
          reliability of weather data collection and IoT devices across the
          network.
        </p>
      </div>

      <div className="info-alert">
        <div className="alert-icon">
          <i className="bi bi-info-circle"></i>
        </div>
        <div className="alert-content">
          <h4>Technology Preview</h4>
          <p>
            This integration is currently in preview. Some features might be
            limited or unavailable.
          </p>
        </div>
      </div>

      <div className="iotex-device-manager">
        <div className="device-manager-header">
          <h3>IoTeX W3bstream Integration</h3>
          <button className="refresh-button">
            <i className="bi bi-arrow-clockwise"></i> Refresh Devices
          </button>
        </div>

        <div className="tabs">
          <div className="tab active">Device Management</div>
          <div className="tab">Weather Data Submission</div>
        </div>

        <div className="tab-content">
          <div className="device-table-container">
            <table className="device-table">
              <thead>
                <tr>
                  <th>Device ID</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Attestation Status</th>
                  <th>Last Seen</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Sample-Device-001</td>
                  <td>Weather Station Alpha</td>
                  <td>
                    <span className="tag tag-blue">WEATHER_STATION</span>
                  </td>
                  <td>
                    <span className="tag tag-pending">
                      <i className="bi bi-arrow-repeat"></i> Pending
                    </span>
                  </td>
                  <td>Never</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-sm">Attest</button>
                      <button className="btn-sm">Check Status</button>
                      <button className="btn-sm primary">Submit Data</button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>Sample-Device-002</td>
                  <td>Air Quality Monitor</td>
                  <td>
                    <span className="tag tag-blue">AIR_QUALITY_MONITOR</span>
                  </td>
                  <td>
                    <span className="tag tag-success">
                      <i className="bi bi-check-circle"></i> Attested
                    </span>
                  </td>
                  <td>2025-05-17 08:30:12</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-sm" disabled>
                        Attest
                      </button>
                      <button className="btn-sm">Check Status</button>
                      <button className="btn-sm primary">Submit Data</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="register-device-section">
            <h3>Register New Device</h3>
            <div className="form-row">
              <input
                type="text"
                placeholder="Device ID"
                className="form-input"
              />
              <input
                type="text"
                placeholder="Device Name"
                className="form-input"
              />
              <WrfSelect
                options={[
                  { value: 'WEATHER_STATION', label: 'Weather Station' },
                  { value: 'AIR_QUALITY_MONITOR', label: 'Air Quality Monitor' },
                  { value: 'TEMPERATURE_SENSOR', label: 'Temperature Sensor' },
                  { value: 'WIND_SENSOR', label: 'Wind Sensor' },
                  { value: 'RAINFALL_SENSOR', label: 'Rainfall Sensor' },
                ]}
              />
              <input
                type="text"
                placeholder="Latitude"
                className="form-input"
              />
              <input
                type="text"
                placeholder="Longitude"
                className="form-input"
              />
            </div>
            <div className="form-row">
              <WrfSelect
                options={[
                  { value: 'TEE', label: 'Trusted Execution Environment (TEE)' },
                  { value: 'TPM', label: 'Trusted Platform Module (TPM)' },
                  { value: 'SE', label: 'Secure Element' },
                  { value: 'ISA', label: 'IoTeX Sovereign Attestation' },
                ]}
              />
              <button className="primary-button">
                <i className="bi bi-plus"></i> Register Device
              </button>
            </div>
          </div>
        </div>
      </div>

      <hr className="divider" />

      <div className="feature-cards">
        <div className="feature-card">
          <h3>W3bstream Integration</h3>
          <p>
            <strong>Secure Data Collection</strong>
          </p>
          <p>
            W3bstream acts as a middleware between IoT devices and the
            blockchain, providing data integrity guarantees through
            cryptographic proofs and off-chain verification.
          </p>
          <ul>
            <li>Verified data submissions</li>
            <li>Tamper-proof storage</li>
            <li>Optimized for IoT devices</li>
          </ul>
        </div>

        <div className="feature-card">
          <h3>Device Attestation</h3>
          <p>
            <strong>Hardware-Based Trust</strong>
          </p>
          <p>
            IoTeX's device attestation protocol ensures that weather stations
            and IoT devices are genuine, unmodified, and running trusted
            firmware before their data is accepted.
          </p>
          <ul>
            <li>TEE (Trusted Execution Environment)</li>
            <li>TPM (Trusted Platform Module)</li>
            <li>Multi-factor attestation</li>
          </ul>
        </div>

        <div className="feature-card">
          <h3>Cross-Chain Technology</h3>
          <p>
            <strong>Blockchain Interoperability</strong>
          </p>
          <p>
            IoTeX's cross-chain technology enables Wrfcoin to interact with
            other blockchains, expanding the reach and utility of weather data
            and computational resources.
          </p>
          <ul>
            <li>IoTeX mainnet integration</li>
            <li>Cross-chain data transfer</li>
            <li>Multi-chain smart contracts</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default IoTeXPage;
