// StationBenchmark - Percentile ring, metric breakdown, ranking chart, achievement badges
import React, { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import WrfCard from '../ui/WrfCard';
import WrfBadge from '../ui/WrfBadge';
import { colors, spacing, borderRadius, shadows } from '../ui/tokens';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTooltip, Legend, Filler);

// ---------- Types ----------

interface MetricBreakdown {
  label: string;
  station: number;
  networkAvg: number;
  unit: string;
  color: string;
}

interface AchievementBadge {
  id: string;
  name: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  description: string;
  earned: boolean;
  earnedDate?: string;
  icon: string; // unicode emoji character
}

interface RankingPoint {
  month: string;
  rank: number;
  percentile: number;
}

// ---------- Mock Data ----------

const OVERALL_PERCENTILE = 87;
const NETWORK_SIZE = 2847;
const STATION_RANK = Math.ceil(NETWORK_SIZE * (1 - OVERALL_PERCENTILE / 100));

const METRIC_BREAKDOWN: MetricBreakdown[] = [
  { label: 'Data Quality', station: 94.2, networkAvg: 82.1, unit: '%', color: colors.success.main },
  { label: 'Uptime', station: 97.8, networkAvg: 88.4, unit: '%', color: colors.brand.primary },
  { label: 'Consistency', station: 91.5, networkAvg: 76.3, unit: '%', color: '#8B5CF6' },
  { label: 'Coverage', station: 88.3, networkAvg: 79.6, unit: '%', color: '#06B6D4' },
  { label: 'Timeliness', station: 96.1, networkAvg: 84.7, unit: '%', color: colors.warning.main },
  { label: 'Accuracy', station: 92.4, networkAvg: 81.9, unit: '%', color: colors.error.main },
];

const ACHIEVEMENTS: AchievementBadge[] = [
  { id: 'dc-plat', name: 'Data Collector', tier: 'platinum', description: '50,000+ weather readings submitted', earned: true, earnedDate: '2025-11-15', icon: '\uD83D\uDCCA' },
  { id: 'cc-silver', name: 'Consistency Champion', tier: 'silver', description: '30+ consecutive days of data submission', earned: true, earnedDate: '2026-01-20', icon: '\uD83D\uDD25' },
  { id: 'qp-gold', name: 'Quality Pioneer', tier: 'gold', description: '90+ quality score maintained for 90 days', earned: true, earnedDate: '2025-12-01', icon: '\u2B50' },
  { id: 'ws-bronze', name: 'Weather Sentinel', tier: 'bronze', description: 'Detected and reported 5+ weather anomalies', earned: true, earnedDate: '2025-10-10', icon: '\uD83C\uDF29\uFE0F' },
  { id: 'nc-silver', name: 'Network Contributor', tier: 'silver', description: 'Top 20% contributor in regional network', earned: true, earnedDate: '2026-01-05', icon: '\uD83C\uDF10' },
  { id: 'dc-diamond', name: 'Data Collector', tier: 'diamond', description: '100,000+ weather readings submitted', earned: false, icon: '\uD83D\uDC8E' },
  { id: 'cc-gold', name: 'Consistency Champion', tier: 'gold', description: '90+ consecutive days of data submission', earned: false, icon: '\uD83C\uDFC6' },
  { id: 'fl-bronze', name: 'First Light', tier: 'bronze', description: 'Submitted first weather reading', earned: true, earnedDate: '2024-06-15', icon: '\uD83C\uDF1F' },
];

const RANKING_HISTORY: RankingPoint[] = [
  { month: 'Mar', rank: 892, percentile: 68 },
  { month: 'Apr', rank: 745, percentile: 73 },
  { month: 'May', rank: 612, percentile: 78 },
  { month: 'Jun', rank: 534, percentile: 81 },
  { month: 'Jul', rank: 498, percentile: 82 },
  { month: 'Aug', rank: 423, percentile: 85 },
  { month: 'Sep', rank: 401, percentile: 85 },
  { month: 'Oct', rank: 378, percentile: 86 },
  { month: 'Nov', rank: 395, percentile: 86 },
  { month: 'Dec', rank: 362, percentile: 87 },
  { month: 'Jan', rank: 370, percentile: 87 },
  { month: 'Feb', rank: STATION_RANK, percentile: OVERALL_PERCENTILE },
];

// ---------- Tier Colors ----------

const TIER_COLORS: Record<string, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
  diamond: '#B9F2FF',
};

