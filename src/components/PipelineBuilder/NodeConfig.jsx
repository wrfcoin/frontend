import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  Divider,
  Switch,
  FormControlLabel,
  Slider,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Sensors as SensorsIcon,
  Transform as TransformIcon,
  Psychology as PsychologyIcon,
  Output as OutputIcon,
} from '@mui/icons-material';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WEATHER_STATIONS = [
  { id: 'WS-001', name: 'Downtown Station Alpha', location: 'New York, NY' },
  { id: 'WS-002', name: 'Harbor Weather Node', location: 'San Francisco, CA' },
  { id: 'WS-003', name: 'Mountain Ridge Sensor', location: 'Denver, CO' },
  { id: 'WS-004', name: 'Coastal Observer', location: 'Miami, FL' },
  { id: 'WS-005', name: 'Plains Weather Hub', location: 'Dallas, TX' },
  { id: 'WS-006', name: 'Arctic Sentinel', location: 'Fairbanks, AK' },
  { id: 'WS-007', name: 'Desert Monitor', location: 'Phoenix, AZ' },
  { id: 'WS-008', name: 'Lake Effect Station', location: 'Chicago, IL' },
];

const DATA_PARAMETERS = [
  { key: 'temperature', label: 'Temperature', unit: 'C' },
  { key: 'humidity', label: 'Humidity', unit: '%' },
  { key: 'pressure', label: 'Pressure', unit: 'hPa' },
  { key: 'windSpeed', label: 'Wind Speed', unit: 'm/s' },
  { key: 'windDirection', label: 'Wind Direction', unit: 'deg' },
  { key: 'rainfall', label: 'Rainfall', unit: 'mm' },
  { key: 'uvIndex', label: 'UV Index', unit: '' },
  { key: 'visibility', label: 'Visibility', unit: 'km' },
];

const TRANSFORM_OPERATIONS = [
  { key: 'average', label: 'Moving Average', description: 'Compute rolling mean over a window' },
  { key: 'min', label: 'Minimum', description: 'Find minimum value in window' },
  { key: 'max', label: 'Maximum', description: 'Find maximum value in window' },
  { key: 'resample', label: 'Resample', description: 'Change data frequency (upsample/downsample)' },
  { key: 'interpolate', label: 'Interpolate', description: 'Fill missing data points' },
  { key: 'derivative', label: 'Derivative', description: 'Rate of change over time' },
  { key: 'zscore', label: 'Z-Score', description: 'Standardize values (anomaly detection)' },
  { key: 'threshold', label: 'Threshold Filter', description: 'Keep values above/below threshold' },
];

const ML_MODELS = [
  { key: 'temp-forecast-lstm', label: 'Temperature Forecast (LSTM)', accuracy: 94.2 },
  { key: 'precip-ensemble', label: 'Precipitation Ensemble', accuracy: 88.7 },
  { key: 'anomaly-autoencoder', label: 'Anomaly Detector (Autoencoder)', accuracy: 91.5 },
  { key: 'wind-gradient-boost', label: 'Wind Speed (XGBoost)', accuracy: 89.3 },
  { key: 'severe-weather-cnn', label: 'Severe Weather Classifier (CNN)', accuracy: 92.8 },
  { key: 'fog-prediction-rf', label: 'Fog Prediction (Random Forest)', accuracy: 85.1 },
];

const OUTPUT_DESTINATIONS = [
  { key: 'dashboard', label: 'Dashboard Widget', icon: 'chart' },
  { key: 'email', label: 'Email Alert', icon: 'mail' },
  { key: 'webhook', label: 'Webhook (HTTP POST)', icon: 'api' },
  { key: 'csv', label: 'CSV Export', icon: 'file' },
  { key: 'blockchain', label: 'On-Chain Record', icon: 'chain' },
  { key: 'mqtt', label: 'MQTT Publish', icon: 'broadcast' },
];

const colors = {
  bg: '#0F172A',
  card: '#1E293B',
  border: '#334155',
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  inputBg: '#0F172A',
};

