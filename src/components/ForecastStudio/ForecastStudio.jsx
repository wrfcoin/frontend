import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Grid,
  Card,
  CardContent,
  Divider,
  LinearProgress,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Add,
  Edit,
  Visibility,
  Delete,
  Search,
  FilterList,
  BarChart,
  TrendingUp,
  Schedule,
  Cloud,
  Public,
  Star,
  StarBorder,
  MoreVert,
  ArrowBack,
  Refresh,
  ContentCopy,
  Share,
  Archive,
  CloudDone,
  HourglassEmpty,
  ErrorOutline,
  CheckCircle,
  Description,
  WbSunny,
  Thunderstorm,
  AcUnit,
  Grain,
  Waves,
} from '@mui/icons-material';
import ForecastEditor from './ForecastEditor';
import ModelSelector from './ModelSelector';
import RegionPicker from './RegionPicker';
import ForecastPreview from './ForecastPreview';
import ForecastHistory from './ForecastHistory';
import { apiClient } from '../../services/apiClient';
import DemoSurfaceGate from '../common/DemoSurfaceGate';

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

const STATUS_CONFIG = {
  Draft: { color: '#94A3B8', bg: 'rgba(148,163,184,0.15)', icon: Edit },
  Published: { color: '#10B981', bg: 'rgba(16,185,129,0.15)', icon: CloudDone },
  Expired: { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', icon: HourglassEmpty },
  'In Review': { color: '#3B82F6', bg: 'rgba(59,130,246,0.15)', icon: Visibility },
  Busted: { color: '#EF4444', bg: 'rgba(239,68,68,0.15)', icon: ErrorOutline },
};

const FORECAST_ICON_MAP = {
  WbSunny,
  AcUnit,
  Thunderstorm,
  Grain,
  Waves,
  Cloud,
};

const RECENT_ACTIVITY = [
  { id: 'act-1', action: 'Published', forecast: '48hr Northeast Snowfall Forecast', time: '2 hours ago', icon: CloudDone, color: COLORS.success },
  { id: 'act-2', action: 'Received 5 new comments on', forecast: '7-Day Gulf Coast Temperature Outlook', time: '4 hours ago', icon: Description, color: COLORS.primary },
  { id: 'act-3', action: 'Skill score updated for', forecast: 'Great Plains Severe Thunderstorm Outlook', time: '8 hours ago', icon: TrendingUp, color: COLORS.warning },
  { id: 'act-4', action: 'Draft saved for', forecast: 'Pacific Northwest Wind Advisory', time: '1 day ago', icon: Edit, color: COLORS.muted },
  { id: 'act-5', action: 'Verification complete for', forecast: 'Desert Southwest Precipitation Analysis', time: '1 day ago', icon: CheckCircle, color: COLORS.success },
];

const QUICK_STATS = [
  { label: 'Forecasts Created', value: '14', icon: Description, color: COLORS.primary },
  { label: 'Avg Skill', value: '0.82', icon: TrendingUp, color: COLORS.success },
  { label: 'Views This Month', value: '248', icon: Visibility, color: COLORS.warning },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const QuickStatCard = ({ stat }) => {
  const Icon = stat.icon;
  return (
    <Card
      sx={{
        bgcolor: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        flex: 1,
        minWidth: 160,
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1,
              bgcolor: stat.color + '20',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon sx={{ color: stat.color, fontSize: 18 }} />
          </Box>
          <Typography sx={{ color: COLORS.muted, fontSize: 12 }}>
            {stat.label}
          </Typography>
        </Box>
        <Typography sx={{ color: COLORS.text, fontWeight: 700, fontSize: 24 }}>
          {stat.value}
        </Typography>
      </CardContent>
    </Card>
  );
};

const ForecastStatusChip = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.Draft;
  const Icon = config.icon;
  return (
    <Chip
      icon={<Icon sx={{ fontSize: 14, color: `${config.color} !important` }} />}
      label={status}
      size="small"
      sx={{
        bgcolor: config.bg,
        color: config.color,
        fontSize: 11,
        fontWeight: 600,
        height: 24,
        '& .MuiChip-icon': { ml: 0.5 },
      }}
    />
  );
};

const ActivityItem = ({ activity }) => {
  const Icon = activity.icon;
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        py: 1.5,
        borderBottom: `1px solid ${COLORS.border}`,
        '&:last-child': { borderBottom: 'none' },
      }}
    >
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          bgcolor: activity.color + '20',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mt: 0.25,
          flexShrink: 0,
        }}
      >
        <Icon sx={{ color: activity.color, fontSize: 14 }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ color: COLORS.muted, fontSize: 12, lineHeight: 1.4 }}>
          {activity.action}{' '}
          <Typography
            component="span"
            sx={{ color: COLORS.text, fontWeight: 600, fontSize: 12 }}
          >
            {activity.forecast}
          </Typography>
        </Typography>
        <Typography sx={{ color: COLORS.muted, fontSize: 11, mt: 0.25, opacity: 0.7 }}>
          {activity.time}
        </Typography>
      </Box>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Studio Workspace (New Forecast Creation)
