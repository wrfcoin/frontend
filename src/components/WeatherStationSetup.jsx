import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Grid,
} from '@mui/material';
import {
  Wifi as WifiIcon,
  Devices as DevicesIcon,
  MonetizationOn as MonetizationOnIcon,
  CheckCircle as CheckCircleIcon,
  QrCode as QrCodeIcon,
} from '@mui/icons-material';

const WeatherStationSetup = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [stationData, setStationData] = useState({
    stationType: '',
    location: '',
    wifiName: '',
    setupComplete: false,
  });
  const [earnings, setEarnings] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);

  const steps = [
    'Choose Your Weather Station',
    'Connect to WiFi',
    'Set Location',
    'Start Earning Credits!',
  ];

  const popularStations = [
    {
      name: 'Ambient Weather WS-2902',
      price: '$169',
      setup: 'Scan QR Code',
      earning: '0.5 credits/day',
      difficulty: 'Grandma-Friendly ⭐',
      image: '🌡️',
    },
    {
      name: 'Davis Vantage Vue',
      price: '$395',
      setup: 'Scan QR Code',
      earning: '0.8 credits/day',
      difficulty: 'Super Easy ⭐',
      image: '🌪️',
    },
    {
      name: 'WeatherFlow Tempest',
      price: '$329',
      setup: 'Scan QR Code',
      earning: '0.7 credits/day',
      difficulty: 'One-Click Setup ⭐',
      image: '⛈️',
    },
  ];

  const handleStationSelect = station => {
    setStationData({ ...stationData, stationType: station.name });
    setActiveStep(1);
  };

  const handleWifiConnect = () => {
    setIsConnecting(true);
    // Simulate connection process
    setTimeout(() => {
      setIsConnecting(false);
      setActiveStep(2);
    }, 3000);
  };

  const handleLocationSet = () => {
    setActiveStep(3);
    // Start earning simulation
    const earningInterval = setInterval(() => {
      setEarnings(prev => prev + 0.02);
    }, 1000);

    setStationData({ ...stationData, setupComplete: true });

    // Stop after demo
    setTimeout(() => clearInterval(earningInterval), 30000);
  };

  const renderStepContent = step => {
    switch (step) {
    case 0:
      return (
        <Box>
          <Typography variant="h5" gutterBottom align="center" sx={{ mb: 3 }}>
              🎉 Choose Your Weather Station
          </Typography>
          <Typography
            variant="body1"
            align="center"
            sx={{ mb: 4, color: 'text.secondary' }}
          >
              Pick any weather station below. We'll guide you through the super
              simple setup!
          </Typography>

          <Grid container spacing={3}>
            {popularStations.map((station, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateY(-4px)' },
                  }}
                  onClick={() => handleStationSelect(station)}
                >
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Typography variant="h2" sx={{ mb: 2 }}>
                      {station.image}
                    </Typography>
                    <Typography variant="h6" gutterBottom>
                      {station.name}
                    </Typography>
                    <Chip
                      label={station.difficulty}
                      color="success"
                      sx={{ mb: 2 }}
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                        Setup: {station.setup}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                        Earn: {station.earning}
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {station.price}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Alert severity="info" sx={{ mt: 4, maxWidth: 600, mx: 'auto' }}>
            <strong>💡 Pro Tip:</strong> All these weather stations work with
              our Weather Network! Compatible with most standard weather stations.
          </Alert>
        </Box>
      );

    case 1:
      return (
        <Box sx={{ textAlign: 'center' }}>
          <WifiIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
              Connect to Your WiFi
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
              Just scan the QR code on your weather station box, or tell us your
              WiFi name below.
          </Typography>

          <Box sx={{ mb: 4 }}>
            <Button
              variant="outlined"
              startIcon={<QrCodeIcon />}
              sx={{ mr: 2, mb: 2 }}
              size="large"
            >
                📱 Scan QR Code (Easiest!)
            </Button>
          </Box>

          <Typography variant="body2" sx={{ mb: 2 }}>
              Or manually enter your WiFi network:
          </Typography>
          <TextField
            fullWidth
            label="Your WiFi Network Name"
            value={stationData.wifiName}
            onChange={e =>
              setStationData({ ...stationData, wifiName: e.target.value })
            }
            sx={{ mb: 3, maxWidth: 400 }}
            placeholder="e.g., Home_WiFi"
          />

          <Alert severity="success" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
              🔒 <strong>Secure Connection:</strong> Your weather station
              connects directly to Weather Network using encrypted protocols. Your
              home network stays completely secure!
          </Alert>

          <Box>
            {isConnecting ? (
              <Box>
                <CircularProgress sx={{ mb: 2 }} />
                <Typography>Connecting your weather station...</Typography>
                <Typography variant="body2" color="text.secondary">
                    This usually takes 30-60 seconds
                </Typography>
              </Box>
            ) : (
              <Button
                variant="contained"
                size="large"
                onClick={handleWifiConnect}
                disabled={!stationData.wifiName && !stationData.stationType}
              >
                  Connect Weather Station
              </Button>
            )}
          </Box>
        </Box>
      );

    case 2:
      return (
        <Box sx={{ textAlign: 'center' }}>
          <DevicesIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
              Set Your Location
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
              Where is your weather station located? This helps us validate your
              data.
          </Typography>

          <TextField
            fullWidth
            label="Your Address or City"
            value={stationData.location}
            onChange={e =>
              setStationData({ ...stationData, location: e.target.value })
            }
            sx={{ mb: 3, maxWidth: 400 }}
            placeholder="e.g., San Francisco, CA"
          />

          <Alert severity="info" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
              💡 <strong>Privacy Note:</strong> We only use your general
              location to verify weather data accuracy. Your exact address stays
              private!
          </Alert>

          <Button
            variant="contained"
            size="large"
            onClick={handleLocationSet}
            disabled={!stationData.location}
          >
              Complete Setup & Start Earning!
          </Button>
        </Box>
      );

    case 3:
      return (
        <Box sx={{ textAlign: 'center' }}>
          <CheckCircleIcon
            sx={{ fontSize: 80, color: 'success.main', mb: 2 }}
          />
          <Typography variant="h4" gutterBottom color="success.main">
              🎉 Congratulations!
          </Typography>
          <Typography variant="h6" sx={{ mb: 3 }}>
              Your weather station is now contributing weather data!
          </Typography>

          <Card sx={{ maxWidth: 400, mx: 'auto', mb: 4 }}>
            <CardContent>
              <Typography variant="h3" color="primary" gutterBottom>
                {earnings.toFixed(4)} credits
              </Typography>
              <Typography variant="body2" color="text.secondary">
                  Contribution score increased!
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Chip label="🌡️ Temperature: +0.1 credits" sx={{ m: 0.5 }} />
                <Chip label="💨 Wind Speed: +0.15 credits" sx={{ m: 0.5 }} />
                <Chip label="💧 Humidity: +0.08 credits" sx={{ m: 0.5 }} />
              </Box>
            </CardContent>
          </Card>

          <Alert severity="success" sx={{ mb: 3 }}>
            <strong>Station Status: Online</strong>
            <br />
              📊 Data quality: Excellent
            <br />
              🔄 Updates: Every 5 minutes
            <br />
              💰 Daily contribution score: ~0.5-0.8
          </Alert>

          <Grid
            container
            spacing={2}
            sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}
          >
            <Grid item xs={12} sm={6}>
              <Button variant="contained" fullWidth href="/dashboard">
                  View Your Dashboard
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button variant="outlined" fullWidth href="/rewards">
                  See All Rewards
              </Button>
            </Grid>
          </Grid>
        </Box>
      );

    default:
      return null;
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
      <Typography variant="h3" align="center" gutterBottom sx={{ mb: 2 }}>
        🌤️ Super Simple Weather Station Setup
      </Typography>

      <Typography
        variant="h6"
        align="center"
        sx={{ mb: 4, color: 'text.secondary' }}
      >
        Earn contribution points by sharing weather data from your backyard!
        <br />
        <strong>Setup time: Under 5 minutes</strong> ⏰
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 6 }}>
        {steps.map(label => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Card>
        <CardContent sx={{ p: 4 }}>{renderStepContent(activeStep)}</CardContent>
      </Card>

      {activeStep === 3 && (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            📞 Need Help?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Call our friendly support team: <strong>1-800-WEATHER-HELP</strong>
            <br />
            Or email: <strong>support@weather-network.com</strong>
            <br />
            We're here to help you succeed!
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default WeatherStationSetup;
