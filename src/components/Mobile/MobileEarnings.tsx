import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Stack,
  ButtonBase,
  alpha,
  Avatar,
  LinearProgress,
  Fab,
  Collapse,
  Alert,
  Skeleton,
  Divider,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  LocationOn as LocationOnIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Analytics as AnalyticsIcon,
  Bolt as BoltIcon,
} from '@mui/icons-material';
import {
  weatherEarningsAPI,
  EarningsOverview,
  WeatherStation,
} from '../../services/api';

interface MobileEarningsProps {
  ownerAddress?: string;
  onStationSelect?: (station: WeatherStation) => void;
  compact?: boolean;
}

interface QuickStat {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  color: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
}

const MobileEarnings: React.FC<MobileEarningsProps> = ({
  ownerAddress,
  onStationSelect,
  compact = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  const [overview, setOverview] = useState<EarningsOverview | null>(null);
  const [stations, setStations] = useState<WeatherStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    'daily' | 'monthly' | 'total'
  >('monthly');

  useEffect(() => {
    loadEarningsData();
  }, [ownerAddress]);

  const loadEarningsData = async () => {
    try {
      setLoading(true);
      setError(null);
      setRefreshing(true);

      const [overviewData, stationsData] = await Promise.all([
        weatherEarningsAPI.getEarningsOverview(),
        weatherEarningsAPI.getWeatherStations(ownerAddress),
      ]);

      setOverview(overviewData);
      setStations(stationsData);
    } catch (err) {
      console.error('Failed to load earnings data:', err);
      setError('Failed to load earnings data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await loadEarningsData();

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const toggleCard = (cardId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(cardId)) {
      newExpanded.delete(cardId);
    } else {
      newExpanded.add(cardId);
    }
    setExpandedCards(newExpanded);
  };

  const formatCurrency = (amount: string, currency: 'WRF' | 'USD' = 'WRF') => {
    const num = parseFloat(amount.replace(/,/g, ''));
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num);
    }
    return `${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 3,
    }).format(num)} WRF`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
    case 'online':
      return theme.palette.success.main;
    case 'offline':
      return theme.palette.error.main;
    case 'maintenance':
      return theme.palette.warning.main;
    default:
      return theme.palette.grey[500];
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
    case 'online':
      return <CheckCircleIcon sx={{ fontSize: 16 }} />;
    case 'offline':
      return <ErrorIcon sx={{ fontSize: 16 }} />;
    case 'maintenance':
      return <WarningIcon sx={{ fontSize: 16 }} />;
    default:
      return <SpeedIcon sx={{ fontSize: 16 }} />;
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 95) return theme.palette.success.main;
    if (score >= 85) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  // Quick stats for mobile overview
  const quickStats: QuickStat[] = useMemo(() => {
    if (!overview) return [];

    return [
      {
        label: 'Total Earnings',
        value: formatCurrency(overview.totalEarnings),
        subValue: formatCurrency(overview.totalEarningsUSD, 'USD'),
        icon: <MoneyIcon />,
        color: theme.palette.success.main,
        trend: 'up',
        trendValue: '+12.5%',
      },
      {
        label: 'This Month',
        value: formatCurrency(overview.monthlyEarnings),
        subValue: formatCurrency(overview.monthlyEarningsUSD, 'USD'),
        icon: <ScheduleIcon />,
        color: theme.palette.primary.main,
        trend: 'up',
        trendValue: '+8.2%',
      },
      {
        label: `${overview.activeStations} Active`,
        value: `${overview.totalStations} Total`,
        subValue: `${overview.averageAccuracy.toFixed(1)}% accuracy`,
        icon: <StarIcon />,
        color: theme.palette.info.main,
        trend: 'stable',
      },
      {
        label: 'Pending',
        value: formatCurrency(overview.pendingRewards),
        subValue: formatCurrency(overview.pendingRewardsUSD, 'USD'),
        icon: <BoltIcon />,
        color: theme.palette.warning.main,
        trend: 'up',
        trendValue: '+5 stations',
      },
    ];
  }, [overview, theme]);

  // Mobile-optimized quick stats row
  const QuickStatsRow: React.FC = () => (
    <Stack direction="row" spacing={1} sx={{ mb: 2, overflowX: 'auto', pb: 1 }}>
      {quickStats.map((stat, index) => (
        <Card key={index} sx={{ minWidth: 140, flexShrink: 0 }}>
          <CardContent sx={{ p: '12px !important' }}>
            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Avatar
                  sx={{
                    width: 24,
                    height: 24,
                    bgcolor: alpha(stat.color, 0.1),
                    color: stat.color,
                  }}
                >
                  {React.cloneElement(stat.icon as React.ReactElement<any>, {
                    sx: { fontSize: 14 },
                  })}
                </Avatar>
                {stat.trend && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {stat.trend === 'up' && (
                      <TrendingUpIcon
                        sx={{ fontSize: 12, color: 'success.main' }}
                      />
                    )}
                    {stat.trend === 'down' && (
                      <TrendingDownIcon
                        sx={{ fontSize: 12, color: 'error.main' }}
                      />
                    )}
                    {stat.trendValue && (
                      <Typography
                        variant="caption"
                        sx={{ fontSize: '0.6rem', ml: 0.5 }}
                      >
                        {stat.trendValue}
                      </Typography>
                    )}
                  </Box>
                )}
              </Stack>

              <Box>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{ fontSize: '0.85rem' }}
                >
                  {stat.value}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: '0.7rem' }}
                >
                  {stat.label}
                </Typography>
                {stat.subValue && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    sx={{ fontSize: '0.65rem' }}
                  >
                    {stat.subValue}
                  </Typography>
                )}
              </Box>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );

  // Mobile-optimized station card
  const MobileStationCard: React.FC<{ station: WeatherStation }> = ({
    station,
  }) => {
    const isExpanded = expandedCards.has(station.id);
    const earnings =
      selectedTimeframe === 'daily'
        ? station.earnings.daily
        : selectedTimeframe === 'monthly'
          ? station.earnings.monthly
          : station.earnings.total || station.earnings.monthly;
    const earningsUSD =
      selectedTimeframe === 'daily'
        ? station.earnings.dailyUSD
        : selectedTimeframe === 'monthly'
          ? station.earnings.monthlyUSD
          : station.earnings.totalUSD || station.earnings.monthlyUSD;

    return (
      <Card sx={{ mb: 2, overflow: 'hidden' }}>
        <ButtonBase
          sx={{ width: '100%', textAlign: 'left' }}
          onClick={() => toggleCard(station.id)}
        >
          <CardContent sx={{ p: 2, width: '100%' }}>
            <Stack direction="row" alignItems="flex-start" spacing={2}>
              <Stack spacing={1} flex={1}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography
                    variant="h6"
                    sx={{ fontSize: '1rem', fontWeight: 600 }}
                  >
                    {station.name}
                  </Typography>
                  <Chip
                    icon={getStatusIcon(station.status)}
                    label={station.status}
                    size="small"
                    sx={{
                      backgroundColor: alpha(
                        getStatusColor(station.status),
                        0.1,
                      ),
                      color: getStatusColor(station.status),
                      fontSize: '0.7rem',
                      height: 22,
                    }}
                  />
                </Stack>

                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <LocationOnIcon
                    sx={{ fontSize: 12, color: 'text.secondary' }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: '0.75rem' }}
                  >
                    {station.location.address}
                  </Typography>
                </Stack>
              </Stack>

              <Box textAlign="right">
                <Typography
                  variant="h6"
                  color="primary"
                  sx={{ fontSize: '1.1rem', fontWeight: 600 }}
                >
                  {formatCurrency(earnings)}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: '0.7rem' }}
                >
                  {formatCurrency(earningsUSD, 'USD')}
                </Typography>
              </Box>

              <IconButton size="small">
                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Stack>
          </CardContent>
        </ButtonBase>

        <Collapse in={isExpanded}>
          <Divider />
          <CardContent sx={{ pt: 1, pb: 2 }}>
            {/* Performance metrics */}
            <Stack spacing={2}>
              <Stack direction="row" spacing={2}>
                <Box flex={1}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    gutterBottom
                  >
                    Accuracy Score
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={station.accuracyScore}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: alpha(
                        getPerformanceColor(station.accuracyScore),
                        0.1,
                      ),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: getPerformanceColor(station.accuracyScore),
                      },
                    }}
                  />
                  <Typography
                    variant="caption"
                    color={getPerformanceColor(station.accuracyScore)}
                    fontWeight={600}
                  >
                    {station.accuracyScore}%
                  </Typography>
                </Box>

                <Box flex={1}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    gutterBottom
                  >
                    Uptime
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={station.performance.uptime}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: alpha(
                        getPerformanceColor(station.performance.uptime),
                        0.1,
                      ),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: getPerformanceColor(
                          station.performance.uptime,
                        ),
                      },
                    }}
                  />
                  <Typography
                    variant="caption"
                    color={getPerformanceColor(station.performance.uptime)}
                    fontWeight={600}
                  >
                    {station.performance.uptime.toFixed(1)}%
                  </Typography>
                </Box>
              </Stack>

              {/* Quick actions */}
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <ButtonBase
                  onClick={e => {
                    e.stopPropagation();
                    onStationSelect?.(station);
                  }}
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.2),
                    },
                  }}
                >
                  <AnalyticsIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  View Details
                </ButtonBase>
              </Stack>
            </Stack>
          </CardContent>
        </Collapse>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Skeleton variant="rectangular" height={60} />
          <Stack direction="row" spacing={1}>
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} variant="rectangular" width={140} height={80} />
            ))}
          </Stack>
          {[1, 2, 3].map(i => (
            <Skeleton key={i} variant="rectangular" height={100} />
          ))}
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Card sx={{ m: 2 }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <ErrorIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
          <Typography variant="h6" color="error" gutterBottom>
            Failed to Load Earnings
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            {error}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
            <IconButton onClick={handleRefresh} color="primary" size="large">
              <RefreshIcon />
            </IconButton>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!overview) return null;

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
            Weather Earnings
          </Typography>

          <IconButton
            onClick={handleRefresh}
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

        <Typography variant="body2" color="text.secondary">
          Track your station performance and earnings
        </Typography>
      </Box>

      {/* Quick Stats */}
      <Box sx={{ px: 2 }}>
        <QuickStatsRow />
      </Box>

      {/* Top performer banner */}
      {overview.topPerformingStation && (
        <Box sx={{ px: 2, mb: 2 }}>
          <Alert
            severity="success"
            icon={<StarIcon />}
            sx={{
              alignItems: 'center',
              '& .MuiAlert-message': {
                display: 'flex',
                alignItems: 'center',
                flex: 1,
              },
            }}
            action={
              <ButtonBase
                onClick={() => {
                  const station = stations.find(
                    s => s.id === overview.topPerformingStation.id,
                  );
                  if (station) onStationSelect?.(station);
                }}
                sx={{
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  color: 'success.main',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                View
              </ButtonBase>
            }
          >
            <Stack>
              <Typography variant="body2" component="span" sx={{ display: 'block' }} fontWeight={600}>
                🏆 Top Performer: {overview.topPerformingStation.name}
              </Typography>
              <Typography variant="caption" component="span" sx={{ display: 'block' }}>
                {formatCurrency(overview.topPerformingStation.earnings)} •
                {overview.topPerformingStation.accuracyScore}% accuracy
              </Typography>
            </Stack>
          </Alert>
        </Box>
      )}

      {/* Timeframe selector */}
      <Box sx={{ px: 2, mb: 2 }}>
        <Stack direction="row" spacing={1}>
          {(['daily', 'monthly', 'total'] as const).map(timeframe => (
            <Chip
              key={timeframe}
              label={timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
              variant={selectedTimeframe === timeframe ? 'filled' : 'outlined'}
              size="small"
              onClick={() => setSelectedTimeframe(timeframe)}
              sx={{ fontSize: '0.75rem' }}
            />
          ))}
        </Stack>
      </Box>

      {/* Stations list */}
      <Box sx={{ px: 2, pb: 2 }}>
        {stations.length > 0 ? (
          stations.map(station => (
            <MobileStationCard key={station.id} station={station} />
          ))
        ) : (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <MoneyIcon
                sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Stations Found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Register your first weather station to start earning!
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Floating refresh button */}
      {!compact && (
        <Fab
          color="primary"
          size="small"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
          }}
          onClick={handleRefresh}
        >
          <RefreshIcon />
        </Fab>
      )}
    </Box>
  );
};

export default MobileEarnings;