// ---------------------------------------------------------------------------

const StudioWorkspace = ({ onBack }) => {
  const [activeStep, setActiveStep] = useState(0);
  const steps = ['Select Region', 'Choose Models', 'Edit Forecast', 'Preview'];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Workspace Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={onBack} sx={{ color: COLORS.muted }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h6" sx={{ color: COLORS.text, fontWeight: 700 }}>
          New Forecast
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          {steps.map((step, idx) => (
            <Button
              key={step}
              size="small"
              variant={activeStep === idx ? 'contained' : 'outlined'}
              onClick={() => setActiveStep(idx)}
              sx={{
                color: activeStep === idx ? '#FFFFFF' : COLORS.muted,
                bgcolor: activeStep === idx ? COLORS.primary : 'transparent',
                borderColor: idx < activeStep ? COLORS.success : COLORS.border,
                textTransform: 'none',
                fontSize: 12,
                minWidth: 'auto',
                px: 2,
                '&:hover': {
                  bgcolor: activeStep === idx ? '#2563EB' : 'rgba(59,130,246,0.1)',
                  borderColor: COLORS.primary,
                },
              }}
            >
              {idx < activeStep && (
                <CheckCircle sx={{ fontSize: 14, mr: 0.5, color: COLORS.success }} />
              )}
              {idx + 1}. {step}
            </Button>
          ))}
        </Box>
      </Box>

      <Divider sx={{ borderColor: COLORS.border }} />

      {/* Step Content */}
      <Box sx={{ minHeight: 500 }}>
        {activeStep === 0 && (
          <Box sx={{ maxWidth: 900 }}>
            <RegionPicker />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="contained"
                onClick={() => setActiveStep(1)}
                sx={{
                  bgcolor: COLORS.primary,
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#2563EB' },
                }}
              >
                Continue to Models
              </Button>
            </Box>
          </Box>
        )}
        {activeStep === 1 && (
          <Box sx={{ maxWidth: 900 }}>
            <ModelSelector />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
              <Button
                variant="outlined"
                onClick={() => setActiveStep(0)}
                sx={{
                  color: COLORS.muted,
                  borderColor: COLORS.border,
                  textTransform: 'none',
                  '&:hover': { borderColor: COLORS.primary, color: COLORS.primary },
                }}
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={() => setActiveStep(2)}
                sx={{
                  bgcolor: COLORS.primary,
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#2563EB' },
                }}
              >
                Continue to Editor
              </Button>
            </Box>
          </Box>
        )}
        {activeStep === 2 && (
          <Box sx={{ maxWidth: 900 }}>
            <ForecastEditor />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
              <Button
                variant="outlined"
                onClick={() => setActiveStep(1)}
                sx={{
                  color: COLORS.muted,
                  borderColor: COLORS.border,
                  textTransform: 'none',
                  '&:hover': { borderColor: COLORS.primary, color: COLORS.primary },
                }}
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={() => setActiveStep(3)}
                sx={{
                  bgcolor: COLORS.primary,
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#2563EB' },
                }}
              >
                Preview Forecast
              </Button>
            </Box>
          </Box>
        )}
        {activeStep === 3 && (
          <Box sx={{ maxWidth: 900 }}>
            <ForecastPreview />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
              <Button
                variant="outlined"
                onClick={() => setActiveStep(2)}
                sx={{
                  color: COLORS.muted,
                  borderColor: COLORS.border,
                  textTransform: 'none',
                  '&:hover': { borderColor: COLORS.primary, color: COLORS.primary },
                }}
              >
                Back to Editor
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// ForecastStudio Component
// ---------------------------------------------------------------------------

const ForecastStudioSample = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [view, setView] = useState('list'); // 'list' | 'new'
  const [searchQuery, setSearchQuery] = useState('');
  const [forecasts, setForecasts] = useState([]);
  const [starredForecasts, setStarredForecasts] = useState([]);

  useEffect(() => {
    apiClient.get('/forecast-studio/forecasts')
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.forecasts ?? []);
        const enriched = list.map(f => ({ ...f, icon: FORECAST_ICON_MAP[f.iconName] || Cloud }));
        setForecasts(enriched);
        setStarredForecasts(enriched.filter(f => f.starred).map(f => f.id));
      })
      .catch(() => setForecasts([]));
  }, []);

  const handleToggleStar = useCallback((forecastId) => {
    setStarredForecasts(prev =>
      prev.includes(forecastId)
        ? prev.filter(id => id !== forecastId)
        : [...prev, forecastId],
    );
  }, []);

  const filteredForecasts = useMemo(() => {
    let filtered = forecasts;

    // Filter by tab
    if (activeTab === 1) {
      filtered = filtered.filter(f => f.status === 'Draft' || f.status === 'In Review');
    } else if (activeTab === 2) {
      filtered = filtered.filter(f => f.status === 'Published' || f.status === 'Expired');
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        f =>
          f.name.toLowerCase().includes(query) ||
          f.region.toLowerCase().includes(query),
      );
    }

    return filtered;
  }, [activeTab, searchQuery, forecasts]);

  const publishedCount = forecasts.filter(
    f => f.status === 'Published' || f.status === 'Expired',
  ).length;
  const draftCount = forecasts.filter(
    f => f.status === 'Draft' || f.status === 'In Review',
  ).length;

  if (view === 'new') {
    return (
      <Box
        sx={{
          bgcolor: COLORS.bg,
          minHeight: '100vh',
          p: 3,
        }}
      >
        <StudioWorkspace onBack={() => setView('list')} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: COLORS.bg,
        minHeight: '100vh',
        p: 3,
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1.5,
              bgcolor: COLORS.primary + '20',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Cloud sx={{ color: COLORS.primary, fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ color: COLORS.text, fontWeight: 700 }}>
              Forecast Creation Studio
            </Typography>
            <Typography sx={{ color: COLORS.muted, fontSize: 13 }}>
              Create, manage, and publish weather forecasts for the WRFCoin network
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh data">
            <IconButton
              sx={{
                color: COLORS.muted,
                border: `1px solid ${COLORS.border}`,
                '&:hover': { color: COLORS.text, borderColor: COLORS.primary },
              }}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setView('new')}
            sx={{
              bgcolor: COLORS.primary,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              '&:hover': { bgcolor: '#2563EB' },
            }}
          >
            New Forecast
          </Button>
        </Box>
      </Box>

      {/* Quick Stats */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {QUICK_STATS.map(stat => (
          <QuickStatCard key={stat.label} stat={stat} />
        ))}
      </Box>

      {/* Tabs */}
      <Paper
        sx={{
          bgcolor: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          mb: 2,
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            sx={{
              flex: 1,
              minHeight: 48,
              '& .MuiTab-root': {
                color: COLORS.muted,
                fontSize: 13,
                fontWeight: 500,
                textTransform: 'none',
                minHeight: 48,
              },
              '& .Mui-selected': { color: COLORS.primary, fontWeight: 600 },
              '& .MuiTabs-indicator': { backgroundColor: COLORS.primary, height: 2 },
            }}
          >
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  All Forecasts
                  <Chip
                    label={forecasts.length}
                    size="small"
                    sx={{ height: 18, fontSize: 10, bgcolor: 'rgba(255,255,255,0.08)', color: COLORS.muted }}
                  />
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  My Drafts
                  <Chip
                    label={draftCount}
                    size="small"
                    sx={{ height: 18, fontSize: 10, bgcolor: 'rgba(255,255,255,0.08)', color: COLORS.muted }}
                  />
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  Published
                  <Chip
                    label={publishedCount}
                    size="small"
                    sx={{ height: 18, fontSize: 10, bgcolor: 'rgba(16,185,129,0.15)', color: COLORS.success }}
                  />
                </Box>
              }
            />
          </Tabs>

          {/* Search */}
          <TextField
            placeholder="Search forecasts..."
            size="small"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: COLORS.muted, fontSize: 18 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: 240,
              '& .MuiInputBase-root': {
                color: COLORS.text,
                fontSize: 13,
                bgcolor: 'rgba(15,23,42,0.5)',
              },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.border },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.primary },
            }}
          />
        </Box>
      </Paper>

      {/* Main Content Area */}
      <Grid container spacing={2}>
        {/* Forecasts Table */}
        <Grid item xs={12} lg={8}>
          <Paper
            sx={{
              bgcolor: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: COLORS.muted, fontSize: 11, fontWeight: 600, borderColor: COLORS.border, textTransform: 'uppercase', letterSpacing: 0.5, py: 1.5 }} />
                    <TableCell sx={{ color: COLORS.muted, fontSize: 11, fontWeight: 600, borderColor: COLORS.border, textTransform: 'uppercase', letterSpacing: 0.5, py: 1.5 }}>
                      Forecast Name
                    </TableCell>
                    <TableCell sx={{ color: COLORS.muted, fontSize: 11, fontWeight: 600, borderColor: COLORS.border, textTransform: 'uppercase', letterSpacing: 0.5, py: 1.5 }}>
                      Region
                    </TableCell>
                    <TableCell sx={{ color: COLORS.muted, fontSize: 11, fontWeight: 600, borderColor: COLORS.border, textTransform: 'uppercase', letterSpacing: 0.5, py: 1.5 }}>
                      Valid Period
                    </TableCell>
                    <TableCell sx={{ color: COLORS.muted, fontSize: 11, fontWeight: 600, borderColor: COLORS.border, textTransform: 'uppercase', letterSpacing: 0.5, py: 1.5 }}>
                      Status
                    </TableCell>
                    <TableCell sx={{ color: COLORS.muted, fontSize: 11, fontWeight: 600, borderColor: COLORS.border, textTransform: 'uppercase', letterSpacing: 0.5, py: 1.5 }} align="center">
                      Skill
                    </TableCell>
                    <TableCell sx={{ color: COLORS.muted, fontSize: 11, fontWeight: 600, borderColor: COLORS.border, textTransform: 'uppercase', letterSpacing: 0.5, py: 1.5 }} align="center">
                      Views
                    </TableCell>
                    <TableCell sx={{ color: COLORS.muted, fontSize: 11, fontWeight: 600, borderColor: COLORS.border, textTransform: 'uppercase', letterSpacing: 0.5, py: 1.5 }} align="right">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredForecasts.map(forecast => {
                    const ForecastIcon = forecast.icon;
                    const isStarred = starredForecasts.includes(forecast.id);
                    return (
                      <TableRow
                        key={forecast.id}
                        sx={{
                          '&:hover': { bgcolor: 'rgba(59,130,246,0.04)' },
                          cursor: 'pointer',
                        }}
                      >
                        {/* Star */}
                        <TableCell sx={{ borderColor: COLORS.border, py: 1.5, width: 36 }}>
                          <IconButton
                            size="small"
                            onClick={e => {
                              e.stopPropagation();
                              handleToggleStar(forecast.id);
                            }}
                            sx={{ color: isStarred ? COLORS.warning : COLORS.muted, p: 0.5 }}
                          >
                            {isStarred ? <Star sx={{ fontSize: 16 }} /> : <StarBorder sx={{ fontSize: 16 }} />}
                          </IconButton>
                        </TableCell>

                        {/* Name */}
                        <TableCell sx={{ borderColor: COLORS.border, py: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ForecastIcon sx={{ color: COLORS.primary, fontSize: 18 }} />
                            <Box>
                              <Typography sx={{ color: COLORS.text, fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>
                                {forecast.name}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.25 }}>
                                {(forecast.eventTags ?? []).map(tag => (
                                  <Chip
                                    key={tag}
                                    label={tag}
                                    size="small"
                                    sx={{
                                      height: 16,
                                      fontSize: 9,
                                      bgcolor: 'rgba(239,68,68,0.12)',
                                      color: COLORS.error,
                                    }}
                                  />
                                ))}
                              </Box>
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Region */}
                        <TableCell sx={{ borderColor: COLORS.border, py: 1.5 }}>
                          <Typography sx={{ color: COLORS.muted, fontSize: 12 }}>
                            {forecast.region}
                          </Typography>
                        </TableCell>

                        {/* Valid Period */}
                        <TableCell sx={{ borderColor: COLORS.border, py: 1.5 }}>
                          <Typography sx={{ color: COLORS.muted, fontSize: 11, fontFamily: 'monospace' }}>
                            {forecast.validStart}
                          </Typography>
                          <Typography sx={{ color: COLORS.muted, fontSize: 11, fontFamily: 'monospace', opacity: 0.7 }}>
                            to {forecast.validEnd}
                          </Typography>
                        </TableCell>

                        {/* Status */}
                        <TableCell sx={{ borderColor: COLORS.border, py: 1.5 }}>
                          <ForecastStatusChip status={forecast.status} />
                        </TableCell>

                        {/* Skill */}
                        <TableCell sx={{ borderColor: COLORS.border, py: 1.5 }} align="center">
                          {forecast.skillScore !== null ? (
                            <Box>
                              <Typography
                                sx={{
                                  color:
                                    forecast.skillScore >= 0.85
                                      ? COLORS.success
                                      : forecast.skillScore >= 0.7
                                        ? COLORS.warning
                                        : COLORS.error,
                                  fontSize: 14,
                                  fontWeight: 700,
                                }}
                              >
                                {forecast.skillScore.toFixed(2)}
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={forecast.skillScore * 100}
                                sx={{
                                  height: 3,
                                  borderRadius: 1.5,
                                  mt: 0.5,
                                  bgcolor: 'rgba(255,255,255,0.05)',
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor:
                                      forecast.skillScore >= 0.85
                                        ? COLORS.success
                                        : forecast.skillScore >= 0.7
                                          ? COLORS.warning
                                          : COLORS.error,
                                    borderRadius: 1.5,
                                  },
                                }}
                              />
                            </Box>
                          ) : (
                            <Typography sx={{ color: COLORS.muted, fontSize: 11, fontStyle: 'italic' }}>
                              Pending
                            </Typography>
                          )}
                        </TableCell>

                        {/* Views */}
                        <TableCell sx={{ borderColor: COLORS.border, py: 1.5 }} align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                            <Visibility sx={{ color: COLORS.muted, fontSize: 14 }} />
                            <Typography sx={{ color: COLORS.muted, fontSize: 12 }}>
                              {forecast.views.toLocaleString()}
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* Actions */}
                        <TableCell sx={{ borderColor: COLORS.border, py: 1.5 }} align="right">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                            <Tooltip title="View">
                              <IconButton size="small" sx={{ color: COLORS.muted, '&:hover': { color: COLORS.primary } }}>
                                <Visibility sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Duplicate">
                              <IconButton size="small" sx={{ color: COLORS.muted, '&:hover': { color: COLORS.primary } }}>
                                <ContentCopy sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Share">
                              <IconButton size="small" sx={{ color: COLORS.muted, '&:hover': { color: COLORS.success } }}>
                                <Share sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="More">
                              <IconButton size="small" sx={{ color: COLORS.muted }}>
                                <MoreVert sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {filteredForecasts.length === 0 && (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Search sx={{ color: COLORS.muted, fontSize: 40, mb: 1 }} />
                <Typography sx={{ color: COLORS.muted, fontSize: 14 }}>
                  No forecasts match your search criteria
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Forecast History Section */}
          <Box sx={{ mt: 2 }}>
            <ForecastHistory />
          </Box>
        </Grid>

        {/* Right Sidebar */}
        <Grid item xs={12} lg={4}>
          {/* Recent Activity */}
          <Paper
            sx={{
              bgcolor: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 2,
              p: 2,
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography sx={{ color: COLORS.text, fontWeight: 600, fontSize: 14 }}>
                Recent Activity
              </Typography>
              <Chip
                label="Live"
                size="small"
                sx={{
                  height: 20,
                  fontSize: 10,
                  bgcolor: 'rgba(16,185,129,0.15)',
                  color: COLORS.success,
                  fontWeight: 600,
                }}
              />
            </Box>
            {RECENT_ACTIVITY.map(activity => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </Paper>

          {/* Tool Palette */}
          <Paper
            sx={{
              bgcolor: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 2,
              p: 2,
              mb: 2,
            }}
          >
            <Typography sx={{ color: COLORS.text, fontWeight: 600, fontSize: 14, mb: 1.5 }}>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[
                { label: 'Import Forecast Template', icon: Description, color: COLORS.primary },
                { label: 'Batch Publish Drafts', icon: CloudDone, color: COLORS.success },
                { label: 'Archive Expired Forecasts', icon: Archive, color: COLORS.warning },
                { label: 'Export Verification Report', icon: BarChart, color: COLORS.primary },
              ].map(action => {
                const ActionIcon = action.icon;
                return (
                  <Button
                    key={action.label}
                    fullWidth
                    startIcon={<ActionIcon sx={{ fontSize: 16 }} />}
                    sx={{
                      color: COLORS.muted,
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      fontSize: 12,
                      py: 1,
                      px: 1.5,
                      borderRadius: 1,
                      border: `1px solid ${COLORS.border}`,
                      '&:hover': {
                        bgcolor: action.color + '10',
                        color: action.color,
                        borderColor: action.color + '40',
                      },
                    }}
                  >
                    {action.label}
                  </Button>
                );
              })}
            </Box>
          </Paper>

          {/* Model Status Summary */}
          <Paper
            sx={{
              bgcolor: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 2,
              p: 2,
            }}
          >
            <Typography sx={{ color: COLORS.text, fontWeight: 600, fontSize: 14, mb: 1.5 }}>
              Model Status
            </Typography>
            {[
              { name: 'GFS-WRFCoin Blend', updated: '2h ago', status: 'Operational', color: COLORS.success },
              { name: 'ECMWF Ensemble', updated: '6h ago', status: 'Operational', color: COLORS.success },
              { name: 'HRRR Rapid Refresh', updated: '1h ago', status: 'Operational', color: COLORS.success },
              { name: 'WRFCoin Neural', updated: '30min ago', status: 'Training', color: COLORS.warning },
            ].map(model => (
              <Box
                key={model.name}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  py: 1,
                  borderBottom: `1px solid ${COLORS.border}`,
                  '&:last-child': { borderBottom: 'none' },
                }}
              >
                <Box>
                  <Typography sx={{ color: COLORS.text, fontSize: 12, fontWeight: 500 }}>
                    {model.name}
                  </Typography>
                  <Typography sx={{ color: COLORS.muted, fontSize: 10 }}>
                    Updated {model.updated}
                  </Typography>
                </Box>
                <Chip
                  label={model.status}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: 10,
                    bgcolor: model.color + '15',
                    color: model.color,
                  }}
                />
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default function ForecastStudio() {
  return <DemoSurfaceGate testId="forecast-studio" title="Forecast studio is unavailable"
    description="The forecast studio API is not served by the testnet. This workspace and its statistics are illustrative only.">
    <ForecastStudioSample />
  </DemoSurfaceGate>;
}
