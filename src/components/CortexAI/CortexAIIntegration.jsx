import React, { useState } from 'react';
import DemoSurfaceGate from '../common/DemoSurfaceGate';

// frontend#353: no backend route serves Cortex AI models, jobs or training.
// The job list and model catalogue below are samples. The former form
// reported "Training job submitted successfully!" after a 2 s timer. The
// default build shows an honest not-live state; in the demo build every
// action is disabled.
const SAMPLE_ACTION = 'Sample only: nothing is submitted, deployed or uploaded.';
// Using local imports for MUI components to prevent dependency issues
const Box = ({ children, ...props }) => (
  <div className="mui-box" {...props}>
    {children}
  </div>
);
const Typography = ({ children, variant, ...props }) => {
  const className = `mui-typography mui-typography-${variant || 'body1'}`;
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
};
const Grid = ({ container, item, xs, md, children, ...props }) => {
  const className = `mui-grid ${container ? 'mui-grid-container' : ''} ${item ? 'mui-grid-item' : ''}`;
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
};
const Card = ({ children, ...props }) => (
  <div className="mui-card" {...props}>
    {children}
  </div>
);
const CardContent = ({ children, ...props }) => (
  <div className="mui-card-content" {...props}>
    {children}
  </div>
);
const CardHeader = ({ title, subheader, ...props }) => (
  <div className="mui-card-header" {...props}>
    {title && <div className="mui-card-header-title">{title}</div>}
    {subheader && <div className="mui-card-header-subheader">{subheader}</div>}
  </div>
);
const Button = ({ children, variant, color, onClick, startIcon, ...props }) => {
  const className = `mui-button mui-button-${variant || 'contained'} mui-button-${color || 'primary'}`;
  return (
    <button className={className} onClick={onClick} {...props}>
      {startIcon && <span className="mui-button-start-icon">{startIcon}</span>}
      {children}
    </button>
  );
};
const Divider = () => <hr className="mui-divider" />;
const Chip = ({ label, color, ...props }) => {
  const className = `mui-chip mui-chip-${color || 'default'}`;
  return (
    <span className={className} {...props}>
      {label}
    </span>
  );
};
const LinearProgress = ({ value, ...props }) => (
  <div className="mui-linear-progress" {...props}>
    <div
      className="mui-linear-progress-bar"
      style={{ width: `${value}%` }}
    ></div>
  </div>
);
const TextField = ({
  label,
  value,
  onChange,
  select,
  children,
  fullWidth,
  ...props
}) => {
  const className = `mui-text-field ${fullWidth ? 'mui-text-field-full-width' : ''}`;
  return (
    <div className={className} {...props}>
      {label && <label className="mui-text-field-label">{label}</label>}
      {select ? (
        <select className="mui-select" value={value} onChange={onChange}>
          {children}
        </select>
      ) : (
        <input className="mui-input" value={value} onChange={onChange} />
      )}
    </div>
  );
};
const MenuItem = ({ value, children, ...props }) => (
  <option value={value} {...props}>
    {children}
  </option>
);
const CircularProgress = () => <div className="mui-circular-progress"></div>;
const Paper = ({ children, ...props }) => (
  <div className="mui-paper" {...props}>
    {children}
  </div>
);
const IconButton = ({ children, onClick, ...props }) => (
  <button className="mui-icon-button" onClick={onClick} {...props}>
    {children}
  </button>
);

// Mock Icons
const PlayArrowIcon = () => <span className="mui-icon">▶</span>;
const StopIcon = () => <span className="mui-icon">■</span>;
const RefreshIcon = () => <span className="mui-icon">↻</span>;
const MemoryIcon = () => <span className="mui-icon">🔌</span>;
const BiotechIcon = () => <span className="mui-icon">🔬</span>;
const DataObjectIcon = () => <span className="mui-icon">📊</span>;
const SettingsIcon = () => <span className="mui-icon">⚙️</span>;
const AccountTreeIcon = () => <span className="mui-icon">🌲</span>;
const CloudUploadIcon = () => <span className="mui-icon">☁️</span>;

// Mock data for the Cortex AI Integration
const modelTypes = [
  { value: 'weather-forecast', label: 'Weather Forecast Model' },
  { value: 'air-quality', label: 'Air Quality Prediction' },
  { value: 'climate-analysis', label: 'Climate Change Analysis' },
  { value: 'flood-prediction', label: 'Flood Risk Assessment' },
  { value: 'drought-monitoring', label: 'Drought Monitoring' },
];

