import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Chip,
  Tooltip,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  Cloud as CloudIcon,
  TrendingUp as TrendingUpIcon,
  Bolt as BoltIcon,
  PlayArrow as PlayArrowIcon,
  Storage as StorageIcon,
  Timer as TimerIcon,
  Public as PublicIcon,
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import JobQueue from './JobQueue';
import ResourceDashboard from './ResourceDashboard';
import ResourcePool from './ResourcePool';
import CostCalculator from './CostCalculator';
import FEATURES from '../../config/features';
import PublicViewerNotice from '../common/PublicViewerNotice';

// frontend#301 — every network stat, featured job, contributor-earnings row
// and the "Pending Payout" figure below is a hard-coded illustration. No
// compute-marketplace route is served by the main API (capability
// `computeMarketplace` = unavailable, backend#1130): compute_networks_server
// runs only as an optional local microservice. The sample dashboard renders
// only when FEATURES.demoSurfaces is explicitly on, under a page banner and
// "Sample data" badges; the default build shows the honest not-live state.
const SAMPLE_BADGE_SX = { bgcolor: 'rgba(245, 158, 11, 0.16)', color: '#F59E0B', fontWeight: 600, height: 22 };

const SampleBadge = ({ testId }) => (
  <Chip label="Sample data" size="small" data-testid={testId} sx={SAMPLE_BADGE_SX} />
);

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, ChartTooltip, Legend);

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

const palette = {
  bg: '#0F172A',
  card: '#1E293B',
  cardHover: '#253348',
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  border: '#334155',
};

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const NETWORK_STATS = {
  totalTflops: 847.3,
  activeContributors: 1248,
  jobsRunning: 89,
  avgSavingsVsAws: 62,
};

const JOB_SUMMARY = {
  running: 89,
  queued: 134,
  completedLast24h: 312,
};

const FEATURED_JOBS = [
  {
    id: 'FJ-001',
    name: 'WRF Model Training',
    type: 'Model Training',
    submitter: '0x7a3B...f29C',
    progress: 67,
    gpuCount: 24,
    costWrf: 1840,
    eta: '4h 12m',
    description: 'Training WRF v4.5 mesoscale model on 3-year ECMWF reanalysis dataset at 3km resolution.',
  },
  {
    id: 'FJ-002',
    name: 'Global Ensemble Run',
    type: 'Ensemble Forecast',
    submitter: '0x2eF1...a83D',
    progress: 23,
    gpuCount: 48,
    costWrf: 4200,
    eta: '11h 45m',
    description: '50-member global ensemble forecast at 0.25-degree resolution for 10-day prediction window.',
  },
  {
    id: 'FJ-003',
    name: 'Historical Reanalysis',
    type: 'Reanalysis',
    submitter: '0xbC44...12eA',
    progress: 91,
    gpuCount: 16,
    costWrf: 920,
    eta: '1h 08m',
    description: 'ERA5 downscaling reanalysis for North American domain, 1990-2020, hourly output.',
  },
];

const CONTRIBUTOR_EARNINGS = {
  today: 12.8,
  thisWeek: 84.5,
  thisMonth: 342.1,
  allTime: 4218.7,
  pendingPayout: 84.5,
};

