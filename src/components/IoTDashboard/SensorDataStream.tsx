import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Button,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Timeline as TimelineIcon,
  ThermostatAuto as ThermostatIcon,
  Water as HumidityIcon,
  Air as AirIcon,
  Speed as SpeedIcon,
  Compress as PressureIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';
import { SensorPlatform, SensorData as ApiSensorData } from '../../services/api';
import { useIoTWebSocket } from '../../hooks/useIoTWebSocket';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  BarElement,
);

interface SensorDataStreamProps {
  platforms: SensorPlatform[];
  selectedPlatform: SensorPlatform | null;
}

interface StreamData {
  timestamp: number;
  measurements: { [key: string]: number };
  deviceId: string;
  platform: string;
  location: { latitude: number; longitude: number };
}

interface ChartDataset {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
  tension: number;
}

const SensorDataStream: React.FC<SensorDataStreamProps> = ({
  platforms,
  selectedPlatform,
}) => {
  const theme = useTheme();
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>([
    'temperature',
    'humidity',
  ]);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('1h');
  const [autoScale, setAutoScale] = useState(true);
  const [showRealTime, setShowRealTime] = useState(true);
  const [maxDataPoints] = useState(100);

  const {
    data: rawSensorData,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    clearData: clearRawData,
  } = useIoTWebSocket('/sensor-stream', {
    location: selectedLocation,
    dataTypes: selectedDataTypes,
    autoReconnect: true,
  });

  const connectionStatus = isConnecting ? 'connecting' : isConnected ? 'connected' : 'disconnected';
  const isStreaming = isConnected || isConnecting;

  // Convert ApiSensorData → StreamData, keeping last maxDataPoints
  const streamData = useMemo<StreamData[]>(() => {
    const converted = rawSensorData.map((sd: ApiSensorData) => ({
      timestamp: sd.timestamp,
      measurements: Object.fromEntries(
        Object.entries(sd.measurements ?? {}).map(([k, v]) => [k, (v as any)?.value ?? v]),
      ),
      deviceId: sd.deviceId ?? '',
      platform: sd.platform ?? '',
      location: { latitude: sd.location?.latitude ?? 0, longitude: sd.location?.longitude ?? 0 },
    }));
    return converted.slice(-maxDataPoints);
  }, [rawSensorData, maxDataPoints]);

  const locations = [
    { id: 'all', name: 'All Locations' },
  ];

  const availableDataTypes = [
    {
      id: 'temperature',
      name: 'Temperature',
      unit: '°C',
      color: '#ef4444',
      icon: ThermostatIcon,
    },
    {
      id: 'humidity',
      name: 'Humidity',
      unit: '%',
      color: '#3b82f6',
      icon: HumidityIcon,
    },
    {
      id: 'pressure',
      name: 'Pressure',
      unit: 'hPa',
      color: '#10b981',
      icon: PressureIcon,
    },
    {
      id: 'air_quality',
      name: 'Air Quality',
      unit: 'AQI',
      color: '#f59e0b',
      icon: AirIcon,
    },
    {
      id: 'wind_speed',
      name: 'Wind Speed',
      unit: 'm/s',
      color: '#8b5cf6',
      icon: SpeedIcon,
    },
    {
      id: 'pm2.5',
      name: 'PM2.5',
      unit: 'µg/m³',
      color: '#ec4899',
      icon: AirIcon,
    },
  ];

  const startStreaming = useCallback(() => {
    if (!isStreaming) connect();
  }, [isStreaming, connect]);

  const stopStreaming = useCallback(() => {
    if (isStreaming) disconnect();
  }, [isStreaming, disconnect]);

  const clearData = () => {
    clearRawData();
  };

  const exportData = () => {
    const dataToExport = streamData.map(item => ({
      timestamp: new Date(item.timestamp).toISOString(),
      platform: item.platform,
      deviceId: item.deviceId,
      location: item.location,
      ...item.measurements,
    }));

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sensor_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  // Prepare chart data
  const chartData = useMemo(() => {
    const labels = streamData
      .map(item => new Date(item.timestamp).toLocaleTimeString())
      .slice(-50); // Show last 50 points on chart

    const datasets: ChartDataset[] = selectedDataTypes
      .map(dataType => {
        const dataTypeInfo = availableDataTypes.find(dt => dt.id === dataType);
        if (!dataTypeInfo) return null;

        return {
          label: `${dataTypeInfo.name} (${dataTypeInfo.unit})`,
          data: streamData
            .map(item => item.measurements[dataType] || 0)
            .slice(-50),
          borderColor: dataTypeInfo.color,
          backgroundColor: alpha(dataTypeInfo.color, 0.1),
          tension: 0.4,
        };
      })
      .filter(Boolean) as ChartDataset[];

    return { labels, datasets };
  }, [streamData, selectedDataTypes, availableDataTypes]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: showRealTime ? 750 : 0,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Real-time Sensor Data Stream',
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time',
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Value',
        },
        beginAtZero: !autoScale,
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  // Calculate statistics
  const statistics = useMemo(() => {
    if (streamData.length === 0) return {};

    const stats: {
      [key: string]: { min: number; max: number; avg: number; current: number };
    } = {};

    selectedDataTypes.forEach(dataType => {
      const values = streamData
        .map(item => item.measurements[dataType])
        .filter(v => v !== undefined);
      if (values.length > 0) {
        stats[dataType] = {
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          current: values[values.length - 1] || 0,
        };
      }
    });

    return stats;
  }, [streamData, selectedDataTypes]);

  const StatCard: React.FC<{ dataType: string; stats: any }> = ({
    dataType,
    stats,
  }) => {
    const dataTypeInfo = availableDataTypes.find(dt => dt.id === dataType);
    if (!dataTypeInfo) return null;

    const IconComponent = dataTypeInfo.icon;

    return (
      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                backgroundColor: alpha(dataTypeInfo.color, 0.1),
                color: dataTypeInfo.color,
              }}
            >
              <IconComponent />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" color={dataTypeInfo.color}>
                {stats.current.toFixed(1)} {dataTypeInfo.unit}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {dataTypeInfo.name}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Min: {stats.min.toFixed(1)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Avg: {stats.avg.toFixed(1)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Max: {stats.max.toFixed(1)}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 3 }}>
            <Stack direction="row" spacing={1}>
              <Tooltip title={isStreaming ? 'Pause Stream' : 'Start Stream'}>
                <IconButton
                  onClick={isStreaming ? stopStreaming : startStreaming}
                  color={isStreaming ? 'warning' : 'success'}
                  disabled={connectionStatus === 'connecting'}
                >
                  {connectionStatus === 'connecting' ? (
                    <CircularProgress size={24} />
                  ) : isStreaming ? (
                    <PauseIcon />
                  ) : (
                    <PlayIcon />
                  )}
                </IconButton>
              </Tooltip>

              <Tooltip title="Stop Stream">
                <IconButton onClick={stopStreaming} disabled={!isStreaming}>
                  <StopIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Clear Data">
                <IconButton onClick={clearData}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Export Data">
                <IconButton
                  onClick={exportData}
                  disabled={streamData.length === 0}
                >
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Location</InputLabel>
              <Select
                value={selectedLocation}
                onChange={e => setSelectedLocation(e.target.value)}
                label="Location"
              >
                {locations.map(location => (
                  <MenuItem key={location.id} value={location.id}>
                    {location.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Data Types</InputLabel>
              <Select
                multiple
                value={selectedDataTypes}
                onChange={e => setSelectedDataTypes(e.target.value as string[])}
                renderValue={selected => `${selected.length} selected`}
                label="Data Types"
              >
                {availableDataTypes.map(dataType => (
                  <MenuItem key={dataType.id} value={dataType.id}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <dataType.icon
                        sx={{ fontSize: 16, color: dataType.color }}
                      />
                      <Typography>{dataType.name}</Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                onChange={e => setTimeRange(e.target.value as any)}
                label="Time Range"
              >
                <MenuItem value="1h">1 Hour</MenuItem>
                <MenuItem value="6h">6 Hours</MenuItem>
                <MenuItem value="24h">24 Hours</MenuItem>
                <MenuItem value="7d">7 Days</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoScale}
                    onChange={e => setAutoScale(e.target.checked)}
                    size="small"
                  />
                }
                label="Auto Scale"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={showRealTime}
                    onChange={e => setShowRealTime(e.target.checked)}
                    size="small"
                  />
                }
                label="Animations"
              />
            </Stack>
          </Grid>
        </Grid>

        {/* Status Bar */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 2 }}>
          <Chip
            label={connectionStatus}
            color={
              connectionStatus === 'connected'
                ? 'success'
                : connectionStatus === 'connecting'
                  ? 'warning'
                  : 'default'
            }
            size="small"
          />
          <Typography variant="body2" color="text.secondary">
            Data Points: {streamData.length}
          </Typography>
          {selectedPlatform && (
            <Typography variant="body2" color="text.secondary">
              Platform: {selectedPlatform.name}
            </Typography>
          )}
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      {Object.keys(statistics).length > 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {Object.entries(statistics).map(([dataType, stats]) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }} key={dataType}>
              <StatCard dataType={dataType} stats={stats} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Main Chart */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ height: 400 }}>
          {streamData.length > 0 ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'text.secondary',
              }}
            >
              <Stack alignItems="center" spacing={2}>
                <TimelineIcon sx={{ fontSize: 48 }} />
                <Typography variant="h6">No Data Available</Typography>
                <Typography variant="body2">
                  Start streaming to see real-time sensor data
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<PlayIcon />}
                  onClick={startStreaming}
                  disabled={isStreaming}
                >
                  Start Streaming
                </Button>
              </Stack>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Data Grid/Table */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Recent Data Points
        </Typography>
        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
          {streamData
            .slice(-10)
            .reverse()
            .map((data, index) => (
              <Card key={index} sx={{ mb: 1, backgroundColor: 'grey.50' }}>
                <CardContent sx={{ py: 1 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(data.timestamp).toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Device: {data.deviceId}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 9 }}>
                      <Stack
                        direction="row"
                        spacing={2}
                        flexWrap="wrap"
                        gap={1}
                      >
                        {selectedDataTypes.map(dataType => {
                          const value = data.measurements[dataType];
                          const dataTypeInfo = availableDataTypes.find(
                            dt => dt.id === dataType,
                          );
                          if (value === undefined || !dataTypeInfo) return null;

                          return (
                            <Chip
                              key={dataType}
                              label={`${dataTypeInfo.name}: ${value.toFixed(1)} ${dataTypeInfo.unit}`}
                              size="small"
                              sx={{
                                backgroundColor: alpha(dataTypeInfo.color, 0.1),
                                color: dataTypeInfo.color,
                              }}
                            />
                          );
                        })}
                      </Stack>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default SensorDataStream;
