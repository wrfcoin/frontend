import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { resolveWsOrigin } from '../../utils/wsUrl.js';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Avatar,
  Badge,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon,
  NetworkCheck as NetworkCheckIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { devLog } from '../../utils/logger';

interface IntegrationStatus {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'degraded' | 'maintenance';
  uptime: number; // percentage
  responseTime: number; // milliseconds
  lastCheck: Date;
  errorCount: number;
  warningCount: number;
  throughput: number; // requests per minute
  icon: string;
  category: string;
  endpoint?: string;
  version?: string;
  dependencies?: string[];
  alerts: Alert[];
}

interface Alert {
  id: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

interface PerformanceMetric {
  timestamp: Date;
  responseTime: number;
  throughput: number;
  errorRate: number;
}

interface StatusMonitorGridProps {
  integrations: IntegrationStatus[];
  onIntegrationClick?: (integration: IntegrationStatus) => void;
  onRefresh?: () => void;
  autoRefresh?: boolean;
  refreshInterval?: number; // seconds
  className?: string;
}

const StatusMonitorGrid: React.FC<StatusMonitorGridProps> = ({
  integrations,
  onIntegrationClick,
  onRefresh,
  autoRefresh = true,
  refreshInterval = 30,
  className,
}) => {
  const [selectedIntegration, setSelectedIntegration] =
    useState<IntegrationStatus | null>(null);
  const [performanceData, setPerformanceData] = useState<
    Record<string, PerformanceMetric[]>
  >({});
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const wsRef = useRef<WebSocket | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        // Connect to the integrations status WebSocket endpoint
        const wsUrl = `${resolveWsOrigin()}/api/integrations/status/stream`;
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          devLog('Status monitor WebSocket connected');
        };

