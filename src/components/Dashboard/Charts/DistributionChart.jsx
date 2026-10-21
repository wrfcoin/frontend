import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Box, Typography } from '@mui/material';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

const DistributionChart = ({
  categories,
  values,
  colors,
  borderColors,
  labelPositions,
  metricLabel,
  metricValue,
}) => {
  const total = values.reduce((sum, val) => sum + val, 0);

  // Calculate percentages for display
  const percentages = values.map(value => ((value / total) * 100).toFixed(1));

  // Default to "Total" if no custom metric label provided
  const displayMetricLabel = metricLabel || 'Total';
  const displayMetricValue = metricValue || total;

  const chartData = {
    labels: categories,
    datasets: [
      {
        data: values,
        backgroundColor: colors,
        borderColor: borderColors,
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

  return (
    <>
      {/* Metric Badge - Top Right */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 'bold',
            bgcolor: 'rgba(0, 0, 0, 0.05)',
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {displayMetricLabel}: {displayMetricValue}
        </Typography>
      </Box>

      {/* Pie Chart with labels */}
      <Box
        sx={{
          height: 220,
          position: 'relative',
          mb: 1,
          mx: 'auto',
          width: '100%',
        }}
      >
        <Pie data={chartData} options={options} />

        {/* Labels with curved lines */}
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
          {categories.map((category, index) => {
            const position =
              labelPositions && labelPositions[index]
                ? labelPositions[index]
                : {};

            return (
              <Typography
                key={`label-${index}`}
                variant="caption"
                sx={{
                  position: 'absolute',
                  ...position,
                  color: borderColors[index],
                  whiteSpace: 'nowrap',
                  fontSize: '12px',
                  fontWeight: 'medium',
                }}
              >
                {category}: {percentages[index]}%
              </Typography>
            );
          })}
        </Box>
      </Box>

      {/* Color Legend */}
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
                backgroundColor: colors[index],
                mr: 0.5,
                borderRadius: '2px',
              }}
            />
            <Typography
              variant="caption"
              color={borderColors[index]}
              sx={{ fontSize: '0.75rem' }}
            >
              {category}
            </Typography>
          </Box>
        ))}
      </Box>
    </>
  );
};

export default DistributionChart;
