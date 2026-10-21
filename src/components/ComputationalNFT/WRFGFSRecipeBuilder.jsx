import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  LinearProgress,
  Alert,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Slider,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Timeline as TimelineIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material';
import {
  useForecastTaskResults,
  useForecastTaskStatus,
  useSubmitForecastTask,
} from '../../hooks/api/useComputeQueries';

const TX_EXPLORER_BASE_URL = 'https://etherscan.io/tx/';
const DEFAULT_RECIPE = {
  model: '',
  datasets: [],
  computeEnvironment: '',
  validation: '',
  storage: '',
  region: '',
  resolution: '',
  forecastHours: 48,
  carbonOffset: false,
  academicEndorsement: false,
};

function toIpfsGatewayUrl(value) {
  if (!value || typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const cid = trimmed.replace(/^ipfs:\/\//, '');
  return `https://ipfs.io/ipfs/${cid}`;
}

function toTransactionExplorerUrl(value) {
  if (!value || typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `${TX_EXPLORER_BASE_URL}${trimmed}`;
}

function renderLinkedValue(value, href) {
  if (!value) return 'receipt pending';
  if (!href) return value;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {value}
    </a>
  );
}

function getConfigurationChecks(recipe) {
  const datasetCount = recipe.datasets.length;
  const hasEnvironment = Boolean(recipe.computeEnvironment);
  const hasValidation = Boolean(recipe.validation);
  const hasResolution = Boolean(recipe.resolution);
  const hasForecastHours = Number(recipe.forecastHours) > 0;

  return [
    {
      id: 'model',
      label: 'Choose a forecast model',
      detail: recipe.model
        ? `Selected ${recipe.model.toUpperCase()}`
        : 'Pick a model to unlock job estimation.',
      satisfied: Boolean(recipe.model),
    },
    {
      id: 'datasets',
      label: 'Select supporting datasets',
      detail: datasetCount
        ? `${datasetCount} dataset${datasetCount === 1 ? '' : 's'} selected`
        : 'Add at least one dataset for calibration and verification.',
      satisfied: datasetCount > 0,
    },
    {
      id: 'compute',
      label: 'Configure compute and validation',
      detail:
        hasEnvironment && hasValidation
          ? `${recipe.computeEnvironment} + ${recipe.validation}`
          : 'Choose a compute provider and validation method.',
      satisfied: hasEnvironment && hasValidation,
    },
    {
      id: 'forecast',
      label: 'Finalize forecast horizon',
      detail:
        hasResolution && hasForecastHours
          ? `${recipe.resolution || 'standard'} resolution / ${recipe.forecastHours}h horizon`
          : 'Pick a resolution and forecast horizon.',
      satisfied: hasResolution && hasForecastHours,
    },
  ];
}

function getConfigurationProgress(checks) {
  if (!checks.length) return 0;

  const satisfiedCount = checks.filter(check => check.satisfied).length;
  return Math.round((satisfiedCount / checks.length) * 100);
}

function formatTaskTimestamp(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTaskDateTime(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function describeTaskStatusUpdate(snapshot) {
  const status = String(snapshot?.status || '').toLowerCase();
  const taskId = snapshot?.taskId ? ` ${snapshot.taskId}` : '';
  const progress =
    typeof snapshot?.progress === 'number'
      ? ` at ${Math.round(snapshot.progress)}%`
      : '';

  if (status === 'queued') {
    return `Task queued${taskId}.`;
  }

  if (status === 'running') {
    return `Task running${progress}${taskId}.`;
  }

  if (status === 'processing') {
    return `Task processing${progress}${taskId}.`;
  }

  if (status === 'completed') {
    return `Task completed${taskId}. Results are ready to review.`;
  }

  if (status === 'cancelled') {
    return `Task cancelled${taskId}.`;
  }

  if (status === 'failed') {
    return snapshot?.error
      ? `Task failed${taskId}: ${snapshot.error}`
      : `Task failed${taskId}.`;
  }

  if (status === 'pending') {
    return snapshot?.message || 'Task submission pending.';
  }

  return '';
}

function describeTaskResultUpdate(snapshot) {
  const artifacts = [
    snapshot?.outputCid ? 'output CID' : null,
    snapshot?.verificationReportCid ? 'verification report' : null,
    snapshot?.receiptTxHash ? 'receipt transaction' : null,
  ].filter(Boolean);

  if (!artifacts.length) {
    return 'Result payload received.';
  }

  return `Results ready: ${artifacts.join(', ')}.`;
}

function prependTaskActivity(setTaskActivityLog, entries) {
  if (!entries.length) return;

  setTaskActivityLog(prev => [...entries, ...prev].slice(0, 8));
}

const WRFGFSRecipeBuilder = ({ initialStep = 0, initialRecipe = {} }) => {
  const [activeStep, setActiveStep] = useState(initialStep);
  const [selectedCategory, setSelectedCategory] = useState('Weather Models');
  const [recipe, setRecipe] = useState({
    ...DEFAULT_RECIPE,
    ...initialRecipe,
  });
  const [costEstimate, setCostEstimate] = useState({
    base: 0,
    multipliers: {},
    total: 0,
    rewards: {},
  });
  const [validationResults, setValidationResults] = useState({});
  const [activeTaskId, setActiveTaskId] = useState('');
  const [lastSubmittedRecipe, setLastSubmittedRecipe] = useState(null);
  const [taskActivityLog, setTaskActivityLog] = useState([]);
  const [toast, setToast] = useState({ open: false, severity: 'success', message: '' });

  const submitForecastTask = useSubmitForecastTask();
  const taskStatusQuery = useForecastTaskStatus(activeTaskId || undefined);
  const taskResultsQuery = useForecastTaskResults(
    activeTaskId || undefined,
    ['completed', 'failed', 'cancelled'].includes(
      String(taskStatusQuery.data?.status || '').toLowerCase(),
    ),
  );
  const taskStatusSignatureRef = useRef('');
  const taskResultsSignatureRef = useRef('');
  const configurationChecks = getConfigurationChecks(recipe);
  const configurationProgress = getConfigurationProgress(configurationChecks);
  const configurationReady = configurationProgress === 100;
  const taskStatus = String(validationResults.status || '').toLowerCase();
  const taskIsActive = ['queued', 'running', 'pending', 'processing'].includes(
    taskStatus,
  );
  const taskLogLabel = taskIsActive
    ? 'Live'
    : taskStatus === 'failed'
      ? 'Blocked'
      : taskStatus === 'completed'
        ? 'Complete'
        : taskStatus === 'cancelled'
          ? 'Cancelled'
          : 'Idle';
  const taskLogTone =
    taskStatus === 'failed'
      ? 'error'
      : taskStatus === 'completed'
        ? 'success'
        : taskIsActive
          ? 'info'
          : 'default';
  const taskProgressValue =
    typeof validationResults.progress === 'number'
      ? Math.max(0, Math.min(100, Math.round(validationResults.progress)))
      : taskStatus === 'completed'
        ? 100
        : null;
  const taskSnapshotUpdatedAt =
    validationResults.updatedAt || validationResults.submittedAt || '';

  const algorithmCategories = [
    'Weather Models',
    'Air Quality',
    'Ocean & Hydrology',
    'Wildfire Risk',
    'Climate Models',
    'Humanitarian Intelligence',
    'AI & ML Models',
  ];

  const algorithmModels = {
    'Weather Models': [
      {
        id: 'gfs',
        name: 'Global Forecast System (GFS)',
        description:
          'High-resolution global numerical weather prediction system with comprehensive physics parameters.',
        accuracy: 'Very High',
        compute: 'Very High',
        baseReward: 420,
        icon: '🌍',
        color: '#2196F3',
        tags: ['Global Weather', 'Medium-range Forecasts', 'Synoptic Patterns'],
      },
      {
        id: 'wrf',
        name: 'Weather Research and Forecasting (WRF)',
        description:
          'Next-generation mesoscale numerical weather prediction system designed for atmospheric research and forecasting.',
        accuracy: 'Very High',
        compute: 'Extreme',
        baseReward: 510,
        icon: '🌪️',
        color: '#4CAF50',
        tags: ['Mesoscale', 'Research', 'High Resolution'],
      },
      {
        id: 'ecmwf',
        name: 'ECMWF Model',
        description:
          'Global numerical weather prediction model operated by the European Centre for Medium-Range Weather Forecasts.',
        accuracy: 'Very High',
        compute: 'High',
        baseReward: 380,
        icon: '🇪🇺',
        color: '#9C27B0',
        tags: ['European', 'Global', 'Medium-range'],
      },
      {
        id: 'nam',
        name: 'North American Mesoscale (NAM)',
        description:
          'Regional forecasts for North America with high-resolution for detailed forecasting in complex terrain.',
        accuracy: 'High',
        compute: 'Regional',
        baseReward: 280,
        icon: '🗺️',
        color: '#FF9800',
        tags: ['North America', 'Regional', 'High Resolution'],
      },
      {
        id: 'arome',
        name: 'AROME',
        description:
          'High-resolution mesoscale forecasting model from Météo-France for complex terrain and convection.',
        accuracy: 'Very High',
        compute: 'Local Terrain',
        baseReward: 320,
        icon: '🗻',
        color: '#E91E63',
        tags: ['France', 'Mesoscale', 'Complex Terrain'],
      },
      {
        id: 'pysteps',
        name: 'PySTEPS',
        description:
          'Optical Flow-based Precipitation Tracking nowcasting system for very short-term rainfall predictions.',
        accuracy: 'Nowcasting',
        compute: 'Short-term',
        baseReward: 180,
        icon: '🌧️',
        color: '#00BCD4',
        tags: ['Nowcasting', 'Precipitation', 'Short-term'],
      },
      {
        id: 'trec',
        name: 'TREC',
        description:
          'Radar Echo Tracking by Correlation for immediate precipitation forecasting from radar data.',
        accuracy: 'Nowcasting',
        compute: 'Radar-based',
        baseReward: 220,
        icon: '📡',
        color: '#FF5722',
        tags: ['Radar', 'Immediate', 'Precipitation'],
      },
      {
        id: 'convlstm',
        name: 'ConvLSTM Nowcasting',
        description:
          'Convolutional LSTM-based deep learning model for predicting precipitation from radar sequences.',
        accuracy: 'Deep Learning',
        compute: 'Nowcasting',
        baseReward: 340,
        icon: '🧠',
        color: '#673AB7',
        tags: ['Deep Learning', 'LSTM', 'Radar Sequences'],
      },
      {
        id: 'gem',
        name: 'Global Environmental Multiscale (GEM)',
        description:
          'Integrated forecasting and data assimilation system developed by the Meteorological Service of Canada.',
        accuracy: 'High',
        compute: 'Medium',
        baseReward: 290,
        icon: '🍁',
        color: '#795548',
        tags: ['Canada', 'Global', 'Multiscale'],
      },
      {
        id: 'ukmo',
        name: 'UK Met Office Unified Model',
        description:
          'Numerical weather prediction and climate modeling system used by the UK Met Office.',
        accuracy: 'High',
        compute: 'High',
        baseReward: 350,
        icon: '🇬🇧',
        color: '#607D8B',
        tags: ['UK', 'Unified', 'Climate'],
      },
      {
        id: 'mpas',
        name: 'Model for Prediction Across Scales',
        description:
          'Variable-resolution climate and weather model designed for local to global forecasting on unstructured grids.',
        accuracy: 'Very High',
        compute: 'Very High',
        baseReward: 420,
        icon: '⚡',
        color: '#3F51B5',
        tags: ['Variable Resolution', 'Global', 'Unstructured'],
      },
      {
        id: 'ifs',
        name: 'Integrated Forecasting System',
        description:
          'ECMWF\'s operational global forecast model with ensemble prediction capabilities.',
        accuracy: 'Very High',
        compute: 'Extreme',
        baseReward: 480,
        icon: '🔮',
        color: '#009688',
        tags: ['ECMWF', 'Ensemble', 'Global'],
      },
    ],
    'Air Quality': [
      {
        id: 'wrf-chem',
        name: 'WRF-Chem',
        description:
          'Atmospheric chemistry and air quality forecasting with comprehensive chemical transport modeling.',
        accuracy: 'Very High',
        compute: 'Extreme',
        baseReward: 450,
        icon: '🏭',
        color: '#FF5722',
        tags: ['Chemistry', 'Air Quality', 'Transport'],
      },
      {
        id: 'cmaq',
        name: 'CMAQ (Community Multiscale Air Quality)',
        description:
          'EPA\'s premier air quality modeling system for regulatory and research applications.',
        accuracy: 'High',
        compute: 'High',
        baseReward: 380,
        icon: '🌫️',
        color: '#795548',
        tags: ['EPA', 'Regulatory', 'Multiscale'],
      },
      {
        id: 'calpuff',
        name: 'CALPUFF',
        description:
          'Non-steady-state puff dispersion model for complex terrain and meteorological conditions.',
        accuracy: 'High',
        compute: 'Medium',
        baseReward: 280,
        icon: '💨',
        color: '#607D8B',
        tags: ['Dispersion', 'Complex Terrain', 'Puff Model'],
      },
      {
        id: 'aermod',
        name: 'AERMOD',
        description:
          'EPA\'s preferred regulatory dispersion model for near-field applications in flat and complex terrain.',
        accuracy: 'High',
        compute: 'Medium',
        baseReward: 320,
        icon: '🌬️',
        color: '#9E9E9E',
        tags: ['EPA', 'Regulatory', 'Near-field'],
      },
    ],
    'Ocean & Hydrology': [
      {
        id: 'wrf-hydro',
        name: 'WRF-Hydro',
        description:
          'Hydrological modeling extension to WRF for coupled land-atmosphere-hydrology predictions.',
        accuracy: 'Very High',
        compute: 'High',
        baseReward: 420,
        icon: '🌊',
        color: '#2196F3',
        tags: ['Hydrology', 'Coupled', 'Land-Atmosphere'],
      },
      {
        id: 'hec-ras',
        name: 'HEC-RAS',
        description:
          'River Analysis System for hydraulic modeling of water flow through rivers and floodplains.',
        accuracy: 'High',
        compute: 'Medium',
        baseReward: 290,
        icon: '🏞️',
        color: '#4CAF50',
        tags: ['Hydraulic', 'Rivers', 'Floodplains'],
      },
      {
        id: 'swmm',
        name: 'SWMM (Storm Water Management Model)',
        description:
          'Dynamic rainfall-runoff simulation model for urban stormwater management and flood prediction.',
        accuracy: 'High',
        compute: 'Medium',
        baseReward: 310,
        icon: '🏙️',
        color: '#00BCD4',
        tags: ['Urban', 'Stormwater', 'Runoff'],
      },
      {
        id: 'delft3d',
        name: 'Delft3D',
        description:
          'Integrated modeling suite for coastal, river and estuarine areas including flow, waves, and morphology.',
        accuracy: 'Very High',
        compute: 'Very High',
        baseReward: 480,
        icon: '🏖️',
        color: '#FF9800',
        tags: ['Coastal', 'Estuarine', 'Morphology'],
      },
    ],
    'Wildfire Risk': [
      {
        id: 'wrf-fire',
        name: 'WRF-Fire',
        description:
          'Coupled atmosphere-fire modeling system for wildfire behavior prediction and smoke forecasting.',
        accuracy: 'Very High',
        compute: 'Extreme',
        baseReward: 520,
        icon: '🔥',
        color: '#FF5722',
        tags: ['Fire Behavior', 'Smoke', 'Coupled'],
      },
      {
        id: 'farsite',
        name: 'FARSITE',
        description:
          'Fire Area Simulator for spatial and temporal modeling of fire growth on heterogeneous landscapes.',
        accuracy: 'High',
        compute: 'High',
        baseReward: 380,
        icon: '🌲',
        color: '#795548',
        tags: ['Fire Growth', 'Landscapes', 'Spatial'],
      },
      {
        id: 'elmfire',
        name: 'ELMFIRE',
        description:
          'Eulerian Level set Method for FIRE spread modeling with data assimilation capabilities.',
        accuracy: 'Very High',
        compute: 'High',
        baseReward: 420,
        icon: '🛰️',
        color: '#FF9800',
        tags: ['Level Set', 'Data Assimilation', 'Spread'],
      },
    ],
    'Climate Models': [
      {
        id: 'cesm',
        name: 'Community Earth System Model (CESM)',
        description:
          'Fully coupled global climate model for investigating Earth\'s past, present, and future climate states.',
        accuracy: 'Very High',
        compute: 'Extreme',
        baseReward: 650,
        icon: '🌍',
        color: '#4CAF50',
        tags: ['Global', 'Coupled', 'Earth System'],
      },
      {
        id: 'cam',
        name: 'Community Atmosphere Model (CAM)',
        description:
          'Atmospheric component of CESM for detailed atmospheric physics and chemistry modeling.',
        accuracy: 'Very High',
        compute: 'Very High',
        baseReward: 480,
        icon: '🌤️',
        color: '#2196F3',
        tags: ['Atmosphere', 'Physics', 'Chemistry'],
      },
      {
        id: 'icon',
        name: 'ICON Climate Model',
        description:
          'Icosahedral Nonhydrostatic model developed by the German Weather Service for seamless prediction.',
        accuracy: 'Very High',
        compute: 'Extreme',
        baseReward: 580,
        icon: '❄️',
        color: '#9C27B0',
        tags: ['Icosahedral', 'Seamless', 'German'],
      },
    ],
    'Humanitarian Intelligence': [
      {
        id: 'gdacs',
        name: 'GDACS Alert System',
        description:
          'Global Disaster Alert and Coordination System for humanitarian emergency response coordination.',
        accuracy: 'High',
        compute: 'Medium',
        baseReward: 340,
        icon: '🚨',
        color: '#F44336',
        tags: ['Disaster', 'Emergency', 'Coordination'],
      },
      {
        id: 'hum-ai',
        name: 'Humanitarian AI Predictor',
        description:
          'Machine learning system for predicting humanitarian crises and resource allocation needs.',
        accuracy: 'AI-Based',
        compute: 'High',
        baseReward: 420,
        icon: '🤝',
        color: '#E91E63',
        tags: ['Crisis Prediction', 'Resource Allocation', 'ML'],
      },
    ],
    'AI & ML Models': [
      {
        id: 'ml-weather',
        name: 'ML Weather Predictor',
        description:
          'Deep learning ensemble for weather prediction using transformer architectures and satellite data.',
        accuracy: 'AI-Based',
        compute: 'GPU',
        baseReward: 450,
        icon: '🤖',
        color: '#9C27B0',
        tags: ['Deep Learning', 'Transformers', 'Satellite'],
      },
      {
        id: 'climate-gpt',
        name: 'Climate GPT',
        description:
          'Large language model fine-tuned for climate science analysis and prediction interpretation.',
        accuracy: 'Language Model',
        compute: 'GPU',
        baseReward: 380,
        icon: '🧠',
        color: '#673AB7',
        tags: ['Language Model', 'Climate Science', 'Analysis'],
      },
      {
        id: 'weather-gan',
        name: 'Weather GAN',
        description:
          'Generative Adversarial Network for high-resolution weather data synthesis and downscaling.',
        accuracy: 'Generative',
        compute: 'GPU',
        baseReward: 420,
        icon: '🎨',
        color: '#FF9800',
        tags: ['GAN', 'Synthesis', 'Downscaling'],
      },
    ],
  };

  const datasetSources = {
    'Weather Data': [
      {
        id: 'noaa-api',
        name: 'NOAA Weather API',
        description: 'Official US National Weather Service data feeds',
        type: 'API',
        endpoint: 'https://api.weather.gov',
        authentication: 'None required',
        updateFrequency: 'Hourly',
        multiplier: 1.8,
        quality: 'Very High',
        coverage: 'US + Global',
        cost: 0,
        icon: '🌡️',
        dataTypes: ['Temperature', 'Pressure', 'Wind', 'Precipitation'],
        scrapingMethod: 'REST API calls with rate limiting',
      },
      {
        id: 'openweather-api',
        name: 'OpenWeatherMap API',
        description: 'Global weather data with historical and forecast feeds',
        type: 'API',
        endpoint: 'https://api.openweathermap.org',
        authentication: 'API Key required',
        updateFrequency: '10 minutes',
        multiplier: 1.6,
        quality: 'High',
        coverage: 'Global',
        cost: 25,
        icon: '🌍',
        dataTypes: ['Current Weather', 'Forecasts', 'Historical'],
        scrapingMethod: 'Authenticated API requests',
      },
      {
        id: 'ecmwf-copernicus',
        name: 'ECMWF Copernicus Climate Data',
        description: 'European Centre for Medium-Range Weather Forecasts',
        type: 'API',
        endpoint: 'https://cds.climate.copernicus.eu/api/v2',
        authentication: 'CDS API Key',
        updateFrequency: '6 hours',
        multiplier: 2.1,
        quality: 'Very High',
        coverage: 'Global',
        cost: 0,
        icon: '🇪🇺',
        dataTypes: ['Reanalysis', 'Climate Projections', 'Satellite'],
        scrapingMethod: 'CDS API with Python client',
      },
      {
        id: 'weatherbit-api',
        name: 'Weatherbit API',
        description: 'High-resolution weather data and forecasts',
        type: 'API',
        endpoint: 'https://api.weatherbit.io/v2.0',
        authentication: 'API Key',
        updateFrequency: '15 minutes',
        multiplier: 1.4,
        quality: 'High',
        coverage: 'Global',
        cost: 30,
        icon: '⚡',
        dataTypes: ['Current', 'Hourly', 'Daily', 'Severe Weather'],
        scrapingMethod: 'RESTful API with JSON responses',
      },
    ],
    'Air Quality Data': [
      {
        id: 'openaq-api',
        name: 'OpenAQ Global Network',
        description:
          'Open air quality data from government monitoring stations',
        type: 'API',
        endpoint: 'https://api.openaq.org/v2',
        authentication: 'None required',
        updateFrequency: 'Real-time',
        multiplier: 1.7,
        quality: 'Very High',
        coverage: 'Global Cities',
        cost: 0,
        icon: '🏭',
        dataTypes: ['PM2.5', 'PM10', 'NO2', 'O3', 'SO2', 'CO'],
        scrapingMethod: 'REST API with pagination',
      },
      {
        id: 'epa-airnow',
        name: 'EPA AirNow API',
        description: 'US Environmental Protection Agency air quality data',
        type: 'API',
        endpoint: 'https://www.airnowapi.org',
        authentication: 'API Key required',
        updateFrequency: 'Hourly',
        multiplier: 1.9,
        quality: 'Very High',
        coverage: 'United States',
        cost: 0,
        icon: '🇺🇸',
        dataTypes: ['AQI', 'PM2.5', 'Ozone', 'Forecasts'],
        scrapingMethod: 'REST API with XML/JSON',
      },
      {
        id: 'purpleair-api',
        name: 'PurpleAir Sensor Network',
        description: 'Community-operated air quality sensor network',
        type: 'API',
        endpoint: 'https://api.purpleair.com/v1',
        authentication: 'API Key',
        updateFrequency: '2 minutes',
        multiplier: 1.5,
        quality: 'High',
        coverage: 'North America + Global',
        cost: 20,
        icon: '🟣',
        dataTypes: ['PM1.0', 'PM2.5', 'PM10', 'Humidity', 'Temperature'],
        scrapingMethod: 'REST API with rate limiting',
      },
      {
        id: 'sensor-community',
        name: 'Sensor.Community',
        description: 'Open environmental data from citizen science sensors',
        type: 'API',
        endpoint: 'https://api.sensor.community',
        authentication: 'None required',
        updateFrequency: '2.5 minutes',
        multiplier: 1.3,
        quality: 'Medium-High',
        coverage: 'Europe + Global',
        cost: 0,
        icon: '🌐',
        dataTypes: ['PM2.5', 'PM10', 'Temperature', 'Humidity', 'Noise'],
        scrapingMethod: 'Open API with CSV/JSON',
      },
    ],
    'Satellite & Remote Sensing': [
      {
        id: 'nasa-earthdata',
        name: 'NASA Earthdata',
        description: 'NASA Earth observation satellite data',
        type: 'API',
        endpoint: 'https://api.earthdata.nasa.gov',
        authentication: 'NASA Earthdata Login',
        updateFrequency: 'Variable by mission',
        multiplier: 2.3,
        quality: 'Very High',
        coverage: 'Global',
        cost: 0,
        icon: '🛰️',
        dataTypes: ['MODIS', 'Landsat', 'GOES', 'GPM'],
        scrapingMethod: 'CMR API + direct download',
      },
      {
        id: 'sentinel-copernicus',
        name: 'Sentinel Copernicus',
        description: 'European Space Agency Earth observation data',
        type: 'API',
        endpoint: 'https://scihub.copernicus.eu/dhus',
        authentication: 'Copernicus Account',
        updateFrequency: 'Daily',
        multiplier: 2.0,
        quality: 'Very High',
        coverage: 'Global',
        cost: 0,
        icon: '🇪🇺',
        dataTypes: ['Sentinel-1', 'Sentinel-2', 'Sentinel-3', 'Sentinel-5P'],
        scrapingMethod: 'OData API + FTP download',
      },
      {
        id: 'noaa-goes',
        name: 'NOAA GOES Satellite',
        description: 'Geostationary weather satellite imagery and data',
        type: 'API',
        endpoint: 'https://www.goes.noaa.gov/data',
        authentication: 'None required',
        updateFrequency: '15 minutes',
        multiplier: 1.8,
        quality: 'Very High',
        coverage: 'Americas',
        cost: 0,
        icon: '🛰️',
        dataTypes: ['Visible', 'Infrared', 'Water Vapor', 'Lightning'],
        scrapingMethod: 'AWS S3 bucket access',
      },
    ],
    'Hydrological Data': [
      {
        id: 'usgs-water',
        name: 'USGS Water Data',
        description: 'US Geological Survey water monitoring data',
        type: 'API',
        endpoint: 'https://waterservices.usgs.gov',
        authentication: 'None required',
        updateFrequency: '15 minutes',
        multiplier: 1.9,
        quality: 'Very High',
        coverage: 'United States',
        cost: 0,
        icon: '🌊',
        dataTypes: [
          'Stream Flow',
          'Water Level',
          'Water Quality',
          'Groundwater',
        ],
        scrapingMethod: 'REST API with XML/JSON',
      },
      {
        id: 'grdc-data',
        name: 'Global Runoff Data Centre',
        description: 'International river discharge and water level data',
        type: 'FTP',
        endpoint: 'https://www.bafg.de/GRDC',
        authentication: 'Registration required',
        updateFrequency: 'Monthly',
        multiplier: 2.2,
        quality: 'Very High',
        coverage: 'Global Rivers',
        cost: 0,
        icon: '🏞️',
        dataTypes: ['River Discharge', 'Water Level', 'Basin Metadata'],
        scrapingMethod: 'FTP download + data parsing',
      },
      {
        id: 'efas-data',
        name: 'European Flood Awareness System',
        description: 'Real-time flood monitoring and forecasting',
        type: 'API',
        endpoint: 'https://effis.jrc.ec.europa.eu',
        authentication: 'EU Account',
        updateFrequency: '6 hours',
        multiplier: 2.0,
        quality: 'Very High',
        coverage: 'Europe',
        cost: 0,
        icon: '🌊',
        dataTypes: ['Flood Forecasts', 'River Levels', 'Precipitation'],
        scrapingMethod: 'WMS/WFS services',
      },
    ],
    'Ocean Data': [
      {
        id: 'noaa-ndbc',
        name: 'NOAA National Data Buoy Center',
        description: 'Marine weather and ocean data from buoys',
        type: 'API',
        endpoint: 'https://www.ndbc.noaa.gov/data',
        authentication: 'None required',
        updateFrequency: 'Hourly',
        multiplier: 1.8,
        quality: 'Very High',
        coverage: 'US Coastal Waters',
        cost: 0,
        icon: '🌊',
        dataTypes: ['Wave Height', 'Sea Temperature', 'Wind', 'Pressure'],
        scrapingMethod: 'Text file parsing + API calls',
      },
      {
        id: 'cmems-copernicus',
        name: 'Copernicus Marine Service',
        description: 'European marine monitoring and forecasting',
        type: 'API',
        endpoint: 'https://marine.copernicus.eu',
        authentication: 'CMEMS Account',
        updateFrequency: 'Daily',
        multiplier: 2.1,
        quality: 'Very High',
        coverage: 'Global Oceans',
        cost: 0,
        icon: '🌍',
        dataTypes: ['Sea Level', 'Ocean Temperature', 'Currents', 'Salinity'],
        scrapingMethod: 'THREDDS/OPeNDAP services',
      },
    ],
    'Geological Data': [
      {
        id: 'usgs-earthquake',
        name: 'USGS Earthquake Hazards',
        description: 'Real-time earthquake monitoring and data',
        type: 'API',
        endpoint: 'https://earthquake.usgs.gov/fdsnws',
        authentication: 'None required',
        updateFrequency: 'Real-time',
        multiplier: 1.6,
        quality: 'Very High',
        coverage: 'Global',
        cost: 0,
        icon: '🌍',
        dataTypes: ['Earthquake Events', 'Magnitude', 'Depth', 'Location'],
        scrapingMethod: 'FDSN web services',
      },
    ],
  };

  const computeEnvironments = [
    {
      id: 'local-wrf',
      name: 'Local WRF Nodes',
      multiplier: 2.0,
      description: 'Dedicated weather forecasting hardware',
      reliability: 'Very High',
      cost: 120,
    },
    {
      id: 'web3-mesh',
      name: 'Decentralized Web3 Compute',
      multiplier: 1.8,
      description: 'Distributed resilient computing network',
      reliability: 'High',
      cost: 95,
    },
    {
      id: 'academic-hpc',
      name: 'Academic Computing Clusters',
      multiplier: 1.5,
      description: 'University high-performance computing',
      reliability: 'High',
      cost: 75,
    },
    {
      id: 'cloud-hybrid',
      name: 'Cloud Hybrid Deployment',
      multiplier: 1.3,
      description: 'Scalable cloud infrastructure',
      reliability: 'Medium',
      cost: 85,
    },
  ];

  const validationMethods = [
    {
      id: 'consensus',
      name: 'Consensus Accuracy Verification',
      description: '3+ validator nodes verify results',
      accuracy: '95%+',
      cost: 30,
    },
    {
      id: 'timestamp',
      name: 'Blockchain Timestamp Proofs',
      description: 'Immutable execution verification',
      accuracy: '99%+',
      cost: 20,
    },
    {
      id: 'wmo-standards',
      name: 'WMO Standards Compliance',
      description: 'World Meteorological Organization guidelines',
      accuracy: '98%+',
      cost: 40,
    },
    {
      id: 'peer-review',
      name: 'Academic Peer Review',
      description: 'Expert meteorologist validation',
      accuracy: '97%+',
      cost: 60,
    },
  ];

  const rewardDistribution = {
    dataContributors: 30,
    computeProviders: 35,
    dataKeepers: 20,
    carbonOffsetters: 15,
  };

  useEffect(() => {
    calculateCostEstimate();
  }, [recipe]);

  const calculateCostEstimate = () => {
    if (!recipe.model) return;

    // Find the selected model across all categories
    let selectedModel = null;
    for (const category of algorithmCategories) {
      const model = algorithmModels[category]?.find(m => m.id === recipe.model);
      if (model) {
        selectedModel = model;
        break;
      }
    }

    let baseCost = selectedModel?.baseReward || 0;

    const multipliers = {};
    let totalMultiplier = 1.0;

    // Dataset multipliers
    recipe.datasets.forEach(datasetId => {
      // Find dataset across all categories
      let dataset = null;
      for (const category of Object.keys(datasetSources)) {
        const found = datasetSources[category].find(d => d.id === datasetId);
        if (found) {
          dataset = found;
          break;
        }
      }

      if (dataset) {
        multipliers[dataset.name] = dataset.multiplier;
        totalMultiplier *= dataset.multiplier;
        baseCost += dataset.cost;
      }
    });

    // Compute environment multiplier
    if (recipe.computeEnvironment) {
      const compute = computeEnvironments.find(
        c => c.id === recipe.computeEnvironment,
      );
      if (compute) {
        multipliers[compute.name] = compute.multiplier;
        totalMultiplier *= compute.multiplier;
        baseCost += compute.cost;
      }
    }

    // Validation method cost
    if (recipe.validation) {
      const validation = validationMethods.find(
        v => v.id === recipe.validation,
      );
      if (validation) {
        baseCost += validation.cost;
      }
    }

    // Resolution and forecast length adjustments
    const resolutionMultiplier =
      recipe.resolution === 'high'
        ? 1.5
        : recipe.resolution === 'ultra'
          ? 2.0
          : 1.0;
    const timeMultiplier =
      recipe.forecastHours > 72 ? 1.3 : recipe.forecastHours > 48 ? 1.1 : 1.0;

    const total =
      baseCost * totalMultiplier * resolutionMultiplier * timeMultiplier;

    // Calculate reward distribution
    const rewards = {
      dataContributors: (
        (total * rewardDistribution.dataContributors) /
        100
      ).toFixed(0),
      computeProviders: (
        (total * rewardDistribution.computeProviders) /
        100
      ).toFixed(0),
      dataKeepers: ((total * rewardDistribution.dataKeepers) / 100).toFixed(0),
      carbonOffsetters: (
        (total * rewardDistribution.carbonOffsetters) /
        100
      ).toFixed(0),
    };

    setCostEstimate({
      base: baseCost,
      multipliers,
      total: total.toFixed(2),
      rewards,
    });
  };

  const handleNext = () => {
    setActiveStep(prevActiveStep => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1);
  };

  const submitRecipePayload = async payload => {
    taskStatusSignatureRef.current = '';
    taskResultsSignatureRef.current = '';
    setTaskActivityLog([
      {
        id: `${Date.now()}-submit`,
        timestamp: new Date().toISOString(),
        kind: 'info',
        message: 'Submitting recipe to compute API...',
      },
    ]);
    setValidationResults({
      status: 'pending',
      message: 'Submitting recipe to compute API...',
      taskId: '',
    });
    setActiveTaskId('');

    try {
      const submission = await submitForecastTask.mutateAsync(payload);
      if (!submission.taskId) {
        setValidationResults({
          status: 'failed',
          message: 'Submission response did not include a task identifier.',
        });
        return;
      }
      setActiveTaskId(submission.taskId);
      setValidationResults({
        status: submission.status || 'queued',
        taskId: submission.taskId,
        submittedAt: submission.createdAt,
      });
    } catch (error) {
      setValidationResults({
        status: 'failed',
        message:
          error instanceof Error
            ? error.message
            : 'Recipe submission failed. Please retry.',
      });
    }
  };

  const handleSubmitRecipe = async () => {
    const payload = {
      model: recipe.model,
      datasets: recipe.datasets,
      computeEnvironment: recipe.computeEnvironment,
      validation: recipe.validation,
      region: recipe.region,
      resolution: recipe.resolution || 'standard',
      forecastHours: recipe.forecastHours,
      carbonOffset: recipe.carbonOffset,
      academicEndorsement: recipe.academicEndorsement,
    };

    setLastSubmittedRecipe(payload);
    await submitRecipePayload(payload);
  };

  const handleRetrySubmission = async () => {
    if (!lastSubmittedRecipe) return;
    await submitRecipePayload(lastSubmittedRecipe);
  };

  useEffect(() => {
    if (!taskStatusQuery.data) return;

    const statusSnapshot = taskStatusQuery.data;
    const statusSignature = [
      activeTaskId,
      statusSnapshot.status || '',
      statusSnapshot.progress ?? '',
      statusSnapshot.updatedAt || '',
      statusSnapshot.error || '',
      Array.isArray(statusSnapshot.logs) ? statusSnapshot.logs.join('\n') : '',
    ].join('|');

    if (taskStatusSignatureRef.current !== statusSignature) {
      taskStatusSignatureRef.current = statusSignature;
      const timelineEntries = [];
      const statusMessage = describeTaskStatusUpdate(statusSnapshot);
      if (statusMessage) {
        timelineEntries.push({
          id: `${statusSignature}-status`,
          timestamp: statusSnapshot.updatedAt || new Date().toISOString(),
          kind: String(statusSnapshot.status || 'info').toLowerCase(),
          message: statusMessage,
        });
      }

      if (Array.isArray(statusSnapshot.logs)) {
        statusSnapshot.logs.forEach((line, index) => {
          if (!line) return;
          timelineEntries.push({
            id: `${statusSignature}-log-${index}`,
            timestamp: statusSnapshot.updatedAt || new Date().toISOString(),
            kind: 'log',
            message: line,
          });
        });
      }

      prependTaskActivity(setTaskActivityLog, timelineEntries);

      const newStatus = String(statusSnapshot.status || '').toLowerCase();
      if (newStatus === 'failed') {
        setToast({
          open: true,
          severity: 'error',
          message: statusSnapshot.error || 'Forecast task failed.',
        });
      } else if (newStatus === 'cancelled') {
        setToast({ open: true, severity: 'warning', message: 'Forecast task was cancelled.' });
      }
    }

    setValidationResults(prev => ({
      ...prev,
      status: statusSnapshot.status,
      taskId: statusSnapshot.taskId || activeTaskId,
      progress: statusSnapshot.progress,
      updatedAt: statusSnapshot.updatedAt,
      message: (() => {
        const status = String(statusSnapshot.status || '').toLowerCase();
        if (status === 'failed') {
          return statusSnapshot.error || 'The compute task failed.';
        }
        if (status === 'cancelled') {
          return 'The compute task was cancelled.';
        }
        return prev.message;
      })(),
    }));
  }, [taskStatusQuery.data, activeTaskId]);

  useEffect(() => {
    if (!taskStatusQuery.error) return;

    prependTaskActivity(setTaskActivityLog, [
      {
        id: `${Date.now()}-status-error`,
        timestamp: new Date().toISOString(),
        kind: 'error',
        message:
          taskStatusQuery.error instanceof Error
            ? `Status polling error: ${taskStatusQuery.error.message}`
            : 'Status polling failed.',
      },
    ]);

    setValidationResults(prev => ({
      ...prev,
      status: 'failed',
      message:
        taskStatusQuery.error instanceof Error
          ? taskStatusQuery.error.message
          : 'Task status polling failed. Please retry.',
    }));
  }, [taskStatusQuery.error]);

  useEffect(() => {
    if (!taskResultsQuery.error) return;

    prependTaskActivity(setTaskActivityLog, [
      {
        id: `${Date.now()}-results-error`,
        timestamp: new Date().toISOString(),
        kind: 'error',
        message:
          taskResultsQuery.error instanceof Error
            ? `Results polling error: ${taskResultsQuery.error.message}`
            : 'Results polling failed.',
      },
    ]);

    setValidationResults(prev => ({
      ...prev,
      status: 'failed',
      message:
        taskResultsQuery.error instanceof Error
          ? taskResultsQuery.error.message
          : 'Task results polling failed. Please retry.',
    }));
  }, [taskResultsQuery.error]);

  useEffect(() => {
    if (!taskResultsQuery.data) return;

    const resultsSnapshot = taskResultsQuery.data;
    const resultsSignature = [
      resultsSnapshot.status || '',
      resultsSnapshot.outputCid || '',
      resultsSnapshot.verificationReportCid || '',
      resultsSnapshot.receiptTxHash || '',
      Array.isArray(resultsSnapshot.logs) ? resultsSnapshot.logs.join('\n') : '',
    ].join('|');

    if (taskResultsSignatureRef.current !== resultsSignature) {
      taskResultsSignatureRef.current = resultsSignature;
      const timelineEntries = [
        {
          id: `${resultsSignature}-result`,
          timestamp: new Date().toISOString(),
          kind: String(resultsSnapshot.status || 'completed').toLowerCase(),
          message: describeTaskResultUpdate(resultsSnapshot),
        },
      ];

      if (Array.isArray(resultsSnapshot.logs)) {
        resultsSnapshot.logs.forEach((line, index) => {
          if (!line) return;
          timelineEntries.push({
            id: `${resultsSignature}-log-${index}`,
            timestamp: new Date().toISOString(),
            kind: 'log',
            message: line,
          });
        });
      }

      prependTaskActivity(setTaskActivityLog, timelineEntries);

      const resultStatus = String(resultsSnapshot.status || 'completed').toLowerCase();
      if (resultStatus === 'completed') {
        setToast({ open: true, severity: 'success', message: 'Recipe completed — results are ready.' });
      }
    }

    setValidationResults({
      status: resultsSnapshot.status || 'completed',
      taskId: resultsSnapshot.taskId || activeTaskId,
      outputCid: resultsSnapshot.outputCid,
      verificationReportCid: resultsSnapshot.verificationReportCid,
      receiptTxHash: resultsSnapshot.receiptTxHash,
      results: resultsSnapshot.results,
    });
  }, [taskResultsQuery.data, activeTaskId]);

  const steps = [
    {
      label: 'Algorithm Selection',
      content: (
        <Box>
          <Typography
            variant="h5"
            gutterBottom
            sx={{ color: '#1976d2', fontWeight: 'bold' }}
          >
            Algorithm Selection
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Choose a computational algorithm to run (across multiple domains):
          </Typography>

          {/* Category Tabs */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {algorithmCategories.map(category => (
                <Chip
                  key={category}
                  label={category}
                  variant={
                    selectedCategory === category ? 'filled' : 'outlined'
                  }
                  color={selectedCategory === category ? 'primary' : 'default'}
                  clickable
                  onClick={() => setSelectedCategory(category)}
                  sx={{
                    fontSize: '0.85rem',
                    height: '32px',
                    '&:hover': {
                      backgroundColor:
                        selectedCategory === category ? undefined : '#f5f5f5',
                    },
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Algorithm Cards - Compact Layout */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
                md: '1fr 1fr 1fr',
                lg: '1fr 1fr 1fr 1fr',
              },
              gap: 2,
            }}
          >
            {algorithmModels[selectedCategory]?.map(model => (
              <Box key={model.id}>
                <Card
                  variant={recipe.model === model.id ? 'outlined' : 'elevation'}
                  sx={{
                    cursor: 'pointer',
                    border:
                      recipe.model === model.id
                        ? `3px solid ${model.color}`
                        : '1px solid #e0e0e0',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 3,
                      transition: 'all 0.2s ease-in-out',
                    },
                    height: 'auto',
                    minHeight: '240px',
                  }}
                  onClick={() =>
                    setRecipe(prev => ({ ...prev, model: model.id }))
                  }
                >
                  <CardContent sx={{ p: 2 }}>
                    {/* Header with Icon and Name */}
                    <Box
                      sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}
                    >
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: model.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          mr: 1.5,
                          flexShrink: 0,
                        }}
                      >
                        {model.icon}
                      </Box>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontSize: '0.95rem',
                            fontWeight: 'bold',
                            lineHeight: 1.2,
                            wordBreak: 'break-word',
                          }}
                        >
                          {model.name}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Description */}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        fontSize: '0.8rem',
                        lineHeight: 1.3,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {model.description}
                    </Typography>

                    {/* Accuracy and Compute Stats */}
                    <Box
                      sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}
                    >
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ fontSize: '0.7rem' }}
                        >
                          📊
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ fontSize: '0.7rem', fontWeight: 'medium' }}
                        >
                          Accuracy: {model.accuracy}
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ fontSize: '0.7rem' }}
                        >
                          💻
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ fontSize: '0.7rem', fontWeight: 'medium' }}
                        >
                          Compute: {model.compute}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Key Tags (max 2) */}
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 0.5,
                        mb: 2,
                      }}
                    >
                      {model.tags.slice(0, 2).map(tag => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          variant="outlined"
                          sx={{
                            fontSize: '0.6rem',
                            height: '18px',
                            '& .MuiChip-label': { px: 1 },
                          }}
                        />
                      ))}
                      {model.tags.length > 2 && (
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.6rem',
                            color: 'text.secondary',
                            alignSelf: 'center',
                          }}
                        >
                          +{model.tags.length - 2}
                        </Typography>
                      )}
                    </Box>

                    {/* Reward */}
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color: model.color,
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        mt: 'auto',
                      }}
                    >
                      {model.baseReward} WRF base reward
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
          {!recipe.model && (
            <FormHelperText error sx={{ mt: 1.5, fontSize: '0.85rem' }}>
              Select a forecast model to continue.
            </FormHelperText>
          )}
        </Box>
      ),
    },
    {
      label: 'Data Sources',
      content: (
        <Box>
          <Typography
            variant="h5"
            gutterBottom
            sx={{ color: '#1976d2', fontWeight: 'bold' }}
          >
            Data Sources
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Select data sources for your computational algorithm:
          </Typography>

          {/* Data Source Categories */}
          {Object.entries(datasetSources).map(([category, sources]) => (
            <Box key={category} sx={{ mb: 4 }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  color: '#1976d2',
                  borderBottom: '2px solid #e3f2fd',
                  pb: 1,
                  mb: 2,
                }}
              >
                {category}
              </Typography>
              <Grid container spacing={2}>
                {sources.map(dataset => (
                  <Grid item xs={12} md={6} lg={4} key={dataset.id}>
                    <Card
                      variant={
                        recipe.datasets.includes(dataset.id)
                          ? 'outlined'
                          : 'elevation'
                      }
                      sx={{
                        cursor: 'pointer',
                        border: recipe.datasets.includes(dataset.id)
                          ? '3px solid #1976d2'
                          : 'none',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 3,
                          transition: 'all 0.2s ease-in-out',
                        },
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                      onClick={() => {
                        setRecipe(prev => ({
                          ...prev,
                          datasets: prev.datasets.includes(dataset.id)
                            ? prev.datasets.filter(id => id !== dataset.id)
                            : [...prev.datasets, dataset.id],
                        }));
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1 }}>
                        {/* Header with Icon and Name */}
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', mb: 2 }}
                        >
                          <Box
                            sx={{
                              width: 35,
                              height: 35,
                              borderRadius: '8px',
                              backgroundColor: '#f5f5f5',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.2rem',
                              mr: 2,
                            }}
                          >
                            {dataset.icon}
                          </Box>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}
                            >
                              {dataset.name}
                            </Typography>
                            <Chip
                              label={dataset.type}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.65rem', height: '18px' }}
                            />
                          </Box>
                        </Box>

                        {/* Description */}
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2, minHeight: '40px', fontSize: '0.8rem' }}
                        >
                          {dataset.description}
                        </Typography>

                        {/* Quality and Coverage Badges */}
                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{ fontSize: '0.7rem' }}
                            >
                              🎯
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ fontSize: '0.7rem' }}
                            >
                              Quality: {dataset.quality}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{ fontSize: '0.7rem' }}
                            >
                              🌍
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ fontSize: '0.7rem' }}
                            >
                              Coverage: {dataset.coverage}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Update Frequency and Authentication */}
                        <Box
                          sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 0.5,
                            mb: 2,
                          }}
                        >
                          <Chip
                            label={`Updates: ${dataset.updateFrequency}`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.6rem', height: '18px' }}
                          />
                          <Chip
                            label={dataset.authentication}
                            size="small"
                            variant="outlined"
                            color={
                              dataset.authentication === 'None required'
                                ? 'success'
                                : 'warning'
                            }
                            sx={{ fontSize: '0.6rem', height: '18px' }}
                          />
                        </Box>

                        {/* Data Types */}
                        <Box
                          sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 0.5,
                            mb: 2,
                          }}
                        >
                          {dataset.dataTypes.slice(0, 3).map(type => (
                            <Chip
                              key={type}
                              label={type}
                              size="small"
                              variant="filled"
                              sx={{
                                fontSize: '0.6rem',
                                height: '18px',
                                backgroundColor: '#e3f2fd',
                                color: '#1976d2',
                              }}
                            />
                          ))}
                          {dataset.dataTypes.length > 3 && (
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: '0.6rem',
                                color: 'text.secondary',
                              }}
                            >
                              +{dataset.dataTypes.length - 3} more
                            </Typography>
                          )}
                        </Box>

                        {/* Cost and Multiplier */}
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mt: 'auto',
                          }}
                        >
                          <Typography
                            variant="h6"
                            sx={{
                              color: '#1976d2',
                              fontWeight: 'bold',
                              fontSize: '0.9rem',
                            }}
                          >
                            {dataset.multiplier}x multiplier
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: dataset.cost === 0 ? 'green' : 'orange',
                              fontWeight: 'bold',
                            }}
                          >
                            {dataset.cost === 0
                              ? 'Free'
                              : `+${dataset.cost} WRF`}
                          </Typography>
                        </Box>

                        {/* Scraping Method Info */}
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            fontSize: '0.65rem',
                            fontStyle: 'italic',
                            mt: 1,
                            display: 'block',
                          }}
                        >
                          Method: {dataset.scrapingMethod}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
          {recipe.datasets.length === 0 && (
            <FormHelperText error sx={{ mt: 1.5, fontSize: '0.85rem' }}>
              Select at least one dataset to continue.
            </FormHelperText>
          )}
        </Box>
      ),
    },
    {
      label: 'Compute & Validation',
      content: (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Compute Environment
            </Typography>
            <FormControl fullWidth error={!recipe.computeEnvironment}>
              <InputLabel>Select Compute Provider</InputLabel>
              <Select
                value={recipe.computeEnvironment}
                onChange={e =>
                  setRecipe(prev => ({
                    ...prev,
                    computeEnvironment: e.target.value,
                  }))
                }
              >
                {computeEnvironments.map(env => (
                  <MenuItem key={env.id} value={env.id}>
                    <Box>
                      <Typography variant="subtitle1">{env.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {env.description} - {env.multiplier}x reward
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {!recipe.computeEnvironment && (
                <FormHelperText>Compute provider is required.</FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Validation Method
            </Typography>
            <FormControl fullWidth error={!recipe.validation}>
              <InputLabel>Select Validation</InputLabel>
              <Select
                value={recipe.validation}
                onChange={e =>
                  setRecipe(prev => ({ ...prev, validation: e.target.value }))
                }
              >
                {validationMethods.map(method => (
                  <MenuItem key={method.id} value={method.id}>
                    <Box>
                      <Typography variant="subtitle1">{method.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {method.description} - {method.accuracy} accuracy
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {!recipe.validation && (
                <FormHelperText>Validation method is required.</FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Forecast Configuration
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Resolution</InputLabel>
                  <Select
                    value={recipe.resolution}
                    onChange={e =>
                      setRecipe(prev => ({
                        ...prev,
                        resolution: e.target.value,
                      }))
                    }
                  >
                    <MenuItem value="standard">Standard (12km)</MenuItem>
                    <MenuItem value="high">High (3km)</MenuItem>
                    <MenuItem value="ultra">Ultra High (1km)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={8}>
                <Typography gutterBottom>
                  Forecast Hours: {recipe.forecastHours}h
                </Typography>
                <Slider
                  value={recipe.forecastHours}
                  onChange={(e, value) =>
                    setRecipe(prev => ({ ...prev, forecastHours: value }))
                  }
                  min={6}
                  max={168}
                  step={6}
                  marks={[
                    { value: 6, label: '6h' },
                    { value: 48, label: '48h' },
                    { value: 168, label: '7d' },
                  ]}
                />
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={recipe.carbonOffset}
                    onChange={e =>
                      setRecipe(prev => ({
                        ...prev,
                        carbonOffset: e.target.checked,
                      }))
                    }
                  />
                }
                label="Include Carbon Offset"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={recipe.academicEndorsement}
                    onChange={e =>
                      setRecipe(prev => ({
                        ...prev,
                        academicEndorsement: e.target.checked,
                      }))
                    }
                  />
                }
                label="Request Academic Endorsement"
              />
            </Box>
          </Grid>
        </Grid>
      ),
    },
    {
      label: 'Review & Submit',
      content: (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
          Your computational NFT will be minted upon successful forecast
          completion and validation.
          </Alert>

          <Card
            variant="outlined"
            sx={{
              mb: 3,
              background: 'linear-gradient(135deg, #f8fbff 0%, #ffffff 100%)',
            }}
          >
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Submission snapshot
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip
                  label={`Model: ${recipe.model ? recipe.model.toUpperCase() : 'unset'}`}
                  variant="outlined"
                />
                <Chip
                  label={`Datasets: ${recipe.datasets.length}`}
                  variant="outlined"
                />
                <Chip
                  label={`Compute: ${recipe.computeEnvironment || 'unset'}`}
                  variant="outlined"
                />
                <Chip
                  label={`Validation: ${recipe.validation || 'unset'}`}
                  variant="outlined"
                />
                <Chip
                  label={`Forecast: ${recipe.forecastHours}h`}
                  variant="outlined"
                />
                <Chip
                  label={
                    recipe.carbonOffset
                      ? 'Carbon offset included'
                      : 'Carbon offset optional'
                  }
                  variant="outlined"
                />
                <Chip
                  label={
                    recipe.academicEndorsement
                      ? 'Academic endorsement requested'
                      : 'No academic endorsement'
                  }
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>

          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Cost Breakdown & Rewards</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Component</TableCell>
                      <TableCell>Multiplier</TableCell>
                      <TableCell>Reward (WRF)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Base Model Cost</TableCell>
                      <TableCell>1.0x</TableCell>
                      <TableCell>{costEstimate.base}</TableCell>
                    </TableRow>
                    {Object.entries(costEstimate.multipliers).map(
                      ([name, multiplier]) => (
                        <TableRow key={name}>
                          <TableCell>{name}</TableCell>
                          <TableCell>{multiplier}x</TableCell>
                          <TableCell>Applied</TableCell>
                        </TableRow>
                      ),
                    )}
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell>
                        <strong>Total Estimated Cost</strong>
                      </TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>
                        <strong>{costEstimate.total} WRF</strong>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Reward Distribution</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Box
                    sx={{
                      textAlign: 'center',
                      p: 2,
                      bgcolor: '#e3f2fd',
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="h6">
                      {costEstimate.rewards.dataContributors} WRF
                    </Typography>
                    <Typography variant="body2">
                      Data Contributors (30%)
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box
                    sx={{
                      textAlign: 'center',
                      p: 2,
                      bgcolor: '#f3e5f5',
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="h6">
                      {costEstimate.rewards.computeProviders} WRF
                    </Typography>
                    <Typography variant="body2">
                      Compute Providers (35%)
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box
                    sx={{
                      textAlign: 'center',
                      p: 2,
                      bgcolor: '#e8f5e8',
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="h6">
                      {costEstimate.rewards.dataKeepers} WRF
                    </Typography>
                    <Typography variant="body2">Data Keepers (20%)</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box
                    sx={{
                      textAlign: 'center',
                      p: 2,
                      bgcolor: '#fff3e0',
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="h6">
                      {costEstimate.rewards.carbonOffsetters} WRF
                    </Typography>
                    <Typography variant="body2">
                      Carbon Offsetters (15%)
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Box>
      ),
    },
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          WRF & GFS Recipe Builder
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          align="center"
          sx={{ mb: 4 }}
        >
          Create computational NFTs from weather forecast models and earn WRF
          tokens
        </Typography>

        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel>
                <Typography variant="h6">{step.label}</Typography>
              </StepLabel>
              <StepContent>
                <Box sx={{ mt: 2, mb: 2 }}>{step.content}</Box>
                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    onClick={
                      index === steps.length - 1
                        ? handleSubmitRecipe
                        : handleNext
                    }
                    sx={{ mr: 1 }}
                    disabled={
                      (index === 0 && !recipe.model) ||
                      (index === 1 && recipe.datasets.length === 0) ||
                      (index === 2 &&
                        (!recipe.computeEnvironment || !recipe.validation)) ||
                      submitForecastTask.isPending ||
                      ['queued', 'running', 'pending', 'processing'].includes(
                        String(validationResults.status || '').toLowerCase(),
                      )
                    }
                    startIcon={
                      index === steps.length - 1 && submitForecastTask.isPending ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : null
                    }
                  >
                    {index === steps.length - 1
                      ? submitForecastTask.isPending
                        ? 'Submitting…'
                        : 'Submit Recipe'
                      : 'Continue'}
                  </Button>
                  <Button disabled={index === 0} onClick={handleBack}>
                    Back
                  </Button>
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>

        <Card
          sx={{
            mt: 3,
            mb: 3,
            border: '1px solid #e3f2fd',
            background: 'linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)',
          }}
        >
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={5}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 2,
                    mb: 1.5,
                  }}
                >
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Configuration readiness
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Live validation updates as you build the recipe.
                    </Typography>
                  </Box>
                  <Chip
                    label={
                      configurationReady
                        ? 'Ready to submit'
                        : `${configurationChecks.filter(check => !check.satisfied).length} checks remaining`
                    }
                    color={configurationReady ? 'success' : 'warning'}
                    variant={configurationReady ? 'filled' : 'outlined'}
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={configurationProgress}
                  sx={{ height: 8, borderRadius: 999, mb: 1.5 }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {configurationChecks.filter(check => check.satisfied).length} of{' '}
                  {configurationChecks.length} required checks complete.
                </Typography>
                <List disablePadding>
                  {configurationChecks.map(check => (
                    <ListItem
                      key={check.id}
                      sx={{ px: 0, py: 0.75, alignItems: 'flex-start' }}
                    >
                      <ListItemIcon sx={{ minWidth: 36, mt: 0.2 }}>
                        <VerifiedIcon
                          color={check.satisfied ? 'success' : 'disabled'}
                          fontSize="small"
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {check.label}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            {check.detail}
                          </Typography>
                        }
                      />
                      <Chip
                        size="small"
                        label={check.satisfied ? 'Ready' : 'Pending'}
                        color={check.satisfied ? 'success' : 'default'}
                        variant={check.satisfied ? 'filled' : 'outlined'}
                        sx={{ mt: 0.4 }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>

              <Grid item xs={12} md={7}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 2,
                    mb: 1.5,
                  }}
                >
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Live job activity
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Progress updates and streamed log lines for active compute jobs.
                    </Typography>
                  </Box>
                  <Chip
                    icon={<TimelineIcon />}
                    label={taskLogLabel}
                    color={taskLogTone}
                    variant={taskIsActive ? 'filled' : 'outlined'}
                  />
                </Box>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: 'repeat(3, minmax(0, 1fr))',
                    },
                    gap: 1.25,
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'rgba(25, 118, 210, 0.04)',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Task ID
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {validationResults.taskId || 'Pending submission'}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'rgba(76, 175, 80, 0.05)',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Progress
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {taskProgressValue !== null
                        ? `${taskProgressValue}% complete`
                        : taskIsActive
                          ? 'Waiting for the next status update'
                          : 'Idle'}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'rgba(156, 39, 176, 0.04)',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Last update
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {taskSnapshotUpdatedAt
                        ? formatTaskDateTime(taskSnapshotUpdatedAt)
                        : 'Waiting for status'}
                    </Typography>
                  </Box>
                </Box>
                {taskProgressValue !== null && (
                  <Box sx={{ mb: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={taskProgressValue}
                      sx={{ height: 8, borderRadius: 999 }}
                    />
                  </Box>
                )}
                <Paper
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    bgcolor: '#fff',
                  }}
                >
                  {taskActivityLog.length ? (
                    <List disablePadding sx={{ maxHeight: 320, overflowY: 'auto' }}>
                      {taskActivityLog.map((entry, index) => (
                        <React.Fragment key={entry.id}>
                          <ListItem
                            alignItems="flex-start"
                            sx={{ px: 2, py: 1.5 }}
                          >
                            <ListItemIcon sx={{ minWidth: 36, mt: 0.25 }}>
                              <TimelineIcon
                                fontSize="small"
                                color={
                                  entry.kind === 'error'
                                    ? 'error'
                                    : entry.kind === 'completed'
                                      ? 'success'
                                      : entry.kind === 'log'
                                        ? 'info'
                                        : 'primary'
                                }
                              />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box
                                  sx={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    alignItems: 'center',
                                    gap: 1,
                                  }}
                                >
                                  <Typography
                                    variant="subtitle2"
                                    sx={{ fontWeight: 700 }}
                                  >
                                    {entry.message}
                                  </Typography>
                                  <Chip
                                    size="small"
                                    variant="outlined"
                                    label={entry.kind}
                                    sx={{ textTransform: 'capitalize' }}
                                  />
                                </Box>
                              }
                              secondary={
                                <Typography variant="caption" color="text.secondary">
                                  {formatTaskTimestamp(entry.timestamp)}
                                </Typography>
                              }
                            />
                          </ListItem>
                          {index < taskActivityLog.length - 1 && (
                            <Divider component="li" />
                          )}
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ p: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        No live activity yet. Submit a recipe to start streaming
                        task updates here.
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {['queued', 'running', 'pending', 'processing'].includes(
          taskStatus,
        ) && (
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="h6">Forecast task in progress</Typography>
            {validationResults.taskId && (
              <Typography>Task ID: {validationResults.taskId}</Typography>
            )}
            <Typography>
              Status: {String(validationResults.status).toUpperCase()}
            </Typography>
            {typeof validationResults.progress === 'number' && (
              <Box sx={{ mt: 1.5 }}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  Progress: {Math.round(validationResults.progress)}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.max(
                    0,
                    Math.min(100, Number(validationResults.progress)),
                  )}
                />
              </Box>
            )}
          </Alert>
        )}

        {taskStatus === 'failed' && (
          <Alert
            severity="error"
            sx={{ mt: 3 }}
            action={
              lastSubmittedRecipe ? (
                <Button
                  color="inherit"
                  size="small"
                  onClick={handleRetrySubmission}
                  disabled={submitForecastTask.isPending}
                >
                  Retry
                </Button>
              ) : undefined
            }
          >
            <Typography variant="h6">Forecast task failed</Typography>
            {validationResults.taskId && (
              <Typography>Task ID: {validationResults.taskId}</Typography>
            )}
            <Typography>
              {validationResults.message ||
                'The compute API returned a failure state.'}
            </Typography>
          </Alert>
        )}

        {taskStatus === 'completed' && (
          <Alert severity="success" sx={{ mt: 3 }}>
            <Typography variant="h6">Recipe submitted successfully</Typography>
            <Typography>Task ID: {validationResults.taskId || '--'}</Typography>
            <Typography>
              Output CID:{' '}
              {renderLinkedValue(
                validationResults.outputCid,
                toIpfsGatewayUrl(validationResults.outputCid),
              )}
            </Typography>
            <Typography>
              Verification Report:{' '}
              {renderLinkedValue(
                validationResults.verificationReportCid,
                toIpfsGatewayUrl(validationResults.verificationReportCid),
              )}
            </Typography>
            <Typography>
              Receipt Tx:{' '}
              {renderLinkedValue(
                validationResults.receiptTxHash,
                toTransactionExplorerUrl(validationResults.receiptTxHash),
              )}
            </Typography>
            {validationResults.message && (
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {validationResults.message}
              </Typography>
            )}
          </Alert>
        )}

        {taskStatus === 'cancelled' && (
          <Alert
            severity="warning"
            sx={{ mt: 3 }}
            action={
              lastSubmittedRecipe ? (
                <Button
                  color="inherit"
                  size="small"
                  onClick={handleRetrySubmission}
                  disabled={submitForecastTask.isPending}
                >
                  Retry
                </Button>
              ) : undefined
            }
          >
            <Typography variant="h6">Forecast task cancelled</Typography>
            {validationResults.taskId && (
              <Typography>Task ID: {validationResults.taskId}</Typography>
            )}
            <Typography>
              {validationResults.message ||
                'The compute API cancelled this task before completion.'}
            </Typography>
          </Alert>
        )}
      </Box>

      <Snackbar
        open={toast.open}
        autoHideDuration={5000}
        onClose={() => setToast(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={toast.severity}
          variant="filled"
          onClose={() => setToast(prev => ({ ...prev, open: false }))}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default WRFGFSRecipeBuilder;