const trainingDatasets = [
  {
    value: 'global-weather-2010-2023',
    label: 'Global Weather Data (2010-2023)',
  },
  { value: 'noaa-historical', label: 'NOAA Historical Database' },
  { value: 'satellite-imagery-combined', label: 'Combined Satellite Imagery' },
  { value: 'ocean-temperature', label: 'Ocean Temperature Records' },
  { value: 'european-climate', label: 'European Climate Data' },
];

const modelArchitectures = [
  { value: 'transformer', label: 'Transformer' },
  { value: 'lstm', label: 'LSTM' },
  { value: 'cnn', label: 'CNN' },
  { value: 'hybrid-cnn-transformer', label: 'Hybrid CNN-Transformer' },
  { value: 'diffusion', label: 'Diffusion Model' },
];

// Mock recent jobs
const recentJobs = [
  {
    id: 'job-1652',
    name: 'North America Precipitation Forecast',
    status: 'completed',
    progress: 100,
    created: '2025-05-16T14:30:00Z',
    completed: '2025-05-16T15:45:00Z',
    modelType: 'weather-forecast',
    architecture: 'transformer',
    computeUnits: 125,
    accuracy: 0.92,
  },
  {
    id: 'job-1653',
    name: 'European Air Quality Analysis',
    status: 'running',
    progress: 68,
    created: '2025-05-17T10:15:00Z',
    completed: null,
    modelType: 'air-quality',
    architecture: 'hybrid-cnn-transformer',
    computeUnits: 180,
    accuracy: null,
  },
  {
    id: 'job-1649',
    name: 'Global Climate Model 2030-2050',
    status: 'completed',
    progress: 100,
    created: '2025-05-15T08:45:00Z',
    completed: '2025-05-15T14:20:00Z',
    modelType: 'climate-analysis',
    architecture: 'transformer',
    computeUnits: 350,
    accuracy: 0.89,
  },
  {
    id: 'job-1651',
    name: 'Southeast Asia Monsoon Prediction',
    status: 'failed',
    progress: 37,
    created: '2025-05-16T09:10:00Z',
    completed: '2025-05-16T10:05:00Z',
    modelType: 'weather-forecast',
    architecture: 'lstm',
    computeUnits: 95,
    accuracy: null,
  },
];

// Mock available models
const availableModels = [
  {
    id: 'model-2589',
    name: 'Global Weather Prediction - Advanced',
    type: 'weather-forecast',
    version: '3.2.1',
    accuracy: 0.945,
    parameters: '1.3B',
    createdAt: '2025-04-10T08:30:00Z',
    updatedAt: '2025-05-12T11:45:00Z',
    architecture: 'hybrid-cnn-transformer',
    trainingDataset: 'global-weather-2010-2023',
    avgInferenceTime: '12.5s',
  },
  {
    id: 'model-2604',
    name: 'Regional Air Quality Assessment',
    type: 'air-quality',
    version: '2.0.0',
    accuracy: 0.912,
    parameters: '580M',
    createdAt: '2025-03-25T12:15:00Z',
    updatedAt: '2025-05-05T09:30:00Z',
    architecture: 'transformer',
    trainingDataset: 'noaa-historical',
    avgInferenceTime: '8.2s',
  },
  {
    id: 'model-2567',
    name: 'Climate Change Projection - 2100',
    type: 'climate-analysis',
    version: '4.1.0',
    accuracy: 0.875,
    parameters: '2.5B',
    createdAt: '2025-02-18T15:40:00Z',
    updatedAt: '2025-04-22T10:15:00Z',
    architecture: 'transformer',
    trainingDataset: 'global-weather-2010-2023',
    avgInferenceTime: '45.3s',
  },
  {
    id: 'model-2612',
    name: 'Flood Risk Predictor - Coastal',
    type: 'flood-prediction',
    version: '1.5.2',
    accuracy: 0.892,
    parameters: '750M',
    createdAt: '2025-04-07T08:10:00Z',
    updatedAt: '2025-05-14T13:45:00Z',
    architecture: 'lstm',
    trainingDataset: 'satellite-imagery-combined',
    avgInferenceTime: '15.8s',
  },
];

