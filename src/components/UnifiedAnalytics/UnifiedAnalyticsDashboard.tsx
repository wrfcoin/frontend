import DemoSurfaceGate from '../common/DemoSurfaceGate';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Tabs,
  Tab,
  Paper,
  Button,
  Alert,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import {
  Analytics,
  Speed,
  AttachMoney,
  Psychology,
  Refresh,
  GetApp,
  Settings,
  Dashboard,
  TrendingUp,
  CheckCircle,
  Warning,
} from '@mui/icons-material';

import CrossServiceMetrics from './CrossServiceMetrics';
import PerformanceOptimizer from './PerformanceOptimizer';
import { WrfCapabilityReadinessBadge } from '../DesignSystem';
import CostAnalysisDashboard from './CostAnalysisDashboard';
import PredictiveAnalytics from './PredictiveAnalytics';
import useWebSocket from '../../hooks/useWebSocket';

interface DashboardSummary {
  totalServices: number;
  healthyServices: number;
  totalCost: number;
  projectedSavings: number;
  avgPerformance: number;
  activePredictions: number;
  lastUpdate: Date;
}

interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  action?: string;
}

const UnifiedAnalyticsDashboardSample: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // WebSocket connection for unified dashboard updates
  const {
    data: wsData,
    isConnected,
    sendMessage,
  } = useWebSocket({
    channels: ['blocks', 'governance'],
    onMessage: (event, data) => {
      if (event === 'dashboard-summary') {
        updateDashboardSummary(data);
      } else if (event === 'system-alert') {
        addSystemAlert(data);
      } else if (event === 'bulk-update') {
        handleBulkUpdate(data);
      }
    },
  });

  useEffect(() => {
    initializeDashboard();
    if (autoRefresh) {
      const interval = setInterval(refreshDashboard, 30000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [autoRefresh]);

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      await loadDashboardSummary();
      await loadSystemAlerts();
    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
      addSystemAlert({
        type: 'error',
        title: 'Dashboard Error',
        message: 'Failed to load dashboard data',
        timestamp: new Date(),
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardSummary = async () => {
    // Summary is populated from live WebSocket events (dashboard-summary channel).
    // No synthetic data — summary stays null until the backend pushes real values.
  };

  const loadSystemAlerts = async () => {
    // Alerts are populated from live WebSocket events (system-alert channel).
    // No synthetic alerts — alerts stay empty until the backend pushes real ones.
  };

  const updateDashboardSummary = (data: any) => {
    if (data) {
      setSummary(prev => ({ ...prev, ...data, lastUpdate: new Date() }));
    }
  };

  const addSystemAlert = (alert: Omit<SystemAlert, 'id'>) => {
    const newAlert: SystemAlert = {
      ...alert,
      id: Date.now().toString(),
    };
    setAlerts(prev => [newAlert, ...prev.slice(0, 9)]); // Keep only last 10 alerts
  };

  const handleBulkUpdate = (data: any) => {
    if (data.summary) updateDashboardSummary(data.summary);
    if (data.alerts) setAlerts(data.alerts);
  };

  const refreshDashboard = async () => {
    if (isConnected) {
      sendMessage('refresh-dashboard', { timestamp: new Date().toISOString() });
    }
    await loadDashboardSummary();
  };

  const exportUnifiedReport = async () => {
    const unifiedData = {
      summary,
      alerts,
      timestamp: new Date().toISOString(),
      platform: 'WRFCoin',
      version: '3.0',
      components: [
        'CrossServiceMetrics',
        'PerformanceOptimizer',
        'CostAnalysis',
        'PredictiveAnalytics',
      ],
    };

    const blob = new Blob([JSON.stringify(unifiedData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unified-analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportDialog(false);
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
    case 'error':
      return <Warning color="error" />;
    case 'warning':
      return <Warning color="warning" />;
    case 'success':
      return <CheckCircle color="success" />;
    default:
      return <Analytics color="info" />;
    }
  };

  const tabs = [
    { label: 'Service Metrics', icon: <Analytics /> },
    { label: 'Performance', icon: <Speed /> },
    { label: 'Cost Analysis', icon: <AttachMoney /> },
    { label: 'Predictions', icon: <Psychology /> },
  ];

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <LinearProgress sx={{ width: '50%' }} />
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h3" gutterBottom sx={{ mb: 0 }}>
              <Dashboard
                sx={{ mr: 1, verticalAlign: 'middle', fontSize: 'inherit' }}
              />
              Unified Analytics
            </Typography>
            <WrfCapabilityReadinessBadge featureName="analytics" compact />
          </Box>
          <Typography variant="body1" color="text.secondary">
            Comprehensive analytics across all WRFCoin microservices
          </Typography>
          <Typography
            variant="caption"
            color={isConnected ? 'success.main' : 'error.main'}
          >
            Real-time data: {isConnected ? 'Connected' : 'Disconnected'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<GetApp />}
            onClick={() => setShowExportDialog(true)}
          >
            Export All
          </Button>
          <Tooltip title="Refresh all data">
            <IconButton onClick={refreshDashboard} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Dashboard Summary Cards */}
      {summary && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary.main">
                  {summary.healthyServices}/{summary.totalServices}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Services Online
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={
                    (summary.healthyServices / summary.totalServices) * 100
                  }
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  {summary.avgPerformance.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg Performance
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={summary.avgPerformance}
                  color="info"
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="error.main">
                  ${summary.totalCost.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Cost/Month
                </Typography>
                <Typography variant="caption" color="success.main">
                  -
                  {(
                    (summary.projectedSavings / summary.totalCost) *
                    100
                  ).toFixed(1)}
                  % potential
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  ${summary.projectedSavings.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Potential Savings
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {summary.activePredictions}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Predictions
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  Last Update
                </Typography>
                <Typography variant="body2">
                  {summary.lastUpdate.toLocaleTimeString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* System Alerts */}
      {alerts.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            System Alerts
          </Typography>
          <Grid container spacing={1}>
            {alerts.slice(0, 3).map(alert => (
              <Grid size={{ xs: 12, md: 4 }} key={alert.id}>
                <Alert
                  severity={alert.type}
                  onClose={() => dismissAlert(alert.id)}
                  action={
                    alert.action && (
                      <Button size="small" color="inherit">
                        {alert.action}
                      </Button>
                    )
                  }
                >
                  <Typography variant="subtitle2">{alert.title}</Typography>
                  <Typography variant="body2">{alert.message}</Typography>
                </Alert>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Main Analytics Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
        >
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>

        <Box sx={{ mt: 2 }}>
          {activeTab === 0 && <CrossServiceMetrics />}
          {activeTab === 1 && <PerformanceOptimizer />}
          {activeTab === 2 && <CostAnalysisDashboard />}
          {activeTab === 3 && <PredictiveAnalytics />}
        </Box>
      </Paper>

      {/* Export Dialog */}
      <Dialog
        open={showExportDialog}
        onClose={() => setShowExportDialog(false)}
      >
        <DialogTitle>Export Unified Analytics Report</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Export comprehensive analytics data from all components
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            This will include metrics from all analytics components, system
            alerts, and performance data.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExportDialog(false)}>Cancel</Button>
          <Button onClick={exportUnifiedReport} variant="contained">
            Export JSON
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const UnifiedAnalyticsDashboard: React.FC<React.ComponentProps<typeof UnifiedAnalyticsDashboardSample>> = (props) => (
  <DemoSurfaceGate
    testId="unified-analytics"
    title="Unified analytics is not live on this testnet"
    description="This preview contains illustrative data or simulated actions, not verified testnet results."
  >
    <UnifiedAnalyticsDashboardSample {...props} />
  </DemoSurfaceGate>
);

export default UnifiedAnalyticsDashboard;
