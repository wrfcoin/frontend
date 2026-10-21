import DemoSurfaceGate from '../common/DemoSurfaceGate';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Tabs,
  Tab,
  IconButton,
  Button,
  Tooltip,
  Badge,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';

// Individual icon imports to avoid import errors
import PsychologyIcon from '@mui/icons-material/Psychology';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SpeedIcon from '@mui/icons-material/Speed';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MemoryIcon from '@mui/icons-material/Memory';
import StorageIcon from '@mui/icons-material/Storage';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import DataUsageIcon from '@mui/icons-material/DataUsage';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import DeviceHubIcon from '@mui/icons-material/DeviceHub';

/**
 * AI/ML Dashboard Component for WRFCoin Platform
 *
 * Comprehensive dashboard showing:
 * 1. AI Model Performance Metrics
 * 2. Machine Learning Jobs
 * 3. Data Pipeline Visualization
 * 4. Model Marketplace
 */
const AIMLDashboardSample = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');

  // Simulate real-time data updates
  useEffect(() => {
    const loadData = () => {
      setDashboardData(getMockDashboardData());
      setLoading(false);
    };

    loadData();

    // Set up real-time updates
    let interval;
    if (realTimeUpdates) {
      interval = setInterval(() => {
        setDashboardData(getMockDashboardData());
      }, 5000); // Update every 5 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [realTimeUpdates]);

  // Mock data generator with realistic AI/ML metrics
  const getMockDashboardData = () => ({
    overview: {
      totalModels: 12456,
      activeModels: 8924,
      dailyInferences: 1234567,
      averageAccuracy: 94.7,
      totalGpuHours: 156780,
      costSavings: 45600,
      carbonFootprint: 0.023, // kg CO2 per inference
    },

    modelPerformance: [
      {
        id: 'weather-forecast-v4',
        name: 'WeatherForecast v4.2',
        type: 'Weather Prediction',
        accuracy: 97.8,
        status: 'active',
        dailyInferences: 45000,
        latency: 120, // ms
        resourceUsage: 78,
        lastUpdated: new Date().toISOString(),
        specialty: 'Temperature & Precipitation',
      },
      {
        id: 'carbon-tracker-v3',
        name: 'CarbonTracker v3.1',
        type: 'Carbon Analysis',
        accuracy: 96.2,
        status: 'active',
        dailyInferences: 23000,
        latency: 85,
        resourceUsage: 65,
        lastUpdated: new Date().toISOString(),
        specialty: 'Emissions Monitoring',
      },
      {
        id: 'pattern-recognition-v2',
        name: 'PatternRecognition v2.5',
        type: 'Data Analysis',
        accuracy: 94.1,
        status: 'training',
        dailyInferences: 12000,
        latency: 200,
        resourceUsage: 45,
        lastUpdated: new Date().toISOString(),
        specialty: 'Anomaly Detection',
      },
      {
        id: 'ocean-health-v1',
        name: 'OceanHealth v1.8',
        type: 'Environmental',
        accuracy: 92.7,
        status: 'active',
        dailyInferences: 8500,
        latency: 150,
        resourceUsage: 52,
        lastUpdated: new Date().toISOString(),
        specialty: 'Marine Ecosystem',
      },
    ],

    trainingJobs: [
      {
        id: 'job-001',
        modelName: 'WeatherForecast v4.3',
        status: 'running',
        progress: 78,
        eta: '2h 15m',
        gpuHours: 45.2,
        dataSize: '2.3 TB',
        startTime: new Date(Date.now() - 3600000).toISOString(),
        estimatedCost: 156.78,
      },
      {
        id: 'job-002',
        modelName: 'AirQuality Predictor v2.1',
        status: 'queued',
        progress: 0,
        eta: '4h 30m',
        gpuHours: 0,
        dataSize: '1.8 TB',
        startTime: null,
        estimatedCost: 203.45,
      },
      {
        id: 'job-003',
        modelName: 'CarbonFootprint Analyzer v1.5',
        status: 'completed',
        progress: 100,
        eta: 'Complete',
        gpuHours: 23.7,
        dataSize: '950 GB',
        startTime: new Date(Date.now() - 7200000).toISOString(),
        estimatedCost: 89.23,
      },
      {
        id: 'job-004',
        modelName: 'Climate Pattern Recognition',
        status: 'failed',
        progress: 34,
        eta: 'Failed',
        gpuHours: 12.1,
        dataSize: '3.1 TB',
        startTime: new Date(Date.now() - 1800000).toISOString(),
        estimatedCost: 0,
        error: 'Insufficient memory allocation',
      },
    ],

    dataPipeline: {
      ingestionRate: 2340, // records/minute
      processingLatency: 1.2, // seconds
      dataQualityScore: 96.8,
      featuresGenerated: 1456789,
      storageUsed: '45.7 TB',
      pipelines: [
        {
          name: 'Weather Data Ingestion',
          status: 'healthy',
          throughput: 850,
          errorRate: 0.02,
          lastRun: new Date().toISOString(),
        },
        {
          name: 'Carbon Data Processing',
          status: 'healthy',
          throughput: 450,
          errorRate: 0.01,
          lastRun: new Date().toISOString(),
        },
        {
          name: 'Feature Engineering',
          status: 'warning',
          throughput: 680,
          errorRate: 0.15,
          lastRun: new Date().toISOString(),
        },
        {
          name: 'Model Training Data Prep',
          status: 'healthy',
          throughput: 360,
          errorRate: 0.03,
          lastRun: new Date().toISOString(),
        },
      ],
    },

    modelMarketplace: [
      {
        id: 'mp-001',
        name: 'Advanced Weather Predictor Pro',
        category: 'Weather Forecasting',
        accuracy: 98.5,
        price: 0.05, // WRF per inference
        rating: 4.8,
        downloads: 2456,
        provider: 'WeatherAI Labs',
        description: 'State-of-the-art weather prediction with 15-day accuracy',
        tags: ['weather', 'forecasting', 'precipitation', 'temperature'],
      },
      {
        id: 'mp-002',
        name: 'Carbon Footprint Calculator',
        category: 'Environmental',
        accuracy: 96.2,
        price: 0.03,
        rating: 4.6,
        downloads: 1834,
        provider: 'EcoMetrics Inc',
        description: 'Precise carbon footprint calculations for businesses',
        tags: ['carbon', 'emissions', 'sustainability', 'tracking'],
      },
      {
        id: 'mp-003',
        name: 'Ocean Health Monitor',
        category: 'Marine Science',
        accuracy: 94.7,
        price: 0.08,
        rating: 4.9,
        downloads: 967,
        provider: 'OceanTech Solutions',
        description: 'Comprehensive ocean health analysis and monitoring',
        tags: ['ocean', 'marine', 'ecosystem', 'monitoring'],
      },
      {
        id: 'mp-004',
        name: 'Air Quality Predictor',
        category: 'Environmental',
        accuracy: 93.4,
        price: 0.04,
        rating: 4.5,
        downloads: 3201,
        provider: 'CleanAir Analytics',
        description: 'Real-time air quality predictions and alerts',
        tags: ['air-quality', 'pollution', 'health', 'alerts'],
      },
    ],

    resourceUtilization: {
      cpuUsage: 67,
      gpuUsage: 84,
      memoryUsage: 72,
      storageUsage: 58,
      networkBandwidth: 45,
      costs: {
        daily: 234.56,
        monthly: 7036.8,
        yearly: 84441.6,
      },
    },
  });

  const getStatusColor = status => {
    switch (status) {
    case 'active':
    case 'healthy':
    case 'completed':
      return 'success';
    case 'training':
    case 'running':
    case 'queued':
      return 'primary';
    case 'warning':
      return 'warning';
    case 'failed':
    case 'error':
      return 'error';
    default:
      return 'default';
    }
  };

  const getStatusIcon = status => {
    switch (status) {
    case 'active':
    case 'healthy':
    case 'completed':
      return <CheckCircleIcon />;
    case 'training':
    case 'running':
      return <PlayArrowIcon />;
    case 'queued':
      return <ScheduleIcon />;
    case 'warning':
      return <WarningIcon />;
    case 'failed':
    case 'error':
      return <ErrorIcon />;
    default:
      return <InfoIcon />;
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setDashboardData(getMockDashboardData());
      setLoading(false);
    }, 1000);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 400,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading AI/ML Dashboard...
        </Typography>
      </Box>
    );
  }

  const renderModelPerformanceTab = () => (
    <Box>
      {/* Performance Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PsychologyIcon color="primary" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Active Models
                </Typography>
              </Box>
              <Typography variant="h4" component="div">
                {dashboardData.overview.activeModels.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                of {dashboardData.overview.totalModels.toLocaleString()} total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ShowChartIcon color="success" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Daily Inferences
                </Typography>
              </Box>
              <Typography variant="h4" component="div">
                {(dashboardData.overview.dailyInferences / 1000000).toFixed(1)}M
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {dashboardData.overview.dailyInferences.toLocaleString()} total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AssessmentIcon color="primary" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Avg Accuracy
                </Typography>
              </Box>
              <Typography variant="h4" component="div">
                {dashboardData.overview.averageAccuracy}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Across all models
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <MonetizationOnIcon color="success" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Cost Savings
                </Typography>
              </Box>
              <Typography variant="h4" component="div">
                ${(dashboardData.overview.costSavings / 1000).toFixed(0)}K
              </Typography>
              <Typography variant="body2" color="textSecondary">
                vs traditional computing
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Model Performance Table */}
      <Card>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <TrendingUpIcon color="primary" />
            Model Performance Metrics
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Model</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Status</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Accuracy</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Daily Inferences</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Latency</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Resource Usage</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Specialty</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dashboardData.modelPerformance.map(model => (
                  <TableRow key={model.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">
                          {model.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {model.type}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(model.status)}
                        label={
                          model.status.charAt(0).toUpperCase() +
                          model.status.slice(1)
                        }
                        color={getStatusColor(model.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Typography variant="body2">
                          {model.accuracy}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={model.accuracy}
                          sx={{ width: 60, height: 6 }}
                          color={
                            model.accuracy >= 95
                              ? 'success'
                              : model.accuracy >= 90
                                ? 'primary'
                                : 'warning'
                          }
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      {model.dailyInferences.toLocaleString()}
                    </TableCell>
                    <TableCell>{model.latency}ms</TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Typography variant="body2">
                          {model.resourceUsage}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={model.resourceUsage}
                          sx={{ width: 40, height: 4 }}
                          color={
                            model.resourceUsage >= 80
                              ? 'error'
                              : model.resourceUsage >= 60
                                ? 'warning'
                                : 'success'
                          }
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={model.specialty}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );

  const renderTrainingJobsTab = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <MemoryIcon color="primary" />
                Training Jobs
              </Typography>
              {dashboardData.trainingJobs.map(job => (
                <Card key={job.id} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 2,
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {job.modelName}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Job ID: {job.id}
                        </Typography>
                      </Box>
                      <Chip
                        icon={getStatusIcon(job.status)}
                        label={
                          job.status.charAt(0).toUpperCase() +
                          job.status.slice(1)
                        }
                        color={getStatusColor(job.status)}
                        size="small"
                      />
                    </Box>

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="textSecondary">
                          Progress
                        </Typography>
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <LinearProgress
                            variant="determinate"
                            value={job.progress}
                            sx={{ flexGrow: 1, height: 8 }}
                            color={
                              job.status === 'failed' ? 'error' : 'primary'
                            }
                          />
                          <Typography variant="body2">
                            {job.progress}%
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="textSecondary">
                          ETA
                        </Typography>
                        <Typography variant="body2">{job.eta}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="textSecondary">
                          GPU Hours
                        </Typography>
                        <Typography variant="body2">{job.gpuHours}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="textSecondary">
                          Data Size
                        </Typography>
                        <Typography variant="body2">{job.dataSize}</Typography>
                      </Grid>
                    </Grid>

                    {job.error && (
                      <Alert severity="error" sx={{ mb: 1 }}>
                        <Typography variant="body2">{job.error}</Typography>
                      </Alert>
                    )}

                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant="body2" color="textSecondary">
                        Estimated Cost: ${job.estimatedCost}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {job.status === 'running' && (
                          <>
                            <IconButton size="small" color="warning">
                              <PauseIcon />
                            </IconButton>
                            <IconButton size="small" color="error">
                              <StopIcon />
                            </IconButton>
                          </>
                        )}
                        {job.status === 'queued' && (
                          <IconButton size="small" color="primary">
                            <PlayArrowIcon />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <SpeedIcon color="primary" />
                Resource Utilization
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecundary" gutterBottom>
                  CPU Usage
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={dashboardData.resourceUtilization.cpuUsage}
                    sx={{ flexGrow: 1, height: 6 }}
                    color="primary"
                  />
                  <Typography variant="body2">
                    {dashboardData.resourceUtilization.cpuUsage}%
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecundary" gutterBottom>
                  GPU Usage
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={dashboardData.resourceUtilization.gpuUsage}
                    sx={{ flexGrow: 1, height: 6 }}
                    color="warning"
                  />
                  <Typography variant="body2">
                    {dashboardData.resourceUtilization.gpuUsage}%
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecundary" gutterBottom>
                  Memory Usage
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={dashboardData.resourceUtilization.memoryUsage}
                    sx={{ flexGrow: 1, height: 6 }}
                    color="success"
                  />
                  <Typography variant="body2">
                    {dashboardData.resourceUtilization.memoryUsage}%
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="textSecundary" gutterBottom>
                  Storage Usage
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={dashboardData.resourceUtilization.storageUsage}
                    sx={{ flexGrow: 1, height: 6 }}
                    color="info"
                  />
                  <Typography variant="body2">
                    {dashboardData.resourceUtilization.storageUsage}%
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Cost Breakdown
              </Typography>
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
              >
                <Typography variant="body2" color="textSecondary">
                  Daily:
                </Typography>
                <Typography variant="body2">
                  ${dashboardData.resourceUtilization.costs.daily}
                </Typography>
              </Box>
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
              >
                <Typography variant="body2" color="textSecondary">
                  Monthly:
                </Typography>
                <Typography variant="body2">
                  ${dashboardData.resourceUtilization.costs.monthly}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="textSecondary">
                  Yearly:
                </Typography>
                <Typography variant="body2">
                  ${dashboardData.resourceUtilization.costs.yearly}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderDataPipelineTab = () => (
    <Box>
      {/* Pipeline Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <DataUsageIcon color="primary" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Ingestion Rate
                </Typography>
              </Box>
              <Typography variant="h4" component="div">
                {(dashboardData.dataPipeline.ingestionRate / 1000).toFixed(1)}K
              </Typography>
              <Typography variant="body2" color="textSecondary">
                records/minute
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SpeedIcon color="success" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Processing Latency
                </Typography>
              </Box>
              <Typography variant="h4" component="div">
                {dashboardData.dataPipeline.processingLatency}s
              </Typography>
              <Typography variant="body2" color="textSecondary">
                average response time
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Data Quality
                </Typography>
              </Box>
              <Typography variant="h4" component="div">
                {dashboardData.dataPipeline.dataQualityScore}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                quality score
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <StorageIcon color="primary" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Storage Used
                </Typography>
              </Box>
              <Typography variant="h4" component="div">
                {dashboardData.dataPipeline.storageUsed}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                total data stored
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pipeline Status */}
      <Card>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <AccountTreeIcon color="primary" />
            Data Pipeline Status
          </Typography>

          <Grid container spacing={2}>
            {dashboardData.dataPipeline.pipelines.map((pipeline, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card variant="outlined">
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 2,
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight="bold">
                        {pipeline.name}
                      </Typography>
                      <Chip
                        icon={getStatusIcon(pipeline.status)}
                        label={
                          pipeline.status.charAt(0).toUpperCase() +
                          pipeline.status.slice(1)
                        }
                        color={getStatusColor(pipeline.status)}
                        size="small"
                      />
                    </Box>

                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">
                          Throughput
                        </Typography>
                        <Typography variant="body2">
                          {pipeline.throughput} rec/min
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">
                          Error Rate
                        </Typography>
                        <Typography
                          variant="body2"
                          color={
                            pipeline.errorRate > 0.1
                              ? 'error'
                              : pipeline.errorRate > 0.05
                                ? 'warning'
                                : 'textPrimary'
                          }
                        >
                          {(pipeline.errorRate * 100).toFixed(2)}%
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="textSecondary">
                          Last Run
                        </Typography>
                        <Typography variant="body2">
                          {new Date(pipeline.lastRun).toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );

  const renderModelMarketplaceTab = () => (
    <Box>
      <Grid container spacing={3}>
        {dashboardData.modelMarketplace.map(model => (
          <Grid item xs={12} sm={6} md={4} key={model.id}>
            <Card
              sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    {model.name}
                  </Typography>
                  <Chip
                    label={model.category}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>

                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ mb: 2 }}
                >
                  {model.description}
                </Typography>

                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
                >
                  <CheckCircleIcon color="success" fontSize="small" />
                  <Typography variant="body2">
                    {model.accuracy}% accuracy
                  </Typography>
                </Box>

                <Box
                  sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}
                >
                  {model.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Typography variant="body2" color="textSecondary">
                    by {model.provider}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2">★ {model.rating}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      ({model.downloads})
                    </Typography>
                  </Box>
                </Box>
              </CardContent>

              <Box sx={{ p: 2, pt: 0 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" color="primary">
                    {model.price} WRF
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    per inference
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<ShoppingCartIcon />}
                  color="primary"
                >
                  Deploy Model
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <PsychologyIcon color="primary" sx={{ fontSize: 40 }} />
          AI/ML Dashboard
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={realTimeUpdates}
                onChange={e => setRealTimeUpdates(e.target.checked)}
                color="primary"
              />
            }
            label="Real-time Updates"
          />

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={selectedTimeRange}
              label="Time Range"
              onChange={e => setSelectedTimeRange(e.target.value)}
            >
              <MenuItem value="1h">1 Hour</MenuItem>
              <MenuItem value="24h">24 Hours</MenuItem>
              <MenuItem value="7d">7 Days</MenuItem>
              <MenuItem value="30d">30 Days</MenuItem>
            </Select>
          </FormControl>

          <IconButton onClick={handleRefresh} color="primary">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab
            label="Model Performance"
            icon={<TrendingUpIcon />}
            iconPosition="start"
          />
          <Tab
            label="Training Jobs"
            icon={<MemoryIcon />}
            iconPosition="start"
          />
          <Tab
            label="Data Pipeline"
            icon={<AccountTreeIcon />}
            iconPosition="start"
          />
          <Tab
            label="Model Marketplace"
            icon={<ShoppingCartIcon />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {currentTab === 0 && renderModelPerformanceTab()}
      {currentTab === 1 && renderTrainingJobsTab()}
      {currentTab === 2 && renderDataPipelineTab()}
      {currentTab === 3 && renderModelMarketplaceTab()}
    </Box>
  );
};

const AIMLDashboard = (props) => (
  <DemoSurfaceGate
    testId="ai-ml-dashboard"
    title="AI and ML dashboard is not live on this testnet"
    description="This preview contains illustrative data or simulated actions, not verified testnet results."
  >
    <AIMLDashboardSample {...props} />
  </DemoSurfaceGate>
);

export default AIMLDashboard;
