import PublicViewerNotice from '../common/PublicViewerNotice';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Collapse,
  IconButton,
  LinearProgress,
  Divider,
  Avatar,
  CircularProgress,
} from '@mui/material';
import { apiClient } from '../../services/apiClient';
import {
  KeyboardArrowDown as ExpandIcon,
  KeyboardArrowUp as CollapseIcon,
  AccountBalance as StakeIcon,
  Lock as LockIcon,
  CardGiftcard as RewardIcon,
  Schedule as ScheduleIcon,
  SwapVert as SwapIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, ChartTooltip, Legend, Filler);

// --- Palette ---

const palette = {
  bg: '#0F172A',
  card: '#1E293B',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  border: '#334155',
  purple: '#8B5CF6',
};

const fontMono = '"JetBrains Mono", "Fira Code", monospace';
const fontUI = '"Inter", "Segoe UI", sans-serif';

// --- Types ---

interface TransactionRecord {
  date: string;
  action: string;
  amount: number;
  txHash: string;
}

interface StakingPosition {
  id: string;
  name: string;
  amountStaked: number;
  apy: number;
  rewardsAccrued: number;
  lockPeriod: string;
  unlockDate: string;
  status: 'active' | 'unlocking' | 'claimable';
  transactions: TransactionRecord[];
}

interface StakingSummary {
  totalStaked: number;
  totalStakedUsd: number;
  totalRewards: number;
  totalRewardsUsd: number;
  avgApy: number;
  stWrfBalance: number;
  stWrfExchangeRate: number;
}

// --- Defaults ---

const EMPTY_SUMMARY: StakingSummary = {
  totalStaked: 0,
  totalStakedUsd: 0,
  totalRewards: 0,
  totalRewardsUsd: 0,
  avgApy: 0,
  stWrfBalance: 0,
  stWrfExchangeRate: 1,
};

interface ExchangeRatePoint {
  timestamp: string;
  rate: number;
}

const EMPTY_EXCHANGE_HISTORY = { labels: [] as string[], values: [] as number[] };

// --- Sub-components ---

