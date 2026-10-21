import React, { useMemo } from 'react';
import { Box, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData,
  TooltipItem,
} from 'chart.js';
import { ConfidenceBand, WeatherParameter, PARAMETER_CONFIG } from './types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export interface ConfidenceConeProps {
  bands: ConfidenceBand[];
  parameter: WeatherParameter;
  onParameterChange: (param: WeatherParameter) => void;
  visibleHours?: number;
}

const ConfidenceCone: React.FC<ConfidenceConeProps> = ({
  bands,
  parameter,
  onParameterChange,
  visibleHours,
}) => {
  const { chartData, chartOptions } = useMemo(() => {
    const config = PARAMETER_CONFIG[parameter];
    const maxPoints = visibleHours ?? bands.length;
    const sliced = bands.slice(0, maxPoints);

    const labels = sliced.map((b) => {
      const d = new Date(b.timestamp);
      return d.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric' });
    });

    const step = Math.max(1, Math.floor(labels.length / 24));
    const displayLabels = labels.map((l, i) => (i % step === 0 ? l : ''));

    const data: ChartData<'line'> = {
      labels: displayLabels,
      datasets: [
        // 95th percentile band (lightest)
        {
          label: '95% Upper',
          data: sliced.map((b) => b.p97_5),
          borderColor: 'transparent',
          backgroundColor: config.color + '15',
          fill: '+1',
          pointRadius: 0,
          order: 5,
        },
        {
          label: '95% Lower',
          data: sliced.map((b) => b.p2_5),
          borderColor: 'transparent',
          backgroundColor: 'transparent',
          fill: false,
          pointRadius: 0,
          order: 5,
        },
        // 80th percentile band (medium)
        {
          label: '80% Upper',
          data: sliced.map((b) => b.p90),
          borderColor: 'transparent',
          backgroundColor: config.color + '25',
          fill: '+1',
          pointRadius: 0,
          order: 4,
        },
        {
          label: '80% Lower',
          data: sliced.map((b) => b.p10),
          borderColor: 'transparent',
          backgroundColor: 'transparent',
          fill: false,
          pointRadius: 0,
          order: 4,
        },
        // 50th percentile band (darkest shading)
        {
          label: '50% Upper',
          data: sliced.map((b) => b.p75),
          borderColor: 'transparent',
          backgroundColor: config.color + '40',
          fill: '+1',
          pointRadius: 0,
          order: 3,
        },
        {
          label: '50% Lower',
          data: sliced.map((b) => b.p25),
          borderColor: 'transparent',
          backgroundColor: 'transparent',
          fill: false,
          pointRadius: 0,
          order: 3,
        },
        // Ensemble mean (best estimate) line on top
        {
          label: 'Ensemble Mean',
          data: sliced.map((b) => b.mean),
          borderColor: config.color,
          backgroundColor: config.color,
          borderWidth: 2.5,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: config.color,
          tension: 0.3,
          fill: false,
          order: 1,
        },
      ],
    };

    const options: ChartOptions<'line'> = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#F8FAFC',
          bodyColor: '#CBD5E1',
          borderColor: '#334155',
          borderWidth: 1,
          padding: 12,
          titleFont: { family: 'Inter', size: 13, weight: 'bold' },
          bodyFont: { family: 'JetBrains Mono', size: 12 },
          filter: (item: TooltipItem<'line'>) => {
            // Only show the mean line and band ranges, not all 7 datasets
            return item.dataset.label === 'Ensemble Mean';
          },
          callbacks: {
            title: (items: TooltipItem<'line'>[]) => {
              if (!items.length) return '';
              const idx = items[0].dataIndex;
              const band = sliced[idx];
              if (!band) return '';
              return new Date(band.timestamp).toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              });
            },
            afterBody: (items: TooltipItem<'line'>[]) => {
              if (!items.length) return [];
              const idx = items[0].dataIndex;
              const b = sliced[idx];
              if (!b) return [];
              return [
                `  50% range: ${b.p25.toFixed(1)} - ${b.p75.toFixed(1)} ${config.unit}`,
                `  80% range: ${b.p10.toFixed(1)} - ${b.p90.toFixed(1)} ${config.unit}`,
                `  95% range: ${b.p2_5.toFixed(1)} - ${b.p97_5.toFixed(1)} ${config.unit}`,
              ];
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: '#1E293B' },
          ticks: {
            color: '#94A3B8',
            font: { family: 'Inter', size: 11 },
            maxRotation: 45,
          },
        },
        y: {
          grid: { color: '#1E293B' },
          ticks: {
            color: '#94A3B8',
            font: { family: 'JetBrains Mono', size: 11 },
            callback: (value) => `${value}${config.unit}`,
          },
          title: {
            display: true,
            text: `${config.label} (${config.unit})`,
            color: '#94A3B8',
            font: { family: 'Inter', size: 12 },
          },
        },
      },
    };

    return { chartData: data, chartOptions: options };
  }, [bands, parameter, visibleHours]);

  const parameterButtons: WeatherParameter[] = [
    'temperature',
    'precipitation',
    'windSpeed',
    'pressure',
    'humidity',
    'cloudCover',
  ];

  return (
    <Box>
      {/* Parameter selector */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Typography
          variant="caption"
          sx={{ color: '#94A3B8', fontFamily: 'Inter', textTransform: 'uppercase', letterSpacing: 1 }}
        >
          Parameter
        </Typography>
        <ToggleButtonGroup
          value={parameter}
          exclusive
          onChange={(_, val) => val && onParameterChange(val)}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              color: '#94A3B8',
              borderColor: '#334155',
              fontFamily: 'Inter',
              fontSize: '0.75rem',
              px: 1.5,
              py: 0.5,
              textTransform: 'none',
              '&.Mui-selected': {
                bgcolor: '#3B82F6',
                color: '#F8FAFC',
                '&:hover': { bgcolor: '#2563EB' },
              },
              '&:hover': { bgcolor: '#1E293B' },
            },
          }}
        >
          {parameterButtons.map((p) => (
            <ToggleButton key={p} value={p}>
              {PARAMETER_CONFIG[p].label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {/* Chart */}
      <Box sx={{ bgcolor: '#1E293B', borderRadius: 2, p: 2, height: 400, position: 'relative' }}>
        <Line data={chartData} options={chartOptions} />
      </Box>

      {/* Legend for confidence bands */}
      <Box sx={{ display: 'flex', gap: 3, mt: 1.5, flexWrap: 'wrap' }}>
        {[
          { label: 'Best Estimate', style: 'line' },
          { label: '50% Confidence', opacity: '40' },
          { label: '80% Confidence', opacity: '25' },
          { label: '95% Confidence', opacity: '15' },
        ].map((item) => (
          <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            {item.style === 'line' ? (
              <Box
                sx={{
                  width: 24,
                  height: 3,
                  bgcolor: PARAMETER_CONFIG[parameter].color,
                  borderRadius: 1,
                }}
              />
            ) : (
              <Box
                sx={{
                  width: 16,
                  height: 12,
                  bgcolor: PARAMETER_CONFIG[parameter].color + item.opacity,
                  border: `1px solid ${PARAMETER_CONFIG[parameter].color}30`,
                  borderRadius: 0.5,
                }}
              />
            )}
            <Typography variant="caption" sx={{ color: '#64748B', fontFamily: 'Inter', fontSize: '0.7rem' }}>
              {item.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default ConfidenceCone;
