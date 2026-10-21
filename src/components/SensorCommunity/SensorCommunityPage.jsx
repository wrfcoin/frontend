import React, { useState } from 'react';
import SensorCommunityWrapper from './SensorCommunityWrapper';
import './SensorCommunityPage.css';

const SensorCommunityPage = () => {
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Set default bounds for the sensor search
  const defaultBounds = {
    north: 50,
    south: 30,
    east: -60,
    west: -130,
  };

  // Function to handle sensor selection
  const handleSensorSelect = async (sensor, getSensorHistory) => {
    setSelectedSensor(sensor);
    setIsLoadingHistory(true);

    try {
      const history = await getSensorHistory(sensor.id);
      setHistoricalData(history);
    } catch (error) {
      console.error('Error fetching sensor history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Function to render the sensor list
  const renderSensorList = (sensors, getSensorHistory) => {
    if (!sensors || sensors.length === 0) {
      return <p>No sensors found in this area.</p>;
    }

    return (
      <div className="sensor-list">
        <h3>Available Sensors</h3>
        <div className="sensor-cards">
          {sensors.map(sensor => (
            <div
              key={sensor.id}
              className={`sensor-card ${selectedSensor?.id === sensor.id ? 'selected' : ''}`}
              onClick={() => handleSensorSelect(sensor, getSensorHistory)}
            >
              <h4>{sensor.name}</h4>
              <p>
                <strong>ID:</strong> {sensor.id}
              </p>
              <p>
                <strong>Location:</strong> {sensor.location.latitude.toFixed(4)}
                , {sensor.location.longitude.toFixed(4)}
              </p>
              <p>
                <strong>Data Types:</strong> {sensor.dataTypes.join(', ')}
              </p>
              <div className="sensor-card-footer">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleSensorSelect(sensor, getSensorHistory);
                  }}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Function to render sensor detail view
  const renderSensorDetail = (sensor, historicalData, isLoadingHistory) => {
    if (!sensor) {
      return (
        <div className="sensor-detail-placeholder">
          <p>Select a sensor to view details</p>
        </div>
      );
    }

    return (
      <div className="sensor-detail">
        <h3>{sensor.name} Details</h3>

        <div className="sensor-info">
          <div className="info-block">
            <h4>Sensor Information</h4>
            <p>
              <strong>ID:</strong> {sensor.id}
            </p>
            <p>
              <strong>Location:</strong> {sensor.location.latitude.toFixed(6)},{' '}
              {sensor.location.longitude.toFixed(6)}
            </p>
            <p>
              <strong>Altitude:</strong> {sensor.location.altitude}m
            </p>
            <p>
              <strong>Data Types:</strong> {sensor.dataTypes.join(', ')}
            </p>
          </div>

          <div className="info-block">
            <h4>Latest Reading</h4>
            <p>
              <strong>Timestamp:</strong>{' '}
              {new Date(sensor.lastReading.timestamp).toLocaleString()}
            </p>
            {Object.entries(sensor.lastReading)
              .filter(([key]) => key !== 'timestamp')
              .map(([key, value]) => (
                <p key={key}>
                  <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong>{' '}
                  {value.toFixed(2)}
                </p>
              ))}
          </div>
        </div>

        <div className="historical-data">
          <h4>Historical Data</h4>
          {isLoadingHistory ? (
            <p>Loading historical data...</p>
          ) : (
            <>
              {historicalData.length > 0 ? (
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        {Object.keys(historicalData[0])
                          .filter(key => key !== 'timestamp')
                          .map(key => (
                            <th key={key}>
                              {key.charAt(0).toUpperCase() + key.slice(1)}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {historicalData.slice(0, 10).map((reading, index) => (
                        <tr key={index}>
                          <td>
                            {new Date(reading.timestamp).toLocaleString()}
                          </td>
                          {Object.entries(reading)
                            .filter(([key]) => key !== 'timestamp')
                            .map(([key, value]) => (
                              <td key={key}>
                                {typeof value === 'number'
                                  ? value.toFixed(2)
                                  : value}
                              </td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No historical data available</p>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  // Wrap the main content with SensorCommunityWrapper
  return (
    <SensorCommunityWrapper bounds={defaultBounds} limit={10}>
      {({ sensorCommunity }) => (
        <div className="sensor-community-page">
          <div className="page-header">
            <h2>Sensor.Community Integration</h2>
            <p>
              Connect to community-operated air quality and environmental
              sensors
            </p>
          </div>

          <div className="content-container">
            {sensorCommunity.isLoading ? (
              <div className="loading">Loading sensors...</div>
            ) : sensorCommunity.error ? (
              <div className="error">Error: {sensorCommunity.error}</div>
            ) : (
              <div className="sensor-dashboard">
                <div className="sensor-list-container">
                  {renderSensorList(
                    sensorCommunity.sensors,
                    sensorCommunity.getSensorHistory,
                  )}
                </div>
                <div className="sensor-detail-container">
                  {renderSensorDetail(
                    selectedSensor,
                    historicalData,
                    isLoadingHistory,
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </SensorCommunityWrapper>
  );
};

export default SensorCommunityPage;
