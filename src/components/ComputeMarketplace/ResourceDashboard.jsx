import React, { useState, useMemo, useCallback } from 'react';
import DemoSurfaceGate from '../common/DemoSurfaceGate';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Switch,
  Slider,
  Divider,
  Chip,
  Tooltip,
  Button,
  LinearProgress,
} from '@mui/material';
import {
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  Bolt as BoltIcon,
  TrendingUp as TrendingUpIcon,
  Timer as TimerIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, ChartTooltip, Legend);

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

const MY_HARDWARE = {
  gpuModel: 'NVIDIA RTX 4090',
  gpuVram: '24 GB GDDR6X',
  cpuModel: 'AMD Ryzen 9 7950X',
  cpuCores: 16,
  ram: '128 GB DDR5',
  storage: '4 TB NVMe SSD',
  networkSpeed: '10 Gbps',
  uptimePercent: 97.3,
  earningsThisMonth: 342.1,
  earningsAllTime: 4218.7,
  tflopsScore: 82.6,
  memoryBandwidth: '1,008 GB/s',
  contributingSince: 'Aug 2025',
  totalJobsProcessed: 1847,
};

const REALTIME_UTILIZATION = {
  cpu: 73,
  gpu: 89,
  memory: 62,
  network: 34,
};

const HARDWARE_MONITORING = {
  gpuTemp: 71,
  gpuFanSpeed: 68,
  gpuPowerDraw: 312,
  gpuPowerMax: 450,
  cpuTemp: 58,
  cpuFanSpeed: 45,
};

function generateDailyEarnings() {
  const labels = [];
  const data = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 86400000);
    labels.push(date.toLocaleDateString([], { month: 'short', day: 'numeric' }));
    // Simulate weekend dips
    const dayOfWeek = date.getDay();
    const base = dayOfWeek === 0 || dayOfWeek === 6 ? 8 : 14;
    data.push(parseFloat(base.toFixed(2)));
  }
  return { labels, data };
}


const RESOURCE_ALLOCATION = {
  labels: ['Model Training', 'Ensemble Forecast', 'Climate Sim', 'Data Processing', 'Reanalysis'],
  data: [38, 24, 18, 12, 8],
  colors: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'],
};

const CONTRIBUTION_SCHEDULE = {
  enabled: true,
  startHour: 22,
  endHour: 6,
  weekendsOnly: false,
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CircularGauge({ value, label, color, size = 100 }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <Box sx={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`${color}22`}
            strokeWidth={8}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          <Typography variant="h6" sx={{ color, fontWeight: 700, lineHeight: 1 }}>
            {value}%
          </Typography>
        </Box>
      </Box>
      <Typography variant="caption" sx={{ color: palette.textSecondary, fontWeight: 500 }}>
        {label}
      </Typography>
    </Box>
  );
}

