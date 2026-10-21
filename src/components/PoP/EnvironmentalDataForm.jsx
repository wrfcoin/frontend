/**
 * Environmental Data Submission Form
 *
 * This component provides a form for submitting environmental data to the
 * Proof of Publishing (PoP) consensus mechanism.
 */

import React, { useState } from 'react';
import { popService } from '../../services/popService';
import { POP_ROUTES_SERVED, POP_SUBMISSION_UNAVAILABLE } from '../../services/popRoutes';

// Submissions go to POST /api/pop/submit, which is not served (popRoutes.js).
// The submit control is disabled and says why, and a forced submit sends
// nothing (frontend#354, codex round 15 on #390).
const SUBMISSION_UNAVAILABLE = POP_SUBMISSION_UNAVAILABLE;
import { devLog } from '../../utils/logger';

const environmentalDataTypes = [
  { value: 'AIR_QUALITY', label: 'Air Quality' },
  { value: 'WEATHER', label: 'Weather Data' },
  { value: 'WATER_QUALITY', label: 'Water Quality' },
  { value: 'SOIL', label: 'Soil Data' },
  { value: 'CLIMATE', label: 'Climate Data' },
  { value: 'BIODIVERSITY', label: 'Biodiversity' },
  { value: 'ECOSYSTEM', label: 'Ecosystem' },
];

const deviceTypes = [
  { value: 'WEATHER_STATION', label: 'Weather Station' },
  { value: 'AIR_QUALITY_MONITOR', label: 'Air Quality Monitor' },
  { value: 'WATER_QUALITY_SENSOR', label: 'Water Quality Sensor' },
  { value: 'SOIL_SENSOR', label: 'Soil Sensor' },
  { value: 'CLIMATE_STATION', label: 'Climate Station' },
  { value: 'ECOSYSTEM_MONITOR', label: 'Ecosystem Monitor' },
  { value: 'BIODIVERSITY_SENSOR', label: 'Biodiversity Sensor' },
  { value: 'IOT_GENERIC', label: 'Generic IoT Device' },
];

const maintenanceStatuses = [
  { value: 'OK', label: 'OK - No Issues' },
  { value: 'NEEDS_MAINTENANCE', label: 'Needs Maintenance' },
  { value: 'MAINTENANCE_SCHEDULED', label: 'Maintenance Scheduled' },
  { value: 'UNDER_MAINTENANCE', label: 'Currently Under Maintenance' },
  { value: 'CALIBRATION_REQUIRED', label: 'Calibration Required' },
];

