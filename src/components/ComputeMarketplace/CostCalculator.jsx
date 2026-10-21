import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  TextField,
  Slider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tooltip,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  Calculate as CalculateIcon,
  Bolt as BoltIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
  Cloud as CloudIcon,
  Speed as SpeedIcon,
  Storage as StorageIcon,
  Send as SendIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, ChartTooltip, Legend);

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

const palette = {
  bg: '#0F172A',
  card: '#1E293B',
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  border: '#334155',
};

// ---------------------------------------------------------------------------
// Constants & Mock Data
// ---------------------------------------------------------------------------

const JOB_TYPES = [
  { value: 'model_training', label: 'Model Training', baseCostPerTflop: 0.42 },
  { value: 'ensemble_forecast', label: 'Ensemble Forecast', baseCostPerTflop: 0.38 },
  { value: 'climate_simulation', label: 'Climate Simulation', baseCostPerTflop: 0.51 },
  { value: 'data_processing', label: 'Data Processing', baseCostPerTflop: 0.18 },
  { value: 'reanalysis', label: 'Reanalysis', baseCostPerTflop: 0.45 },
];

const COMPLEXITY_LEVELS = [
  { value: 'simple', label: 'Simple', multiplier: 1.0, tflopsEstimate: 12 },
  { value: 'medium', label: 'Medium', multiplier: 2.2, tflopsEstimate: 48 },
  { value: 'complex', label: 'Complex', multiplier: 4.8, tflopsEstimate: 128 },
  { value: 'ultra', label: 'Ultra', multiplier: 9.5, tflopsEstimate: 320 },
];

const RESOLUTION_OPTIONS = [
  { value: '1deg', label: '1 deg', factor: 0.5 },
  { value: '0.5deg', label: '0.5 deg', factor: 1.0 },
  { value: '0.25deg', label: '0.25 deg', factor: 2.0 },
  { value: '9km', label: '9 km', factor: 3.2 },
  { value: '3km', label: '3 km', factor: 6.5 },
  { value: '1km', label: '1 km', factor: 14.0 },
];

const CLOUD_COMPARISON = [
  { provider: 'AWS (p4d.24xlarge)', costPerTflop: 1.12, color: '#FF9900' },
  { provider: 'GCP (a2-highgpu-8g)', costPerTflop: 0.98, color: '#4285F4' },
  { provider: 'Azure (ND A100 v4)', costPerTflop: 1.05, color: '#0078D4' },
];

const VOLUME_DISCOUNT_TIERS = [
  { minWrf: 0, maxWrf: 500, discount: 0, label: 'Standard' },
  { minWrf: 500, maxWrf: 2000, discount: 5, label: 'Bronze' },
  { minWrf: 2000, maxWrf: 5000, discount: 10, label: 'Silver' },
  { minWrf: 5000, maxWrf: 15000, discount: 18, label: 'Gold' },
  { minWrf: 15000, maxWrf: Infinity, discount: 25, label: 'Platinum' },
];

const PRIORITY_OPTIONS = [
  { value: 'standard', label: 'Standard', surcharge: 0 },
  { value: 'priority', label: 'Priority', surcharge: 50 },
  { value: 'urgent', label: 'Urgent', surcharge: 150 },
];

function generateCostTrendData() {
  const labels = [];
  const data = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 86400000);
    labels.push(date.toLocaleDateString([], { month: 'short', day: 'numeric' }));
    const base = 0.35 + Math.sin(i / 5) * 0.08;
    data.push(parseFloat((base + (Math.random() - 0.5) * 0.06).toFixed(3)));
  }
  return { labels, data };
}

