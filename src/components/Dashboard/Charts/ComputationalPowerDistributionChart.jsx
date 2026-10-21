import React from 'react';

import { Box, Typography, Paper } from '@mui/material';

import DistributionChart from './DistributionChart';

const ComputationalPowerDistributionChart = ({ data }) => {
  // Default data for computational power distribution
  const defaultCategories = [
    'High Performance',
    'Standard Node',
    'Edge Device',
    'Cloud Instance',
    'Research Cluster',
  ];

  const defaultValues = [168, 220, 84, 125, 51];

  // Colors matching the design pattern of other distribution charts
  const COLORS = [
    'rgba(76, 175, 80, 0.8)', // Green
    'rgba(33, 150, 243, 0.8)', // Blue
    'rgba(255, 152, 0, 0.8)', // Orange
    'rgba(156, 39, 176, 0.8)', // Purple
    'rgba(244, 67, 54, 0.8)', // Red
  ];

  const BORDER_COLORS = [
    'rgba(76, 175, 80, 1)', // Green
    'rgba(33, 150, 243, 1)', // Blue
    'rgba(255, 152, 0, 1)', // Orange
    'rgba(156, 39, 176, 1)', // Purple
    'rgba(244, 67, 54, 1)', // Red
  ];

  // Label positions following the same pattern as the other charts
  const labelPositions = [
    { right: '23%', top: '25%' }, // High Performance
    { left: '15%', top: '35%' }, // Standard Node
    { left: '21%', bottom: '25%' }, // Edge Device
    { right: '24%', bottom: '30%' }, // Cloud Instance
    { right: '27%', bottom: '40%' }, // Research Cluster
  ];

  // Process the data correctly based on its format
  let chartValues = [];
  let categories = [];

  // Handle the case where data is an array of objects with name and value properties
  if (
    data &&
    Array.isArray(data) &&
    data.length > 0 &&
    typeof data[0] === 'object' &&
    'name' in data[0] &&
    'value' in data[0]
  ) {
    categories = data.map(item => item.name);
    chartValues = data.map(item => item.value);
  } else {
    // Default fallback if data is not in expected format
    categories = defaultCategories;
    chartValues = defaultValues;
  }

  // Calculate total TH/s (example: 648 in total)
  const totalTHs = 648;

  // Create computational power metrics with specific colors
  const compMetrics = [
    {
      label: 'High Performance',
      value: 168,
      percentage: '25.9%',
      color: 'rgba(76, 175, 80, 1)',
    },
    {
      label: 'Standard Node',
      value: 220,
      percentage: '34.0%',
      color: 'rgba(33, 150, 243, 1)',
    },
    {
      label: 'Edge Device',
      value: 84,
      percentage: '13.0%',
      color: 'rgba(255, 152, 0, 1)',
    },
    {
      label: 'Cloud Instance',
      value: 125,
      percentage: '19.3%',
      color: 'rgba(156, 39, 176, 1)',
    },
    {
      label: 'Research Cluster',
      value: 51,
      percentage: '7.9%',
      color: 'rgba(244, 67, 54, 1)',
    },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        height: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Removing title header completely */}

      {/* Computational power metrics cards */}
      <Box sx={{ display: 'flex', flexWrap: 'nowrap', gap: 1, mb: 2, mt: 1 }}>
        {compMetrics.map((metric, index) => (
          <Box
            key={index}
            sx={{
              flex: '1 1 0',
              p: 1,
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid #eee',
              borderRadius: 1,
              minWidth: 0,
            }}
          >
            <Typography variant="body2" sx={{ mb: 0.5, textAlign: 'center' }}>
              {metric.label}
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 'bold',
                color: metric.color,
                mb: 0.5,
                textAlign: 'center',
              }}
            >
              {metric.value}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                textAlign: 'center',
                fontSize: '0.75rem',
              }}
            >
              {metric.percentage} of network
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Chart Only - No Title */}
      <Box sx={{ mt: 2, mb: 1 }}>
        <DistributionChart
          categories={categories}
          values={chartValues}
          colors={COLORS}
          borderColors={BORDER_COLORS}
          labelPositions={labelPositions}
          metricLabel="Total"
          metricValue={`${totalTHs} TH/s`}
        />
      </Box>
    </Paper>
  );
};

export default ComputationalPowerDistributionChart;
