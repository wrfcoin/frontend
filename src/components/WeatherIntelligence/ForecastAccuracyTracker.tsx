import React, { useState, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import SpeedIcon from '@mui/icons-material/Speed';
import BalanceIcon from '@mui/icons-material/Balance';
import GradeIcon from '@mui/icons-material/Grade';
import CompareIcon from '@mui/icons-material/Compare';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { WrfCard, WrfStatCard, WrfDataTable, WrfBadge } from '../ui';
import { WrfCapabilityReadinessBadge } from '../DesignSystem';
import { colors, spacing, borderRadius } from '../ui/tokens';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ModelConfig {
  id: string;
  name: string;
  color: string;
  mae: number;
  rmse: number;
  bias: number;
  skill: number;
  resolution: string;
  type: string;
}

type ParameterKey = 'temperature' | 'humidity' | 'pressure' | 'windSpeed' | 'precipitation';

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MODELS: ModelConfig[] = [
  { id: 'wrfcoin-ensemble', name: 'WRFCoin Ensemble', color: colors.brand.primary, mae: 1.24, rmse: 1.68, bias: -0.12, skill: 0.912, resolution: '1 km', type: 'Ensemble' },
  { id: 'gfs-global', name: 'GFS Global', color: '#EF4444', mae: 2.15, rmse: 2.87, bias: 0.34, skill: 0.847, resolution: '25 km', type: 'NWP' },
  { id: 'ecmwf-hres', name: 'ECMWF HRES', color: '#10B981', mae: 1.82, rmse: 2.41, bias: 0.18, skill: 0.876, resolution: '9 km', type: 'NWP' },
  { id: 'nam-regional', name: 'NAM Regional', color: '#F59E0B', mae: 2.48, rmse: 3.12, bias: -0.45, skill: 0.821, resolution: '12 km', type: 'NWP' },
  { id: 'hrrr-rapid', name: 'HRRR Rapid Refresh', color: '#8B5CF6', mae: 1.56, rmse: 2.08, bias: 0.07, skill: 0.893, resolution: '3 km', type: 'NWP' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

const PARAMETERS: { key: ParameterKey; label: string; unit: string }[] = [
  { key: 'temperature', label: 'Temperature', unit: 'C' },
  { key: 'humidity', label: 'Humidity', unit: '%' },
  { key: 'pressure', label: 'Pressure', unit: 'hPa' },
  { key: 'windSpeed', label: 'Wind Speed', unit: 'm/s' },
  { key: 'precipitation', label: 'Precipitation', unit: 'mm' },
];

// Generate predicted/actual data with noise for each model
function generateTimeSeries(
  model: ModelConfig,
  _param: ParameterKey,
  seed: number,
): { predicted: number[]; actual: number[] } {
  const actual: number[] = [];
  const predicted: number[] = [];
  let base = 18 + seed * 2;

  for (let i = 0; i < 24; i++) {
    // Diurnal pattern
    const diurnal = 6 * Math.sin(((i - 6) / 24) * Math.PI * 2);
    const noise = (Math.sin(i * 7.3 + seed * 13.7) * 0.5 + Math.cos(i * 3.1 + seed * 5.2) * 0.3) * 2;
    const actualVal = base + diurnal + noise;
    actual.push(parseFloat(actualVal.toFixed(1)));

    const modelError = model.mae * (Math.sin(i * 2.7 + seed * 9.1) * 0.8 + model.bias * 0.5);
    predicted.push(parseFloat((actualVal + modelError).toFixed(1)));
  }

  return { predicted, actual };
}

const TABLE_COLUMNS = [
  { key: 'name', label: 'Model', sortable: true },
  { key: 'type', label: 'Type', sortable: true },
  { key: 'resolution', label: 'Resolution', sortable: true },
  {
    key: 'mae',
    label: 'MAE',
    sortable: true,
    render: (val: number) => (
      <Typography component="span" sx={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: val < 1.5 ? colors.success.main : val < 2.0 ? colors.warning.main : colors.error.main }}>
        {val.toFixed(2)}
      </Typography>
    ),
  },
  {
    key: 'rmse',
    label: 'RMSE',
    sortable: true,
    render: (val: number) => (
      <Typography component="span" sx={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: val < 2.0 ? colors.success.main : val < 2.5 ? colors.warning.main : colors.error.main }}>
        {val.toFixed(2)}
      </Typography>
    ),
  },
  {
    key: 'bias',
    label: 'Bias',
    sortable: true,
    render: (val: number) => (
      <Typography component="span" sx={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: Math.abs(val) < 0.2 ? colors.success.main : Math.abs(val) < 0.4 ? colors.warning.main : colors.error.main }}>
        {val > 0 ? '+' : ''}{val.toFixed(2)}
      </Typography>
    ),
  },
  {
    key: 'skill',
    label: 'Skill Score',
    sortable: true,
    render: (val: number) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ flex: 1, height: 6, backgroundColor: colors.bg.tertiary, borderRadius: 3, overflow: 'hidden', maxWidth: 80 }}>
          <Box sx={{ width: `${val * 100}%`, height: '100%', backgroundColor: val > 0.9 ? colors.success.main : val > 0.85 ? colors.warning.main : colors.error.main, borderRadius: 3 }} />
        </Box>
        <Typography component="span" sx={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: colors.text.primary }}>
          {val.toFixed(3)}
        </Typography>
      </Box>
    ),
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const selectSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: colors.bg.tertiary,
    color: colors.text.primary,
    fontSize: '0.8125rem',
    '& fieldset': { borderColor: colors.border.default },
    '&:hover fieldset': { borderColor: colors.border.light },
    '&.Mui-focused fieldset': { borderColor: colors.brand.primary },
  },
  '& .MuiInputLabel-root': { color: colors.text.muted, fontSize: '0.8125rem' },
  '& .MuiSvgIcon-root': { color: colors.text.secondary },
};

