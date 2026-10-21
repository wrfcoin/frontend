import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import FEATURES from '../../config/features';
import PublicViewerNotice from '../common/PublicViewerNotice';
import { apiClient } from '../../services/apiClient';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import TimelineIcon from '@mui/icons-material/Timeline';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PieChartIcon from '@mui/icons-material/PieChart';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CancelIcon from '@mui/icons-material/Cancel';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLORS = {
  bg: '#0F172A',
  card: '#1E293B',
  cardHover: '#263548',
  border: '#334155',
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  abstain: '#64748B',
  purple: '#8B5CF6',
  cyan: '#06B6D4',
};

// ---------------------------------------------------------------------------
// Sample data (frontend#292)
//
// Everything in this block is fabricated: there is no asset allocation, no
// budget-proposal pipeline, no vendor ledger and no growth history behind it,
// and the transaction hashes are invented strings. It renders ONLY when
// FEATURES.demoSurfaces is explicitly on, always under a visible "Sample data"
// badge and a page-level banner — the same demo-surface policy ForecastPreview
// follows (frontend#286/#289). Otherwise each section shows the honest
// not-live state. The only live numbers on this page come from
// GET /api/governance/treasury and /treasury/transactions (backend
// governance-routes.ts), which read the treasury_consolidated table.
// ---------------------------------------------------------------------------

const SAMPLE_TREASURY_BALANCE = 4850000;

const ASSET_ALLOCATION = [
  { name: 'WRF Tokens', value: 2200000, percentage: 45.4, color: COLORS.primary },
  { name: 'Stablecoins (USDC/DAI)', value: 1300000, percentage: 26.8, color: COLORS.success },
  { name: 'LP Tokens', value: 850000, percentage: 17.5, color: COLORS.purple },
  { name: 'Carbon Credits', value: 500000, percentage: 10.3, color: COLORS.warning },
];

const MONTHLY_FLOWS = [
  { month: 'Mar', inflow: 420, outflow: 280 },
  { month: 'Apr', inflow: 380, outflow: 310 },
  { month: 'May', inflow: 510, outflow: 290 },
  { month: 'Jun', inflow: 450, outflow: 350 },
  { month: 'Jul', inflow: 390, outflow: 320 },
  { month: 'Aug', inflow: 480, outflow: 380 },
  { month: 'Sep', inflow: 520, outflow: 340 },
  { month: 'Oct', inflow: 460, outflow: 410 },
  { month: 'Nov', inflow: 550, outflow: 360 },
  { month: 'Dec', inflow: 490, outflow: 390 },
  { month: 'Jan', inflow: 580, outflow: 420 },
  { month: 'Feb', inflow: 530, outflow: 370 },
];

const BUDGET_PROPOSALS = [
  { id: 'BP-041', title: 'IoT Network Expansion - Africa', requested: 320000, status: 'voting', approval: 72, deadline: '2026-02-28' },
  { id: 'BP-042', title: 'Quantum-Resistant Bridge Upgrade', requested: 180000, status: 'voting', approval: 58, deadline: '2026-03-05' },
  { id: 'BP-043', title: 'Community Developer Grants Q2', requested: 150000, status: 'pending', approval: 0, deadline: '2026-03-15' },
  { id: 'BP-044', title: 'Weather ML Model Training Infrastructure', requested: 250000, status: 'voting', approval: 84, deadline: '2026-02-25' },
  { id: 'BP-045', title: 'Carbon Credit Marketplace V3', requested: 200000, status: 'approved', approval: 91, deadline: '2026-02-20' },
];

