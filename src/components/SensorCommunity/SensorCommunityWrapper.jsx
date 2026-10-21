import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';

// SensorCommunity API wrapper component
const SensorCommunityWrapper = ({ children, bounds, limit }) => {
  const [sensors, setSensors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const getSensorsInArea = (boundsParam, limitParam) => {
    return apiClient.get('/sensor-community/sensors', { bounds: boundsParam, limit: limitParam })
      .then((data) => Array.isArray(data) ? data : (data.sensors ?? []));
  };

  const getSensorData = (sensorId) => {
    return apiClient.get(`/sensor-community/sensors/${sensorId}/reading`)
      .then((data) => data.reading ?? data);
  };

  const getSensorHistory = (sensorId) => {
    return apiClient.get(`/sensor-community/sensors/${sensorId}/history`)
      .then((data) => Array.isArray(data) ? data : (data.history ?? []));
  };

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    apiClient.get('/sensor-community/sensors', { bounds, limit })
      .then((data) => {
        setSensors(Array.isArray(data) ? data : (data.sensors ?? []));
        setIsLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Error fetching sensors');
        setIsLoading(false);
      });
  }, [bounds, limit]);

  // Context value with live sensors and API methods
  const contextValue = {
    sensors,
    isLoading,
    error,
    getSensorData,
    getSensorHistory,
    getSensorsInArea,
  };

  // Check if children is provided and is a valid React element
  if (React.isValidElement(children)) {
    return React.cloneElement(children, { sensorCommunity: contextValue });
  }

  // If children is a function (render prop pattern)
  if (typeof children === 'function') {
    return children({ sensorCommunity: contextValue });
  }

  // Fallback when no children are provided
  return (
    <div className="sensor-community-wrapper">
      {isLoading ? (
        <div>Loading sensor data...</div>
      ) : error ? (
        <div>Error: {error}</div>
      ) : (
        <div className="sensor-data-preview">
          <h3>Sensor Data Available</h3>
          <p>{sensors.length} sensors found</p>
        </div>
      )}
    </div>
  );
};

export default SensorCommunityWrapper;
