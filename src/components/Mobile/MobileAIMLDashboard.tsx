import React, { useState, useEffect } from 'react';
import DemoSurfaceGate from '../common/DemoSurfaceGate';
import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme,
  useMediaQuery,
  Stack,
  Avatar,
  LinearProgress,
  Tabs,
  Tab,
  Grid,
  Collapse,
  alpha,
  IconButton,
  Chip,
  SwipeableDrawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ButtonBase,
  Divider,
  Badge,
  CircularProgress,
} from '@mui/material';
import {
  Psychology as AIIcon,
  Memory as ModelIcon,
  DataUsage as DataIcon,
  Speed as PerformanceIcon,
  TrendingUp as AccuracyIcon,
  CloudQueue as ComputeIcon,
  Storage as StorageIcon,
  Timeline as MetricsIcon,
  Settings as ConfigIcon,
  PlayArrow as TrainIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
  CheckCircle as ActiveIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Pause as PauseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  SmartToy as BotIcon,
  Analytics as AnalyticsIcon,
  Science as ExperimentIcon,
} from '@mui/icons-material';

interface AIModel {
  id: string;
  name: string;
  type:
    | 'weather-prediction'
    | 'carbon-analysis'
    | 'market-forecasting'
    | 'anomaly-detection';
  status: 'training' | 'deployed' | 'idle' | 'error';
  accuracy: number;
  trainingProgress: number;
  lastTrained: string;
  datasetSize: number;
  computeUsage: number;
  version: string;
  metrics: {
    precision: number;
    recall: number;
    f1Score: number;
    mse: number;
    latency: number;
  };
}

interface AIMetrics {
  totalModels: number;
  activeModels: number;
  trainingModels: number;
  totalPredictions: number;
  avgAccuracy: number;
  computeUtilization: number;
  dataProcessed: number;
  predictionLatency: number;
}

interface MobileAIMLDashboardProps {
  compact?: boolean;
  onModelSelect?: (model: AIModel) => void;
  onModelAction?: (action: string, model: AIModel) => void;
}

