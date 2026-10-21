import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Tooltip,
  IconButton,
  Slider,
  Divider,
  Grid,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Cloud,
  Speed,
  Thermostat,
  CheckCircle,
  Info,
  CompareArrows,
  Tune,
  Science,
  Memory,
  TrendingUp,
} from '@mui/icons-material';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, ChartTooltip, Legend);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLORS = {
  bg: '#0F172A',
  card: '#1E293B',
  border: '#334155',
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  text: '#FFFFFF',
  muted: '#94A3B8',
};

const MODELS = [
  {
    id: 'gfs_wrfcoin',
    name: 'GFS-WRFCoin Blend',
    type: 'Hybrid NWP + ML',
    resolution: '13 km',
    skillScore: 0.87,
    lastUpdated: '2h ago',
    description: 'Blends GFS dynamical output with WRFCoin neural post-processing for improved local-scale accuracy.',
    icon: Cloud,
    color: '#3B82F6',
    skills: { temperature: 0.91, precipitation: 0.78, wind: 0.84, pressure: 0.93, humidity: 0.82, severe: 0.74 },
    maxHours: 168,
    defaultHours: 72,
  },
  {
    id: 'ecmwf_ens',
    name: 'ECMWF Ensemble',
    type: 'Global Ensemble NWP',
    resolution: '18 km',
    skillScore: 0.89,
    lastUpdated: '6h ago',
    description: 'European Centre 51-member ensemble providing probabilistic forecasts with excellent medium-range skill.',
    icon: Science,
    color: '#8B5CF6',
    skills: { temperature: 0.92, precipitation: 0.81, wind: 0.86, pressure: 0.95, humidity: 0.85, severe: 0.77 },
    maxHours: 168,
    defaultHours: 120,
  },
  {
    id: 'nam_regional',
    name: 'NAM Regional',
    type: 'Regional NWP',
    resolution: '3 km',
    skillScore: 0.83,
    lastUpdated: '3h ago',
    description: 'North American Mesoscale model with fine resolution for short-range convective-scale forecasts.',
    icon: Speed,
    color: '#10B981',
    skills: { temperature: 0.85, precipitation: 0.82, wind: 0.80, pressure: 0.88, humidity: 0.79, severe: 0.81 },
    maxHours: 84,
    defaultHours: 48,
  },
  {
    id: 'hrrr',
    name: 'HRRR Rapid Refresh',
    type: 'Convective-Scale NWP',
    resolution: '3 km',
    skillScore: 0.85,
    lastUpdated: '1h ago',
    description: 'High-Resolution Rapid Refresh with hourly updates, excels at short-range convection and precipitation.',
    icon: Speed,
    color: '#F59E0B',
    skills: { temperature: 0.87, precipitation: 0.86, wind: 0.83, pressure: 0.89, humidity: 0.81, severe: 0.85 },
    maxHours: 48,
    defaultHours: 18,
  },
  {
    id: 'wrfcoin_neural',
    name: 'WRFCoin Neural',
    type: 'Deep Learning',
    resolution: '5 km',
    skillScore: 0.86,
    lastUpdated: '30min ago',
    description: 'Proprietary transformer-based model trained on crowd-sourced station data and satellite imagery.',
    icon: Memory,
    color: '#EC4899',
    skills: { temperature: 0.90, precipitation: 0.80, wind: 0.82, pressure: 0.91, humidity: 0.84, severe: 0.72 },
    maxHours: 120,
    defaultHours: 48,
  },
  {
    id: 'persistence',
    name: 'Persistence Baseline',
    type: 'Statistical Baseline',
    resolution: 'Station',
    skillScore: 0.62,
    lastUpdated: 'N/A',
    description: 'Simple persistence forecast assuming current conditions continue. Used as a skill-score baseline.',
    icon: TrendingUp,
    color: '#64748B',
    skills: { temperature: 0.70, precipitation: 0.45, wind: 0.55, pressure: 0.72, humidity: 0.60, severe: 0.30 },
    maxHours: 168,
    defaultHours: 24,
  },
  {
    id: 'climatology',
    name: 'Climatology',
    type: 'Statistical Baseline',
    resolution: 'Station',
    skillScore: 0.58,
    lastUpdated: 'N/A',
    description: 'Historical average conditions for the location and time of year. Lower bound for forecast skill.',
    icon: Thermostat,
    color: '#94A3B8',
    skills: { temperature: 0.65, precipitation: 0.40, wind: 0.48, pressure: 0.68, humidity: 0.55, severe: 0.25 },
    maxHours: 168,
    defaultHours: 168,
  },
  {
    id: 'custom_ensemble',
    name: 'Custom Ensemble',
    type: 'User-Defined Blend',
    resolution: 'Variable',
    skillScore: null,
    lastUpdated: 'User-configured',
    description: 'Build your own weighted ensemble from available models. Skill depends on member selection and weights.',
    icon: Tune,
    color: '#06B6D4',
    skills: { temperature: 0, precipitation: 0, wind: 0, pressure: 0, humidity: 0, severe: 0 },
    maxHours: 168,
    defaultHours: 72,
  },
];

