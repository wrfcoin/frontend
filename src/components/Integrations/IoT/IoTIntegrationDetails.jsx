import React, { useState, useEffect } from 'react';
import { WrfBadge } from '../../DesignSystem';
import './IoTIntegrationDetails.css';

const IoTIntegrationDetails = ({ integrationId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [deviceData, setDeviceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({
    activeDevices: 0,
    dataPoints: 0,
    networkUptime: 0,
    signalStrength: 0,
  });

  // Simulated data for IoT integrations
  const integrationDetails = {
    helium: {
      name: 'Helium Network',
      description:
        'Decentralized wireless infrastructure providing LoRaWAN coverage for IoT devices.',
      icon: 'bi-broadcast-pin',
      color: '#474DFF',
      docs: 'https://docs.helium.com/',
      deviceTypes: ['Hotspots', 'IoT Sensors', 'Trackers'],
      protocol: 'LoRaWAN',
      status: 'Connected',
      lastSync: '2 minutes ago',
    },
    aioz: {
      name: 'AIOZ Network',
      description:
        'Decentralized content delivery and edge computing network for IoT video streams.',
      icon: 'bi-camera-video',
      color: '#E91E63',
      docs: 'https://aioz.network/',
      deviceTypes: ['Cameras', 'Video Nodes', 'CDN Nodes'],
      protocol: 'RTMP/HLS',
      status: 'Connected',
      lastSync: '5 minutes ago',
    },
    ttn: {
      name: 'The Things Network',
      description:
        'Global, open LoRaWAN network for low-power IoT devices with community gateways.',
      icon: 'bi-wifi',
      color: '#0D47A1',
      docs: 'https://www.thethingsnetwork.org/docs/',
      deviceTypes: ['LoRaWAN Devices', 'Gateways', 'Sensors'],
      protocol: 'LoRaWAN',
      status: 'Sync Required',
      lastSync: '3 days ago',
    },
    foam: {
      name: 'FOAM Protocol',
      description:
        'Geospatial blockchain protocol for location verification of IoT and physical assets.',
      icon: 'bi-geo-alt',
      color: '#4CAF50',
      docs: 'https://foam.space/',
      deviceTypes: ['Location Beacons', 'GPS Anchors', 'Asset Trackers'],
      protocol: 'Proof of Location',
      status: 'Connected',
      lastSync: '20 minutes ago',
    },
    ogc: {
      name: 'OGC SensorThings',
      description:
        'Open Geospatial Consortium standard for IoT sensors and observations.',
      icon: 'bi-globe-americas',
      color: '#FF9800',
      docs: 'https://www.ogc.org/standards/sensorthings',
      deviceTypes: [
        'Environmental Sensors',
        'Geographic Information Systems',
        'Weather Stations',
      ],
      protocol: 'SensorThings API',
      status: 'Update Available',
      lastSync: '1 hour ago',
    },
    streamr: {
      name: 'Streamr Network',
      description:
        'Decentralized real-time data network for IoT data streams and machine-to-machine communication.',
      icon: 'bi-reception-4',
      color: '#2196F3',
      docs: 'https://streamr.network/docs/',
      deviceTypes: ['Data Publishers', 'Stream Subscribers', 'Edge Nodes'],
      protocol: 'MQTT/WebSocket',
      status: 'Connected',
      lastSync: '15 minutes ago',
    },
    iota: {
      name: 'IOTA Tangle',
      description:
        'Distributed ledger for the Internet of Things designed for fee-less microtransactions.',
      icon: 'bi-diagram-2',
      color: '#00BCD4',
      docs: 'https://wiki.iota.org/',
      deviceTypes: ['IOTA Nodes', 'MAM Channels', 'Smart Sensors'],
      protocol: 'Tangle',
      status: 'Connected',
      lastSync: '10 minutes ago',
    },
    arduino: {
      name: 'Arduino IoT Cloud',
      description:
        'Cloud platform for managing Arduino IoT devices and their data.',
      icon: 'bi-motherboard',
      color: '#009688',
      docs: 'https://docs.arduino.cc/arduino-cloud/',
      deviceTypes: ['Arduino Boards', 'ESP32', 'MKR Family'],
      protocol: 'MQTT/REST',
      status: 'Configuration Required',
      lastSync: 'Never',
    },
    esp32: {
      name: 'ESP32 Weather Network',
      description:
        'Custom ESP32-based network of weather stations for the Wrfcoin ecosystem.',
      icon: 'bi-cpu-fill',
      color: '#795548',
      docs: 'https://docs.espressif.com/',
      deviceTypes: ['Weather Stations', 'Air Quality Monitors', 'Soil Sensors'],
      protocol: 'MQTT/CoAP',
      status: 'Update Available',
      lastSync: '2 hours ago',
    },
    sigfox: {
      name: 'Sigfox LPWAN',
      description:
        'Ultra-low power wide area network for IoT devices with global 0G connectivity.',
      icon: 'bi-broadcast',
      color: '#FF5722',
      docs: 'https://build.sigfox.com/',
      deviceTypes: ['LPWAN Sensors', 'Battery Devices', 'Asset Trackers'],
      protocol: '0G Network',
      status: 'Connected',
      lastSync: '45 minutes ago',
    },
  };

  const mockNotifications = [
    {
      id: 1,
      integration: 'helium',
      title: 'New Hotspot Detected',
      message:
        'A new Helium hotspot was detected in your area. Would you like to connect?',
      timestamp: '2025-05-18T23:15:32Z',
      read: false,
      priority: 'medium',
    },
    {
      id: 2,
      integration: 'ttn',
      title: 'Gateway Sync Required',
      message:
        'Your TTN gateway requires synchronization. Last sync was 3 days ago.',
      timestamp: '2025-05-18T22:05:12Z',
      read: false,
      priority: 'high',
    },
    {
      id: 3,
      integration: 'esp32',
      title: 'Firmware Update Available',
      message:
        'ESP32 Weather Station firmware v2.3.0 is available with new calibration features.',
      timestamp: '2025-05-18T18:42:57Z',
      read: false,
      priority: 'medium',
    },
    {
      id: 4,
      integration: 'ogc',
      title: 'OGC Compliance Update',
      message:
        'Your weather station data now meets OGC SensorThings API compliance requirements.',
      timestamp: '2025-05-18T14:22:10Z',
      read: false,
      priority: 'low',
    },
    {
      id: 5,
      integration: 'arduino',
      title: 'Arduino Configuration Needed',
      message:
        'Complete your Arduino IoT Cloud configuration to start receiving data.',
      timestamp: '2025-05-17T09:15:45Z',
      read: false,
      priority: 'high',
    },
    {
      id: 6,
      integration: 'foam',
      title: 'FOAM Protocol Verification',
      message: 'Your location beacon has been verified on the FOAM Protocol.',
      timestamp: '2025-05-17T08:30:22Z',
      read: false,
      priority: 'medium',
    },
    {
      id: 7,
      integration: 'sigfox',
      title: 'Sigfox Message Sent',
      message:
        'Your LPWAN device successfully transmitted data via Sigfox network.',
      timestamp: '2025-05-18T20:15:30Z',
      read: false,
      priority: 'low',
    },
  ];

  // Mock device data
  const mockDeviceData = [
    {
      id: 'dev001',
      name: 'Helium Hotspot Alpha',
      type: 'Hotspot',
      status: 'Online',
      lastSeen: '2 minutes ago',
      signal: 87,
      battery: null,
      location: 'Building A',
      integration: 'helium',
    },
    {
      id: 'dev002',
      name: 'Weather Station 1',
      type: 'Weather Sensor',
      status: 'Online',
      lastSeen: '5 minutes ago',
      signal: 92,
      battery: 78,
      location: 'Rooftop',
      integration: 'esp32',
    },
    {
      id: 'dev003',
      name: 'Air Quality Monitor',
      type: 'Environmental',
      status: 'Online',
      lastSeen: '15 minutes ago',
      signal: 76,
      battery: 65,
      location: 'Outdoor',
      integration: 'ogc',
    },
    {
      id: 'dev004',
      name: 'TTN Gateway Beta',
      type: 'Gateway',
      status: 'Offline',
      lastSeen: '3 days ago',
      signal: 0,
      battery: null,
      location: 'Server Room',
      integration: 'ttn',
    },
    {
      id: 'dev005',
      name: 'FOAM Location Beacon',
      type: 'Beacon',
      status: 'Online',
      lastSeen: '20 minutes ago',
      signal: 81,
      battery: 92,
      location: 'Parking Lot',
      integration: 'foam',
    },
    {
      id: 'dev006',
      name: 'Streamr Edge Node',
      type: 'Data Node',
      status: 'Online',
      lastSeen: '12 minutes ago',
      signal: 95,
      battery: null,
      location: 'Network Closet',
      integration: 'streamr',
    },
    {
      id: 'dev007',
      name: 'AIOZ Camera Feed',
      type: 'Camera',
      status: 'Online',
      lastSeen: '7 minutes ago',
      signal: 88,
      battery: null,
      location: 'Entrance',
      integration: 'aioz',
    },
    {
      id: 'dev008',
      name: 'Arduino Soil Monitor',
      type: 'Soil Sensor',
      status: 'Not Configured',
      lastSeen: 'Never',
      signal: 0,
      battery: 100,
      location: 'Garden',
      integration: 'arduino',
    },
    {
      id: 'dev009',
      name: 'Sigfox Tracker',
      type: 'LPWAN Device',
      status: 'Online',
      lastSeen: '45 minutes ago',
      signal: 73,
      battery: 85,
      location: 'Remote Site',
      integration: 'sigfox',
    },
  ];

  // Simulated stats based on device data
  const calculateStats = devices => {
    const active = devices.filter(d => d.status === 'Online').length;
    const avgSignal =
      devices.filter(d => d.signal > 0).reduce((sum, d) => sum + d.signal, 0) /
      (devices.filter(d => d.signal > 0).length || 1);

    return {
      activeDevices: active,
      totalDevices: devices.length,
      onlinePercentage: Math.round((active / devices.length) * 100),
      dataPoints: Math.floor(Math.random() * 10000) + 5000,
      networkUptime: 99.7,
      signalStrength: Math.round(avgSignal),
    };
  };

  // Load data based on selected integration
  useEffect(() => {
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      const relevantDevices = integrationId
        ? mockDeviceData.filter(d => d.integration === integrationId)
        : mockDeviceData;

      const relevantNotifications = integrationId
        ? mockNotifications.filter(n => n.integration === integrationId)
        : mockNotifications;

      setDeviceData(relevantDevices);
      setNotifications(relevantNotifications);
      setStats(calculateStats(relevantDevices));
      setLoading(false);
    }, 800);
  }, [integrationId]);

  // Mark notification as read
  const markAsRead = notificationId => {
    setNotifications(
      notifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification,
      ),
    );
  };

  // Get details for current integration
  const details = integrationId ? integrationDetails[integrationId] : null;

  if (loading) {
    return (
      <div className="iot-integration-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Loading IoT integration data...</p>
      </div>
    );
  }

  return (
    <div className="iot-integration-container">
      {details ? (
        <>
          <div className="iot-integration-header">
            <div
              className="integration-icon"
              style={{ backgroundColor: details.color }}
            >
              <i className={`bi ${details.icon}`}></i>
            </div>
            <div className="integration-info">
              <h2>{details.name}</h2>
              <p>{details.description}</p>
              <div className="integration-meta">
                <span className="protocol">
                  <i className="bi bi-gear"></i> {details.protocol}
                </span>
                <span
                  className={`status ${details.status.toLowerCase().replace(' ', '-')}`}
                >
                  <i className="bi bi-circle-fill"></i> {details.status}
                </span>
                <span className="last-sync">
                  <i className="bi bi-arrow-repeat"></i> Last synced:{' '}
                  {details.lastSync}
                </span>
              </div>
            </div>
          </div>

          <div className="iot-tabs">
            <button
              className={activeTab === 'overview' ? 'active' : ''}
              onClick={() => setActiveTab('overview')}
            >
              <i className="bi bi-grid"></i> Overview
            </button>
            <button
              className={activeTab === 'devices' ? 'active' : ''}
              onClick={() => setActiveTab('devices')}
            >
              <i className="bi bi-cpu"></i> Devices
              <WrfBadge color="primary">{deviceData.length}</WrfBadge>
            </button>
            <button
              className={activeTab === 'notifications' ? 'active' : ''}
              onClick={() => setActiveTab('notifications')}
            >
              <i className="bi bi-bell"></i> Notifications
              {notifications.filter(n => !n.read).length > 0 && (
                <WrfBadge color="danger">
                  {notifications.filter(n => !n.read).length}
                </WrfBadge>
              )}
            </button>
            <button
              className={activeTab === 'settings' ? 'active' : ''}
              onClick={() => setActiveTab('settings')}
            >
              <i className="bi bi-gear"></i> Settings
            </button>
          </div>

          <div className="iot-content">
            {activeTab === 'overview' && (
              <div className="overview-tab">
                <div className="stats-cards">
                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="bi bi-cpu"></i>
                    </div>
                    <div className="stat-info">
                      <h3>
                        {stats.activeDevices}/{stats.totalDevices}
                      </h3>
                      <p>Devices Online</p>
                    </div>
                    <div className="stat-percentage">
                      <span
                        className={
                          stats.onlinePercentage >= 80
                            ? 'good'
                            : stats.onlinePercentage >= 50
                              ? 'average'
                              : 'poor'
                        }
                      >
                        {stats.onlinePercentage}%
                      </span>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="bi bi-database"></i>
                    </div>
                    <div className="stat-info">
                      <h3>{stats.dataPoints.toLocaleString()}</h3>
                      <p>Data Points Today</p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="bi bi-wifi"></i>
                    </div>
                    <div className="stat-info">
                      <h3>{stats.signalStrength}%</h3>
                      <p>Avg. Signal Strength</p>
                    </div>
                    <div className="stat-percentage">
                      <span
                        className={
                          stats.signalStrength >= 80
                            ? 'good'
                            : stats.signalStrength >= 60
                              ? 'average'
                              : 'poor'
                        }
                      >
                        {stats.signalStrength >= 80
                          ? 'Strong'
                          : stats.signalStrength >= 60
                            ? 'Good'
                            : 'Poor'}
                      </span>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="bi bi-clock-history"></i>
                    </div>
                    <div className="stat-info">
                      <h3>{stats.networkUptime}%</h3>
                      <p>Network Uptime</p>
                    </div>
                    <div className="stat-percentage">
                      <span
                        className={
                          stats.networkUptime >= 99
                            ? 'good'
                            : stats.networkUptime >= 95
                              ? 'average'
                              : 'poor'
                        }
                      >
                        {stats.networkUptime >= 99
                          ? 'Excellent'
                          : stats.networkUptime >= 95
                            ? 'Good'
                            : 'Poor'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="device-types">
                  <h3>Supported Device Types</h3>
                  <div className="device-type-tags">
                    {details.deviceTypes.map((type, index) => (
                      <span key={index} className="device-type-tag">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="quick-actions">
                  <h3>Quick Actions</h3>
                  <div className="actions-buttons">
                    <button className="action-button">
                      <i className="bi bi-plus-circle"></i>
                      Add New Device
                    </button>
                    <button className="action-button">
                      <i className="bi bi-arrow-clockwise"></i>
                      Sync Network
                    </button>
                    <button className="action-button">
                      <i className="bi bi-graph-up"></i>
                      View Analytics
                    </button>
                    <button className="action-button">
                      <i className="bi bi-book"></i>
                      Documentation
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'devices' && (
              <div className="devices-tab">
                <div className="devices-header">
                  <h3>Connected Devices</h3>
                  <button className="refresh-button">
                    <i className="bi bi-arrow-clockwise"></i> Refresh
                  </button>
                </div>
                <div className="devices-table-container">
                  <table className="devices-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Signal</th>
                        <th>Battery</th>
                        <th>Last Seen</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deviceData.map(device => (
                        <tr
                          key={device.id}
                          className={device.status.toLowerCase()}
                        >
                          <td>
                            <div className="device-name">
                              <span className="name">{device.name}</span>
                              <span className="id">{device.id}</span>
                            </div>
                          </td>
                          <td>{device.type}</td>
                          <td>
                            <span
                              className={`status-badge ${device.status.toLowerCase().replace(' ', '-')}`}
                            >
                              {device.status}
                            </span>
                          </td>
                          <td>
                            {device.status === 'Online' ? (
                              <div className="signal-strength">
                                <div
                                  className="signal-bar"
                                  style={{ width: `${device.signal}%` }}
                                ></div>
                                <span>{device.signal}%</span>
                              </div>
                            ) : (
                              <span>-</span>
                            )}
                          </td>
                          <td>
                            {device.battery ? (
                              <div className="battery-level">
                                <div
                                  className={`battery-indicator ${device.battery > 70 ? 'good' : device.battery > 30 ? 'medium' : 'low'}`}
                                  style={{ width: `${device.battery}%` }}
                                ></div>
                                <span>{device.battery}%</span>
                              </div>
                            ) : (
                              <span>N/A</span>
                            )}
                          </td>
                          <td>{device.lastSeen}</td>
                          <td>
                            <div className="device-actions">
                              <button className="device-action-btn">
                                <i className="bi bi-gear"></i>
                              </button>
                              <button className="device-action-btn">
                                <i className="bi bi-graph-up"></i>
                              </button>
                              <button className="device-action-btn">
                                <i className="bi bi-three-dots-vertical"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="notifications-tab">
                <div className="notifications-header">
                  <h3>Notifications</h3>
                  <button className="mark-all-read">
                    <i className="bi bi-check-all"></i> Mark All Read
                  </button>
                </div>

                {notifications.length === 0 ? (
                  <div className="no-notifications">
                    <i className="bi bi-bell-slash"></i>
                    <p>No notifications found</p>
                  </div>
                ) : (
                  <div className="notifications-list">
                    {notifications.map(notification => (
                      <div
                        key={notification.id}
                        className={`notification-item ${notification.read ? 'read' : 'unread'} priority-${notification.priority}`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="notification-icon">
                          <i
                            className={`bi ${integrationDetails[notification.integration]?.icon || 'bi-bell'}`}
                          ></i>
                        </div>
                        <div className="notification-content">
                          <div className="notification-title">
                            {notification.title}
                            {!notification.read && (
                              <span className="unread-badge"></span>
                            )}
                          </div>
                          <div className="notification-message">
                            {notification.message}
                          </div>
                          <div className="notification-meta">
                            <span className="notification-time">
                              {new Date(
                                notification.timestamp,
                              ).toLocaleString()}
                            </span>
                            <span
                              className={`priority-tag priority-${notification.priority}`}
                            >
                              {notification.priority.charAt(0).toUpperCase() +
                                notification.priority.slice(1)}{' '}
                              Priority
                            </span>
                          </div>
                        </div>
                        <div className="notification-actions">
                          <button className="notification-action-btn">
                            <i className="bi bi-check"></i>
                          </button>
                          <button className="notification-action-btn">
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="settings-tab">
                <h3>Integration Settings</h3>

                <div className="settings-section">
                  <h4>Connection Settings</h4>
                  <div className="settings-form">
                    <div className="form-group">
                      <label>API Key</label>
                      <div className="api-key-field">
                        <input
                          type="password"
                          value="••••••••••••••••••••••••"
                          readOnly
                        />
                        <button className="show-key-btn">
                          <i className="bi bi-eye"></i>
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Endpoint URL</label>
                      <input
                        type="text"
                        value={`https://api.${integrationId}.io/v1`}
                        readOnly
                      />
                    </div>

                    <div className="form-group">
                      <label>Sync Frequency</label>
                      <select defaultValue="15">
                        <option value="5">Every 5 minutes</option>
                        <option value="15">Every 15 minutes</option>
                        <option value="30">Every 30 minutes</option>
                        <option value="60">Every hour</option>
                      </select>
                    </div>

                    <div className="settings-actions">
                      <button className="test-connection-btn">
                        <i className="bi bi-lightning-charge"></i> Test
                        Connection
                      </button>
                      <button className="save-settings-btn">
                        <i className="bi bi-save"></i> Save Settings
                      </button>
                    </div>
                  </div>
                </div>

                <div className="settings-section">
                  <h4>Notification Preferences</h4>
                  <div className="settings-form">
                    <div className="toggle-option">
                      <span>Device Status Updates</span>
                      <label className="toggle-switch">
                        <input type="checkbox" defaultChecked />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="toggle-option">
                      <span>Firmware Updates</span>
                      <label className="toggle-switch">
                        <input type="checkbox" defaultChecked />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="toggle-option">
                      <span>Network Alerts</span>
                      <label className="toggle-switch">
                        <input type="checkbox" defaultChecked />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="toggle-option">
                      <span>Data Anomalies</span>
                      <label className="toggle-switch">
                        <input type="checkbox" defaultChecked />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="settings-section">
                  <h4>Advanced Options</h4>
                  <div className="settings-form">
                    <div className="form-group">
                      <label>Data Retention</label>
                      <select defaultValue="90">
                        <option value="30">30 days</option>
                        <option value="60">60 days</option>
                        <option value="90">90 days</option>
                        <option value="180">180 days</option>
                        <option value="365">1 year</option>
                      </select>
                    </div>

                    <div className="danger-zone">
                      <h5>Danger Zone</h5>
                      <button className="reset-integration-btn">
                        <i className="bi bi-arrow-counterclockwise"></i> Reset
                        Integration
                      </button>
                      <button className="disconnect-btn">
                        <i className="bi bi-x-circle"></i> Disconnect{' '}
                        {details.name}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="no-integration-selected">
          <i className="bi bi-diagram-3"></i>
          <h3>Select an IoT Integration</h3>
          <p>Choose an integration from the grid to view details</p>
        </div>
      )}
    </div>
  );
};

export default IoTIntegrationDetails;