const MobileAIMLDashboardSample: React.FC<MobileAIMLDashboardProps> = ({
  compact = false,
  onModelSelect,
  onModelAction,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [models, setModels] = useState<AIModel[]>([]);
  const [metrics, setMetrics] = useState<AIMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAIMLData();
  }, []);

  const loadAIMLData = async () => {
    try {
      setRefreshing(true);

      // Mock AI/ML data - replace with actual API calls
      const mockModels: AIModel[] = [
        {
          id: 'WP001',
          name: 'Advanced Weather Predictor',
          type: 'weather-prediction',
          status: 'deployed',
          accuracy: 94.2,
          trainingProgress: 100,
          lastTrained: new Date(
            Date.now() - 3 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          datasetSize: 2500000,
          computeUsage: 75,
          version: '2.1.4',
          metrics: {
            precision: 0.942,
            recall: 0.938,
            f1Score: 0.94,
            mse: 0.0023,
            latency: 145,
          },
        },
        {
          id: 'CA002',
          name: 'Carbon Impact Analyzer',
          type: 'carbon-analysis',
          status: 'training',
          accuracy: 87.6,
          trainingProgress: 68,
          lastTrained: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          datasetSize: 890000,
          computeUsage: 92,
          version: '1.8.2',
          metrics: {
            precision: 0.876,
            recall: 0.884,
            f1Score: 0.88,
            mse: 0.0045,
            latency: 234,
          },
        },
        {
          id: 'MF003',
          name: 'Market Trend Forecaster',
          type: 'market-forecasting',
          status: 'deployed',
          accuracy: 91.8,
          trainingProgress: 100,
          lastTrained: new Date(
            Date.now() - 1 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          datasetSize: 1200000,
          computeUsage: 43,
          version: '3.0.1',
          metrics: {
            precision: 0.918,
            recall: 0.914,
            f1Score: 0.916,
            mse: 0.0034,
            latency: 189,
          },
        },
        {
          id: 'AD004',
          name: 'Anomaly Detection Engine',
          type: 'anomaly-detection',
          status: 'idle',
          accuracy: 96.3,
          trainingProgress: 100,
          lastTrained: new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          datasetSize: 450000,
          computeUsage: 8,
          version: '1.5.7',
          metrics: {
            precision: 0.963,
            recall: 0.959,
            f1Score: 0.961,
            mse: 0.0018,
            latency: 98,
          },
        },
      ];

      const mockMetrics: AIMetrics = {
        totalModels: 4,
        activeModels: 2,
        trainingModels: 1,
        totalPredictions: 1245678,
        avgAccuracy: 92.5,
        computeUtilization: 54.5,
        dataProcessed: 5.04,
        predictionLatency: 166.5,
      };

      setModels(mockModels);
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to load AI/ML data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const tabs = [
    { label: 'Overview', value: 0 },
    { label: 'Models', value: 1 },
    { label: 'Training', value: 2 },
    { label: 'Analytics', value: 3 },
  ];

  const modelTypes = [
    { key: 'all', label: 'All Models', icon: <AIIcon /> },
    { key: 'weather-prediction', label: 'Weather', icon: <ComputeIcon /> },
    { key: 'carbon-analysis', label: 'Carbon', icon: <AnalyticsIcon /> },
    { key: 'market-forecasting', label: 'Market', icon: <AccuracyIcon /> },
    { key: 'anomaly-detection', label: 'Anomaly', icon: <ExperimentIcon /> },
  ];

  const filteredModels =
    selectedType === 'all'
      ? models
      : models.filter(m => m.type === selectedType);

  const getTypeColor = (type: string) => {
    switch (type) {
    case 'weather-prediction':
      return theme.palette.info.main;
    case 'carbon-analysis':
      return theme.palette.success.main;
    case 'market-forecasting':
      return theme.palette.warning.main;
    case 'anomaly-detection':
      return theme.palette.error.main;
    default:
      return theme.palette.grey[600];
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
    case 'weather-prediction':
      return <ComputeIcon />;
    case 'carbon-analysis':
      return <AnalyticsIcon />;
    case 'market-forecasting':
      return <AccuracyIcon />;
    case 'anomaly-detection':
      return <ExperimentIcon />;
    default:
      return <AIIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
    case 'deployed':
      return theme.palette.success.main;
    case 'training':
      return theme.palette.warning.main;
    case 'idle':
      return theme.palette.grey[500];
    case 'error':
      return theme.palette.error.main;
    default:
      return theme.palette.grey[500];
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
    case 'deployed':
      return <ActiveIcon sx={{ fontSize: 16 }} />;
    case 'training':
      return <TrainIcon sx={{ fontSize: 16 }} />;
    case 'idle':
      return <PauseIcon sx={{ fontSize: 16 }} />;
    case 'error':
      return <ErrorIcon sx={{ fontSize: 16 }} />;
    default:
      return <WarningIcon sx={{ fontSize: 16 }} />;
    }
  };

  const toggleCard = (modelId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(modelId)) {
      newExpanded.delete(modelId);
    } else {
      newExpanded.add(modelId);
    }
    setExpandedCards(newExpanded);
  };

  const handleModelAction = (action: string, model: AIModel) => {
    onModelAction?.(action, model);

    // Optimistic update
    if (action === 'toggle') {
      setModels(prev =>
        prev.map(m =>
          m.id === model.id
            ? { ...m, status: m.status === 'deployed' ? 'idle' : 'deployed' }
            : m,
        ),
      );
    }

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  // Overview Tab Component
  const OverviewTab: React.FC = () => (
    <Box sx={{ p: 2 }}>
      {/* Key Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={6}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    width: 32,
                    height: 32,
                  }}
                >
                  <ModelIcon
                    sx={{ fontSize: 18, color: theme.palette.primary.main }}
                  />
                </Avatar>
                <Box flex={1}>
                  <Typography variant="caption" color="text.secondary">
                    Total Models
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontSize: '1.1rem', fontWeight: 600 }}
                  >
                    {metrics?.totalModels}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={6}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    width: 32,
                    height: 32,
                  }}
                >
                  <ActiveIcon
                    sx={{ fontSize: 18, color: theme.palette.success.main }}
                  />
                </Avatar>
                <Box flex={1}>
                  <Typography variant="caption" color="text.secondary">
                    Active Models
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontSize: '1.1rem', fontWeight: 600 }}
                  >
                    {metrics?.activeModels}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={6}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    width: 32,
                    height: 32,
                  }}
                >
                  <AccuracyIcon
                    sx={{ fontSize: 18, color: theme.palette.info.main }}
                  />
                </Avatar>
                <Box flex={1}>
                  <Typography variant="caption" color="text.secondary">
                    Avg Accuracy
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontSize: '1.1rem', fontWeight: 600 }}
                  >
                    {metrics?.avgAccuracy.toFixed(1)}%
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={6}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.secondary.main, 0.1),
                    width: 32,
                    height: 32,
                  }}
                >
                  <PerformanceIcon
                    sx={{ fontSize: 18, color: theme.palette.secondary.main }}
                  />
                </Avatar>
                <Box flex={1}>
                  <Typography variant="caption" color="text.secondary">
                    Avg Latency
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontSize: '1.1rem', fontWeight: 600 }}
                  >
                    {metrics?.predictionLatency.toFixed(0)}ms
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Compute Utilization */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ fontSize: '1rem', fontWeight: 600 }}
          >
            Compute Utilization
          </Typography>

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={1}
          >
            <Typography variant="body2">Overall Usage</Typography>
            <Typography variant="body2" fontWeight={600}>
              {metrics?.computeUtilization.toFixed(1)}%
            </Typography>
          </Stack>

          <LinearProgress
            variant="determinate"
            value={metrics?.computeUtilization || 0}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              '& .MuiLinearProgress-bar': {
                bgcolor:
                  metrics && metrics.computeUtilization > 80
                    ? theme.palette.error.main
                    : metrics && metrics.computeUtilization > 60
                      ? theme.palette.warning.main
                      : theme.palette.success.main,
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ fontSize: '1rem', fontWeight: 600 }}
          >
            Performance Summary
          </Typography>

          <Grid container spacing={2}>
            <Grid size={6}>
              <Typography variant="caption" color="text.secondary">
                Predictions Today
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {metrics?.totalPredictions.toLocaleString()}
              </Typography>
            </Grid>
            <Grid size={6}>
              <Typography variant="caption" color="text.secondary">
                Data Processed
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {metrics?.dataProcessed.toFixed(2)} GB
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );

  // Models Tab Component
  const ModelsTab: React.FC = () => (
    <Box sx={{ p: 2 }}>
      {/* Filter Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
      >
        <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
          AI/ML Models
        </Typography>

        <IconButton
          onClick={() => setFilterDrawerOpen(true)}
          size="small"
          sx={{
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.2),
            },
          }}
        >
          <Badge badgeContent={selectedType !== 'all' ? 1 : 0} color="primary">
            <FilterIcon />
          </Badge>
        </IconButton>
      </Stack>

      {/* Models List */}
      {filteredModels.map(model => (
        <ModelCard key={model.id} model={model} />
      ))}

      {filteredModels.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <AIIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Models Found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No AI models match the selected filter.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );

  // Model Card Component
  const ModelCard: React.FC<{ model: AIModel }> = ({ model }) => {
    const isExpanded = expandedCards.has(model.id);

    return (
      <Card sx={{ mb: 2, overflow: 'hidden' }}>
        <ButtonBase
          sx={{ width: '100%', textAlign: 'left' }}
          onClick={() => toggleCard(model.id)}
        >
          <CardContent sx={{ p: 2, width: '100%' }}>
            <Stack direction="row" alignItems="flex-start" spacing={2}>
              <Avatar
                sx={{
                  bgcolor: alpha(getTypeColor(model.type), 0.1),
                  color: getTypeColor(model.type),
                  width: 40,
                  height: 40,
                }}
              >
                {getTypeIcon(model.type)}
              </Avatar>

              <Stack flex={1} spacing={1}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography
                    variant="h6"
                    sx={{ fontSize: '1rem', fontWeight: 600 }}
                  >
                    {model.name}
                  </Typography>
                  <Chip
                    icon={getStatusIcon(model.status)}
                    label={model.status}
                    size="small"
                    sx={{
                      bgcolor: alpha(getStatusColor(model.status), 0.1),
                      color: getStatusColor(model.status),
                      fontSize: '0.7rem',
                      height: 22,
                    }}
                  />
                </Stack>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: '0.85rem' }}
                >
                  v{model.version} • {model.accuracy.toFixed(1)}% accuracy
                </Typography>

                {model.status === 'training' && (
                  <Box>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={0.5}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Training Progress
                      </Typography>
                      <Typography variant="caption" fontWeight={600}>
                        {model.trainingProgress}%
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={model.trainingProgress}
                      sx={{
                        height: 4,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.warning.main, 0.1),
                        '& .MuiLinearProgress-bar': {
                          bgcolor: theme.palette.warning.main,
                        },
                      }}
                    />
                  </Box>
                )}

                <Stack direction="row" alignItems="center" spacing={2}>
                  <Typography variant="caption" color="text.secondary">
                    {(model.datasetSize / 1000000).toFixed(1)}M samples
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {model.computeUsage}% compute
                  </Typography>
                </Stack>
              </Stack>

              <IconButton size="small">
                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Stack>
          </CardContent>
        </ButtonBase>

        <Collapse in={isExpanded}>
          <Divider />
          <CardContent sx={{ pt: 1, pb: 2 }}>
            <Stack spacing={2}>
              {/* Performance Metrics */}
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  gutterBottom
                >
                  Performance Metrics
                </Typography>
                <Grid container spacing={1}>
                  <Grid size={4}>
                    <Typography variant="caption" color="text.secondary">
                      Precision
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {(model.metrics.precision * 100).toFixed(1)}%
                    </Typography>
                  </Grid>
                  <Grid size={4}>
                    <Typography variant="caption" color="text.secondary">
                      Recall
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {(model.metrics.recall * 100).toFixed(1)}%
                    </Typography>
                  </Grid>
                  <Grid size={4}>
                    <Typography variant="caption" color="text.secondary">
                      F1 Score
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {(model.metrics.f1Score * 100).toFixed(1)}%
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Box>
                <Grid container spacing={2}>
                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary">
                      Latency
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {model.metrics.latency}ms
                    </Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary">
                      MSE
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {model.metrics.mse.toFixed(4)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Actions */}
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <ButtonBase
                  onClick={e => {
                    e.stopPropagation();
                    handleModelAction('toggle', model);
                  }}
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: alpha(getTypeColor(model.type), 0.1),
                    color: getTypeColor(model.type),
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: alpha(getTypeColor(model.type), 0.2),
                    },
                  }}
                >
                  {model.status === 'deployed' ? (
                    <StopIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  ) : (
                    <TrainIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  )}
                  {model.status === 'deployed' ? 'Stop' : 'Deploy'}
                </ButtonBase>

                <ButtonBase
                  onClick={e => {
                    e.stopPropagation();
                    handleModelAction('configure', model);
                  }}
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.grey[600], 0.1),
                    color: theme.palette.grey[600],
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.grey[600], 0.2),
                    },
                  }}
                >
                  <ConfigIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  Config
                </ButtonBase>
              </Stack>
            </Stack>
          </CardContent>
        </Collapse>
      </Card>
    );
  };

  // Filter Drawer
  const FilterDrawer: React.FC = () => (
    <SwipeableDrawer
      anchor="bottom"
      open={filterDrawerOpen}
      onClose={() => setFilterDrawerOpen(false)}
      onOpen={() => setFilterDrawerOpen(true)}
      sx={{
        '& .MuiDrawer-paper': {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: '50vh',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          mb={2}
        >
          <Typography variant="h6">Filter by Type</Typography>
          <IconButton onClick={() => setFilterDrawerOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>

        <List>
          {modelTypes.map(type => {
            const count =
              type.key === 'all'
                ? models.length
                : models.filter(m => m.type === type.key).length;

            return (
              <ListItem
                key={type.key}
                component={ButtonBase}
                onClick={() => {
                  setSelectedType(type.key);
                  setFilterDrawerOpen(false);
                }}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  bgcolor:
                    selectedType === type.key
                      ? alpha(theme.palette.primary.main, 0.1)
                      : 'transparent',
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{type.icon}</ListItemIcon>
                <ListItemText
                  primary={type.label}
                  secondary={`${count} model${count !== 1 ? 's' : ''}`}
                />
                {selectedType === type.key && <ActiveIcon color="primary" />}
              </ListItem>
            );
          })}
        </List>
      </Box>
    </SwipeableDrawer>
  );

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight={compact ? 200 : 300}
        p={3}
      >
        <Typography variant="body2" color="text.secondary">
          Loading AI/ML models...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', minHeight: compact ? 300 : '100vh' }}>
      {/* Header */}
      <Box sx={{ p: 2, pb: 1 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          mb={2}
        >
          <Typography variant="h6" sx={{ fontSize: '1.3rem', fontWeight: 600 }}>
            AI/ML Dashboard
          </Typography>

          <IconButton
            onClick={loadAIMLData}
            disabled={refreshing}
            size="small"
            sx={{
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
              },
            }}
          >
            <RefreshIcon
              sx={{
                animation: refreshing ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                },
              }}
            />
          </IconButton>
        </Stack>

        {/* Tabs */}
        <Tabs
          value={selectedTab}
          onChange={(_, value) => setSelectedTab(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              minWidth: 'auto',
              fontSize: '0.85rem',
              py: 1,
            },
          }}
        >
          {tabs.map(tab => (
            <Tab key={tab.value} label={tab.label} />
          ))}
        </Tabs>
      </Box>

      {/* Tab Content */}
      {selectedTab === 0 && <OverviewTab />}
      {selectedTab === 1 && <ModelsTab />}
      {selectedTab === 2 && (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Training interface coming soon...
          </Typography>
        </Box>
      )}
      {selectedTab === 3 && (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Analytics dashboard coming soon...
          </Typography>
        </Box>
      )}

      <FilterDrawer />
    </Box>
  );
};

// frontend#326: MobileAIMLDashboardSample sets a hard-coded metrics object with no fetch.
// Default build: honest not-live, sample never mounted. Demo surfaces:
// sample under a "Sample data" chip.
const MobileAIMLDashboard: React.FC<MobileAIMLDashboardProps> = (props) => (
  <DemoSurfaceGate
    title="AI/ML metrics are not live on the testnet yet"
    description="No AI/ML metrics route is mounted on the testnet API; the figures in the preview are hard-coded."
    testId="mobile-aiml"
  >
    <MobileAIMLDashboardSample {...props} />
  </DemoSurfaceGate>
);

export default MobileAIMLDashboard;
