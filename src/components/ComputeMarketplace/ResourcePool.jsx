import React, { useState, useMemo } from 'react';
import DemoSurfaceGate from '../common/DemoSurfaceGate';
import {
  Box,
  Typography,
  Paper,
  Grid,
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
  Public as PublicIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  TrendingUp as TrendingUpIcon,
  Bolt as BoltIcon,
} from '@mui/icons-material';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, ChartTooltip, Legend);

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
// Mock Data
// ---------------------------------------------------------------------------

const POOL_STATS = {
  totalGPUs: 3842,
  totalCPUs: 9126,
  totalVram: '72.8 TB',
  networkBandwidth: '48.2 Tbps',
  avgLatency: '12ms',
  peakTflops: 847.3,
};

const GPU_BREAKDOWN = [
  { model: 'NVIDIA RTX 4090', count: 892, avgTflops: 82.6, availability: 78, vram: '24 GB' },
  { model: 'NVIDIA A100 80GB', count: 384, avgTflops: 156.0, availability: 42, vram: '80 GB' },
  { model: 'NVIDIA RTX 3090', count: 1124, avgTflops: 35.6, availability: 85, vram: '24 GB' },
  { model: 'NVIDIA H100', count: 128, avgTflops: 267.0, availability: 18, vram: '80 GB' },
  { model: 'AMD RX 7900 XTX', count: 456, avgTflops: 61.4, availability: 91, vram: '24 GB' },
  { model: 'NVIDIA RTX 4080', count: 612, avgTflops: 48.7, availability: 82, vram: '16 GB' },
  { model: 'NVIDIA A6000', count: 246, avgTflops: 38.7, availability: 65, vram: '48 GB' },
];

const TOP_CONTRIBUTORS = [
  { rank: 1, name: 'WeatherNode_Alpha', address: '0x7a3B...f29C', tflopsContributed: 12480, jobs: 3421, uptime: 99.8, earnings: 18420 },
  { rank: 2, name: 'ClimateCompute_EU', address: '0x2eF1...a83D', tflopsContributed: 10920, jobs: 2918, uptime: 99.5, earnings: 16180 },
  { rank: 3, name: 'StormTracker_HPC', address: '0xbC44...12eA', tflopsContributed: 9340, jobs: 2567, uptime: 98.9, earnings: 14250 },
  { rank: 4, name: 'AtmosRender_Farm', address: '0x91dE...7b3F', tflopsContributed: 8100, jobs: 2134, uptime: 97.3, earnings: 12400 },
  { rank: 5, name: 'NWP_Cluster_Asia', address: '0x3fA2...cc91', tflopsContributed: 7650, jobs: 1987, uptime: 98.1, earnings: 11680 },
  { rank: 6, name: 'EnsembleGrid_NA', address: '0xd4E7...8a2B', tflopsContributed: 6890, jobs: 1823, uptime: 96.8, earnings: 10520 },
  { rank: 7, name: 'Reanalysis_Pro', address: '0x5bC8...f112', tflopsContributed: 5420, jobs: 1542, uptime: 97.5, earnings: 8310 },
  { rank: 8, name: 'DataCrunch_Labs', address: '0xa1F9...3d7E', tflopsContributed: 4980, jobs: 1398, uptime: 95.2, earnings: 7640 },
  { rank: 9, name: 'CloudSim_Runner', address: '0x82eD...9c4A', tflopsContributed: 4210, jobs: 1245, uptime: 96.1, earnings: 6420 },
  { rank: 10, name: 'GreenCompute_EU', address: '0xfE23...b81C', tflopsContributed: 3870, jobs: 1102, uptime: 98.4, earnings: 5890 },
];

const GEO_DISTRIBUTION = {
  labels: ['Americas', 'Europe', 'Asia-Pacific', 'Other'],
  data: [38, 31, 24, 7],
  colors: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'],
};

const NETWORK_HEALTH = [
  { region: 'US East', latency: 8, bandwidth: 92, nodes: 412 },
  { region: 'US West', latency: 11, bandwidth: 88, nodes: 328 },
  { region: 'EU Central', latency: 14, bandwidth: 85, nodes: 387 },
  { region: 'EU West', latency: 16, bandwidth: 82, nodes: 264 },
  { region: 'Asia East', latency: 22, bandwidth: 78, nodes: 298 },
  { region: 'Asia South', latency: 28, bandwidth: 71, nodes: 186 },
  { region: 'South America', latency: 35, bandwidth: 64, nodes: 124 },
  { region: 'Oceania', latency: 31, bandwidth: 69, nodes: 89 },
];

