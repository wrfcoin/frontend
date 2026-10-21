import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Divider,
} from '@mui/material';

// Bridge Analytics Component
const BridgeAnalytics = () => {
  // Mock data for analytics
  const analyticsData = {
    totalTransactions: 827,
    totalVolume: 2845983.25,
    activeUsers: 314,
    chains: [
      {
        name: 'WRFCOIN',
        inflow: 1250463.12,
        outflow: 987253.45,
        transactions: 341,
      },
      {
        name: 'ETHEREUM',
        inflow: 325890.75,
        outflow: 410328.2,
        transactions: 205,
      },
      {
        name: 'POLYGON',
        inflow: 186450.35,
        outflow: 142780.6,
        transactions: 127,
      },
      {
        name: 'BNB CHAIN',
        inflow: 98756.28,
        outflow: 129546.8,
        transactions: 68,
      },
      {
        name: 'AVALANCHE',
        inflow: 78452.35,
        outflow: 92354.75,
        transactions: 45,
      },
      { name: 'SOLANA', inflow: 45672.9, outflow: 98325.65, transactions: 41 },
    ],
    providers: [
      {
        name: 'LayerZero',
        transactions: 312,
        volume: 1245890.58,
        successRate: 0.992,
      },
      {
        name: 'Axelar',
        transactions: 245,
        volume: 876543.25,
        successRate: 0.987,
      },
      {
        name: 'WRF Bridge',
        transactions: 156,
        volume: 456789.12,
        successRate: 0.995,
      },
      {
        name: 'Wormhole',
        transactions: 114,
        volume: 266760.3,
        successRate: 0.978,
      },
    ],
    assets: [
      { name: 'WRF', volume: 1750432.25, percentage: 61.5 },
      { name: 'ETH', volume: 425890.35, percentage: 15.0 },
      { name: 'MATIC', volume: 210754.25, percentage: 7.4 },
      { name: 'AVAX', volume: 156432.2, percentage: 5.5 },
      { name: 'BNB', volume: 123654.8, percentage: 4.3 },
      { name: 'SOL', volume: 98765.4, percentage: 3.5 },
      { name: 'USDT', volume: 80054.0, percentage: 2.8 },
    ],
    timeData: [
      { date: '2025-05-12', volume: 354256.82, transactions: 102 },
      { date: '2025-05-13', volume: 298745.63, transactions: 95 },
      { date: '2025-05-14', volume: 412358.92, transactions: 121 },
      { date: '2025-05-15', volume: 387652.41, transactions: 114 },
      { date: '2025-05-16', volume: 456321.75, transactions: 132 },
      { date: '2025-05-17', volume: 502987.36, transactions: 143 },
      { date: '2025-05-18', volume: 433660.36, transactions: 120 },
    ],
  };

  // Format large numbers
  const formatNumber = number => {
    return new Intl.NumberFormat('en-US').format(number);
  };

  // Format currency
  const formatCurrency = number => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(number);
  };

  // Format percentage
  const formatPercentage = number => {
    return `${number.toFixed(1)}%`;
  };

  return (
    <Box sx={{ width: '100%', p: 0 }}>
      {/* Summary Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Total Transactions
              </Typography>
              <Typography
                variant="h3"
                component="div"
                sx={{ fontWeight: 'medium' }}
              >
                {formatNumber(analyticsData.totalTransactions)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last 30 days
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Total Volume
              </Typography>
              <Typography
                variant="h3"
                component="div"
                sx={{ fontWeight: 'medium' }}
              >
                {formatCurrency(analyticsData.totalVolume)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                USD equivalent
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Active Users
              </Typography>
              <Typography
                variant="h3"
                component="div"
                sx={{ fontWeight: 'medium' }}
              >
                {formatNumber(analyticsData.activeUsers)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Unique addresses
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Chain Distribution */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Chain Distribution
        </Typography>

        <Grid container spacing={2}>
          {analyticsData.chains.map(chain => (
            <Grid item xs={12} sm={6} md={4} key={chain.name}>
              <Box sx={{ mb: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Typography variant="body1" fontWeight="medium">
                    {chain.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {chain.transactions} txs
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Box sx={{ width: '60px', mr: 1 }}>
                    <Typography variant="caption" color="success.main">
                      Inflow
                    </Typography>
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={
                        (chain.inflow / (analyticsData.totalVolume / 2)) * 100
                      }
                      color="success"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  <Box sx={{ ml: 1, minWidth: '80px', textAlign: 'right' }}>
                    <Typography variant="body2">
                      {formatCurrency(chain.inflow)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: '60px', mr: 1 }}>
                    <Typography variant="caption" color="error.main">
                      Outflow
                    </Typography>
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={
                        (chain.outflow / (analyticsData.totalVolume / 2)) * 100
                      }
                      color="error"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  <Box sx={{ ml: 1, minWidth: '80px', textAlign: 'right' }}>
                    <Typography variant="body2">
                      {formatCurrency(chain.outflow)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Bridge Providers */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Bridge Providers
        </Typography>

        <Grid container spacing={3}>
          {analyticsData.providers.map(provider => (
            <Grid item xs={12} sm={6} md={3} key={provider.name}>
              <Card
                sx={{ height: '100%', border: '1px solid rgba(0,0,0,0.05)' }}
              >
                <CardContent>
                  <Typography variant="h6" fontWeight="medium" gutterBottom>
                    {provider.name}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Transactions
                    </Typography>
                    <Typography variant="h5">
                      {formatNumber(provider.transactions)}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Volume
                    </Typography>
                    <Typography variant="h5">
                      {formatCurrency(provider.volume)}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Success Rate
                    </Typography>
                    <Typography
                      variant="h5"
                      color={
                        provider.successRate > 0.99
                          ? 'success.main'
                          : 'primary.main'
                      }
                    >
                      {(provider.successRate * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Asset Distribution */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Asset Distribution
        </Typography>

        {analyticsData.assets.map(asset => (
          <Box key={asset.name} sx={{ mb: 2 }}>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}
            >
              <Typography variant="body2" fontWeight="medium">
                {asset.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatCurrency(asset.volume)} (
                {formatPercentage(asset.percentage)})
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={asset.percentage}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'rgba(0,0,0,0.05)',
              }}
            />
          </Box>
        ))}
      </Paper>

      {/* Weekly Trend */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Weekly Activity
        </Typography>

        <Grid container spacing={3}>
          {analyticsData.timeData.map(day => {
            const date = new Date(day.date);
            const dayName = date.toLocaleDateString('en-US', {
              weekday: 'short',
            });
            const dayNumber = date.getDate();

            return (
              <Grid item xs={12} sm={6} md={3} lg={12 / 7} key={day.date}>
                <Card
                  sx={{
                    height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.02)',
                    border: '1px solid rgba(0,0,0,0.05)',
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" align="center" gutterBottom>
                      {dayName}
                    </Typography>
                    <Typography
                      variant="body2"
                      align="center"
                      color="text.secondary"
                      gutterBottom
                    >
                      May {dayNumber}
                    </Typography>

                    <Divider sx={{ my: 1 }} />

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                      align="center"
                    >
                      Volume
                    </Typography>
                    <Typography
                      variant="h6"
                      align="center"
                      fontWeight="medium"
                      gutterBottom
                    >
                      {formatCurrency(day.volume)}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                      align="center"
                    >
                      Transactions
                    </Typography>
                    <Typography variant="h6" align="center">
                      {day.transactions}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Paper>
    </Box>
  );
};

export default BridgeAnalytics;