const PositionRow: React.FC<{ position: StakingPosition }> = ({ position }) => {
  const [expanded, setExpanded] = useState(false);

  const statusConfig: Record<string, { color: string; label: string }> = {
    active: { color: palette.success, label: 'Active' },
    unlocking: { color: palette.warning, label: 'Unlocking' },
    claimable: { color: palette.primary, label: 'Claimable' },
  };

  const sc = statusConfig[position.status];

  return (
    <>
      <TableRow
        sx={{
          cursor: 'pointer',
          '&:hover td': { bgcolor: `${palette.primary}08` },
          '& td': { borderColor: palette.border },
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <TableCell sx={{ color: palette.text, fontFamily: fontUI, fontWeight: 600 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton size="small" sx={{ color: palette.textSecondary }}>
              {expanded ? <CollapseIcon /> : <ExpandIcon />}
            </IconButton>
            <Typography sx={{ fontFamily: fontUI, fontWeight: 600, fontSize: '0.85rem' }}>
              {position.name}
            </Typography>
          </Stack>
        </TableCell>
        <TableCell sx={{ color: palette.text, fontFamily: fontMono, fontSize: '0.85rem' }}>
          {position.amountStaked.toLocaleString()} WRF
        </TableCell>
        <TableCell>
          <Chip
            label={`${position.apy}%`}
            size="small"
            sx={{
              bgcolor: `${palette.success}20`,
              color: palette.success,
              fontFamily: fontMono,
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          />
        </TableCell>
        <TableCell sx={{ color: palette.warning, fontFamily: fontMono, fontSize: '0.85rem' }}>
          +{position.rewardsAccrued.toFixed(2)} WRF
        </TableCell>
        <TableCell sx={{ color: palette.textSecondary, fontFamily: fontUI, fontSize: '0.85rem' }}>
          {position.lockPeriod}
        </TableCell>
        <TableCell sx={{ color: palette.textSecondary, fontFamily: fontMono, fontSize: '0.8rem' }}>
          {position.unlockDate}
        </TableCell>
        <TableCell>
          <Chip
            label={sc.label}
            size="small"
            sx={{ bgcolor: `${sc.color}20`, color: sc.color, fontFamily: fontUI, fontWeight: 500, fontSize: '0.72rem' }}
          />
        </TableCell>
        <TableCell>
          <Button
            size="small"
            variant="outlined"
            onClick={(e) => { e.stopPropagation(); }}
            sx={{
              borderColor: palette.warning,
              color: palette.warning,
              fontFamily: fontUI,
              textTransform: 'none',
              fontSize: '0.75rem',
              '&:hover': { bgcolor: `${palette.warning}15`, borderColor: palette.warning },
            }}
          >
            Claim Rewards
          </Button>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell sx={{ p: 0, borderColor: palette.border }} colSpan={8}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ p: 2, bgcolor: `${palette.primary}05` }}>
              <Typography
                sx={{ color: palette.textSecondary, fontFamily: fontUI, fontWeight: 600, fontSize: '0.8rem', mb: 1 }}
              >
                Transaction History
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {['Date', 'Action', 'Amount', 'Tx Hash'].map((h) => (
                      <TableCell
                        key={h}
                        sx={{
                          color: palette.textSecondary,
                          fontFamily: fontUI,
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          borderColor: palette.border,
                        }}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {position.transactions.map((tx, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ color: palette.textSecondary, fontFamily: fontMono, fontSize: '0.78rem', borderColor: palette.border }}>
                        {tx.date}
                      </TableCell>
                      <TableCell sx={{ color: palette.text, fontFamily: fontUI, fontSize: '0.78rem', borderColor: palette.border }}>
                        {tx.action}
                      </TableCell>
                      <TableCell sx={{ color: palette.text, fontFamily: fontMono, fontSize: '0.78rem', borderColor: palette.border }}>
                        {tx.amount.toLocaleString()} WRF
                      </TableCell>
                      <TableCell sx={{ color: palette.primary, fontFamily: fontMono, fontSize: '0.72rem', borderColor: palette.border }}>
                        {tx.txHash}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

// --- Main Component ---

const StakingPanel: React.FC = () => {
  const [summary, setSummary] = useState<StakingSummary>(EMPTY_SUMMARY);
  const [positions, setPositions] = useState<StakingPosition[]>([]);
  const [exchangeHistory, setExchangeHistory] = useState(EMPTY_EXCHANGE_HISTORY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, positionsData, historyData] = await Promise.all([
        apiClient.get<StakingSummary>('/staking/summary'),
        apiClient.get<StakingPosition[]>('/staking/positions'),
        apiClient.get<ExchangeRatePoint[]>('/staking/exchange-rate-history?days=180'),
      ]);
      if (!summaryData || !Object.keys(EMPTY_SUMMARY).every(key =>
        typeof summaryData[key as keyof StakingSummary] === 'number'
        && Number.isFinite(summaryData[key as keyof StakingSummary]))
        || !Array.isArray(positionsData) || !Array.isArray(historyData)
        || !historyData.every(point => typeof point.timestamp === 'string'
          && typeof point.rate === 'number' && Number.isFinite(point.rate))) {
        throw new Error('Incomplete staking data');
      }
      setSummary(summaryData);
      setPositions(positionsData);
      setExchangeHistory({
        labels: historyData.map(point => new Date(point.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })),
        values: historyData.map(point => point.rate),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load staking data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const chartData = useMemo(
    () => ({
      labels: exchangeHistory.labels,
      datasets: [
        {
          label: 'stWRF/WRF Exchange Rate',
          data: exchangeHistory.values,
          borderColor: palette.success,
          backgroundColor: `${palette.success}15`,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          borderWidth: 2,
        },
      ],
    }),
    [exchangeHistory],
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
          cornerRadius: 8,
          titleFont: { family: fontUI },
          bodyFont: { family: fontMono },
        },
      },
      scales: {
        x: {
          display: true,
          ticks: {
            color: palette.textSecondary,
            font: { family: fontUI, size: 10 },
            maxTicksLimit: 8,
          },
          grid: { color: `${palette.border}40` },
        },
        y: {
          display: true,
          ticks: {
            color: palette.textSecondary,
            font: { family: fontMono, size: 10 },
          },
          grid: { color: `${palette.border}40` },
        },
      },
    }),
    [],
  );

  if (loading) return <CircularProgress aria-label="Loading staking data" />;
  if (error) return <Stack spacing={2}>
    <PublicViewerNotice reason="not-live" title="Staking data is unavailable"
      description="All staking reads must succeed before balances, positions or rates can be shown." />
    <Button onClick={fetchData}>Retry</Button>
  </Stack>;

  return (
    <Stack spacing={3}>
      {/* Summary Cards */}
      <Stack direction="row" flexWrap="wrap" gap={2}>
        {[
          {
            label: 'Total Staked',
            value: `${summary.totalStaked.toLocaleString()} WRF`,
            sub: `$${summary.totalStakedUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            icon: <StakeIcon />,
            color: palette.primary,
          },
          {
            label: 'Total Rewards',
            value: `${summary.totalRewards.toFixed(2)} WRF`,
            sub: `$${summary.totalRewardsUsd.toFixed(2)}`,
            icon: <RewardIcon />,
            color: palette.warning,
          },
          {
            label: 'Average APY',
            value: `${summary.avgApy}%`,
            sub: 'Weighted average',
            icon: <TrendingUpIcon />,
            color: palette.success,
          },
          {
            label: 'stWRF Balance',
            value: summary.stWrfBalance.toLocaleString('en-US', { minimumFractionDigits: 2 }),
            sub: `Rate: 1 stWRF = ${summary.stWrfExchangeRate} WRF`,
            icon: <SwapIcon />,
            color: palette.purple,
          },
        ].map((stat) => (
          <Card
            key={stat.label}
            sx={{
              bgcolor: palette.card,
              border: `1px solid ${palette.border}`,
              borderRadius: 3,
              flex: 1,
              minWidth: 200,
            }}
          >
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography
                  sx={{
                    color: palette.textSecondary,
                    fontSize: '0.75rem',
                    fontFamily: fontUI,
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  {stat.label}
                </Typography>
                <Box sx={{ color: stat.color, opacity: 0.7 }}>{stat.icon}</Box>
              </Stack>
              <Typography sx={{ color: palette.text, fontSize: '1.35rem', fontFamily: fontMono, fontWeight: 700 }}>
                {stat.value}
              </Typography>
              <Typography sx={{ color: palette.textSecondary, fontSize: '0.78rem', fontFamily: fontMono, mt: 0.5 }}>
                {stat.sub}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Staking Positions Table */}
      <Card sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 3 }}>
        <Box sx={{ p: 2.5, pb: 0 }}>
          <Typography sx={{ color: palette.text, fontFamily: fontUI, fontWeight: 600, fontSize: '1rem' }}>
            Staking Positions
          </Typography>
          <Typography sx={{ color: palette.textSecondary, fontFamily: fontUI, fontSize: '0.8rem', mt: 0.5 }}>
            Click a row to expand transaction history
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {['Position', 'Amount Staked', 'APY', 'Rewards Accrued', 'Lock Period', 'Unlock Date', 'Status', ''].map(
                  (h) => (
                    <TableCell
                      key={h}
                      sx={{
                        color: palette.textSecondary,
                        fontFamily: fontUI,
                        fontWeight: 600,
                        fontSize: '0.72rem',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        borderColor: palette.border,
                      }}
                    >
                      {h}
                    </TableCell>
                  ),
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4, borderColor: palette.border }}>
                    <CircularProgress size={28} sx={{ color: palette.success }} />
                  </TableCell>
                </TableRow>
              ) : positions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4, color: palette.textSecondary, fontFamily: fontUI, borderColor: palette.border }}>
                    No staking positions found
                  </TableCell>
                </TableRow>
              ) : positions.map((pos) => (
                <PositionRow key={pos.id} position={pos} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* stWRF Exchange Rate Chart */}
      <Card sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 3, p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Box>
            <Typography sx={{ color: palette.text, fontFamily: fontUI, fontWeight: 600, fontSize: '1rem' }}>
              stWRF Exchange Rate History
            </Typography>
            <Typography sx={{ color: palette.textSecondary, fontFamily: fontUI, fontSize: '0.8rem', mt: 0.5 }}>
              stWRF steadily appreciates against WRF as staking rewards accrue
            </Typography>
          </Box>
          <Chip
            label={`Current: ${summary.stWrfExchangeRate.toFixed(4)}`}
            sx={{
              bgcolor: `${palette.success}20`,
              color: palette.success,
              fontFamily: fontMono,
              fontWeight: 600,
              fontSize: '0.78rem',
            }}
          />
        </Stack>
        <Box sx={{ height: 280 }}>
          <Line data={chartData} options={chartOptions} />
        </Box>
      </Card>

      {/* Total Rewards Summary */}
      <Card sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 3, p: 3 }}>
        <Typography sx={{ color: palette.text, fontFamily: fontUI, fontWeight: 600, fontSize: '1rem', mb: 2 }}>
          Total Staking Rewards Summary
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={3}>
          {[
            { label: 'Lifetime Rewards', value: '1,245.87 WRF', sub: '$373.76' },
            { label: 'Claimed', value: '903.69 WRF', sub: '$271.11' },
            { label: 'Unclaimed', value: '342.18 WRF', sub: '$102.65' },
            { label: 'Next Distribution', value: '~4h 22m', sub: 'Epoch boundary' },
          ].map((item) => (
            <Box key={item.label} sx={{ flex: 1, minWidth: 160 }}>
              <Typography
                sx={{
                  color: palette.textSecondary,
                  fontFamily: fontUI,
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  mb: 0.5,
                }}
              >
                {item.label}
              </Typography>
              <Typography sx={{ color: palette.text, fontFamily: fontMono, fontWeight: 700, fontSize: '1.1rem' }}>
                {item.value}
              </Typography>
              <Typography sx={{ color: palette.textSecondary, fontFamily: fontMono, fontSize: '0.75rem' }}>
                {item.sub}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Card>
    </Stack>
  );
};

export default StakingPanel;