const SPENDING_HISTORY = [
  { date: '2026-02-10', recipient: 'CloudHSM Provider', amount: 45000, category: 'Security' },
  { date: '2026-02-08', recipient: 'Frontend Dev Team', amount: 85000, category: 'Development' },
  { date: '2026-02-05', recipient: 'IoT Sensor Batch #47', amount: 120000, category: 'Infrastructure' },
  { date: '2026-02-01', recipient: 'Audit Firm - Q1 Review', amount: 65000, category: 'Compliance' },
  { date: '2026-01-28', recipient: 'Community Bounties Jan', amount: 32000, category: 'Grants' },
  { date: '2026-01-25', recipient: 'Cross-Chain Bridge Ops', amount: 28000, category: 'Operations' },
  { date: '2026-01-20', recipient: 'Marketing - WeatherFi Launch', amount: 55000, category: 'Marketing' },
];

const GROWTH_TREND = [
  { month: 0, value: 3200 }, { month: 1, value: 3350 }, { month: 2, value: 3480 },
  { month: 3, value: 3650 }, { month: 4, value: 3720 }, { month: 5, value: 3900 },
  { month: 6, value: 4050 }, { month: 7, value: 4100 }, { month: 8, value: 4280 },
  { month: 9, value: 4450 }, { month: 10, value: 4620 }, { month: 11, value: 4850 },
];

const CATEGORY_COLORS = {
  Security: '#EF4444',
  Development: '#3B82F6',
  Infrastructure: '#8B5CF6',
  Compliance: '#F59E0B',
  Grants: '#10B981',
  Operations: '#06B6D4',
  Marketing: '#EC4899',
};

// ---------------------------------------------------------------------------
// SVG Pie Chart
// ---------------------------------------------------------------------------

