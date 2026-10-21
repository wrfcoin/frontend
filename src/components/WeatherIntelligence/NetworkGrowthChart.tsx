import React, { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import CellTowerIcon from '@mui/icons-material/CellTower';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import FlagIcon from '@mui/icons-material/Flag';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import PlaceIcon from '@mui/icons-material/Place';
import StarIcon from '@mui/icons-material/Star';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { WrfCard, WrfStatCard, WrfBadge, WrfButton } from '../ui';
import { WrfCapabilityReadinessBadge } from '../DesignSystem';
import { colors, spacing, borderRadius } from '../ui/tokens';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip, Legend);

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MONTHS_12 = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];

// Cumulative station counts
const CUMULATIVE_ACTUAL = [320, 380, 455, 540, 610, 695, 780, 870, 960, 1060, 1150, 1248];
const CUMULATIVE_TARGET = [350, 420, 500, 590, 680, 780, 880, 990, 1100, 1220, 1350, 1500];
// Projection (dashed continuation from current)
const PROJECTION_LABELS = ['Mar', 'Apr', 'May', 'Jun'];
const PROJECTION_VALUES = [1350, 1460, 1580, 1720];

// Regional stacked bar data
const REGIONS = [
  { key: 'northeast', label: 'Northeast', color: colors.brand.primary },
  { key: 'southeast', label: 'Southeast', color: colors.success.main },
  { key: 'midwest', label: 'Midwest', color: colors.warning.main },
  { key: 'west', label: 'West', color: '#8B5CF6' },
  { key: 'international', label: 'International', color: '#EC4899' },
];

const REGIONAL_DATA: Record<string, number[]> = {
  northeast: [45, 52, 58, 64, 70, 75, 80, 86, 91, 96, 102, 108],
  southeast: [38, 44, 50, 58, 66, 74, 82, 90, 98, 106, 112, 120],
  midwest: [32, 38, 46, 54, 60, 68, 76, 84, 92, 100, 108, 115],
  west: [28, 34, 42, 50, 58, 66, 74, 82, 90, 98, 105, 112],
  international: [10, 14, 20, 28, 36, 44, 54, 64, 76, 88, 98, 110],
};

// Milestones
interface Milestone {
  date: string;
  title: string;
  description: string;
  stations: number;
  achieved: boolean;
}

const MILESTONES: Milestone[] = [
  { date: 'Mar 2025', title: 'Network Launch', description: 'First 320 stations deployed across 12 states', stations: 320, achieved: true },
  { date: 'Jun 2025', title: '500 Stations', description: 'Half-thousand milestone with 18 states covered', stations: 500, achieved: true },
  { date: 'Oct 2025', title: '1,000 Stations', description: 'Quadruple digits with international expansion', stations: 1000, achieved: true },
  { date: 'Feb 2026', title: 'Current', description: '1,248 stations across 24 states + 8 countries', stations: 1248, achieved: true },
  { date: 'Jun 2026', title: '1,500 Target', description: 'Target: Full continental US coverage', stations: 1500, achieved: false },
  { date: 'Dec 2026', title: '2,500 Target', description: 'Target: Global weather intelligence network', stations: 2500, achieved: false },
];

// Incentive zones
interface IncentiveZone {
  id: string;
  region: string;
  bonus: string;
  stationsNeeded: number;
  currentStations: number;
  deadline: string;
}

const INCENTIVE_ZONES: IncentiveZone[] = [
  { id: 'IZ-001', region: 'Appalachian Corridor', bonus: '3.5x WRF', stationsNeeded: 45, currentStations: 12, deadline: 'Apr 2026' },
  { id: 'IZ-002', region: 'Gulf Coast', bonus: '3.0x WRF', stationsNeeded: 60, currentStations: 28, deadline: 'May 2026' },
  { id: 'IZ-003', region: 'Northern Rockies', bonus: '2.8x WRF', stationsNeeded: 35, currentStations: 8, deadline: 'Jun 2026' },
  { id: 'IZ-004', region: 'Great Plains', bonus: '2.5x WRF', stationsNeeded: 50, currentStations: 22, deadline: 'Jul 2026' },
  { id: 'IZ-005', region: 'Pacific Northwest', bonus: '2.2x WRF', stationsNeeded: 40, currentStations: 19, deadline: 'Aug 2026' },
];