// Simplified availability forecast by hour of day
function generateAvailabilityForecast() {
  const labels = [];
  const data = [];
  for (let i = 0; i < 24; i++) {
    labels.push(`${i}:00`);
    // Pattern: lowest availability during US business hours, highest at night
    const base = 60 + 30 * Math.cos(((i - 14) / 24) * 2 * Math.PI);
    data.push(Math.round(Math.min(95, Math.max(35, base))));
  }
  return { labels, data };
}


// World map node coordinates (approximate lat/lng mapped to SVG viewBox 0-1000, 0-500)
const MAP_NODES = [
  // Americas
  { x: 200, y: 160, size: 6, label: 'New York', nodes: 142 },
  { x: 160, y: 170, size: 5, label: 'Chicago', nodes: 98 },
  { x: 120, y: 165, size: 4, label: 'Denver', nodes: 67 },
  { x: 80, y: 170, size: 6, label: 'San Francisco', nodes: 124 },
  { x: 90, y: 185, size: 4, label: 'Los Angeles', nodes: 72 },
  { x: 200, y: 145, size: 3, label: 'Toronto', nodes: 56 },
  { x: 230, y: 280, size: 4, label: 'Sao Paulo', nodes: 84 },
  { x: 190, y: 260, size: 3, label: 'Bogota', nodes: 40 },
  // Europe
  { x: 480, y: 135, size: 6, label: 'London', nodes: 138 },
  { x: 500, y: 140, size: 5, label: 'Frankfurt', nodes: 112 },
  { x: 510, y: 145, size: 4, label: 'Munich', nodes: 78 },
  { x: 490, y: 150, size: 5, label: 'Paris', nodes: 94 },
  { x: 470, y: 125, size: 3, label: 'Amsterdam', nodes: 65 },
  { x: 540, y: 155, size: 3, label: 'Milan', nodes: 52 },
  // Asia-Pacific
  { x: 720, y: 165, size: 5, label: 'Mumbai', nodes: 86 },
  { x: 760, y: 150, size: 4, label: 'Bangkok', nodes: 64 },
  { x: 810, y: 140, size: 6, label: 'Tokyo', nodes: 134 },
  { x: 790, y: 155, size: 5, label: 'Shanghai', nodes: 98 },
  { x: 780, y: 175, size: 4, label: 'Singapore', nodes: 76 },
  { x: 860, y: 300, size: 4, label: 'Sydney', nodes: 68 },
  { x: 895, y: 320, size: 3, label: 'Auckland', nodes: 21 },
  // Africa / Middle East
  { x: 540, y: 210, size: 3, label: 'Lagos', nodes: 32 },
  { x: 570, y: 175, size: 3, label: 'Dubai', nodes: 44 },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function WorldMapSVG({ nodes }) {
  return (
    <Box sx={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
      <svg viewBox="0 0 960 480" style={{ width: '100%', height: 'auto' }}>
        {/* Simplified world map continental outlines */}
        <g fill="none" stroke={palette.border} strokeWidth="1.5" opacity="0.5">
          {/* North America */}
          <path d="M60,100 Q80,80 130,75 Q180,70 220,80 Q250,100 260,130 Q255,155 240,170 Q220,185 200,190 Q170,195 150,200 Q120,205 100,200 Q80,195 65,185 Q50,170 40,150 Q35,130 40,115 Z" />
          {/* South America */}
          <path d="M190,220 Q210,215 230,225 Q250,240 260,270 Q265,300 255,330 Q240,355 225,370 Q210,385 200,380 Q185,365 175,340 Q165,310 170,280 Q175,250 185,235 Z" />
          {/* Europe */}
          <path d="M450,90 Q470,80 500,75 Q530,78 555,85 Q570,95 575,110 Q570,130 555,145 Q535,160 510,165 Q485,168 460,160 Q445,150 440,135 Q438,115 445,100 Z" />
          {/* Africa */}
          <path d="M470,175 Q490,170 520,175 Q545,185 560,210 Q570,240 565,270 Q555,300 540,320 Q520,335 500,340 Q480,335 465,320 Q455,300 450,270 Q448,240 455,210 Q460,190 468,178 Z" />
          {/* Asia */}
          <path d="M580,70 Q620,60 680,65 Q740,70 790,80 Q830,95 850,120 Q855,145 840,165 Q815,180 780,185 Q740,188 700,180 Q660,170 630,155 Q600,140 585,120 Q575,100 578,80 Z" />
          {/* Australia */}
          <path d="M810,280 Q840,270 870,275 Q900,285 910,310 Q905,335 890,345 Q865,355 840,350 Q820,340 810,320 Q805,300 808,285 Z" />
        </g>

        {/* Grid lines */}
        <g stroke={`${palette.border}33`} strokeWidth="0.5">
          {[120, 240, 360].map((y) => (
            <line key={`h-${y}`} x1="0" y1={y} x2="960" y2={y} />
          ))}
          {[240, 480, 720].map((x) => (
            <line key={`v-${x}`} x1={x} y1="0" x2={x} y2="480" />
          ))}
        </g>

        {/* Node dots with glow effect */}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {nodes.map((node, i) => (
          <g key={i}>
            <circle
              cx={node.x}
              cy={node.y}
              r={node.size + 4}
              fill={palette.primary}
              opacity={0.15}
            />
            <circle
              cx={node.x}
              cy={node.y}
              r={node.size}
              fill={palette.primary}
              opacity={0.8}
              filter="url(#glow)"
            >
              <title>{`${node.label}: ${node.nodes} nodes`}</title>
            </circle>
            <circle
              cx={node.x}
              cy={node.y}
              r={2}
              fill="#FFFFFF"
              opacity={0.9}
            />
          </g>
        ))}
      </svg>
    </Box>
  );
}

function PoolStatCard({ icon, label, value, color }) {
  return (
    <Box sx={{ textAlign: 'center', p: 1.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5 }}>
        {React.cloneElement(icon, { sx: { color, fontSize: 24 } })}
      </Box>
      <Typography variant="h5" sx={{ color: palette.text, fontWeight: 700 }}>
        {value}
      </Typography>
      <Typography variant="caption" sx={{ color: palette.textSecondary }}>
        {label}
      </Typography>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ResourcePoolSample = () => {
  const AVAILABILITY_FORECAST = useMemo(generateAvailabilityForecast, []);
  const geoChartData = useMemo(
    () => ({
      labels: GEO_DISTRIBUTION.labels,
      datasets: [
        {
          data: GEO_DISTRIBUTION.data,
          backgroundColor: GEO_DISTRIBUTION.colors,
          borderWidth: 0,
          hoverOffset: 6,
        },
      ],
    }),
    [],
  );

  const geoChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: palette.textSecondary, font: { size: 11 }, padding: 12, usePointStyle: true, pointStyleWidth: 10 },
        },
        tooltip: {
          backgroundColor: palette.card,
          titleColor: palette.text,
          bodyColor: palette.textSecondary,
          borderColor: palette.border,
          borderWidth: 1,
          callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed}% of network` },
        },
      },
    }),
    [],
  );

  const availabilityChartData = useMemo(
    () => ({
      labels: AVAILABILITY_FORECAST.labels,
      datasets: [
        {
          label: 'Resource Availability %',
          data: AVAILABILITY_FORECAST.data,
          backgroundColor: AVAILABILITY_FORECAST.data.map((v) =>
            v >= 75 ? `${palette.success}88` : v >= 50 ? `${palette.warning}88` : `${palette.error}88`,
          ),
          borderRadius: 3,
          borderSkipped: false,
        },
      ],
    }),
    [],
  );

  const availabilityChartOptions = useMemo(
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
          callbacks: { label: (ctx) => `${ctx.parsed.y}% available` },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: palette.textSecondary, font: { size: 9 }, maxTicksLimit: 12 },
        },
        y: {
          min: 0,
          max: 100,
          grid: { color: `${palette.border}44` },
          ticks: { color: palette.textSecondary, font: { size: 10 }, callback: (v) => `${v}%` },
        },
      },
    }),
    [],
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="subtitle1" sx={{ color: palette.text, fontWeight: 600, mb: 2 }}>
        Global Compute Resource Pool
      </Typography>

      {/* Pool Stats */}
      <Paper sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 2, mb: 3, overflow: 'hidden' }}>
        <Grid container>
          {[
            { icon: <MemoryIcon />, label: 'Total GPUs', value: POOL_STATS.totalGPUs.toLocaleString(), color: palette.primary },
            { icon: <SpeedIcon />, label: 'Total CPUs', value: POOL_STATS.totalCPUs.toLocaleString(), color: palette.success },
            { icon: <StorageIcon />, label: 'Total VRAM', value: POOL_STATS.totalVram, color: palette.warning },
            { icon: <PublicIcon />, label: 'Network Bandwidth', value: POOL_STATS.networkBandwidth, color: '#8B5CF6' },
            { icon: <BoltIcon />, label: 'Peak TFLOPS', value: POOL_STATS.peakTflops.toLocaleString(), color: palette.error },
            { icon: <TrendingUpIcon />, label: 'Avg Latency', value: POOL_STATS.avgLatency, color: palette.primary },
          ].map((stat, i) => (
            <Grid
              item
              xs={6}
              sm={4}
              md={2}
              key={stat.label}
              sx={{ borderRight: i < 5 ? `1px solid ${palette.border}` : 'none', borderBottom: { xs: `1px solid ${palette.border}`, md: 'none' } }}
            >
              <PoolStatCard {...stat} />
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Grid container spacing={2}>
        {/* World Map */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 2, p: 2.5 }}>
            <Typography variant="subtitle2" sx={{ color: palette.text, fontWeight: 600, mb: 1 }}>
              Global Node Distribution
            </Typography>
            <Typography variant="caption" sx={{ color: palette.textSecondary, mb: 2, display: 'block' }}>
              {MAP_NODES.reduce((sum, n) => sum + n.nodes, 0).toLocaleString()} nodes across {MAP_NODES.length} locations
            </Typography>
            <WorldMapSVG nodes={MAP_NODES} />
          </Paper>
        </Grid>

        {/* Geographic Distribution */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 2, p: 2.5, height: '100%' }}>
            <Typography variant="subtitle2" sx={{ color: palette.text, fontWeight: 600, mb: 2 }}>
              Geographic Distribution
            </Typography>
            <Box sx={{ height: 240 }}>
              <Doughnut data={geoChartData} options={geoChartOptions} />
            </Box>
          </Paper>
        </Grid>

        {/* GPU Breakdown Table */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 2, p: 2.5 }}>
            <Typography variant="subtitle2" sx={{ color: palette.text, fontWeight: 600, mb: 2 }}>
              Resource Type Breakdown
            </Typography>
            <TableContainer sx={{ bgcolor: 'transparent' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { borderBottom: `1px solid ${palette.border}`, color: palette.textSecondary, fontWeight: 600, fontSize: 11, py: 1 } }}>
                    <TableCell>GPU Model</TableCell>
                    <TableCell align="center">Count</TableCell>
                    <TableCell align="center">VRAM</TableCell>
                    <TableCell align="center">Avg TFLOPS</TableCell>
                    <TableCell align="center">Availability</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {GPU_BREAKDOWN.map((gpu) => (
                    <TableRow
                      key={gpu.model}
                      sx={{ '& td': { borderBottom: `1px solid ${palette.border}`, color: palette.text, fontSize: 12, py: 1 }, '&:hover': { bgcolor: `${palette.primary}08` } }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: 12 }}>{gpu.model}</Typography>
                      </TableCell>
                      <TableCell align="center">{gpu.count.toLocaleString()}</TableCell>
                      <TableCell align="center">{gpu.vram}</TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" sx={{ color: palette.primary, fontWeight: 600, fontSize: 12 }}>
                          {gpu.avgTflops}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ minWidth: 120 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                          <LinearProgress
                            variant="determinate"
                            value={gpu.availability}
                            sx={{
                              width: 60,
                              height: 5,
                              borderRadius: 2.5,
                              bgcolor: `${gpu.availability > 70 ? palette.success : gpu.availability > 40 ? palette.warning : palette.error}22`,
                              '& .MuiLinearProgress-bar': {
                                bgcolor: gpu.availability > 70 ? palette.success : gpu.availability > 40 ? palette.warning : palette.error,
                                borderRadius: 2.5,
                              },
                            }}
                          />
                          <Typography variant="caption" sx={{ color: palette.textSecondary, minWidth: 30 }}>
                            {gpu.availability}%
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Network Health */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 2, p: 2.5 }}>
            <Typography variant="subtitle2" sx={{ color: palette.text, fontWeight: 600, mb: 2 }}>
              Network Health by Region
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {NETWORK_HEALTH.map((region) => {
                const latencyColor = region.latency < 15 ? palette.success : region.latency < 25 ? palette.warning : palette.error;
                return (
                  <Box
                    key={region.region}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 1,
                      borderRadius: 1,
                      '&:hover': { bgcolor: `${palette.primary}08` },
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 90 }}>
                      <Typography variant="caption" sx={{ color: palette.text, fontWeight: 500, fontSize: 11 }}>
                        {region.region}
                      </Typography>
                    </Box>
                    <Tooltip title="Latency">
                      <Chip
                        label={`${region.latency}ms`}
                        size="small"
                        sx={{ bgcolor: `${latencyColor}22`, color: latencyColor, fontWeight: 600, fontSize: 10, height: 20, minWidth: 50 }}
                      />
                    </Tooltip>
                    <Tooltip title="Bandwidth utilization">
                      <Box sx={{ width: 50 }}>
                        <LinearProgress
                          variant="determinate"
                          value={region.bandwidth}
                          sx={{
                            height: 4,
                            borderRadius: 2,
                            bgcolor: `${palette.primary}22`,
                            '& .MuiLinearProgress-bar': { bgcolor: palette.primary, borderRadius: 2 },
                          }}
                        />
                      </Box>
                    </Tooltip>
                    <Typography variant="caption" sx={{ color: palette.textSecondary, minWidth: 45, textAlign: 'right', fontSize: 10 }}>
                      {region.nodes} nodes
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Grid>

        {/* Top Contributors Leaderboard */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 2, p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <TrendingUpIcon sx={{ color: palette.warning, fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ color: palette.text, fontWeight: 600 }}>
                Top Contributors
              </Typography>
            </Box>
            <TableContainer sx={{ bgcolor: 'transparent' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { borderBottom: `1px solid ${palette.border}`, color: palette.textSecondary, fontWeight: 600, fontSize: 11, py: 1 } }}>
                    <TableCell>#</TableCell>
                    <TableCell>Contributor</TableCell>
                    <TableCell align="right">TFLOPS-hrs</TableCell>
                    <TableCell align="right">Jobs</TableCell>
                    <TableCell align="center">Uptime</TableCell>
                    <TableCell align="right">Earnings (WRF)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {TOP_CONTRIBUTORS.map((c) => (
                    <TableRow
                      key={c.rank}
                      sx={{
                        '& td': { borderBottom: `1px solid ${palette.border}`, color: palette.text, fontSize: 12, py: 1 },
                        '&:hover': { bgcolor: `${palette.primary}08` },
                      }}
                    >
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            fontSize: 12,
                            color: c.rank <= 3 ? palette.warning : palette.textSecondary,
                          }}
                        >
                          {c.rank}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 12 }}>{c.name}</Typography>
                          <Typography variant="caption" sx={{ color: palette.textSecondary, fontFamily: 'monospace', fontSize: 10 }}>
                            {c.address}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">{c.tflopsContributed.toLocaleString()}</TableCell>
                      <TableCell align="right">{c.jobs.toLocaleString()}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${c.uptime}%`}
                          size="small"
                          sx={{
                            bgcolor: `${c.uptime >= 98 ? palette.success : palette.warning}22`,
                            color: c.uptime >= 98 ? palette.success : palette.warning,
                            fontWeight: 600,
                            fontSize: 10,
                            height: 20,
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ color: palette.success, fontWeight: 600, fontSize: 12 }}>
                          {c.earnings.toLocaleString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Resource Availability Forecast */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 2, p: 2.5 }}>
            <Typography variant="subtitle2" sx={{ color: palette.text, fontWeight: 600, mb: 1 }}>
              Resource Availability Forecast (by hour)
            </Typography>
            <Typography variant="caption" sx={{ color: palette.textSecondary, mb: 2, display: 'block' }}>
              Predicted availability based on historical patterns
            </Typography>
            <Box sx={{ height: 220 }}>
              <Bar data={availabilityChartData} options={availabilityChartOptions} />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

const ResourcePool = () => (
  <DemoSurfaceGate
    title="Compute pool telemetry unavailable."
    description="No trusted pool capacity, contributor earnings or regional telemetry source is connected. Demo values are illustrative."
    testId="compute-pool"
  >
    <ResourcePoolSample />
  </DemoSurfaceGate>
);

export default ResourcePool;
