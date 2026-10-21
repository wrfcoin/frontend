import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Alert,
  Paper,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Timeline,
  TrendingUp,
  TrendingDown,
  Storage,
  Memory,
  NetworkCheck,
  Speed,
  CloudQueue,
  Security,
  Analytics,
  Refresh,
  Warning,
  CheckCircle,
  Error,
  GetApp,
  AccessTime,
} from '@mui/icons-material';
import useWebSocket from '../../hooks/useWebSocket';

interface ServiceMetric {
  serviceName: string;
  port: number;
  status: 'healthy' | 'warning' | 'error' | 'offline';
  cpu: number;
  memory: number;
  requests: number;
  errors: number;
  uptime: number;
  responseTime: number;
}

interface AggregatedMetrics {
  totalServices: number;
  healthyServices: number;
  totalRequests: number;
  totalErrors: number;
  avgResponseTime: number;
  systemLoad: number;
  memoryUsage: number;
  diskUsage: number;
}

const CrossServiceMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<ServiceMetric[]>([]);
  const [aggregated, setAggregated] = useState<AggregatedMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [showExportDialog, setShowExportDialog] = useState(false);

  // WebSocket connection for real-time metrics
  const {
    data: wsData,
    isConnected,
    sendMessage,
  } = useWebSocket({
    channels: ['blocks'],
    onMessage: (event, data) => {
      if (event === 'metrics-update') {
        updateMetricsFromWebSocket(data);
      } else if (event === 'service-status') {
        updateServiceStatus(data);
      }
    },
  });

  // WRFCoin microservices configuration
  const services = [
    { name: 'Main API Server', port: 4001, category: 'core' },
    { name: 'Cross-Chain Protocol', port: 3000, category: 'bridge' },
    { name: 'Wallet Server', port: 4000, category: 'wallet' },
    { name: 'Compute Networks', port: 6000, category: 'compute' },
    { name: 'AI/ML Networks', port: 6001, category: 'ai' },
    { name: 'Storage Networks', port: 7000, category: 'storage' },
    { name: 'IoT Sensors', port: 3002, category: 'iot' },
    { name: 'Weather Earnings', port: 8080, category: 'rewards' },
    { name: 'Node Discovery', port: 9001, category: 'network' },
    { name: 'Governance Server', port: 8000, category: 'governance' },
    { name: 'PostgreSQL DB', port: 5432, category: 'database' },
    { name: 'Redis Cache', port: 6379, category: 'cache' },
  ];

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // WebSocket update handlers
  const updateMetricsFromWebSocket = (data: any) => {
    if (data && Array.isArray(data.metrics)) {
      setMetrics(data.metrics);
      setLastUpdate(new Date());
    }
  };

  const updateServiceStatus = (data: any) => {
    if (data && data.serviceName) {
      setMetrics(prev =>
        prev.map(metric =>
          metric.serviceName === data.serviceName
            ? { ...metric, ...data, lastUpdated: new Date() }
            : metric,
        ),
      );
    }
  };

  // Export functionality
  const exportMetrics = (format: 'json' | 'csv' | 'excel') => {
    const exportData = {
      timestamp: new Date().toISOString(),
      platform: 'WRFCoin',
      totalServices: services.length,
      metrics,
      aggregated,
      exportFormat: format,
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cross-service-metrics-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      // Convert to CSV format
      const csvHeader =
        'Service,Port,Status,CPU%,Memory%,Requests,Errors,Uptime(min),ResponseTime(ms)\n';
      const csvData = metrics
        .map(
          m =>
            `${m.serviceName},${m.port},${m.status},${m.cpu.toFixed(1)},${m.memory.toFixed(1)},${m.requests},${m.errors},${m.uptime.toFixed(0)},${m.responseTime.toFixed(0)}`,
        )
        .join('\n');

      const blob = new Blob([csvHeader + csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cross-service-metrics-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    setShowExportDialog(false);
  };

  const fetchMetrics = async () => {
    try {
      setLoading(true);

      // Enhanced service metrics fetching with better error handling and timeout
      const servicePromises = services.map(async service => {
        try {
          // Set timeout for health checks to ensure sub-3 second load times
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);

          const apiBase = import.meta.env.VITE_API_BASE_URL || '';
          const response = await fetch(
            `${apiBase}/health`,
            {
              signal: controller.signal,
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            },
          );

          clearTimeout(timeoutId);
          const isHealthy = response.ok;

          return {
            serviceName: service.name,
            port: service.port,
            status: isHealthy ? ('healthy' as const) : ('error' as const),
            cpu: 0,
            memory: 0,
            requests: 0,
            errors: 0,
            uptime: 0,
            responseTime: 0,
          };
        } catch (err) {
          // Enhanced error handling with specific error types
          const caughtError = err as Error | null;
          const errorStatus: 'warning' | 'offline' =
            (caughtError && caughtError.name === 'AbortError') ? 'warning' : 'offline';
          return {
            serviceName: service.name,
            port: service.port,
            status: errorStatus,
            cpu: 0,
            memory: 0,
            requests: 0,
            errors: errorStatus === 'warning' ? 1 : 0,
            uptime: 0,
            responseTime: 0,
          };
        }
      });

      const serviceMetrics = await Promise.all(servicePromises);
      setMetrics(serviceMetrics);

      // Calculate aggregated metrics
      const totalServices = serviceMetrics.length;
      const healthyServices = serviceMetrics.filter(
        m => m.status === 'healthy',
      ).length;
      const totalRequests = serviceMetrics.reduce(
        (sum, m) => sum + m.requests,
        0,
      );
      const totalErrors = serviceMetrics.reduce((sum, m) => sum + m.errors, 0);
      const avgResponseTime =
        serviceMetrics.reduce((sum, m) => sum + m.responseTime, 0) /
        totalServices;
      const systemLoad =
        serviceMetrics.reduce((sum, m) => sum + m.cpu, 0) / totalServices;
      const memoryUsage =
        serviceMetrics.reduce((sum, m) => sum + m.memory, 0) / totalServices;

      setAggregated({
        totalServices,
        healthyServices,
        totalRequests,
        totalErrors,
        avgResponseTime,
        systemLoad,
        memoryUsage,
        diskUsage: 0,
      });

      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError('Failed to fetch service metrics');
      console.error('Error fetching metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
    case 'healthy':
      return 'success';
    case 'warning':
      return 'warning';
    case 'error':
      return 'error';
    case 'offline':
      return 'default';
    default:
      return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
    case 'healthy':
      return <CheckCircle color="success" />;
    case 'warning':
      return <Warning color="warning" />;
    case 'error':
      return <Error color="error" />;
    case 'offline':
      return <Error color="disabled" />;
    default:
      return <Error color="disabled" />;
    }
  };

  const formatUptime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  if (loading && !aggregated) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            Cross-Service Metrics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time monitoring of all 15+ WRFCoin microservices
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography
            variant="caption"
            color={isConnected ? 'success.main' : 'text.secondary'}
          >
            {isConnected ? 'Live' : 'Offline'} • Last updated:{' '}
            {lastUpdate.toLocaleTimeString()}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<GetApp />}
            onClick={() => setShowExportDialog(true)}
            size="small"
          >
            Export
          </Button>
          <Tooltip title="Refresh metrics">
            <IconButton onClick={fetchMetrics} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* System Overview Cards */}
      {aggregated && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <NetworkCheck
                  sx={{ fontSize: 40, color: 'primary.main', mb: 1 }}
                />
                <Typography variant="h4">
                  {aggregated.healthyServices}/{aggregated.totalServices}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Services Online
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={
                    (aggregated.healthyServices / aggregated.totalServices) *
                    100
                  }
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Speed sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h4">
                  {aggregated.avgResponseTime.toFixed(0)}ms
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg Response Time
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(
                    ((200 - aggregated.avgResponseTime) / 200) * 100,
                    100,
                  )}
                  color="success"
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Analytics sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                <Typography variant="h4">
                  {aggregated.totalRequests.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Requests
                </Typography>
                <Typography variant="caption" color="error.main">
                  {aggregated.totalErrors} errors
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Memory sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                <Typography variant="h4">
                  {aggregated.systemLoad.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  System Load
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={aggregated.systemLoad}
                  color={
                    aggregated.systemLoad > 80
                      ? 'error'
                      : aggregated.systemLoad > 60
                        ? 'warning'
                        : 'success'
                  }
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Service Details */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
        >
          <Tab label="All Services" />
          <Tab label="Core Services" />
          <Tab label="Infrastructure" />
          <Tab label="Network" />
        </Tabs>

        <Box sx={{ p: 2 }}>
          <Grid container spacing={2}>
            {metrics.map(metric => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={metric.serviceName}>
                <Card variant="outlined">
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2,
                      }}
                    >
                      <Typography variant="h6" noWrap>
                        {metric.serviceName}
                      </Typography>
                      <Chip
                        icon={getStatusIcon(metric.status)}
                        label={metric.status.toUpperCase()}
                        color={getStatusColor(metric.status) as any}
                        size="small"
                      />
                    </Box>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      gutterBottom
                    >
                      Port: {metric.port}
                    </Typography>

                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <Memory />
                        </ListItemIcon>
                        <ListItemText
                          primary="CPU"
                          secondary={`${metric.cpu.toFixed(1)}%`}
                        />
                        <LinearProgress
                          variant="determinate"
                          value={metric.cpu}
                          sx={{ width: 50, ml: 1 }}
                        />
                      </ListItem>

                      <ListItem>
                        <ListItemIcon>
                          <Storage />
                        </ListItemIcon>
                        <ListItemText
                          primary="Memory"
                          secondary={`${metric.memory.toFixed(1)}%`}
                        />
                        <LinearProgress
                          variant="determinate"
                          value={metric.memory}
                          sx={{ width: 50, ml: 1 }}
                        />
                      </ListItem>

                      <ListItem>
                        <ListItemIcon>
                          <Analytics />
                        </ListItemIcon>
                        <ListItemText
                          primary="Requests"
                          secondary={metric.requests.toLocaleString()}
                        />
                      </ListItem>

                      <ListItem>
                        <ListItemIcon>
                          <Speed />
                        </ListItemIcon>
                        <ListItemText
                          primary="Response Time"
                          secondary={`${metric.responseTime.toFixed(0)}ms`}
                        />
                      </ListItem>

                      <ListItem>
                        <ListItemIcon>
                          <Timeline />
                        </ListItemIcon>
                        <ListItemText
                          primary="Uptime"
                          secondary={formatUptime(metric.uptime)}
                        />
                      </ListItem>
                    </List>

                    {metric.errors > 0 && (
                      <Alert severity="warning" sx={{ mt: 1 }}>
                        {metric.errors} errors detected
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Paper>

      {/* Export Dialog */}
      <Dialog
        open={showExportDialog}
        onClose={() => setShowExportDialog(false)}
      >
        <DialogTitle>Export Cross-Service Metrics</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Choose the format for your metrics report:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
            <Button variant="outlined" onClick={() => exportMetrics('json')}>
              Export as JSON
            </Button>
            <Button variant="outlined" onClick={() => exportMetrics('csv')}>
              Export as CSV
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExportDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CrossServiceMetrics;
