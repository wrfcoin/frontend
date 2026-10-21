import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  Stack,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
  Alert,
} from '@mui/material';
import {
  LocationOn as LocationOnIcon,
  Layers as LayersIcon,
  FilterList as FilterListIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  MyLocation as MyLocationIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ExpandLess,
  ExpandMore,
  DeviceHub as DeviceHubIcon,
  ThermostatAuto as ThermostatIcon,
  Water as HumidityIcon,
  Air as AirIcon,
  Explore as CompassIcon,
} from '@mui/icons-material';
import { SensorPlatform, SensorData, sensorAPI } from '../../services/api';

interface SensorMapViewProps {
  platforms: SensorPlatform[];
  selectedPlatform: SensorPlatform | null;
  onPlatformSelect: (platform: SensorPlatform) => void;
}

interface MapLocation {
  id: string;
  latitude: number;
  longitude: number;
  platform: string;
  deviceCount: number;
  dataTypes: string[];
  status: 'active' | 'inactive' | 'maintenance';
  lastUpdate: Date;
}

interface MapCluster {
  id: string;
  latitude: number;
  longitude: number;
  deviceCount: number;
  platforms: string[];
  radius: number;
}

const SensorMapView: React.FC<SensorMapViewProps> = ({
  platforms,
  selectedPlatform,
  onPlatformSelect,
}) => {
  const [mapLocations, setMapLocations] = useState<MapLocation[]>([]);
  const [mapClusters, setMapClusters] = useState<MapCluster[]>([]);
  const [visibleLayers, setVisibleLayers] = useState<string[]>([]);
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>([]);
  const [clustering, setClustering] = useState(true);
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.006 }); // NYC default
  const [mapZoom, setMapZoom] = useState(3);
  const [expandedFilters, setExpandedFilters] = useState(false);
  const [heatmapOverlay, setHeatmapOverlay] = useState(false);

  // Mock sensor locations data (in a real app, this would come from the API)
  const mockLocations: MapLocation[] = useMemo(
    () => [
      {
        id: 'loc-1',
        latitude: 40.7128,
        longitude: -74.006,
        platform: 'helium',
        deviceCount: 1250,
        dataTypes: ['location', 'environmental', 'connectivity'],
        status: 'active',
        lastUpdate: new Date(),
      },
      {
        id: 'loc-2',
        latitude: 51.5074,
        longitude: -0.1278,
        platform: 'sensor_community',
        deviceCount: 892,
        dataTypes: ['pm2.5', 'pm10', 'temperature', 'humidity'],
        status: 'active',
        lastUpdate: new Date(),
      },
      {
        id: 'loc-3',
        latitude: 35.6762,
        longitude: 139.6503,
        platform: 'iotex',
        deviceCount: 567,
        dataTypes: ['temperature', 'humidity', 'air_quality'],
        status: 'active',
        lastUpdate: new Date(),
      },
      {
        id: 'loc-4',
        latitude: 37.7749,
        longitude: -122.4194,
        platform: 'ttn',
        deviceCount: 423,
        dataTypes: ['temperature', 'humidity', 'location'],
        status: 'maintenance',
        lastUpdate: new Date(),
      },
      {
        id: 'loc-5',
        latitude: 52.52,
        longitude: 13.405,
        platform: 'streamr',
        deviceCount: 234,
        dataTypes: ['environmental', 'traffic', 'energy'],
        status: 'active',
        lastUpdate: new Date(),
      },
    ],
    [],
  );

  useEffect(() => {
    setMapLocations(mockLocations);
    setVisibleLayers(platforms.map(p => p.id));

    // Initialize with all available data types
    const allDataTypes = [...new Set(platforms.flatMap(p => p.data_types))];
    setSelectedDataTypes(allDataTypes);
  }, [platforms, mockLocations]);

  useEffect(() => {
    if (clustering) {
      generateClusters();
    }
  }, [mapLocations, clustering, mapZoom]);

  const generateClusters = () => {
    // Simple clustering algorithm for demo
    const clusters: MapCluster[] = [];
    const processed = new Set<string>();
    const clusterRadius = 100; // km

    mapLocations.forEach(location => {
      if (processed.has(location.id)) return;

      const nearbyLocations = mapLocations.filter(other => {
        if (processed.has(other.id) || other.id === location.id) return false;

        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          other.latitude,
          other.longitude,
        );

        return distance <= clusterRadius;
      });

      if (nearbyLocations.length > 0) {
        const allLocations = [location, ...nearbyLocations];
        const totalDevices = allLocations.reduce(
          (sum, loc) => sum + loc.deviceCount,
          0,
        );
        const uniquePlatforms = [
          ...new Set(allLocations.map(loc => loc.platform)),
        ];

        // Calculate cluster center
        const centerLat =
          allLocations.reduce((sum, loc) => sum + loc.latitude, 0) /
          allLocations.length;
        const centerLng =
          allLocations.reduce((sum, loc) => sum + loc.longitude, 0) /
          allLocations.length;

        clusters.push({
          id: `cluster-${clusters.length}`,
          latitude: centerLat,
          longitude: centerLng,
          deviceCount: totalDevices,
          platforms: uniquePlatforms,
          radius: clusterRadius,
        });

        allLocations.forEach(loc => processed.add(loc.id));
      } else {
        // Single location cluster
        clusters.push({
          id: `cluster-${clusters.length}`,
          latitude: location.latitude,
          longitude: location.longitude,
          deviceCount: location.deviceCount,
          platforms: [location.platform],
          radius: 0,
        });
        processed.add(location.id);
      }
    });

    setMapClusters(clusters);
  };

  const calculateDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const filteredLocations = mapLocations.filter(
    location =>
      visibleLayers.includes(location.platform) &&
      location.dataTypes.some(type => selectedDataTypes.includes(type)),
  );

  const getDataTypeIcon = (dataType: string) => {
    switch (dataType) {
    case 'temperature':
      return <ThermostatIcon />;
    case 'humidity':
      return <HumidityIcon />;
    case 'air_quality':
    case 'pm2.5':
    case 'pm10':
      return <AirIcon />;
    case 'location':
      return <CompassIcon />;
    default:
      return <DeviceHubIcon />;
    }
  };

  const getPlatformColor = (platformId: string): string => {
    const colors: { [key: string]: string } = {
      helium: '#6366f1',
      sensor_community: '#10b981',
      iotex: '#f59e0b',
      ttn: '#3b82f6',
      streamr: '#8b5cf6',
      foam: '#ef4444',
      iota: '#06b6d4',
      openaq: '#84cc16',
      openforis: '#f97316',
    };
    return colors[platformId] || '#6b7280';
  };

  const LocationCard: React.FC<{ location: MapLocation }> = ({ location }) => {
    const platform = platforms.find(p => p.id === location.platform);
    if (!platform) return null;

    return (
      <Card
        sx={{
          mb: 2,
          border:
            selectedPlatform?.id === location.platform
              ? `2px solid ${getPlatformColor(location.platform)}`
              : '1px solid #e5e7eb',
        }}
      >
        <CardContent>
          <Stack spacing={2}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="flex-start"
            >
              <Box>
                <Typography variant="h6">{platform.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {(location.deviceCount ?? 0).toLocaleString()} devices
                </Typography>
              </Box>
              <Chip
                label={location.status}
                size="small"
                color={
                  location.status === 'active'
                    ? 'success'
                    : location.status === 'maintenance'
                      ? 'warning'
                      : 'error'
                }
              />
            </Stack>

            <Box>
              <Typography variant="body2" gutterBottom>
                <LocationOnIcon sx={{ fontSize: 14, mr: 1 }} />
                {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" gutterBottom>
                Data Types:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                {location.dataTypes.map(type => (
                  <Chip
                    key={type}
                    icon={getDataTypeIcon(type)}
                    label={type}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.75rem' }}
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    );
  };

  return (
    <Grid container spacing={3}>
      {/* Map Controls and Filters */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Stack spacing={2}>
            <Typography variant="h6">Map Controls</Typography>

            <Stack direction="row" spacing={1}>
              <Tooltip title="Zoom In">
                <IconButton
                  onClick={() => setMapZoom(prev => Math.min(prev + 1, 18))}
                >
                  <ZoomInIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Zoom Out">
                <IconButton
                  onClick={() => setMapZoom(prev => Math.max(prev - 1, 1))}
                >
                  <ZoomOutIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Center on My Location">
                <IconButton
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(position => {
                        setMapCenter({
                          lat: position.coords.latitude,
                          lng: position.coords.longitude,
                        });
                        setMapZoom(10);
                      });
                    }
                  }}
                >
                  <MyLocationIcon />
                </IconButton>
              </Tooltip>
            </Stack>

            <FormControlLabel
              control={
                <Switch
                  checked={clustering}
                  onChange={e => setClustering(e.target.checked)}
                />
              }
              label="Cluster nearby sensors"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={heatmapOverlay}
                  onChange={e => setHeatmapOverlay(e.target.checked)}
                />
              }
              label="Show heatmap overlay"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={realTimeUpdates}
                  onChange={e => setRealTimeUpdates(e.target.checked)}
                />
              }
              label="Real-time updates"
            />
          </Stack>
        </Paper>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Stack spacing={2}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              onClick={() => setExpandedFilters(!expandedFilters)}
              sx={{ cursor: 'pointer' }}
            >
              <Typography variant="h6">
                <FilterListIcon sx={{ mr: 1 }} />
                Filters
              </Typography>
              {expandedFilters ? <ExpandLess /> : <ExpandMore />}
            </Stack>

            <Collapse in={expandedFilters}>
              <Stack spacing={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Visible Platforms</InputLabel>
                  <Select
                    multiple
                    value={visibleLayers}
                    onChange={e => setVisibleLayers(e.target.value as string[])}
                    renderValue={selected => `${selected.length} platforms`}
                  >
                    {platforms.map(platform => (
                      <MenuItem key={platform.id} value={platform.id}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              backgroundColor: getPlatformColor(platform.id),
                            }}
                          />
                          <Typography>{platform.name}</Typography>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>Data Types</InputLabel>
                  <Select
                    multiple
                    value={selectedDataTypes}
                    onChange={e =>
                      setSelectedDataTypes(e.target.value as string[])
                    }
                    renderValue={selected => `${selected.length} types`}
                  >
                    {[...new Set(platforms.flatMap(p => p.data_types))].map(
                      dataType => (
                        <MenuItem key={dataType} value={dataType}>
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1}
                          >
                            {getDataTypeIcon(dataType)}
                            <Typography>{dataType}</Typography>
                          </Stack>
                        </MenuItem>
                      ),
                    )}
                  </Select>
                </FormControl>
              </Stack>
            </Collapse>
          </Stack>
        </Paper>

        {/* Location List */}
        <Paper sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            Sensor Locations ({filteredLocations.length})
          </Typography>
          {filteredLocations.map(location => (
            <LocationCard key={location.id} location={location} />
          ))}
        </Paper>
      </Grid>

      {/* Map Display */}
      <Grid size={{ xs: 12, md: 8 }}>
        <Paper sx={{ p: 2, height: 600 }}>
          <Typography variant="h6" gutterBottom>
            Interactive Sensor Map
          </Typography>

          {/* Mock Map Display */}
          <Box
            sx={{
              width: '100%',
              height: 500,
              backgroundColor: '#f0f9ff',
              border: '2px dashed #3b82f6',
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              backgroundImage: `
                radial-gradient(circle at 25% 25%, #3b82f6 2px, transparent 2px),
                radial-gradient(circle at 75% 75%, #10b981 2px, transparent 2px),
                radial-gradient(circle at 50% 50%, #f59e0b 2px, transparent 2px)
              `,
              backgroundSize: '100px 100px, 120px 120px, 80px 80px',
            }}
          >
            <Alert severity="info" sx={{ mb: 2 }}>
              Interactive map integration with Mapbox/Google Maps would be
              implemented here
            </Alert>

            <Typography variant="h6" color="primary" gutterBottom>
              Global IoT Sensor Network
            </Typography>

            <Typography variant="body1" color="text.secondary" align="center">
              Zoom: {mapZoom}x | Center: {mapCenter.lat.toFixed(4)},{' '}
              {mapCenter.lng.toFixed(4)}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              sx={{ mt: 1 }}
            >
              {clustering ? 'Clustering enabled' : 'Individual markers'} |
              {heatmapOverlay ? ' Heatmap overlay active' : ' Standard view'} |
              {realTimeUpdates ? ' Live updates' : ' Static data'}
            </Typography>

            {/* Mock sensor points */}
            {filteredLocations.slice(0, 5).map((location, index) => (
              <Box
                key={location.id}
                sx={{
                  position: 'absolute',
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: getPlatformColor(location.platform),
                  top: `${20 + index * 15}%`,
                  left: `${30 + index * 10}%`,
                  boxShadow: 2,
                  animation: realTimeUpdates ? 'pulse 2s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                    '100%': { opacity: 1 },
                  },
                }}
              />
            ))}
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default SensorMapView;
