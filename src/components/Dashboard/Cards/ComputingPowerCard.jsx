import React from 'react';
import { Card, CardContent, Typography, Box, Divider } from '@mui/material';

const ComputingPowerCard = ({ computingPowerData }) => {
  // Default data if none provided
  const data = computingPowerData || {
    totalPower: 1240,
    distribution: [
      { name: 'Individual Miners', value: 340 },
      { name: 'Mining Pools', value: 620 },
      { name: 'Cloud Miners', value: 280 },
    ],
  };

  // Calculate total value
  const total = data.distribution.reduce((sum, item) => sum + item.value, 0);

  // Colors for different miner types
  const colors = {
    'Individual Miners': '#4CAF50',
    'Mining Pools': '#2196F3',
    'Cloud Miners': '#FF9800',
  };

  // Format computing power display
  const formatComputingPower = value => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(2)} PH/s`;
    } else {
      return `${value.toFixed(0)} TH/s`;
    }
  };

  return (
    <Card className="metric-card">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Computing Power Distribution
        </Typography>

        <Box display="flex" justifyContent="space-between" mb={2}>
          <Box>
            <Typography variant="body2" color="textSecondary">
              Total Power
            </Typography>
            <Typography variant="h5">
              {formatComputingPower(data.totalPower)}
            </Typography>
          </Box>
        </Box>

        <Divider style={{ margin: '16px 0' }} />

        <Typography variant="subtitle1" gutterBottom>
          Miner Distribution
        </Typography>

        {/* Distribution Cards */}
        <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
          {data.distribution.map(item => (
            <Box
              key={item.name}
              flex="1 1 30%"
              border="1px solid #eee"
              borderRadius="5px"
              padding="10px"
              textAlign="center"
            >
              <Typography variant="body2">{item.name}</Typography>
              <Typography
                variant="h6"
                fontWeight="bold"
                color={colors[item.name] || '#666'}
              >
                {formatComputingPower(item.value)}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {Math.round((item.value / total) * 100)}% of network
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ComputingPowerCard;
