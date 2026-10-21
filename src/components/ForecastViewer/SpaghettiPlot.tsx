import React, { useMemo, useRef } from 'react';
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
import { ForecastPoint, ModelForecast, WeatherParameter, PARAMETER_CONFIG } from './types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export interface SpaghettiPlotProps {
  models: ModelForecast[];
  parameter: WeatherParameter;
  onParameterChange: (param: WeatherParameter) => void;
  /** Optional: only show data for the given number of hours from now */
  visibleHours?: number;
}

/** Map from WeatherParameter to the key on ForecastPoint */
const PARAM_KEY_MAP: Record<WeatherParameter, keyof ForecastPoint> = {
  temperature: 'temperature',
  precipitation: 'precipitationProbability',
  windSpeed: 'windSpeed',
  pressure: 'pressure',
  humidity: 'humidity',
  cloudCover: 'cloudCover',
};

const SpaghettiPlot: React.FC<SpaghettiPlotProps> = ({
  models,
  parameter,
  onParameterChange,
  visibleHours,
}) => {
  const chartRef = useRef<ChartJS<'line'>>(null);

  const { chartData, chartOptions } = useMemo(() => {
    const config = PARAMETER_CONFIG[parameter];
    const paramKey = PARAM_KEY_MAP[parameter];

    // Determine how many data points to show
    const maxPoints = visibleHours ?? models[0]?.points.length ?? 0;
    const refPoints = models[0]?.points.slice(0, maxPoints) ?? [];

    // Format timestamps for x-axis
    const labels = refPoints.map((p) => {
      const d = new Date(p.timestamp);
      return d.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric' });
    });

    // Thin labels for readability: show every Nth label
    const step = Math.max(1, Math.floor(labels.length / 24));
    const displayLabels = labels.map((l, i) => (i % step === 0 ? l : ''));

    const datasets = models.map((model) => ({
      label: model.modelName,
      data: model.points.slice(0, maxPoints).map((p) => Number(p[paramKey] ?? 0)),
      borderColor: model.color,
      backgroundColor: model.color + '18',
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: model.color,
      tension: 0.3,
      fill: false,
    }));

    const data: ChartData<'line'> = {
      labels: displayLabels,
      datasets,
    };

    const options: ChartOptions<'line'> = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: false, // We use the external model legend
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#F8FAFC',
          bodyColor: '#CBD5E1',
          borderColor: '#334155',
          borderWidth: 1,
          padding: 12,
          titleFont: { family: 'Inter', size: 13, weight: 'bold' },
          bodyFont: { family: 'JetBrains Mono', size: 12 },
          callbacks: {
            title: (items: TooltipItem<'line'>[]) => {
              if (!items.length) return '';
              const idx = items[0].dataIndex;
              const point = models[0]?.points[idx];
              if (!point) return '';
              return new Date(point.timestamp).toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              });
            },
            label: (item: TooltipItem<'line'>) => {
              const val = typeof item.raw === 'number' ? item.raw.toFixed(1) : String(item.raw);
              return ` ${item.dataset.label}: ${val} ${config.unit}`;
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
  }, [models, parameter, visibleHours]);

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
      <Box
        sx={{
          bgcolor: '#1E293B',
          borderRadius: 2,
          p: 2,
          height: 400,
          position: 'relative',
        }}
      >
        <Line ref={chartRef} data={chartData} options={chartOptions} />
      </Box>

      {/* Interpretation hint */}
      <Typography
        variant="caption"
        sx={{ color: '#64748B', fontFamily: 'Inter', mt: 1, display: 'block' }}
      >
        Tight clustering = high model agreement (confidence). Wide spread = greater uncertainty.
      </Typography>
    </Box>
  );
};

export default SpaghettiPlot;
