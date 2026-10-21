import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Grid,
  Card,
  CardContent,
  Alert,
  Chip,
  Divider,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch,
  Slider,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  LocationOn as LocationIcon,
  Sensors as SensorsIcon,
  CloudUpload as UploadIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';
import { popService } from '../../services/popService';
import { POP_ROUTES_SERVED, POP_SUBMISSION_UNAVAILABLE } from '../../services/popRoutes';

// /pop/submit mounts this form, but POST /api/pop/submit is not served
// (popRoutes.js). Submit Data is disabled and says why, and a forced submit
// sends nothing (frontend#354, codex round 20 on #390).

const ENVIRONMENTAL_DATA_TYPES = [
  { value: 'AIR_QUALITY', label: 'Air Quality', icon: '🌬️', unit: 'AQI' },
  { value: 'WEATHER_DATA', label: 'Weather Data', icon: '🌤️', unit: 'Various' },
  {
    value: 'WATER_QUALITY',
    label: 'Water Quality',
    icon: '💧',
    unit: 'pH/TDS',
  },
  { value: 'SOIL_DATA', label: 'Soil Data', icon: '🌱', unit: 'pH/Moisture' },
  { value: 'CLIMATE_DATA', label: 'Climate Data', icon: '🌍', unit: 'Various' },
  { value: 'BIODIVERSITY', label: 'Biodiversity', icon: '🦋', unit: 'Count' },
  {
    value: 'ECOSYSTEM_DATA',
    label: 'Ecosystem Data',
    icon: '🌲',
    unit: 'Various',
  },
  { value: 'RADIATION', label: 'Radiation Levels', icon: '☢️', unit: 'μSv/h' },
  {
    value: 'NOISE_POLLUTION',
    label: 'Noise Pollution',
    icon: '🔊',
    unit: 'dB',
  },
];

const DEVICE_TYPES = [
  { value: 'AIR_QUALITY_MONITOR', label: 'Air Quality Monitor' },
  { value: 'WEATHER_STATION', label: 'Weather Station' },
  { value: 'WATER_SENSOR', label: 'Water Quality Sensor' },
  { value: 'SOIL_SENSOR', label: 'Soil Sensor' },
  { value: 'RADIATION_DETECTOR', label: 'Radiation Detector' },
  { value: 'NOISE_METER', label: 'Noise Level Meter' },
  { value: 'CAMERA_TRAP', label: 'Camera Trap' },
  { value: 'MANUAL_READING', label: 'Manual Reading' },
  { value: 'MOBILE_APP', label: 'Mobile App' },
];

const MEASUREMENT_TEMPLATES = {
  AIR_QUALITY: [
    { key: 'pm25', label: 'PM2.5', unit: 'μg/m³', min: 0, max: 500 },
    { key: 'pm10', label: 'PM10', unit: 'μg/m³', min: 0, max: 600 },
    { key: 'no2', label: 'NO2', unit: 'ppb', min: 0, max: 200 },
    { key: 'o3', label: 'Ozone', unit: 'ppb', min: 0, max: 300 },
    { key: 'co', label: 'Carbon Monoxide', unit: 'ppm', min: 0, max: 50 },
  ],
  WEATHER_DATA: [
    { key: 'temperature', label: 'Temperature', unit: '°C', min: -50, max: 60 },
    { key: 'humidity', label: 'Humidity', unit: '%', min: 0, max: 100 },
    { key: 'pressure', label: 'Pressure', unit: 'hPa', min: 800, max: 1100 },
    { key: 'wind_speed', label: 'Wind Speed', unit: 'm/s', min: 0, max: 100 },
    {
      key: 'wind_direction',
      label: 'Wind Direction',
      unit: '°',
      min: 0,
      max: 360,
    },
  ],
  WATER_QUALITY: [
    { key: 'ph', label: 'pH Level', unit: 'pH', min: 0, max: 14 },
    {
      key: 'tds',
      label: 'Total Dissolved Solids',
      unit: 'ppm',
      min: 0,
      max: 1000,
    },
    {
      key: 'temperature',
      label: 'Water Temperature',
      unit: '°C',
      min: 0,
      max: 40,
    },
    {
      key: 'dissolved_oxygen',
      label: 'Dissolved Oxygen',
      unit: 'mg/L',
      min: 0,
      max: 20,
    },
  ],
};

