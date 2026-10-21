import React, { useState, useMemo, useCallback } from 'react';
import DemoSurfaceGate from '../common/DemoSurfaceGate';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Grid,
  Slider,
  Switch,
  FormControlLabel,
  Tooltip,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Edit,
  Thermostat,
  WaterDrop,
  Air,
  Speed,
  Cloud,
  Compress,
  Warning,
  AutoFixHigh,
  Save,
  RestartAlt,
  Timeline,
  TrendingUp,
  Schedule,
} from '@mui/icons-material';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, ChartTooltip, Legend, Filler);

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

const PARAMETERS = [
  { id: 'temperature', label: 'Temperature', unit: 'F', icon: Thermostat, color: '#EF4444' },
  { id: 'precipitation', label: 'Precipitation', unit: 'in', icon: WaterDrop, color: '#3B82F6' },
  { id: 'wind_speed', label: 'Wind Speed', unit: 'mph', icon: Air, color: '#10B981' },
  { id: 'wind_direction', label: 'Wind Direction', unit: 'deg', icon: Air, color: '#06B6D4' },
  { id: 'humidity', label: 'Humidity', unit: '%', icon: WaterDrop, color: '#8B5CF6' },
  { id: 'pressure', label: 'Pressure', unit: 'mb', icon: Compress, color: '#F59E0B' },
  { id: 'severe', label: 'Severe Weather', unit: '', icon: Warning, color: '#EF4444' },
];

const OUTPUT_INTERVALS = [
  { value: 'hourly', label: 'Hourly' },
  { value: '3h', label: '3-Hourly' },
  { value: '6h', label: '6-Hourly' },
  { value: 'daily', label: 'Daily' },
];

const CONFIDENCE_LEVELS = ['Low', 'Medium', 'High', 'Very High'];
const CONFIDENCE_COLORS = {
  Low: '#EF4444',
  Medium: '#F59E0B',
  High: '#10B981',
  'Very High': '#3B82F6',
};

const TEMPLATE_SECTIONS = [
  { id: 'overview', label: 'Situation Overview', placeholder: 'Describe the current synoptic pattern and key drivers for this forecast period...' },
  { id: 'short_range', label: 'Short Range (0-48h)', placeholder: 'Detail expected conditions for the first 48 hours, including timing of significant weather changes...' },
  { id: 'extended', label: 'Extended Range (3-7d)', placeholder: 'Outline the medium-range outlook with lower confidence, mention pattern changes and ensemble spread...' },
  { id: 'confidence', label: 'Confidence Notes', placeholder: 'Discuss areas of uncertainty, model disagreements, and factors that could change the forecast...' },
  { id: 'hazards', label: 'Hazards', placeholder: 'List any weather hazards, warnings, or watches in effect or expected for the forecast region...' },
];

const EVENT_TAGS = [
  'Winter Storm', 'Heatwave', 'Tropical System', 'Severe Thunderstorms',
  'Flooding', 'Fog', 'Ice Storm', 'Drought', 'Cold Outbreak', 'Nor\'easter',
];

// ---------------------------------------------------------------------------
// Mock model output data
// ---------------------------------------------------------------------------

function generateMockModelOutput(hours) {
  const data = [];
  const now = new Date();
  for (let h = 0; h < hours; h += 3) {
    const time = new Date(now.getTime() + h * 3600000);
    const dayFraction = (time.getHours() - 6) / 24;
    const diurnalTemp = 15 * Math.sin(dayFraction * Math.PI * 2);
    data.push({
      hour: h,
      label: h === 0 ? 'Now' : `+${h}h`,
      temperature: 38 + diurnalTemp + (Math.random() - 0.5) * 4 + (h > 24 ? -5 : 0),
      precipitation: Math.max(0, (h > 12 && h < 36 ? 0.15 + Math.random() * 0.25 : Math.random() * 0.05)),
      windSpeed: 12 + Math.sin(h / 12) * 8 + (Math.random() - 0.5) * 5,
      humidity: 55 + Math.sin(h / 18) * 20 + (Math.random() - 0.5) * 8,
    });
  }
  return data;
}

