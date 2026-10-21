import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Grid,
  Card,
  CardContent,
  Divider,
  Tooltip,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
} from '@mui/material';
import {
  Visibility,
  Edit,
  Save,
  Publish,
  Share,
  Public,
  Group,
  Lock,
  Thermostat,
  WaterDrop,
  Air,
  Speed,
  Schedule,
  Cloud,
  Place,
  Person,
  TrendingUp,
  ContentCopy,
  Print,
  Warning,
  CheckCircle,
  Info,
  Sensors,
  People,
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
import { apiClient } from '../../services/apiClient';
import FEATURES from '../../config/features';
import PublicViewerNotice from '../common/PublicViewerNotice';

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

const CONFIDENCE_COLORS = {
  Low: '#EF4444',
  Medium: '#F59E0B',
  High: '#10B981',
  'Very High': '#3B82F6',
};

const SHARE_OPTIONS = [
  { value: 'public', label: 'Public', icon: Public, description: 'Visible to all WRFCoin users and indexed in search' },
  { value: 'team', label: 'Team Only', icon: Group, description: 'Shared with your forecast team members' },
  { value: 'private', label: 'Private', icon: Lock, description: 'Only visible to you' },
];

const PARAMETER_ICON_MAP = {
  Thermostat,
  WaterDrop,
  Air,
  Speed,
  Cloud,
};

// ---------------------------------------------------------------------------
// Generate chart data
// ---------------------------------------------------------------------------

function generateTempChartData() {
  const hours = [];
  const temps = [];
  const now = new Date(2026, 1, 14, 12);
  for (let h = 0; h <= 48; h += 3) {
    const t = new Date(now.getTime() + h * 3600000);
    const dayFrac = (t.getHours() - 6) / 24;
    const diurnal = 8 * Math.sin(dayFrac * Math.PI * 2);
    const cooling = h > 12 ? -3 : 0;
    hours.push(h === 0 ? 'Now' : `+${h}h`);
    temps.push(Math.round(28 + diurnal + cooling + (Math.random() - 0.5) * 2));
  }
  return { hours, temps };
}

function generatePrecipChartData() {
  const hours = [];
  const probs = [];
  for (let h = 0; h <= 48; h += 3) {
    hours.push(h === 0 ? 'Now' : `+${h}h`);
    let prob = 0;
    if (h >= 12 && h <= 36) {
      prob = 60 + 25 * Math.sin(((h - 12) / 24) * Math.PI) + Math.random() * 10;
    } else if (h > 36) {
      prob = Math.max(0, 40 - (h - 36) * 8 + Math.random() * 5);
    } else {
      prob = Math.max(0, h * 3 + Math.random() * 5);
    }
    probs.push(Math.min(100, Math.round(prob)));
  }
  return { hours, probs };
}

// ---------------------------------------------------------------------------
// Sample forecast (demo mode only — frontend#286)
//
// This is static, hand-written placeholder content, never Math.random(). It
// exists only so demo mode has something structurally complete to render;
// it must never appear unless FEATURES.demoSurfaces is explicitly on.
// ---------------------------------------------------------------------------

const SAMPLE_FORECAST = {
  title: 'Sample Forecast Preview',
  issuedBy: 'Sample Data',
  issuedAt: 'Not issued (demo mode)',
  region: 'Sample Region',
  regionDescription: 'This is placeholder content shown because demo mode is enabled and no real forecast has loaded. It is not a live forecast.',
  eventTags: [],
  validStart: '--',
  validEnd: '--',
  models: ['Sample'],
  parameters: [
    { name: 'Temp High', value: '--', confidence: 'Low', color: '#EF4444', icon: Thermostat },
    { name: 'Precip', value: '--', confidence: 'Low', color: '#3B82F6', icon: WaterDrop },
  ],
  narrativeSections: [
    {
      title: 'Sample Data',
      content: 'This preview is rendering sample data because demo mode is enabled. No forecast has been loaded from the API.',
    },
  ],
};

// ---------------------------------------------------------------------------
// ForecastPreview Component
// ---------------------------------------------------------------------------

const ForecastPreview = () => {
  const [shareMode, setShareMode] = useState('public');
  const [rawForecast, setRawForecast] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'loaded' | 'unavailable'

  useEffect(() => {
    let cancelled = false;
    apiClient.get('/forecast-studio/preview')
      .then((data) => {
        if (cancelled) return;
        const fc = data.forecast ?? data;
        if (fc && fc.parameters) {
          fc.parameters = fc.parameters.map(p => ({
            ...p,
            icon: PARAMETER_ICON_MAP[p.iconName] || Cloud,
          }));
        }
        setRawForecast(fc ?? null);
        setStatus(fc ? 'loaded' : 'unavailable');
      })
      .catch(() => {
        if (cancelled) return;
        setRawForecast(null);
        setStatus('unavailable');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Demo-surface policy (frontend#214 / frontend#286): synthetic content is
  // opt-in only, never the default for a real/public visitor.
  const demoSurfacesOn = FEATURES.demoSurfaces;

  // Only fall back to the hard-coded sample forecast when the real fetch has
  // settled with nothing usable AND demo mode is explicitly on. A real,
  // API-provided forecast always wins.
  const usingSampleForecast = !rawForecast && status === 'unavailable' && demoSurfacesOn;
  const forecast = rawForecast ?? (usingSampleForecast ? SAMPLE_FORECAST : null);

  // The temperature/precipitation charts are always fabricated client-side —
  // no API response here ever supplies real time-series data for them — so
  // they render only in demo mode, alongside a visible "Sample data" badge.
  const showSyntheticCharts = demoSurfacesOn;

  const tempData = useMemo(() => generateTempChartData(), []);
  const precipData = useMemo(() => generatePrecipChartData(), []);

  const tempChartConfig = useMemo(() => ({
    labels: tempData.hours,
    datasets: [
      {
        label: 'Temperature (F)',
        data: tempData.temps,
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        borderWidth: 2,
        pointRadius: 2,
        pointBackgroundColor: '#EF4444',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Freezing (32F)',
        data: Array(tempData.hours.length).fill(32),
        borderColor: 'rgba(59, 130, 246, 0.4)',
        borderWidth: 1,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
      },
    ],
  }), [tempData]);

  const precipChartConfig = useMemo(() => ({
    labels: precipData.hours,
    datasets: [
      {
        label: 'Precip Probability (%)',
        data: precipData.probs,
        backgroundColor: precipData.probs.map(p =>
          p >= 70 ? 'rgba(59, 130, 246, 0.7)' :
            p >= 40 ? 'rgba(59, 130, 246, 0.5)' :
              'rgba(59, 130, 246, 0.3)',
        ),
        borderColor: '#3B82F6',
        borderWidth: 1,
        borderRadius: 3,
      },
    ],
  }), [precipData]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: { color: COLORS.muted, font: { size: 9 }, maxTicksLimit: 10 },
        grid: { color: COLORS.border, lineWidth: 0.5 },
      },
      y: {
        ticks: { color: COLORS.muted, font: { size: 10 } },
        grid: { color: COLORS.border, lineWidth: 0.5 },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: { color: COLORS.muted, font: { size: 10 }, padding: 8, usePointStyle: true, pointStyleWidth: 8 },
      },
      tooltip: {
        backgroundColor: COLORS.card,
        titleColor: COLORS.text,
        bodyColor: COLORS.muted,
        borderColor: COLORS.border,
        borderWidth: 1,
      },
    },
  };

  const precipChartOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        min: 0,
        max: 100,
        ticks: { ...chartOptions.scales.y.ticks, callback: v => v + '%' },
      },
    },
  };

  const selectedShareOption = SHARE_OPTIONS.find(o => o.value === shareMode);
  const ShareIcon = selectedShareOption?.icon || Public;

  if (status === 'loading') {
    return (
      <Box sx={{ bgcolor: COLORS.bg, minHeight: '100vh', p: 3 }}>
        <Typography sx={{ color: COLORS.muted }}>Loading...</Typography>
      </Box>
    );
  }

  // Settled with nothing to show, and demo mode is off: an honest state, not
  // a spinner that never resolves and not fabricated content (frontend#286).
  if (!forecast) {
    return (
      <Box sx={{ bgcolor: COLORS.bg, minHeight: '100vh', p: 3 }}>
        <PublicViewerNotice
          reason="not-live"
          title="No forecast preview available"
          description="This preview will populate once a real forecast is loaded."
        />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Preview Header */}
      <Paper
        sx={{
          bgcolor: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 2,
          p: 3,
        }}
      >
        {/* Title and Meta */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Chip
                label="PREVIEW"
                size="small"
                sx={{
                  height: 20,
                  fontSize: 10,
                  fontWeight: 700,
                  bgcolor: 'rgba(245,158,11,0.15)',
                  color: COLORS.warning,
                  letterSpacing: 0.5,
                }}
              />
              {usingSampleForecast && (
                <Chip
                  label="SAMPLE DATA"
                  size="small"
                  data-testid="forecast-sample-data-badge"
                  sx={{
                    height: 20,
                    fontSize: 10,
                    fontWeight: 700,
                    bgcolor: 'rgba(148,163,184,0.2)',
                    color: COLORS.muted,
                    letterSpacing: 0.5,
                  }}
                />
              )}
              {(forecast.eventTags ?? []).map(tag => (
                <Chip
                  key={tag}
                  icon={<Warning sx={{ fontSize: 12, color: `${COLORS.error} !important` }} />}
                  label={tag}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: 10,
                    bgcolor: 'rgba(239,68,68,0.12)',
                    color: COLORS.error,
                  }}
                />
              ))}
            </Box>
            <Typography variant="h5" sx={{ color: COLORS.text, fontWeight: 700, mb: 1 }}>
              {forecast.title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Person sx={{ color: COLORS.muted, fontSize: 14 }} />
                <Typography sx={{ color: COLORS.muted, fontSize: 12 }}>
                  Issued by <span style={{ color: COLORS.primary, fontWeight: 600 }}>{forecast.issuedBy}</span>
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Schedule sx={{ color: COLORS.muted, fontSize: 14 }} />
                <Typography sx={{ color: COLORS.muted, fontSize: 12 }}>
                  {forecast.issuedAt}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Place sx={{ color: COLORS.muted, fontSize: 14 }} />
                <Typography sx={{ color: COLORS.muted, fontSize: 12 }}>
                  {forecast.region}
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Print forecast">
              <IconButton sx={{ color: COLORS.muted, border: `1px solid ${COLORS.border}`, '&:hover': { color: COLORS.text } }}>
                <Print sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Copy link">
              <IconButton sx={{ color: COLORS.muted, border: `1px solid ${COLORS.border}`, '&:hover': { color: COLORS.text } }}>
                <ContentCopy sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Valid Period Banner */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 1.5,
            bgcolor: 'rgba(59,130,246,0.08)',
            borderRadius: 1,
            border: '1px solid rgba(59,130,246,0.2)',
          }}
        >
          <Schedule sx={{ color: COLORS.primary, fontSize: 18 }} />
          <Box>
            <Typography sx={{ color: COLORS.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Valid Period
            </Typography>
            <Typography sx={{ color: COLORS.text, fontSize: 13, fontWeight: 600 }}>
              {forecast.validStart} -- {forecast.validEnd}
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }} />
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {forecast.models.map(model => (
              <Chip
                key={model}
                label={model}
                size="small"
                sx={{
                  height: 22,
                  fontSize: 10,
                  bgcolor: 'rgba(59,130,246,0.15)',
                  color: COLORS.primary,
                }}
              />
            ))}
          </Box>
        </Box>
      </Paper>

      {/* Region Summary */}
      <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 2, p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Place sx={{ color: COLORS.primary, fontSize: 18 }} />
          <Typography sx={{ color: COLORS.text, fontWeight: 600, fontSize: 14 }}>
            Forecast Area
          </Typography>
        </Box>
        <Typography sx={{ color: COLORS.muted, fontSize: 13, lineHeight: 1.6 }}>
          {forecast.regionDescription}
        </Typography>
      </Paper>

      {/* Key Metrics */}
      <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 2, p: 2 }}>
        <Typography sx={{ color: COLORS.text, fontWeight: 600, fontSize: 14, mb: 1.5 }}>
          Key Metrics
        </Typography>
        <Grid container spacing={1.5}>
          {forecast.parameters.map(param => {
            const Icon = param.icon;
            return (
              <Grid item xs={6} sm={4} md={2} key={param.name}>
                <Card
                  sx={{
                    bgcolor: 'rgba(15,23,42,0.5)',
                    border: `1px solid ${COLORS.border}`,
                    height: '100%',
                  }}
                >
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, textAlign: 'center' }}>
                    <Icon sx={{ color: param.color, fontSize: 20, mb: 0.5 }} />
                    <Typography sx={{ color: COLORS.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.3, mb: 0.25 }}>
                      {param.name}
                    </Typography>
                    <Typography sx={{ color: COLORS.text, fontWeight: 700, fontSize: 18 }}>
                      {param.value}
                    </Typography>
                    <Chip
                      label={param.confidence}
                      size="small"
                      sx={{
                        mt: 0.5,
                        height: 18,
                        fontSize: 9,
                        bgcolor: CONFIDENCE_COLORS[param.confidence] + '15',
                        color: CONFIDENCE_COLORS[param.confidence],
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {/* Parameter Charts */}
      {/*
        These two series are always fabricated client-side (frontend#286) —
        no API response supplies real temperature/precipitation time series
        here. They render only under the demo-surface policy, with a visible
        "Sample data" badge; otherwise an honest not-live notice takes their
        place.
      */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 2, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Thermostat sx={{ color: '#EF4444', fontSize: 18 }} />
              <Typography sx={{ color: COLORS.text, fontWeight: 600, fontSize: 14 }}>
                Temperature Forecast
              </Typography>
              {showSyntheticCharts && (
                <Chip
                  label="Sample data"
                  size="small"
                  data-testid="temp-chart-sample-data-badge"
                  sx={{ height: 18, fontSize: 9, bgcolor: 'rgba(148,163,184,0.2)', color: COLORS.muted }}
                />
              )}
            </Box>
            <Box sx={{ height: 220 }}>
              {showSyntheticCharts ? (
                <Line data={tempChartConfig} options={chartOptions} />
              ) : (
                <PublicViewerNotice
                  reason="not-live"
                  title="Temperature series unavailable"
                  description="Live temperature data isn't connected to this preview yet."
                />
              )}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 2, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <WaterDrop sx={{ color: '#3B82F6', fontSize: 18 }} />
              <Typography sx={{ color: COLORS.text, fontWeight: 600, fontSize: 14 }}>
                Precipitation Probability
              </Typography>
              {showSyntheticCharts && (
                <Chip
                  label="Sample data"
                  size="small"
                  data-testid="precip-chart-sample-data-badge"
                  sx={{ height: 18, fontSize: 9, bgcolor: 'rgba(148,163,184,0.2)', color: COLORS.muted }}
                />
              )}
            </Box>
            <Box sx={{ height: 220 }}>
              {showSyntheticCharts ? (
                <Bar data={precipChartConfig} options={precipChartOptions} />
              ) : (
                <PublicViewerNotice
                  reason="not-live"
                  title="Precipitation series unavailable"
                  description="Live precipitation data isn't connected to this preview yet."
                />
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Narrative Sections */}
      <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 2, p: 2 }}>
        <Typography sx={{ color: COLORS.text, fontWeight: 600, fontSize: 14, mb: 2 }}>
          Forecast Discussion
        </Typography>
        {forecast.narrativeSections.map((section, idx) => (
          <Box key={section.title} sx={{ mb: idx < forecast.narrativeSections.length - 1 ? 2.5 : 0 }}>
            <Typography
              sx={{
                color: COLORS.primary,
                fontWeight: 600,
                fontSize: 13,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                mb: 0.75,
              }}
            >
              {section.title}
            </Typography>
            <Typography sx={{ color: COLORS.muted, fontSize: 13, lineHeight: 1.7 }}>
              {section.content}
            </Typography>
            {idx < forecast.narrativeSections.length - 1 && (
              <Divider sx={{ borderColor: COLORS.border, mt: 2 }} />
            )}
          </Box>
        ))}
      </Paper>

      {/* Confidence Indicators */}
      <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 2, p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <TrendingUp sx={{ color: COLORS.primary, fontSize: 18 }} />
          <Typography sx={{ color: COLORS.text, fontWeight: 600, fontSize: 14 }}>
            Parameter Confidence
          </Typography>
        </Box>
        <Grid container spacing={1}>
          {forecast.parameters.map(param => {
            const confLevel = param.confidence;
            const confColor = CONFIDENCE_COLORS[confLevel];
            const confValue = confLevel === 'Very High' ? 95 : confLevel === 'High' ? 80 : confLevel === 'Medium' ? 60 : 35;
            return (
              <Grid item xs={12} sm={6} key={param.name}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.75 }}>
                  <Typography sx={{ color: COLORS.muted, fontSize: 12, minWidth: 110, flexShrink: 0 }}>
                    {param.name}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={confValue}
                    sx={{
                      flex: 1,
                      height: 6,
                      borderRadius: 3,
                      bgcolor: 'rgba(255,255,255,0.05)',
                      '& .MuiLinearProgress-bar': { bgcolor: confColor, borderRadius: 3 },
                    }}
                  />
                  <Typography sx={{ color: confColor, fontSize: 11, fontWeight: 600, minWidth: 60, textAlign: 'right' }}>
                    {confLevel}
                  </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {/* Model Sources */}
      <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 2, p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Info sx={{ color: COLORS.primary, fontSize: 18 }} />
          <Typography sx={{ color: COLORS.text, fontWeight: 600, fontSize: 14 }}>
            Model Sources
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {forecast.models.map(model => (
            <Chip
              key={model}
              icon={<CheckCircle sx={{ fontSize: 12, color: `${COLORS.success} !important` }} />}
              label={model}
              size="small"
              sx={{
                bgcolor: 'rgba(16,185,129,0.1)',
                color: COLORS.text,
                fontSize: 11,
                '& .MuiChip-icon': { ml: 0.5 },
              }}
            />
          ))}
        </Box>
        <Typography sx={{ color: COLORS.muted, fontSize: 11, mt: 1 }}>
          Model data initialized at 06Z Feb 14 2026. Post-processed with WRFCoin neural bias correction.
        </Typography>
      </Paper>

      {/* Share Options and Estimated Reach */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 2, p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Share sx={{ color: COLORS.primary, fontSize: 18 }} />
              <Typography sx={{ color: COLORS.text, fontWeight: 600, fontSize: 14 }}>
                Visibility
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {SHARE_OPTIONS.map(option => {
                const OptionIcon = option.icon;
                const isSelected = shareMode === option.value;
                return (
                  <Box
                    key={option.value}
                    onClick={() => setShareMode(option.value)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 1.5,
                      borderRadius: 1,
                      border: `1px solid ${isSelected ? COLORS.primary : COLORS.border}`,
                      bgcolor: isSelected ? 'rgba(59,130,246,0.08)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      '&:hover': { borderColor: COLORS.primary },
                    }}
                  >
                    <OptionIcon sx={{ color: isSelected ? COLORS.primary : COLORS.muted, fontSize: 20 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ color: COLORS.text, fontSize: 13, fontWeight: isSelected ? 600 : 400 }}>
                        {option.label}
                      </Typography>
                      <Typography sx={{ color: COLORS.muted, fontSize: 11 }}>
                        {option.description}
                      </Typography>
                    </Box>
                    {isSelected && <CheckCircle sx={{ color: COLORS.primary, fontSize: 18 }} />}
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 2, p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Public sx={{ color: COLORS.primary, fontSize: 18 }} />
              <Typography sx={{ color: COLORS.text, fontWeight: 600, fontSize: 14 }}>
                Estimated Reach
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(15,23,42,0.5)', borderRadius: 1 }}>
                  <Sensors sx={{ color: COLORS.success, fontSize: 28, mb: 0.5 }} />
                  <Typography sx={{ color: COLORS.text, fontWeight: 700, fontSize: 22 }}>847</Typography>
                  <Typography sx={{ color: COLORS.muted, fontSize: 11 }}>Weather Stations</Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(15,23,42,0.5)', borderRadius: 1 }}>
                  <People sx={{ color: COLORS.primary, fontSize: 28, mb: 0.5 }} />
                  <Typography sx={{ color: COLORS.text, fontWeight: 700, fontSize: 22 }}>12,400</Typography>
                  <Typography sx={{ color: COLORS.muted, fontSize: 11 }}>Users in Area</Typography>
                </Box>
              </Grid>
            </Grid>
            <Box
              sx={{
                mt: 2,
                p: 1.5,
                bgcolor: 'rgba(16,185,129,0.08)',
                borderRadius: 1,
                border: '1px solid rgba(16,185,129,0.2)',
              }}
            >
              <Typography sx={{ color: COLORS.success, fontSize: 12 }}>
                Publishing this forecast will earn WRFCoin rewards based on accuracy and reach. Estimated reward: 24-48 WRF tokens.
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 2, p: 2 }}>
        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
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
            Save as Draft
          </Button>
          <Button
            variant="outlined"
            startIcon={<Edit sx={{ fontSize: 16 }} />}
            sx={{
              color: COLORS.muted,
              borderColor: COLORS.border,
              textTransform: 'none',
              fontSize: 13,
              '&:hover': { borderColor: COLORS.warning, color: COLORS.warning },
            }}
          >
            Edit
          </Button>
          <Button
            variant="contained"
            startIcon={<Publish sx={{ fontSize: 16 }} />}
            sx={{
              bgcolor: COLORS.success,
              textTransform: 'none',
              fontSize: 13,
              fontWeight: 600,
              px: 3,
              '&:hover': { bgcolor: '#059669' },
            }}
          >
            Publish Forecast
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ForecastPreview;