// ---------- Percentile Ring (SVG) ----------

const PercentileRing: React.FC<{ percentile: number; size?: number }> = ({ percentile, size = 180 }) => {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - percentile / 100);
  const cx = size / 2;
  const cy = size / 2;

  // Color based on percentile
  const ringColor = percentile >= 90 ? colors.success.main : percentile >= 70 ? colors.brand.primary : percentile >= 50 ? colors.warning.main : colors.error.main;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background ring */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={colors.bg.tertiary}
        strokeWidth={strokeWidth}
      />
      {/* Progress ring */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={ringColor}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
      {/* Glow effect */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={ringColor}
        strokeWidth={strokeWidth + 8}
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        opacity={0.15}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
      {/* Center text */}
      <text x={cx} y={cy - 12} textAnchor="middle" fill={colors.text.primary} fontSize="32" fontWeight="700">
        {percentile}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill={colors.text.muted} fontSize="12" fontWeight="500">
        percentile
      </text>
      <text x={cx} y={cy + 28} textAnchor="middle" fill={colors.text.secondary} fontSize="11">
        Rank #{STATION_RANK} of {NETWORK_SIZE.toLocaleString()}
      </text>
    </svg>
  );
};

// ---------- Metric Bar ----------

const MetricBar: React.FC<{ metric: MetricBreakdown }> = ({ metric }) => {
  const max = 100;
  const stationPct = (metric.station / max) * 100;
  const avgPct = (metric.networkAvg / max) * 100;
  const diff = Math.round((metric.station - metric.networkAvg) * 10) / 10;

  return (
    <Box sx={{ marginBottom: `${spacing.sm + 4}px` }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: colors.text.primary }}>
          {metric.label}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: metric.color }}>
            {metric.station}{metric.unit}
          </Typography>
          <Typography sx={{ fontSize: '0.65rem', color: diff >= 0 ? colors.success.main : colors.error.main }}>
            {diff >= 0 ? '+' : ''}{diff}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ position: 'relative', height: 8, backgroundColor: colors.bg.primary, borderRadius: '4px', overflow: 'hidden' }}>
        {/* Station bar */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: `${stationPct}%`,
            backgroundColor: metric.color,
            borderRadius: '4px',
            opacity: 0.85,
            transition: 'width 0.6s ease',
          }}
        />
        {/* Network avg marker */}
        <Box
          sx={{
            position: 'absolute',
            top: -2,
            left: `${avgPct}%`,
            width: 2,
            height: 12,
            backgroundColor: colors.text.muted,
            borderRadius: '1px',
          }}
        />
      </Box>
      <Typography sx={{ fontSize: '0.6rem', color: colors.text.muted, marginTop: '2px' }}>
        Network avg: {metric.networkAvg}{metric.unit}
      </Typography>
    </Box>
  );
};

// ---------- Main Component ----------