const EnhancedEnvironmentalDataForm = () => {
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
    qualityScore: 0,
    submissionNotes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertType, setAlertType] = useState(null);
  const [measurementFields, setMeasurementFields] = useState([]);
  const [metadataFields, setMetadataFields] = useState([
    { key: '', value: '' },
  ]);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [validationScore, setValidationScore] = useState(0);
  const [estimatedReward, setEstimatedReward] = useState(0);

  // Load measurement templates when data type changes
  useEffect(() => {
    const template = MEASUREMENT_TEMPLATES[formData.dataType] || [];
    setMeasurementFields(template.map(field => ({ ...field, value: '' })));
  }, [formData.dataType]);

  // Calculate quality score based on various factors
  useEffect(() => {
    let score = 0;

    // Device accuracy contribution (40%)
    score += formData.sensorAccuracy * 40;

    // Data completeness (30%)
    const completedMeasurements = measurementFields.filter(
      field => field.value !== '',
    ).length;
    const totalMeasurements = measurementFields.length;
    if (totalMeasurements > 0) {
      score += (completedMeasurements / totalMeasurements) * 30;
    }

    // Device health (20%)
    const deviceHealth =
      (formData.batteryLevel / 100) * 0.5 + (formData.signalStrength / 5) * 0.5;
    score += deviceHealth * 20;

    // Location accuracy (10%)
    if (formData.latitude && formData.longitude) {
      score += 10;
    }

    setValidationScore(Math.round(score));

    // Estimate reward based on quality score
    const baseReward = 5;
    const qualityMultiplier = score / 100;
    setEstimatedReward(Number((baseReward * qualityMultiplier).toFixed(2)));
  }, [formData, measurementFields]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6),
          }));
          setUseCurrentLocation(true);
          showAlert('Location retrieved successfully', 'success');
        },
        error => {
          showAlert('Could not retrieve location: ' + error.message, 'error');
        },
      );
    } else {
      showAlert('Geolocation is not supported by this browser', 'error');
    }
  };

  const showAlert = (message, type) => {
    setAlertMessage(message);
    setAlertType(type);
    setTimeout(() => {
      setAlertMessage(null);
      setAlertType(null);
    }, 5000);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMeasurementChange = (index, value) => {
    const updatedFields = [...measurementFields];
    updatedFields[index].value = value;
    setMeasurementFields(updatedFields);

    // Update measurements object
    const measurements = {};
    updatedFields.forEach(field => {
      if (field.value !== '') {
        measurements[field.key] = {
          value: parseFloat(field.value),
          unit: field.unit,
          timestamp: new Date().toISOString(),
        };
      }
    });

    setFormData(prev => ({ ...prev, measurements }));
  };

  const handleMetadataChange = (index, field, value) => {
    const updatedFields = [...metadataFields];
    updatedFields[index][field] = value;
    setMetadataFields(updatedFields);

    // Update metadata object
    const metadata = {};
    updatedFields.forEach(item => {
      if (item.key && item.value) {
        metadata[item.key] = item.value;
      }
    });

    setFormData(prev => ({ ...prev, metadata }));
  };

  const addMetadataField = () => {
    setMetadataFields([...metadataFields, { key: '', value: '' }]);
  };

  const removeMetadataField = index => {
    const updatedFields = [...metadataFields];
    updatedFields.splice(index, 1);
    setMetadataFields(updatedFields);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!POP_ROUTES_SERVED) {
      showAlert(POP_SUBMISSION_UNAVAILABLE, 'error');
      return;
    }
    setIsSubmitting(true);

    try {
      const submissionData = {
        ...formData,
        qualityScore: validationScore,
        estimatedReward,
        submissionTimestamp: new Date().toISOString(),
      };

      const result = await popService.submitEnvironmentalData(submissionData);
      showAlert(
        'Environmental data submitted successfully! Estimated reward: ' +
          estimatedReward +
          ' WRF',
        'success',
      );

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
        qualityScore: 0,
        submissionNotes: '',
      });
      setMetadataFields([{ key: '', value: '' }]);
      setUseCurrentLocation(false);
    } catch (error) {
      console.error('Error submitting environmental data:', error);
      showAlert(
        'Failed to submit environmental data: ' + error.message,
        'error',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 1000, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Submit Environmental Data
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Contribute high-quality environmental data to earn WRF tokens
      </Typography>

      {alertMessage && (
        <Alert severity={alertType} sx={{ mb: 3 }}>
          {alertMessage}
        </Alert>
      )}

      {/* Quality Score Card */}
      <Card
        sx={{
          mb: 3,
          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
        }}
      >
        <CardContent sx={{ color: 'white' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <Typography variant="h6">Data Quality Score</Typography>
              <Typography variant="h3">{validationScore}%</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6">Estimated Reward</Typography>
              <Typography variant="h3">{estimatedReward} WRF</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <LinearProgress
                variant="determinate"
                value={validationScore}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: 'white',
                  },
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit}>
        {/* Data Type Selection */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SensorsIcon />
              <Typography variant="h6">Data Type & Measurements</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Environmental Data Type</InputLabel>
                  <Select
                    value={formData.dataType}
                    onChange={e =>
                      handleInputChange('dataType', e.target.value)
                    }
                  >
                    {ENVIRONMENTAL_DATA_TYPES.map(type => (
                      <MenuItem key={type.value} value={type.value}>
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <span>{type.icon}</span>
                          <Box>
                            <Typography variant="body2">
                              {type.label}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Unit: {type.unit}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Device Type</InputLabel>
                  <Select
                    value={formData.deviceType}
                    onChange={e =>
                      handleInputChange('deviceType', e.target.value)
                    }
                  >
                    {DEVICE_TYPES.map(device => (
                      <MenuItem key={device.value} value={device.value}>
                        {device.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Dynamic Measurement Fields */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Measurements
                </Typography>
                <Grid container spacing={2}>
                  {measurementFields.map((field, index) => (
                    <Grid item xs={12} md={6} lg={4} key={field.key}>
                      <TextField
                        fullWidth
                        label={`${field.label} (${field.unit})`}
                        type="number"
                        value={field.value}
                        onChange={e =>
                          handleMeasurementChange(index, e.target.value)
                        }
                        inputProps={{
                          min: field.min,
                          max: field.max,
                          step: 0.01,
                        }}
                        helperText={`Range: ${field.min}-${field.max} ${field.unit}`}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Location Information */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationIcon />
              <Typography variant="h6">Location Information</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  startIcon={<LocationIcon />}
                  onClick={getCurrentLocation}
                  disabled={useCurrentLocation}
                >
                  {useCurrentLocation
                    ? 'Location Retrieved'
                    : 'Use Current Location'}
                </Button>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Latitude"
                  type="number"
                  value={formData.latitude}
                  onChange={e => handleInputChange('latitude', e.target.value)}
                  required
                  inputProps={{ step: 0.000001 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Longitude"
                  type="number"
                  value={formData.longitude}
                  onChange={e => handleInputChange('longitude', e.target.value)}
                  required
                  inputProps={{ step: 0.000001 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Elevation (meters)"
                  type="number"
                  value={formData.elevation}
                  onChange={e => handleInputChange('elevation', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Location Description"
                  multiline
                  rows={2}
                  value={formData.locationDescription}
                  onChange={e =>
                    handleInputChange('locationDescription', e.target.value)
                  }
                  placeholder="Describe the exact location and surroundings..."
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Device Information */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Device & Quality Information</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Device ID"
                  value={formData.deviceId}
                  onChange={e => handleInputChange('deviceId', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Firmware Version"
                  value={formData.firmwareVersion}
                  onChange={e =>
                    handleInputChange('firmwareVersion', e.target.value)
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography gutterBottom>
                  Sensor Accuracy: {(formData.sensorAccuracy * 100).toFixed(1)}%
                </Typography>
                <Slider
                  value={formData.sensorAccuracy}
                  onChange={(_, value) =>
                    handleInputChange('sensorAccuracy', value)
                  }
                  min={0.5}
                  max={1.0}
                  step={0.01}
                  marks={[
                    { value: 0.5, label: '50%' },
                    { value: 0.75, label: '75%' },
                    { value: 0.9, label: '90%' },
                    { value: 1.0, label: '100%' },
                  ]}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography gutterBottom>
                  Battery Level: {formData.batteryLevel}%
                </Typography>
                <Slider
                  value={formData.batteryLevel}
                  onChange={(_, value) =>
                    handleInputChange('batteryLevel', value)
                  }
                  min={0}
                  max={100}
                  step={1}
                  marks={[
                    { value: 0, label: '0%' },
                    { value: 25, label: '25%' },
                    { value: 50, label: '50%' },
                    { value: 75, label: '75%' },
                    { value: 100, label: '100%' },
                  ]}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Submission Notes"
                  multiline
                  rows={3}
                  value={formData.submissionNotes}
                  onChange={e =>
                    handleInputChange('submissionNotes', e.target.value)
                  }
                  placeholder="Any additional notes about this data submission..."
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Custom Metadata */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Additional Metadata (Optional)</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {metadataFields.map((field, index) => (
              <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                <Grid item xs={5}>
                  <TextField
                    fullWidth
                    label="Key"
                    value={field.key}
                    onChange={e =>
                      handleMetadataChange(index, 'key', e.target.value)
                    }
                    size="small"
                  />
                </Grid>
                <Grid item xs={5}>
                  <TextField
                    fullWidth
                    label="Value"
                    value={field.value}
                    onChange={e =>
                      handleMetadataChange(index, 'value', e.target.value)
                    }
                    size="small"
                  />
                </Grid>
                <Grid item xs={2}>
                  <IconButton
                    onClick={() => removeMetadataField(index)}
                    disabled={metadataFields.length === 1}
                  >
                    <RemoveIcon />
                  </IconButton>
                </Grid>
              </Grid>
            ))}
            <Button
              startIcon={<AddIcon />}
              onClick={addMetadataField}
              variant="outlined"
              size="small"
            >
              Add Metadata Field
            </Button>
          </AccordionDetails>
        </Accordion>

        <Box
          sx={{
            mt: 4,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box>
            <Typography variant="body2" color="text.secondary">
              Estimated processing time: 2-5 minutes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Quality Score: {validationScore}% | Reward: {estimatedReward} WRF
            </Typography>
          </Box>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={!POP_ROUTES_SERVED || isSubmitting || validationScore < 60}
            title={POP_ROUTES_SERVED ? undefined : POP_SUBMISSION_UNAVAILABLE}
            startIcon={isSubmitting ? null : <CheckIcon />}
            sx={{ minWidth: 160 }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Data'}
          </Button>
        </Box>

        {!POP_ROUTES_SERVED && (
          <Alert severity="info" sx={{ mt: 2 }} data-testid="enhanced-pop-submission-unavailable">
            {POP_SUBMISSION_UNAVAILABLE}
          </Alert>
        )}

        {validationScore < 60 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Quality score too low for submission. Please improve data
            completeness and device accuracy.
          </Alert>
        )}
      </form>
    </Paper>
  );
};

export default EnhancedEnvironmentalDataForm;
