import React from 'react';

import { Box, Typography, Paper } from '@mui/material';

import DistributionChart from './DistributionChart';

const NodeTypeDistributionChart = ({ data }) => {
  // Default data for node type distribution - matching the image exactly
  const defaultCategories = [
    'Full Validator',
    'Data Validator',
    'Light Client',
    'Storage Keeper',
    'Compute Node',
  ];

  const defaultValues = [182, 145, 235, 58, 27];

  // Colors matching exactly the Node Type Distribution chart
  const COLORS = [
    'rgba(76, 175, 80, 0.8)', // Green - Full Validator
    'rgba(33, 150, 243, 0.8)', // Blue - Data Validator
    'rgba(255, 152, 0, 0.8)', // Orange - Light Client
    'rgba(156, 39, 176, 0.8)', // Purple - Storage Keeper
    'rgba(244, 67, 54, 0.8)', // Red - Compute Node
  ];

  const BORDER_COLORS = [
    'rgba(76, 175, 80, 1)', // Green - Full Validator
    'rgba(33, 150, 243, 1)', // Blue - Data Validator
    'rgba(255, 152, 0, 1)', // Orange - Light Client
    'rgba(156, 39, 176, 1)', // Purple - Storage Keeper
    'rgba(244, 67, 54, 1)', // Red - Compute Node
  ];

  // Label positions matching the reference image
  const labelPositions = [
    { right: '23%', top: '25%' }, // Full Validator
    { left: '15%', top: '35%' }, // Data Validator
    { left: '21%', bottom: '25%' }, // Light Client
    { right: '24%', bottom: '30%' }, // Storage Keeper
    { right: '27%', bottom: '40%' }, // Compute Node
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

  // Calculate total nodes for display
  const totalNodes = chartValues.reduce((sum, value) => sum + value, 0);

  // Create node metrics with specific colors
  const nodeMetrics = [
    {
      label: 'Full Validator',
      value: 182,
      percentage: '28.1%',
      color: 'rgba(76, 175, 80, 1)',
    },
    {
      label: 'Data Validator',
      value: 145,
      percentage: '22.4%',
      color: 'rgba(33, 150, 243, 1)',
    },
    {
      label: 'Light Client',
      value: 235,
      percentage: '36.3%',
      color: 'rgba(255, 152, 0, 1)',
    },
    {
      label: 'Storage Keeper',
      value: 58,
      percentage: '9.0%',
      color: 'rgba(156, 39, 176, 1)',
    },
    {
      label: 'Compute Node',
      value: 27,
      percentage: '4.2%',
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

      {/* Node count metrics cards */}
      <Box sx={{ display: 'flex', flexWrap: 'nowrap', gap: 1, mb: 2, mt: 1 }}>
        {nodeMetrics.map((metric, index) => (
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

      {/* Chart Only */}
      <Box sx={{ mt: 2, mb: 1 }}>
        <DistributionChart
          categories={categories}
          values={chartValues}
          colors={COLORS}
          borderColors={BORDER_COLORS}
          labelPositions={labelPositions}
          metricLabel="Nodes"
          metricValue={totalNodes}
        />
      </Box>
    </Paper>
  );
};

export default NodeTypeDistributionChart;
