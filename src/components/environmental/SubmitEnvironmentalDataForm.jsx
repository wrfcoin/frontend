import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import './SubmitEnvironmentalDataForm.css';
import InfoIcon from '../common/InfoIcon';

/**
 * Form component for submitting environmental data through the Proof of Publishing system
 * Enhanced with IoT device support and additional fields
 */
const SubmitEnvironmentalDataForm = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [walletAddress, setWalletAddress] = useState('');

  // Get connected wallet address
  useEffect(() => {
    const fetchWalletAddress = async () => {
      try {
        // This would be replaced with your actual wallet connection logic
        const response = await fetch('/api/wallet/current');
        const data = await response.json();

        if (response.ok && data.address) {
          setWalletAddress(data.address);
        } else {
          // Fallback to example address for development
          setWalletAddress('Wrf1AbCdEfGhIjKlMnOpQrStUvWxYz12345678');
        }
      } catch (error) {
        console.error('Error fetching wallet address:', error);
      }
    };

    fetchWalletAddress();
  }, []);

  // Form state
  const [formData, setFormData] = useState({
    dataType: 'WEATHER',
    measurements: {
      temperature: '',
      humidity: '',
      pressure: '',
      windSpeed: '',
      precipitation: '',
      airQuality: {
        pm25: '',
        pm10: '',
        ozone: '',
        co2: '',
        no2: '',
        so2: '',
        co: '',
      },
      waterQuality: {
        ph: '',
        dissolvedOxygen: '',
        turbidity: '',
        nitrates: '',
        phosphates: '',
        conductivity: '',
        temperature: '',
      },
      soil: {
        moisture: '',
        temperature: '',
        ph: '',
        nutrientLevels: '',
        organicMatter: '',
      },
      climate: {
        temperature: '',
        humidity: '',
        precipitation: '',
        solarRadiation: '',
        windDirection: '',
        windSpeed: '',
        barometricPressure: '',
      },
      biodiversity: {
        speciesCount: '',
        habitatType: '',
        ecosystemHealth: '',
        endangeredSpecies: '',
      },
      ecosystem: {
        carbonStorage: '',
        pollutants: '',
        landCoverType: '',
        vegetationIndex: '',
      },
    },
    location: {
      latitude: '',
      longitude: '',
      altitude: '',
      region: '',
      regionCode: '',
    },
    metadata: {
      deviceId: '',
      deviceType: '',
      sensorAccuracy: '',
      collectionMethod: 'AUTOMATED',
      calibrationDate: '',
      maintenanceStatus: 'OK',
      firmwareVersion: '',
      batteryLevel: '',
      signalStrength: '',
      visibility: 'PUBLIC',
    },
  });

  // Handle input changes
  const handleInputChange = e => {
    const { name, value, type } = e.target;

    if (name.includes('.')) {
      // Handle nested properties (e.g., measurements.temperature)
      const parts = name.split('.');

      if (parts.length === 2) {
        // Two level nesting (e.g., measurements.temperature)
        const [parent, child] = parts;
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: type === 'number' ? Number(value) : value,
          },
        }));
      } else if (parts.length === 3) {
        // Three level nesting (e.g., measurements.airQuality.pm25)
        const [parent, child, grandchild] = parts;
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: {
              ...prev[parent][child],
              [grandchild]: type === 'number' ? Number(value) : value,
            },
          },
        }));
      }
    } else {
      // Handle top-level properties
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async e => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    // Generate a unique submission ID
    const submissionId = `sub-${Math.random().toString(36).substring(2, 10)}`;

    // Prepare data for submission
    const submissionData = {
      submissionId,
      dataType: formData.dataType,
      submitter: walletAddress,
      submitterId: walletAddress,
      location: {
        latitude: parseFloat(formData.location.latitude) || 0,
        longitude: parseFloat(formData.location.longitude) || 0,
        altitude: parseFloat(formData.location.altitude) || 0,
        region: formData.location.region,
        regionCode: formData.location.regionCode || 'UNKNOWN',
      },
      // IoT device specific information
      deviceId: formData.metadata.deviceId,
      deviceType: formData.metadata.deviceType,
      sensorAccuracy: parseFloat(formData.metadata.sensorAccuracy) || null,
      batteryLevel: parseInt(formData.metadata.batteryLevel) || null,
      signalStrength: parseInt(formData.metadata.signalStrength) || null,
      maintenanceStatus: formData.metadata.maintenanceStatus,
      firmwareVersion: formData.metadata.firmwareVersion,
      calibrationDate: formData.metadata.calibrationDate
        ? new Date(formData.metadata.calibrationDate).toISOString()
        : null,
      visibility: formData.metadata.visibility || 'PUBLIC',
      // Initial validation state
      validationState: 'PENDING',
      // Additional metadata
      collectionMethod: formData.metadata.collectionMethod,
      submissionTimestamp: new Date().toISOString(),
    };

    // Filter out empty values from measurements based on data type
    const filteredMeasurements = {};

    if (formData.dataType === 'WEATHER') {
      // Include only weather-related measurements
      [
        'temperature',
        'humidity',
        'pressure',
        'windSpeed',
        'precipitation',
      ].forEach(key => {
        if (formData.measurements[key]) {
          filteredMeasurements[key] = Number(formData.measurements[key]);
        }
      });
    } else if (formData.dataType === 'AIR_QUALITY') {
      // Include only air quality measurements
      Object.keys(formData.measurements.airQuality).forEach(key => {
        if (formData.measurements.airQuality[key]) {
          filteredMeasurements[key] = Number(
            formData.measurements.airQuality[key],
          );
        }
      });
    } else if (formData.dataType === 'WATER_QUALITY') {
      // Include only water quality measurements
      Object.keys(formData.measurements.waterQuality).forEach(key => {
        if (formData.measurements.waterQuality[key]) {
          filteredMeasurements[key] = Number(
            formData.measurements.waterQuality[key],
          );
        }
      });
    } else if (formData.dataType === 'SOIL') {
      // Include only soil measurements
      Object.keys(formData.measurements.soil).forEach(key => {
        if (formData.measurements.soil[key]) {
          filteredMeasurements[key] = formData.measurements.soil[key];
        }
      });
    } else if (formData.dataType === 'CLIMATE') {
      // Include only climate measurements
      Object.keys(formData.measurements.climate).forEach(key => {
        if (formData.measurements.climate[key]) {
          filteredMeasurements[key] = formData.measurements.climate[key];
        }
      });
    } else if (formData.dataType === 'BIODIVERSITY') {
      // Include only biodiversity measurements
      Object.keys(formData.measurements.biodiversity).forEach(key => {
        if (formData.measurements.biodiversity[key]) {
          filteredMeasurements[key] = formData.measurements.biodiversity[key];
        }
      });
    } else if (formData.dataType === 'ECOSYSTEM') {
      // Include only ecosystem measurements
      Object.keys(formData.measurements.ecosystem).forEach(key => {
        if (formData.measurements.ecosystem[key]) {
          filteredMeasurements[key] = formData.measurements.ecosystem[key];
        }
      });
    }

    submissionData.measurements = filteredMeasurements;

    try {
      const response = await fetch('/api/pop/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit environmental data');
      }

      setSuccessMessage('Environmental data submitted successfully!');
      setTimeout(() => {
        navigate('/pop/submissions');
      }, 2000);
    } catch (error) {
      console.error('Error submitting environmental data:', error);
      setErrorMessage(
        error.message || 'Failed to submit data. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render appropriate measurement fields based on data type
  const renderMeasurementFields = () => {
    switch (formData.dataType) {
    case 'WEATHER':
      return (
        <>
          <div className="form-group">
            <label htmlFor="measurements.temperature">
                Temperature (°C) *
            </label>
            <input
              type="number"
              id="measurements.temperature"
              name="measurements.temperature"
              value={formData.measurements.temperature}
              onChange={handleInputChange}
              required
              step="0.1"
              placeholder="e.g., 24.5"
            />
          </div>

          <div className="form-group">
            <label htmlFor="measurements.humidity">Humidity (%) *</label>
            <input
              type="number"
              id="measurements.humidity"
              name="measurements.humidity"
              value={formData.measurements.humidity}
              onChange={handleInputChange}
              required
              min="0"
              max="100"
              step="0.1"
              placeholder="e.g., 65.5"
            />
          </div>

          <div className="form-group">
            <label htmlFor="measurements.pressure">
                Atmospheric Pressure (hPa) *
            </label>
            <input
              type="number"
              id="measurements.pressure"
              name="measurements.pressure"
              value={formData.measurements.pressure}
              onChange={handleInputChange}
              required
              step="0.1"
              placeholder="e.g., 1013.2"
            />
          </div>

          <div className="form-group">
            <label htmlFor="measurements.windSpeed">Wind Speed (km/h)</label>
            <input
              type="number"
              id="measurements.windSpeed"
              name="measurements.windSpeed"
              value={formData.measurements.windSpeed}
              onChange={handleInputChange}
              step="0.1"
              placeholder="e.g., 15.2"
            />
          </div>

          <div className="form-group">
            <label htmlFor="measurements.precipitation">
                Precipitation (mm/h)
            </label>
            <input
              type="number"
              id="measurements.precipitation"
              name="measurements.precipitation"
              value={formData.measurements.precipitation}
              onChange={handleInputChange}
              min="0"
              step="0.1"
              placeholder="e.g., 2.5"
            />
          </div>
        </>
      );

    case 'AIR_QUALITY':
      return (
        <>
          <div className="form-group">
            <label htmlFor="measurements.airQuality.pm25">
                PM2.5 (μg/m³) *
            </label>
            <input
              type="number"
              id="measurements.airQuality.pm25"
              name="measurements.airQuality.pm25"
              value={formData.measurements.airQuality.pm25}
              onChange={handleInputChange}
              required
              min="0"
              step="0.1"
              placeholder="e.g., 12.5"
            />
          </div>

          <div className="form-group">
            <label htmlFor="measurements.airQuality.pm10">
                PM10 (μg/m³) *
            </label>
            <input
              type="number"
              id="measurements.airQuality.pm10"
              name="measurements.airQuality.pm10"
              value={formData.measurements.airQuality.pm10}
              onChange={handleInputChange}
              required
              min="0"
              step="0.1"
              placeholder="e.g., 30.2"
            />
          </div>

          <div className="form-group">
            <label htmlFor="measurements.airQuality.ozone">Ozone (ppb)</label>
            <input
              type="number"
              id="measurements.airQuality.ozone"
              name="measurements.airQuality.ozone"
              value={formData.measurements.airQuality.ozone}
              onChange={handleInputChange}
              min="0"
              step="0.1"
              placeholder="e.g., 35.6"
            />
          </div>

          <div className="form-group">
            <label htmlFor="measurements.airQuality.co2">CO₂ (ppm)</label>
            <input
              type="number"
              id="measurements.airQuality.co2"
              name="measurements.airQuality.co2"
              value={formData.measurements.airQuality.co2}
              onChange={handleInputChange}
              min="0"
              step="1"
              placeholder="e.g., 415"
            />
          </div>

          <div className="form-group">
            <label htmlFor="measurements.airQuality.no2">NO₂ (ppb)</label>
            <input
              type="number"
              id="measurements.airQuality.no2"
              name="measurements.airQuality.no2"
              value={formData.measurements.airQuality.no2}
              onChange={handleInputChange}
              min="0"
              step="0.1"
              placeholder="e.g., 25.3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="measurements.airQuality.so2">SO₂ (ppb)</label>
            <input
              type="number"
              id="measurements.airQuality.so2"
              name="measurements.airQuality.so2"
              value={formData.measurements.airQuality.so2}
              onChange={handleInputChange}
              min="0"
              step="0.1"
              placeholder="e.g., 5.2"
            />
          </div>
        </>
      );

    case 'WATER_QUALITY':
      return (
        <>
          <div className="form-group">
            <label htmlFor="measurements.waterQuality.ph">pH *</label>
            <input
              type="number"
              id="measurements.waterQuality.ph"
              name="measurements.waterQuality.ph"
              value={formData.measurements.waterQuality.ph}
              onChange={handleInputChange}
              required
              min="0"
              max="14"
              step="0.1"
              placeholder="e.g., 7.2"
            />
          </div>

          <div className="form-group">
            <label htmlFor="measurements.waterQuality.dissolvedOxygen">
                Dissolved Oxygen (mg/L) *
            </label>
            <input
              type="number"
              id="measurements.waterQuality.dissolvedOxygen"
              name="measurements.waterQuality.dissolvedOxygen"
              value={formData.measurements.waterQuality.dissolvedOxygen}
              onChange={handleInputChange}
              required
              min="0"
              step="0.1"
              placeholder="e.g., 8.5"
            />
          </div>

          <div className="form-group">
            <label htmlFor="measurements.waterQuality.turbidity">
                Turbidity (NTU) *
            </label>
            <input
              type="number"
              id="measurements.waterQuality.turbidity"
              name="measurements.waterQuality.turbidity"
              value={formData.measurements.waterQuality.turbidity}
              onChange={handleInputChange}
              required
              min="0"
              step="0.1"
              placeholder="e.g., 5.3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="measurements.waterQuality.nitrates">
                Nitrates (mg/L)
            </label>
            <input
              type="number"
              id="measurements.waterQuality.nitrates"
              name="measurements.waterQuality.nitrates"
              value={formData.measurements.waterQuality.nitrates}
              onChange={handleInputChange}
              min="0"
              step="0.1"
              placeholder="e.g., 2.1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="measurements.waterQuality.phosphates">
                Phosphates (mg/L)
            </label>
            <input
              type="number"
              id="measurements.waterQuality.phosphates"
              name="measurements.waterQuality.phosphates"
              value={formData.measurements.waterQuality.phosphates}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              placeholder="e.g., 0.25"
            />
          </div>

          <div className="form-group">
            <label htmlFor="measurements.waterQuality.conductivity">
                Conductivity (μS/cm)
            </label>
            <input
              type="number"
              id="measurements.waterQuality.conductivity"
              name="measurements.waterQuality.conductivity"
              value={formData.measurements.waterQuality.conductivity}
              onChange={handleInputChange}
              min="0"
              step="1"
              placeholder="e.g., 350"
            />
          </div>
        </>
      );

    case 'SOIL':
      return (
        <>
          <div className="form-group">
            <label htmlFor="measurements.soil.moisture">
                Soil Moisture (%) *
            </label>
            <input
              type="number"
              id="measurements.soil.moisture"
              name="measurements.soil.moisture"
              value={formData.measurements.soil.moisture}
              onChange={handleInputChange}
              required
              min="0"
              max="100"
              step="0.1"
              placeholder="e.g., 45.5"
            />
          </div>

          <div className="form-group">
            <label htmlFor="measurements.soil.temperature">
                Soil Temperature (°C) *
            </label>
            <input
              type="number"
              id="measurements.soil.temperature"
              name="measurements.soil.temperature"
              value={formData.measurements.soil.temperature}
              onChange={handleInputChange}
              required
              step="0.1"
              placeholder="e.g., 18.2"
            />
          </div>

          <div className="form-group">
            <label htmlFor="measurements.soil.ph">Soil pH</label>
            <input
              type="number"
              id="measurements.soil.ph"
              name="measurements.soil.ph"
              value={formData.measurements.soil.ph}
              onChange={handleInputChange}
              min="0"
              max="14"
              step="0.1"
              placeholder="e.g., 6.8"
            />
          </div>

          <div className="form-group">
            <label htmlFor="measurements.soil.nutrientLevels">
                Nutrient Levels (ppm)
            </label>
            <input
              type="number"
              id="measurements.soil.nutrientLevels"
              name="measurements.soil.nutrientLevels"
              value={formData.measurements.soil.nutrientLevels}
              onChange={handleInputChange}
              min="0"
              step="1"
              placeholder="e.g., 120"
            />
          </div>

          <div className="form-group">
            <label htmlFor="measurements.soil.organicMatter">
                Organic Matter (%)
            </label>
            <input
              type="number"
              id="measurements.soil.organicMatter"
              name="measurements.soil.organicMatter"
              value={formData.measurements.soil.organicMatter}
              onChange={handleInputChange}
              min="0"
              max="100"
              step="0.1"
              placeholder="e.g., 3.5"
            />
          </div>
        </>
      );

    case 'CLIMATE':
      return (
        <>
          <div className="form-group">
            <label htmlFor="measurements.climate.temperature">
                Average Temperature (°C) *
            </label>
            <input
              type="number"
              id="measurements.climate.temperature"
              name="measurements.climate.temperature"
              value={formData.measurements.climate.temperature}
              onChange={handleInputChange}
              required
              step="0.1"
              placeholder="e.g., 22.5"
            />
          </div>

          <div className="form-group">
            <label htmlFor="measurements.climate.precipitation">
                Annual Precipitation (mm) *
            </label>
            <input
              type="number"
              id="measurements.climate.precipitation"
              name="measurements.climate.precipitation"
              value={formData.measurements.climate.precipitation}
              onChange={handleInputChange}
              required
              min="0"
              step="0.1"
              placeholder="e.g., 850.5"
            />
          </div>

          <div className="form-group">
            <label htmlFor="measurements.climate.humidity">
                Average Humidity (%)
            </label>
            <input
              type="number"
              id="measurements.climate.humidity"
              name="measurements.climate.humidity"
              value={formData.measurements.climate.humidity}
              onChange={handleInputChange}
              min="0"
              max="100"
              step="0.1"
              placeholder="e.g., 65.0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="measurements.climate.solarRadiation">
                Solar Radiation (W/m²)
            </label>
            <input
              type="number"
              id="measurements.climate.solarRadiation"
              name="measurements.climate.solarRadiation"
              value={formData.measurements.climate.solarRadiation}
              onChange={handleInputChange}
              min="0"
              step="0.1"
              placeholder="e.g., 250.5"
            />
          </div>
        </>
      );

    case 'BIODIVERSITY':
      return (
        <>
          <div className="form-group">
            <label htmlFor="measurements.biodiversity.speciesCount">
                Species Count *
            </label>
            <input
              type="number"
              id="measurements.biodiversity.speciesCount"
              name="measurements.biodiversity.speciesCount"
              value={formData.measurements.biodiversity.speciesCount}
              onChange={handleInputChange}
              required
              min="0"
              step="1"
              placeholder="e.g., 45"
            />
          </div>

          <div className="form-group">
            <label htmlFor="measurements.biodiversity.habitatType">
                Habitat Type *
            </label>
            <select
              id="measurements.biodiversity.habitatType"
              name="measurements.biodiversity.habitatType"
              value={formData.measurements.biodiversity.habitatType}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Habitat Type</option>
              <option value="FOREST">Forest</option>
              <option value="GRASSLAND">Grassland</option>
              <option value="WETLAND">Wetland</option>
              <option value="MARINE">Marine</option>
              <option value="FRESHWATER">Freshwater</option>
              <option value="DESERT">Desert</option>
              <option value="TUNDRA">Tundra</option>
              <option value="URBAN">Urban</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="measurements.biodiversity.ecosystemHealth">
                Ecosystem Health Score (0-10)
            </label>
            <input
              type="number"
              id="measurements.biodiversity.ecosystemHealth"
              name="measurements.biodiversity.ecosystemHealth"
              value={formData.measurements.biodiversity.ecosystemHealth}
              onChange={handleInputChange}
              min="0"
              max="10"
              step="0.1"
              placeholder="e.g., 7.5"
            />
          </div>

          <div className="form-group">
            <label htmlFor="measurements.biodiversity.endangeredSpecies">
                Endangered Species Count
            </label>
            <input
              type="number"
              id="measurements.biodiversity.endangeredSpecies"
              name="measurements.biodiversity.endangeredSpecies"
              value={formData.measurements.biodiversity.endangeredSpecies}
              onChange={handleInputChange}
              min="0"
              step="1"
              placeholder="e.g., 3"
            />
          </div>
        </>
      );

    case 'ECOSYSTEM':
      return (
        <>
          <div className="form-group">
            <label htmlFor="measurements.ecosystem.carbonStorage">
                Carbon Storage (tons/ha) *
            </label>
            <input
              type="number"
              id="measurements.ecosystem.carbonStorage"
              name="measurements.ecosystem.carbonStorage"
              value={formData.measurements.ecosystem.carbonStorage}
              onChange={handleInputChange}
              required
              min="0"
              step="0.1"
              placeholder="e.g., 150.5"
            />
          </div>

          <div className="form-group">
            <label htmlFor="measurements.ecosystem.pollutants">
                Pollutant Levels (ppm) *
            </label>
            <input
              type="number"
              id="measurements.ecosystem.pollutants"
              name="measurements.ecosystem.pollutants"
              value={formData.measurements.ecosystem.pollutants}
              onChange={handleInputChange}
              required
              min="0"
              step="0.1"
              placeholder="e.g., 5.2"
            />
          </div>

          <div className="form-group">
            <label htmlFor="measurements.ecosystem.landCoverType">
                Land Cover Type *
            </label>
            <select
              id="measurements.ecosystem.landCoverType"
              name="measurements.ecosystem.landCoverType"
              value={formData.measurements.ecosystem.landCoverType}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Land Cover Type</option>
              <option value="FOREST">Forest</option>
              <option value="CROPLAND">Cropland</option>
              <option value="GRASSLAND">Grassland</option>
              <option value="WETLAND">Wetland</option>
              <option value="URBAN">Urban</option>
              <option value="BARREN">Barren</option>
              <option value="WATER">Water</option>
              <option value="SNOW_ICE">Snow/Ice</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="measurements.ecosystem.vegetationIndex">
                Vegetation Index (NDVI)
            </label>
            <input
              type="number"
              id="measurements.ecosystem.vegetationIndex"
              name="measurements.ecosystem.vegetationIndex"
              value={formData.measurements.ecosystem.vegetationIndex}
              onChange={handleInputChange}
              min="-1"
              max="1"
              step="0.01"
              placeholder="e.g., 0.65"
            />
          </div>
        </>
      );

    default:
      return null;
    }
  };

  return (
    <div className="submit-environmental-data-container">
      <h2>Submit Environmental Data</h2>
      <p className="intro-text">
        Submit environmental data to the Wrfcoin network using the Proof of
        Publishing (PoP) system. Your data will be verified by the network and
        rewarded based on quality and importance.
      </p>

      {errorMessage && <div className="error-message">{errorMessage}</div>}
      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}

      <form onSubmit={handleSubmit} className="environmental-data-form">
        <div className="form-section">
          <h3>Data Type</h3>

          <div className="form-group">
            <label htmlFor="dataType">Select Data Type *</label>
            <select
              id="dataType"
              name="dataType"
              value={formData.dataType}
              onChange={handleInputChange}
              required
            >
              <option value="WEATHER">Weather Data</option>
              <option value="AIR_QUALITY">Air Quality Data</option>
              <option value="WATER_QUALITY">Water Quality Data</option>
              <option value="SOIL">Soil Data</option>
              <option value="CLIMATE">Climate Data</option>
              <option value="BIODIVERSITY">Biodiversity Data</option>
              <option value="ECOSYSTEM">Ecosystem Data</option>
            </select>
            <small>
              Select the type of environmental data you're submitting
            </small>
          </div>

          <div className="form-group">
            <label>Connected Wallet (Submitter)</label>
            <input
              type="text"
              value={walletAddress}
              disabled
              className="disabled-input"
            />
            <small>Rewards will be sent to this address upon validation</small>
          </div>
        </div>

        <div className="form-section">
          <h3>Measurements</h3>
          <p className="section-description">
            Enter measurements for your selected data type. Required fields are
            marked with an asterisk (*).
          </p>

          {renderMeasurementFields()}
        </div>

        <div className="form-section">
          <h3>Location Information</h3>

          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="location.latitude">Latitude *</label>
              <input
                type="text"
                id="location.latitude"
                name="location.latitude"
                value={formData.location.latitude}
                onChange={handleInputChange}
                required
                placeholder="e.g., 40.7128"
              />
            </div>

            <div className="form-group half">
              <label htmlFor="location.longitude">Longitude *</label>
              <input
                type="text"
                id="location.longitude"
                name="location.longitude"
                value={formData.location.longitude}
                onChange={handleInputChange}
                required
                placeholder="e.g., -74.0060"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="location.altitude">Altitude (meters)</label>
              <input
                type="number"
                id="location.altitude"
                name="location.altitude"
                value={formData.location.altitude}
                onChange={handleInputChange}
                placeholder="e.g., 10"
              />
            </div>

            <div className="form-group half">
              <label htmlFor="location.region">Region/Area</label>
              <input
                type="text"
                id="location.region"
                name="location.region"
                value={formData.location.region}
                onChange={handleInputChange}
                placeholder="e.g., Manhattan, NYC"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Device Information & Collection Metadata</h3>
          <p className="section-description">
            Detailed device information increases your data reliability score in
            the Proof of Publishing system and helps validators verify the
            authenticity of your submissions.
          </p>

          <div className="form-group">
            <label htmlFor="metadata.deviceId">
              Device ID/Serial Number{' '}
              <InfoIcon text="The unique identifier for your IoT device or sensor station. This helps track data submissions from the same device over time and builds device reputation." />
            </label>
            <input
              type="text"
              id="metadata.deviceId"
              name="metadata.deviceId"
              value={formData.metadata.deviceId}
              onChange={handleInputChange}
              placeholder="e.g., WRF-SENSOR-12345"
            />
            <small>
              Enter your device's unique identifier or serial number
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="metadata.deviceType">
              Device Type/Model{' '}
              <InfoIcon text="The category of device used to collect this data. Different device types have different validation criteria and reputation requirements." />
            </label>
            <select
              id="metadata.deviceType"
              name="metadata.deviceType"
              value={formData.metadata.deviceType}
              onChange={handleInputChange}
            >
              <option value="">Select Device Type</option>
              <option value="WEATHER_STATION">Weather Station</option>
              <option value="AIR_QUALITY_MONITOR">Air Quality Monitor</option>
              <option value="SOIL_SENSOR">Soil Sensor</option>
              <option value="WATER_QUALITY_SENSOR">Water Quality Sensor</option>
              <option value="BIODIVERSITY_MONITOR">Biodiversity Monitor</option>
              <option value="CLIMATE_STATION">Climate Station</option>
              <option value="ECOSYSTEM_MONITOR">Ecosystem Monitor</option>
              <option value="OTHER">Other</option>
            </select>
            <small>Select the primary purpose/category of your device</small>
          </div>

          <div className="form-group">
            <label htmlFor="metadata.sensorAccuracy">
              Sensor Accuracy (±){' '}
              <InfoIcon text="The documented precision of your device's sensors. Higher accuracy sensors receive higher validation scores in the PoP system." />
            </label>
            <input
              type="text"
              id="metadata.sensorAccuracy"
              name="metadata.sensorAccuracy"
              value={formData.metadata.sensorAccuracy}
              onChange={handleInputChange}
              placeholder="e.g., 0.1°C"
            />
            <small>The documented accuracy of your device's sensors</small>
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="metadata.batteryLevel">
                Battery Level (%){' '}
                <InfoIcon text="Current battery level of your device. Low battery levels may affect data quality and reliability scores." />
              </label>
              <input
                type="number"
                id="metadata.batteryLevel"
                name="metadata.batteryLevel"
                value={formData.metadata.batteryLevel}
                onChange={handleInputChange}
                min="0"
                max="100"
                placeholder="e.g., 85"
              />
            </div>

            <div className="form-group half">
              <label htmlFor="metadata.signalStrength">
                Signal Strength (0-5){' '}
                <InfoIcon text="Signal strength at time of data collection. Higher signal strength indicates better data transmission reliability." />
              </label>
              <input
                type="number"
                id="metadata.signalStrength"
                name="metadata.signalStrength"
                value={formData.metadata.signalStrength}
                onChange={handleInputChange}
                min="0"
                max="5"
                placeholder="e.g., 4"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="metadata.firmwareVersion">
                Firmware Version{' '}
                <InfoIcon text="The software version running on your device. Updated firmware typically improves data accuracy and reliability." />
              </label>
              <input
                type="text"
                id="metadata.firmwareVersion"
                name="metadata.firmwareVersion"
                value={formData.metadata.firmwareVersion}
                onChange={handleInputChange}
                placeholder="e.g., v2.3.1"
              />
            </div>

            <div className="form-group half">
              <label htmlFor="metadata.calibrationDate">
                Last Calibration Date{' '}
                <InfoIcon text="Date when your device was last calibrated. Recently calibrated devices receive higher accuracy scores in validation." />
              </label>
              <input
                type="date"
                id="metadata.calibrationDate"
                name="metadata.calibrationDate"
                value={formData.metadata.calibrationDate}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="metadata.maintenanceStatus">
                Maintenance Status{' '}
                <InfoIcon text="Current maintenance condition of your device. Well-maintained devices receive higher reliability scores in the PoP system." />
              </label>
              <select
                id="metadata.maintenanceStatus"
                name="metadata.maintenanceStatus"
                value={formData.metadata.maintenanceStatus}
                onChange={handleInputChange}
              >
                <option value="OK">OK</option>
                <option value="NEEDS_MAINTENANCE">Needs Maintenance</option>
                <option value="MAINTENANCE_SCHEDULED">
                  Maintenance Scheduled
                </option>
                <option value="RECENTLY_MAINTAINED">Recently Maintained</option>
              </select>
            </div>

            <div className="form-group half">
              <label htmlFor="metadata.collectionMethod">
                Collection Method{' '}
                <InfoIcon text="How the data was collected. Automated methods typically provide more consistent timestamps and measuring intervals." />
              </label>
              <select
                id="metadata.collectionMethod"
                name="metadata.collectionMethod"
                value={formData.metadata.collectionMethod}
                onChange={handleInputChange}
              >
                <option value="AUTOMATED">Automated Sensor</option>
                <option value="MANUAL">Manual Reading</option>
                <option value="HYBRID">Hybrid (Auto + Manual)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="metadata.visibility">
              Data Visibility{' '}
              <InfoIcon text="Controls who can access your data. Public data can be validated by more participants and earns higher rewards, but private data offers more control over your information." />
            </label>
            <select
              id="metadata.visibility"
              name="metadata.visibility"
              value={formData.metadata.visibility}
              onChange={handleInputChange}
            >
              <option value="PUBLIC">
                Public (Available to all network participants)
              </option>
              <option value="PRIVATE">Private (Only available to you)</option>
              <option value="PERMISSIONED">
                Permissioned (Available to selected participants)
              </option>
            </select>
            <small>
              Determine who can view and verify your environmental data
            </small>
          </div>
        </div>

        <div className="form-actions">
          <div className="buttons-container">
            <button
              type="button"
              className="button secondary"
              onClick={() => navigate('/pop/dashboard')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Environmental Data'}
            </button>
          </div>

          <div className="submission-info">
            <p className="info-text">
              After submission, your data will enter the Proof of Publishing
              validation system. Validators will verify its accuracy, and once
              validated, you'll earn rewards based on data quality, device
              reliability, and environmental importance.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SubmitEnvironmentalDataForm;