// ---------------------------------------------------------------------------
// ForecastEditor Component
// ---------------------------------------------------------------------------

const ForecastEditorSample = ({ forecastData, onForecastChange }) => {
  const [selectedParams, setSelectedParams] = useState(['temperature', 'precipitation', 'wind_speed']);
  const [outputInterval, setOutputInterval] = useState('3h');
  const [startDate, setStartDate] = useState('2026-02-14T12:00');
  const [endDate, setEndDate] = useState('2026-02-16T12:00');
  const [narrativeSections, setNarrativeSections] = useState({
    overview: '',
    short_range: '',
    extended: '',
    confidence: '',
    hazards: '',
  });
  const [activeNarrativeTab, setActiveNarrativeTab] = useState(0);
  const [confidence, setConfidence] = useState({
    temperature: 'High',
    precipitation: 'Medium',
    wind_speed: 'Medium',
    wind_direction: 'Medium',
    humidity: 'High',
    pressure: 'High',
    severe: 'Low',
  });
  const [expertMode, setExpertMode] = useState(false);
  const [selectedEventTags, setSelectedEventTags] = useState([]);
  const [manualOverrides, setManualOverrides] = useState({});
  const [forecastTitle, setForecastTitle] = useState('');

  const modelOutput = useMemo(() => generateMockModelOutput(72), []);

  const tempChartData = useMemo(() => ({
    labels: modelOutput.map(d => d.label),
    datasets: [
      {
        label: 'Temperature (F)',
        data: modelOutput.map(d => {
          const override = manualOverrides[`temp_${d.hour}`];
          return override !== undefined ? override : d.temperature;
        }),
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        pointRadius: 1.5,
        fill: true,
        tension: 0.3,
      },
    ],
  }), [modelOutput, manualOverrides]);

  const precipChartData = useMemo(() => ({
    labels: modelOutput.map(d => d.label),
    datasets: [
      {
        label: 'Precip (in)',
        data: modelOutput.map(d => d.precipitation),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: '#3B82F6',
        borderWidth: 1,
        borderRadius: 2,
      },
    ],
  }), [modelOutput]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { ticks: { color: COLORS.muted, font: { size: 9 }, maxTicksLimit: 12 }, grid: { color: COLORS.border, lineWidth: 0.5 } },
      y: { ticks: { color: COLORS.muted, font: { size: 10 } }, grid: { color: COLORS.border, lineWidth: 0.5 } },
    },
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: COLORS.card, titleColor: COLORS.text, bodyColor: COLORS.muted, borderColor: COLORS.border, borderWidth: 1 },
    },
  };

  const handleParamToggle = useCallback(paramId => {
    setSelectedParams(prev =>
      prev.includes(paramId) ? prev.filter(p => p !== paramId) : [...prev, paramId],
    );
  }, []);

  const handleNarrativeChange = useCallback((sectionId, value) => {
    setNarrativeSections(prev => ({ ...prev, [sectionId]: value }));
  }, []);

  const handleConfidenceChange = useCallback((paramId, level) => {
    setConfidence(prev => ({ ...prev, [paramId]: level }));
  }, []);

  const handleTagToggle = useCallback(tag => {
    setSelectedEventTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag],
    );
  }, []);

  const autoSummary = useMemo(() => {
    const temps = modelOutput.map(d => d.temperature);
    const maxTemp = Math.max(...temps).toFixed(0);
    const minTemp = Math.min(...temps).toFixed(0);
    const totalPrecip = modelOutput.reduce((s, d) => s + d.precipitation, 0).toFixed(2);
    const maxWind = Math.max(...modelOutput.map(d => d.windSpeed)).toFixed(0);
    return `Temperatures ranging from ${minTemp}F to ${maxTemp}F. Total precipitation ${totalPrecip} inches expected. Peak winds up to ${maxWind} mph.`;
  }, [modelOutput]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Edit sx={{ color: COLORS.primary, fontSize: 24 }} />
        <Typography variant="h6" sx={{ color: COLORS.text, fontWeight: 700 }}>
          Forecast Editor
        </Typography>
        <Box sx={{ flex: 1 }} />
        <FormControlLabel
          control={
            <Switch
              checked={expertMode}
              onChange={e => setExpertMode(e.target.checked)}
              size="small"
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': { color: COLORS.warning },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: COLORS.warning },
              }}
            />
          }
          label={<Typography sx={{ color: COLORS.muted, fontSize: 13 }}>Expert Mode</Typography>}
        />
      </Box>

      {/* Forecast Title */}
      <TextField
        fullWidth
        label="Forecast Title"
        placeholder="e.g., 48hr Northeast Snowfall Forecast"
        value={forecastTitle}
        onChange={e => setForecastTitle(e.target.value)}
        size="small"
        sx={{
          '& .MuiInputBase-root': { color: COLORS.text, bgcolor: COLORS.card },
          '& .MuiInputLabel-root': { color: COLORS.muted },
          '& .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.border },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.primary },
        }}
      />

      {/* Time Range and Interval */}
      <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Schedule sx={{ color: COLORS.primary, fontSize: 18 }} />
          <Typography sx={{ color: COLORS.text, fontWeight: 600, fontSize: 14 }}>
            Time Range
          </Typography>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Start Date/Time"
              type="datetime-local"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiInputBase-root': { color: COLORS.text, fontSize: 13 },
                '& .MuiInputLabel-root': { color: COLORS.muted, fontSize: 13 },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.border },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="End Date/Time"
              type="datetime-local"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiInputBase-root': { color: COLORS.text, fontSize: 13 },
                '& .MuiInputLabel-root': { color: COLORS.muted, fontSize: 13 },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.border },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: COLORS.muted, fontSize: 13 }}>Output Interval</InputLabel>
              <Select
                value={outputInterval}
                label="Output Interval"
                onChange={e => setOutputInterval(e.target.value)}
                sx={{
                  color: COLORS.text,
                  fontSize: 13,
                  '.MuiOutlinedInput-notchedOutline': { borderColor: COLORS.border },
                  '& .MuiSvgIcon-root': { color: COLORS.muted },
                }}
              >
                {OUTPUT_INTERVALS.map(interval => (
                  <MenuItem key={interval.value} value={interval.value} sx={{ fontSize: 13 }}>
                    {interval.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Parameter Selection with Confidence */}
      <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, p: 2 }}>
        <Typography sx={{ color: COLORS.text, fontWeight: 600, fontSize: 14, mb: 1.5 }}>
          Forecast Parameters
        </Typography>
        <Grid container spacing={1}>
          {PARAMETERS.map(param => {
            const Icon = param.icon;
            const isActive = selectedParams.includes(param.id);
            const conf = confidence[param.id];
            return (
              <Grid item xs={12} sm={6} md={4} key={param.id}>
                <Box
                  onClick={() => handleParamToggle(param.id)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1,
                    borderRadius: 1,
                    border: `1px solid ${isActive ? param.color : COLORS.border}`,
                    bgcolor: isActive ? param.color + '10' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    '&:hover': { borderColor: param.color },
                  }}
                >
                  <Icon sx={{ color: isActive ? param.color : COLORS.muted, fontSize: 18 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ color: isActive ? COLORS.text : COLORS.muted, fontSize: 12, fontWeight: isActive ? 600 : 400 }}>
                      {param.label}
                    </Typography>
                  </Box>
                  {isActive && (
                    <Select
                      value={conf}
                      onChange={e => {
                        e.stopPropagation();
                        handleConfidenceChange(param.id, e.target.value);
                      }}
                      onClick={e => e.stopPropagation()}
                      size="small"
                      sx={{
                        color: CONFIDENCE_COLORS[conf],
                        fontSize: 10,
                        height: 24,
                        '.MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
                        '& .MuiSvgIcon-root': { color: COLORS.muted, fontSize: 14 },
                      }}
                    >
                      {CONFIDENCE_LEVELS.map(level => (
                        <MenuItem key={level} value={level} sx={{ fontSize: 11 }}>
                          {level}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {/* Model Output Visualization */}
      <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Timeline sx={{ color: COLORS.primary, fontSize: 18 }} />
          <Typography sx={{ color: COLORS.text, fontWeight: 600, fontSize: 14 }}>
            Model Output Preview
          </Typography>
          {expertMode && (
            <Chip
              label="Click chart to override"
              size="small"
              icon={<AutoFixHigh sx={{ fontSize: 12 }} />}
              sx={{ bgcolor: 'rgba(245,158,11,0.15)', color: COLORS.warning, fontSize: 10, ml: 'auto' }}
            />
          )}
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography sx={{ color: COLORS.muted, fontSize: 11, mb: 0.5, textTransform: 'uppercase' }}>
              Temperature Forecast
            </Typography>
            <Box sx={{ height: 180 }}>
              <Line data={tempChartData} options={chartOptions} />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography sx={{ color: COLORS.muted, fontSize: 11, mb: 0.5, textTransform: 'uppercase' }}>
              Precipitation Probability
            </Typography>
            <Box sx={{ height: 180 }}>
              <Bar data={precipChartData} options={chartOptions} />
            </Box>
          </Grid>
        </Grid>

        {/* Auto-generated summary */}
        <Box sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(59,130,246,0.08)', borderRadius: 1, border: '1px solid rgba(59,130,246,0.2)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <AutoFixHigh sx={{ color: COLORS.primary, fontSize: 14 }} />
            <Typography sx={{ color: COLORS.primary, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>
              Auto-generated Summary
            </Typography>
          </Box>
          <Typography sx={{ color: COLORS.text, fontSize: 13 }}>
            {autoSummary}
          </Typography>
        </Box>
      </Paper>

      {/* Expert Mode: Manual Overrides */}
      {expertMode && (
        <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.warning}`, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <AutoFixHigh sx={{ color: COLORS.warning, fontSize: 18 }} />
            <Typography sx={{ color: COLORS.warning, fontWeight: 600, fontSize: 14 }}>
              Manual Adjustment Panel
            </Typography>
            <Tooltip title="Override model output at specific forecast hours">
              <IconButton size="small" sx={{ color: COLORS.muted }}>
                <Warning sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          </Box>
          <Typography sx={{ color: COLORS.muted, fontSize: 12, mb: 2 }}>
            Adjust model values directly. Overrides are shown with a dashed line on charts.
          </Typography>
          <Grid container spacing={2}>
            {[6, 12, 24, 48].map(hour => (
              <Grid item xs={6} sm={3} key={hour}>
                <Typography sx={{ color: COLORS.muted, fontSize: 11, mb: 0.5 }}>+{hour}h Temperature</Typography>
                <TextField
                  size="small"
                  type="number"
                  placeholder={modelOutput.find(d => d.hour === hour)?.temperature.toFixed(0) || '--'}
                  value={manualOverrides[`temp_${hour}`] ?? ''}
                  onChange={e =>
                    setManualOverrides(prev => ({
                      ...prev,
                      [`temp_${hour}`]: e.target.value === '' ? undefined : Number(e.target.value),
                    }))
                  }
                  fullWidth
                  sx={{
                    '& .MuiInputBase-root': { color: COLORS.text, fontSize: 13, bgcolor: 'rgba(15,23,42,0.5)' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.border },
                  }}
                />
              </Grid>
            ))}
          </Grid>
          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              size="small"
              startIcon={<RestartAlt sx={{ fontSize: 14 }} />}
              onClick={() => setManualOverrides({})}
              sx={{ color: COLORS.muted, fontSize: 12, textTransform: 'none' }}
            >
              Reset Overrides
            </Button>
          </Box>
        </Paper>
      )}

      {/* Forecast Narrative */}
      <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Edit sx={{ color: COLORS.primary, fontSize: 18 }} />
          <Typography sx={{ color: COLORS.text, fontWeight: 600, fontSize: 14 }}>
            Forecast Discussion
          </Typography>
        </Box>

        <Tabs
          value={activeNarrativeTab}
          onChange={(_, val) => setActiveNarrativeTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 32,
            mb: 1.5,
            '& .MuiTab-root': { color: COLORS.muted, fontSize: 12, minHeight: 32, textTransform: 'none', py: 0.5 },
            '& .Mui-selected': { color: COLORS.primary },
            '& .MuiTabs-indicator': { backgroundColor: COLORS.primary, height: 2 },
          }}
        >
          {TEMPLATE_SECTIONS.map(section => (
            <Tab key={section.id} label={section.label} />
          ))}
        </Tabs>

        {TEMPLATE_SECTIONS.map((section, idx) => (
          <Box key={section.id} sx={{ display: activeNarrativeTab === idx ? 'block' : 'none' }}>
            <TextField
              fullWidth
              multiline
              rows={5}
              placeholder={section.placeholder}
              value={narrativeSections[section.id]}
              onChange={e => handleNarrativeChange(section.id, e.target.value)}
              sx={{
                '& .MuiInputBase-root': { color: COLORS.text, fontSize: 13, bgcolor: 'rgba(15,23,42,0.5)' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.border },
                '& .MuiInputBase-input::placeholder': { color: COLORS.muted, opacity: 0.7 },
              }}
            />
            <Typography sx={{ color: COLORS.muted, fontSize: 11, mt: 0.5, textAlign: 'right' }}>
              {narrativeSections[section.id].length} characters
            </Typography>
          </Box>
        ))}
      </Paper>

      {/* Event Tags */}
      <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, p: 2 }}>
        <Typography sx={{ color: COLORS.text, fontWeight: 600, fontSize: 14, mb: 1 }}>
          Event Tags
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {EVENT_TAGS.map(tag => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              onClick={() => handleTagToggle(tag)}
              icon={selectedEventTags.includes(tag) ? <Warning sx={{ fontSize: 12 }} /> : undefined}
              sx={{
                bgcolor: selectedEventTags.includes(tag) ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
                color: selectedEventTags.includes(tag) ? COLORS.error : COLORS.muted,
                borderColor: selectedEventTags.includes(tag) ? COLORS.error : 'transparent',
                fontSize: 11,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'rgba(239,68,68,0.1)' },
              }}
              variant={selectedEventTags.includes(tag) ? 'outlined' : 'filled'}
            />
          ))}
        </Box>
      </Paper>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          startIcon={<Save sx={{ fontSize: 16 }} />}
          sx={{
            color: COLORS.muted,
            borderColor: COLORS.border,
            textTransform: 'none',
            fontSize: 13,
            '&:hover': { borderColor: COLORS.primary, color: COLORS.primary },
          }}
        >
          Save Draft
        </Button>
        <Button
          variant="contained"
          startIcon={<TrendingUp sx={{ fontSize: 16 }} />}
          sx={{
            bgcolor: COLORS.primary,
            textTransform: 'none',
            fontSize: 13,
            '&:hover': { bgcolor: '#2563EB' },
          }}
        >
          Preview Forecast
        </Button>
      </Box>
    </Box>
  );
};

// frontend#330: ForecastEditorSample charts a series generated in the browser
// (matches the sibling ForecastPreview, already demo-gated by PR #289).
const ForecastEditor = (props) => (
  <DemoSurfaceGate
    title="Model guidance is not live on the testnet yet"
    description="No model-output route is mounted on the testnet API; the 72-hour guidance the preview edits against is generated in the browser."
    testId="forecast-editor"
  >
    <ForecastEditorSample {...props} />
  </DemoSurfaceGate>
);

export default ForecastEditor;
