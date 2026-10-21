/**
 * Real-Time Bridge Status Component
 * Displays live status, fees, and performance metrics for bridge protocols
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Grid,
  Tooltip,
  IconButton,
  Badge,
  Avatar,
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  Error,
  Speed,
  Security,
  TrendingUp,
  TrendingDown,
  Refresh,
  AccessTime,
  MonetizationOn,
  NetworkCheck,
} from '@mui/icons-material';
import bridgeStatusService from '../../services/bridgeStatusService';

const RealTimeBridgeStatus = ({ bridge, compact = false, onClick }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    // Initialize bridge status service
    const initializeService = async () => {
      if (!bridgeStatusService.isConnected) {
        await bridgeStatusService.connect();
      }

      // Get initial status
      const initialStatus = bridgeStatusService.getBridgeStatus(bridge.id);
      setStatus(initialStatus);
      setLoading(false);
      setLastUpdate(new Date());
    };

    initializeService();

    // Subscribe to real-time updates
    const unsubscribe = bridgeStatusService.subscribe((bridgeId, newStatus) => {
      if (bridgeId === bridge.id || bridgeId === 'all') {
        setStatus(bridgeStatusService.getBridgeStatus(bridge.id));
        setLastUpdate(new Date());
      }
    });

    return () => {
      unsubscribe();
    };
  }, [bridge.id]);

  const getStatusColor = statusType => {
    switch (statusType) {
    case 'active':
      return '#4caf50';
    case 'maintenance':
      return '#ff9800';
    case 'degraded':
      return '#ff5722';
    case 'inactive':
      return '#9e9e9e';
    default:
      return '#9e9e9e';
    }
  };

  const getStatusIcon = statusType => {
    switch (statusType) {
    case 'active':
      return <CheckCircle sx={{ color: '#4caf50' }} />;
    case 'maintenance':
      return <Warning sx={{ color: '#ff9800' }} />;
    case 'degraded':
      return <Error sx={{ color: '#ff5722' }} />;
    case 'inactive':
      return <Error sx={{ color: '#9e9e9e' }} />;
    default:
      return <NetworkCheck sx={{ color: '#9e9e9e' }} />;
    }
  };

  const getUptimeColor = uptime => {
    if (uptime >= 99.5) return '#4caf50';
    if (uptime >= 99.0) return '#ff9800';
    return '#f44336';
  };

  const formatTimeAgo = date => {
    if (!date) return 'Never';
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  if (loading) {
    return (
      <Card
        sx={{
          height: compact ? 80 : 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <LinearProgress sx={{ width: '80%' }} />
      </Card>
    );
  }

  if (compact) {
    return (
      <Card
        sx={{
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.2s ease',
          '&:hover': onClick
            ? { transform: 'translateY(-2px)', boxShadow: 3 }
            : {},
        }}
        onClick={onClick}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box display="flex" alignItems="center" gap={1}>
              {getStatusIcon(status?.status)}
              <Typography variant="body2" fontWeight="bold">
                {bridge.name}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Chip
                label={status?.currentFee || 'fee unavailable'}
                size="small"
                color="primary"
                variant="outlined"
              />
              <Typography variant="caption" color="text.secondary">
                {status?.avgTransactionTime || 'unavailable'}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        border: `2px solid ${getStatusColor(status?.status)}`,
        '&:hover': onClick
          ? {
            transform: 'translateY(-4px)',
            boxShadow: 4,
            borderColor: bridge.color,
          }
          : {},
      }}
      onClick={onClick}
    >
      <CardContent>
        {/* Header with Status */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={2}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar
              sx={{
                bgcolor: bridge.color,
                width: 32,
                height: 32,
                fontSize: '14px',
              }}
            >
              {bridge.name.charAt(0)}
            </Avatar>
            <Box>
              <Typography
                variant="h6"
                fontWeight="bold"
                sx={{ fontSize: '1rem' }}
              >
                {bridge.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {bridge.type}
              </Typography>
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            {getStatusIcon(status?.status)}
            <Badge
              color={status?.isRealTime ? 'success' : 'warning'}
              variant="dot"
            >
              <Tooltip title={`Last updated: ${formatTimeAgo(lastUpdate)}`}>
                <IconButton
                  size="small"
                  onClick={e => {
                    e.stopPropagation();
                    // Refresh status
                    bridgeStatusService.requestBridgeStatus();
                  }}
                >
                  <Refresh fontSize="small" />
                </IconButton>
              </Tooltip>
            </Badge>
          </Box>
        </Box>

        {/* Key Metrics */}
        <Grid container spacing={1} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Uptime
              </Typography>
              <Typography
                variant="body1"
                fontWeight="bold"
                sx={{ color: typeof status?.uptime === 'number' ? getUptimeColor(status.uptime) : 'text.disabled' }}
              >
                {typeof status?.uptime === 'number' ? `${status.uptime.toFixed(1)}%` : 'unavailable'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Fee Rate
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {status?.currentFee || 'unavailable'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Avg Time
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {status?.avgTransactionTime || 'unavailable'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Gas Est.
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {status?.gasEstimate || 'unavailable'}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Performance Indicators */}
        <Box>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={1}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              display="flex"
              alignItems="center"
              gap={0.5}
            >
              <Speed fontSize="small" />
              Throughput
            </Typography>
            <Typography variant="caption" fontWeight="bold">
              {status?.throughput || 'unavailable'}
            </Typography>
          </Box>

          <LinearProgress
            variant="determinate"
            value={Math.min(
              100,
              (parseFloat(status?.throughput?.split(' ')[0] || '0') / 1500) *
                100,
            )}
            sx={{
              height: 4,
              borderRadius: 2,
              backgroundColor: 'rgba(0,0,0,0.1)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: bridge.color,
              },
            }}
          />
        </Box>

        {/* Security Level */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mt={2}
        >
          <Box display="flex" alignItems="center" gap={0.5}>
            <Security fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              Security
            </Typography>
          </Box>
          <Chip
            label={status?.securityLevel || 'unknown'}
            size="small"
            color={
              status?.securityLevel === 'enterprise'
                ? 'success'
                : status?.securityLevel === 'high'
                  ? 'primary'
                  : 'default'
            }
            sx={{ fontSize: '0.7rem', height: 20 }}
          />
        </Box>

        {/* Last Transaction Time */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mt={1}
        >
          <Box display="flex" alignItems="center" gap={0.5}>
            <AccessTime fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              Last Tx
            </Typography>
          </Box>
          <Typography variant="caption" fontWeight="bold">
            {status?.lastTransactionTime || 'unavailable'}
          </Typography>
        </Box>

        {/* Data Freshness Indicator */}
        {!status?.isRealTime && (
          <Box mt={1}>
            <Chip
              label="Demo Data"
              size="small"
              color="warning"
              variant="outlined"
              sx={{ fontSize: '0.65rem', height: 18 }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default RealTimeBridgeStatus;