        wsRef.current.onmessage = event => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'status_update') {
              // Update integration status in real-time
              setLastUpdate(new Date());

              // Check for new alerts
              if (data.alerts && data.alerts.length > 0) {
                setAlerts(prev => [...data.alerts, ...prev].slice(0, 50)); // Keep last 50 alerts
                data.alerts.forEach((alert: Alert) => {
                  if (alert.severity === 'error') {
                    setSnackbarMessage(`${alert.message}`);
                  }
                });
              }
            } else if (data.type === 'performance_metric') {
              // Update performance metrics
              setPerformanceData(prev => ({
                ...prev,
                [data.integrationId]: [
                  ...(prev[data.integrationId] || []).slice(-29), // Keep last 30 data points
                  {
                    timestamp: new Date(data.timestamp),
                    responseTime: data.responseTime,
                    throughput: data.throughput,
                    errorRate: data.errorRate,
                  },
                ],
              }));
            }
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        wsRef.current.onclose = () => {
          devLog('Status monitor WebSocket disconnected');
          // Attempt to reconnect after 5 seconds
          setTimeout(connectWebSocket, 5000);
        };

        wsRef.current.onerror = error => {
          console.error('WebSocket error:', error);
        };
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        handleRefresh();
      }, refreshInterval * 1000);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
    return undefined;
  }, [autoRefresh, refreshInterval]);

  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to refresh status:', error);
      setSnackbarMessage('Failed to refresh integration status');
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh, isRefreshing]);

  // Get status color and icon
  const getStatusIndicator = (status: IntegrationStatus['status']) => {
    switch (status) {
    case 'online':
      return { color: 'success', icon: <CheckCircleIcon />, label: 'Online' };
    case 'offline':
      return { color: 'error', icon: <ErrorIcon />, label: 'Offline' };
    case 'degraded':
      return { color: 'warning', icon: <WarningIcon />, label: 'Degraded' };
    case 'maintenance':
      return { color: 'info', icon: <SettingsIcon />, label: 'Maintenance' };
    default:
      return { color: 'default', icon: <ErrorIcon />, label: 'Unknown' };
    }
  };

  // Calculate overall system health
  const systemHealth = useMemo(() => {
    if (integrations.length === 0) return { score: 0, status: 'unknown' };

    const onlineCount = integrations.filter(i => i.status === 'online').length;
    const score = (onlineCount / integrations.length) * 100;

    let status = 'healthy';
    if (score < 50) status = 'critical';
    else if (score < 80) status = 'degraded';
    else if (score < 95) status = 'warning';

    return { score: Math.round(score), status };
  }, [integrations]);

  // Get critical alerts count
  const criticalAlerts = alerts.filter(
    alert => alert.severity === 'error' && !alert.acknowledged,
  ).length;

  // Get performance trend for an integration
  const getPerformanceTrend = (integrationId: string) => {
    const data = performanceData[integrationId];
    if (!data || data.length < 2) return 'stable';

    const recent = data.slice(-5);
    const older = data.slice(-10, -5);

    if (recent.length === 0 || older.length === 0) return 'stable';

    const recentAvg =
      recent.reduce((sum, metric) => sum + metric.responseTime, 0) /
      recent.length;
    const olderAvg =
      older.reduce((sum, metric) => sum + metric.responseTime, 0) /
      older.length;

    const change = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (change > 10) return 'declining';
    if (change < -10) return 'improving';
    return 'stable';
  };

  // Handle integration card click
  const handleIntegrationClick = (integration: IntegrationStatus) => {
    setSelectedIntegration(integration);
    if (onIntegrationClick) {
      onIntegrationClick(integration);
    }
  };

  // Acknowledge alert
  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert,
      ),
    );
  };

  // Format response time
  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  // Format uptime
  const formatUptime = (percentage: number) => {
    return `${percentage.toFixed(2)}%`;
  };

  return (
    <Box className={className}>
      {/* System Overview Header */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h6">System Status</Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Tooltip
                title={`Last updated: ${lastUpdate.toLocaleTimeString()}`}
              >
                <Typography variant="caption" color="text.secondary">
                  Updated {lastUpdate.toLocaleTimeString()}
                </Typography>
              </Tooltip>
              <IconButton
                onClick={() => setShowAlerts(true)}
                color={criticalAlerts > 0 ? 'error' : 'default'}
              >
                <Badge badgeContent={criticalAlerts} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
              <IconButton onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshIcon
                  sx={{
                    animation: isRefreshing
                      ? 'spin 1s linear infinite'
                      : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  }}
                />
              </IconButton>
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">
                System Health
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={systemHealth.score}
                  sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                  color={
                    systemHealth.status === 'healthy'
                      ? 'success'
                      : systemHealth.status === 'warning'
                        ? 'warning'
                        : systemHealth.status === 'degraded'
                          ? 'warning'
                          : 'error'
                  }
                />
                <Typography variant="body2" fontWeight="bold">
                  {systemHealth.score}%
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Online Services
              </Typography>
              <Typography variant="h6">
                {integrations.filter(i => i.status === 'online').length} /{' '}
                {integrations.length}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Avg Response Time
              </Typography>
              <Typography variant="h6">
                {formatResponseTime(
                  integrations.reduce((sum, i) => sum + i.responseTime, 0) /
                    (integrations.length || 1),
                )}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Active Alerts
              </Typography>
              <Typography
                variant="h6"
                color={criticalAlerts > 0 ? 'error.main' : 'text.primary'}
              >
                {criticalAlerts}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Integration Status Grid */}
      <Grid container spacing={2}>
        {integrations.map(integration => {
          const statusInfo = getStatusIndicator(integration.status);
          const trend = getPerformanceTrend(integration.id);

          return (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={integration.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                  },
                  border: integration.status === 'offline' ? 2 : 1,
                  borderColor:
                    integration.status === 'offline' ? 'error.main' : 'divider',
                }}
                onClick={() => handleIntegrationClick(integration)}
              >
                <CardContent sx={{ p: 2 }}>
                  {/* Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar
                      src={integration.icon}
                      sx={{ width: 32, height: 32, mr: 1 }}
                    >
                      <NetworkCheckIcon />
                    </Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography
                        variant="subtitle2"
                        noWrap
                        title={integration.name}
                      >
                        {integration.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {integration.category}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={statusInfo.label}
                      color={statusInfo.color as any}
                      icon={statusInfo.icon}
                      sx={{ minWidth: 0 }}
                    />
                  </Box>

                  {/* Metrics */}
                  <Box sx={{ mb: 1 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 0.5,
                      }}
                    >
                      <Typography variant="caption">Uptime</Typography>
                      <Typography variant="caption" fontWeight="bold">
                        {formatUptime(integration.uptime)}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={integration.uptime}
                      sx={{ height: 4, borderRadius: 2 }}
                      color={
                        integration.uptime > 99
                          ? 'success'
                          : integration.uptime > 95
                            ? 'warning'
                            : 'error'
                      }
                    />
                  </Box>

                  {/* Performance Indicators */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Response
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {formatResponseTime(integration.responseTime)}
                      </Typography>
                    </Box>

                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Throughput
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {integration.throughput}/min
                      </Typography>
                    </Box>

                    <Box sx={{ textAlign: 'right' }}>
                      <Tooltip title={`Performance trend: ${trend}`}>
                        {trend === 'improving' ? (
                          <TrendingUpIcon color="success" fontSize="small" />
                        ) : trend === 'declining' ? (
                          <TrendingDownIcon color="error" fontSize="small" />
                        ) : (
                          <TimelineIcon color="action" fontSize="small" />
                        )}
                      </Tooltip>
                    </Box>
                  </Box>

                  {/* Error/Warning Indicators */}
                  {(integration.errorCount > 0 ||
                    integration.warningCount > 0) && (
                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                      {integration.errorCount > 0 && (
                        <Chip
                          size="small"
                          label={`${integration.errorCount} errors`}
                          color="error"
                          variant="outlined"
                        />
                      )}
                      {integration.warningCount > 0 && (
                        <Chip
                          size="small"
                          label={`${integration.warningCount} warnings`}
                          color="warning"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Integration Detail Dialog */}
      <Dialog
        open={Boolean(selectedIntegration)}
        onClose={() => setSelectedIntegration(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedIntegration && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar src={selectedIntegration.icon}>
                  <NetworkCheckIcon />
                </Avatar>
                {selectedIntegration.name}
                <Chip
                  size="small"
                  label={getStatusIndicator(selectedIntegration.status).label}
                  color={
                    getStatusIndicator(selectedIntegration.status).color as any
                  }
                  icon={getStatusIndicator(selectedIntegration.status).icon}
                />
              </Box>
            </DialogTitle>

            <DialogContent>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Details
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell>Status</TableCell>
                          <TableCell>
                            {
                              getStatusIndicator(selectedIntegration.status)
                                .label
                            }
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Uptime</TableCell>
                          <TableCell>
                            {formatUptime(selectedIntegration.uptime)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Response Time</TableCell>
                          <TableCell>
                            {formatResponseTime(
                              selectedIntegration.responseTime,
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Throughput</TableCell>
                          <TableCell>
                            {selectedIntegration.throughput} req/min
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Last Check</TableCell>
                          <TableCell>
                            {selectedIntegration.lastCheck.toLocaleString()}
                          </TableCell>
                        </TableRow>
                        {selectedIntegration.version && (
                          <TableRow>
                            <TableCell>Version</TableCell>
                            <TableCell>{selectedIntegration.version}</TableCell>
                          </TableRow>
                        )}
                        {selectedIntegration.endpoint && (
                          <TableRow>
                            <TableCell>Endpoint</TableCell>
                            <TableCell sx={{ wordBreak: 'break-all' }}>
                              {selectedIntegration.endpoint}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Recent Alerts
                  </Typography>
                  <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                    {selectedIntegration.alerts?.length > 0 ? (
                      selectedIntegration.alerts.map(alert => (
                        <Alert
                          key={alert.id}
                          severity={alert.severity}
                          sx={{ mb: 1 }}
                          action={
                            !alert.acknowledged && (
                              <Button
                                size="small"
                                onClick={() => acknowledgeAlert(alert.id)}
                              >
                                Acknowledge
                              </Button>
                            )
                          }
                        >
                          <Typography variant="body2">
                            {alert.message}
                          </Typography>
                          <Typography variant="caption" display="block">
                            {alert.timestamp.toLocaleString()}
                          </Typography>
                        </Alert>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No recent alerts
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions>
              <Button onClick={() => setSelectedIntegration(null)}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Alerts Dialog */}
      <Dialog
        open={showAlerts}
        onClose={() => setShowAlerts(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>System Alerts</DialogTitle>
        <DialogContent>
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {alerts.length > 0 ? (
              alerts.map(alert => (
                <Alert
                  key={alert.id}
                  severity={alert.severity}
                  sx={{ mb: 1 }}
                  action={
                    !alert.acknowledged && (
                      <Button
                        size="small"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        Acknowledge
                      </Button>
                    )
                  }
                >
                  <Typography variant="body2">{alert.message}</Typography>
                  <Typography variant="caption" display="block">
                    {alert.timestamp.toLocaleString()}
                  </Typography>
                </Alert>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No system alerts
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAlerts(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={Boolean(snackbarMessage)}
        onClose={() => setSnackbarMessage('')}
        message={snackbarMessage}
        autoHideDuration={6000}
      />
    </Box>
  );
};

export default StatusMonitorGrid;
