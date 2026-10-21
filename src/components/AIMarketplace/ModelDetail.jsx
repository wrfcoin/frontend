import React, { useState, useMemo, useEffect } from 'react';
import DemoSurfaceGate from '../common/DemoSurfaceGate';
import { apiClient } from '../../services/apiClient';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Avatar,
  Rating,
  Grid,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
  IconButton,
  LinearProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  SmartToy,
  Speed,
  Memory,
  CloudUpload,
  Compare,
  Star,
  ArrowBack,
  GitHub,
  Description,
  RocketLaunch,
  TrendingUp,
  Schedule,
  GetApp,
} from '@mui/icons-material';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
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
  Filler,
  ChartTooltip,
  Legend,
);

// ---------------------------------------------------------------------------
// Chart configuration
// ---------------------------------------------------------------------------

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#94A3B8', font: { size: 11 } } },
  },
  scales: {
    x: {
      ticks: { color: '#64748B', font: { size: 10 } },
      grid: { color: '#1E293B' },
    },
    y: {
      ticks: { color: '#64748B', font: { size: 10 } },
      grid: { color: '#1E293B' },
    },
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ModelDetailSample = ({ model, onBack, onDeploy, onCompare }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    apiClient.get('/ai-marketplace/reviews')
      .then((data) => setReviews(Array.isArray(data) ? data : (data.reviews ?? [])))
      .catch(() => setReviews([]));
  }, []);

  if (!model) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography sx={{ color: '#94A3B8' }}>No model selected.</Typography>
      </Box>
    );
  }

  // Performance metrics by parameter
  const parameterMetrics = [
    { parameter: 'Temperature', rmse: model.rmse, mae: model.mae, rSquared: model.rSquared, bias: (Math.random() * 0.4 - 0.2).toFixed(3) },
    { parameter: 'Humidity', rmse: (model.rmse * 2.8 + Math.random() * 1.5).toFixed(2), mae: (model.mae * 2.5 + Math.random() * 1.2).toFixed(2), rSquared: (model.rSquared - Math.random() * 0.05).toFixed(3), bias: (Math.random() * 1.0 - 0.5).toFixed(3) },
    { parameter: 'Wind Speed', rmse: (model.rmse * 0.9 + Math.random() * 0.5).toFixed(2), mae: (model.mae * 0.8 + Math.random() * 0.4).toFixed(2), rSquared: (model.rSquared - Math.random() * 0.08).toFixed(3), bias: (Math.random() * 0.6 - 0.3).toFixed(3) },
    { parameter: 'Pressure', rmse: (0.8 + Math.random() * 0.4).toFixed(2), mae: (0.5 + Math.random() * 0.3).toFixed(2), rSquared: (0.96 + Math.random() * 0.03).toFixed(3), bias: (Math.random() * 0.3 - 0.15).toFixed(3) },
    { parameter: 'Precipitation', rmse: (2.5 + Math.random() * 2.0).toFixed(2), mae: (1.8 + Math.random() * 1.5).toFixed(2), rSquared: (0.72 + Math.random() * 0.15).toFixed(3), bias: (Math.random() * 0.8 - 0.4).toFixed(3) },
  ];

  // Skill score comparison chart data
  const skillScoreData = useMemo(() => ({
    labels: ['Temperature', 'Humidity', 'Wind Speed', 'Pressure', 'Precipitation'],
    datasets: [
      {
        label: model.name,
        data: [
          model.skillScore,
          model.skillScore - 0.05 + Math.random() * 0.1,
          model.skillScore - 0.12 + Math.random() * 0.08,
          model.skillScore + 0.05 + Math.random() * 0.05,
          model.skillScore - 0.2 + Math.random() * 0.15,
        ],
        backgroundColor: '#3B82F6',
        borderRadius: 4,
      },
      {
        label: 'Climatology Baseline',
        data: [0.0, 0.0, 0.0, 0.0, 0.0],
        backgroundColor: '#475569',
        borderRadius: 4,
      },
      {
        label: 'Persistence Baseline',
        data: [0.25, 0.2, 0.15, 0.3, 0.1],
        backgroundColor: '#64748B',
        borderRadius: 4,
      },
    ],
  }), [model]);

  // Sample predictions chart
  const predictionData = useMemo(() => {
    const hours = Array.from({ length: 48 }, (_, i) => {
      const d = new Date();
      d.setHours(d.getHours() - 48 + i);
      return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:00`;
    });

    const baseTemp = 8;
    const actual = hours.map((_, i) => baseTemp + 6 * Math.sin((i / 24) * Math.PI * 2) + (Math.random() - 0.5) * 2);
    const predicted = actual.map((v) => v + (Math.random() - 0.5) * model.rmse * 1.2);

    return {
      labels: hours,
      datasets: [
        {
          label: 'Actual',
          data: actual,
          borderColor: '#10B981',
          backgroundColor: '#10B98122',
          fill: false,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: 'Predicted',
          data: predicted,
          borderColor: '#3B82F6',
          backgroundColor: '#3B82F622',
          fill: false,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
          borderDash: [4, 4],
        },
      ],
    };
  }, [model]);

  const predictionOptions = {
    ...chartDefaults,
    plugins: {
      ...chartDefaults.plugins,
      legend: { ...chartDefaults.plugins.legend, position: 'top' },
    },
    scales: {
      ...chartDefaults.scales,
      x: {
        ...chartDefaults.scales.x,
        ticks: { ...chartDefaults.scales.x.ticks, maxTicksLimit: 12 },
      },
      y: {
        ...chartDefaults.scales.y,
        title: { display: true, text: 'Temperature (C)', color: '#64748B' },
      },
    },
  };

  // Input/output specs
  const ioSpecs = [
    { field: 'Input Parameters', value: 'Temperature, Humidity, Wind Speed/Dir, Pressure, Precipitation, Solar Radiation' },
    { field: 'Input Resolution', value: model.resolution },
    { field: 'Input History', value: '72 hours lookback' },
    { field: 'Spatial Coverage', value: model.region },
    { field: 'Output Parameters', value: 'Temperature, Humidity, Wind Speed, Pressure' },
    { field: 'Forecast Horizon', value: '1h, 6h, 24h, 72h' },
    { field: 'Output Format', value: 'JSON / NetCDF / GRIB2' },
    { field: 'Update Frequency', value: 'Every model run cycle' },
  ];

  // Deployment requirements
  const deployReqs = [
    { resource: 'Compute', value: model.requiresGPU ? 'GPU (NVIDIA T4 or better)' : 'CPU (4+ cores)', icon: <Speed sx={{ fontSize: 16 }} /> },
    { resource: 'Memory', value: `${model.memoryMB} MB`, icon: <Memory sx={{ fontSize: 16 }} /> },
    { resource: 'Inference Time', value: `${model.inferenceTime} ms`, icon: <Schedule sx={{ fontSize: 16 }} /> },
    { resource: 'Storage', value: `${(model.modelSizeMB || 145).toFixed(0)} MB`, icon: <Description sx={{ fontSize: 16 }} /> },
    { resource: 'Cost', value: `${model.costPer1k || '0.12'} WRF / 1K predictions`, icon: <TrendingUp sx={{ fontSize: 16 }} /> },
  ];

  const panelSx = {
    backgroundColor: '#1E293B',
    border: '1px solid #334155',
    borderRadius: 2,
    p: 2.5,
  };

  return (
    <Box>
      {/* Back navigation */}
      <Button
        startIcon={<ArrowBack />}
        onClick={onBack}
        sx={{ color: '#94A3B8', textTransform: 'none', mb: 2, '&:hover': { color: '#F1F5F9' } }}
      >
        Back to Marketplace
      </Button>

      {/* Model Header */}
      <Paper sx={{ ...panelSx, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              backgroundColor: '#3B82F622',
              color: '#3B82F6',
            }}
          >
            <SmartToy sx={{ fontSize: 32 }} />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography variant="h5" sx={{ color: '#F1F5F9', fontWeight: 700, mb: 0.5 }}>
              {model.name}
            </Typography>
            <Typography variant="body2" sx={{ color: '#94A3B8', mb: 1 }}>
              by {model.publisher} &middot; v{model.version || '2.1.0'} &middot;{' '}
              {model.license || 'Apache 2.0'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Rating
                value={model.rating}
                precision={0.1}
                readOnly
                size="small"
                sx={{
                  '& .MuiRating-iconFilled': { color: '#F59E0B' },
                  '& .MuiRating-iconEmpty': { color: '#334155' },
                }}
              />
              <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                {model.rating.toFixed(1)} ({model.reviewCount} reviews)
              </Typography>
              <Chip label={model.taskType} size="small" sx={{ backgroundColor: '#3B82F622', color: '#3B82F6', fontWeight: 600 }} />
              <Chip label={model.framework} size="small" sx={{ backgroundColor: '#10B98122', color: '#10B981' }} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<RocketLaunch />}
              onClick={() => onDeploy && onDeploy(model)}
              sx={{
                backgroundColor: '#3B82F6',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { backgroundColor: '#2563EB' },
              }}
            >
              Deploy to My Station
            </Button>
            <Button
              variant="outlined"
              startIcon={<Compare />}
              onClick={() => onCompare && onCompare(model)}
              sx={{
                borderColor: '#334155',
                color: '#94A3B8',
                textTransform: 'none',
                '&:hover': { borderColor: '#3B82F6', color: '#3B82F6' },
              }}
            >
              Add to Comparison
            </Button>
          </Box>
        </Box>

        {/* Quick stats row */}
        <Box
          sx={{
            display: 'flex',
            gap: 4,
            mt: 3,
            pt: 2,
            borderTop: '1px solid #334155',
            flexWrap: 'wrap',
          }}
        >
          {[
            { label: 'RMSE', value: model.rmse.toFixed(2), color: '#10B981' },
            { label: 'MAE', value: model.mae.toFixed(2), color: '#3B82F6' },
            { label: 'R-Squared', value: model.rSquared.toFixed(3), color: '#F59E0B' },
            { label: 'Skill Score', value: model.skillScore.toFixed(2), color: '#8B5CF6' },
            { label: 'Downloads', value: model.downloads.toLocaleString(), color: '#94A3B8' },
          ].map((stat) => (
            <Box key={stat.label}>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                {stat.label}
              </Typography>
              <Typography variant="h6" sx={{ color: stat.color, fontWeight: 700 }}>
                {stat.value}
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Tab navigation */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{
          mb: 3,
          '& .MuiTab-root': { color: '#64748B', textTransform: 'none', fontWeight: 600 },
          '& .Mui-selected': { color: '#3B82F6' },
          '& .MuiTabs-indicator': { backgroundColor: '#3B82F6' },
        }}
      >
        <Tab label="Performance" />
        <Tab label="Predictions" />
        <Tab label="Specifications" />
        <Tab label="Reviews" />
      </Tabs>

      {/* Tab: Performance */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Metric table */}
          <Grid item xs={12}>
            <Paper sx={panelSx}>
              <Typography variant="subtitle1" sx={{ color: '#F1F5F9', fontWeight: 700, mb: 2 }}>
                Performance by Parameter
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {['Parameter', 'RMSE', 'MAE', 'R-Squared', 'Bias'].map((h) => (
                      <TableCell
                        key={h}
                        sx={{ color: '#64748B', borderColor: '#334155', fontWeight: 600 }}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {parameterMetrics.map((row) => (
                    <TableRow key={row.parameter}>
                      <TableCell sx={{ color: '#F1F5F9', borderColor: '#334155', fontWeight: 600 }}>
                        {row.parameter}
                      </TableCell>
                      <TableCell sx={{ color: '#10B981', borderColor: '#334155' }}>
                        {typeof row.rmse === 'number' ? row.rmse.toFixed(2) : row.rmse}
                      </TableCell>
                      <TableCell sx={{ color: '#3B82F6', borderColor: '#334155' }}>
                        {typeof row.mae === 'number' ? row.mae.toFixed(2) : row.mae}
                      </TableCell>
                      <TableCell sx={{ color: '#F59E0B', borderColor: '#334155' }}>
                        {typeof row.rSquared === 'number' ? row.rSquared.toFixed(3) : row.rSquared}
                      </TableCell>
                      <TableCell sx={{ color: '#94A3B8', borderColor: '#334155' }}>
                        {row.bias}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Grid>

          {/* Skill score bar chart */}
          <Grid item xs={12}>
            <Paper sx={panelSx}>
              <Typography variant="subtitle1" sx={{ color: '#F1F5F9', fontWeight: 700, mb: 2 }}>
                Skill Score vs Baselines
              </Typography>
              <Box sx={{ height: 300 }}>
                <Bar data={skillScoreData} options={chartDefaults} />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Tab: Predictions */}
      {activeTab === 1 && (
        <Paper sx={panelSx}>
          <Typography variant="subtitle1" sx={{ color: '#F1F5F9', fontWeight: 700, mb: 2 }}>
            Sample Predictions: Last 48 Hours - Temperature (C)
          </Typography>
          <Box sx={{ height: 400 }}>
            <Line data={predictionData} options={predictionOptions} />
          </Box>
          <Typography variant="caption" sx={{ color: '#64748B', mt: 1, display: 'block' }}>
            Solid green line is observed data. Dashed blue line is model prediction.
            Shaded region indicates 95% confidence interval.
          </Typography>
        </Paper>
      )}

      {/* Tab: Specifications */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          {/* I/O specifications */}
          <Grid item xs={12} md={7}>
            <Paper sx={panelSx}>
              <Typography variant="subtitle1" sx={{ color: '#F1F5F9', fontWeight: 700, mb: 2 }}>
                Input / Output Specifications
              </Typography>
              <Table size="small">
                <TableBody>
                  {ioSpecs.map((row) => (
                    <TableRow key={row.field}>
                      <TableCell
                        sx={{
                          color: '#94A3B8',
                          borderColor: '#334155',
                          fontWeight: 600,
                          width: 180,
                        }}
                      >
                        {row.field}
                      </TableCell>
                      <TableCell sx={{ color: '#F1F5F9', borderColor: '#334155' }}>
                        {row.value}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Grid>

          {/* Deployment requirements */}
          <Grid item xs={12} md={5}>
            <Paper sx={panelSx}>
              <Typography variant="subtitle1" sx={{ color: '#F1F5F9', fontWeight: 700, mb: 2 }}>
                Deployment Requirements
              </Typography>
              {deployReqs.map((req) => (
                <Box
                  key={req.resource}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    py: 1.5,
                    borderBottom: '1px solid #334155',
                    '&:last-child': { borderBottom: 'none' },
                  }}
                >
                  <Box sx={{ color: '#3B82F6' }}>{req.icon}</Box>
                  <Typography variant="body2" sx={{ color: '#94A3B8', flex: 1 }}>
                    {req.resource}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#F1F5F9', fontWeight: 600 }}>
                    {req.value}
                  </Typography>
                </Box>
              ))}
            </Paper>

            {/* Model architecture */}
            <Paper sx={{ ...panelSx, mt: 3 }}>
              <Typography variant="subtitle1" sx={{ color: '#F1F5F9', fontWeight: 700, mb: 1 }}>
                Architecture
              </Typography>
              <Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.7 }}>
                {model.architecture ||
                  'Transformer-based encoder-decoder with spatial attention mechanism. Uses a multi-scale convolutional feature extractor for input preprocessing, followed by 8 attention layers with learned positional encoding for temporal dependencies. Output is decoded via a lightweight MLP head with residual connections.'}
              </Typography>
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  backgroundColor: '#0F172A',
                  borderRadius: 1,
                  border: '1px dashed #334155',
                  textAlign: 'center',
                }}
              >
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  [Architecture Diagram Placeholder]
                </Typography>
                <Typography variant="caption" sx={{ color: '#475569', display: 'block' }}>
                  Input (72h x 6 params) &rarr; Conv Feature Extractor &rarr; 8x Transformer Encoder &rarr; MLP Decoder &rarr; Forecast (1-72h x 4 params)
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Tab: Reviews */}
      {activeTab === 3 && (
        <Box>
          <Paper sx={{ ...panelSx, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="h4" sx={{ color: '#F59E0B', fontWeight: 700 }}>
                {model.rating.toFixed(1)}
              </Typography>
              <Box>
                <Rating
                  value={model.rating}
                  precision={0.1}
                  readOnly
                  sx={{
                    '& .MuiRating-iconFilled': { color: '#F59E0B' },
                    '& .MuiRating-iconEmpty': { color: '#334155' },
                  }}
                />
                <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block' }}>
                  {model.reviewCount} reviews
                </Typography>
              </Box>
            </Box>

            {/* Rating distribution */}
            {[5, 4, 3, 2, 1].map((stars) => {
              const pct = stars === 5 ? 48 : stars === 4 ? 32 : stars === 3 ? 14 : stars === 2 ? 4 : 2;
              return (
                <Box key={stars} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: '#94A3B8', width: 12 }}>
                    {stars}
                  </Typography>
                  <Star sx={{ fontSize: 14, color: '#F59E0B' }} />
                  <LinearProgress
                    variant="determinate"
                    value={pct}
                    sx={{
                      flex: 1,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: '#334155',
                      '& .MuiLinearProgress-bar': { backgroundColor: '#F59E0B', borderRadius: 3 },
                    }}
                  />
                  <Typography variant="caption" sx={{ color: '#64748B', width: 28 }}>
                    {pct}%
                  </Typography>
                </Box>
              );
            })}
          </Paper>

          {reviews.map((review) => (
            <Paper key={review.id} sx={{ ...panelSx, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Avatar sx={{ width: 36, height: 36, backgroundColor: '#3B82F622', color: '#3B82F6', fontSize: 14 }}>
                  {review.avatar}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ color: '#F1F5F9', fontWeight: 600 }}>
                    {review.user}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    {review.date}
                  </Typography>
                </Box>
                <Rating
                  value={review.rating}
                  precision={0.5}
                  readOnly
                  size="small"
                  sx={{
                    '& .MuiRating-iconFilled': { color: '#F59E0B' },
                    '& .MuiRating-iconEmpty': { color: '#334155' },
                  }}
                />
              </Box>
              <Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.7 }}>
                {review.comment}
              </Typography>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
};

// frontend#325: every figure in ModelDetailSample is generated in the browser; no
// route on the testnet API backs it (aiml-routes /models only exists in the
// legacy unified_api_server). Default build: honest not-live, sample never
// mounted. Demo surfaces: sample under a "Sample data" chip.
const ModelDetail = (props) => (
  <DemoSurfaceGate
    title="Model details are not live on the testnet yet"
    description="No model-metrics route is mounted on the testnet API; the per-model figures in the preview are generated in the browser."
    testId="model-detail"
    action={props.onBack ? <Button size="small" variant="outlined" onClick={props.onBack}>Back</Button> : undefined}
  >
    <ModelDetailSample {...props} />
  </DemoSurfaceGate>
);

export default ModelDetail;
