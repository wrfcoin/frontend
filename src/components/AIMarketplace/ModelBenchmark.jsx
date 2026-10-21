import React, { useState, useMemo } from 'react';
import DemoSurfaceGate from '../common/DemoSurfaceGate';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Grid,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Compare,
  Close,
  SmartToy,
  TrendingUp,
  EmojiObjects,
  Add,
} from '@mui/icons-material';
import { Radar, Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler,
  ChartTooltip,
  Legend,
);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
const MAX_COMPARE = 4;

const DIMENSION_LABELS = ['Accuracy', 'Speed', 'Memory Eff.', 'Coverage', 'Reliability'];

const PARAMETER_LABELS = [
  'Temperature',
  'Humidity',
  'Wind Speed',
  'Pressure',
  'Precipitation',
];

// Generate realistic parameter RMSE for a model based on its base RMSE
const parameterRmse = (baseRmse) => [
  baseRmse,
  baseRmse * 2.6 + Math.random() * 1.0,
  baseRmse * 0.85 + Math.random() * 0.4,
  0.7 + Math.random() * 0.4,
  2.2 + Math.random() * 1.8,
];

// Generate radar scores (0-100) for a model
const radarScores = (model) => {
  const accuracy = Math.min(100, Math.max(0, (1 - model.rmse / 4) * 100));
  const speed = Math.min(100, Math.max(0, (1 - model.inferenceTime / 500) * 100));
  const memory = Math.min(100, Math.max(0, (1 - model.memoryMB / 4096) * 100));
  const coverage = model.region === 'Global' ? 92 : model.region === 'Americas' ? 65 : model.region === 'Europe' ? 58 : 52;
  const reliability = 70 + model.rSquared * 25;
  return [accuracy, speed, memory, coverage + Math.random() * 8, reliability];
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ModelBenchmarkSample = ({ allModels = [], selectedModels = [], onModelsChange, onDeploy }) => {
  const [localSelected, setLocalSelected] = useState(selectedModels.slice(0, MAX_COMPARE));

  const selected = localSelected.length > 0 ? localSelected : selectedModels.slice(0, MAX_COMPARE);

  const setSelected = (models) => {
    setLocalSelected(models);
    if (onModelsChange) onModelsChange(models);
  };

  const addModel = (modelId) => {
    if (selected.length >= MAX_COMPARE) return;
    const model = allModels.find((m) => m.id === modelId);
    if (model && !selected.find((s) => s.id === model.id)) {
      setSelected([...selected, model]);
    }
  };

  const removeModel = (modelId) => {
    setSelected(selected.filter((m) => m.id !== modelId));
  };

  const availableToAdd = allModels.filter((m) => !selected.find((s) => s.id === m.id));

  // Radar chart data
  const radarData = useMemo(() => ({
    labels: DIMENSION_LABELS,
    datasets: selected.map((model, i) => ({
      label: model.name,
      data: radarScores(model),
      borderColor: CHART_COLORS[i],
      backgroundColor: `${CHART_COLORS[i]}22`,
      borderWidth: 2,
      pointRadius: 4,
      pointBackgroundColor: CHART_COLORS[i],
    })),
  }), [selected]);

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#94A3B8', font: { size: 11 }, boxWidth: 12, padding: 16 },
      },
    },
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: { color: '#64748B', backdropColor: 'transparent', font: { size: 9 }, stepSize: 20 },
        grid: { color: '#334155' },
        angleLines: { color: '#334155' },
        pointLabels: { color: '#94A3B8', font: { size: 11 } },
      },
    },
  };

  // Bar chart: RMSE by parameter
  const rmseBarData = useMemo(() => ({
    labels: PARAMETER_LABELS,
    datasets: selected.map((model, i) => ({
      label: model.name,
      data: parameterRmse(model.rmse),
      backgroundColor: CHART_COLORS[i],
      borderRadius: 4,
    })),
  }), [selected]);

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#94A3B8', font: { size: 11 }, boxWidth: 12, padding: 16 },
      },
    },
    scales: {
      x: {
        ticks: { color: '#64748B', font: { size: 10 } },
        grid: { color: '#1E293B' },
      },
      y: {
        title: { display: true, text: 'RMSE', color: '#64748B', font: { size: 10 } },
        ticks: { color: '#64748B', font: { size: 10 } },
        grid: { color: '#1E293B' },
      },
    },
  };

  // Time series overlay: all models predicting the same test data
  const timeSeriesData = useMemo(() => {
    const hours = Array.from({ length: 72 }, (_, i) => `T+${i}h`);
    const baseTemp = 12;
    const actual = hours.map((_, i) =>
      baseTemp + 7 * Math.sin((i / 24) * Math.PI * 2) + (Math.random() - 0.5) * 1.5,
    );

    const datasets = [
      {
        label: 'Observed',
        data: actual,
        borderColor: '#94A3B8',
        backgroundColor: '#94A3B822',
        borderWidth: 2.5,
        tension: 0.3,
        pointRadius: 0,
        borderDash: [],
      },
      ...selected.map((model, i) => ({
        label: model.name,
        data: actual.map((v) => v + (Math.random() - 0.5) * model.rmse * 1.5),
        borderColor: CHART_COLORS[i],
        backgroundColor: `${CHART_COLORS[i]}11`,
        borderWidth: 1.5,
        tension: 0.3,
        pointRadius: 0,
        borderDash: [4, 3],
      })),
    ];

    return { labels: hours, datasets };
  }, [selected]);

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#94A3B8', font: { size: 11 }, boxWidth: 12, padding: 16 },
      },
    },
    scales: {
      x: {
        ticks: { color: '#64748B', font: { size: 9 }, maxTicksLimit: 18 },
        grid: { color: '#1E293B' },
      },
      y: {
        title: { display: true, text: 'Temperature (C)', color: '#64748B', font: { size: 10 } },
        ticks: { color: '#64748B', font: { size: 10 } },
        grid: { color: '#1E293B' },
      },
    },
  };

  // Recommendation engine
  const recommendation = useMemo(() => {
    if (selected.length < 2) return null;
    const best = [...selected].sort((a, b) => a.rmse - b.rmse)[0];
    const fastest = [...selected].sort((a, b) => a.inferenceTime - b.inferenceTime)[0];
    const cheapest = [...selected].sort(
      (a, b) => parseFloat(a.costPer1k || '0.12') - parseFloat(b.costPer1k || '0.12'),
    )[0];
    return { best, fastest, cheapest };
  }, [selected]);

  const panelSx = {
    backgroundColor: '#1E293B',
    border: '1px solid #334155',
    borderRadius: 2,
    p: 2.5,
  };

  // Cost data for comparison
  const costData = selected.map((m) => ({
    name: m.name,
    costPer1k: parseFloat(m.costPer1k || (0.08 + m.rmse * 0.03).toFixed(2)),
    dailyCostEstimate: parseFloat(((parseFloat(m.costPer1k || (0.08 + m.rmse * 0.03).toFixed(2))) * 24).toFixed(2)),
  }));

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Compare sx={{ color: '#3B82F6', fontSize: 28 }} />
        <Typography variant="h5" sx={{ color: '#F1F5F9', fontWeight: 700 }}>
          Model Benchmark
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B', ml: 1 }}>
          Compare up to {MAX_COMPARE} models side-by-side
        </Typography>
      </Box>

      {/* Model selection row */}
      <Paper sx={{ ...panelSx, mb: 3 }}>
        <Typography variant="subtitle2" sx={{ color: '#94A3B8', mb: 1.5, fontWeight: 600 }}>
          Selected Models ({selected.length}/{MAX_COMPARE})
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
          {selected.map((model, i) => (
            <Chip
              key={model.id}
              avatar={
                <Avatar sx={{ backgroundColor: `${CHART_COLORS[i]}44`, color: CHART_COLORS[i] }}>
                  <SmartToy sx={{ fontSize: 16 }} />
                </Avatar>
              }
              label={model.name}
              onDelete={() => removeModel(model.id)}
              deleteIcon={<Close sx={{ fontSize: 16 }} />}
              sx={{
                backgroundColor: `${CHART_COLORS[i]}18`,
                color: '#F1F5F9',
                borderColor: CHART_COLORS[i],
                border: '1px solid',
                fontWeight: 600,
                '& .MuiChip-deleteIcon': { color: '#64748B', '&:hover': { color: '#EF4444' } },
              }}
            />
          ))}
          {selected.length < MAX_COMPARE && availableToAdd.length > 0 && (
            <Select
              value=""
              onChange={(e) => addModel(e.target.value)}
              displayEmpty
              size="small"
              renderValue={() => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Add sx={{ fontSize: 16 }} />
                  <span>Add Model</span>
                </Box>
              )}
              sx={{
                minWidth: 160,
                color: '#94A3B8',
                '.MuiOutlinedInput-notchedOutline': { borderColor: '#334155', borderStyle: 'dashed' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3B82F6' },
                '.MuiSvgIcon-root': { color: '#64748B' },
                fontSize: '0.85rem',
                height: 36,
              }}
            >
              {availableToAdd.slice(0, 20).map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.name}
                </MenuItem>
              ))}
            </Select>
          )}
        </Box>
      </Paper>

      {selected.length < 2 && (
        <Paper sx={{ ...panelSx, textAlign: 'center', py: 8 }}>
          <Compare sx={{ fontSize: 48, color: '#334155', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#94A3B8' }}>
            Select at least 2 models to compare
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', mt: 1 }}>
            Use the selector above or click "Compare" on model cards in the Browse tab
          </Typography>
        </Paper>
      )}

      {selected.length >= 2 && (
        <>
          {/* Charts row */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Radar chart */}
            <Grid item xs={12} md={6}>
              <Paper sx={panelSx}>
                <Typography variant="subtitle1" sx={{ color: '#F1F5F9', fontWeight: 700, mb: 2 }}>
                  Multi-Dimensional Comparison
                </Typography>
                <Box sx={{ height: 340 }}>
                  <Radar data={radarData} options={radarOptions} />
                </Box>
              </Paper>
            </Grid>

            {/* RMSE by parameter bar chart */}
            <Grid item xs={12} md={6}>
              <Paper sx={panelSx}>
                <Typography variant="subtitle1" sx={{ color: '#F1F5F9', fontWeight: 700, mb: 2 }}>
                  RMSE by Weather Parameter
                </Typography>
                <Box sx={{ height: 340 }}>
                  <Bar data={rmseBarData} options={barOptions} />
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Metric comparison table */}
          <Paper sx={{ ...panelSx, mb: 3, overflow: 'auto' }}>
            <Typography variant="subtitle1" sx={{ color: '#F1F5F9', fontWeight: 700, mb: 2 }}>
              Full Metrics Comparison
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#64748B', borderColor: '#334155', fontWeight: 600, minWidth: 140 }}>
                    Metric
                  </TableCell>
                  {selected.map((m, i) => (
                    <TableCell
                      key={m.id}
                      sx={{
                        color: CHART_COLORS[i],
                        borderColor: '#334155',
                        fontWeight: 700,
                        minWidth: 120,
                      }}
                    >
                      {m.name}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  { label: 'RMSE', key: 'rmse', format: (v) => v.toFixed(2), best: 'min' },
                  { label: 'MAE', key: 'mae', format: (v) => v.toFixed(2), best: 'min' },
                  { label: 'R-Squared', key: 'rSquared', format: (v) => v.toFixed(3), best: 'max' },
                  { label: 'Skill Score', key: 'skillScore', format: (v) => v.toFixed(2), best: 'max' },
                  { label: 'Rating', key: 'rating', format: (v) => `${v.toFixed(1)} / 5`, best: 'max' },
                  { label: 'Framework', key: 'framework', format: (v) => v, best: null },
                  { label: 'Resolution', key: 'resolution', format: (v) => v, best: null },
                  { label: 'Region', key: 'region', format: (v) => v, best: null },
                  { label: 'Inference Time', key: 'inferenceTime', format: (v) => `${v} ms`, best: 'min' },
                  { label: 'Memory', key: 'memoryMB', format: (v) => `${v} MB`, best: 'min' },
                  { label: 'GPU Required', key: 'requiresGPU', format: (v) => (v ? 'Yes' : 'No'), best: null },
                  { label: 'Downloads', key: 'downloads', format: (v) => v.toLocaleString(), best: 'max' },
                ].map((metric) => {
                  const values = selected.map((m) => m[metric.key]);
                  let bestIdx = -1;
                  if (metric.best && typeof values[0] === 'number') {
                    const numericValues = values.map(Number);
                    bestIdx = metric.best === 'min'
                      ? numericValues.indexOf(Math.min(...numericValues))
                      : numericValues.indexOf(Math.max(...numericValues));
                  }

                  return (
                    <TableRow key={metric.label}>
                      <TableCell sx={{ color: '#94A3B8', borderColor: '#334155', fontWeight: 600 }}>
                        {metric.label}
                      </TableCell>
                      {selected.map((m, i) => (
                        <TableCell
                          key={m.id}
                          sx={{
                            color: i === bestIdx ? '#10B981' : '#F1F5F9',
                            borderColor: '#334155',
                            fontWeight: i === bestIdx ? 700 : 400,
                          }}
                        >
                          {metric.format(m[metric.key])}
                          {i === bestIdx && (
                            <Chip
                              label="Best"
                              size="small"
                              sx={{
                                ml: 1,
                                height: 18,
                                fontSize: '0.6rem',
                                backgroundColor: '#10B98122',
                                color: '#10B981',
                                fontWeight: 700,
                              }}
                            />
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Paper>

          {/* Time series overlay */}
          <Paper sx={{ ...panelSx, mb: 3 }}>
            <Typography variant="subtitle1" sx={{ color: '#F1F5F9', fontWeight: 700, mb: 2 }}>
              Prediction Overlay: 72-Hour Temperature Forecast
            </Typography>
            <Box sx={{ height: 350 }}>
              <Line data={timeSeriesData} options={lineOptions} />
            </Box>
            <Typography variant="caption" sx={{ color: '#64748B', mt: 1, display: 'block' }}>
              Solid gray line shows observed data. Dashed colored lines show each model's prediction.
            </Typography>
          </Paper>

          {/* Cost comparison */}
          <Paper sx={{ ...panelSx, mb: 3 }}>
            <Typography variant="subtitle1" sx={{ color: '#F1F5F9', fontWeight: 700, mb: 2 }}>
              Cost Comparison
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#64748B', borderColor: '#334155', fontWeight: 600 }}>
                    Model
                  </TableCell>
                  <TableCell sx={{ color: '#64748B', borderColor: '#334155', fontWeight: 600 }}>
                    Cost per 1K Predictions
                  </TableCell>
                  <TableCell sx={{ color: '#64748B', borderColor: '#334155', fontWeight: 600 }}>
                    Est. Daily Cost (24 runs)
                  </TableCell>
                  <TableCell sx={{ color: '#64748B', borderColor: '#334155', fontWeight: 600 }}>
                    Est. Monthly Cost
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {costData.map((c, i) => (
                  <TableRow key={c.name}>
                    <TableCell sx={{ color: CHART_COLORS[i], borderColor: '#334155', fontWeight: 600 }}>
                      {c.name}
                    </TableCell>
                    <TableCell sx={{ color: '#F1F5F9', borderColor: '#334155' }}>
                      {c.costPer1k} WRF
                    </TableCell>
                    <TableCell sx={{ color: '#F1F5F9', borderColor: '#334155' }}>
                      {c.dailyCostEstimate} WRF
                    </TableCell>
                    <TableCell sx={{ color: '#F1F5F9', borderColor: '#334155' }}>
                      {(c.dailyCostEstimate * 30).toFixed(2)} WRF
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          {/* Recommendation engine */}
          {recommendation && (
            <Paper sx={{ ...panelSx, background: 'linear-gradient(135deg, #1E293B 0%, #1E3A5F 100%)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <EmojiObjects sx={{ color: '#F59E0B', fontSize: 24 }} />
                <Typography variant="subtitle1" sx={{ color: '#F1F5F9', fontWeight: 700 }}>
                  Recommendations for Your Use Case
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, backgroundColor: '#10B98118', borderRadius: 2, border: '1px solid #10B98133' }}>
                    <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 600 }}>
                      BEST ACCURACY
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#F1F5F9', fontWeight: 700 }}>
                      {recommendation.best.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                      RMSE: {recommendation.best.rmse.toFixed(2)} | Ideal for research-grade forecasting
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, backgroundColor: '#3B82F618', borderRadius: 2, border: '1px solid #3B82F633' }}>
                    <Typography variant="caption" sx={{ color: '#3B82F6', fontWeight: 600 }}>
                      FASTEST INFERENCE
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#F1F5F9', fontWeight: 700 }}>
                      {recommendation.fastest.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                      {recommendation.fastest.inferenceTime}ms | Best for real-time applications
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, backgroundColor: '#F59E0B18', borderRadius: 2, border: '1px solid #F59E0B33' }}>
                    <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 600 }}>
                      MOST COST-EFFECTIVE
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#F1F5F9', fontWeight: 700 }}>
                      {recommendation.cheapest.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                      {parseFloat(recommendation.cheapest.costPer1k || '0.10').toFixed(2)} WRF/1K | Best value per prediction
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          )}
        </>
      )}
    </Box>
  );
};

// frontend#325: every figure in ModelBenchmarkSample is generated in the browser; no
// route on the testnet API backs it (aiml-routes /models only exists in the
// legacy unified_api_server). Default build: honest not-live, sample never
// mounted. Demo surfaces: sample under a "Sample data" chip.
const ModelBenchmark = (props) => (
  <DemoSurfaceGate
    title="Model benchmarks are not live on the testnet yet"
    description="No benchmark route is mounted on the testnet API; the RMSE, skill and bias series in the preview are generated in the browser."
    testId="model-benchmark"
  >
    <ModelBenchmarkSample {...props} />
  </DemoSurfaceGate>
);

export default ModelBenchmark;