function generateUtilizationData() {
  const labels = [];
  const data = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 3600000);
    labels.push(hour.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    // simulate a daily pattern: lower at night, higher during day
    const base = 55 + 25 * Math.sin(((24 - i) / 24) * Math.PI);
    data.push(Math.min(100, Math.max(20, base + (Math.random() - 0.5) * 15)));
  }
  return { labels, data };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({ icon, label, value, suffix, color, subtext }) {
  return (
    <Card
      sx={{
        bgcolor: palette.card,
        border: `1px solid ${palette.border}`,
        borderRadius: 2,
        transition: 'border-color 0.2s',
        '&:hover': { borderColor: color || palette.primary },
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: `${color || palette.primary}22`,
            }}
          >
            {React.cloneElement(icon, { sx: { color: color || palette.primary, fontSize: 22 } })}
          </Box>
          <Typography variant="body2" sx={{ color: palette.textSecondary, fontWeight: 500 }}>
            {label}
          </Typography>
        </Box>
        <Typography variant="h4" sx={{ color: palette.text, fontWeight: 700, lineHeight: 1.2 }}>
          {value}
          {suffix && (
            <Typography component="span" sx={{ fontSize: 16, color: palette.textSecondary, ml: 0.5, fontWeight: 500 }}>
              {suffix}
            </Typography>
          )}
        </Typography>
        {subtext && (
          <Typography variant="caption" sx={{ color: palette.textSecondary, mt: 0.5, display: 'block' }}>
            {subtext}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

function FeaturedJobCard({ job }) {
  const statusColor =
    job.progress >= 90 ? palette.success : job.progress >= 50 ? palette.primary : palette.warning;

  return (
    <Paper
      sx={{
        bgcolor: palette.card,
        border: `1px solid ${palette.border}`,
        borderRadius: 2,
        p: 2.5,
        transition: 'border-color 0.2s, transform 0.15s',
        '&:hover': { borderColor: palette.primary, transform: 'translateY(-2px)' },
        cursor: 'pointer',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ color: palette.text, fontWeight: 600 }}>
            {job.name}
          </Typography>
          <Chip
            label={job.type}
            size="small"
            sx={{
              bgcolor: `${palette.primary}22`,
              color: palette.primary,
              fontWeight: 500,
              fontSize: 11,
              height: 22,
              mt: 0.5,
            }}
          />
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="body2" sx={{ color: palette.warning, fontWeight: 600 }}>
            {job.costWrf.toLocaleString()} WRF
          </Typography>
          <Typography variant="caption" sx={{ color: palette.textSecondary }}>
            {job.gpuCount} GPUs
          </Typography>
        </Box>
      </Box>

      <Typography variant="body2" sx={{ color: palette.textSecondary, mb: 2, fontSize: 12, lineHeight: 1.5 }}>
        {job.description}
      </Typography>

      <Box sx={{ mb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" sx={{ color: palette.textSecondary }}>
            Progress
          </Typography>
          <Typography variant="caption" sx={{ color: statusColor, fontWeight: 600 }}>
            {job.progress}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={job.progress}
          sx={{
            height: 6,
            borderRadius: 3,
            bgcolor: `${statusColor}22`,
            '& .MuiLinearProgress-bar': { bgcolor: statusColor, borderRadius: 3 },
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" sx={{ color: palette.textSecondary }}>
          ETA: {job.eta}
        </Typography>
        <Typography variant="caption" sx={{ color: palette.textSecondary }}>
          by {job.submitter}
        </Typography>
      </Box>
    </Paper>
  );
}

function EarningsSummaryPanel({ earnings }) {
  const rows = [
    { label: 'Today', value: earnings.today, color: palette.success },
    { label: 'This Week', value: earnings.thisWeek, color: palette.primary },
    { label: 'This Month', value: earnings.thisMonth, color: palette.warning },
    { label: 'All Time', value: earnings.allTime, color: palette.text },
  ];

  return (
    <Paper sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 2, p: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <TrendingUpIcon sx={{ color: palette.success, fontSize: 20 }} />
        <Typography variant="subtitle1" sx={{ color: palette.text, fontWeight: 600 }}>
          Contributor Earnings
        </Typography>
        <SampleBadge testId="compute-earnings-sample-badge" />
      </Box>
      {rows.map((row, i) => (
        <Box key={row.label}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
            <Typography variant="body2" sx={{ color: palette.textSecondary }}>
              {row.label}
            </Typography>
            <Typography variant="body2" sx={{ color: row.color, fontWeight: 600 }}>
              {row.value.toLocaleString()} WRF
            </Typography>
          </Box>
          {i < rows.length - 1 && <Divider sx={{ borderColor: palette.border }} />}
        </Box>
      ))}
      <Box
        sx={{
          mt: 2,
          p: 1.5,
          borderRadius: 1.5,
          bgcolor: `${palette.success}11`,
          border: `1px solid ${palette.success}33`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="body2" sx={{ color: palette.success, fontWeight: 500 }}>
          Pending Payout (sample — nothing is payable)
        </Typography>
        <Typography variant="body2" sx={{ color: palette.success, fontWeight: 700 }}>
          {earnings.pendingPayout} WRF
        </Typography>
      </Box>
    </Paper>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const ComputeMarketplaceSample = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [mode, setMode] = useState('contribute'); // 'contribute' | 'submit'
  const [utilizationData] = useState(() => generateUtilizationData());

  const handleTabChange = useCallback((_, newValue) => {
    setActiveTab(newValue);
  }, []);

  const chartData = useMemo(
    () => ({
      labels: utilizationData.labels,
      datasets: [
        {
          label: 'Network Utilization %',
          data: utilizationData.data,
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
    [utilizationData],
  );

  const chartOptions = useMemo(
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
            label: (ctx) => `${ctx.parsed.y.toFixed(1)}% utilization`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: `${palette.border}44` },
          ticks: { color: palette.textSecondary, font: { size: 10 }, maxTicksLimit: 8 },
        },
        y: {
          min: 0,
          max: 100,
          grid: { color: `${palette.border}44` },
          ticks: {
            color: palette.textSecondary,
            font: { size: 10 },
            callback: (v) => `${v}%`,
          },
        },
      },
    }),
    [],
  );

  // Tab content
  const tabContent = useMemo(() => {
    switch (activeTab) {
    case 0:
      return <JobQueue />;
    case 1:
      return <ResourceDashboard />;
    case 2:
      return <ResourcePool />;
    case 3:
      return <CostCalculator />;
    default:
      return null;
    }
  }, [activeTab]);

  return (
    <Box sx={{ bgcolor: palette.bg, minHeight: '100vh', p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ color: palette.text, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Compute Marketplace
          </Typography>
          <Typography variant="body2" sx={{ color: palette.textSecondary, mt: 0.5 }}>
            Decentralized GPU/CPU resources for weather science computing
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={mode === 'contribute' ? 'contained' : 'outlined'}
            startIcon={<MemoryIcon />}
            onClick={() => setMode('contribute')}
            sx={{
              bgcolor: mode === 'contribute' ? palette.primary : 'transparent',
              color: mode === 'contribute' ? '#fff' : palette.primary,
              borderColor: palette.primary,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                bgcolor: mode === 'contribute' ? '#2563EB' : `${palette.primary}11`,
                borderColor: palette.primary,
              },
            }}
          >
            Contribute Resources
          </Button>
          <Button
            variant={mode === 'submit' ? 'contained' : 'outlined'}
            startIcon={<CloudIcon />}
            onClick={() => setMode('submit')}
            sx={{
              bgcolor: mode === 'submit' ? palette.success : 'transparent',
              color: mode === 'submit' ? '#fff' : palette.success,
              borderColor: palette.success,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                bgcolor: mode === 'submit' ? '#059669' : `${palette.success}11`,
                borderColor: palette.success,
              },
            }}
          >
            Submit Job
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<SpeedIcon />}
            label="Total Network TFLOPS"
            value={NETWORK_STATS.totalTflops.toLocaleString()}
            color={palette.primary}
            subtext="Across all active nodes"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<PublicIcon />}
            label="Active Contributors"
            value={NETWORK_STATS.activeContributors.toLocaleString()}
            color={palette.success}
            subtext="+23 in last 24h"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<BoltIcon />}
            label="Jobs Running"
            value={NETWORK_STATS.jobsRunning}
            color={palette.warning}
            subtext={`${JOB_SUMMARY.queued} queued`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<TrendingUpIcon />}
            label="Avg Cost vs AWS"
            value={`-${NETWORK_STATS.avgSavingsVsAws}%`}
            color={palette.success}
            subtext="Based on comparable GPU-hours"
          />
        </Grid>
      </Grid>

      {/* Middle Row: Utilization Chart + Job Summary + Earnings */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Network Utilization Chart */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 2, p: 2.5, height: '100%' }}>
            <Typography variant="subtitle1" sx={{ color: palette.text, fontWeight: 600, mb: 2 }}>
              Network Utilization (24h)
            </Typography>
            <Box sx={{ height: 200 }}>
              <Line data={chartData} options={chartOptions} />
            </Box>
          </Paper>
        </Grid>

        {/* Active Jobs Summary */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 2, p: 2.5, height: '100%' }}>
            <Typography variant="subtitle1" sx={{ color: palette.text, fontWeight: 600, mb: 2 }}>
              Active Jobs Summary
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { label: 'Running', value: JOB_SUMMARY.running, color: palette.primary, icon: <PlayArrowIcon /> },
                { label: 'Queued', value: JOB_SUMMARY.queued, color: palette.warning, icon: <TimerIcon /> },
                { label: 'Completed (24h)', value: JOB_SUMMARY.completedLast24h, color: palette.success, icon: <StorageIcon /> },
              ].map((item) => (
                <Box
                  key={item.label}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 1.5,
                    borderRadius: 1.5,
                    bgcolor: `${item.color}11`,
                    border: `1px solid ${item.color}33`,
                  }}
                >
                  {React.cloneElement(item.icon, { sx: { color: item.color, fontSize: 20 } })}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ color: palette.textSecondary }}>
                      {item.label}
                    </Typography>
                  </Box>
                  <Typography variant="h5" sx={{ color: item.color, fontWeight: 700 }}>
                    {item.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Earnings Summary */}
        <Grid item xs={12} md={3}>
          <EarningsSummaryPanel earnings={CONTRIBUTOR_EARNINGS} />
        </Grid>
      </Grid>

      {/* Featured Jobs */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Typography variant="subtitle1" sx={{ color: palette.text, fontWeight: 600 }}>
            Featured Jobs
          </Typography>
          <SampleBadge testId="compute-featured-sample-badge" />
        </Box>
        <Grid container spacing={2}>
          {FEATURED_JOBS.map((job) => (
            <Grid item xs={12} md={4} key={job.id}>
              <FeaturedJobCard job={job} />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Tab Navigation */}
      <Paper sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 2, overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: `1px solid ${palette.border}`,
            '& .MuiTab-root': {
              color: palette.textSecondary,
              textTransform: 'none',
              fontWeight: 500,
              fontSize: 14,
              minHeight: 48,
              '&.Mui-selected': { color: palette.primary },
            },
            '& .MuiTabs-indicator': { backgroundColor: palette.primary },
          }}
        >
          <Tab label="Job Queue" icon={<StorageIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
          <Tab label="My Resources" icon={<MemoryIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
          <Tab label="Resource Pool" icon={<PublicIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
          <Tab label="Cost Calculator" icon={<SpeedIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
        </Tabs>

        <Box sx={{ p: 0 }}>{tabContent}</Box>
      </Paper>
    </Box>
  );
};

const ComputeMarketplace = () => {
  if (!FEATURES.demoSurfaces) {
    return (
      <Box sx={{ bgcolor: palette.bg, minHeight: '100vh', p: 3 }} data-testid="compute-not-live">
        <PublicViewerNotice
          reason="not-live"
          title="The compute marketplace is not live on the testnet yet"
          description="No compute-marketplace route is served by the testnet API, so there are no jobs, contributors, earnings or payouts to show. The figures in the preview build are illustrative samples, not testnet state."
        />
      </Box>
    );
  }

  return (
    <>
      <Paper
        data-testid="compute-sample-banner"
        sx={{ bgcolor: palette.card, borderBottom: `1px solid ${palette.warning}`, borderRadius: 0, p: 2 }}
      >
        <Typography variant="subtitle1" sx={{ color: palette.warning, fontWeight: 700 }}>
          Simulated preview — network stats, jobs, contributor earnings and payouts are illustrative sample data
        </Typography>
        <Typography variant="body2" sx={{ color: palette.textSecondary }}>
          Shown because VITE_ENABLE_DEMO_SURFACES is on. No compute-marketplace route is served by the testnet API and nothing here is payable.
        </Typography>
      </Paper>
      <ComputeMarketplaceSample />
    </>
  );
};

export default ComputeMarketplace;