const PieChart = ({ data, size = 200 }) => {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 10;
  const innerRadius = radius * 0.6;

  let cumulativeAngle = -90;

  const slices = data.map((item) => {
    const startAngle = cumulativeAngle;
    const sweepAngle = (item.percentage / 100) * 360;
    cumulativeAngle += sweepAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = ((startAngle + sweepAngle) * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);
    const ix1 = cx + innerRadius * Math.cos(startRad);
    const iy1 = cy + innerRadius * Math.sin(startRad);
    const ix2 = cx + innerRadius * Math.cos(endRad);
    const iy2 = cy + innerRadius * Math.sin(endRad);

    const largeArc = sweepAngle > 180 ? 1 : 0;

    const pathD = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${ix2} ${iy2}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1}`,
      'Z',
    ].join(' ');

    return { ...item, pathD };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((slice, i) => (
        <path key={i} d={slice.pathD} fill={slice.color} opacity={0.85} stroke={COLORS.card} strokeWidth={2}>
          <title>{`${slice.name}: ${slice.percentage}%`}</title>
        </path>
      ))}
      {/* Center text */}
      <text x={cx} y={cy - 6} fill={COLORS.text} fontSize={16} fontWeight={700} textAnchor="middle">
        ${(SAMPLE_TREASURY_BALANCE / 1000000).toFixed(2)}M
      </text>
      <text x={cx} y={cy + 12} fill={COLORS.textSecondary} fontSize={10} textAnchor="middle">
        Total Treasury
      </text>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// SVG Bar Chart (Inflows/Outflows)
// ---------------------------------------------------------------------------

const FlowBarChart = ({ data }) => {
  const width = 520;
  const height = 200;
  const padding = { top: 15, right: 15, bottom: 25, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map((d) => Math.max(d.inflow, d.outflow)));
  const barGroupWidth = chartW / data.length;
  const barWidth = barGroupWidth * 0.35;
  const gap = barGroupWidth * 0.1;

  const scaleY = (v) => padding.top + chartH - (v / maxVal) * chartH;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
      {/* Y axis grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const val = Math.round(maxVal * f);
        const y = scaleY(val);
        return (
          <g key={f}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke={COLORS.border} strokeWidth={0.5} strokeDasharray="3 3" />
            <text x={padding.left - 5} y={y + 3} fill={COLORS.textSecondary} fontSize={9} textAnchor="end">{val}k</text>
          </g>
        );
      })}

      {data.map((d, i) => {
        const x = padding.left + i * barGroupWidth;
        return (
          <g key={d.month}>
            {/* Inflow bar */}
            <rect
              x={x + gap}
              y={scaleY(d.inflow)}
              width={barWidth}
              height={chartH - (scaleY(d.inflow) - padding.top)}
              rx={3}
              fill={COLORS.success}
              opacity={0.75}
            >
              <title>{`${d.month} Inflow: ${d.inflow}k`}</title>
            </rect>
            {/* Outflow bar */}
            <rect
              x={x + gap + barWidth + 2}
              y={scaleY(d.outflow)}
              width={barWidth}
              height={chartH - (scaleY(d.outflow) - padding.top)}
              rx={3}
              fill={COLORS.error}
              opacity={0.65}
            >
              <title>{`${d.month} Outflow: ${d.outflow}k`}</title>
            </rect>
            {/* Month label */}
            <text
              x={x + barGroupWidth / 2}
              y={height - 5}
              fill={COLORS.textSecondary}
              fontSize={9}
              textAnchor="middle"
            >
              {d.month}
            </text>
          </g>
        );
      })}

      {/* Legend */}
      <rect x={width - 120} y={5} width={10} height={10} rx={2} fill={COLORS.success} opacity={0.75} />
      <text x={width - 106} y={14} fill={COLORS.textSecondary} fontSize={9}>Inflows</text>
      <rect x={width - 60} y={5} width={10} height={10} rx={2} fill={COLORS.error} opacity={0.65} />
      <text x={width - 46} y={14} fill={COLORS.textSecondary} fontSize={9}>Outflows</text>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// SVG Growth Trend Line
// ---------------------------------------------------------------------------

const GrowthTrendLine = ({ data }) => {
  const width = 300;
  const height = 100;
  const padding = { top: 10, right: 10, bottom: 20, left: 35 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const minVal = Math.min(...data.map((d) => d.value)) * 0.95;
  const maxVal = Math.max(...data.map((d) => d.value)) * 1.02;

  const scaleX = (i) => padding.left + (i / (data.length - 1)) * chartW;
  const scaleY = (v) => padding.top + chartH - ((v - minVal) / (maxVal - minVal)) * chartH;

  const pathD = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(d.value)}`).join(' ');
  const fillD = `${pathD} L ${scaleX(data.length - 1)} ${scaleY(minVal)} L ${scaleX(0)} ${scaleY(minVal)} Z`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLORS.success} stopOpacity={0.3} />
          <stop offset="100%" stopColor={COLORS.success} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <path d={fillD} fill="url(#trendGrad)" />
      <path d={pathD} fill="none" stroke={COLORS.success} strokeWidth={2} />
      {/* Start and end labels */}
      <text x={scaleX(0)} y={height - 4} fill={COLORS.textSecondary} fontSize={8} textAnchor="start">Mar '25</text>
      <text x={scaleX(data.length - 1)} y={height - 4} fill={COLORS.textSecondary} fontSize={8} textAnchor="end">Feb '26</text>
      {/* End point */}
      <circle cx={scaleX(data.length - 1)} cy={scaleY(data[data.length - 1].value)} r={3} fill={COLORS.success} />
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const SAMPLE_BADGE_SX = { height: 18, fontSize: 9, bgcolor: 'rgba(148,163,184,0.2)', color: COLORS.textSecondary };

const SampleBadge = ({ testId }) => (
  <Chip label="Sample data" size="small" data-testid={testId} sx={SAMPLE_BADGE_SX} />
);

