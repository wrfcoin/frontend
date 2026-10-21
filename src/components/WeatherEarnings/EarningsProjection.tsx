import React, { useState, useMemo, useCallback } from 'react';
import { Alert, Box, Typography, Paper, ToggleButtonGroup, ToggleButton, Chip, LinearProgress } from '@mui/material';
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
import { toWrfNumberForChart } from '../../services/apiClient/number';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, ChartTooltip, Legend);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProjectionHorizon = '7d' | '30d' | '90d';

interface Scenario {
  label: string;
  multiplier: number;
  color: string;
  bgColor: string;
}

interface EarningTip {
  title: string;
  description: string;
  potentialGain: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  color: string;
}

interface EarningsProjectionProps {
  stationId: string;
  summary: {
    today: string | null;
    thisWeek: string | null;
    thisMonth: string | null;
    allTime: string | null;
    currentRate: string | null;
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WRF_USD_RATE = 0.42;

const SCENARIOS: Scenario[] = [
  { label: 'Conservative', multiplier: 0.8, color: '#94A3B8', bgColor: 'rgba(148,163,184,0.1)' },
  { label: 'Expected', multiplier: 1.0, color: '#3B82F6', bgColor: 'rgba(59,130,246,0.1)' },
  { label: 'Optimistic', multiplier: 1.25, color: '#10B981', bgColor: 'rgba(16,185,129,0.1)' },
];

const TIPS: EarningTip[] = [
  {
    title: 'Improve spatial consensus score',
    description: 'Your station agrees with 82% of nearby stations. Calibrating sensors could push this to 95%, unlocking the spatial bonus tier.',
    potentialGain: '+15% bonus',
    difficulty: 'Medium',
    color: '#8B5CF6',
  },
  {
    title: 'Maintain your 43-day streak',
    description: 'You are 47 days away from the 90-day milestone which unlocks the 1.5x streak multiplier (currently 1.35x).',
    potentialGain: '+11% multiplier',
    difficulty: 'Easy',
    color: '#10B981',
  },
  {
    title: 'Submit during off-peak hours',
    description: 'Data submitted between 2:00-6:00 AM local time receives a 5% off-peak bonus due to lower network coverage.',
    potentialGain: '+5% bonus',
    difficulty: 'Easy',
    color: '#F59E0B',
  },
  {
    title: 'Increase data submission frequency',
    description: 'Moving from 15-minute to 5-minute intervals will improve temporal resolution scoring and increase base rewards.',
    potentialGain: '+20% base rate',
    difficulty: 'Hard',
    color: '#3B82F6',
  },
  {
    title: 'Refer a new station operator',
    description: 'Each active referral earns you 5% of their base rewards for the first 6 months.',
    potentialGain: '+5% passive income',
    difficulty: 'Medium',
    color: '#EC4899',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateProjectionData(
  dailyRate: number,
  days: number,
): { labels: string[]; conservative: number[]; expected: number[]; optimistic: number[] } {
  const labels: string[] = [];
  const conservative: number[] = [];
  const expected: number[] = [];
  const optimistic: number[] = [];
  const now = new Date();

  let cumCon = 0;
  let cumExp = 0;
  let cumOpt = 0;

  for (let i = 1; i <= days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const step = days > 30 ? Math.ceil(days / 30) : 1;
    labels.push(i % step === 0 || i === 1 || i === days ? `Day ${i}` : '');

    // Add slight variance to make it look realistic
    const noise = Math.sin(i * 0.5) * 0.15;
    cumCon += dailyRate * SCENARIOS[0].multiplier * (1 + noise * 0.5);
    cumExp += dailyRate * SCENARIOS[1].multiplier * (1 + noise * 0.3);
    cumOpt += dailyRate * SCENARIOS[2].multiplier * (1 + noise * 0.2);

    conservative.push(parseFloat(cumCon.toFixed(2)));
    expected.push(parseFloat(cumExp.toFixed(2)));
    optimistic.push(parseFloat(cumOpt.toFixed(2)));
  }

  return { labels, conservative, expected, optimistic };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ScenarioCardProps {
  scenario: Scenario;
  projected: number;
  isSelected: boolean;
}

const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenario, projected, isSelected }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2,
      borderRadius: 2,
      bgcolor: isSelected ? scenario.bgColor : '#0F172A',
      border: `1px solid ${isSelected ? scenario.color : '#334155'}`,
      textAlign: 'center',
      transition: 'all 0.2s',
    }}
  >
    <Typography variant="caption" sx={{ color: scenario.color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {scenario.label}
    </Typography>
    <Typography variant="h5" sx={{ color: '#FFFFFF', fontWeight: 700, mt: 0.5 }}>
      {projected.toFixed(2)}
    </Typography>
    <Typography variant="caption" sx={{ color: '#64748B' }}>
      WRF (${(projected * WRF_USD_RATE).toFixed(2)})
    </Typography>
  </Paper>
);

interface TipCardProps {
  tip: EarningTip;
}

const TipCard: React.FC<TipCardProps> = ({ tip }) => {
  const difficultyColors: Record<string, string> = {
    Easy: '#10B981',
    Medium: '#F59E0B',
    Hard: '#EF4444',
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: '#0F172A',
        border: '1px solid #334155',
        transition: 'border-color 0.2s',
        '&:hover': { borderColor: tip.color },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="subtitle2" sx={{ color: '#E2E8F0', fontWeight: 600, flex: 1 }}>
          {tip.title}
        </Typography>
        <Chip
          label={tip.potentialGain}
          size="small"
          sx={{
            height: 20,
            fontSize: '0.65rem',
            fontWeight: 700,
            bgcolor: `${tip.color}15`,
            color: tip.color,
            border: `1px solid ${tip.color}30`,
            ml: 1,
            flexShrink: 0,
          }}
        />
      </Box>
      <Typography variant="caption" sx={{ color: '#94A3B8', lineHeight: 1.5, display: 'block', mb: 1 }}>
        {tip.description}
      </Typography>
      <Chip
        label={tip.difficulty}
        size="small"
        sx={{
          height: 18,
          fontSize: '0.6rem',
          fontWeight: 600,
          bgcolor: `${difficultyColors[tip.difficulty]}15`,
          color: difficultyColors[tip.difficulty],
        }}
      />
    </Paper>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const EarningsProjection: React.FC<EarningsProjectionProps> = ({ stationId, summary }) => {
  const [horizon, setHorizon] = useState<ProjectionHorizon>('30d');

  const daysMap: Record<ProjectionHorizon, number> = { '7d': 7, '30d': 30, '90d': 90 };
  const days = daysMap[horizon];
  const hourlyRate = toWrfNumberForChart(summary.currentRate);
  const dailyRate = hourlyRate === null ? null : hourlyRate * 24;

  const projectionData = useMemo(
    () => dailyRate === null
      ? { labels: [], conservative: [], expected: [], optimistic: [] }
      : generateProjectionData(dailyRate, days),
    [dailyRate, days],
  );

  const handleHorizonChange = useCallback((_: React.MouseEvent<HTMLElement>, value: ProjectionHorizon | null) => {
    if (value) setHorizon(value);
  }, []);

  // Final projected values
  const finalConservative = projectionData.conservative[projectionData.conservative.length - 1] || 0;
  const finalExpected = projectionData.expected[projectionData.expected.length - 1] || 0;
  const finalOptimistic = projectionData.optimistic[projectionData.optimistic.length - 1] || 0;

  // Area chart data
  const areaChartData = useMemo(
    () => ({
      labels: projectionData.labels,
      datasets: [
        {
          label: 'Optimistic',
          data: projectionData.optimistic,
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 4,
          order: 1,
        },
        {
          label: 'Expected',
          data: projectionData.expected,
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.12)',
          borderWidth: 2.5,
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 4,
          order: 2,
        },
        {
          label: 'Conservative',
          data: projectionData.conservative,
          borderColor: '#94A3B8',
          backgroundColor: 'rgba(148, 163, 184, 0.08)',
          borderWidth: 1.5,
          borderDash: [4, 4],
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 4,
          order: 3,
        },
      ],
    }),
    [projectionData],
  );

  const areaChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index' as const, intersect: false },
      plugins: {
        legend: {
          display: true,
          position: 'top' as const,
          labels: { color: '#94A3B8', usePointStyle: true, pointStyleWidth: 12, padding: 16, font: { size: 11 } },
        },
        tooltip: {
          backgroundColor: '#1E293B',
          titleColor: '#E2E8F0',
          bodyColor: '#94A3B8',
          borderColor: '#334155',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: (ctx: { dataset: { label: string }; parsed: { y: number } }) => {
              const val = ctx.parsed.y;
              return `${ctx.dataset.label}: ${val.toFixed(2)} WRF ($${(val * WRF_USD_RATE).toFixed(2)})`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(51, 65, 85, 0.4)' },
          ticks: { color: '#64748B', font: { size: 10 } },
        },
        y: {
          grid: { color: 'rgba(51, 65, 85, 0.4)' },
          ticks: {
            color: '#94A3B8',
            font: { size: 10 },
            callback: (value: number | string) => `${value} WRF`,
          },
          title: { display: true, text: 'Cumulative WRF', color: '#94A3B8', font: { size: 11 } },
        },
      },
    }),
    [],
  );

  // Current vs Potential comparison
  const currentDailyRate = dailyRate ?? 0;
  const potentialDailyRate = currentDailyRate * 1.51; // If all tips applied

  const comparisonData = useMemo(
    () => ({
      labels: ['Current', 'Potential'],
      datasets: [
        {
          data: [currentDailyRate, potentialDailyRate],
          backgroundColor: ['rgba(59,130,246,0.7)', 'rgba(16,185,129,0.7)'],
          borderColor: ['#3B82F6', '#10B981'],
          borderWidth: 1,
          borderRadius: 6,
          barPercentage: 0.5,
        },
      ],
    }),
    [currentDailyRate, potentialDailyRate],
  );

  const comparisonOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y' as const,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1E293B',
          titleColor: '#E2E8F0',
          bodyColor: '#94A3B8',
          borderColor: '#334155',
          borderWidth: 1,
          callbacks: {
            label: (ctx: { parsed: { x: number } }) => `${ctx.parsed.x.toFixed(2)} WRF/day`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(51,65,85,0.4)' },
          ticks: { color: '#94A3B8', font: { size: 10 }, callback: (v: number | string) => `${v} WRF` },
        },
        y: {
          grid: { display: false },
          ticks: { color: '#E2E8F0', font: { size: 12, weight: 600 as any } },
        },
      },
    }),
    [],
  );

  if (dailyRate === null) {
    return (
      <Alert severity="warning">
        Projection unavailable: the current earnings rate is outside the safe chart range.
      </Alert>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Projection Chart */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: '#1E293B', border: '1px solid #334155' }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 700 }}>
              Earnings Projection
            </Typography>
            <Typography variant="body2" sx={{ color: '#94A3B8', mt: 0.25 }}>
              Based on current daily rate of {dailyRate.toFixed(2)} WRF/day
            </Typography>
          </Box>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={horizon}
            onChange={handleHorizonChange}
            sx={{
              '.MuiToggleButton-root': {
                color: '#94A3B8',
                borderColor: '#334155',
                textTransform: 'none',
                px: 2,
                '&.Mui-selected': { bgcolor: 'rgba(59,130,246,0.15)', color: '#3B82F6', borderColor: '#3B82F6' },
                '&.Mui-selected:hover': { bgcolor: 'rgba(59,130,246,0.25)' },
              },
            }}
          >
            <ToggleButton value="7d">7 Days</ToggleButton>
            <ToggleButton value="30d">30 Days</ToggleButton>
            <ToggleButton value="90d">90 Days</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Scenario Summary Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 3 }}>
          <ScenarioCard scenario={SCENARIOS[0]} projected={finalConservative} isSelected={false} />
          <ScenarioCard scenario={SCENARIOS[1]} projected={finalExpected} isSelected={true} />
          <ScenarioCard scenario={SCENARIOS[2]} projected={finalOptimistic} isSelected={false} />
        </Box>

        {/* Area Chart */}
        <Box sx={{ height: 350, position: 'relative' }}>
          <Line data={areaChartData} options={areaChartOptions as any} />
        </Box>
      </Paper>

      {/* Two-column: Current vs Potential + Tips */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
        {/* Current vs Potential */}
        <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: '#1E293B', border: '1px solid #334155' }}>
          <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 700, mb: 1 }}>
            Current vs Potential
          </Typography>
          <Typography variant="body2" sx={{ color: '#94A3B8', mb: 2 }}>
            Your daily rate could increase by{' '}
            <Box component="span" sx={{ color: '#10B981', fontWeight: 600 }}>
              {((potentialDailyRate / currentDailyRate - 1) * 100).toFixed(0)}%
            </Box>{' '}
            by following the optimization tips.
          </Typography>

          <Box sx={{ height: 120, mb: 2 }}>
            <Bar data={comparisonData} options={comparisonOptions as any} />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>Current Monthly</Typography>
              <Typography variant="h6" sx={{ color: '#3B82F6', fontWeight: 700 }}>
                {(currentDailyRate * 30).toFixed(1)} WRF
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', color: '#64748B' }}>
              &rarr;
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>Potential Monthly</Typography>
              <Typography variant="h6" sx={{ color: '#10B981', fontWeight: 700 }}>
                {(potentialDailyRate * 30).toFixed(1)} WRF
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" sx={{ color: '#64748B', mb: 0.5, display: 'block' }}>
              Optimization Progress
            </Typography>
            <LinearProgress
              variant="determinate"
              value={(currentDailyRate / potentialDailyRate) * 100}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: '#334155',
                '.MuiLinearProgress-bar': {
                  borderRadius: 4,
                  background: 'linear-gradient(90deg, #3B82F6, #10B981)',
                },
              }}
            />
            <Typography variant="caption" sx={{ color: '#94A3B8', mt: 0.5, display: 'block' }}>
              {((currentDailyRate / potentialDailyRate) * 100).toFixed(0)}% of maximum potential
            </Typography>
          </Box>
        </Paper>

        {/* Earnings Tips */}
        <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: '#1E293B', border: '1px solid #334155' }}>
          <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 700, mb: 0.5 }}>
            Tips to Maximize Earnings
          </Typography>
          <Typography variant="body2" sx={{ color: '#94A3B8', mb: 2 }}>
            Actionable steps to increase your WRF rewards
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {TIPS.map((tip) => (
              <TipCard key={tip.title} tip={tip} />
            ))}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default EarningsProjection;