const ForecastAccuracyTracker: React.FC = () => {
  const [selectedModels, setSelectedModels] = useState<string[]>(['wrfcoin-ensemble', 'gfs-global']);
  const [selectedParam, setSelectedParam] = useState<ParameterKey>('temperature');

  const handleModelToggle = useCallback(
    (modelId: string) => {
      setSelectedModels((prev) =>
        prev.includes(modelId) ? prev.filter((m) => m !== modelId) : [...prev, modelId],
      );
    },
    [],
  );

  const primaryModel = useMemo(
    () => MODELS.find((m) => m.id === selectedModels[0]) || MODELS[0],
    [selectedModels],
  );

  const chartData = useMemo(() => {
    const datasets: any[] = [];
    const paramIndex = PARAMETERS.findIndex((p) => p.key === selectedParam);

    // Add actual data line (same for all models for comparison)
    const firstModelSeries = generateTimeSeries(MODELS[0], selectedParam, paramIndex);
    datasets.push({
      label: 'Observed (Actual)',
      data: firstModelSeries.actual,
      borderColor: colors.text.primary,
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderDash: [6, 3],
      pointRadius: 3,
      pointBackgroundColor: colors.text.primary,
      tension: 0.3,
      fill: false,
    });

    // Add each selected model's predicted data
    selectedModels.forEach((modelId) => {
      const model = MODELS.find((m) => m.id === modelId);
      if (!model) return;
      const series = generateTimeSeries(model, selectedParam, paramIndex);
      datasets.push({
        label: `${model.name} (Predicted)`,
        data: series.predicted,
        borderColor: model.color,
        backgroundColor: `${model.color}15`,
        borderWidth: 2,
        pointRadius: 2,
        tension: 0.3,
        fill: false,
      });
    });

    return { labels: HOURS, datasets };
  }, [selectedModels, selectedParam]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index' as const, intersect: false },
      plugins: {
        legend: {
          position: 'top' as const,
          labels: { color: colors.text.secondary, font: { size: 11 }, usePointStyle: true, pointStyleWidth: 8 },
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: colors.text.primary,
          bodyColor: colors.text.secondary,
          borderColor: colors.border.default,
          borderWidth: 1,
        },
      },
      scales: {
        x: {
          ticks: { color: colors.text.muted, font: { size: 10 }, maxTicksLimit: 12 },
          grid: { color: 'rgba(51, 65, 85, 0.3)' },
          title: { display: true, text: 'Hour (UTC)', color: colors.text.muted, font: { size: 11 } },
        },
        y: {
          ticks: { color: colors.text.muted, font: { size: 10 } },
          grid: { color: 'rgba(51, 65, 85, 0.3)' },
          title: {
            display: true,
            text: `${PARAMETERS.find((p) => p.key === selectedParam)?.label} (${PARAMETERS.find((p) => p.key === selectedParam)?.unit})`,
            color: colors.text.muted,
            font: { size: 11 },
          },
        },
      },
    }),
    [selectedParam],
  );

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: colors.bg.primary, padding: `${spacing.lg}px` }}>
      {/* Page Header */}
      <Box sx={{ marginBottom: `${spacing.lg}px` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px`, marginBottom: `${spacing.xs}px` }}>
          <TrackChangesIcon sx={{ color: colors.brand.primary, fontSize: 28 }} />
          <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: colors.text.primary }}>
            Forecast Accuracy Tracker
          </Typography>
          <WrfCapabilityReadinessBadge featureName="weatherIntelligence" compact sx={{ ml: 1 }} />
        </Box>
        <Typography sx={{ fontSize: '0.875rem', color: colors.text.secondary }}>
          Compare predicted versus actual weather data across models to measure forecast skill and error metrics.
        </Typography>
      </Box>

      {/* Error Metrics Stat Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: `${spacing.md}px`, marginBottom: `${spacing.lg}px` }}>
        <WrfStatCard
          label="Mean Absolute Error"
          value={primaryModel.mae.toFixed(2)}
          trend={-5.3}
          trendLabel="vs baseline"
          icon={SpeedIcon}
          color={primaryModel.mae < 1.5 ? colors.success.main : colors.warning.main}
          sparklineData={[2.1, 1.9, 1.8, 1.7, 1.5, 1.4, 1.3, 1.24]}
        />
        <WrfStatCard
          label="RMSE"
          value={primaryModel.rmse.toFixed(2)}
          trend={-7.1}
          trendLabel="vs baseline"
          icon={SpeedIcon}
          color={primaryModel.rmse < 2.0 ? colors.success.main : colors.warning.main}
          sparklineData={[2.8, 2.6, 2.4, 2.2, 2.0, 1.9, 1.8, 1.68]}
        />
        <WrfStatCard
          label="Bias"
          value={`${primaryModel.bias > 0 ? '+' : ''}${primaryModel.bias.toFixed(2)}`}
          trend={-18.2}
          trendLabel="magnitude reduced"
          icon={BalanceIcon}
          color={Math.abs(primaryModel.bias) < 0.2 ? colors.success.main : colors.warning.main}
          sparklineData={[0.45, 0.38, 0.32, 0.28, 0.22, 0.18, 0.15, 0.12]}
        />
        <WrfStatCard
          label="Skill Score"
          value={primaryModel.skill.toFixed(3)}
          trend={4.8}
          trendLabel="vs last period"
          icon={GradeIcon}
          color={primaryModel.skill > 0.9 ? colors.success.main : colors.warning.main}
          sparklineData={[0.84, 0.86, 0.87, 0.89, 0.90, 0.90, 0.91, 0.912]}
        />
      </Box>

      {/* Model Selector + Parameter Selector */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: `${spacing.md}px`, marginBottom: `${spacing.md}px`, alignItems: 'center' }}>
        {/* Model Selector */}
        <WrfCard sx={{ flex: '1 1 auto', minWidth: 300, padding: `${spacing.md}px !important` }}>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
            Select Models to Compare
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: `${spacing.xs}px` }}>
            {MODELS.map((model) => (
              <Chip
                key={model.id}
                label={model.name}
                size="small"
                onClick={() => handleModelToggle(model.id)}
                sx={{
                  backgroundColor: selectedModels.includes(model.id) ? `${model.color}25` : colors.bg.tertiary,
                  color: selectedModels.includes(model.id) ? model.color : colors.text.secondary,
                  border: `1px solid ${selectedModels.includes(model.id) ? model.color : 'transparent'}`,
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: `${model.color}18` },
                }}
              />
            ))}
          </Box>
        </WrfCard>

        {/* Parameter Selector */}
        <WrfCard sx={{ minWidth: 200, padding: `${spacing.md}px !important` }}>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
            Parameter
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: `${spacing.xs}px` }}>
            {PARAMETERS.map((param) => (
              <Chip
                key={param.key}
                label={param.label}
                size="small"
                onClick={() => setSelectedParam(param.key)}
                sx={{
                  backgroundColor: selectedParam === param.key ? colors.brand.primary : colors.bg.tertiary,
                  color: selectedParam === param.key ? '#fff' : colors.text.secondary,
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: selectedParam === param.key ? colors.brand.hover : colors.border.default },
                }}
              />
            ))}
          </Box>
        </WrfCard>
      </Box>

      {/* Predicted vs Actual Chart */}
      <WrfCard
        title="Predicted vs Actual"
        subtitle={`24-hour ${PARAMETERS.find((p) => p.key === selectedParam)?.label} comparison for selected models`}
        action={<WrfBadge status="online" label="Live Tracking" size="sm" pulse />}
        sx={{ marginBottom: `${spacing.md}px` }}
      >
        <Box sx={{ height: 400 }}>
          <Line data={chartData} options={chartOptions} />
        </Box>
      </WrfCard>

      {/* Model Comparison Table */}
      <WrfCard
        title="Model Comparison"
        subtitle="Side-by-side error metric comparison across all forecast models"
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CompareIcon sx={{ color: colors.text.muted, fontSize: 18 }} />
            <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted }}>{MODELS.length} models</Typography>
          </Box>
        }
      >
        <WrfDataTable
          columns={TABLE_COLUMNS}
          data={MODELS}
          searchable
          exportable
          pagination={false}
          sx={{ border: 'none', borderRadius: 0 }}
        />
      </WrfCard>
    </Box>
  );
};

export default ForecastAccuracyTracker;
