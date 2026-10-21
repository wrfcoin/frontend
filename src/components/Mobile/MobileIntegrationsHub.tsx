import DemoSurfaceGate from '../common/DemoSurfaceGate';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
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
  Badge,
  Fab,
  SwipeableDrawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ButtonBase,
  Divider,
} from '@mui/material';
import {
  CloudQueue as CloudIcon,
  Psychology as AIIcon,
  Storage as StorageIcon,
  SwapHoriz as BridgeIcon,
  Sensors as SensorsIcon,
  Security as SecurityIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

interface Integration {
  id: string;
  name: string;
  category: 'ai' | 'storage' | 'bridge' | 'iot' | 'security' | 'compute';
  status: 'active' | 'inactive' | 'error' | 'warning';
  description: string;
  version: string;
  lastUpdate: string;
  metrics: {
    uptime: number;
    throughput: string;
    errors: number;
    latency: number;
  };
  features: string[];
  icon: React.ReactNode;
  color: string;
}

interface MobileIntegrationsHubProps {
  compact?: boolean;
  onIntegrationSelect?: (integration: Integration) => void;
  onIntegrationAction?: (action: string, integration: Integration) => void;
}

const MobileIntegrationsHubSample: React.FC<MobileIntegrationsHubProps> = ({
  compact = false,
  onIntegrationSelect,
  onIntegrationAction,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setRefreshing(true);

      // Mock integration data - replace with actual API calls
      const mockIntegrations: Integration[] = [
        {
          id: 'langchain',
          name: 'LangChain AI',
          category: 'ai',
          status: 'active',
          description: 'Advanced AI/ML workflows and reasoning chains',
          version: '2.1.0',
          lastUpdate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          metrics: {
            uptime: 99.2,
            throughput: '1.2K req/min',
            errors: 3,
            latency: 145,
          },
          features: [
            'Natural Language Processing',
            'Chain Reasoning',
            'Model Integration',
          ],
          icon: <AIIcon />,
          color: theme.palette.secondary.main,
        },
        {
          id: 'ipfs',
          name: 'IPFS Storage',
          category: 'storage',
          status: 'active',
          description: 'Distributed file storage and retrieval',
          version: '1.8.2',
          lastUpdate: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          metrics: {
            uptime: 98.7,
            throughput: '856 MB/min',
            errors: 1,
            latency: 89,
          },
          features: [
            'Decentralized Storage',
            'Content Addressing',
            'Peer Network',
          ],
          icon: <StorageIcon />,
          color: theme.palette.info.main,
        },
        {
          id: 'wormhole',
          name: 'Wormhole Bridge',
          category: 'bridge',
          status: 'warning',
          description: 'Cross-chain asset transfers and messaging',
          version: '3.2.1',
          lastUpdate: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          metrics: {
            uptime: 95.4,
            throughput: '42 tx/min',
            errors: 8,
            latency: 2340,
          },
          features: [
            'Multi-Chain Support',
            'Asset Bridging',
            'Message Passing',
          ],
          icon: <BridgeIcon />,
          color: theme.palette.warning.main,
        },
        {
          id: 'helium',
          name: 'Helium Network',
          category: 'iot',
          status: 'active',
          description: 'IoT device connectivity and data routing',
          version: '4.1.3',
          lastUpdate: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          metrics: {
            uptime: 99.8,
            throughput: '2.4K msg/min',
            errors: 0,
            latency: 67,
          },
          features: [
            'LoRaWAN Coverage',
            'Device Management',
            'Proof of Coverage',
          ],
          icon: <SensorsIcon />,
          color: theme.palette.success.main,
        },
        {
          id: 'hsm',
          name: 'HSM Security',
          category: 'security',
          status: 'active',
          description: 'Hardware security module for key management',
          version: '2.0.0',
          lastUpdate: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          metrics: {
            uptime: 99.9,
            throughput: '245 ops/min',
            errors: 0,
            latency: 23,
          },
          features: ['Key Generation', 'Digital Signing', 'Secure Storage'],
          icon: <SecurityIcon />,
          color: theme.palette.error.main,
        },
        {
          id: 'golem',
          name: 'Golem Compute',
          category: 'compute',
          status: 'inactive',
          description: 'Distributed computing power marketplace',
          version: '1.5.7',
          lastUpdate: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          metrics: {
            uptime: 0,
            throughput: '0 tasks/min',
            errors: 0,
            latency: 0,
          },
          features: [
            'Task Distribution',
            'Resource Marketplace',
            'Parallel Processing',
          ],
          icon: <CloudIcon />,
          color: theme.palette.grey[600],
        },
      ];

      setIntegrations(mockIntegrations);
    } catch (error) {
      console.error('Failed to load integrations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const categories = [
    { key: 'all', label: 'All', icon: <FilterIcon /> },
    { key: 'ai', label: 'AI/ML', icon: <AIIcon /> },
    { key: 'storage', label: 'Storage', icon: <StorageIcon /> },
    { key: 'bridge', label: 'Bridges', icon: <BridgeIcon /> },
    { key: 'iot', label: 'IoT', icon: <SensorsIcon /> },
    { key: 'security', label: 'Security', icon: <SecurityIcon /> },
    { key: 'compute', label: 'Compute', icon: <CloudIcon /> },
  ];

  const filteredIntegrations =
    selectedCategory === 'all'
      ? integrations
      : integrations.filter(i => i.category === selectedCategory);

  const getStatusColor = (status: string) => {
    switch (status) {
    case 'active':
      return theme.palette.success.main;
    case 'inactive':
      return theme.palette.grey[500];
    case 'error':
      return theme.palette.error.main;
    case 'warning':
      return theme.palette.warning.main;
    default:
      return theme.palette.grey[500];
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
    case 'active':
      return <CheckCircleIcon sx={{ fontSize: 16 }} />;
    case 'inactive':
      return <StopIcon sx={{ fontSize: 16 }} />;
    case 'error':
      return <ErrorIcon sx={{ fontSize: 16 }} />;
    case 'warning':
      return <WarningIcon sx={{ fontSize: 16 }} />;
    default:
      return <InfoIcon sx={{ fontSize: 16 }} />;
    }
  };

  const toggleCard = (integrationId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(integrationId)) {
      newExpanded.delete(integrationId);
    } else {
      newExpanded.add(integrationId);
    }
    setExpandedCards(newExpanded);
  };

  const handleIntegrationAction = (
    action: string,
    integration: Integration,
  ) => {
    onIntegrationAction?.(action, integration);

    // Optimistic update
    if (action === 'toggle') {
      setIntegrations(prev =>
        prev.map(i =>
          i.id === integration.id
            ? { ...i, status: i.status === 'active' ? 'inactive' : 'active' }
            : i,
        ),
      );
    }

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor(
      (now.getTime() - time.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  // Mobile integration card
  const IntegrationCard: React.FC<{ integration: Integration }> = ({
    integration,
  }) => {
    const isExpanded = expandedCards.has(integration.id);

    return (
      <Card sx={{ mb: 2, overflow: 'hidden' }}>
        <ButtonBase
          sx={{ width: '100%', textAlign: 'left' }}
          onClick={() => toggleCard(integration.id)}
        >
          <CardContent sx={{ p: 2, width: '100%' }}>
            <Stack direction="row" alignItems="flex-start" spacing={2}>
              <Avatar
                sx={{
                  bgcolor: alpha(integration.color, 0.1),
                  color: integration.color,
                  width: 40,
                  height: 40,
                }}
              >
                {integration.icon}
              </Avatar>

              <Stack flex={1} spacing={1}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography
                    variant="h6"
                    sx={{ fontSize: '1rem', fontWeight: 600 }}
                  >
                    {integration.name}
                  </Typography>
                  <Chip
                    icon={getStatusIcon(integration.status)}
                    label={integration.status}
                    size="small"
                    sx={{
                      bgcolor: alpha(getStatusColor(integration.status), 0.1),
                      color: getStatusColor(integration.status),
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
                  {integration.description}
                </Typography>

                <Stack direction="row" alignItems="center" spacing={2}>
                  <Typography variant="caption" color="text.secondary">
                    v{integration.version}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatTime(integration.lastUpdate)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {integration.metrics.uptime.toFixed(1)}% uptime
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
            {/* Metrics */}
            <Stack spacing={2}>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <Typography variant="caption" color="text.secondary">
                    Throughput
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {integration.metrics.throughput}
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="caption" color="text.secondary">
                    Latency
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {integration.metrics.latency}ms
                  </Typography>
                </Grid>
              </Grid>

              {/* Health bar */}
              <Box>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={0.5}
                >
                  <Typography variant="caption" color="text.secondary">
                    Health Score
                  </Typography>
                  <Typography variant="caption" fontWeight={600}>
                    {integration.metrics.uptime.toFixed(1)}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={integration.metrics.uptime}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: alpha(getStatusColor(integration.status), 0.1),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: getStatusColor(integration.status),
                    },
                  }}
                />
              </Box>

              {/* Features */}
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  gutterBottom
                >
                  Features
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                  {integration.features.slice(0, 3).map(feature => (
                    <Chip
                      key={feature}
                      label={feature}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.65rem', height: 20 }}
                    />
                  ))}
                </Stack>
              </Box>

              {/* Actions */}
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <ButtonBase
                  onClick={e => {
                    e.stopPropagation();
                    handleIntegrationAction('toggle', integration);
                  }}
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: alpha(integration.color, 0.1),
                    color: integration.color,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: alpha(integration.color, 0.2),
                    },
                  }}
                >
                  {integration.status === 'active' ? (
                    <StopIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  ) : (
                    <PlayIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  )}
                  {integration.status === 'active' ? 'Stop' : 'Start'}
                </ButtonBase>

                <ButtonBase
                  onClick={e => {
                    e.stopPropagation();
                    handleIntegrationAction('settings', integration);
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
                  <SettingsIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  Config
                </ButtonBase>
              </Stack>
            </Stack>
          </CardContent>
        </Collapse>
      </Card>
    );
  };

  // Filter drawer
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
          <Typography variant="h6">Filter by Category</Typography>
          <IconButton onClick={() => setFilterDrawerOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>

        <List>
          {categories.map(category => {
            const count =
              category.key === 'all'
                ? integrations.length
                : integrations.filter(i => i.category === category.key).length;

            return (
              <ListItem
                key={category.key}
                component={ButtonBase}
                onClick={() => {
                  setSelectedCategory(category.key);
                  setFilterDrawerOpen(false);
                }}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  bgcolor:
                    selectedCategory === category.key
                      ? alpha(theme.palette.primary.main, 0.1)
                      : 'transparent',
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {category.icon}
                </ListItemIcon>
                <ListItemText
                  primary={category.label}
                  secondary={`${count} integration${count !== 1 ? 's' : ''}`}
                />
                {selectedCategory === category.key && (
                  <CheckCircleIcon color="primary" />
                )}
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
          Loading integrations...
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
          mb={1}
        >
          <Typography variant="h6" sx={{ fontSize: '1.3rem', fontWeight: 600 }}>
            Integrations
          </Typography>

          <Stack direction="row" spacing={1}>
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
              <Badge
                badgeContent={selectedCategory !== 'all' ? 1 : 0}
                color="primary"
              >
                <FilterIcon />
              </Badge>
            </IconButton>

            <IconButton
              onClick={loadIntegrations}
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
        </Stack>

        <Typography variant="body2" color="text.secondary">
          {filteredIntegrations.length} active integrations
        </Typography>
      </Box>

      {/* Category tabs */}
      <Box sx={{ px: 2, mb: 2 }}>
        <Tabs
          value={selectedCategory}
          onChange={(_, value) => setSelectedCategory(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              minWidth: 'auto',
              fontSize: '0.8rem',
              py: 1,
            },
          }}
        >
          {categories.map(category => (
            <Tab
              key={category.key}
              value={category.key}
              label={category.label}
              icon={category.icon}
              iconPosition="start"
              sx={{ flexDirection: 'row', gap: 1 }}
            />
          ))}
        </Tabs>
      </Box>

      {/* Integrations list */}
      <Box sx={{ px: 2, pb: 2 }}>
        {filteredIntegrations.map(integration => (
          <IntegrationCard key={integration.id} integration={integration} />
        ))}

        {filteredIntegrations.length === 0 && (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <CloudIcon
                sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Integrations Found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No integrations match the selected category.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>

      <FilterDrawer />
    </Box>
  );
};

const MobileIntegrationsHub: React.FC<React.ComponentProps<typeof MobileIntegrationsHubSample>> = (props) => (
  <DemoSurfaceGate
    testId="mobile-integrations"
    title="Mobile integrations is not live on this testnet"
    description="This preview contains illustrative data or simulated actions, not verified testnet results."
  >
    <MobileIntegrationsHubSample {...props} />
  </DemoSurfaceGate>
);

export default MobileIntegrationsHub;
