import React from 'react';

import { Box, Typography, Paper } from '@mui/material';

import DistributionChart from './DistributionChart';

const FileStorageDistributionChart = ({ data }) => {
  // Default data for file storage distribution
  const defaultCategories = [
    'Weather Data',
    'Transaction History',
    'Smart Contracts',
    'Chain State',
    'Governance Docs',
  ];

  const defaultValues = [215, 185, 76, 112, 62];

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
    { right: '23%', top: '25%' }, // Weather Data
    { left: '15%', top: '35%' }, // Transaction History
    { left: '21%', bottom: '25%' }, // Smart Contracts
    { right: '24%', bottom: '30%' }, // Chain State
    { right: '27%', bottom: '40%' }, // Governance Docs
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

  // Calculate total storage in GB (example: 650 GB in total)
  const totalStorageGB = 650;

  // Create file storage metrics with specific colors
  const storageMetrics = [
    {
      label: 'Weather Data',
      value: 215,
      percentage: '33.1%',
      color: 'rgba(76, 175, 80, 1)',
    },
    {
      label: 'Transaction History',
      value: 185,
      percentage: '28.5%',
      color: 'rgba(33, 150, 243, 1)',
    },
    {
      label: 'Smart Contracts',
      value: 76,
      percentage: '11.7%',
      color: 'rgba(255, 152, 0, 1)',
    },
    {
      label: 'Chain State',
      value: 112,
      percentage: '17.2%',
      color: 'rgba(156, 39, 176, 1)',
    },
    {
      label: 'Governance Docs',
      value: 62,
      percentage: '9.5%',
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

      {/* File storage metrics cards */}
      <Box sx={{ display: 'flex', flexWrap: 'nowrap', gap: 1, mb: 2, mt: 1 }}>
        {storageMetrics.map((metric, index) => (
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
          metricValue={`${totalStorageGB} GB`}
        />
      </Box>
    </Paper>
  );
};

export default FileStorageDistributionChart;