const OUTPUT_PARAMETERS = [
  'Temperature (2m)', 'Dewpoint', 'Relative Humidity', 'Precipitation',
  'Wind Speed (10m)', 'Wind Direction', 'Wind Gusts', 'MSLP',
  'Cloud Cover', 'Visibility', 'CAPE/CIN', 'Snow Accumulation',
];

// ---------------------------------------------------------------------------
// ModelSelector Component
// ---------------------------------------------------------------------------

const ModelSelector = ({ selectedModels: externalSelected, onModelsChange, onConfigChange }) => {
  const [internalSelected, setInternalSelected] = useState(['gfs_wrfcoin']);
  const [compareMode, setCompareMode] = useState(false);
  const [expandedModel, setExpandedModel] = useState(null);
  const [ensembleWeights, setEnsembleWeights] = useState({});
  const [forecastHours, setForecastHours] = useState({});
  const [selectedParams, setSelectedParams] = useState(['Temperature (2m)', 'Precipitation', 'Wind Speed (10m)']);

  const selectedModels = externalSelected || internalSelected;
  const setSelectedModels = onModelsChange || setInternalSelected;

  const handleModelToggle = useCallback(
    modelId => {
      if (compareMode) {
        setSelectedModels(prev => {
          if (prev.includes(modelId)) return prev.filter(id => id !== modelId);
          if (prev.length >= 3) return prev;
          return [...prev, modelId];
        });
      } else {
        setSelectedModels(prev =>
          prev.includes(modelId) ? prev.filter(id => id !== modelId) : [...prev, modelId],
        );
      }
    },
    [compareMode, setSelectedModels],
  );

  const handleWeightChange = useCallback((modelId, weight) => {
    setEnsembleWeights(prev => ({ ...prev, [modelId]: weight }));
  }, []);

  const handleHoursChange = useCallback((modelId, hours) => {
    setForecastHours(prev => ({ ...prev, [modelId]: hours }));
  }, []);

  const selectedModelData = useMemo(
    () => MODELS.filter(m => selectedModels.includes(m.id)),
    [selectedModels],
  );

  // Radar chart data for model comparison
  const radarData = useMemo(() => {
    if (selectedModelData.length === 0) return null;
    const labels = ['Temperature', 'Precipitation', 'Wind', 'Pressure', 'Humidity', 'Severe Wx'];
    const datasets = selectedModelData
      .filter(m => m.skillScore !== null)
      .map(model => ({
        label: model.name,
        data: [
          model.skills.temperature,
          model.skills.precipitation,
          model.skills.wind,
          model.skills.pressure,
          model.skills.humidity,
          model.skills.severe,
        ],
        borderColor: model.color,
        backgroundColor: model.color + '25',
        borderWidth: 2,
        pointBackgroundColor: model.color,
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 1,
        pointRadius: 4,
      }));
    return { labels, datasets };
  }, [selectedModelData]);

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        max: 1,
        ticks: { stepSize: 0.2, color: COLORS.muted, backdropColor: 'transparent', font: { size: 10 } },
        grid: { color: COLORS.border },
        angleLines: { color: COLORS.border },
        pointLabels: { color: COLORS.muted, font: { size: 11 } },
      },
    },
    plugins: {
      legend: { display: true, position: 'bottom', labels: { color: COLORS.muted, font: { size: 11 }, padding: 12, usePointStyle: true } },
      tooltip: { backgroundColor: COLORS.card, titleColor: COLORS.text, bodyColor: COLORS.muted, borderColor: COLORS.border, borderWidth: 1 },
    },
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Science sx={{ color: COLORS.primary, fontSize: 24 }} />
          <Typography variant="h6" sx={{ color: COLORS.text, fontWeight: 700 }}>
            Model Selection
          </Typography>
        </Box>
        <FormControlLabel
          control={
            <Switch
              checked={compareMode}
              onChange={e => setCompareMode(e.target.checked)}
              size="small"
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': { color: COLORS.primary },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: COLORS.primary },
              }}
            />
          }
          label={
            <Typography sx={{ color: COLORS.muted, fontSize: 13 }}>
              Compare Mode {compareMode && '(max 3)'}
            </Typography>
          }
        />
      </Box>

      {/* Model Cards Grid */}
      <Grid container spacing={1.5}>
        {MODELS.map(model => {
          const isSelected = selectedModels.includes(model.id);
          const Icon = model.icon;
          const hours = forecastHours[model.id] || model.defaultHours;
          const isExpanded = expandedModel === model.id;

          return (
            <Grid item xs={12} sm={6} key={model.id}>
              <Card
                sx={{
                  bgcolor: isSelected ? 'rgba(59, 130, 246, 0.08)' : COLORS.card,
                  border: `1px solid ${isSelected ? COLORS.primary : COLORS.border}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': { borderColor: COLORS.primary, transform: 'translateY(-1px)' },
                }}
                onClick={() => handleModelToggle(model.id)}
              >
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 1,
                          bgcolor: model.color + '20',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon sx={{ color: model.color, fontSize: 18 }} />
                      </Box>
                      <Box>
                        <Typography sx={{ color: COLORS.text, fontWeight: 600, fontSize: 13, lineHeight: 1.2 }}>
                          {model.name}
                        </Typography>
                        <Typography sx={{ color: COLORS.muted, fontSize: 11 }}>{model.type}</Typography>
                      </Box>
                    </Box>
                    {isSelected && <CheckCircle sx={{ color: COLORS.primary, fontSize: 18 }} />}
                  </Box>

                  {/* Quick stats */}
                  <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={model.resolution}
                      size="small"
                      sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: COLORS.muted, fontSize: 10, height: 20 }}
                    />
                    {model.skillScore !== null && (
                      <Chip
                        label={`Skill: ${model.skillScore.toFixed(2)}`}
                        size="small"
                        sx={{
                          bgcolor: model.skillScore > 0.85 ? 'rgba(16,185,129,0.15)' : model.skillScore > 0.7 ? 'rgba(245,158,11,0.15)' : 'rgba(100,116,139,0.15)',
                          color: model.skillScore > 0.85 ? COLORS.success : model.skillScore > 0.7 ? COLORS.warning : COLORS.muted,
                          fontSize: 10,
                          height: 20,
                        }}
                      />
                    )}
                    <Chip
                      label={`Updated ${model.lastUpdated}`}
                      size="small"
                      sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: COLORS.muted, fontSize: 10, height: 20 }}
                    />
                  </Box>

                  {/* Skill bar */}
                  {model.skillScore !== null && (
                    <Box sx={{ mt: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={model.skillScore * 100}
                        sx={{
                          height: 4,
                          borderRadius: 2,
                          bgcolor: 'rgba(255,255,255,0.05)',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: model.color,
                            borderRadius: 2,
                          },
                        }}
                      />
                    </Box>
                  )}

                  {/* Expanded configuration */}
                  {isSelected && (
                    <Box
                      sx={{ mt: 1.5, pt: 1.5, borderTop: `1px solid ${COLORS.border}` }}
                      onClick={e => e.stopPropagation()}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography sx={{ color: COLORS.muted, fontSize: 11 }}>Forecast Hours</Typography>
                        <Typography sx={{ color: COLORS.text, fontSize: 12, fontWeight: 600 }}>{hours}h</Typography>
                      </Box>
                      <Slider
                        value={hours}
                        min={1}
                        max={model.maxHours}
                        step={model.maxHours <= 48 ? 1 : 6}
                        onChange={(_, val) => handleHoursChange(model.id, val)}
                        size="small"
                        sx={{
                          color: model.color,
                          '& .MuiSlider-thumb': { width: 14, height: 14 },
                          '& .MuiSlider-track': { height: 3 },
                          '& .MuiSlider-rail': { height: 3, bgcolor: COLORS.border },
                        }}
                      />
                      <Tooltip title={model.description} arrow placement="bottom">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          <Info sx={{ color: COLORS.muted, fontSize: 12 }} />
                          <Typography sx={{ color: COLORS.muted, fontSize: 11, fontStyle: 'italic' }}>
                            {model.description.slice(0, 80)}...
                          </Typography>
                        </Box>
                      </Tooltip>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Ensemble Weight Builder */}
      {selectedModels.includes('custom_ensemble') && selectedModelData.length > 1 && (
        <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, p: 2 }}>
          <Typography sx={{ color: COLORS.text, fontWeight: 600, fontSize: 14, mb: 1.5 }}>
            Ensemble Weight Builder
          </Typography>
          <Typography sx={{ color: COLORS.muted, fontSize: 12, mb: 2 }}>
            Assign weights to each selected model. Weights are normalized to sum to 1.0.
          </Typography>
          {selectedModelData
            .filter(m => m.id !== 'custom_ensemble')
            .map(model => {
              const weight = ensembleWeights[model.id] || 1;
              return (
                <Box key={model.id} sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ color: COLORS.text, fontSize: 12 }}>{model.name}</Typography>
                    <Typography sx={{ color: model.color, fontSize: 12, fontWeight: 600 }}>
                      {weight.toFixed(1)}
                    </Typography>
                  </Box>
                  <Slider
                    value={weight}
                    min={0}
                    max={5}
                    step={0.1}
                    onChange={(_, val) => handleWeightChange(model.id, val)}
                    size="small"
                    sx={{
                      color: model.color,
                      '& .MuiSlider-thumb': { width: 14, height: 14 },
                    }}
                  />
                </Box>
              );
            })}
        </Paper>
      )}

      {/* Output Parameters */}
      <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, p: 2 }}>
        <Typography sx={{ color: COLORS.text, fontWeight: 600, fontSize: 14, mb: 1 }}>
          Output Parameters
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {OUTPUT_PARAMETERS.map(param => (
            <Chip
              key={param}
              label={param}
              size="small"
              onClick={() =>
                setSelectedParams(prev =>
                  prev.includes(param) ? prev.filter(p => p !== param) : [...prev, param],
                )
              }
              sx={{
                bgcolor: selectedParams.includes(param) ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
                color: selectedParams.includes(param) ? COLORS.primary : COLORS.muted,
                borderColor: selectedParams.includes(param) ? COLORS.primary : 'transparent',
                fontSize: 11,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'rgba(59,130,246,0.1)' },
              }}
              variant={selectedParams.includes(param) ? 'outlined' : 'filled'}
            />
          ))}
        </Box>
      </Paper>

      {/* Model Comparison Radar Chart */}
      {radarData && selectedModelData.filter(m => m.skillScore !== null).length >= 1 && (
        <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <CompareArrows sx={{ color: COLORS.primary, fontSize: 18 }} />
            <Typography sx={{ color: COLORS.text, fontWeight: 600, fontSize: 14 }}>
              Skill Comparison
            </Typography>
          </Box>
          <Box sx={{ height: 260 }}>
            <Radar data={radarData} options={radarOptions} />
          </Box>
        </Paper>
      )}

      {/* Selection Summary */}
      <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, p: 2 }}>
        <Typography sx={{ color: COLORS.muted, fontSize: 12, mb: 0.5 }}>
          {selectedModels.length} model{selectedModels.length !== 1 ? 's' : ''} selected
          {selectedParams.length > 0 && ` | ${selectedParams.length} parameter${selectedParams.length !== 1 ? 's' : ''}`}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {selectedModelData.map(m => (
            <Chip
              key={m.id}
              label={m.name}
              size="small"
              sx={{ bgcolor: m.color + '20', color: m.color, fontSize: 11 }}
            />
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default ModelSelector;