const COST_TREND_DATA = generateCostTrendData();

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CostCalculator = () => {
  // Form state
  const [jobType, setJobType] = useState('model_training');
  const [complexity, setComplexity] = useState('medium');
  const [dataVolume, setDataVolume] = useState(512);
  const [resolution, setResolution] = useState('3km');
  const [forecastHours, setForecastHours] = useState(72);
  const [priority, setPriority] = useState('standard');
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Cost calculation
  const costBreakdown = useMemo(() => {
    const jobConfig = JOB_TYPES.find((j) => j.value === jobType);
    const complexityConfig = COMPLEXITY_LEVELS.find((c) => c.value === complexity);
    const resolutionConfig = RESOLUTION_OPTIONS.find((r) => r.value === resolution);
    const priorityConfig = PRIORITY_OPTIONS.find((p) => p.value === priority);

    const baseTflops = complexityConfig.tflopsEstimate * resolutionConfig.factor;
    const hoursMultiplier = forecastHours / 24;
    const totalTflops = baseTflops * hoursMultiplier;

    const computeCost = totalTflops * jobConfig.baseCostPerTflop;
    const dataTransferCost = (dataVolume / 1024) * 2.5; // 2.5 WRF per GB
    const prioritySurcharge = (computeCost * priorityConfig.surcharge) / 100;
    const subtotal = computeCost + dataTransferCost + prioritySurcharge;

    // Apply volume discount
    const discountTier = VOLUME_DISCOUNT_TIERS.find(
      (t) => subtotal >= t.minWrf && subtotal < t.maxWrf,
    );
    const discount = (subtotal * (discountTier?.discount || 0)) / 100;
    const total = subtotal - discount;

    // Cloud provider comparison costs
    const cloudCosts = CLOUD_COMPARISON.map((cloud) => ({
      ...cloud,
      totalCost: totalTflops * cloud.costPerTflop + (dataVolume / 1024) * 8.0,
    }));

    const avgCloudCost = cloudCosts.reduce((sum, c) => sum + c.totalCost, 0) / cloudCosts.length;
    const savingsPercent = avgCloudCost > 0 ? Math.round(((avgCloudCost - total) / avgCloudCost) * 100) : 0;

    return {
      totalTflops: totalTflops.toFixed(1),
      computeCost: computeCost.toFixed(2),
      dataTransferCost: dataTransferCost.toFixed(2),
      prioritySurcharge: prioritySurcharge.toFixed(2),
      subtotal: subtotal.toFixed(2),
      discountTier: discountTier?.label || 'Standard',
      discountPercent: discountTier?.discount || 0,
      discount: discount.toFixed(2),
      total: total.toFixed(2),
      cloudCosts,
      savingsPercent,
    };
  }, [jobType, complexity, dataVolume, resolution, forecastHours, priority]);

  const handleSubmit = useCallback(() => {
    setShowConfirmation(true);
    setTimeout(() => setShowConfirmation(false), 3000);
  }, []);

  // Chart data for cost trend
  const costTrendChartData = useMemo(
    () => ({
      labels: COST_TREND_DATA.labels,
      datasets: [
        {
          label: 'Avg Cost per TFLOP-hr (WRF)',
          data: COST_TREND_DATA.data,
          borderColor: palette.primary,
          backgroundColor: `${palette.primary}22`,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.4,
          fill: true,
        },
      ],
    }),
    [],
  );

  const costTrendChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: palette.card,
          titleColor: palette.text,
          bodyColor: palette.textSecondary,
          borderColor: palette.border,
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: (ctx) => `${ctx.parsed.y.toFixed(3)} WRF / TFLOP-hr`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: palette.textSecondary, font: { size: 9 }, maxTicksLimit: 10 },
        },
        y: {
          grid: { color: `${palette.border}44` },
          ticks: {
            color: palette.textSecondary,
            font: { size: 10 },
            callback: (v) => `${v.toFixed(2)} WRF`,
          },
        },
      },
    }),
    [],
  );

  // Cloud comparison bar chart
  const comparisonChartData = useMemo(
    () => ({
      labels: ['WRFCoin', ...costBreakdown.cloudCosts.map((c) => c.provider.split(' ')[0])],
      datasets: [
        {
          label: 'Total Estimated Cost (WRF-equivalent)',
          data: [
            parseFloat(costBreakdown.total),
            ...costBreakdown.cloudCosts.map((c) => parseFloat(c.totalCost.toFixed(2))),
          ],
          backgroundColor: [
            `${palette.success}CC`,
            ...costBreakdown.cloudCosts.map((c) => `${c.color}CC`),
          ],
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    }),
    [costBreakdown],
  );

  const comparisonChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: palette.card,
          titleColor: palette.text,
          bodyColor: palette.textSecondary,
          borderColor: palette.border,
          borderWidth: 1,
          callbacks: {
            label: (ctx) => `${ctx.parsed.x.toFixed(2)} WRF`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: `${palette.border}44` },
          ticks: { color: palette.textSecondary, font: { size: 10 }, callback: (v) => `${v} WRF` },
        },
        y: {
          grid: { display: false },
          ticks: { color: palette.text, font: { size: 11, weight: 500 } },
        },
      },
    }),
    [],
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <CalculateIcon sx={{ color: palette.primary, fontSize: 22 }} />
        <Typography variant="subtitle1" sx={{ color: palette.text, fontWeight: 600 }}>
          Compute Cost Estimator
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {/* Job Configuration Form */}
        <Grid item xs={12} md={5}>
          <Paper
            sx={{
              bgcolor: palette.card,
              border: `1px solid ${palette.border}`,
              borderRadius: 2,
              p: 2.5,
            }}
          >
            <Typography variant="subtitle2" sx={{ color: palette.text, fontWeight: 600, mb: 2 }}>
              Job Configuration
            </Typography>

            {/* Job Type */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: palette.textSecondary, mb: 0.5, display: 'block' }}>
                Job Type
              </Typography>
              <Select
                fullWidth
                size="small"
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                sx={{
                  bgcolor: palette.bg,
                  color: palette.text,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: palette.border },
                  '& .MuiSvgIcon-root': { color: palette.textSecondary },
                }}
              >
                {JOB_TYPES.map((j) => (
                  <MenuItem key={j.value} value={j.value}>
                    {j.label}
                  </MenuItem>
                ))}
              </Select>
            </Box>

            {/* Model Complexity */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: palette.textSecondary, mb: 0.5, display: 'block' }}>
                Model Complexity
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {COMPLEXITY_LEVELS.map((c) => (
                  <Button
                    key={c.value}
                    size="small"
                    variant={complexity === c.value ? 'contained' : 'outlined'}
                    onClick={() => setComplexity(c.value)}
                    sx={{
                      flex: 1,
                      bgcolor: complexity === c.value ? palette.primary : 'transparent',
                      color: complexity === c.value ? '#fff' : palette.textSecondary,
                      borderColor: complexity === c.value ? palette.primary : palette.border,
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: 12,
                      '&:hover': {
                        bgcolor: complexity === c.value ? '#2563EB' : `${palette.primary}11`,
                        borderColor: palette.primary,
                      },
                    }}
                  >
                    {c.label}
                  </Button>
                ))}
              </Box>
              <Typography variant="caption" sx={{ color: palette.textSecondary, mt: 0.5, display: 'block', fontSize: 10 }}>
                ~{COMPLEXITY_LEVELS.find((c) => c.value === complexity)?.tflopsEstimate} TFLOPS base
                requirement
              </Typography>
            </Box>

            {/* Data Volume */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: palette.textSecondary }}>
                  Data Volume
                </Typography>
                <Typography variant="caption" sx={{ color: palette.primary, fontWeight: 600 }}>
                  {dataVolume} MB
                </Typography>
              </Box>
              <Slider
                value={dataVolume}
                onChange={(_, val) => setDataVolume(val)}
                min={64}
                max={8192}
                step={64}
                sx={{
                  color: palette.primary,
                  '& .MuiSlider-thumb': { bgcolor: palette.primary, width: 14, height: 14 },
                  '& .MuiSlider-track': { bgcolor: palette.primary },
                  '& .MuiSlider-rail': { bgcolor: palette.border },
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: 9, color: palette.textSecondary }}>64 MB</Typography>
                <Typography sx={{ fontSize: 9, color: palette.textSecondary }}>8,192 MB</Typography>
              </Box>
            </Box>

            {/* Resolution */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: palette.textSecondary, mb: 0.5, display: 'block' }}>
                Resolution
              </Typography>
              <Select
                fullWidth
                size="small"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                sx={{
                  bgcolor: palette.bg,
                  color: palette.text,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: palette.border },
                  '& .MuiSvgIcon-root': { color: palette.textSecondary },
                }}
              >
                {RESOLUTION_OPTIONS.map((r) => (
                  <MenuItem key={r.value} value={r.value}>
                    {r.label} ({r.factor}x compute factor)
                  </MenuItem>
                ))}
              </Select>
            </Box>

            {/* Forecast Hours */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: palette.textSecondary }}>
                  Forecast Hours
                </Typography>
                <Typography variant="caption" sx={{ color: palette.primary, fontWeight: 600 }}>
                  {forecastHours}h
                </Typography>
              </Box>
              <Slider
                value={forecastHours}
                onChange={(_, val) => setForecastHours(val)}
                min={6}
                max={384}
                step={6}
                sx={{
                  color: palette.primary,
                  '& .MuiSlider-thumb': { bgcolor: palette.primary, width: 14, height: 14 },
                  '& .MuiSlider-track': { bgcolor: palette.primary },
                  '& .MuiSlider-rail': { bgcolor: palette.border },
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: 9, color: palette.textSecondary }}>6h</Typography>
                <Typography sx={{ fontSize: 9, color: palette.textSecondary }}>384h (16 days)</Typography>
              </Box>
            </Box>

            {/* Priority */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: palette.textSecondary, mb: 0.5, display: 'block' }}>
                Priority
              </Typography>
              <Select
                fullWidth
                size="small"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                sx={{
                  bgcolor: palette.bg,
                  color: palette.text,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: palette.border },
                  '& .MuiSvgIcon-root': { color: palette.textSecondary },
                }}
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <MenuItem key={p.value} value={p.value}>
                    {p.label}
                    {p.surcharge > 0 ? ` (+${p.surcharge}% surcharge)` : ''}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          </Paper>
        </Grid>

        {/* Cost Breakdown Panel */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              bgcolor: palette.card,
              border: `1px solid ${palette.border}`,
              borderRadius: 2,
              p: 2.5,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <BoltIcon sx={{ color: palette.warning, fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ color: palette.text, fontWeight: 600 }}>
                Cost Breakdown
              </Typography>
            </Box>

            <Box sx={{ flex: 1 }}>
              {/* Estimated TFLOPS */}
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1.5,
                  bgcolor: `${palette.primary}11`,
                  border: `1px solid ${palette.primary}33`,
                  mb: 2,
                  textAlign: 'center',
                }}
              >
                <Typography variant="caption" sx={{ color: palette.textSecondary }}>
                  Estimated Compute
                </Typography>
                <Typography variant="h5" sx={{ color: palette.primary, fontWeight: 700 }}>
                  {costBreakdown.totalTflops} TFLOP-hrs
                </Typography>
              </Box>

              {/* Line items */}
              {[
                { label: 'Compute Cost', value: costBreakdown.computeCost, color: palette.text },
                { label: 'Data Transfer', value: costBreakdown.dataTransferCost, color: palette.text },
                {
                  label: 'Priority Surcharge',
                  value: costBreakdown.prioritySurcharge,
                  color: parseFloat(costBreakdown.prioritySurcharge) > 0 ? palette.warning : palette.textSecondary,
                },
              ].map((item) => (
                <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.8 }}>
                  <Typography variant="body2" sx={{ color: palette.textSecondary, fontSize: 13 }}>
                    {item.label}
                  </Typography>
                  <Typography variant="body2" sx={{ color: item.color, fontWeight: 500, fontSize: 13 }}>
                    {item.value} WRF
                  </Typography>
                </Box>
              ))}

              <Divider sx={{ borderColor: palette.border, my: 1 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                <Typography variant="body2" sx={{ color: palette.textSecondary, fontSize: 13 }}>
                  Subtotal
                </Typography>
                <Typography variant="body2" sx={{ color: palette.text, fontWeight: 500, fontSize: 13 }}>
                  {costBreakdown.subtotal} WRF
                </Typography>
              </Box>

              {/* Volume Discount */}
              {costBreakdown.discountPercent > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2" sx={{ color: palette.success, fontSize: 13 }}>
                      Volume Discount
                    </Typography>
                    <Chip
                      label={costBreakdown.discountTier}
                      size="small"
                      sx={{
                        bgcolor: `${palette.success}22`,
                        color: palette.success,
                        fontWeight: 600,
                        fontSize: 9,
                        height: 18,
                      }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: palette.success, fontWeight: 500, fontSize: 13 }}>
                    -{costBreakdown.discount} WRF
                  </Typography>
                </Box>
              )}

              <Divider sx={{ borderColor: palette.border, my: 1 }} />

              {/* Total */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 1,
                }}
              >
                <Typography variant="body1" sx={{ color: palette.text, fontWeight: 700 }}>
                  Total
                </Typography>
                <Typography variant="h5" sx={{ color: palette.warning, fontWeight: 700 }}>
                  {parseFloat(costBreakdown.total).toLocaleString()} WRF
                </Typography>
              </Box>

              {/* Savings vs Cloud */}
              {costBreakdown.savingsPercent > 0 && (
                <Box
                  sx={{
                    mt: 1,
                    p: 1.5,
                    borderRadius: 1.5,
                    bgcolor: `${palette.success}11`,
                    border: `1px solid ${palette.success}33`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <TrendingDownIcon sx={{ color: palette.success, fontSize: 20 }} />
                  <Box>
                    <Typography variant="body2" sx={{ color: palette.success, fontWeight: 700 }}>
                      {costBreakdown.savingsPercent}% savings
                    </Typography>
                    <Typography variant="caption" sx={{ color: palette.textSecondary, fontSize: 10 }}>
                      vs. average cloud provider cost
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>

            {/* Submit Button */}
            <Button
              fullWidth
              variant="contained"
              startIcon={showConfirmation ? <CheckCircleIcon /> : <SendIcon />}
              onClick={handleSubmit}
              sx={{
                mt: 2,
                bgcolor: showConfirmation ? palette.success : palette.primary,
                textTransform: 'none',
                fontWeight: 600,
                py: 1.2,
                '&:hover': { bgcolor: showConfirmation ? '#059669' : '#2563EB' },
              }}
            >
              {showConfirmation ? 'Job Submitted Successfully' : `Submit Job (${parseFloat(costBreakdown.total).toLocaleString()} WRF)`}
            </Button>
          </Paper>
        </Grid>

        {/* Cloud Provider Comparison */}
        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              bgcolor: palette.card,
              border: `1px solid ${palette.border}`,
              borderRadius: 2,
              p: 2.5,
              height: '100%',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CloudIcon sx={{ color: palette.primary, fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ color: palette.text, fontWeight: 600 }}>
                Provider Comparison
              </Typography>
            </Box>

            <Box sx={{ height: 180, mb: 2 }}>
              <Bar data={comparisonChartData} options={comparisonChartOptions} />
            </Box>

            <Divider sx={{ borderColor: palette.border, mb: 2 }} />

            {/* Comparison Table */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {/* WRFCoin row */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 1,
                  borderRadius: 1,
                  bgcolor: `${palette.success}11`,
                  border: `1px solid ${palette.success}33`,
                }}
              >
                <Typography variant="caption" sx={{ color: palette.success, fontWeight: 600 }}>
                  WRFCoin
                </Typography>
                <Typography variant="caption" sx={{ color: palette.success, fontWeight: 700 }}>
                  {parseFloat(costBreakdown.total).toLocaleString()} WRF
                </Typography>
              </Box>

              {/* Cloud providers */}
              {costBreakdown.cloudCosts.map((cloud) => {
                const providerShort = cloud.provider.split(' ')[0];
                const savings = Math.round(
                  ((cloud.totalCost - parseFloat(costBreakdown.total)) / cloud.totalCost) * 100,
                );
                return (
                  <Box
                    key={cloud.provider}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 1,
                      borderRadius: 1,
                      bgcolor: `${palette.border}44`,
                    }}
                  >
                    <Typography variant="caption" sx={{ color: palette.textSecondary, fontWeight: 500 }}>
                      {providerShort}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" sx={{ color: palette.text, fontWeight: 600 }}>
                        {cloud.totalCost.toFixed(2)} WRF
                      </Typography>
                      {savings > 0 && (
                        <Chip
                          label={`-${savings}%`}
                          size="small"
                          sx={{
                            bgcolor: `${palette.success}22`,
                            color: palette.success,
                            fontWeight: 600,
                            fontSize: 9,
                            height: 18,
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Grid>

        {/* Historical Cost Trends */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 2, p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon sx={{ color: palette.primary, fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ color: palette.text, fontWeight: 600 }}>
                  Network Cost Trend (30 Days)
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ color: palette.textSecondary }}>
                  Current avg:
                </Typography>
                <Chip
                  label={`${COST_TREND_DATA.data[COST_TREND_DATA.data.length - 1]} WRF/TFLOP-hr`}
                  size="small"
                  sx={{
                    bgcolor: `${palette.primary}22`,
                    color: palette.primary,
                    fontWeight: 600,
                    fontSize: 10,
                    height: 22,
                  }}
                />
              </Box>
            </Box>
            <Box sx={{ height: 200 }}>
              <Line data={costTrendChartData} options={costTrendChartOptions} />
            </Box>
          </Paper>
        </Grid>

        {/* Volume Discount Tiers */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 2, p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <StorageIcon sx={{ color: palette.warning, fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ color: palette.text, fontWeight: 600 }}>
                Volume Discount Tiers
              </Typography>
            </Box>
            <TableContainer sx={{ bgcolor: 'transparent' }}>
              <Table size="small">
                <TableHead>
                  <TableRow
                    sx={{
                      '& th': {
                        borderBottom: `1px solid ${palette.border}`,
                        color: palette.textSecondary,
                        fontWeight: 600,
                        fontSize: 11,
                        py: 1,
                      },
                    }}
                  >
                    <TableCell>Tier</TableCell>
                    <TableCell>Spend Range (WRF)</TableCell>
                    <TableCell align="center">Discount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {VOLUME_DISCOUNT_TIERS.map((tier) => {
                    const currentTotal = parseFloat(costBreakdown.subtotal);
                    const isCurrentTier = currentTotal >= tier.minWrf && currentTotal < tier.maxWrf;
                    return (
                      <TableRow
                        key={tier.label}
                        sx={{
                          '& td': {
                            borderBottom: `1px solid ${palette.border}`,
                            color: palette.text,
                            fontSize: 12,
                            py: 1,
                          },
                          bgcolor: isCurrentTier ? `${palette.primary}11` : 'transparent',
                          '&:hover': { bgcolor: `${palette.primary}08` },
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: isCurrentTier ? 700 : 500, fontSize: 12, color: isCurrentTier ? palette.primary : palette.text }}>
                              {tier.label}
                            </Typography>
                            {isCurrentTier && (
                              <Chip
                                label="Current"
                                size="small"
                                sx={{
                                  bgcolor: `${palette.primary}22`,
                                  color: palette.primary,
                                  fontWeight: 600,
                                  fontSize: 9,
                                  height: 16,
                                }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: palette.textSecondary, fontSize: 12 }}>
                            {tier.minWrf.toLocaleString()} - {tier.maxWrf === Infinity ? 'Unlimited' : tier.maxWrf.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={tier.discount > 0 ? `${tier.discount}%` : '-'}
                            size="small"
                            sx={{
                              bgcolor: tier.discount > 0 ? `${palette.success}22` : `${palette.border}44`,
                              color: tier.discount > 0 ? palette.success : palette.textSecondary,
                              fontWeight: 600,
                              fontSize: 11,
                              height: 22,
                              minWidth: 44,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CostCalculator;
