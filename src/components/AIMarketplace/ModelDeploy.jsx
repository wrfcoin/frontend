import React, { useState, useMemo, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import DemoSurfaceGate from '../common/DemoSurfaceGate';

// frontend#353: no backend route deploys models (the deployed API mounts no
// /api/ai-marketplace). The former Deploy Now waited on a timer, then showed
// "Deployment Successful" and invented an active deployment. The default
// build shows an honest not-live state; in the demo build Deploy is disabled.
const SAMPLE_ACTION = 'Sample only: models are not deployed anywhere.';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Select,
  MenuItem,
  Grid,
  Stepper,
  Step,
  StepLabel,
  TextField,
  LinearProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Avatar,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  RocketLaunch,
  SmartToy,
  CloudUpload,
  Speed,
  Memory,
  Schedule,
  CheckCircle,
  Error as ErrorIcon,
  PlayArrow,
  Stop,
  Delete,
  Settings,
  TrendingUp,
} from '@mui/icons-material';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STEPS = ['Select Model', 'Configure Input', 'Set Schedule', 'Review & Deploy'];

const SCHEDULE_OPTIONS = [
  { value: 'realtime', label: 'Real-time (continuous)', interval: 'Every reading', costMultiplier: 4.0 },
  { value: 'hourly', label: 'Hourly', interval: 'Every 60 min', costMultiplier: 1.0 },
  { value: '6hour', label: 'Every 6 hours', interval: 'Every 360 min', costMultiplier: 0.18 },
  { value: 'daily', label: 'Daily', interval: 'Every 24 hours', costMultiplier: 0.05 },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ModelDeploySample = ({ model, allModels = [], onBack }) => {
  const [activeStep, setActiveStep] = useState(model ? 1 : 0);
  const [selectedModel, setSelectedModel] = useState(model || null);
  const [selectedStations, setSelectedStations] = useState([]);
  const [selectedParams, setSelectedParams] = useState(['temperature', 'humidity', 'windSpeed', 'pressure']);
  const [schedule, setSchedule] = useState('hourly');
  const [gpuAllocation, setGpuAllocation] = useState(50);
  const [memoryLimit, setMemoryLimit] = useState(1024);
  const [deploying, setDeploying] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState(false);
  const [deployments, setDeployments] = useState([]);
  const [stations, setStations] = useState([]);

  useEffect(() => {
    apiClient.get('/ai-marketplace/stations')
      .then((data) => setStations(Array.isArray(data) ? data : (data.stations ?? [])))
      .catch(() => setStations([]));
    apiClient.get('/ai-marketplace/deployments')
      .then((data) => setDeployments(Array.isArray(data) ? data : (data.deployments ?? [])))
      .catch(() => setDeployments([]));
  }, []);

  const scheduleOption = SCHEDULE_OPTIONS.find((s) => s.value === schedule);

  const dailyCost = useMemo(() => {
    if (!selectedModel) return 0;
    const baseCost = parseFloat(selectedModel.costPer1k || '0.12');
    const stationCount = selectedStations.length || 1;
    const multiplier = scheduleOption ? scheduleOption.costMultiplier : 1;
    return parseFloat((baseCost * stationCount * 24 * multiplier).toFixed(2));
  }, [selectedModel, selectedStations, scheduleOption]);

  const canProceed = () => {
    if (activeStep === 0) return selectedModel !== null;
    if (activeStep === 1) return selectedStations.length > 0 && selectedParams.length > 0;
    if (activeStep === 2) return schedule !== '';
    return true;
  };


  const toggleStation = (stationId) => {
    setSelectedStations((prev) =>
      prev.includes(stationId) ? prev.filter((s) => s !== stationId) : [...prev, stationId],
    );
  };

  const toggleParam = (param) => {
    setSelectedParams((prev) =>
      prev.includes(param) ? prev.filter((p) => p !== param) : [...prev, param],
    );
  };

  const panelSx = {
    backgroundColor: '#1E293B',
    border: '1px solid #334155',
    borderRadius: 2,
    p: 2.5,
  };

  const statusColors = { active: '#10B981', error: '#EF4444', deploying: '#F59E0B', stopped: '#64748B' };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <RocketLaunch sx={{ color: '#3B82F6', fontSize: 28 }} />
        <Typography variant="h5" sx={{ color: '#F1F5F9', fontWeight: 700 }}>
          Deploy Model
        </Typography>
      </Box>

      {/* Step wizard */}
      {!deploySuccess && (
        <>
          <Paper sx={{ ...panelSx, mb: 3 }}>
            <Stepper
              activeStep={activeStep}
              sx={{
                '& .MuiStepLabel-label': { color: '#64748B', fontWeight: 600, fontSize: '0.85rem' },
                '& .MuiStepLabel-label.Mui-active': { color: '#3B82F6' },
                '& .MuiStepLabel-label.Mui-completed': { color: '#10B981' },
                '& .MuiStepIcon-root': { color: '#334155' },
                '& .MuiStepIcon-root.Mui-active': { color: '#3B82F6' },
                '& .MuiStepIcon-root.Mui-completed': { color: '#10B981' },
                '& .MuiStepConnector-line': { borderColor: '#334155' },
              }}
            >
              {STEPS.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>

          {/* Step 0: Select Model */}
          {activeStep === 0 && (
            <Paper sx={panelSx}>
              <Typography variant="subtitle1" sx={{ color: '#F1F5F9', fontWeight: 700, mb: 2 }}>
                Choose a Model to Deploy
              </Typography>
              <Grid container spacing={2}>
                {allModels.slice(0, 8).map((m) => (
                  <Grid item xs={12} sm={6} md={3} key={m.id}>
                    <Paper
                      onClick={() => setSelectedModel(m)}
                      sx={{
                        p: 2,
                        backgroundColor: selectedModel?.id === m.id ? '#3B82F618' : '#0F172A',
                        border: '1px solid',
                        borderColor: selectedModel?.id === m.id ? '#3B82F6' : '#334155',
                        borderRadius: 2,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': { borderColor: '#3B82F6' },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <SmartToy sx={{ fontSize: 18, color: '#3B82F6' }} />
                        <Typography variant="body2" sx={{ color: '#F1F5F9', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.name}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        RMSE: {m.rmse.toFixed(2)} | {m.framework}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}

          {/* Step 1: Configure Input */}
          {activeStep === 1 && (
            <Paper sx={panelSx}>
              <Typography variant="subtitle1" sx={{ color: '#F1F5F9', fontWeight: 700, mb: 2 }}>
                Data Sources & Parameters
              </Typography>

              <Typography variant="subtitle2" sx={{ color: '#94A3B8', mb: 1 }}>
                Select Weather Stations
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                {stations.map((station) => (
                  <Chip
                    key={station.id}
                    label={`${station.name} (${station.location})`}
                    onClick={() => toggleStation(station.id)}
                    sx={{
                      backgroundColor: selectedStations.includes(station.id)
                        ? '#3B82F622'
                        : '#0F172A',
                      color: selectedStations.includes(station.id) ? '#3B82F6' : '#94A3B8',
                      border: '1px solid',
                      borderColor: selectedStations.includes(station.id) ? '#3B82F6' : '#334155',
                      fontWeight: 600,
                      '&:hover': { borderColor: '#3B82F6' },
                    }}
                  />
                ))}
              </Box>

              <Typography variant="subtitle2" sx={{ color: '#94A3B8', mb: 1 }}>
                Parameters to Forecast
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {[
                  { id: 'temperature', label: 'Temperature' },
                  { id: 'humidity', label: 'Humidity' },
                  { id: 'windSpeed', label: 'Wind Speed' },
                  { id: 'pressure', label: 'Pressure' },
                  { id: 'precipitation', label: 'Precipitation' },
                  { id: 'dewpoint', label: 'Dew Point' },
                  { id: 'visibility', label: 'Visibility' },
                  { id: 'uvIndex', label: 'UV Index' },
                ].map((param) => (
                  <Chip
                    key={param.id}
                    label={param.label}
                    onClick={() => toggleParam(param.id)}
                    sx={{
                      backgroundColor: selectedParams.includes(param.id)
                        ? '#10B98122'
                        : '#0F172A',
                      color: selectedParams.includes(param.id) ? '#10B981' : '#94A3B8',
                      border: '1px solid',
                      borderColor: selectedParams.includes(param.id) ? '#10B981' : '#334155',
                      fontWeight: 600,
                      '&:hover': { borderColor: '#10B981' },
                    }}
                  />
                ))}
              </Box>
            </Paper>
          )}

          {/* Step 2: Set Schedule */}
          {activeStep === 2 && (
            <Paper sx={panelSx}>
              <Typography variant="subtitle1" sx={{ color: '#F1F5F9', fontWeight: 700, mb: 2 }}>
                Execution Schedule & Resources
              </Typography>

              <Typography variant="subtitle2" sx={{ color: '#94A3B8', mb: 1 }}>
                Prediction Schedule
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {SCHEDULE_OPTIONS.map((opt) => (
                  <Grid item xs={6} md={3} key={opt.value}>
                    <Paper
                      onClick={() => setSchedule(opt.value)}
                      sx={{
                        p: 2,
                        backgroundColor: schedule === opt.value ? '#3B82F618' : '#0F172A',
                        border: '1px solid',
                        borderColor: schedule === opt.value ? '#3B82F6' : '#334155',
                        borderRadius: 2,
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s',
                        '&:hover': { borderColor: '#3B82F6' },
                      }}
                    >
                      <Schedule sx={{ fontSize: 24, color: schedule === opt.value ? '#3B82F6' : '#64748B', mb: 0.5 }} />
                      <Typography variant="body2" sx={{ color: '#F1F5F9', fontWeight: 600 }}>
                        {opt.label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        {opt.interval}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              <Typography variant="subtitle2" sx={{ color: '#94A3B8', mb: 1 }}>
                Resource Allocation
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#94A3B8' }}>
                        GPU / CPU Allocation
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#3B82F6', fontWeight: 600 }}>
                        {gpuAllocation}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={gpuAllocation}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#334155',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: gpuAllocation > 80 ? '#EF4444' : gpuAllocation > 50 ? '#F59E0B' : '#3B82F6',
                          borderRadius: 4,
                        },
                      }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Button size="small" sx={{ color: '#64748B', minWidth: 40 }} onClick={() => setGpuAllocation(Math.max(10, gpuAllocation - 10))}>
                        -
                      </Button>
                      <Button size="small" sx={{ color: '#64748B', minWidth: 40 }} onClick={() => setGpuAllocation(Math.min(100, gpuAllocation + 10))}>
                        +
                      </Button>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#94A3B8', mb: 0.5 }}>
                      Memory Limit
                    </Typography>
                    <Select
                      value={memoryLimit}
                      onChange={(e) => setMemoryLimit(e.target.value)}
                      fullWidth
                      size="small"
                      sx={{
                        color: '#F1F5F9',
                        '.MuiOutlinedInput-notchedOutline': { borderColor: '#334155' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3B82F6' },
                        '.MuiSvgIcon-root': { color: '#64748B' },
                      }}
                    >
                      {[512, 1024, 2048, 4096].map((v) => (
                        <MenuItem key={v} value={v}>{v} MB</MenuItem>
                      ))}
                    </Select>
                  </Box>
                </Grid>
              </Grid>

              {/* Cost estimate */}
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  backgroundColor: '#0F172A',
                  borderRadius: 2,
                  border: '1px solid #334155',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#94A3B8' }}>
                    Estimated Daily Cost
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#F59E0B', fontWeight: 700 }}>
                    {dailyCost} WRF
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  ~{(dailyCost * 30).toFixed(2)} WRF/month | Based on {selectedStations.length || 1} station(s), {schedule} schedule
                </Typography>
              </Box>
            </Paper>
          )}

          {/* Step 3: Review & Deploy */}
          {activeStep === 3 && !deploying && (
            <Paper sx={panelSx}>
              <Typography variant="subtitle1" sx={{ color: '#F1F5F9', fontWeight: 700, mb: 2 }}>
                Deployment Summary
              </Typography>
              <Table size="small">
                <TableBody>
                  {[
                    ['Model', selectedModel?.name || 'None'],
                    ['Framework', selectedModel?.framework || '-'],
                    ['Stations', selectedStations.map((s) => stations.find((ms) => ms.id === s)?.name || s).join(', ') || 'None'],
                    ['Parameters', selectedParams.join(', ')],
                    ['Schedule', SCHEDULE_OPTIONS.find((s) => s.value === schedule)?.label || schedule],
                    ['GPU Allocation', `${gpuAllocation}%`],
                    ['Memory Limit', `${memoryLimit} MB`],
                    ['Daily Cost', `${dailyCost} WRF`],
                    ['Monthly Cost', `${(dailyCost * 30).toFixed(2)} WRF`],
                  ].map(([label, value]) => (
                    <TableRow key={label}>
                      <TableCell sx={{ color: '#94A3B8', borderColor: '#334155', fontWeight: 600, width: 160 }}>
                        {label}
                      </TableCell>
                      <TableCell sx={{ color: '#F1F5F9', borderColor: '#334155' }}>
                        {value}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}

          {/* Deploying state */}
          {deploying && (
            <Paper sx={{ ...panelSx, textAlign: 'center', py: 6 }}>
              <RocketLaunch sx={{ fontSize: 48, color: '#3B82F6', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#F1F5F9', mb: 1 }}>
                Deploying {selectedModel?.name}...
              </Typography>
              <LinearProgress
                sx={{
                  mx: 'auto',
                  maxWidth: 400,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: '#334155',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#3B82F6', borderRadius: 3 },
                }}
              />
              <Typography variant="caption" sx={{ color: '#64748B', mt: 2, display: 'block' }}>
                Provisioning resources, initializing model weights, connecting to station data feeds...
              </Typography>
            </Paper>
          )}

          {/* Navigation */}
          {!deploying && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                disabled={activeStep === 0}
                onClick={() => setActiveStep((s) => s - 1)}
                sx={{ color: '#94A3B8', textTransform: 'none' }}
              >
                Back
              </Button>
              {activeStep < 3 ? (
                <Button
                  variant="contained"
                  disabled={!canProceed()}
                  onClick={() => setActiveStep((s) => s + 1)}
                  sx={{
                    backgroundColor: '#3B82F6',
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': { backgroundColor: '#2563EB' },
                    '&:disabled': { backgroundColor: '#334155', color: '#64748B' },
                  }}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<RocketLaunch />}
                  disabled
                  title={SAMPLE_ACTION}
                  sx={{
                    backgroundColor: '#10B981',
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': { backgroundColor: '#059669' },
                  }}
                >
                  Deploy Now
                </Button>
              )}
            </Box>
          )}
        </>
      )}

      {/* Deploy success */}
      {deploySuccess && (
        <Paper sx={{ ...panelSx, textAlign: 'center', py: 6, mb: 3 }}>
          <CheckCircle sx={{ fontSize: 64, color: '#10B981', mb: 2 }} />
          <Typography variant="h5" sx={{ color: '#F1F5F9', fontWeight: 700, mb: 1 }}>
            Deployment Successful
          </Typography>
          <Typography variant="body1" sx={{ color: '#94A3B8', mb: 3 }}>
            {selectedModel?.name} is now running and generating predictions.
          </Typography>
          <Button
            variant="outlined"
            onClick={() => {
              setDeploySuccess(false);
              setActiveStep(0);
              setSelectedModel(null);
              setSelectedStations([]);
            }}
            sx={{
              borderColor: '#3B82F6',
              color: '#3B82F6',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { borderColor: '#2563EB', backgroundColor: '#3B82F611' },
            }}
          >
            Deploy Another Model
          </Button>
        </Paper>
      )}

      {/* Active Deployments */}
      <Paper sx={{ ...panelSx, mt: 3 }}>
        <Typography variant="subtitle1" sx={{ color: '#F1F5F9', fontWeight: 700, mb: 2 }}>
          Active Deployments
        </Typography>
        {deployments.length === 0 ? (
          <Typography variant="body2" sx={{ color: '#64748B', textAlign: 'center', py: 4 }}>
            No active deployments yet. Deploy a model to get started.
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Status', 'Model', 'Station', 'Schedule', 'Predictions', 'Cost', 'Accuracy', 'Actions'].map((h) => (
                  <TableCell key={h} sx={{ color: '#64748B', borderColor: '#334155', fontWeight: 600 }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {deployments.map((dep) => (
                <TableRow key={dep.id} sx={{ '&:hover': { backgroundColor: '#33415522' } }}>
                  <TableCell sx={{ borderColor: '#334155' }}>
                    <Tooltip title={dep.status === 'error' ? dep.errorMsg : dep.status}>
                      <Chip
                        icon={
                          dep.status === 'active' ? (
                            <CheckCircle sx={{ fontSize: 14, color: '#10B981 !important' }} />
                          ) : (
                            <ErrorIcon sx={{ fontSize: 14, color: '#EF4444 !important' }} />
                          )
                        }
                        label={dep.status.charAt(0).toUpperCase() + dep.status.slice(1)}
                        size="small"
                        sx={{
                          height: 24,
                          backgroundColor: `${statusColors[dep.status]}18`,
                          color: statusColors[dep.status],
                          fontWeight: 600,
                          fontSize: '0.72rem',
                        }}
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ color: '#F1F5F9', borderColor: '#334155', fontWeight: 600 }}>
                    {dep.modelName}
                  </TableCell>
                  <TableCell sx={{ color: '#94A3B8', borderColor: '#334155', fontSize: '0.8rem' }}>
                    {dep.stationName}
                  </TableCell>
                  <TableCell sx={{ color: '#94A3B8', borderColor: '#334155' }}>
                    <Chip
                      label={dep.schedule}
                      size="small"
                      sx={{ height: 20, fontSize: '0.65rem', backgroundColor: '#1E40AF22', color: '#60A5FA' }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: '#F1F5F9', borderColor: '#334155', fontWeight: 600 }}>
                    {dep.predictionsMade.toLocaleString()}
                  </TableCell>
                  <TableCell sx={{ color: '#F59E0B', borderColor: '#334155', fontWeight: 600 }}>
                    {dep.costSoFar.toFixed(2)} WRF
                  </TableCell>
                  <TableCell sx={{ borderColor: '#334155' }}>
                    {dep.accuracy > 0 ? (
                      <Typography
                        variant="body2"
                        sx={{
                          color: dep.accuracy >= 90 ? '#10B981' : dep.accuracy >= 80 ? '#F59E0B' : '#EF4444',
                          fontWeight: 600,
                        }}
                      >
                        {dep.accuracy}%
                      </Typography>
                    ) : (
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Pending
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ borderColor: '#334155' }}>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {dep.status === 'active' ? (
                        <Tooltip title="Stop">
                          <IconButton size="small" sx={{ color: '#EF4444' }}>
                            <Stop sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Restart">
                          <IconButton size="small" sx={{ color: '#10B981' }}>
                            <PlayArrow sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Settings">
                        <IconButton size="small" sx={{ color: '#64748B' }}>
                          <Settings sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" sx={{ color: '#64748B', '&:hover': { color: '#EF4444' } }}>
                          <Delete sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Box>
  );
};

const ModelDeploy = (props) => (
  <DemoSurfaceGate
    title="Model deployment is not live on the testnet"
    description="No testnet endpoint deploys AI models or runs scheduled predictions yet."
    testId="ai-model-deploy"
  >
    <ModelDeploySample {...props} />
  </DemoSurfaceGate>
);

export default ModelDeploy;
