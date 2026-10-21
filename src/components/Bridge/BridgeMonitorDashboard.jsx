/**
 * Bridge Monitoring Dashboard
 * Real-time monitoring for cross-chain bridge operations
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Sync as Bridge, // Bridge icon doesn't exist in MUI, using Sync
  Security,
  Speed,
  NetworkCheck,
  Warning,
  CheckCircle,
  Error,
  Refresh,
  Visibility,
  TrendingUp,
  TrendingDown,
  SwapHoriz,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

const BridgeMonitorDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [bridges, setBridges] = useState([]);
  const [validators, setValidators] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBridge, setSelectedBridge] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchMonitoringData();
    const interval = setInterval(fetchMonitoringData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMonitoringData = async () => {
    try {
      const [overviewRes, bridgesRes, validatorsRes, alertsRes] =
        await Promise.all([
          fetch('/api/bridge/monitor/overview'),
          fetch('/api/bridge/monitor/bridges'),
          fetch('/api/bridge/monitor/validators'),
          fetch('/api/bridge/monitor/alerts?limit=10'),
        ]);

      if (overviewRes.ok) {
        const overviewData = await overviewRes.json();
        setOverview(overviewData.data);
      }

      if (bridgesRes.ok) {
        const bridgesData = await bridgesRes.json();
        setBridges(bridgesData.data || []);
      }

      if (validatorsRes.ok) {
        const validatorsData = await validatorsRes.json();
        setValidators(validatorsData.data || []);
      }

      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(alertsData.data || []);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
      setLoading(false);
    }
  };

  const getStatusColor = status => {
    switch (status) {
    case 'active':
    case 'online':
    case 'healthy':
      return 'success';
    case 'degraded':
    case 'warning':
      return 'warning';
    case 'inactive':
    case 'offline':
    case 'critical':
      return 'error';
    default:
      return 'default';
    }
  };

  const getSeverityColor = severity => {
    switch (severity) {
    case 'critical':
      return 'error';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    case 'low':
      return 'success';
    default:
      return 'default';
    }
  };

  const formatDuration = milliseconds => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatNumber = num => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (loading || !overview) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <Typography>Loading bridge monitoring data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4">Bridge Monitor Dashboard</Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchMonitoringData}
        >
          Refresh
        </Button>
      </Box>

      {/* Network Health Alert */}
      {overview.networkHealth !== 'healthy' && (
        <Alert
          severity={overview.networkHealth === 'critical' ? 'error' : 'warning'}
          sx={{ mb: 3 }}
        >
          Network health is {overview.networkHealth}.{' '}
          {overview.networkHealth === 'critical'
            ? 'Multiple bridges may be experiencing issues.'
            : 'Some bridges may have reduced performance.'}
        </Alert>
      )}

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Bridge color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{overview.bridgeCount}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Active Bridges
                  </Typography>
                  <Typography
                    variant="caption"
                    color={
                      overview.activeBridges === overview.bridgeCount
                        ? 'success.main'
                        : 'warning.main'
                    }
                  >
                    {overview.activeBridges} operational
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Security color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">
                    {overview.validatorCount}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Validators
                  </Typography>
                  <Typography
                    variant="caption"
                    color={
                      overview.onlineValidators === overview.validatorCount
                        ? 'success.main'
                        : 'warning.main'
                    }
                  >
                    {overview.onlineValidators} online
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <SwapHoriz color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">
                    {formatNumber(overview.totalTransactions)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Transactions
                  </Typography>
                  <Typography variant="caption" color="success.main">
                    {(
                      (overview.successfulTransactions /
                        overview.totalTransactions) *
                      100
                    ).toFixed(1)}
                    % success rate
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Speed color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">
                    {formatDuration(overview.averageProcessingTime)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Avg Processing Time
                  </Typography>
                  <Typography
                    variant="caption"
                    color={
                      overview.averageProcessingTime < 120000
                        ? 'success.main'
                        : 'warning.main'
                    }
                  >
                    {overview.averageProcessingTime < 120000 ? 'Good' : 'Slow'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Bridges Status */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Bridge Status
              </Typography>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Bridge</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Transactions</TableCell>
                      <TableCell>Failure Rate</TableCell>
                      <TableCell>Last Activity</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bridges.map(bridge => (
                      <TableRow key={bridge.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2">
                              {bridge.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {bridge.sourceChain} → {bridge.targetChain}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={bridge.status}
                            color={getStatusColor(bridge.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatNumber(bridge.transactionCount)}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            ${parseFloat(bridge.volume).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ width: 80 }}>
                            <LinearProgress
                              variant="determinate"
                              value={parseFloat(bridge.failureRate)}
                              color={
                                parseFloat(bridge.failureRate) < 5
                                  ? 'success'
                                  : 'error'
                              }
                            />
                            <Typography variant="caption">
                              {bridge.failureRate}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {formatDuration(
                              Date.now() - bridge.lastTransaction,
                            )}{' '}
                            ago
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedBridge(bridge);
                              setDetailsOpen(true);
                            }}
                          >
                            <Visibility />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Alerts & Validators */}
        <Grid item xs={12} lg={4}>
          {/* Recent Alerts */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Alerts
                <Badge
                  badgeContent={alerts.length}
                  color="error"
                  sx={{ ml: 2 }}
                />
              </Typography>

              <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                {alerts.length === 0 ? (
                  <Typography variant="body2" color="textSecondary">
                    No recent alerts
                  </Typography>
                ) : (
                  alerts.map((alert, index) => (
                    <Box
                      key={index}
                      sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}
                    >
                      <Box display="flex" alignItems="center" mb={0.5}>
                        <Chip
                          label={alert.severity}
                          color={getSeverityColor(alert.severity)}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        <Typography variant="caption" color="textSecondary">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </Typography>
                      </Box>
                      <Typography variant="body2">{alert.message}</Typography>
                    </Box>
                  ))
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Validator Status */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Validator Status
              </Typography>

              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {validators.map(validator => (
                  <Box
                    key={validator.id}
                    sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}
                  >
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Box>
                        <Typography variant="subtitle2">
                          {validator.id}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {validator.address.slice(0, 10)}...
                        </Typography>
                      </Box>
                      <Box textAlign="right">
                        <Chip
                          label={validator.status}
                          color={getStatusColor(validator.status)}
                          size="small"
                        />
                        <Typography variant="caption" display="block">
                          {validator.uptimePercentage}% uptime
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bridge Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Bridge Details: {selectedBridge?.name}</DialogTitle>
        <DialogContent>
          {selectedBridge && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Bridge Information
                </Typography>
                <Typography variant="body2">
                  <strong>Source Chain:</strong> {selectedBridge.sourceChain}
                </Typography>
                <Typography variant="body2">
                  <strong>Target Chain:</strong> {selectedBridge.targetChain}
                </Typography>
                <Typography variant="body2">
                  <strong>Status:</strong> {selectedBridge.status}
                </Typography>
                <Typography variant="body2">
                  <strong>Utilization:</strong> {selectedBridge.utilizationRate}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Performance Metrics
                </Typography>
                <Typography variant="body2">
                  <strong>Total Transactions:</strong>{' '}
                  {formatNumber(selectedBridge.transactionCount)}
                </Typography>
                <Typography variant="body2">
                  <strong>Volume:</strong> $
                  {parseFloat(selectedBridge.volume).toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  <strong>Failure Rate:</strong> {selectedBridge.failureRate}%
                </Typography>
                <Typography variant="body2">
                  <strong>Avg Processing Time:</strong>{' '}
                  {formatDuration(selectedBridge.averageProcessingTime)}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BridgeMonitorDashboard;
