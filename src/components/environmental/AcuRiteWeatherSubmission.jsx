import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Box,
  Alert,
  Chip,
} from '@mui/material';
import {
  CloudQueue,
  Thermostat,
  Air,
  Speed,
  Navigation,
} from '@mui/icons-material';

const AcuRiteWeatherSubmission = () => {
  const [weatherData, setWeatherData] = useState({
    temperature: '',
    humidity: '',
    windSpeed: '',
    windDirection: '',
    rainfall: '',
    pressure: '',
  });
  const [submitStatus, setSubmitStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field, value) => {
    setWeatherData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/acurite/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId:
            import.meta.env.VITE_ACURITE_DEVICE_ID || 'configured-device-id',
          ...weatherData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitStatus({
          type: 'success',
          message: `Data submitted successfully! ${result.reward}`,
        });
        // Clear form
        setWeatherData({
          temperature: '',
          humidity: '',
          windSpeed: '',
          windDirection: '',
          rainfall: '',
          pressure: '',
        });
      } else {
        setSubmitStatus({
          type: 'error',
          message: result.error || 'Submission failed',
        });
      }
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: 'Network error - please try again',
      });
    }
    setIsSubmitting(false);
  };

  const isFormValid = Object.values(weatherData).some(value => value !== '');

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto', mt: 3 }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <CloudQueue color="primary" fontSize="large" />
          <Box>
            <Typography variant="h5" gutterBottom>
              AcuRite Iris 5-in-1 Weather Station
            </Typography>
            <Chip
              label="Authentic Hardware Data"
              color="success"
              size="small"
              sx={{ mr: 1 }}
            />
            <Chip
              label="Earn 50 WRF per submission"
              color="warning"
              size="small"
            />
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" mb={3}>
          Submit readings from your personal weather station to earn WRF tokens
          and contribute to the environmental blockchain network. Your authentic
          sensor data helps build trust in our decentralized environmental
          monitoring system.
        </Typography>

        {submitStatus && (
          <Alert
            severity={submitStatus.type}
            sx={{ mb: 3 }}
            onClose={() => setSubmitStatus(null)}
          >
            {submitStatus.message}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Temperature (°F)"
              type="number"
              value={weatherData.temperature}
              onChange={e => handleInputChange('temperature', e.target.value)}
              InputProps={{
                startAdornment: <Thermostat color="action" sx={{ mr: 1 }} />,
              }}
              helperText="From your Iris display"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Humidity (%)"
              type="number"
              value={weatherData.humidity}
              onChange={e => handleInputChange('humidity', e.target.value)}
              InputProps={{
                startAdornment: <Air color="action" sx={{ mr: 1 }} />,
              }}
              inputProps={{ min: 0, max: 100 }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Wind Speed (mph)"
              type="number"
              value={weatherData.windSpeed}
              onChange={e => handleInputChange('windSpeed', e.target.value)}
              InputProps={{
                startAdornment: <Speed color="action" sx={{ mr: 1 }} />,
              }}
              inputProps={{ min: 0 }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Wind Direction (°)"
              type="number"
              value={weatherData.windDirection}
              onChange={e => handleInputChange('windDirection', e.target.value)}
              InputProps={{
                startAdornment: <Navigation color="action" sx={{ mr: 1 }} />,
              }}
              inputProps={{ min: 0, max: 360 }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Rainfall (inches)"
              type="number"
              step="0.01"
              value={weatherData.rainfall}
              onChange={e => handleInputChange('rainfall', e.target.value)}
              inputProps={{ min: 0 }}
              helperText="Since last reading"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Barometric Pressure (inHg)"
              type="number"
              step="0.01"
              value={weatherData.pressure}
              onChange={e => handleInputChange('pressure', e.target.value)}
              inputProps={{ min: 25, max: 35 }}
            />
          </Grid>
        </Grid>

        <Box mt={4}>
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            sx={{
              py: 1.5,
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
              },
            }}
          >
            {isSubmitting
              ? 'Submitting to Blockchain...'
              : 'Submit Weather Data & Earn WRF'}
          </Button>
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          mt={2}
          display="block"
          textAlign="center"
        >
          Data is verified and stored on the Wrfcoin blockchain for transparency
          and authenticity
        </Typography>
      </CardContent>
    </Card>
  );
};

export default AcuRiteWeatherSubmission;
