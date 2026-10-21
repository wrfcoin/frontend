import React, { useState, useEffect } from 'react';
import { resolveWsUrl } from '../../../utils/wsUrl.js';

import {
  Card,
  CardContent,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Box,
  Chip,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

import { blockchainAPI, miningAPI } from '../../../services/api';
import { formatCurrency, formatDate } from '../../../utils/formatting';
import './MetricCard.css';
import { devLog } from '../../../utils/logger';

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884d8',
  '#82ca9d',
];

const CrossChainRewardsCard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rewardsData, setRewardsData] = useState(null);

  useEffect(() => {
    const fetchRewardsData = async () => {
      try {
        setLoading(true);
        const data = await miningAPI.getCrossChainRewards();
        setRewardsData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching cross-chain rewards:', err);
        setError('Failed to load cross-chain rewards data');
      } finally {
        setLoading(false);
      }
    };

    fetchRewardsData();

    // Set up WebSocket connection for real-time updates
    const wsUrl = resolveWsUrl(import.meta.env.VITE_WEBSOCKET_URL || '');
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      devLog('WebSocket connected for cross-chain rewards updates');
      socket.send(
        JSON.stringify({ type: 'subscribe', channel: 'cross-chain-rewards' }),
      );
    };

    socket.onmessage = event => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'cross-chain-rewards-update') {
          setRewardsData(data.payload);
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    };

    socket.onerror = error => {
      console.error('WebSocket error:', error);
    };

    return () => {
      socket.close();
    };
  }, []);

  if (loading) {
    return (
      <Card className="metric-card">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Cross-Chain Rewards
          </Typography>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="200px"
          >
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="metric-card">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Cross-Chain Rewards
          </Typography>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="200px"
          >
            <Typography color="error">{error}</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Ensure rewardsData has required fields with fallbacks
  const safeRewardsData = {
    totalRewards: rewardsData?.totalRewards || 0,
    totalTransactions: rewardsData?.totalTransactions || 0,
    averageReward: rewardsData?.averageReward || 0,
    bridgeDistribution: rewardsData?.bridgeDistribution || [],
    recentTransactions: rewardsData?.recentTransactions || [],
  };

  return (
    <Card className="metric-card" style={{ width: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Cross-Chain Rewards
        </Typography>

        <Box display="flex" justifyContent="space-between" mb={2}>
          <Box>
            <Typography variant="body2" color="textSecondary">
              Total Rewards
            </Typography>
            <Typography variant="h5">
              {formatCurrency(safeRewardsData.totalRewards)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="textSecondary">
              Transactions
            </Typography>
            <Typography variant="h5">
              {safeRewardsData.totalTransactions}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="textSecondary">
              Avg Reward
            </Typography>
            <Typography variant="h5">
              {formatCurrency(safeRewardsData.averageReward)}
            </Typography>
          </Box>
        </Box>

        <Divider style={{ margin: '16px 0' }} />

        <Typography variant="subtitle1" gutterBottom>
          Bridge Distribution
        </Typography>

        {/* Distribution Cards */}
        <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
          {safeRewardsData.bridgeDistribution.slice(0, 3).map((item, index) => {
            const percent =
              safeRewardsData.totalRewards > 0
                ? ((item.amount / safeRewardsData.totalRewards) * 100).toFixed(
                  1,
                )
                : '0.0';
            return (
              <Box
                key={item.bridge || `bridge-${index}`}
                flex="1 1 30%"
                border="1px solid #eee"
                borderRadius="5px"
                padding="10px"
                textAlign="center"
              >
                <Typography variant="body2">{item.bridge}</Typography>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  color={COLORS[index % COLORS.length] || '#666'}
                >
                  {formatCurrency(item.amount)}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {percent}% of total
                </Typography>
              </Box>
            );
          })}
        </Box>

        {safeRewardsData.bridgeDistribution.length > 0 && (
          <Box height={180} mb={3}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={safeRewardsData.bridgeDistribution}
                  dataKey="amount"
                  nameKey="bridge"
                  cx="50%"
                  cy="50%"
                  outerRadius={65}
                  fill="#8884d8"
                >
                  {safeRewardsData.bridgeDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={value => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        )}

        <Typography variant="subtitle1" gutterBottom>
          Recent Transactions
        </Typography>
        <List disablePadding>
          {safeRewardsData.recentTransactions.slice(0, 3).map((tx, index) => (
            <ListItem
              key={tx.id || `tx-${index}`}
              disablePadding
              sx={{ mb: 1 }}
            >
              <ListItemText
                primary={
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">
                      {tx.sourceNetwork} → {tx.destinationNetwork}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(tx.reward)}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="caption" color="textSecondary">
                      {formatDate(tx.timestamp, true)}
                    </Typography>
                    <Typography
                      variant="caption"
                      component="span"
                      sx={{
                        backgroundColor: '#f0f0f0',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.625rem',
                      }}
                    >
                      {tx.bridge}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
          {safeRewardsData.recentTransactions.length === 0 && (
            <ListItem disablePadding>
              <ListItemText
                primary={
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    textAlign="center"
                  >
                    No recent transactions available
                  </Typography>
                }
              />
            </ListItem>
          )}
        </List>
      </CardContent>
    </Card>
  );
};

export default CrossChainRewardsCard;