const StationBenchmark: React.FC = () => {
  // Ranking chart
  const rankingChartData = useMemo(() => ({
    labels: RANKING_HISTORY.map((r) => r.month),
    datasets: [
      {
        label: 'Percentile Ranking',
        data: RANKING_HISTORY.map((r) => r.percentile),
        borderColor: colors.brand.primary,
        backgroundColor: `${colors.brand.primary}20`,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: colors.brand.primary,
        pointBorderColor: colors.bg.secondary,
        pointBorderWidth: 2,
      },
    ],
  }), []);

  const rankingChartOptions: ChartOptions<'line'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: colors.bg.tertiary,
          titleColor: colors.text.primary,
          bodyColor: colors.text.secondary,
          borderColor: colors.border.default,
          borderWidth: 1,
          callbacks: {
            label: (ctx) => {
              const idx = ctx.dataIndex;
              return `Rank #${RANKING_HISTORY[idx].rank} (P${RANKING_HISTORY[idx].percentile})`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { color: colors.text.muted, font: { size: 10 } },
          grid: { color: `${colors.border.default}22` },
        },
        y: {
          min: 50,
          max: 100,
          ticks: {
            color: colors.text.muted,
            font: { size: 10 },
            callback: (value) => `P${value}`,
          },
          grid: { color: `${colors.border.default}22` },
        },
      },
    }),
    [],
  );

  const earnedBadges = ACHIEVEMENTS.filter((a) => a.earned);
  const unearnedBadges = ACHIEVEMENTS.filter((a) => !a.earned);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: colors.bg.primary, padding: `${spacing.xl}px` }}>
      <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text.primary, marginBottom: `${spacing.lg}px` }}>
        Station Benchmark
      </Typography>

      <Grid container spacing={3}>
        {/* Percentile Ring */}
        <Grid size={{ xs: 12, md: 4 }}>
          <WrfCard title="Network Percentile" subtitle={`Out of ${NETWORK_SIZE.toLocaleString()} active stations`}>
            <Box sx={{ display: 'flex', justifyContent: 'center', padding: `${spacing.md}px 0` }}>
              <PercentileRing percentile={OVERALL_PERCENTILE} size={200} />
            </Box>
          </WrfCard>
        </Grid>

        {/* Metric Breakdown */}
        <Grid size={{ xs: 12, md: 8 }}>
          <WrfCard
            title="Metric Breakdown"
            subtitle="Station performance vs. network average"
            action={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '1px', backgroundColor: colors.text.muted }} />
                <Typography sx={{ fontSize: '0.65rem', color: colors.text.muted }}>Network Avg</Typography>
              </Box>
            }
          >
            {METRIC_BREAKDOWN.map((metric) => (
              <MetricBar key={metric.label} metric={metric} />
            ))}
          </WrfCard>
        </Grid>

        {/* Ranking History Chart */}
        <Grid size={{ xs: 12 }}>
          <WrfCard title="Ranking Trend" subtitle="Monthly percentile ranking over the past year">
            <Box sx={{ height: 280 }}>
              <Line data={rankingChartData} options={rankingChartOptions} />
            </Box>
          </WrfCard>
        </Grid>

        {/* Achievement Badges */}
        <Grid size={{ xs: 12 }}>
          <WrfCard title="Achievement Badges" subtitle={`${earnedBadges.length} earned, ${unearnedBadges.length} remaining`}>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: colors.text.secondary, marginBottom: `${spacing.sm}px` }}>
              Earned
            </Typography>
            <Grid container spacing={2} sx={{ marginBottom: `${spacing.lg}px` }}>
              {earnedBadges.map((badge) => (
                <Grid size={{ xs: 6, sm: 4, md: 3 }} key={badge.id}>
                  <Box
                    sx={{
                      padding: `${spacing.md}px`,
                      borderRadius: `${borderRadius.md}px`,
                      backgroundColor: colors.bg.primary,
                      border: `1px solid ${TIER_COLORS[badge.tier]}44`,
                      textAlign: 'center',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: shadows.glow(TIER_COLORS[badge.tier]),
                        borderColor: TIER_COLORS[badge.tier],
                      },
                    }}
                  >
                    <Typography sx={{ fontSize: '2rem', lineHeight: 1.2, marginBottom: '6px' }}>
                      {badge.icon}
                    </Typography>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: colors.text.primary }}>
                      {badge.name}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        color: TIER_COLORS[badge.tier],
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '4px',
                      }}
                    >
                      {badge.tier}
                    </Typography>
                    <Typography sx={{ fontSize: '0.65rem', color: colors.text.muted, lineHeight: 1.4 }}>
                      {badge.description}
                    </Typography>
                    {badge.earnedDate && (
                      <Typography sx={{ fontSize: '0.6rem', color: colors.text.muted, marginTop: '4px' }}>
                        Earned {badge.earnedDate}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              ))}
            </Grid>

            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: colors.text.muted, marginBottom: `${spacing.sm}px` }}>
              Locked
            </Typography>
            <Grid container spacing={2}>
              {unearnedBadges.map((badge) => (
                <Grid size={{ xs: 6, sm: 4, md: 3 }} key={badge.id}>
                  <Box
                    sx={{
                      padding: `${spacing.md}px`,
                      borderRadius: `${borderRadius.md}px`,
                      backgroundColor: colors.bg.primary,
                      border: `1px solid ${colors.border.default}`,
                      textAlign: 'center',
                      opacity: 0.5,
                    }}
                  >
                    <Typography sx={{ fontSize: '2rem', lineHeight: 1.2, marginBottom: '6px', filter: 'grayscale(1)' }}>
                      {badge.icon}
                    </Typography>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: colors.text.muted }}>
                      {badge.name}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        color: colors.text.muted,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '4px',
                      }}
                    >
                      {badge.tier}
                    </Typography>
                    <Typography sx={{ fontSize: '0.65rem', color: colors.text.muted, lineHeight: 1.4 }}>
                      {badge.description}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </WrfCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StationBenchmark;