const EnvironmentalDataForm = () => {
  const [formData, setFormData] = useState({
    dataType: 'AIR_QUALITY',
    latitude: '',
    longitude: '',
    elevation: '',
    locationDescription: '',
    measurements: {},
    metadata: {},
    visibility: 'PUBLIC',
    deviceType: 'AIR_QUALITY_MONITOR',
    deviceId: '',
    sensorAccuracy: 0.95,
    firmwareVersion: '',
    maintenanceStatus: 'OK',
    batteryLevel: 100,
    signalStrength: 5,
  });

  const [alertMessage, setAlertMessage] = useState(null);
  const [alertType, setAlertType] = useState(null); // 'success' or 'error'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [measurementFields, setMeasurementFields] = useState([
    { key: '', value: '' },
  ]);

  const [metadataFields, setMetadataFields] = useState([
    { key: '', value: '' },
  ]);

  const showAlert = (message, type) => {
    setAlertMessage(message);
    setAlertType(type);
    setTimeout(() => {
      setAlertMessage(null);
      setAlertType(null);
    }, 5000);
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleMeasurementChange = (index, field, value) => {
    const updatedFields = [...measurementFields];
    updatedFields[index][field] = value;
    setMeasurementFields(updatedFields);

    // Update measurements object
    const measurements = {};
    measurementFields.forEach(item => {
      if (item.key && item.value) {
        measurements[item.key] = item.value;
      }
    });

    setFormData({
      ...formData,
      measurements,
    });
  };

  const handleMetadataChange = (index, field, value) => {
    const updatedFields = [...metadataFields];
    updatedFields[index][field] = value;
    setMetadataFields(updatedFields);

    // Update metadata object
    const metadata = {};
    metadataFields.forEach(item => {
      if (item.key && item.value) {
        metadata[item.key] = item.value;
      }
    });

    setFormData({
      ...formData,
      metadata,
    });
  };

  const addMeasurementField = () => {
    setMeasurementFields([...measurementFields, { key: '', value: '' }]);
  };

  const removeMeasurementField = index => {
    const updatedFields = [...measurementFields];
    updatedFields.splice(index, 1);
    setMeasurementFields(updatedFields);

    // Update measurements object
    const measurements = {};
    updatedFields.forEach(item => {
      if (item.key && item.value) {
        measurements[item.key] = item.value;
      }
    });

    setFormData({
      ...formData,
      measurements,
    });
  };

  const addMetadataField = () => {
    setMetadataFields([...metadataFields, { key: '', value: '' }]);
  };

  const removeMetadataField = index => {
    const updatedFields = [...metadataFields];
    updatedFields.splice(index, 1);
    setMetadataFields(updatedFields);

    // Update metadata object
    const metadata = {};
    updatedFields.forEach(item => {
      if (item.key && item.value) {
        metadata[item.key] = item.value;
      }
    });

    setFormData({
      ...formData,
      metadata,
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!POP_ROUTES_SERVED) {
      showAlert(SUBMISSION_UNAVAILABLE, 'error');
      return;
    }
    setIsSubmitting(true);

    try {
      const result = await popService.submitEnvironmentalData(formData);
      showAlert('Environmental data submitted successfully!', 'success');

      // Reset form
      setFormData({
        dataType: 'AIR_QUALITY',
        latitude: '',
        longitude: '',
        elevation: '',
        locationDescription: '',
        measurements: {},
        metadata: {},
        visibility: 'PUBLIC',
        deviceType: 'AIR_QUALITY_MONITOR',
        deviceId: '',
        sensorAccuracy: 0.95,
        firmwareVersion: '',
        maintenanceStatus: 'OK',
        batteryLevel: 100,
        signalStrength: 5,
      });
      setMeasurementFields([{ key: '', value: '' }]);
      setMetadataFields([{ key: '', value: '' }]);

      devLog('Submission result:', result);
    } catch (error) {
      console.error('Error submitting environmental data:', error);
      showAlert('Failed to submit environmental data', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 !dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white !dark:text-white">
        Submit Environmental Data
      </h2>

      {alertMessage && (
        <div
          className={`p-4 mb-6 rounded-md ${alertType === 'success' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'}`}
        >
          {alertMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300 border-b pb-2">
            Environmental Data Information
          </h3>

          <div className="mb-4">
            <label
              className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2"
              htmlFor="dataType"
            >
              Data Type
            </label>
            <select
              id="dataType"
              name="dataType"
              value={formData.dataType}
              onChange={handleInputChange}
              className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200"
            >
              {environmentalDataTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label
                className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2"
                htmlFor="latitude"
              >
                Latitude
              </label>
              <input
                id="latitude"
                name="latitude"
                type="number"
                step="0.000001"
                value={formData.latitude}
                onChange={handleInputChange}
                placeholder="e.g., 40.7128"
                className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200"
                required
              />
            </div>

            <div>
              <label
                className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2"
                htmlFor="longitude"
              >
                Longitude
              </label>
              <input
                id="longitude"
                name="longitude"
                type="number"
                step="0.000001"
                value={formData.longitude}
                onChange={handleInputChange}
                placeholder="e.g., -74.0060"
                className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2"
              htmlFor="elevation"
            >
              Elevation (meters)
            </label>
            <input
              id="elevation"
              name="elevation"
              type="number"
              value={formData.elevation}
              onChange={handleInputChange}
              placeholder="e.g., 10"
              className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200"
            />
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2"
              htmlFor="locationDescription"
            >
              Location Description
            </label>
            <textarea
              id="locationDescription"
              name="locationDescription"
              value={formData.locationDescription}
              onChange={handleInputChange}
              placeholder="Describe the location in detail"
              className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200"
              rows="3"
            />
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300 border-b pb-2">
            IoT Device Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label
                className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2"
                htmlFor="deviceType"
              >
                Device Type
              </label>
              <select
                id="deviceType"
                name="deviceType"
                value={formData.deviceType}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200"
              >
                {deviceTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2"
                htmlFor="deviceId"
              >
                Device ID
              </label>
              <input
                id="deviceId"
                name="deviceId"
                type="text"
                value={formData.deviceId}
                onChange={handleInputChange}
                placeholder="Unique device identifier"
                className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label
                className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2"
                htmlFor="sensorAccuracy"
              >
                Sensor Accuracy (0-1)
              </label>
              <input
                id="sensorAccuracy"
                name="sensorAccuracy"
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={formData.sensorAccuracy}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200"
              />
            </div>

            <div>
              <label
                className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2"
                htmlFor="firmwareVersion"
              >
                Firmware Version
              </label>
              <input
                id="firmwareVersion"
                name="firmwareVersion"
                type="text"
                value={formData.firmwareVersion}
                onChange={handleInputChange}
                placeholder="e.g., v1.2.3"
                className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label
                className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2"
                htmlFor="maintenanceStatus"
              >
                Maintenance Status
              </label>
              <select
                id="maintenanceStatus"
                name="maintenanceStatus"
                value={formData.maintenanceStatus}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200"
              >
                {maintenanceStatuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2"
                htmlFor="batteryLevel"
              >
                Battery Level (%)
              </label>
              <input
                id="batteryLevel"
                name="batteryLevel"
                type="number"
                min="0"
                max="100"
                value={formData.batteryLevel}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200"
              />
            </div>

            <div>
              <label
                className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2"
                htmlFor="signalStrength"
              >
                Signal Strength (0-5)
              </label>
              <input
                id="signalStrength"
                name="signalStrength"
                type="number"
                min="0"
                max="5"
                value={formData.signalStrength}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200"
              />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300 border-b pb-2">
            Measurements & Metadata
          </h3>

          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2">
              Measurements
            </label>

            {measurementFields.map((field, index) => (
              <div
                key={`measurement-${index}`}
                className="flex items-center mb-2"
              >
                <input
                  type="text"
                  placeholder="Parameter"
                  value={field.key}
                  onChange={e =>
                    handleMeasurementChange(index, 'key', e.target.value)
                  }
                  className="w-1/3 p-3 mr-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={field.value}
                  onChange={e =>
                    handleMeasurementChange(index, 'value', e.target.value)
                  }
                  className="w-1/3 p-3 mr-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200"
                />
                <button
                  type="button"
                  onClick={() => removeMeasurementField(index)}
                  className="p-2 bg-red-500 text-white dark:bg-red-600 rounded-md hover:bg-red-600 dark:hover:bg-red-700"
                >
                  Remove
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addMeasurementField}
              className="mt-2 px-4 py-2 bg-blue-500 text-white dark:bg-blue-600 rounded-md hover:bg-blue-600 dark:hover:bg-blue-700"
            >
              Add Measurement
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2">
              Metadata
            </label>

            {metadataFields.map((field, index) => (
              <div key={`metadata-${index}`} className="flex items-center mb-2">
                <input
                  type="text"
                  placeholder="Key"
                  value={field.key}
                  onChange={e =>
                    handleMetadataChange(index, 'key', e.target.value)
                  }
                  className="w-1/3 p-3 mr-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={field.value}
                  onChange={e =>
                    handleMetadataChange(index, 'value', e.target.value)
                  }
                  className="w-1/3 p-3 mr-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200"
                />
                <button
                  type="button"
                  onClick={() => removeMetadataField(index)}
                  className="p-2 bg-red-500 text-white dark:bg-red-600 rounded-md hover:bg-red-600 dark:hover:bg-red-700"
                >
                  Remove
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addMetadataField}
              className="mt-2 px-4 py-2 bg-blue-500 text-white dark:bg-blue-600 rounded-md hover:bg-blue-600 dark:hover:bg-blue-700"
            >
              Add Metadata
            </button>
          </div>
        </div>

        <div className="mb-6">
          <label
            className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2"
            htmlFor="visibility"
          >
            Data Visibility
          </label>
          <select
            id="visibility"
            name="visibility"
            value={formData.visibility}
            onChange={handleInputChange}
            className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200"
          >
            <option value="PUBLIC">Public</option>
            <option value="PROTECTED">Protected</option>
            <option value="PRIVATE">Private</option>
          </select>
        </div>

        <div className="mt-8">
          <button
            type="submit"
            disabled={!POP_ROUTES_SERVED || isSubmitting}
            title={POP_ROUTES_SERVED ? undefined : SUBMISSION_UNAVAILABLE}
            className={`w-full py-3 px-6 text-white bg-green-600 dark:bg-green-700 rounded-md hover:bg-green-700 dark:hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Environmental Data'}
          </button>
          {!POP_ROUTES_SERVED && (
            <p data-testid="pop-submission-unavailable" className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {SUBMISSION_UNAVAILABLE}
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default EnvironmentalDataForm;
