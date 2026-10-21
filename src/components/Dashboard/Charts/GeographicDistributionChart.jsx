import React from 'react';

import { Box, Typography, Paper } from '@mui/material';

import DistributionChart from './DistributionChart';

const GeographicDistributionChart = ({ data }) => {
  // Default data for geographic distribution - matching the image exactly
  const defaultCategories = [
    'North America',
    'Europe',
    'Asia',
    'South America',
    'Oceania',
    'Africa',
  ];

  const defaultValues = [245, 195, 142, 35, 18, 12];

  // Colors matching exactly the Geographic Distribution chart
  const COLORS = [
    'rgba(76, 175, 80, 0.8)', // Green - North America
    'rgba(33, 150, 243, 0.8)', // Blue - Europe
    'rgba(255, 152, 0, 0.8)', // Orange - Asia
    'rgba(156, 39, 176, 0.8)', // Purple - South America
    'rgba(244, 67, 54, 0.8)', // Red - Oceania
    'rgba(121, 134, 134, 0.8)', // Gray - Africa
  ];

  const BORDER_COLORS = [
    'rgba(76, 175, 80, 1)', // Green - North America
    'rgba(33, 150, 243, 1)', // Blue - Europe
    'rgba(255, 152, 0, 1)', // Orange - Asia
    'rgba(156, 39, 176, 1)', // Purple - South America
    'rgba(244, 67, 54, 1)', // Red - Oceania
    'rgba(121, 134, 134, 1)', // Gray - Africa
  ];

  // Label positions matching the reference image
  const labelPositions = [
    { right: '23%', top: '30%' }, // North America
    { left: '30%', bottom: '40%' }, // Europe
    { right: '30%', bottom: '30%' }, // Asia
    { left: '20%', bottom: '30%' }, // South America
    { right: '20%', bottom: '45%' }, // Oceania
    { right: '35%', top: '35%' }, // Africa
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

  // Number of countries with active nodes
  const countryCount = 75;

  // Create geographic metrics with specific colors
  const geoMetrics = [
    {
      label: 'North America',
      value: 245,
      percentage: '37.9%',
      color: 'rgba(76, 175, 80, 1)',
    },
    {
      label: 'Europe',
      value: 195,
      percentage: '30.1%',
      color: 'rgba(33, 150, 243, 1)',
    },
    {
      label: 'Asia',
      value: 142,
      percentage: '21.9%',
      color: 'rgba(255, 152, 0, 1)',
    },
    {
      label: 'South America',
      value: 35,
      percentage: '5.4%',
      color: 'rgba(156, 39, 176, 1)',
    },
    {
      label: 'Oceania',
      value: 18,
      percentage: '2.8%',
      color: 'rgba(244, 67, 54, 1)',
    },
    {
      label: 'Africa',
      value: 12,
      percentage: '1.9%',
      color: 'rgba(121, 134, 134, 1)',
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

      {/* Geographic metrics cards */}
      <Box sx={{ display: 'flex', flexWrap: 'nowrap', gap: 1, mb: 2, mt: 1 }}>
        {geoMetrics.map((metric, index) => (
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
          metricLabel="Countries"
          metricValue={countryCount}
        />
      </Box>
    </Paper>
  );
};

export default GeographicDistributionChart;
