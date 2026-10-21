import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  LinearProgress,
  Chip,
  Divider,
  Tooltip,
} from '@mui/material';
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
import TrendingDown from '@mui/icons-material/TrendingDown';
import Co2 from '@mui/icons-material/Co2';
import DemoSurfaceGate from '../common/DemoSurfaceGate';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, ChartTooltip, Legend);

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function generateMonthly(base, variance) {
  return MONTHS.map(() => Math.round(base + (Math.random() - 0.5) * variance));
}

const SCOPE_DATA = {
  scope1: {
    label: 'Scope 1 - Direct Emissions',
    color: '#EF4444',
    bgColor: '#EF44441A',
    total: 3420,
    prevTotal: 3780,
    target: 2800,
    categories: [
      { name: 'Fuel Combustion', current: 1850, previous: 2040, monthly: generateMonthly(154, 30) },
      { name: 'Process Emissions', current: 920, previous: 1010, monthly: generateMonthly(77, 15) },
      { name: 'Fugitive Emissions', current: 650, previous: 730, monthly: generateMonthly(54, 12) },
    ],
  },
  scope2: {
    label: 'Scope 2 - Energy Indirect',
    color: '#F59E0B',
    bgColor: '#F59E0B1A',
    total: 5180,
    prevTotal: 5640,
    target: 4200,
    categories: [
      { name: 'Purchased Electricity', current: 4120, previous: 4530, monthly: generateMonthly(343, 50) },
      { name: 'Purchased Heating/Cooling', current: 1060, previous: 1110, monthly: generateMonthly(88, 20) },
    ],
  },
  scope3: {
    label: 'Scope 3 - Value Chain',
    color: '#8B5CF6',
    bgColor: '#8B5CF61A',
    total: 4247,
    prevTotal: 4690,
    target: 3500,
    categories: [
      { name: 'Upstream Transportation', current: 1120, previous: 1280, monthly: generateMonthly(93, 20) },
      { name: 'Business Travel', current: 857, previous: 1020, monthly: generateMonthly(71, 18) },
      { name: 'Employee Commuting', current: 640, previous: 690, monthly: generateMonthly(53, 10) },
      { name: 'Purchased Goods & Services', current: 1230, previous: 1300, monthly: generateMonthly(103, 25) },
      { name: 'Waste Generated', current: 400, previous: 400, monthly: generateMonthly(33, 8) },
    ],
  },
};

const GRAND_TOTAL = Object.values(SCOPE_DATA).reduce((s, d) => s + d.total, 0);
const PREV_GRAND_TOTAL = Object.values(SCOPE_DATA).reduce((s, d) => s + d.prevTotal, 0);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function DeltaChip({ current, previous }) {
  const delta = ((current - previous) / previous) * 100;
  const isDown = delta < 0;
  return (
    <Chip
      size="small"
      label={`${isDown ? '' : '+'}${delta.toFixed(1)}% YoY`}
      sx={{
        bgcolor: isDown ? '#10B9811A' : '#EF44441A',
        color: isDown ? '#10B981' : '#EF4444',
        fontWeight: 600,
        fontSize: '0.7rem',
      }}
    />
  );
}

