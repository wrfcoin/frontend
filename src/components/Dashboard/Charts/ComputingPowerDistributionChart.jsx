import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Box, Typography, Divider, Paper } from '@mui/material';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

const ComputingPowerDistributionChart = ({ data }) => {
  // Default data for computing power distribution - matching the image exactly
  const defaultCategories = [
    'Full Validator',
    'Data Validator',
    'Light Client',
    'Storage Keeper',
    'Compute Node',
  ];

  const defaultValues = [182, 145, 235, 58, 27];

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

  const total = chartValues.reduce((sum, val) => sum + val, 0);

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

  const chartData = {
    labels: categories,
    datasets: [
      {
        data: chartValues,
        backgroundColor: COLORS,
        borderColor: BORDER_COLORS,
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        callbacks: {
          label: context => {
            const label = context.label || '';
            const value = context.raw || 0;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  // Calculate percentages for display
  const percentages = chartValues.map(value =>
    ((value / total) * 100).toFixed(1),
  );

  return (
    <Paper elevation={0} sx={{ p: 2, borderRadius: 2 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
      >
        <Typography variant="h6" color="#333" fontWeight="500">
          Node Type Distribution
        </Typography>
        <Typography variant="body2" color="#666" sx={{ mt: 0.5 }}>
          Distribution visualization
        </Typography>
      </Box>

      <Divider sx={{ my: 1.5 }} />

      {/* Top Metrics Cards - in a single row exactly matching the reference image */}
      <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, mb: 2 }}>
        {categories.map((category, index) => {
          const value = chartValues[index];
          const percentage = percentages[index];

          return (
            <Box
              key={category}
              sx={{
                flex: 1,
                textAlign: 'center',
                px: 1,
                py: 1,
                border: '1px solid #f0f0f0',
                borderRadius: 1,
              }}
            >
              <Typography
                variant="body2"
                color="#555"
                sx={{ fontSize: '0.75rem', mb: 0.5 }}
              >
                {category}
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: BORDER_COLORS[index],
                  fontWeight: '500',
                  fontSize: '1.5rem',
                  lineHeight: 1.1,
                }}
              >
                {value}
              </Typography>
              <Typography
                variant="caption"
                color="#666"
                sx={{ display: 'block', mt: 0.5 }}
              >
                {percentage}% of network
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* Pie Chart with labels exactly matching the reference */}
      <Box
        sx={{
          height: 220,
          position: 'relative',
          mt: 1,
          mb: 1,
          mx: 'auto',
        }}
      >
        <Pie data={chartData} options={options} />

        {/* Labels with curved lines matching the reference */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          {/* Full Validator Label */}
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              right: '23%',
              top: '25%',
              color: BORDER_COLORS[0],
              whiteSpace: 'nowrap',
              fontSize: '12px',
              fontWeight: 'medium',
            }}
          >
            Full Validator: {percentages[0]}%
          </Typography>

          {/* Data Validator Label */}
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              left: '15%',
              top: '35%',
              color: BORDER_COLORS[1],
              whiteSpace: 'nowrap',
              fontSize: '12px',
              fontWeight: 'medium',
            }}
          >
            Data Validator: {percentages[1]}%
          </Typography>

          {/* Light Client Label */}
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              left: '21%',
              bottom: '25%',
              color: BORDER_COLORS[2],
              whiteSpace: 'nowrap',
              fontSize: '12px',
              fontWeight: 'medium',
            }}
          >
            Light Client: {percentages[2]}%
          </Typography>

          {/* Storage Keeper Label */}
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              right: '24%',
              bottom: '30%',
              color: BORDER_COLORS[3],
              whiteSpace: 'nowrap',
              fontSize: '12px',
              fontWeight: 'medium',
            }}
          >
            Storage Keeper: {percentages[3]}%
          </Typography>

          {/* Compute Node Label */}
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              right: '27%',
              bottom: '40%',
              color: BORDER_COLORS[4],
              whiteSpace: 'nowrap',
              fontSize: '12px',
              fontWeight: 'medium',
            }}
          >
            Compute Node: {percentages[4]}%
          </Typography>
        </Box>
      </Box>

      {/* Color Legend exactly matching the reference image */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          mt: 1,
        }}
      >
        {categories.map((category, index) => (
          <Box
            key={`legend-${index}`}
            sx={{ display: 'flex', alignItems: 'center', mx: 1, mb: 0.5 }}
          >
            <Box
              sx={{
                width: 12,
                height: 12,
                backgroundColor: COLORS[index],
                mr: 0.5,
                borderRadius: '2px',
              }}
            />
            <Typography
              variant="caption"
              color={BORDER_COLORS[index]}
              sx={{ fontSize: '0.75rem' }}
            >
              {category}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default ComputingPowerDistributionChart;