const NODE_TYPE_META = {
  source: { label: 'Data Source', color: '#3B82F6', icon: SensorsIcon },
  transform: { label: 'Transform', color: '#F59E0B', icon: TransformIcon },
  ml: { label: 'ML Model', color: '#8B5CF6', icon: PsychologyIcon },
  output: { label: 'Output', color: '#10B981', icon: OutputIcon },
};

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateConfig(nodeType, config) {
  const errors = {};

  if (nodeType === 'source') {
    if (!config.stationId) errors.stationId = 'Station is required';
    if (!config.parameters || config.parameters.length === 0) {
      errors.parameters = 'Select at least one parameter';
    }
  }

  if (nodeType === 'transform') {
    if (!config.operation) errors.operation = 'Operation is required';
    if (config.operation === 'threshold' && config.thresholdValue === undefined) {
      errors.thresholdValue = 'Threshold value is required';
    }
    if (['average', 'min', 'max'].includes(config.operation) && (!config.windowSize || config.windowSize < 1)) {
      errors.windowSize = 'Window size must be at least 1';
    }
  }

  if (nodeType === 'ml') {
    if (!config.modelId) errors.modelId = 'Model is required';
    if (config.confidenceThreshold !== undefined && (config.confidenceThreshold < 0 || config.confidenceThreshold > 1)) {
      errors.confidenceThreshold = 'Confidence must be between 0 and 1';
    }
  }

  if (nodeType === 'output') {
    if (!config.destination) errors.destination = 'Destination is required';
    if (config.destination === 'email' && !config.emailAddress) {
      errors.emailAddress = 'Email address is required';
    }
    if (config.destination === 'webhook' && !config.webhookUrl) {
      errors.webhookUrl = 'Webhook URL is required';
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Sub-forms
// ---------------------------------------------------------------------------

function SourceConfig({ config, onChange, errors }) {
  const handleParamToggle = useCallback((paramKey) => {
    const current = config.parameters || [];
    const updated = current.includes(paramKey)
      ? current.filter((p) => p !== paramKey)
      : [...current, paramKey];
    onChange({ ...config, parameters: updated });
  }, [config, onChange]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <FormControl fullWidth error={!!errors.stationId} size="small">
        <InputLabel sx={{ color: colors.textSecondary }}>Weather Station</InputLabel>
        <Select
          value={config.stationId || ''}
          label="Weather Station"
          onChange={(e) => onChange({ ...config, stationId: e.target.value })}
          sx={{ color: colors.text, bgcolor: colors.inputBg, '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border } }}
        >
          {WEATHER_STATIONS.map((s) => (
            <MenuItem key={s.id} value={s.id}>
              {s.name} ({s.location})
            </MenuItem>
          ))}
        </Select>
        {errors.stationId && (
          <Typography variant="caption" sx={{ color: colors.error, mt: 0.5 }}>{errors.stationId}</Typography>
        )}
      </FormControl>

      <Box>
        <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 1 }}>Date Range</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            type="date"
            size="small"
            value={config.startDate || ''}
            onChange={(e) => onChange({ ...config, startDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ flex: 1, '& input': { color: colors.text }, '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border } }}
          />
          <TextField
            type="date"
            size="small"
            value={config.endDate || ''}
            onChange={(e) => onChange({ ...config, endDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ flex: 1, '& input': { color: colors.text }, '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border } }}
          />
        </Box>
      </Box>

      <Box>
        <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 1 }}>
          Parameters {errors.parameters && <Typography component="span" variant="caption" sx={{ color: colors.error }}>- {errors.parameters}</Typography>}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {DATA_PARAMETERS.map((p) => (
            <Chip
              key={p.key}
              label={`${p.label}${p.unit ? ` (${p.unit})` : ''}`}
              size="small"
              onClick={() => handleParamToggle(p.key)}
              variant={(config.parameters || []).includes(p.key) ? 'filled' : 'outlined'}
              sx={{
                color: (config.parameters || []).includes(p.key) ? '#fff' : colors.textSecondary,
                bgcolor: (config.parameters || []).includes(p.key) ? colors.primary : 'transparent',
                borderColor: colors.border,
                '&:hover': { bgcolor: (config.parameters || []).includes(p.key) ? '#2563EB' : 'rgba(59,130,246,0.1)' },
              }}
            />
          ))}
        </Box>
      </Box>

      <FormControlLabel
        control={
          <Switch
            checked={config.realtime || false}
            onChange={(e) => onChange({ ...config, realtime: e.target.checked })}
            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: colors.primary } }}
          />
        }
        label={<Typography variant="body2" sx={{ color: colors.textSecondary }}>Real-time streaming</Typography>}
      />
    </Box>
  );
}

function TransformConfig({ config, onChange, errors }) {
  const selectedOp = TRANSFORM_OPERATIONS.find((o) => o.key === config.operation);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <FormControl fullWidth error={!!errors.operation} size="small">
        <InputLabel sx={{ color: colors.textSecondary }}>Operation</InputLabel>
        <Select
          value={config.operation || ''}
          label="Operation"
          onChange={(e) => onChange({ ...config, operation: e.target.value })}
          sx={{ color: colors.text, bgcolor: colors.inputBg, '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border } }}
        >
          {TRANSFORM_OPERATIONS.map((o) => (
            <MenuItem key={o.key} value={o.key}>{o.label}</MenuItem>
          ))}
        </Select>
        {errors.operation && (
          <Typography variant="caption" sx={{ color: colors.error, mt: 0.5 }}>{errors.operation}</Typography>
        )}
      </FormControl>

      {selectedOp && (
        <Alert severity="info" sx={{ bgcolor: 'rgba(59,130,246,0.1)', color: colors.textSecondary, '& .MuiAlert-icon': { color: colors.primary } }}>
          {selectedOp.description}
        </Alert>
      )}

      {['average', 'min', 'max'].includes(config.operation) && (
        <Box>
          <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 1 }}>
            Window Size (data points): {config.windowSize || 10}
          </Typography>
          <Slider
            value={config.windowSize || 10}
            min={1}
            max={100}
            onChange={(_, v) => onChange({ ...config, windowSize: v })}
            sx={{ color: colors.primary }}
          />
          {errors.windowSize && (
            <Typography variant="caption" sx={{ color: colors.error }}>{errors.windowSize}</Typography>
          )}
        </Box>
      )}

      {config.operation === 'resample' && (
        <FormControl fullWidth size="small">
          <InputLabel sx={{ color: colors.textSecondary }}>Target Frequency</InputLabel>
          <Select
            value={config.resampleFreq || '5min'}
            label="Target Frequency"
            onChange={(e) => onChange({ ...config, resampleFreq: e.target.value })}
            sx={{ color: colors.text, bgcolor: colors.inputBg, '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border } }}
          >
            <MenuItem value="1min">1 Minute</MenuItem>
            <MenuItem value="5min">5 Minutes</MenuItem>
            <MenuItem value="15min">15 Minutes</MenuItem>
            <MenuItem value="1h">1 Hour</MenuItem>
            <MenuItem value="6h">6 Hours</MenuItem>
            <MenuItem value="1d">1 Day</MenuItem>
          </Select>
        </FormControl>
      )}

      {config.operation === 'threshold' && (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel sx={{ color: colors.textSecondary }}>Direction</InputLabel>
            <Select
              value={config.thresholdDirection || 'above'}
              label="Direction"
              onChange={(e) => onChange({ ...config, thresholdDirection: e.target.value })}
              sx={{ color: colors.text, bgcolor: colors.inputBg, '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border } }}
            >
              <MenuItem value="above">Above</MenuItem>
              <MenuItem value="below">Below</MenuItem>
            </Select>
          </FormControl>
          <TextField
            type="number"
            size="small"
            label="Value"
            value={config.thresholdValue ?? ''}
            onChange={(e) => onChange({ ...config, thresholdValue: parseFloat(e.target.value) })}
            error={!!errors.thresholdValue}
            helperText={errors.thresholdValue}
            sx={{ flex: 1, '& input': { color: colors.text }, '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border } }}
          />
        </Box>
      )}

      {config.operation === 'interpolate' && (
        <FormControl fullWidth size="small">
          <InputLabel sx={{ color: colors.textSecondary }}>Method</InputLabel>
          <Select
            value={config.interpMethod || 'linear'}
            label="Method"
            onChange={(e) => onChange({ ...config, interpMethod: e.target.value })}
            sx={{ color: colors.text, bgcolor: colors.inputBg, '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border } }}
          >
            <MenuItem value="linear">Linear</MenuItem>
            <MenuItem value="cubic">Cubic Spline</MenuItem>
            <MenuItem value="nearest">Nearest Neighbor</MenuItem>
          </Select>
        </FormControl>
      )}
    </Box>
  );
}

function MLConfig({ config, onChange, errors }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <FormControl fullWidth error={!!errors.modelId} size="small">
        <InputLabel sx={{ color: colors.textSecondary }}>ML Model</InputLabel>
        <Select
          value={config.modelId || ''}
          label="ML Model"
          onChange={(e) => onChange({ ...config, modelId: e.target.value })}
          sx={{ color: colors.text, bgcolor: colors.inputBg, '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border } }}
        >
          {ML_MODELS.map((m) => (
            <MenuItem key={m.key} value={m.key}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <span>{m.label}</span>
                <Chip label={`${m.accuracy}%`} size="small" sx={{ ml: 1, bgcolor: colors.success, color: '#fff', fontSize: '0.7rem', height: 20 }} />
              </Box>
            </MenuItem>
          ))}
        </Select>
        {errors.modelId && (
          <Typography variant="caption" sx={{ color: colors.error, mt: 0.5 }}>{errors.modelId}</Typography>
        )}
      </FormControl>

      <Box>
        <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 1 }}>
          Confidence Threshold: {((config.confidenceThreshold ?? 0.8) * 100).toFixed(0)}%
        </Typography>
        <Slider
          value={config.confidenceThreshold ?? 0.8}
          min={0}
          max={1}
          step={0.05}
          onChange={(_, v) => onChange({ ...config, confidenceThreshold: v })}
          sx={{ color: colors.primary }}
        />
        {errors.confidenceThreshold && (
          <Typography variant="caption" sx={{ color: colors.error }}>{errors.confidenceThreshold}</Typography>
        )}
      </Box>

      <FormControlLabel
        control={
          <Switch
            checked={config.explainability || false}
            onChange={(e) => onChange({ ...config, explainability: e.target.checked })}
            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: colors.primary } }}
          />
        }
        label={<Typography variant="body2" sx={{ color: colors.textSecondary }}>Include explainability output (SHAP values)</Typography>}
      />

      <FormControl fullWidth size="small">
        <InputLabel sx={{ color: colors.textSecondary }}>Inference Mode</InputLabel>
        <Select
          value={config.inferenceMode || 'batch'}
          label="Inference Mode"
          onChange={(e) => onChange({ ...config, inferenceMode: e.target.value })}
          sx={{ color: colors.text, bgcolor: colors.inputBg, '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border } }}
        >
          <MenuItem value="batch">Batch (process all at once)</MenuItem>
          <MenuItem value="streaming">Streaming (per-record)</MenuItem>
          <MenuItem value="micro-batch">Micro-batch (every N records)</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}

function OutputConfig({ config, onChange, errors }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <FormControl fullWidth error={!!errors.destination} size="small">
        <InputLabel sx={{ color: colors.textSecondary }}>Destination</InputLabel>
        <Select
          value={config.destination || ''}
          label="Destination"
          onChange={(e) => onChange({ ...config, destination: e.target.value })}
          sx={{ color: colors.text, bgcolor: colors.inputBg, '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border } }}
        >
          {OUTPUT_DESTINATIONS.map((d) => (
            <MenuItem key={d.key} value={d.key}>{d.label}</MenuItem>
          ))}
        </Select>
        {errors.destination && (
          <Typography variant="caption" sx={{ color: colors.error, mt: 0.5 }}>{errors.destination}</Typography>
        )}
      </FormControl>

      {config.destination === 'email' && (
        <TextField
          size="small"
          label="Email Address"
          value={config.emailAddress || ''}
          onChange={(e) => onChange({ ...config, emailAddress: e.target.value })}
          error={!!errors.emailAddress}
          helperText={errors.emailAddress}
          sx={{ '& input': { color: colors.text }, '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border }, '& .MuiInputLabel-root': { color: colors.textSecondary } }}
        />
      )}

      {config.destination === 'webhook' && (
        <>
          <TextField
            size="small"
            label="Webhook URL"
            value={config.webhookUrl || ''}
            onChange={(e) => onChange({ ...config, webhookUrl: e.target.value })}
            error={!!errors.webhookUrl}
            helperText={errors.webhookUrl}
            placeholder="https://example.com/webhook"
            sx={{ '& input': { color: colors.text }, '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border }, '& .MuiInputLabel-root': { color: colors.textSecondary } }}
          />
          <FormControl fullWidth size="small">
            <InputLabel sx={{ color: colors.textSecondary }}>Format</InputLabel>
            <Select
              value={config.webhookFormat || 'json'}
              label="Format"
              onChange={(e) => onChange({ ...config, webhookFormat: e.target.value })}
              sx={{ color: colors.text, bgcolor: colors.inputBg, '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border } }}
            >
              <MenuItem value="json">JSON</MenuItem>
              <MenuItem value="csv">CSV</MenuItem>
              <MenuItem value="xml">XML</MenuItem>
            </Select>
          </FormControl>
        </>
      )}

      {config.destination === 'csv' && (
        <TextField
          size="small"
          label="File Name Prefix"
          value={config.filePrefix || ''}
          onChange={(e) => onChange({ ...config, filePrefix: e.target.value })}
          placeholder="pipeline-export"
          sx={{ '& input': { color: colors.text }, '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border }, '& .MuiInputLabel-root': { color: colors.textSecondary } }}
        />
      )}

      {config.destination === 'dashboard' && (
        <TextField
          size="small"
          label="Widget Title"
          value={config.widgetTitle || ''}
          onChange={(e) => onChange({ ...config, widgetTitle: e.target.value })}
          placeholder="My Pipeline Output"
          sx={{ '& input': { color: colors.text }, '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border }, '& .MuiInputLabel-root': { color: colors.textSecondary } }}
        />
      )}

      <FormControlLabel
        control={
          <Switch
            checked={config.includeTimestamp || true}
            onChange={(e) => onChange({ ...config, includeTimestamp: e.target.checked })}
            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: colors.primary } }}
          />
        }
        label={<Typography variant="body2" sx={{ color: colors.textSecondary }}>Include timestamps in output</Typography>}
      />
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const NodeConfig = ({ node, onUpdate, onClose }) => {
  const [config, setConfig] = useState(node?.config || {});
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setConfig(node?.config || {});
    setErrors({});
    setSaved(false);
  }, [node?.id]);

  const handleConfigChange = useCallback((newConfig) => {
    setConfig(newConfig);
    setSaved(false);
    const newErrors = validateConfig(node?.type, newConfig);
    setErrors(newErrors);
  }, [node?.type]);

  const handleSave = useCallback(() => {
    const validationErrors = validateConfig(node?.type, config);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length === 0) {
      onUpdate(node.id, config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }, [node, config, onUpdate]);

  const typeMeta = node ? NODE_TYPE_META[node.type] : null;
  const TypeIcon = typeMeta?.icon || SettingsIcon;

  if (!node) {
    return (
      <Paper
        sx={{
          bgcolor: colors.card,
          border: `1px solid ${colors.border}`,
          borderRadius: 2,
          p: 3,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <InfoIcon sx={{ fontSize: 48, color: colors.border, mb: 2 }} />
        <Typography variant="body1" sx={{ color: colors.textSecondary, textAlign: 'center' }}>
          Select a node on the canvas to configure its settings
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        bgcolor: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: 2,
        p: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: `1px solid ${colors.border}`,
          background: `linear-gradient(135deg, ${typeMeta?.color}22, transparent)`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TypeIcon sx={{ color: typeMeta?.color, fontSize: 20 }} />
          <Box>
            <Typography variant="subtitle2" sx={{ color: colors.text, fontWeight: 600 }}>
              {node.label}
            </Typography>
            <Typography variant="caption" sx={{ color: colors.textSecondary }}>
              {typeMeta?.label} Configuration
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: colors.textSecondary }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Config form */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        <TextField
          fullWidth
          size="small"
          label="Node Label"
          value={config.label ?? node.label}
          onChange={(e) => handleConfigChange({ ...config, label: e.target.value })}
          sx={{ mb: 2, '& input': { color: colors.text }, '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border }, '& .MuiInputLabel-root': { color: colors.textSecondary } }}
        />

        <Divider sx={{ borderColor: colors.border, mb: 2 }} />

        {node.type === 'source' && <SourceConfig config={config} onChange={handleConfigChange} errors={errors} />}
        {node.type === 'transform' && <TransformConfig config={config} onChange={handleConfigChange} errors={errors} />}
        {node.type === 'ml' && <MLConfig config={config} onChange={handleConfigChange} errors={errors} />}
        {node.type === 'output' && <OutputConfig config={config} onChange={handleConfigChange} errors={errors} />}
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: `1px solid ${colors.border}`, display: 'flex', gap: 1, alignItems: 'center' }}>
        <Button
          variant="contained"
          size="small"
          onClick={handleSave}
          startIcon={saved ? <CheckCircleIcon /> : null}
          sx={{
            flex: 1,
            bgcolor: saved ? colors.success : colors.primary,
            '&:hover': { bgcolor: saved ? '#059669' : '#2563EB' },
            textTransform: 'none',
          }}
        >
          {saved ? 'Saved' : 'Apply Configuration'}
        </Button>
        {Object.keys(errors).length > 0 && (
          <Tooltip title={`${Object.keys(errors).length} validation error(s)`}>
            <ErrorIcon sx={{ color: colors.error, fontSize: 20 }} />
          </Tooltip>
        )}
      </Box>
    </Paper>
  );
};

export default NodeConfig;
