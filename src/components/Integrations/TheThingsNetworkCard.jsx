import React, { useState, useEffect } from 'react';
import './IntegrationCards.css';

const TheThingsNetworkCard = () => {
  const [status, setStatus] = useState('connecting');
  const [stats, setStats] = useState(null);
  const [devices, setDevices] = useState([]);
  const [dataStreams, setDataStreams] = useState([]);

  useEffect(() => {
    // Simulate connection to The Things Network API
    const timer = setTimeout(() => {
      setStatus('connected');
      setStats({
        applications: 3,
        gateways: 7,
        devices: 24,
        uplinks: 2874,
        downlinks: 356,
        dataVolume: '5.8MB',
        coverage: '92%',
      });
      setDevices([
        {
          id: 'dev-wx-0394',
          name: 'Weather Station Alpha',
          type: 'LoRaWAN Sensor',
          status: 'active',
          battery: '87%',
          lastSeen: '2 mins ago',
        },
        {
          id: 'dev-wx-0512',
          name: 'Weather Station Beta',
          type: 'LoRaWAN Sensor',
          status: 'active',
          battery: '74%',
          lastSeen: '5 mins ago',
        },
        {
          id: 'dev-wx-0628',
          name: 'Weather Station Gamma',
          type: 'LoRaWAN Sensor',
          status: 'active',
          battery: '92%',
          lastSeen: '1 min ago',
        },
        {
          id: 'dev-air-0733',
          name: 'Air Quality Monitor 1',
          type: 'LoRaWAN Sensor',
          status: 'active',
          battery: '65%',
          lastSeen: '12 mins ago',
        },
        {
          id: 'dev-air-0845',
          name: 'Air Quality Monitor 2',
          type: 'LoRaWAN Sensor',
          status: 'inactive',
          battery: '23%',
          lastSeen: '3 hours ago',
        },
      ]);
      setDataStreams([
        {
          id: 'stream-1',
          deviceId: 'dev-wx-0394',
          type: 'temperature',
          value: '22.4°C',
          timestamp: '2 mins ago',
        },
        {
          id: 'stream-2',
          deviceId: 'dev-wx-0394',
          type: 'humidity',
          value: '78%',
          timestamp: '2 mins ago',
        },
        {
          id: 'stream-3',
          deviceId: 'dev-wx-0394',
          type: 'pressure',
          value: '1013 hPa',
          timestamp: '2 mins ago',
        },
        {
          id: 'stream-4',
          deviceId: 'dev-wx-0394',
          type: 'wind_speed',
          value: '12 km/h',
          timestamp: '2 mins ago',
        },
        {
          id: 'stream-5',
          deviceId: 'dev-wx-0512',
          type: 'temperature',
          value: '24.1°C',
          timestamp: '5 mins ago',
        },
        {
          id: 'stream-6',
          deviceId: 'dev-air-0733',
          type: 'pm25',
          value: '18 µg/m³',
          timestamp: '12 mins ago',
        },
        {
          id: 'stream-7',
          deviceId: 'dev-air-0733',
          type: 'co2',
          value: '412 ppm',
          timestamp: '12 mins ago',
        },
      ]);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleSendCommand = () => {
    setStatus('sending');
    setTimeout(() => {
      setStatus('connected');
      // Update the last seen time for the selected device
      const updatedDevices = devices.map(device =>
        device.id === 'dev-wx-0394'
          ? { ...device, lastSeen: 'just now' }
          : device,
      );
      setDevices(updatedDevices);
    }, 1200);
  };

  return (
    <div className="integration-card">
      <div className="integration-header">
        <h2>The Things Network Integration</h2>
        <div className={`status-indicator ${status}`}>
          {status === 'connecting' && 'Connecting...'}
          {status === 'connected' && 'Connected'}
          {status === 'sending' && 'Sending Command...'}
          {status === 'error' && 'Connection Error'}
        </div>
      </div>

      <div className="integration-content">
        <div className="integration-section">
          <h3>Network Overview</h3>
          <p>
            The Things Network provides a global, open LoRaWAN network for IoT
            devices collecting meteorological and environmental data that feeds
            into Wrfcoin's computational models.
          </p>

          {stats && (
            <div className="ttn-stats">
              <div className="stat-card">
                <div className="stat-title">Applications</div>
                <div className="stat-value">{stats.applications}</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Gateways</div>
                <div className="stat-value">{stats.gateways}</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Devices</div>
                <div className="stat-value">{stats.devices}</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Coverage</div>
                <div className="stat-value">{stats.coverage}</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Uplinks</div>
                <div className="stat-value">{stats.uplinks}</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Downlinks</div>
                <div className="stat-value">{stats.downlinks}</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Data Volume</div>
                <div className="stat-value">{stats.dataVolume}</div>
              </div>
            </div>
          )}
        </div>

        <div className="integration-section">
          <h3>Connected Devices</h3>
          <div className="devices-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Battery</th>
                  <th>Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {devices.map(device => (
                  <tr
                    key={device.id}
                    className={
                      device.status !== 'active' ? 'inactive-device' : ''
                    }
                  >
                    <td>{device.name}</td>
                    <td>{device.type}</td>
                    <td>
                      <span className={`status-badge ${device.status}`}>
                        {device.status}
                      </span>
                    </td>
                    <td>
                      <div className="battery-indicator">
                        <div
                          className="battery-level"
                          style={{ width: device.battery }}
                          data-level={
                            parseInt(device.battery) < 30
                              ? 'low'
                              : parseInt(device.battery) < 60
                                ? 'medium'
                                : 'high'
                          }
                        ></div>
                        <span>{device.battery}</span>
                      </div>
                    </td>
                    <td>{device.lastSeen}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="integration-section">
          <h3>Device Control</h3>
          <div className="device-control-panel">
            <div className="control-form">
              <div className="form-row">
                <label>Device:</label>
                <select>
                  <option value="dev-wx-0394">Weather Station Alpha</option>
                  <option value="dev-wx-0512">Weather Station Beta</option>
                  <option value="dev-wx-0628">Weather Station Gamma</option>
                  <option value="dev-air-0733">Air Quality Monitor 1</option>
                  <option value="dev-air-0845">Air Quality Monitor 2</option>
                </select>
              </div>
              <div className="form-row">
                <label>Command:</label>
                <select>
                  <option value="request_data">Request Data Update</option>
                  <option value="power_save">Enter Power Save Mode</option>
                  <option value="calibrate">Calibrate Sensors</option>
                  <option value="reset">Reset Device</option>
                </select>
              </div>
              <button
                className="send-command-btn"
                onClick={handleSendCommand}
                disabled={status !== 'connected'}
              >
                Send Command
              </button>
            </div>
          </div>
        </div>

        <div className="integration-section">
          <h3>Latest Data Streams</h3>
          <div className="data-streams">
            {dataStreams.map(stream => (
              <div key={stream.id} className="data-stream-item">
                <div className="stream-device">
                  {devices.find(d => d.id === stream.deviceId)?.name ||
                    stream.deviceId}
                </div>
                <div className="stream-type">
                  {stream.type === 'temperature' && 'Temperature'}
                  {stream.type === 'humidity' && 'Humidity'}
                  {stream.type === 'pressure' && 'Pressure'}
                  {stream.type === 'wind_speed' && 'Wind Speed'}
                  {stream.type === 'pm25' && 'PM2.5'}
                  {stream.type === 'co2' && 'CO₂'}
                </div>
                <div className="stream-value">{stream.value}</div>
                <div className="stream-timestamp">{stream.timestamp}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="integration-footer">
        <p>
          The Things Network integration enables Wrfcoin to collect real-time
          meteorological and environmental data from globally distributed IoT
          devices running on LoRaWAN networks.
        </p>
      </div>
    </div>
  );
};

export default TheThingsNetworkCard;
