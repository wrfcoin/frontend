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
  Fab,
  SwipeableDrawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ButtonBase,
  Divider,
  Badge,
} from '@mui/material';
import {
  Nature as CarbonIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  SwapHoriz as TradeIcon,
  Forest as EcoIcon,
  Factory as FactoryIcon,
  LocalGasStation as EmissionIcon,
  AccountBalance as CreditIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon,
  CheckCircle as VerifiedIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

interface CarbonCredit {
  id: string;
  type: 'forestry' | 'renewable' | 'industrial' | 'agriculture';
  amount: number;
  price: number;
  vintage: string;
  verifier: string;
  status: 'verified' | 'pending' | 'retired';
  location: string;
  methodology: string;
  co2Reduction: number;
}

interface CarbonMetrics {
  totalCredits: number;
  totalValue: number;
  monthlyReduction: number;
  verifiedCredits: number;
  pendingCredits: number;
  retiredCredits: number;
  avgPrice: number;
  priceChange: number;
}

interface MobileCarbonCreditDashboardProps {
  compact?: boolean;
  onCreditSelect?: (credit: CarbonCredit) => void;
  onTradeAction?: (action: string, credit: CarbonCredit) => void;
}

const MobileCarbonCreditDashboardSample: React.FC<MobileCarbonCreditDashboardProps> = ({ compact = false, onCreditSelect, onTradeAction }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [credits, setCredits] = useState<CarbonCredit[]>([]);
  const [metrics, setMetrics] = useState<CarbonMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCarbonData();
  }, []);

  const loadCarbonData = async () => {
    try {
      setRefreshing(true);

      // Mock carbon credit data - replace with actual API calls
      const mockCredits: CarbonCredit[] = [
        {
          id: 'CC001',
          type: 'forestry',
          amount: 1500,
          price: 25.5,
          vintage: '2024',
          verifier: 'Verra VCS',
          status: 'verified',
          location: 'Amazon Basin, Brazil',
          methodology: 'REDD+ Forest Conservation',
          co2Reduction: 1500,
        },
        {
          id: 'CC002',
          type: 'renewable',
          amount: 2200,
          price: 18.75,
          vintage: '2023',
          verifier: 'Gold Standard',
          status: 'verified',
          location: 'Gujarat, India',
          methodology: 'Wind Energy Generation',
          co2Reduction: 2200,
        },
        {
          id: 'CC003',
          type: 'industrial',
          amount: 800,
          price: 32.0,
          vintage: '2024',
          verifier: 'CAR',
          status: 'pending',
          location: 'California, USA',
          methodology: 'Carbon Capture & Storage',
          co2Reduction: 800,
        },
        {
          id: 'CC004',
          type: 'agriculture',
          amount: 1200,
          price: 22.25,
          vintage: '2023',
          verifier: 'ACR',
          status: 'verified',
          location: 'Iowa, USA',
          methodology: 'Regenerative Agriculture',
          co2Reduction: 1200,
        },
      ];

      const mockMetrics: CarbonMetrics = {
        totalCredits: 5700,
        totalValue: 142750,
        monthlyReduction: 850,
        verifiedCredits: 4900,
        pendingCredits: 800,
        retiredCredits: 2100,
        avgPrice: 24.65,
        priceChange: 2.3,
      };

      setCredits(mockCredits);
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to load carbon credit data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const tabs = [
    { label: 'Overview', value: 0 },
    { label: 'Portfolio', value: 1 },
    { label: 'Trading', value: 2 },
    { label: 'Analytics', value: 3 },
  ];

  const creditTypes = [
    { key: 'all', label: 'All Types', icon: <CarbonIcon /> },
    { key: 'forestry', label: 'Forestry', icon: <EcoIcon /> },
    { key: 'renewable', label: 'Renewable', icon: <EcoIcon /> },
    { key: 'industrial', label: 'Industrial', icon: <FactoryIcon /> },
    { key: 'agriculture', label: 'Agriculture', icon: <EcoIcon /> },
  ];

  const filteredCredits =
    selectedType === 'all'
      ? credits
      : credits.filter(c => c.type === selectedType);

  const getTypeColor = (type: string) => {
    switch (type) {
    case 'forestry':
      return theme.palette.success.main;
    case 'renewable':
      return theme.palette.info.main;
    case 'industrial':
      return theme.palette.warning.main;
    case 'agriculture':
      return theme.palette.secondary.main;
    default:
      return theme.palette.grey[600];
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
    case 'forestry':
      return <EcoIcon />;
    case 'renewable':
      return <EcoIcon />;
    case 'industrial':
      return <FactoryIcon />;
    case 'agriculture':
      return <EcoIcon />;
    default:
      return <CarbonIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
    case 'verified':
      return theme.palette.success.main;
    case 'pending':
      return theme.palette.warning.main;
    case 'retired':
      return theme.palette.grey[500];
    default:
      return theme.palette.grey[500];
    }
  };

  const toggleCard = (creditId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(creditId)) {
      newExpanded.delete(creditId);
    } else {
      newExpanded.add(creditId);
    }
    setExpandedCards(newExpanded);
  };

  const handleTradeAction = (action: string, credit: CarbonCredit) => {
    onTradeAction?.(action, credit);

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
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    width: 32,
                    height: 32,
                  }}
                >
                  <CarbonIcon
                    sx={{ fontSize: 18, color: theme.palette.success.main }}
                  />
                </Avatar>
                <Box flex={1}>
                  <Typography variant="caption" color="text.secondary">
                    Total Credits
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontSize: '1.1rem', fontWeight: 600 }}
                  >
                    {metrics?.totalCredits.toLocaleString()} tCO₂
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
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    width: 32,
                    height: 32,
                  }}
                >
                  <CreditIcon
                    sx={{ fontSize: 18, color: theme.palette.primary.main }}
                  />
                </Avatar>
                <Box flex={1}>
                  <Typography variant="caption" color="text.secondary">
                    Portfolio Value
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontSize: '1.1rem', fontWeight: 600 }}
                  >
                    ${metrics?.totalValue.toLocaleString()}
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
                  <SpeedIcon
                    sx={{ fontSize: 18, color: theme.palette.info.main }}
                  />
                </Avatar>
                <Box flex={1}>
                  <Typography variant="caption" color="text.secondary">
                    Avg Price
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontSize: '1.1rem', fontWeight: 600 }}
                  >
                    ${metrics?.avgPrice.toFixed(2)}
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
                  <EmissionIcon
                    sx={{ fontSize: 18, color: theme.palette.secondary.main }}
                  />
                </Avatar>
                <Box flex={1}>
                  <Typography variant="caption" color="text.secondary">
                    Monthly Impact
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontSize: '1.1rem', fontWeight: 600 }}
                  >
                    {metrics?.monthlyReduction} tCO₂
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Status Distribution */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ fontSize: '1rem', fontWeight: 600 }}
          >
            Credit Status Distribution
          </Typography>

          <Stack spacing={2}>
            <Box>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={0.5}
              >
                <Typography variant="body2">Verified</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {metrics?.verifiedCredits.toLocaleString()} tCO₂
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={
                  ((metrics?.verifiedCredits || 0) /
                    (metrics?.totalCredits || 1)) *
                  100
                }
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.success.main, 0.1),
                  '& .MuiLinearProgress-bar': {
                    bgcolor: theme.palette.success.main,
                  },
                }}
              />
            </Box>

            <Box>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={0.5}
              >
                <Typography variant="body2">Pending</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {metrics?.pendingCredits.toLocaleString()} tCO₂
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={
                  ((metrics?.pendingCredits || 0) /
                    (metrics?.totalCredits || 1)) *
                  100
                }
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                  '& .MuiLinearProgress-bar': {
                    bgcolor: theme.palette.warning.main,
                  },
                }}
              />
            </Box>

            <Box>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={0.5}
              >
                <Typography variant="body2">Retired</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {metrics?.retiredCredits.toLocaleString()} tCO₂
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={
                  ((metrics?.retiredCredits || 0) /
                    (metrics?.totalCredits || 1)) *
                  100
                }
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.grey[500], 0.1),
                  '& .MuiLinearProgress-bar': {
                    bgcolor: theme.palette.grey[500],
                  },
                }}
              />
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );

  // Portfolio Tab Component
  const PortfolioTab: React.FC = () => (
    <Box sx={{ p: 2 }}>
      {/* Filter Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="between"
        mb={2}
      >
        <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
          Carbon Credits Portfolio
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

      {/* Credits List */}
      {filteredCredits.map(credit => (
        <CreditCard key={credit.id} credit={credit} />
      ))}

      {filteredCredits.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <CarbonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Credits Found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No carbon credits match the selected filter.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );

  // Credit Card Component
  const CreditCard: React.FC<{ credit: CarbonCredit }> = ({ credit }) => {
    const isExpanded = expandedCards.has(credit.id);

    return (
      <Card sx={{ mb: 2, overflow: 'hidden' }}>
        <ButtonBase
          sx={{ width: '100%', textAlign: 'left' }}
          onClick={() => toggleCard(credit.id)}
        >
          <CardContent sx={{ p: 2, width: '100%' }}>
            <Stack direction="row" alignItems="flex-start" spacing={2}>
              <Avatar
                sx={{
                  bgcolor: alpha(getTypeColor(credit.type), 0.1),
                  color: getTypeColor(credit.type),
                  width: 40,
                  height: 40,
                }}
              >
                {getTypeIcon(credit.type)}
              </Avatar>

              <Stack flex={1} spacing={1}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography
                    variant="h6"
                    sx={{ fontSize: '1rem', fontWeight: 600 }}
                  >
                    {credit.id}
                  </Typography>
                  <Chip
                    icon={
                      credit.status === 'verified' ? (
                        <VerifiedIcon sx={{ fontSize: 14 }} />
                      ) : (
                        <WarningIcon sx={{ fontSize: 14 }} />
                      )
                    }
                    label={credit.status}
                    size="small"
                    sx={{
                      bgcolor: alpha(getStatusColor(credit.status), 0.1),
                      color: getStatusColor(credit.status),
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
                  {credit.location}
                </Typography>

                <Stack direction="row" alignItems="center" spacing={2}>
                  <Typography variant="caption" color="text.secondary">
                    {credit.amount.toLocaleString()} tCO₂
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ${credit.price}/tCO₂
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {credit.vintage}
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
              <Grid container spacing={2}>
                <Grid size={6}>
                  <Typography variant="caption" color="text.secondary">
                    Total Value
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    ${(credit.amount * credit.price).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="caption" color="text.secondary">
                    Verifier
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {credit.verifier}
                  </Typography>
                </Grid>
              </Grid>

              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  gutterBottom
                >
                  Methodology
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {credit.methodology}
                </Typography>
              </Box>

              {/* Actions */}
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <ButtonBase
                  onClick={e => {
                    e.stopPropagation();
                    handleTradeAction('sell', credit);
                  }}
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.error.main, 0.1),
                    color: theme.palette.error.main,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.error.main, 0.2),
                    },
                  }}
                >
                  <TradeIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  Sell
                </ButtonBase>

                <ButtonBase
                  onClick={e => {
                    e.stopPropagation();
                    handleTradeAction('retire', credit);
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
                  <EcoIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  Retire
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
          {creditTypes.map(type => {
            const count =
              type.key === 'all'
                ? credits.length
                : credits.filter(c => c.type === type.key).length;

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
                  secondary={`${count} credit${count !== 1 ? 's' : ''}`}
                />
                {selectedType === type.key && <VerifiedIcon color="primary" />}
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
          Loading carbon credit data...
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
            Carbon Credits
          </Typography>

          <IconButton
            onClick={loadCarbonData}
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
      {selectedTab === 1 && <PortfolioTab />}
      {selectedTab === 2 && (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Trading interface coming soon...
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

// frontend#326: MobileCarbonCreditDashboardSample sets a hard-coded metrics object with no fetch.
// Default build: honest not-live, sample never mounted. Demo surfaces:
// sample under a "Sample data" chip.
const MobileCarbonCreditDashboard: React.FC<MobileCarbonCreditDashboardProps> = (props) => (
  <DemoSurfaceGate
    title="Carbon credits are not live on the testnet yet"
    description="No carbon-accounting route is mounted on the testnet API; the credits and prices in the preview are hard-coded."
    testId="mobile-carbon"
  >
    <MobileCarbonCreditDashboardSample {...props} />
  </DemoSurfaceGate>
);

export default MobileCarbonCreditDashboard;
