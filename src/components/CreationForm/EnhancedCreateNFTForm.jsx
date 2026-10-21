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
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  Divider,
  LinearProgress,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Slider,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Preview as PreviewIcon,
  CloudUpload as UploadIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { nftAPI as nftService } from '../../services/api';
import './CreateNFTForm.css';

// Enhanced configurations with more options
const COMPUTATION_TYPES = [
  {
    value: 'WEATHER_FORECAST',
    label: 'Weather Forecast',
    icon: '🌤️',
    description: 'Real-time weather prediction models',
  },
  {
    value: 'CLIMATE_SIMULATION',
    label: 'Climate Simulation',
    icon: '🌍',
    description: 'Long-term climate modeling',
  },
  {
    value: 'AIR_QUALITY',
    label: 'Air Quality Modeling',
    icon: '🌬️',
    description: 'Atmospheric pollution analysis',
  },
  {
    value: 'OCEAN_MODELING',
    label: 'Ocean Modeling',
    icon: '🌊',
    description: 'Marine and oceanographic simulations',
  },
  {
    value: 'SEISMIC_ANALYSIS',
    label: 'Seismic Analysis',
    icon: '🌋',
    description: 'Earthquake and geological modeling',
  },
  {
    value: 'GENERIC',
    label: 'Generic Computation',
    icon: '⚙️',
    description: 'Custom computational tasks',
  },
];

const COMPUTATION_MODEL_TYPES = [
  { value: 'GFS', label: 'Global Forecast System (GFS)', complexity: 'High' },
  {
    value: 'WRF',
    label: 'Weather Research and Forecasting (WRF)',
    complexity: 'Very High',
  },
  {
    value: 'ECMWF',
    label: 'European Centre for Medium-Range Weather Forecasts',
    complexity: 'High',
  },
  {
    value: 'CMAQ',
    label: 'Community Multiscale Air Quality Modeling System',
    complexity: 'Medium',
  },
  {
    value: 'ROMS',
    label: 'Regional Ocean Modeling System',
    complexity: 'High',
  },
  { value: 'CUSTOM', label: 'Custom Model', complexity: 'Variable' },
];

const EXECUTION_ENVIRONMENTS = [
  {
    value: 'WASM',
    label: 'WebAssembly Sandbox',
    security: 'High',
    performance: 'Medium',
  },
  {
    value: 'DOCKER',
    label: 'Docker Container',
    security: 'Medium',
    performance: 'High',
  },
  {
    value: 'NATIVE',
    label: 'Native Execution',
    security: 'Low',
    performance: 'Very High',
  },
  {
    value: 'VM',
    label: 'Virtual Machine',
    security: 'High',
    performance: 'Medium',
  },
];

const STORAGE_PROVIDERS = [
  { value: 'IPFS', label: 'IPFS', cost: 'Low', permanence: 'Medium' },
  { value: 'FILECOIN', label: 'Filecoin', cost: 'Medium', permanence: 'High' },
  { value: 'ARWEAVE', label: 'Arweave', cost: 'High', permanence: 'Permanent' },
  {
    value: 'LOCAL',
    label: 'Local Node Storage',
    cost: 'Very Low',
    permanence: 'Low',
  },
];

const EnhancedCreateNFTForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    creator: '',
    owner: '',
    computationType: COMPUTATION_TYPES[0].value,
    computationModel: COMPUTATION_MODEL_TYPES[0].value,
    executionEnvironment: EXECUTION_ENVIRONMENTS[0].value,
    storageProvider: STORAGE_PROVIDERS[0].value,
    resourceRequirements: {
      cpu_cores: 2,
      memory_mb: 1024,
      storage_mb: 512,
      execution_time_limit_seconds: 300,
      gpu_required: false,
    },
    inputData: '',
    parameters: '{}',
    regionCode: '',
    regionLatitude: '',
    regionLongitude: '',
    forecastLength: 24,
    updateFrequency: 'hourly',
    modelVersion: '1.0',
    creatorReputation: 0,
    reward: 5,
    metadata: {},
    tags: [],
    visibility: 'PUBLIC',
    license: 'MIT',
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);
  const [metadataFields, setMetadataFields] = useState([
    { key: '', value: '' },
  ]);
  const [tagInput, setTagInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const steps = [
    'Basic Information',
    'Computation Configuration',
    'Resource Requirements',
    'Review & Submit',
  ];

  // Calculate estimated cost based on resource requirements
  useEffect(() => {
    const { cpu_cores, memory_mb, execution_time_limit_seconds, gpu_required } =
      formData.resourceRequirements;
    const baseCost =
      cpu_cores * 0.1 +
      (memory_mb / 1000) * 0.05 +
      (execution_time_limit_seconds / 60) * 0.02;
    const gpuCost = gpu_required ? 2.0 : 0;
    const storageCost =
      formData.storageProvider === 'ARWEAVE'
        ? 1.0
        : formData.storageProvider === 'FILECOIN'
          ? 0.5
          : 0.1;

    setEstimatedCost(Number((baseCost + gpuCost + storageCost).toFixed(3)));
  }, [formData.resourceRequirements, formData.storageProvider]);

  // Validation for each step
  const validateStep = step => {
    const errors = {};

    switch (step) {
    case 0:
      if (!formData.title.trim()) errors.title = 'Title is required';
      if (!formData.description.trim())
        errors.description = 'Description is required';
      if (!formData.creator.trim())
        errors.creator = 'Creator address is required';
      break;
    case 1:
      try {
        JSON.parse(formData.parameters);
      } catch {
        errors.parameters = 'Parameters must be valid JSON';
      }
      break;
    case 2:
      if (formData.resourceRequirements.cpu_cores < 1)
        errors.cpu_cores = 'At least 1 CPU core required';
      if (formData.resourceRequirements.memory_mb < 128)
        errors.memory_mb = 'At least 128MB memory required';
      break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleInputChange = (field, value) => {
    if (field.startsWith('resourceRequirements.')) {
      const subField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        resourceRequirements: {
          ...prev.resourceRequirements,
          [subField]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const removeTag = tagToRemove => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsLoading(true);
    try {
      // Prepare metadata
      const metadata = {};
      metadataFields.forEach(field => {
        if (field.key && field.value) {
          metadata[field.key] = field.value;
        }
      });

      const nftData = {
        ...formData,
        metadata: { ...metadata, tags: formData.tags },
        parameters: JSON.parse(formData.parameters),
        createdAt: new Date().toISOString(),
        status: 'PENDING',
        tokenStandard: 'ERC721',
        estimatedCost,
      };

      const response = await nftService.createNFT(nftData);

      // Show success and reset form
      setFormData({
        title: '',
        description: '',
        creator: '',
        owner: '',
        computationType: COMPUTATION_TYPES[0].value,
        computationModel: COMPUTATION_MODEL_TYPES[0].value,
        executionEnvironment: EXECUTION_ENVIRONMENTS[0].value,
        storageProvider: STORAGE_PROVIDERS[0].value,
        resourceRequirements: {
          cpu_cores: 2,
          memory_mb: 1024,
          storage_mb: 512,
          execution_time_limit_seconds: 300,
          gpu_required: false,
        },
        inputData: '',
        parameters: '{}',
        regionCode: '',
        regionLatitude: '',
        regionLongitude: '',
        forecastLength: 24,
        updateFrequency: 'hourly',
        modelVersion: '1.0',
        creatorReputation: 0,
        reward: 5,
        metadata: {},
        tags: [],
        visibility: 'PUBLIC',
        license: 'MIT',
      });
      setCurrentStep(0);
      setMetadataFields([{ key: '', value: '' }]);
    } catch (error) {
      console.error('NFT Creation Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
    case 0:
      return (
        <Box>
          <Typography variant="h6" gutterBottom>
              Basic Information
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="NFT Title"
                value={formData.title}
                onChange={e => handleInputChange('title', e.target.value)}
                error={!!validationErrors.title}
                helperText={validationErrors.title}
                placeholder="e.g., North America Weather Forecast Model"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description"
                value={formData.description}
                onChange={e =>
                  handleInputChange('description', e.target.value)
                }
                error={!!validationErrors.description}
                helperText={validationErrors.description}
                placeholder="Describe your computational NFT..."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Creator Address"
                value={formData.creator}
                onChange={e => handleInputChange('creator', e.target.value)}
                error={!!validationErrors.creator}
                helperText={validationErrors.creator}
                placeholder="0x..."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Owner Address (Optional)"
                value={formData.owner}
                onChange={e => handleInputChange('owner', e.target.value)}
                placeholder="Leave blank if same as creator"
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="Add Tags"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && addTag()}
                  InputProps={{
                    endAdornment: (
                      <IconButton onClick={addTag} size="small">
                        <AddIcon />
                      </IconButton>
                    ),
                  }}
                />
                <Box
                  sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}
                >
                  {formData.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      onDelete={() => removeTag(tag)}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      );

    case 1:
      return (
        <Box>
          <Typography variant="h6" gutterBottom>
              Computation Configuration
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Computation Type</InputLabel>
                <Select
                  value={formData.computationType}
                  onChange={e =>
                    handleInputChange('computationType', e.target.value)
                  }
                >
                  {COMPUTATION_TYPES.map(type => (
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
                            {type.description}
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
                <InputLabel>Computation Model</InputLabel>
                <Select
                  value={formData.computationModel}
                  onChange={e =>
                    handleInputChange('computationModel', e.target.value)
                  }
                >
                  {COMPUTATION_MODEL_TYPES.map(model => (
                    <MenuItem key={model.value} value={model.value}>
                      <Box>
                        <Typography variant="body2">{model.label}</Typography>
                        <Chip
                          label={`Complexity: ${model.complexity}`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Execution Environment</InputLabel>
                <Select
                  value={formData.executionEnvironment}
                  onChange={e =>
                    handleInputChange('executionEnvironment', e.target.value)
                  }
                >
                  {EXECUTION_ENVIRONMENTS.map(env => (
                    <MenuItem key={env.value} value={env.value}>
                      <Box>
                        <Typography variant="body2">{env.label}</Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Chip
                            label={`Security: ${env.security}`}
                            size="small"
                          />
                          <Chip
                            label={`Performance: ${env.performance}`}
                            size="small"
                          />
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Storage Provider</InputLabel>
                <Select
                  value={formData.storageProvider}
                  onChange={e =>
                    handleInputChange('storageProvider', e.target.value)
                  }
                >
                  {STORAGE_PROVIDERS.map(provider => (
                    <MenuItem key={provider.value} value={provider.value}>
                      <Box>
                        <Typography variant="body2">
                          {provider.label}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Chip
                            label={`Cost: ${provider.cost}`}
                            size="small"
                          />
                          <Chip
                            label={`Permanence: ${provider.permanence}`}
                            size="small"
                          />
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Parameters (JSON)"
                value={formData.parameters}
                onChange={e =>
                  handleInputChange('parameters', e.target.value)
                }
                error={!!validationErrors.parameters}
                helperText={
                  validationErrors.parameters ||
                    'Enter computation parameters in JSON format'
                }
                placeholder='{"resolution": "high", "region": "north_america"}'
              />
            </Grid>
          </Grid>
        </Box>
      );

    case 2:
      return (
        <Box>
          <Typography variant="h6" gutterBottom>
              Resource Requirements
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>
                  CPU Cores: {formData.resourceRequirements.cpu_cores}
              </Typography>
              <Slider
                value={formData.resourceRequirements.cpu_cores}
                onChange={(_, value) =>
                  handleInputChange('resourceRequirements.cpu_cores', value)
                }
                min={1}
                max={32}
                step={1}
                marks
                valueLabelDisplay="auto"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>
                  Memory: {formData.resourceRequirements.memory_mb} MB
              </Typography>
              <Slider
                value={formData.resourceRequirements.memory_mb}
                onChange={(_, value) =>
                  handleInputChange('resourceRequirements.memory_mb', value)
                }
                min={128}
                max={16384}
                step={128}
                marks={[
                  { value: 128, label: '128MB' },
                  { value: 1024, label: '1GB' },
                  { value: 4096, label: '4GB' },
                  { value: 8192, label: '8GB' },
                  { value: 16384, label: '16GB' },
                ]}
                valueLabelDisplay="auto"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>
                  Storage: {formData.resourceRequirements.storage_mb} MB
              </Typography>
              <Slider
                value={formData.resourceRequirements.storage_mb}
                onChange={(_, value) =>
                  handleInputChange('resourceRequirements.storage_mb', value)
                }
                min={64}
                max={10240}
                step={64}
                marks={[
                  { value: 64, label: '64MB' },
                  { value: 512, label: '512MB' },
                  { value: 1024, label: '1GB' },
                  { value: 5120, label: '5GB' },
                  { value: 10240, label: '10GB' },
                ]}
                valueLabelDisplay="auto"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>
                  Time Limit:{' '}
                {formData.resourceRequirements.execution_time_limit_seconds}s
              </Typography>
              <Slider
                value={
                  formData.resourceRequirements.execution_time_limit_seconds
                }
                onChange={(_, value) =>
                  handleInputChange(
                    'resourceRequirements.execution_time_limit_seconds',
                    value,
                  )
                }
                min={30}
                max={3600}
                step={30}
                marks={[
                  { value: 30, label: '30s' },
                  { value: 300, label: '5m' },
                  { value: 900, label: '15m' },
                  { value: 1800, label: '30m' },
                  { value: 3600, label: '1h' },
                ]}
                valueLabelDisplay="auto"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.resourceRequirements.gpu_required}
                    onChange={e =>
                      handleInputChange(
                        'resourceRequirements.gpu_required',
                        e.target.checked,
                      )
                    }
                  />
                }
                label="Requires GPU"
              />
            </Grid>
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                      Cost Estimation
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {estimatedCost} WRF
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                      Estimated deployment cost
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      );

    case 3:
      return (
        <Box>
          <Typography variant="h6" gutterBottom>
              Review & Submit
          </Typography>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6">{formData.title}</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {formData.description}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">
                      Computation Type
                  </Typography>
                  <Typography variant="body2">
                    {
                      COMPUTATION_TYPES.find(
                        t => t.value === formData.computationType,
                      )?.label
                    }
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Model</Typography>
                  <Typography variant="body2">
                    {
                      COMPUTATION_MODEL_TYPES.find(
                        m => m.value === formData.computationModel,
                      )?.label
                    }
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Environment</Typography>
                  <Typography variant="body2">
                    {
                      EXECUTION_ENVIRONMENTS.find(
                        e => e.value === formData.executionEnvironment,
                      )?.label
                    }
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Storage</Typography>
                  <Typography variant="body2">
                    {
                      STORAGE_PROVIDERS.find(
                        s => s.value === formData.storageProvider,
                      )?.label
                    }
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">
                      Resource Requirements
                  </Typography>
                  <Typography variant="body2">
                    {formData.resourceRequirements.cpu_cores} CPU cores,{' '}
                    {formData.resourceRequirements.memory_mb}MB RAM,
                    {formData.resourceRequirements.storage_mb}MB storage
                    {formData.resourceRequirements.gpu_required &&
                        ', GPU required'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Estimated Cost</Typography>
                  <Typography variant="h6" color="primary">
                    {estimatedCost} WRF
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      );

    default:
      return null;
    }
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 1000, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Create Computational NFT
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Create a new computational NFT for climate science tasks and earn
        rewards
      </Typography>

      <Stepper activeStep={currentStep} sx={{ mb: 4 }}>
        {steps.map(label => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      {renderStepContent()}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button onClick={handleBack} disabled={currentStep === 0 || isLoading}>
          Back
        </Button>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {currentStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={isLoading}
              startIcon={<CheckIcon />}
            >
              Create NFT
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={isLoading}
            >
              Next
            </Button>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default EnhancedCreateNFTForm;
