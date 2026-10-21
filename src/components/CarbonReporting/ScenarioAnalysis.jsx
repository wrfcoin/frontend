import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Tabs,
  Tab,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
} from '@mui/material';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import Warning from '@mui/icons-material/Warning';
import TrendingDown from '@mui/icons-material/TrendingDown';
import Assessment from '@mui/icons-material/Assessment';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
  ChartTooltip,
  Legend,
);

// ---------------------------------------------------------------------------
// Scenario Data
// ---------------------------------------------------------------------------

const DECADES = ['2025', '2030', '2040', '2050', '2060', '2070', '2080', '2090', '2100'];

const SCENARIOS = [
  {
    id: 'paris15',
    label: '1.5\u00B0C Paris Aligned',
    color: '#10B981',
    bgColor: '#10B9811A',
    warming: [1.1, 1.2, 1.3, 1.4, 1.45, 1.5, 1.5, 1.48, 1.45],
    carbonBudget: { total: 400, used: 142, unit: 'GtCO\u2082' },
    annualReduction: 7.6,
    reductionTrend: 'accelerating',
    budgetExhaust: '2038',
    financialImpact: {
      carbonTaxExposure: '$2.4M',
      strandedAssetRisk: 'Low',
      transitionCosts: '$8.2M',
      greenRevenueOpportunity: '$14.6M',
    },
    recommendations: [
      { priority: 'Critical', action: 'Electrify fleet vehicles by 2028', impact: '-420 tCO\u2082e/yr' },
      { priority: 'High', action: 'Switch to 100% renewable electricity', impact: '-3,200 tCO\u2082e/yr' },
      { priority: 'High', action: 'Implement supply chain decarbonization program', impact: '-1,800 tCO\u2082e/yr' },
      { priority: 'Medium', action: 'Deploy on-site solar + battery storage', impact: '-650 tCO\u2082e/yr' },
      { priority: 'Medium', action: 'Remote work policy to reduce commuting', impact: '-340 tCO\u2082e/yr' },
    ],
  },
  {
    id: 'moderate2',
    label: '2\u00B0C Moderate',
    color: '#F59E0B',
    bgColor: '#F59E0B1A',
    warming: [1.1, 1.3, 1.5, 1.7, 1.8, 1.9, 1.95, 1.98, 2.0],
    carbonBudget: { total: 1150, used: 142, unit: 'GtCO\u2082' },
    annualReduction: 4.2,
    reductionTrend: 'steady',
    budgetExhaust: '2046',
    financialImpact: {
      carbonTaxExposure: '$1.8M',
      strandedAssetRisk: 'Moderate',
      transitionCosts: '$5.6M',
      greenRevenueOpportunity: '$9.2M',
    },
    recommendations: [
      { priority: 'High', action: 'Phase out natural gas heating by 2032', impact: '-780 tCO\u2082e/yr' },
      { priority: 'High', action: 'Implement energy efficiency program', impact: '-1,400 tCO\u2082e/yr' },
      { priority: 'Medium', action: 'Optimize logistics and reduce freight', impact: '-560 tCO\u2082e/yr' },
      { priority: 'Low', action: 'Carbon offset portfolio diversification', impact: '-900 tCO\u2082e/yr' },
    ],
  },
  {
    id: 'bau4',
    label: '4\u00B0C Business as Usual',
    color: '#EF4444',
    bgColor: '#EF44441A',
    warming: [1.1, 1.4, 1.9, 2.5, 3.0, 3.4, 3.7, 3.9, 4.1],
    carbonBudget: { total: 2900, used: 142, unit: 'GtCO\u2082' },
    annualReduction: 0,
    reductionTrend: 'flat',
    budgetExhaust: 'N/A',
    financialImpact: {
      carbonTaxExposure: '$6.8M',
      strandedAssetRisk: 'Very High',
      transitionCosts: '$18.4M',
      greenRevenueOpportunity: '$3.1M',
    },
    recommendations: [
      { priority: 'Critical', action: 'Immediate emissions reduction strategy required', impact: 'Existential risk' },
      { priority: 'Critical', action: 'Physical climate risk assessment for all assets', impact: 'Risk mitigation' },
      { priority: 'High', action: 'Supply chain resilience planning', impact: 'Operational continuity' },
    ],
  },
];