const formatWrf = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })} WRF`;
};

const shortHash = (hash) => (hash && hash.length > 14 ? `${hash.slice(0, 6)}...${hash.slice(-4)}` : hash);

const TreasuryDashboard = () => {
  // Live treasury summary + ledger from the mounted governance API
  // (backend governance-routes.ts, /api/governance/treasury*). These are the
  // only real figures on this page; nothing below invents a value when they
  // are missing.
  const [live, setLive] = useState({ status: 'loading', summary: null, transactions: [] });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [summaryRes, txRes] = await Promise.all([
          apiClient.get('/governance/treasury'),
          apiClient.get('/governance/treasury/transactions?limit=10').catch(() => null),
        ]);
        if (cancelled) return;
        const summary = summaryRes?.data ?? null;
        const transactions = Array.isArray(txRes?.data) ? txRes.data : Array.isArray(txRes?.items) ? txRes.items : [];
        setLive({ status: summary ? 'ready' : 'unavailable', summary, transactions });
      } catch {
        if (!cancelled) setLive({ status: 'unavailable', summary: null, transactions: [] });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fabricated sections render only under the demo-surface policy (frontend#292).
  const showSample = FEATURES.demoSurfaces;

  const monthlyBurnRate = useMemo(() => {
    const totalOutflow = MONTHLY_FLOWS.reduce((sum, m) => sum + m.outflow, 0);
    return Math.round(totalOutflow / MONTHLY_FLOWS.length);
  }, []);

  const runway = useMemo(() => {
    return Math.round(SAMPLE_TREASURY_BALANCE / (monthlyBurnRate * 1000));
  }, [monthlyBurnRate]);

  const avgProposalSize = useMemo(() => {
    const total = BUDGET_PROPOSALS.reduce((sum, p) => sum + p.requested, 0);
    return Math.round(total / BUDGET_PROPOSALS.length);
  }, []);

  const statusConfig = {
    voting: { color: COLORS.primary, icon: <HourglassEmptyIcon sx={{ fontSize: 14 }} />, label: 'Voting' },
    pending: { color: COLORS.warning, icon: <CalendarTodayIcon sx={{ fontSize: 14 }} />, label: 'Pending' },
    approved: { color: COLORS.success, icon: <CheckCircleIcon sx={{ fontSize: 14 }} />, label: 'Approved' },
    rejected: { color: COLORS.error, icon: <CancelIcon sx={{ fontSize: 14 }} />, label: 'Rejected' },
  };

  const notLive = (title, description) => (
    <PublicViewerNotice reason="not-live" title={title} description={description} />
  );

  const liveTransactions = live.transactions;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: COLORS.bg, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <AccountBalanceIcon sx={{ color: COLORS.warning, fontSize: 32 }} />
        <Box>
          <Typography variant="h5" sx={{ color: COLORS.text, fontWeight: 700 }}>
            Treasury Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
            DAO treasury overview, spending analytics, and budget proposals
          </Typography>
        </Box>
      </Box>

      {showSample && (
        <Paper
          data-testid="treasury-sample-banner"
          sx={{ bgcolor: `${COLORS.warning}22`, border: `1px solid ${COLORS.warning}`, borderRadius: 2, p: 2, mb: 3 }}
        >
          <Typography variant="body2" sx={{ color: COLORS.text, fontWeight: 600 }}>
            Simulated preview — not real financial data
          </Typography>
          <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
            Sections marked “Sample data” are illustrative. Allocation, proposals, spending history and
            transaction hashes below are invented; only the balance and ledger from the governance API are real.
          </Typography>
        </Paper>
      )}

      {/* Top Row: Balance + Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Total Balance — live from /api/governance/treasury */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ bgcolor: COLORS.card, borderRadius: 3, p: 3, border: `2px solid ${COLORS.warning}33`, height: '100%' }}>
            <Typography variant="caption" sx={{ color: COLORS.textSecondary, display: 'block', mb: 1 }}>
              Total Treasury Balance
            </Typography>
            {live.status === 'ready' && (
              <Box data-testid="treasury-live-balance">
                <Typography variant="h3" sx={{ color: COLORS.text, fontWeight: 800, mb: 0.5 }}>
                  {formatWrf(live.summary.balance)}
                </Typography>
                <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
                  {formatWrf(live.summary.totalDeposits)} deposited · {formatWrf(live.summary.totalWithdrawals)} withdrawn ·{' '}
                  {Number(live.summary.transactionCount ?? 0).toLocaleString()} transactions
                </Typography>
              </Box>
            )}
            {live.status === 'loading' && (
              <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
                Loading treasury balance…
              </Typography>
            )}
            {live.status === 'unavailable' &&
              notLive('Treasury balance unavailable', 'The governance treasury endpoint is not reachable from this build.')}
            <Divider sx={{ borderColor: COLORS.border, my: 2 }} />
            {showSample ? (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>12-month trend</Typography>
                  <SampleBadge testId="treasury-growth-sample-badge" />
                </Box>
                <GrowthTrendLine data={GROWTH_TREND} />
              </Box>
            ) : (
              <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                Balance history is not tracked yet.
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Asset Allocation Pie — sample only */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ bgcolor: COLORS.card, borderRadius: 3, p: 3, border: `1px solid ${COLORS.border}`, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <PieChartIcon sx={{ color: COLORS.primary }} />
              <Typography variant="subtitle1" sx={{ color: COLORS.text, fontWeight: 600 }}>
                Asset Allocation
              </Typography>
              {showSample && <SampleBadge testId="treasury-allocation-sample-badge" />}
            </Box>
            {showSample ? (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <PieChart data={ASSET_ALLOCATION} size={180} />
                </Box>
                {ASSET_ALLOCATION.map((asset) => (
                  <Box key={asset.name} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: asset.color }} />
                      <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>{asset.name}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" sx={{ color: COLORS.text, fontWeight: 600 }}>
                        ${(asset.value / 1000000).toFixed(2)}M
                      </Typography>
                      <Typography variant="caption" sx={{ color: asset.color, fontWeight: 600 }}>
                        {asset.percentage}%
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </>
            ) : (
              notLive('Asset allocation unavailable', 'The treasury holds a single token on the testnet; no allocation breakdown is published yet.')
            )}
          </Paper>
        </Grid>

        {/* Quick Stats — sample only */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ bgcolor: COLORS.card, borderRadius: 3, p: 2.5, border: `1px solid ${COLORS.border}`, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Typography variant="subtitle1" sx={{ color: COLORS.text, fontWeight: 600 }}>
                Spending Metrics
              </Typography>
              {showSample && <SampleBadge testId="treasury-metrics-sample-badge" />}
            </Box>
            {showSample ? (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <LocalFireDepartmentIcon sx={{ color: COLORS.error, fontSize: 20 }} />
                    <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>Monthly Burn Rate</Typography>
                  </Box>
                  <Typography variant="h5" sx={{ color: COLORS.error, fontWeight: 800 }}>
                    ${monthlyBurnRate}k
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <TimelineIcon sx={{ color: COLORS.success, fontSize: 20 }} />
                    <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>Runway</Typography>
                  </Box>
                  <Typography variant="h5" sx={{ color: COLORS.success, fontWeight: 800 }}>
                    {runway} months
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <ReceiptLongIcon sx={{ color: COLORS.purple, fontSize: 20 }} />
                    <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>Avg Proposal Size</Typography>
                  </Box>
                  <Typography variant="h5" sx={{ color: COLORS.purple, fontWeight: 800 }}>
                    ${(avgProposalSize / 1000).toFixed(0)}k
                  </Typography>
                </Grid>
              </Grid>
            ) : (
              notLive('Spending metrics unavailable', 'Burn rate, runway and proposal sizing need a budget pipeline that is not live yet.')
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Inflows/Outflows Chart — sample only */}
      <Paper sx={{ bgcolor: COLORS.card, borderRadius: 3, p: 3, mb: 3, border: `1px solid ${COLORS.border}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <TrendingUpIcon sx={{ color: COLORS.success }} />
          <Typography variant="subtitle1" sx={{ color: COLORS.text, fontWeight: 600 }}>
            Treasury Inflows & Outflows (Last 12 Months, in thousands)
          </Typography>
          {showSample && <SampleBadge testId="treasury-flows-sample-badge" />}
        </Box>
        {showSample ? (
          <FlowBarChart data={MONTHLY_FLOWS} />
        ) : (
          notLive('Monthly flows unavailable', 'Inflow and outflow history will populate from the treasury ledger once it is indexed by month.')
        )}
      </Paper>

      <Grid container spacing={3}>
        {/* Budget Proposals — sample only */}
        <Grid item xs={12} lg={7}>
          <Paper sx={{ bgcolor: COLORS.card, borderRadius: 3, p: 3, border: `1px solid ${COLORS.border}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography variant="subtitle1" sx={{ color: COLORS.text, fontWeight: 600 }}>
                Active Budget Proposals
              </Typography>
              {showSample && <SampleBadge testId="treasury-proposals-sample-badge" />}
            </Box>
            {showSample ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: COLORS.textSecondary, borderColor: COLORS.border, fontWeight: 600, fontSize: 12 }}>ID</TableCell>
                      <TableCell sx={{ color: COLORS.textSecondary, borderColor: COLORS.border, fontWeight: 600, fontSize: 12 }}>Title</TableCell>
                      <TableCell sx={{ color: COLORS.textSecondary, borderColor: COLORS.border, fontWeight: 600, fontSize: 12 }}>Requested</TableCell>
                      <TableCell sx={{ color: COLORS.textSecondary, borderColor: COLORS.border, fontWeight: 600, fontSize: 12 }}>Status</TableCell>
                      <TableCell sx={{ color: COLORS.textSecondary, borderColor: COLORS.border, fontWeight: 600, fontSize: 12 }}>Approval</TableCell>
                      <TableCell sx={{ color: COLORS.textSecondary, borderColor: COLORS.border, fontWeight: 600, fontSize: 12 }}>Deadline</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {BUDGET_PROPOSALS.map((p) => {
                      const config = statusConfig[p.status];
                      return (
                        <TableRow key={p.id}>
                          <TableCell sx={{ color: COLORS.primary, borderColor: COLORS.border, fontFamily: 'monospace', fontSize: 12 }}>
                            {p.id}
                          </TableCell>
                          <TableCell sx={{ color: COLORS.text, borderColor: COLORS.border, fontSize: 13 }}>
                            {p.title}
                          </TableCell>
                          <TableCell sx={{ color: COLORS.warning, borderColor: COLORS.border, fontWeight: 600, fontSize: 13 }}>
                            ${(p.requested / 1000).toFixed(0)}k
                          </TableCell>
                          <TableCell sx={{ borderColor: COLORS.border }}>
                            <Chip
                              size="small"
                              icon={config.icon}
                              label={config.label}
                              sx={{
                                height: 22,
                                bgcolor: config.color + '22',
                                color: config.color,
                                fontSize: 10,
                                '& .MuiChip-icon': { color: 'inherit' },
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ borderColor: COLORS.border }}>
                            {p.approval > 0 ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={p.approval}
                                  sx={{
                                    width: 60,
                                    height: 6,
                                    borderRadius: 3,
                                    bgcolor: COLORS.border,
                                    '& .MuiLinearProgress-bar': {
                                      borderRadius: 3,
                                      bgcolor: p.approval >= 75 ? COLORS.success : p.approval >= 50 ? COLORS.warning : COLORS.error,
                                    },
                                  }}
                                />
                                <Typography variant="caption" sx={{ color: COLORS.text, fontWeight: 600, fontSize: 11 }}>
                                  {p.approval}%
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>--</Typography>
                            )}
                          </TableCell>
                          <TableCell sx={{ color: COLORS.textSecondary, borderColor: COLORS.border, fontSize: 12 }}>
                            {p.deadline}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              notLive('No budget proposals yet', 'Budget proposals will appear here once the governance proposal pipeline funds them from the treasury.')
            )}
          </Paper>
        </Grid>

        {/* Recent Spending — live ledger from /api/governance/treasury/transactions; sample only in demo mode */}
        <Grid item xs={12} lg={5}>
          <Paper sx={{ bgcolor: COLORS.card, borderRadius: 3, p: 3, border: `1px solid ${COLORS.border}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography variant="subtitle1" sx={{ color: COLORS.text, fontWeight: 600 }}>
                Recent Treasury Transactions
              </Typography>
              {showSample && liveTransactions.length === 0 && <SampleBadge testId="treasury-spending-sample-badge" />}
            </Box>
            {liveTransactions.length > 0 ? (
              <Box data-testid="treasury-live-ledger">
                {liveTransactions.map((t, i) => (
                  <Box key={t.transactionId ?? t.id ?? i}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', py: 1.2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ color: COLORS.text, fontWeight: 500, mb: 0.3 }}>
                          {t.description || t.category || t.transactionId || 'Treasury transaction'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontSize: 11 }}>
                            {t.createdAt ? new Date(t.createdAt).toISOString().slice(0, 10) : ''}
                          </Typography>
                          {t.category && (
                            <Chip
                              size="small"
                              label={t.category}
                              sx={{
                                height: 18,
                                bgcolor: (CATEGORY_COLORS[t.category] || COLORS.abstain) + '22',
                                color: CATEGORY_COLORS[t.category] || COLORS.textSecondary,
                                fontSize: 9,
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography
                          variant="body2"
                          sx={{ color: Number(t.amount) < 0 ? COLORS.error : COLORS.success, fontWeight: 600, mb: 0.3 }}
                        >
                          {formatWrf(t.amount)}
                        </Typography>
                        {t.transactionHash && (
                          <Tooltip title={t.transactionHash}>
                            <Typography variant="caption" sx={{ color: COLORS.primary, fontFamily: 'monospace', fontSize: 10 }}>
                              {shortHash(t.transactionHash)}
                            </Typography>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                    {i < liveTransactions.length - 1 && <Divider sx={{ borderColor: COLORS.border }} />}
                  </Box>
                ))}
              </Box>
            ) : showSample ? (
              SPENDING_HISTORY.map((s, i) => (
                <Box key={i}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', py: 1.2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ color: COLORS.text, fontWeight: 500, mb: 0.3 }}>
                        {s.recipient}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontSize: 11 }}>
                          {s.date}
                        </Typography>
                        <Chip
                          size="small"
                          label={s.category}
                          sx={{
                            height: 18,
                            bgcolor: (CATEGORY_COLORS[s.category] || COLORS.abstain) + '22',
                            color: CATEGORY_COLORS[s.category] || COLORS.textSecondary,
                            fontSize: 9,
                          }}
                        />
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" sx={{ color: COLORS.error, fontWeight: 600, mb: 0.3 }}>
                        -${(s.amount / 1000).toFixed(0)}k
                      </Typography>
                      <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontFamily: 'monospace', fontSize: 10 }}>
                        sample entry — no on-chain hash
                      </Typography>
                    </Box>
                  </Box>
                  {i < SPENDING_HISTORY.length - 1 && <Divider sx={{ borderColor: COLORS.border }} />}
                </Box>
              ))
            ) : live.status === 'loading' ? (
              <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
                Loading treasury transactions…
              </Typography>
            ) : (
              notLive(
                live.status === 'ready' ? 'No treasury transactions recorded yet' : 'Treasury ledger unavailable',
                live.status === 'ready'
                  ? 'The governance treasury has no executed transactions on this network yet.'
                  : 'The governance treasury endpoint is not reachable from this build.',
              )
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TreasuryDashboard;