function TargetProgress({ current, target, color }) {
  const pct = Math.min(100, (1 - (current - target) / current) * 100);
  const remaining = current - target;
  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" sx={{ color: '#94A3B8' }}>
          Reduction Target
        </Typography>
        <Typography variant="caption" sx={{ color: remaining > 0 ? '#F59E0B' : '#10B981', fontWeight: 600 }}>
          {remaining > 0 ? `${remaining.toLocaleString()} tCO\u2082e remaining` : 'Target met'}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 6,
          borderRadius: 3,
          bgcolor: '#334155',
          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 },
        }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.25 }}>
        <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.65rem' }}>
          Current: {current.toLocaleString()} tCO&#8322;e
        </Typography>
        <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.65rem' }}>
          Target: {target.toLocaleString()} tCO&#8322;e
        </Typography>
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ScopeBreakdownSample = () => {
  const [expandedCategory, setExpandedCategory] = useState(null);

  const handleCategoryClick = (scopeKey, catName) => {
    const key = `${scopeKey}-${catName}`;
    setExpandedCategory((prev) => (prev === key ? null : key));
  };

  // Doughnut chart data
  const doughnutData = useMemo(
    () => ({
      labels: Object.values(SCOPE_DATA).map((d) => d.label.split(' - ')[0]),
      datasets: [
        {
          data: Object.values(SCOPE_DATA).map((d) => d.total),
          backgroundColor: Object.values(SCOPE_DATA).map((d) => d.color),
          borderColor: '#1E293B',
          borderWidth: 3,
          hoverOffset: 6,
        },
      ],
    }),
    [],
  );

  const doughnutOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1E293B',
          borderColor: '#334155',
          borderWidth: 1,
          titleColor: '#F1F5F9',
          bodyColor: '#94A3B8',
          callbacks: {
            label: (ctx) =>
              `${ctx.label}: ${ctx.raw.toLocaleString()} tCO\u2082e (${((ctx.raw / GRAND_TOTAL) * 100).toFixed(1)}%)`,
          },
        },
      },
    }),
    [],
  );

  return (
    <Paper sx={{ bgcolor: '#1E293B', border: '1px solid #334155', borderRadius: 2, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Co2 sx={{ color: '#3B82F6', fontSize: 28 }} />
          <Typography variant="h6" sx={{ color: '#F1F5F9', fontWeight: 600 }}>
            Scope 1 / 2 / 3 Emissions Breakdown
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ color: '#94A3B8' }}>
            Total: {GRAND_TOTAL.toLocaleString()} tCO&#8322;e
          </Typography>
          <DeltaChip current={GRAND_TOTAL} previous={PREV_GRAND_TOTAL} />
        </Box>
      </Box>

      {/* Overview row: Doughnut + summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ bgcolor: '#0F172A', border: '1px solid #334155', borderRadius: 2, p: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#94A3B8', mb: 1, textAlign: 'center' }}>
              Scope Proportions
            </Typography>
            <Box sx={{ height: 200, position: 'relative' }}>
              <Doughnut data={doughnutData} options={doughnutOptions} />
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                }}
              >
                <Typography variant="h5" sx={{ color: '#F1F5F9', fontWeight: 700, lineHeight: 1 }}>
                  {GRAND_TOTAL.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  tCO&#8322;e Total
                </Typography>
              </Box>
            </Box>
            {/* Legend */}
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {Object.entries(SCOPE_DATA).map(([key, scope]) => (
                <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: scope.color }} />
                    <Typography variant="caption" sx={{ color: '#CBD5E1' }}>
                      {scope.label.split(' - ')[0]}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                    {((scope.total / GRAND_TOTAL) * 100).toFixed(1)}%
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Year-over-year summary cards */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            {Object.entries(SCOPE_DATA).map(([key, scope]) => (
              <Grid item xs={12} sm={4} key={key}>
                <Paper
                  sx={{
                    bgcolor: '#0F172A',
                    border: `1px solid ${scope.color}33`,
                    borderRadius: 2,
                    p: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: scope.color }} />
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                      {scope.label}
                    </Typography>
                  </Box>
                  <Typography variant="h5" sx={{ color: '#F1F5F9', fontWeight: 700 }}>
                    {scope.total.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    tCO&#8322;e (FY 2025)
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      vs {scope.prevTotal.toLocaleString()} (FY 2024)
                    </Typography>
                    <DeltaChip current={scope.total} previous={scope.prevTotal} />
                  </Box>
                  <TargetProgress current={scope.total} target={scope.target} color={scope.color} />
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>

      <Divider sx={{ borderColor: '#334155', mb: 3 }} />

      {/* Detailed breakdown per scope */}
      <Grid container spacing={3}>
        {Object.entries(SCOPE_DATA).map(([scopeKey, scope]) => (
          <Grid item xs={12} md={4} key={scopeKey}>
            <Paper
              sx={{
                bgcolor: '#0F172A',
                border: '1px solid #334155',
                borderRadius: 2,
                p: 2,
                height: '100%',
              }}
            >
              <Typography variant="subtitle2" sx={{ color: scope.color, fontWeight: 600, mb: 2 }}>
                {scope.label}
              </Typography>

              {/* Stacked bar chart for categories */}
              <Box sx={{ height: 180, mb: 2 }}>
                <Bar
                  data={{
                    labels: scope.categories.map((c) => c.name.length > 14 ? c.name.slice(0, 14) + '...' : c.name),
                    datasets: [
                      {
                        label: 'Current Year',
                        data: scope.categories.map((c) => c.current),
                        backgroundColor: scope.color,
                        borderRadius: 4,
                        barPercentage: 0.6,
                      },
                      {
                        label: 'Previous Year',
                        data: scope.categories.map((c) => c.previous),
                        backgroundColor: '#475569',
                        borderRadius: 4,
                        barPercentage: 0.6,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    scales: {
                      x: {
                        grid: { color: '#1E293B' },
                        ticks: { color: '#64748B', font: { size: 10 } },
                      },
                      y: {
                        grid: { display: false },
                        ticks: { color: '#94A3B8', font: { size: 10 } },
                      },
                    },
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: '#1E293B',
                        borderColor: '#334155',
                        borderWidth: 1,
                        titleColor: '#F1F5F9',
                        bodyColor: '#94A3B8',
                      },
                    },
                  }}
                />
              </Box>

              {/* Category detail list */}
              {scope.categories.map((cat) => {
                const catKey = `${scopeKey}-${cat.name}`;
                const isExpanded = expandedCategory === catKey;
                const delta = ((cat.current - cat.previous) / cat.previous) * 100;
                const pctOfScope = ((cat.current / scope.total) * 100).toFixed(1);

                return (
                  <Box key={cat.name} sx={{ mb: 1 }}>
                    <Box
                      onClick={() => handleCategoryClick(scopeKey, cat.name)}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        py: 0.75,
                        px: 1,
                        borderRadius: 1,
                        '&:hover': { bgcolor: '#1E293B' },
                      }}
                    >
                      <Box>
                        <Typography variant="body2" sx={{ color: '#CBD5E1', fontSize: '0.8rem' }}>
                          {cat.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          {pctOfScope}% of scope
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" sx={{ color: '#F1F5F9', fontWeight: 600, fontSize: '0.8rem' }}>
                          {cat.current.toLocaleString()} tCO&#8322;e
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: delta < 0 ? '#10B981' : '#EF4444', fontWeight: 600 }}
                        >
                          {delta < 0 ? '' : '+'}
                          {delta.toFixed(1)}%
                        </Typography>
                      </Box>
                    </Box>

                    {/* Monthly drill-down */}
                    {isExpanded && (
                      <Box sx={{ mt: 1, px: 1 }}>
                        <Typography variant="caption" sx={{ color: '#64748B', mb: 0.5, display: 'block' }}>
                          Monthly Breakdown (tCO&#8322;e)
                        </Typography>
                        <Box sx={{ height: 100 }}>
                          <Bar
                            data={{
                              labels: MONTHS,
                              datasets: [
                                {
                                  data: cat.monthly,
                                  backgroundColor: scope.color,
                                  borderRadius: 2,
                                  barPercentage: 0.7,
                                },
                              ],
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              scales: {
                                x: {
                                  grid: { display: false },
                                  ticks: { color: '#64748B', font: { size: 8 } },
                                },
                                y: {
                                  grid: { color: '#1E293B' },
                                  ticks: { color: '#64748B', font: { size: 8 } },
                                },
                              },
                              plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1E293B', borderColor: '#334155', borderWidth: 1 } },
                            }}
                          />
                        </Box>
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

// frontend#352: display-only fabricated surface. The default build shows an
// honest not-live state and never mounts the sample.
const ScopeBreakdown = () => (
  <DemoSurfaceGate
    title="Emission scope breakdown is not live on the testnet"
    description="No testnet endpoint reports Scope 1, 2 or 3 emissions yet."
    testId="carbon-scope-breakdown"
  >
    <ScopeBreakdownSample />
  </DemoSurfaceGate>
);

export default ScopeBreakdown;