const ORG_CURRENT_RATE = 12847; // tCO2e per year
const ORG_BUDGET_15 = 78000; // tCO2e total remaining budget at 1.5C pathway
const EXHAUST_YEAR = Math.floor(2025 + ORG_BUDGET_15 / ORG_CURRENT_RATE);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ScenarioAnalysis = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [comparisonMode, setComparisonMode] = useState(false);

  const activeScenario = SCENARIOS[activeTab];

  // Temperature pathway chart
  const temperatureData = useMemo(() => {
    if (comparisonMode) {
      return {
        labels: DECADES,
        datasets: SCENARIOS.map((s) => ({
          label: s.label,
          data: s.warming,
          borderColor: s.color,
          backgroundColor: `${s.color}1A`,
          fill: false,
          tension: 0.4,
          pointRadius: 3,
          borderWidth: 2,
        })),
      };
    }
    return {
      labels: DECADES,
      datasets: [
        {
          label: activeScenario.label,
          data: activeScenario.warming,
          borderColor: activeScenario.color,
          backgroundColor: `${activeScenario.color}1A`,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: activeScenario.color,
          borderWidth: 2,
        },
        {
          label: '1.5\u00B0C Threshold',
          data: DECADES.map(() => 1.5),
          borderColor: '#EF444466',
          borderDash: [6, 4],
          pointRadius: 0,
          borderWidth: 1,
          fill: false,
        },
        {
          label: '2\u00B0C Threshold',
          data: DECADES.map(() => 2.0),
          borderColor: '#F59E0B44',
          borderDash: [6, 4],
          pointRadius: 0,
          borderWidth: 1,
          fill: false,
        },
      ],
    };
  }, [activeTab, comparisonMode, activeScenario]);

  const tempChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { color: '#334155' },
          ticks: { color: '#94A3B8' },
        },
        y: {
          title: { display: true, text: 'Temperature Anomaly (\u00B0C)', color: '#94A3B8' },
          grid: { color: '#334155' },
          ticks: { color: '#94A3B8' },
          min: 0.5,
          max: 4.5,
        },
      },
      plugins: {
        legend: {
          labels: { color: '#94A3B8', usePointStyle: true, padding: 16 },
        },
        tooltip: {
          backgroundColor: '#1E293B',
          borderColor: '#334155',
          borderWidth: 1,
          titleColor: '#F1F5F9',
          bodyColor: '#94A3B8',
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}\u00B0C`,
          },
        },
      },
    }),
    [],
  );

  // Carbon budget doughnut
  const budgetData = useMemo(
    () => ({
      labels: ['Used', 'Remaining'],
      datasets: [
        {
          data: [
            activeScenario.carbonBudget.used,
            activeScenario.carbonBudget.total - activeScenario.carbonBudget.used,
          ],
          backgroundColor: [activeScenario.color, '#334155'],
          borderColor: '#1E293B',
          borderWidth: 3,
        },
      ],
    }),
    [activeScenario],
  );

  const budgetOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1E293B',
          borderColor: '#334155',
          borderWidth: 1,
          titleColor: '#F1F5F9',
          bodyColor: '#94A3B8',
          callbacks: {
            label: (ctx) => `${ctx.label}: ${ctx.raw} ${activeScenario.carbonBudget.unit}`,
          },
        },
      },
    }),
    [activeScenario],
  );

  const priorityColor = {
    Critical: '#EF4444',
    High: '#F59E0B',
    Medium: '#3B82F6',
    Low: '#10B981',
  };

  return (
    <Paper sx={{ bgcolor: '#1E293B', border: '1px solid #334155', borderRadius: 2, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Assessment sx={{ color: '#3B82F6', fontSize: 28 }} />
          <Typography variant="h6" sx={{ color: '#F1F5F9', fontWeight: 600 }}>
            Climate Scenario Analysis
          </Typography>
        </Box>
        <Button
          variant={comparisonMode ? 'contained' : 'outlined'}
          size="small"
          onClick={() => setComparisonMode(!comparisonMode)}
          sx={{
            borderColor: '#3B82F6',
            color: comparisonMode ? '#FFF' : '#3B82F6',
            bgcolor: comparisonMode ? '#3B82F6' : 'transparent',
            textTransform: 'none',
            '&:hover': { bgcolor: comparisonMode ? '#2563EB' : '#3B82F61A' },
          }}
        >
          {comparisonMode ? 'Comparison Mode' : 'Compare All'}
        </Button>
      </Box>

      {/* Scenario tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{
          mb: 3,
          '& .MuiTabs-indicator': { bgcolor: activeScenario.color },
          '& .MuiTab-root': { color: '#94A3B8', textTransform: 'none', fontWeight: 500 },
          '& .Mui-selected': { color: activeScenario.color },
        }}
      >
        {SCENARIOS.map((s) => (
          <Tab key={s.id} label={s.label} />
        ))}
      </Tabs>

      <Grid container spacing={3}>
        {/* Temperature pathway chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ bgcolor: '#0F172A', border: '1px solid #334155', borderRadius: 2, p: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#94A3B8', mb: 1 }}>
              Global Temperature Pathway
            </Typography>
            <Box sx={{ height: 300 }}>
              <Line data={temperatureData} options={tempChartOptions} />
            </Box>
          </Paper>
        </Grid>

        {/* Carbon budget */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              bgcolor: '#0F172A',
              border: `1px solid ${activeScenario.color}33`,
              borderRadius: 2,
              p: 2,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography variant="subtitle2" sx={{ color: '#94A3B8', mb: 1 }}>
              Global Carbon Budget Remaining
            </Typography>
            <Box sx={{ height: 160, position: 'relative', mx: 'auto', width: '100%', maxWidth: 180 }}>
              <Doughnut data={budgetData} options={budgetOptions} />
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                }}
              >
                <Typography variant="h5" sx={{ color: activeScenario.color, fontWeight: 700, lineHeight: 1 }}>
                  {((activeScenario.carbonBudget.used / activeScenario.carbonBudget.total) * 100).toFixed(0)}%
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  Used
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ borderColor: '#334155', my: 1.5 }} />

            {/* Metrics */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  Required Annual Reduction
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                  <Typography variant="h6" sx={{ color: activeScenario.color, fontWeight: 700 }}>
                    {activeScenario.annualReduction}%
                  </Typography>
                  <TrendingDown sx={{ color: activeScenario.color, fontSize: 16 }} />
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    ({activeScenario.reductionTrend})
                  </Typography>
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  Budget Exhausted By
                </Typography>
                <Typography variant="h6" sx={{ color: '#F1F5F9', fontWeight: 700 }}>
                  {activeScenario.budgetExhaust}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Organization projection */}
        <Grid item xs={12}>
          <Paper
            sx={{
              bgcolor: '#0F172A',
              border: '1px solid #F59E0B33',
              borderRadius: 2,
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Warning sx={{ color: '#F59E0B', fontSize: 32 }} />
            <Box>
              <Typography variant="subtitle1" sx={{ color: '#F1F5F9', fontWeight: 600 }}>
                Organization-Specific Projection
              </Typography>
              <Typography variant="body2" sx={{ color: '#94A3B8' }}>
                At your current emission rate of{' '}
                <Typography component="span" sx={{ color: '#F59E0B', fontWeight: 600 }}>
                  {ORG_CURRENT_RATE.toLocaleString()} tCO&#8322;e/year
                </Typography>
                , you will exhaust your 1.5{'\u00B0'}C-aligned carbon budget by{' '}
                <Typography component="span" sx={{ color: '#EF4444', fontWeight: 600 }}>
                  {EXHAUST_YEAR}
                </Typography>
                . Achieving Paris alignment requires a{' '}
                <Typography component="span" sx={{ color: '#10B981', fontWeight: 600 }}>
                  7.6% year-over-year reduction
                </Typography>{' '}
                starting immediately.
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Financial impact table */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ bgcolor: '#0F172A', border: '1px solid #334155', borderRadius: 2, p: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#94A3B8', mb: 1.5 }}>
              Financial Impact Assessment
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#64748B', borderBottom: '1px solid #334155', fontWeight: 600 }}>
                      Metric
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#64748B', borderBottom: '1px solid #334155', fontWeight: 600 }}>
                      Impact
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(activeScenario.financialImpact).map(([key, value]) => {
                    const labels = {
                      carbonTaxExposure: 'Carbon Tax Exposure',
                      strandedAssetRisk: 'Stranded Asset Risk',
                      transitionCosts: 'Transition Costs',
                      greenRevenueOpportunity: 'Green Revenue Opportunity',
                    };
                    const isRisk = key === 'strandedAssetRisk';
                    const riskColors = {
                      Low: '#10B981',
                      Moderate: '#F59E0B',
                      High: '#EF4444',
                      'Very High': '#EF4444',
                    };
                    return (
                      <TableRow key={key}>
                        <TableCell sx={{ color: '#CBD5E1', borderBottom: '1px solid #1E293B' }}>
                          {labels[key]}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            color: isRisk ? riskColors[value] || '#F1F5F9' : key === 'greenRevenueOpportunity' ? '#10B981' : '#F1F5F9',
                            fontWeight: 600,
                            borderBottom: '1px solid #1E293B',
                          }}
                        >
                          {value}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Action recommendations */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ bgcolor: '#0F172A', border: '1px solid #334155', borderRadius: 2, p: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#94A3B8', mb: 1.5 }}>
              Prioritized Action Recommendations
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {activeScenario.recommendations.map((rec, idx) => (
                <Box
                  key={idx}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1,
                    px: 1.5,
                    borderRadius: 1,
                    bgcolor: '#1E293B',
                    border: '1px solid #334155',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                    <Chip
                      label={rec.priority}
                      size="small"
                      sx={{
                        bgcolor: `${priorityColor[rec.priority]}1A`,
                        color: priorityColor[rec.priority],
                        fontWeight: 600,
                        fontSize: '0.65rem',
                        minWidth: 60,
                      }}
                    />
                    <Typography variant="body2" sx={{ color: '#CBD5E1', fontSize: '0.8rem' }}>
                      {rec.action}
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#10B981',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      ml: 1,
                    }}
                  >
                    {rec.impact}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ScenarioAnalysis;
