import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  CircularProgress,
  useTheme,
  useMediaQuery,
  SwipeableDrawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Fab,
  Slide,
  Stack,
  ButtonBase,
  alpha,
  Avatar,
  LinearProgress,
  Badge,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Sensors as SensorsIcon,
  DeviceHub as DeviceHubIcon,
  LocationOn as LocationOnIcon,
  Refresh as RefreshIcon,
  Menu as MenuIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Wifi as WiFiIcon,
  WifiOff as WifiOffIcon,
  Close as CloseIcon,
  SwipeLeft as SwipeLeftIcon,
  TouchApp as TouchAppIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { sensorAPI, SensorPlatform, IoTMetrics } from '../../services/api';

interface MobileSensorDashboardProps {
  onPlatformSelect?: (platform: SensorPlatform) => void;
  compact?: boolean;
}

const MobileSensorDashboard: React.FC<MobileSensorDashboardProps> = ({
  onPlatformSelect,
  compact = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  const [platforms, setPlatforms] = useState<SensorPlatform[]>([]);
  const [metrics, setMetrics] = useState<IoTMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] =
    useState<SensorPlatform | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Touch handlers for swipe gestures
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      setRefreshing(true);
      const [platformsData, metricsData] = await Promise.all([
        sensorAPI.getPlatforms(),
        sensorAPI.getMetrics(),
      ]);

      setPlatforms(platformsData);
      setMetrics(metricsData);
      setLastUpdated(new Date());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch sensor data',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Show tutorial for first-time mobile users
    if (isMobile && !localStorage.getItem('mobile-sensor-tutorial-seen')) {
      setShowTutorial(true);
      localStorage.setItem('mobile-sensor-tutorial-seen', 'true');
    }
  }, [fetchData, isMobile]);

  // Touch gesture handling for swiping between platforms
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentIndex < platforms.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handlePlatformSelect = (platform: SensorPlatform, index: number) => {
    setSelectedPlatform(platform);
    setCurrentIndex(index);
    onPlatformSelect?.(platform);

    // Haptic feedback on modern mobile browsers
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
    case 'active':
      return theme.palette.success.main;
    case 'inactive':
      return theme.palette.error.main;
    case 'maintenance':
      return theme.palette.warning.main;
    default:
      return theme.palette.grey[500];
    }
  };

  const getDeviceCount = (platform: SensorPlatform): number => {
    return (
      platform.devices ||
      platform.sensors ||
      platform.hotspots ||
      platform.stations ||
      platform.total_devices ||
      0
    );
  };

  // Mobile-optimized metrics display
  const MobileMetricsRow: React.FC = () => (
    <Stack direction="row" spacing={1} sx={{ mb: 2, overflowX: 'auto', pb: 1 }}>
      <Card sx={{ minWidth: 120, flexShrink: 0 }}>
        <CardContent sx={{ p: '12px !important', textAlign: 'center' }}>
          <DeviceHubIcon color="primary" sx={{ fontSize: 20 }} />
          <Typography variant="h6" sx={{ fontSize: '1.2rem', mt: 0.5 }}>
            {metrics?.totalDevices.toLocaleString() || 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Devices
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ minWidth: 120, flexShrink: 0 }}>
        <CardContent sx={{ p: '12px !important', textAlign: 'center' }}>
          <WiFiIcon color="success" sx={{ fontSize: 20 }} />
          <Typography variant="h6" sx={{ fontSize: '1.2rem', mt: 0.5 }}>
            {metrics?.activeNetworks || 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Networks
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ minWidth: 120, flexShrink: 0 }}>
        <CardContent sx={{ p: '12px !important', textAlign: 'center' }}>
          <SensorsIcon color="info" sx={{ fontSize: 20 }} />
          <Typography variant="h6" sx={{ fontSize: '1.2rem', mt: 0.5 }}>
            {metrics?.networkUptime || '—'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Uptime
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ minWidth: 120, flexShrink: 0 }}>
        <CardContent sx={{ p: '12px !important', textAlign: 'center' }}>
          <Avatar
            sx={{
              width: 20,
              height: 20,
              fontSize: '0.7rem',
              bgcolor: theme.palette.warning.main,
              mx: 'auto',
            }}
          >
            ms
          </Avatar>
          <Typography variant="h6" sx={{ fontSize: '1.2rem', mt: 0.5 }}>
            {metrics?.avgLatency || '—'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Latency
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );

  // Mobile platform card with touch-optimized design
  const MobilePlatformCard: React.FC<{
    platform: SensorPlatform;
    index: number;
  }> = ({ platform, index }) => (
    <Card
      sx={{
        minHeight: 220,
        position: 'relative',
        border:
          selectedPlatform?.id === platform.id
            ? `2px solid ${theme.palette.primary.main}`
            : `1px solid ${theme.palette.divider}`,
        borderRadius: 3,
        overflow: 'hidden',
        '&:active': {
          transform: 'scale(0.98)',
          transition: 'transform 0.1s ease-in-out',
        },
      }}
    >
      <ButtonBase
        sx={{
          width: '100%',
          height: '100%',
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'flex-start',
          p: 0,
        }}
        onClick={() => handlePlatformSelect(platform, index)}
      >
        <CardContent sx={{ p: 2, flex: 1, width: '100%' }}>
          {/* Header */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
            mb={2}
          >
            <Box flex={1}>
              <Typography
                variant="h6"
                noWrap
                sx={{ fontSize: '1.1rem', fontWeight: 600 }}
              >
                {platform.name}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textTransform: 'uppercase' }}
              >
                {platform.type.replace(/_/g, ' ')}
              </Typography>
            </Box>

            <Stack alignItems="flex-end" spacing={0.5}>
              <Chip
                label={platform.status}
                size="small"
                sx={{
                  backgroundColor: alpha(getStatusColor(platform.status), 0.1),
                  color: getStatusColor(platform.status),
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: 20,
                }}
              />
              {platform.status === 'active' ? (
                <WiFiIcon
                  sx={{ fontSize: 14, color: theme.palette.success.main }}
                />
              ) : (
                <WifiOffIcon
                  sx={{ fontSize: 14, color: theme.palette.error.main }}
                />
              )}
            </Stack>
          </Stack>

          {/* Device count and location */}
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <DeviceHubIcon
              sx={{ fontSize: 16, color: theme.palette.text.secondary }}
            />
            <Typography variant="body2" fontWeight={600}>
              {getDeviceCount(platform).toLocaleString()} devices
            </Typography>
            <LocationOnIcon
              sx={{ fontSize: 16, color: theme.palette.text.secondary, ml: 1 }}
            />
            <Typography variant="body2" color="text.secondary" noWrap flex={1}>
              {platform.coverage}
            </Typography>
          </Stack>

          {/* Specialization */}
          <Typography variant="body2" color="text.secondary" mb={1.5}>
            <strong>Focus:</strong> {platform.specialization.replace(/_/g, ' ')}
          </Typography>

          {/* Data types chips */}
          <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
            {platform.data_types.slice(0, 3).map((type: string) => (
              <Chip
                key={type}
                label={type}
                size="small"
                variant="outlined"
                sx={{
                  fontSize: '0.65rem',
                  height: 18,
                  '& .MuiChip-label': { px: 0.5 },
                }}
              />
            ))}
            {platform.data_types.length > 3 && (
              <Chip
                label={`+${platform.data_types.length - 3}`}
                size="small"
                variant="outlined"
                sx={{
                  fontSize: '0.65rem',
                  height: 18,
                  '& .MuiChip-label': { px: 0.5 },
                }}
              />
            )}
          </Stack>
        </CardContent>
      </ButtonBase>
    </Card>
  );

  // Platform navigation drawer
  const PlatformDrawer: React.FC = () => (
    <SwipeableDrawer
      anchor="left"
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      onOpen={() => setDrawerOpen(true)}
      sx={{
        '& .MuiDrawer-paper': {
          width: 280,
          maxWidth: '80vw',
        },
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="h6">Sensor Networks</Typography>
          <IconButton onClick={() => setDrawerOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </Box>

      <List>
        {platforms.map((platform, index) => (
          <ListItem
            key={platform.id}
            component={ButtonBase}
            onClick={() => {
              handlePlatformSelect(platform, index);
              setDrawerOpen(false);
            }}
            sx={{
              flexDirection: 'column',
              alignItems: 'flex-start',
              p: 2,
              borderBottom: 1,
              borderColor: 'divider',
              backgroundColor:
                selectedPlatform?.id === platform.id
                  ? alpha(theme.palette.primary.main, 0.1)
                  : 'transparent',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2} width="100%">
              <ListItemIcon sx={{ minWidth: 'auto' }}>
                <Badge
                  color={platform.status === 'active' ? 'success' : 'error'}
                  variant="dot"
                >
                  <SensorsIcon />
                </Badge>
              </ListItemIcon>

              <Box flex={1}>
                <ListItemText
                  primary={platform.name}
                  secondary={`${getDeviceCount(platform).toLocaleString()} devices`}
                  primaryTypographyProps={{
                    fontWeight: 600,
                    fontSize: '0.9rem',
                  }}
                  secondaryTypographyProps={{ fontSize: '0.8rem' }}
                />
              </Box>

              <Chip
                label={platform.status}
                size="small"
                sx={{
                  backgroundColor: alpha(getStatusColor(platform.status), 0.1),
                  color: getStatusColor(platform.status),
                  fontSize: '0.7rem',
                  height: 20,
                }}
              />
            </Stack>
          </ListItem>
        ))}
      </List>
    </SwipeableDrawer>
  );

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight={compact ? 300 : 400}
        p={3}
      >
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary" mt={2}>
          Loading sensor data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Card sx={{ m: 2 }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <WarningIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
          <Typography variant="h6" color="error" gutterBottom>
            Connection Error
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            {error}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
            <IconButton onClick={fetchData} color="primary" size="large">
              <RefreshIcon />
            </IconButton>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ position: 'relative', minHeight: compact ? 300 : '100vh' }}>
      {/* Header */}
      <Box sx={{ p: 2, pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
          <IconButton
            onClick={() => setDrawerOpen(true)}
            size="small"
            sx={{
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
              },
            }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            sx={{ fontSize: '1.3rem', fontWeight: 600, flex: 1 }}
          >
            IoT Sensors
          </Typography>

          <IconButton
            onClick={fetchData}
            disabled={refreshing}
            size="small"
            sx={{
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
              },
            }}
          >
            <RefreshIcon
              sx={{
                animation: refreshing ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                },
              }}
            />
          </IconButton>
        </Stack>

        <Typography variant="body2" color="text.secondary" mb={2}>
          Swipe to navigate • Tap to select
        </Typography>
      </Box>

      {/* Metrics Overview */}
      <Box sx={{ px: 2 }}>
        <MobileMetricsRow />
      </Box>

      {/* Platform Cards with Swipe Navigation */}
      <Box
        sx={{ px: 2, pb: 2 }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {platforms.length > 0 && (
          <>
            <Slide direction="left" in={true} timeout={300}>
              <Box>
                <MobilePlatformCard
                  platform={platforms[currentIndex]}
                  index={currentIndex}
                />
              </Box>
            </Slide>

            {/* Navigation indicators */}
            <Stack direction="row" justifyContent="center" spacing={1} mt={2}>
              {platforms.map((_, index) => (
                <Box
                  key={index}
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor:
                      index === currentIndex
                        ? theme.palette.primary.main
                        : theme.palette.grey[300],
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  onClick={() => setCurrentIndex(index)}
                />
              ))}
            </Stack>

            {/* Platform counter */}
            <Typography
              variant="caption"
              color="text.secondary"
              align="center"
              display="block"
              mt={1}
            >
              {currentIndex + 1} of {platforms.length} networks
            </Typography>
          </>
        )}
      </Box>

      {/* Swipe tutorial for new users */}
      <Snackbar
        open={showTutorial}
        onClose={() => setShowTutorial(false)}
        autoHideDuration={5000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowTutorial(false)}
          severity="info"
          icon={<SwipeLeftIcon />}
          sx={{ alignItems: 'center' }}
        >
          Swipe left/right to browse sensor networks!
        </Alert>
      </Snackbar>

      {/* Platform Navigation Drawer */}
      <PlatformDrawer />

      {/* Floating Action for Quick Access */}
      {!compact && selectedPlatform && (
        <Fab
          color="primary"
          size="small"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
          }}
          onClick={() => onPlatformSelect?.(selectedPlatform)}
        >
          <TouchAppIcon />
        </Fab>
      )}
    </Box>
  );
};

export default MobileSensorDashboard;