function HardwareMonitorRow({ label, value, unit, max, color }) {
  const percentage = max ? (value / max) * 100 : null;
  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" sx={{ color: palette.textSecondary }}>{label}</Typography>
        <Typography variant="caption" sx={{ color: percentage && percentage > 85 ? palette.error : color, fontWeight: 600 }}>
          {value}{unit}
          {max && <Typography component="span" sx={{ color: palette.textSecondary, fontSize: 10 }}> / {max}{unit}</Typography>}
        </Typography>
      </Box>
      {percentage !== null && (
        <LinearProgress
          variant="determinate"
          value={percentage}
          sx={{
            height: 4,
            borderRadius: 2,
            bgcolor: `${color}22`,
            '& .MuiLinearProgress-bar': { bgcolor: percentage > 85 ? palette.error : color, borderRadius: 2 },
          }}
        />
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ResourceDashboardSample = () => {
  const DAILY_EARNINGS = useMemo(generateDailyEarnings, []);
  const [isContributing, setIsContributing] = useState(true);
  const [scheduleEnabled, setScheduleEnabled] = useState(CONTRIBUTION_SCHEDULE.enabled);
  const [scheduleRange, setScheduleRange] = useState([
    CONTRIBUTION_SCHEDULE.startHour,
    CONTRIBUTION_SCHEDULE.endHour + 24, // wrap around midnight
  ]);

  const earningsChartData = useMemo(
    () => ({
      labels: DAILY_EARNINGS.labels,
      datasets: [
        {
          label: 'Daily Earnings (WRF)',
          data: DAILY_EARNINGS.data,
          backgroundColor: DAILY_EARNINGS.data.map((v) =>
            v >= 14 ? `${palette.success}BB` : v >= 10 ? `${palette.primary}BB` : `${palette.warning}BB`,
          ),
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    }),
    [],
  );

  const earningsChartOptions = useMemo(
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
          callbacks: { label: (ctx) => `${ctx.parsed.y.toFixed(2)} WRF` },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: palette.textSecondary, font: { size: 10 }, maxRotation: 45 },
        },
        y: {
          grid: { color: `${palette.border}44` },
          ticks: { color: palette.textSecondary, font: { size: 10 }, callback: (v) => `${v} WRF` },
        },
      },
    }),
    [],
  );

  const allocationChartData = useMemo(
    () => ({
      labels: RESOURCE_ALLOCATION.labels,
      datasets: [
        {
          data: RESOURCE_ALLOCATION.data,
          backgroundColor: RESOURCE_ALLOCATION.colors,
          borderWidth: 0,
          hoverOffset: 6,
        },
      ],
    }),
    [],
  );

  const allocationChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'right',
          labels: { color: palette.textSecondary, font: { size: 11 }, padding: 12, usePointStyle: true, pointStyleWidth: 10 },
        },
        tooltip: {
          backgroundColor: palette.card,
          titleColor: palette.text,
          bodyColor: palette.textSecondary,
          borderColor: palette.border,
          borderWidth: 1,
          callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed}%` },
        },
      },
    }),
    [],
  );

  const formatScheduleHour = (h) => {
    const normalized = h % 24;
    return `${normalized === 0 ? 12 : normalized > 12 ? normalized - 12 : normalized}${normalized >= 12 ? 'pm' : 'am'}`;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Contribution Toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ color: palette.text, fontWeight: 600 }}>
            My Resource Contribution
          </Typography>
          <Typography variant="caption" sx={{ color: palette.textSecondary }}>
            Contributing since {MY_HARDWARE.contributingSince} -- {MY_HARDWARE.totalJobsProcessed.toLocaleString()} jobs processed
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ color: isContributing ? palette.success : palette.textSecondary, fontWeight: 600 }}>
            {isContributing ? 'Contributing' : 'Paused'}
          </Typography>
          <Switch
            checked={isContributing}
            onChange={(e) => setIsContributing(e.target.checked)}
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': { color: palette.success },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: palette.success },
            }}
          />
        </Box>
      </Box>

      <Grid container spacing={2}>
        {/* Hardware Info */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 2, p: 2.5, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <MemoryIcon sx={{ color: palette.primary, fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ color: palette.text, fontWeight: 600 }}>
                Your Hardware
              </Typography>
            </Box>
            {[
              { label: 'GPU', value: MY_HARDWARE.gpuModel },
              { label: 'VRAM', value: MY_HARDWARE.gpuVram },
              { label: 'CPU', value: MY_HARDWARE.cpuModel },
              { label: 'CPU Cores', value: MY_HARDWARE.cpuCores },
              { label: 'RAM', value: MY_HARDWARE.ram },
              { label: 'Storage', value: MY_HARDWARE.storage },
              { label: 'Network', value: MY_HARDWARE.networkSpeed },
            ].map((item) => (
              <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.6 }}>
                <Typography variant="caption" sx={{ color: palette.textSecondary }}>{item.label}</Typography>
                <Typography variant="caption" sx={{ color: palette.text, fontWeight: 500 }}>{item.value}</Typography>
              </Box>
            ))}
            <Divider sx={{ borderColor: palette.border, my: 1.5 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: palette.textSecondary }}>Uptime</Typography>
              <Chip
                label={`${MY_HARDWARE.uptimePercent}%`}
                size="small"
                sx={{ bgcolor: `${palette.success}22`, color: palette.success, fontWeight: 600, height: 22, fontSize: 11 }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Realtime Utilization Gauges */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 2, p: 2.5, height: '100%' }}>
            <Typography variant="subtitle2" sx={{ color: palette.text, fontWeight: 600, mb: 2 }}>
              Real-Time Utilization
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 2, py: 1 }}>
              <CircularGauge value={REALTIME_UTILIZATION.cpu} label="CPU" color={palette.primary} size={90} />
              <CircularGauge value={REALTIME_UTILIZATION.gpu} label="GPU" color={palette.success} size={90} />
              <CircularGauge value={REALTIME_UTILIZATION.memory} label="Memory" color={palette.warning} size={90} />
              <CircularGauge value={REALTIME_UTILIZATION.network} label="Network" color="#8B5CF6" size={90} />
            </Box>
          </Paper>
        </Grid>

        {/* Benchmark Results */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 2, p: 2.5, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <SpeedIcon sx={{ color: palette.warning, fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ color: palette.text, fontWeight: 600 }}>
                Benchmark Results
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h3" sx={{ color: palette.primary, fontWeight: 700 }}>
                {MY_HARDWARE.tflopsScore}
              </Typography>
              <Typography variant="caption" sx={{ color: palette.textSecondary }}>
                TFLOPS (FP32)
              </Typography>
            </Box>
            <Divider sx={{ borderColor: palette.border, my: 1.5 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
              <Typography variant="caption" sx={{ color: palette.textSecondary }}>Memory Bandwidth</Typography>
              <Typography variant="caption" sx={{ color: palette.text, fontWeight: 500 }}>{MY_HARDWARE.memoryBandwidth}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
              <Typography variant="caption" sx={{ color: palette.textSecondary }}>Network Rank</Typography>
              <Chip label="Top 12%" size="small" sx={{ bgcolor: `${palette.success}22`, color: palette.success, fontWeight: 600, height: 20, fontSize: 10 }} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
              <Typography variant="caption" sx={{ color: palette.textSecondary }}>Reliability Score</Typography>
              <Typography variant="caption" sx={{ color: palette.success, fontWeight: 600 }}>98.7 / 100</Typography>
            </Box>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              sx={{
                mt: 2,
                color: palette.primary,
                borderColor: palette.border,
                textTransform: 'none',
                fontSize: 12,
                '&:hover': { borderColor: palette.primary },
              }}
            >
              Re-run Benchmark
            </Button>
          </Paper>
        </Grid>

        {/* Earnings Chart */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 2, p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon sx={{ color: palette.success, fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ color: palette.text, fontWeight: 600 }}>
                  Daily Earnings (14 Days)
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" sx={{ color: palette.textSecondary }}>This Month</Typography>
                  <Typography variant="body2" sx={{ color: palette.success, fontWeight: 700 }}>
                    {MY_HARDWARE.earningsThisMonth} WRF
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" sx={{ color: palette.textSecondary }}>All Time</Typography>
                  <Typography variant="body2" sx={{ color: palette.text, fontWeight: 700 }}>
                    {MY_HARDWARE.earningsAllTime.toLocaleString()} WRF
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box sx={{ height: 220 }}>
              <Bar data={earningsChartData} options={earningsChartOptions} />
            </Box>
          </Paper>
        </Grid>

        {/* Resource Allocation Breakdown */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 2, p: 2.5 }}>
            <Typography variant="subtitle2" sx={{ color: palette.text, fontWeight: 600, mb: 2 }}>
              Resource Allocation by Job Type
            </Typography>
            <Box sx={{ height: 220 }}>
              <Doughnut data={allocationChartData} options={allocationChartOptions} />
            </Box>
          </Paper>
        </Grid>

        {/* Hardware Monitoring */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 2, p: 2.5 }}>
            <Typography variant="subtitle2" sx={{ color: palette.text, fontWeight: 600, mb: 2 }}>
              Hardware Monitoring
            </Typography>
            <HardwareMonitorRow label="GPU Temperature" value={HARDWARE_MONITORING.gpuTemp} unit="C" max={95} color={palette.error} />
            <HardwareMonitorRow label="GPU Fan Speed" value={HARDWARE_MONITORING.gpuFanSpeed} unit="%" max={100} color={palette.primary} />
            <HardwareMonitorRow label="GPU Power Draw" value={HARDWARE_MONITORING.gpuPowerDraw} unit="W" max={HARDWARE_MONITORING.gpuPowerMax} color={palette.warning} />
            <HardwareMonitorRow label="CPU Temperature" value={HARDWARE_MONITORING.cpuTemp} unit="C" max={95} color={palette.error} />
            <HardwareMonitorRow label="CPU Fan Speed" value={HARDWARE_MONITORING.cpuFanSpeed} unit="%" max={100} color={palette.primary} />
          </Paper>
        </Grid>

        {/* Contribution Schedule */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 2, p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TimerIcon sx={{ color: palette.primary, fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ color: palette.text, fontWeight: 600 }}>
                  Contribution Schedule
                </Typography>
              </Box>
              <Switch
                checked={scheduleEnabled}
                onChange={(e) => setScheduleEnabled(e.target.checked)}
                size="small"
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: palette.primary },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: palette.primary },
                }}
              />
            </Box>

            {scheduleEnabled ? (
              <Box>
                <Typography variant="caption" sx={{ color: palette.textSecondary, mb: 1, display: 'block' }}>
                  Contribute resources during these hours:
                </Typography>
                <Box sx={{ px: 2, py: 1 }}>
                  <Slider
                    value={scheduleRange}
                    onChange={(_, val) => setScheduleRange(val)}
                    min={0}
                    max={47}
                    step={1}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(v) => formatScheduleHour(v)}
                    sx={{
                      color: palette.primary,
                      '& .MuiSlider-thumb': { bgcolor: palette.primary },
                      '& .MuiSlider-track': { bgcolor: palette.primary },
                      '& .MuiSlider-rail': { bgcolor: palette.border },
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="caption" sx={{ color: palette.primary, fontWeight: 600 }}>
                    {formatScheduleHour(scheduleRange[0])} - {formatScheduleHour(scheduleRange[1])}
                  </Typography>
                  <Typography variant="caption" sx={{ color: palette.textSecondary }}>
                    {Math.abs(scheduleRange[1] - scheduleRange[0])} hours / day
                  </Typography>
                </Box>

                <Divider sx={{ borderColor: palette.border, my: 2 }} />

                {/* 24h hour grid visualization */}
                <Typography variant="caption" sx={{ color: palette.textSecondary, mb: 1, display: 'block' }}>
                  Schedule Preview
                </Typography>
                <Box sx={{ display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
                  {Array.from({ length: 24 }, (_, i) => {
                    const start = scheduleRange[0] % 24;
                    const end = scheduleRange[1] % 24;
                    const isActive = start <= end ? i >= start && i < end : i >= start || i < end;
                    return (
                      <Tooltip key={i} title={`${i}:00 - ${isActive ? 'Active' : 'Idle'}`}>
                        <Box
                          sx={{
                            width: 'calc(100% / 24 - 2px)',
                            height: 20,
                            borderRadius: 0.5,
                            bgcolor: isActive ? `${palette.primary}66` : `${palette.border}44`,
                            border: `1px solid ${isActive ? palette.primary : palette.border}`,
                            transition: 'all 0.2s',
                          }}
                        />
                      </Tooltip>
                    );
                  })}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography sx={{ fontSize: 9, color: palette.textSecondary }}>12am</Typography>
                  <Typography sx={{ fontSize: 9, color: palette.textSecondary }}>6am</Typography>
                  <Typography sx={{ fontSize: 9, color: palette.textSecondary }}>12pm</Typography>
                  <Typography sx={{ fontSize: 9, color: palette.textSecondary }}>6pm</Typography>
                  <Typography sx={{ fontSize: 9, color: palette.textSecondary }}>12am</Typography>
                </Box>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body2" sx={{ color: palette.textSecondary }}>
                  Schedule disabled. Contributing 24/7 when toggled on.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

const ResourceDashboard = () => (
  <DemoSurfaceGate
    title="Compute resource telemetry unavailable."
    description="No trusted hardware, utilization or compute-earnings source is connected. Demo values are illustrative."
    testId="compute-resources"
  >
    <ResourceDashboardSample />
  </DemoSurfaceGate>
);

export default ResourceDashboard;