// ---------------------------------------------------------------------------
// Chart Options
// ---------------------------------------------------------------------------

const commonChartOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
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
      ticks: { color: colors.text.muted, font: { size: 10 } },
      grid: { color: 'rgba(51, 65, 85, 0.3)' },
    },
    y: {
      ticks: { color: colors.text.muted, font: { size: 10 } },
      grid: { color: 'rgba(51, 65, 85, 0.3)' },
    },
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const NetworkGrowthChart: React.FC = () => {
  // Cumulative growth chart data
  const growthData = useMemo(() => {
    const allLabels = [...MONTHS_12, ...PROJECTION_LABELS];
    const actualPadded = [...CUMULATIVE_ACTUAL, ...new Array(PROJECTION_LABELS.length).fill(null)];
    const targetPadded = [...CUMULATIVE_TARGET, ...PROJECTION_VALUES.map((_, i) => CUMULATIVE_TARGET[CUMULATIVE_TARGET.length - 1] + (i + 1) * 125)];
    const projectionPadded = [...new Array(MONTHS_12.length - 1).fill(null), CUMULATIVE_ACTUAL[CUMULATIVE_ACTUAL.length - 1], ...PROJECTION_VALUES];

    return {
      labels: allLabels,
      datasets: [
        {
          label: 'Actual Stations',
          data: actualPadded,
          borderColor: colors.brand.primary,
          backgroundColor: `${colors.brand.primary}18`,
          borderWidth: 2.5,
          pointRadius: 3,
          tension: 0.3,
          fill: true,
        },
        {
          label: 'Target',
          data: targetPadded,
          borderColor: colors.text.muted,
          borderDash: [6, 4],
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.3,
          fill: false,
        },
        {
          label: 'Projection',
          data: projectionPadded,
          borderColor: colors.success.main,
          borderDash: [4, 4],
          borderWidth: 2,
          pointRadius: 2,
          tension: 0.3,
          fill: false,
        },
      ],
    };
  }, []);

  // Regional stacked bar data
  const regionalData = useMemo(
    () => ({
      labels: MONTHS_12,
      datasets: REGIONS.map((region) => ({
        label: region.label,
        data: REGIONAL_DATA[region.key],
        backgroundColor: `${region.color}CC`,
        borderRadius: 2,
      })),
    }),
    [],
  );

  // Target vs Actual comparison
  const targetVsActual = useMemo(() => {
    const diff = CUMULATIVE_ACTUAL.map((val, i) => val - CUMULATIVE_TARGET[i]);
    return {
      labels: MONTHS_12,
      datasets: [
        {
          label: 'Ahead/Behind Target',
          data: diff,
          backgroundColor: diff.map((d) => (d >= 0 ? `${colors.success.main}80` : `${colors.error.main}80`)),
          borderRadius: 4,
        },
      ],
    };
  }, []);

  const newThisMonth = CUMULATIVE_ACTUAL[CUMULATIVE_ACTUAL.length - 1] - CUMULATIVE_ACTUAL[CUMULATIVE_ACTUAL.length - 2];
  const growthRate = ((newThisMonth / CUMULATIVE_ACTUAL[CUMULATIVE_ACTUAL.length - 2]) * 100).toFixed(1);
  const targetGap = CUMULATIVE_TARGET[CUMULATIVE_TARGET.length - 1] - CUMULATIVE_ACTUAL[CUMULATIVE_ACTUAL.length - 1];

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: colors.bg.primary, padding: `${spacing.lg}px` }}>
      {/* Page Header */}
      <Box sx={{ marginBottom: `${spacing.lg}px` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px`, marginBottom: `${spacing.xs}px` }}>
          <CellTowerIcon sx={{ color: colors.brand.primary, fontSize: 28 }} />
          <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: colors.text.primary }}>
            Network Growth
          </Typography>
          <WrfCapabilityReadinessBadge featureName="weatherIntelligence" compact sx={{ ml: 1 }} />
        </Box>
        <Typography sx={{ fontSize: '0.875rem', color: colors.text.secondary }}>
          Track station deployment, regional expansion, and network growth targets for the WRFCoin weather intelligence network.
        </Typography>
      </Box>

      {/* Stat Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: `${spacing.md}px`, marginBottom: `${spacing.lg}px` }}>
        <WrfStatCard
          label="Total Stations"
          value="1,248"
          trend={8.5}
          trendLabel="this month"
          icon={CellTowerIcon}
          color={colors.brand.primary}
          sparklineData={CUMULATIVE_ACTUAL.slice(-8)}
        />
        <WrfStatCard
          label="New This Month"
          value={newThisMonth}
          trend={12.3}
          trendLabel="vs last month"
          icon={AddCircleIcon}
          color={colors.success.main}
          sparklineData={[60, 65, 75, 85, 70, 85, 90, 98]}
        />
        <WrfStatCard
          label="Monthly Growth"
          value={`${growthRate}%`}
          trend={1.8}
          trendLabel="accelerating"
          icon={TrendingUpIcon}
          color={colors.success.main}
          sparklineData={[5.2, 5.8, 6.4, 7.0, 7.5, 8.0, 8.2, 8.5]}
        />
        <WrfStatCard
          label="Target Gap"
          value={`-${targetGap}`}
          trend={-5.2}
          trendLabel="gap shrinking"
          icon={FlagIcon}
          color={colors.warning.main}
          sparklineData={[380, 340, 300, 270, 250, 260, 252, 252]}
        />
      </Box>

      {/* Cumulative Growth Area Chart */}
      <WrfCard
        title="Cumulative Station Growth"
        subtitle="Actual deployment vs target with 4-month projection based on current growth rate"
        action={<WrfBadge status="online" label="Live" size="sm" pulse />}
        sx={{ marginBottom: `${spacing.md}px` }}
      >
        <Box sx={{ height: 380 }}>
          <Line
            data={growthData}
            options={{
              ...commonChartOpts,
              scales: {
                ...commonChartOpts.scales,
                y: {
                  ...commonChartOpts.scales.y,
                  title: { display: true, text: 'Stations', color: colors.text.muted, font: { size: 11 } },
                },
              },
            }}
          />
        </Box>
      </WrfCard>

      {/* Middle Row: Regional + Target vs Actual */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: `${spacing.md}px`, marginBottom: `${spacing.md}px` }}>
        {/* Regional Stacked Bar */}
        <WrfCard title="Regional Distribution" subtitle="Station deployment by geographic region over time">
          <Box sx={{ height: 320 }}>
            <Bar
              data={regionalData}
              options={{
                ...commonChartOpts,
                scales: {
                  ...commonChartOpts.scales,
                  x: { ...commonChartOpts.scales.x, stacked: true },
                  y: {
                    ...commonChartOpts.scales.y,
                    stacked: true,
                    title: { display: true, text: 'New Stations', color: colors.text.muted, font: { size: 11 } },
                  },
                },
              }}
            />
          </Box>
        </WrfCard>

        {/* Target vs Actual */}
        <WrfCard title="Target vs Actual" subtitle="Monthly performance relative to deployment targets (positive = ahead)">
          <Box sx={{ height: 320 }}>
            <Bar
              data={targetVsActual}
              options={{
                ...commonChartOpts,
                plugins: {
                  ...commonChartOpts.plugins,
                  legend: { display: false },
                },
                scales: {
                  ...commonChartOpts.scales,
                  y: {
                    ...commonChartOpts.scales.y,
                    title: { display: true, text: 'Stations +/-', color: colors.text.muted, font: { size: 11 } },
                  },
                },
              }}
            />
          </Box>
        </WrfCard>
      </Box>

      {/* Bottom Row: Milestones + Incentive Zones */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: `${spacing.md}px` }}>
        {/* Milestones */}
        <WrfCard title="Network Milestones" subtitle="Key growth achievements and upcoming targets">
          <List disablePadding>
            {MILESTONES.map((milestone, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <Divider sx={{ borderColor: colors.border.default }} />}
                <ListItem sx={{ px: 0, py: 1.25, opacity: milestone.achieved ? 1 : 0.65 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {milestone.achieved ? (
                      <EmojiEventsIcon sx={{ fontSize: 20, color: colors.success.main }} />
                    ) : (
                      <FlagIcon sx={{ fontSize: 20, color: colors.text.muted }} />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: colors.text.primary }}>
                          {milestone.title}
                        </Typography>
                        <Chip
                          label={`${milestone.stations.toLocaleString()} stations`}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.625rem',
                            fontWeight: 600,
                            backgroundColor: milestone.achieved ? 'rgba(16, 185, 129, 0.12)' : colors.bg.tertiary,
                            color: milestone.achieved ? colors.success.main : colors.text.muted,
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                        <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted }}>
                          {milestone.date}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: colors.text.secondary }}>
                          {milestone.description}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </WrfCard>

        {/* Incentive Zones */}
        <WrfCard
          title="Incentive Zones"
          subtitle="Priority deployment regions with bonus reward multipliers"
          action={<WrfBadge status="pending" label={`${INCENTIVE_ZONES.length} active`} size="sm" />}
        >
          <List disablePadding>
            {INCENTIVE_ZONES.map((zone, idx) => {
              const progress = (zone.currentStations / zone.stationsNeeded) * 100;
              return (
                <React.Fragment key={zone.id}>
                  {idx > 0 && <Divider sx={{ borderColor: colors.border.default }} />}
                  <ListItem sx={{ px: 0, py: 1.25, flexDirection: 'column', alignItems: 'stretch' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PlaceIcon sx={{ fontSize: 16, color: colors.brand.primary }} />
                        <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: colors.text.primary }}>
                          {zone.region}
                        </Typography>
                      </Box>
                      <Chip
                        icon={<StarIcon sx={{ fontSize: '12px !important', color: `${colors.success.main} !important` }} />}
                        label={zone.bonus}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          backgroundColor: 'rgba(16, 185, 129, 0.12)',
                          color: colors.success.main,
                          '& .MuiChip-icon': { marginLeft: '6px' },
                        }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Box sx={{ flex: 1, height: 6, backgroundColor: colors.bg.tertiary, borderRadius: 3, overflow: 'hidden' }}>
                        <Box
                          sx={{
                            width: `${Math.min(progress, 100)}%`,
                            height: '100%',
                            backgroundColor: progress > 60 ? colors.success.main : progress > 30 ? colors.warning.main : colors.error.main,
                            borderRadius: 3,
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </Box>
                      <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: colors.text.secondary, minWidth: 50, textAlign: 'right' }}>
                        {zone.currentStations}/{zone.stationsNeeded}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: '0.6875rem', color: colors.text.muted }}>
                        Deadline: {zone.deadline}
                      </Typography>
                      <WrfButton variant="ghost" size="sm" startIcon={<RocketLaunchIcon sx={{ fontSize: 14 }} />}>
                        Deploy
                      </WrfButton>
                    </Box>
                  </ListItem>
                </React.Fragment>
              );
            })}
          </List>
        </WrfCard>
      </Box>
    </Box>
  );
};

export default NetworkGrowthChart;