const computingResources = {
  total: {
    gpu: 24,
    cpu: 3600,
    memory: 12288, // GB
    storage: 156000, // GB
  },
  available: {
    gpu: 15,
    cpu: 2240,
    memory: 8192, // GB
    storage: 98000, // GB
  },
  utilizationHistory: [
    { time: '00:00', utilization: 28 },
    { time: '04:00', utilization: 22 },
    { time: '08:00', utilization: 45 },
    { time: '12:00', utilization: 78 },
    { time: '16:00', utilization: 65 },
    { time: '20:00', utilization: 42 },
    { time: '24:00', utilization: 38 },
  ],
};

const CortexAISample = () => {
  const loading = false;
  const [activeTab, setActiveTab] = useState('dashboard');
  const [modelType, setModelType] = useState('');
  const [dataset, setDataset] = useState('');
  const [architecture, setArchitecture] = useState('');
  const [modelName, setModelName] = useState('');
  const [formStatus, setFormStatus] = useState({
    loading: false,
    error: null,
    success: false,
  });

  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleSubmitTraining = e => {
    e.preventDefault();
  };

  const renderDashboard = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h5" component="h2" gutterBottom>
          Cortex AI Framework Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Monitor and manage Cortex AI models, training jobs, and computing
          resources for weather and environmental data analysis.
        </Typography>
      </Grid>

      {/* Computing Resources Card */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader
            title="Computing Resources"
            avatar={<MemoryIcon color="primary" />}
            action={
              <IconButton aria-label="refresh" disabled title={SAMPLE_ACTION}>
                <RefreshIcon />
              </IconButton>
            }
          />
          <CardContent>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                GPU Utilization
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: '100%', mr: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={
                      (1 -
                        computingResources.available.gpu /
                          computingResources.total.gpu) *
                      100
                    }
                    color="success"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {computingResources.available.gpu}/
                  {computingResources.total.gpu}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                CPU Utilization
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: '100%', mr: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={
                      (1 -
                        computingResources.available.cpu /
                          computingResources.total.cpu) *
                      100
                    }
                    color="primary"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {computingResources.available.cpu}/
                  {computingResources.total.cpu}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Memory Utilization
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: '100%', mr: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={
                      (1 -
                        computingResources.available.memory /
                          computingResources.total.memory) *
                      100
                    }
                    color="secondary"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {computingResources.available.memory}/
                  {computingResources.total.memory} GB
                </Typography>
              </Box>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Storage Utilization
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: '100%', mr: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={
                      (1 -
                        computingResources.available.storage /
                          computingResources.total.storage) *
                      100
                    }
                    color="warning"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {computingResources.available.storage}/
                  {computingResources.total.storage} GB
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Recent Jobs Card */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader
            title="Recent AI Jobs"
            avatar={<BiotechIcon color="secondary" />}
          />
          <CardContent>
            {recentJobs.slice(0, 3).map(job => (
              <Box key={job.id} sx={{ mb: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="subtitle2">{job.name}</Typography>
                  <Chip
                    size="small"
                    label={job.status}
                    color={
                      job.status === 'completed'
                        ? 'success'
                        : job.status === 'running'
                          ? 'primary'
                          : job.status === 'failed'
                            ? 'error'
                            : 'default'
                    }
                  />
                </Box>
                {job.status === 'running' && (
                  <LinearProgress
                    variant="determinate"
                    value={job.progress}
                    sx={{ my: 1 }}
                  />
                )}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mt: 0.5,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {job.modelType}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {job.status === 'completed'
                      ? `Completed: ${formatDate(job.completed)}`
                      : `Started: ${formatDate(job.created)}`}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1.5 }} />
              </Box>
            ))}
            <Button variant="outlined" size="small" fullWidth disabled title={SAMPLE_ACTION}>
              View All Jobs
            </Button>
          </CardContent>
        </Card>
      </Grid>

      {/* Available Models Card */}
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title="Available AI Models"
            avatar={<DataObjectIcon color="info" />}
          />
          <CardContent>
            <Grid container spacing={2}>
              {availableModels.map(model => (
                <Grid item xs={12} md={6} key={model.id}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1">{model.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {model.type} • v{model.version} • {model.parameters}{' '}
                      parameters
                    </Typography>
                    <Box
                      sx={{
                        mt: 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Chip
                        size="small"
                        label={`Accuracy: ${(model.accuracy * 100).toFixed(1)}%`}
                        color={model.accuracy > 0.9 ? 'success' : 'primary'}
                      />
                      <Button size="small" variant="contained" disabled title={SAMPLE_ACTION}>
                        Deploy
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderTraining = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h5" component="h2" gutterBottom>
          Train New AI Model
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Create and train a new AI model for weather and environmental data
          analysis using the Cortex Framework.
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader
            title="Model Training Configuration"
            avatar={<SettingsIcon color="primary" />}
          />
          <CardContent>
            <form onSubmit={handleSubmitTraining}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="Model Name"
                    value={modelName}
                    onChange={e => setModelName(e.target.value)}
                    helperText="Choose a descriptive name for your AI model"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    required
                    select
                    label="Model Type"
                    value={modelType}
                    onChange={e => setModelType(e.target.value)}
                  >
                    {modelTypes.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    required
                    select
                    label="Training Dataset"
                    value={dataset}
                    onChange={e => setDataset(e.target.value)}
                  >
                    {trainingDatasets.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    required
                    select
                    label="Model Architecture"
                    value={architecture}
                    onChange={e => setArchitecture(e.target.value)}
                  >
                    {modelArchitectures.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Advanced Options
                  </Typography>
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Training Epochs"
                    defaultValue={10}
                    InputProps={{ inputProps: { min: 1, max: 100 } }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Batch Size"
                    defaultValue={32}
                    InputProps={{ inputProps: { min: 1, max: 256 } }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Learning Rate"
                    defaultValue={0.001}
                    InputProps={{
                      inputProps: { min: 0.0001, max: 0.1, step: 0.0001 },
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mt: 2,
                    }}
                  >
                    <Box>
                      {formStatus.error && (
                        <Typography variant="body2" color="error">
                          {formStatus.error}
                        </Typography>
                      )}
                      {formStatus.success && (
                        <Typography variant="body2" color="success.main">
                          Training job submitted successfully!
                        </Typography>
                      )}
                    </Box>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={
                        formStatus.loading ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          <PlayArrowIcon />
                        )
                      }
                      disabled
                      title={SAMPLE_ACTION}
                    >
                      Start Training
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader
            title="Model Upload"
            avatar={<CloudUploadIcon color="secondary" />}
          />
          <CardContent>
            <Typography variant="body2" color="text.secondary" paragraph>
              Already have a trained model? Upload it directly to the Cortex AI
              Framework.
            </Typography>
            <Button variant="outlined" startIcon={<CloudUploadIcon />} disabled title={SAMPLE_ACTION}>
              Upload Model
            </Button>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderPipelines = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h5" component="h2" gutterBottom>
          AI Workflows & Pipelines
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Create and manage automated AI workflows and model pipelines for
          continuous forecasting and analysis.
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader
            title="Available Workflows"
            avatar={<AccountTreeIcon color="primary" />}
          />
          <CardContent>
            <Typography variant="body2" paragraph>
              This feature is coming soon. Check back for updates!
            </Typography>
            <Button variant="outlined" disabled>
              Create New Workflow
            </Button>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderContent = () => {
    switch (activeTab) {
    case 'dashboard':
      return renderDashboard();
    case 'training':
      return renderTraining();
    case 'pipelines':
      return renderPipelines();
    default:
      return renderDashboard();
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Cortex AI Integration
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Harness the power of Cortex AI framework for advanced weather
        prediction, climate analysis, and environmental data processing.
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant={activeTab === 'dashboard' ? 'contained' : 'outlined'}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </Button>
            <Button
              variant={activeTab === 'training' ? 'contained' : 'outlined'}
              onClick={() => setActiveTab('training')}
            >
              Train Model
            </Button>
            <Button
              variant={activeTab === 'pipelines' ? 'contained' : 'outlined'}
              onClick={() => setActiveTab('pipelines')}
            >
              Workflows
            </Button>
          </Box>
        </Box>

        {renderContent()}
      </Box>
    </Box>
  );
};

const CortexAIIntegration = () => (
  <DemoSurfaceGate
    title="Cortex AI is not live on the testnet"
    description="No testnet endpoint serves AI models, training jobs or compute resources yet."
    testId="cortex-ai"
  >
    <CortexAISample />
  </DemoSurfaceGate>
);

export default CortexAIIntegration;
