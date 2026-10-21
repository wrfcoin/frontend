import DemoSurfaceGate from '../common/DemoSurfaceGate';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Tabs,
  Tab,
  Button,
  Chip,
  Avatar,
  AvatarGroup,
  Slider,
  TextField,
  InputAdornment,
  Divider,
  CircularProgress,
} from '@mui/material';
import { apiClient } from '../../services/apiClient';
import {
  Agriculture as FarmIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  ShowChart as ChartIcon,
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
  cyan: '#06B6D4',
  pink: '#EC4899',
};

const fontMono = '"JetBrains Mono", "Fira Code", monospace';
const fontUI = '"Inter", "Segoe UI", sans-serif';

// --- Types ---

interface FarmPool {
  id: string;
  pair: [string, string];
  pairLabel: string;
  tvl: number;
  aprBase: number;
  aprReward: number;
  aprTotal: number;
  userDeposited: number;
  userDepositedUsd: number;
  pendingRewards: number;
  pendingRewardsUsd: number;
  pairColors: [string, string];
  multiplier: string;
}

// --- Mock Data ---

// (mock data removed — pools fetched from API)

// --- Pool Card ---

const PoolCard: React.FC<{ pool: FarmPool }> = ({ pool }) => (
  <Card
    sx={{
      bgcolor: palette.card,
      border: `1px solid ${palette.border}`,
      borderRadius: 3,
      transition: 'all 0.2s',
      '&:hover': { borderColor: `${palette.primary}60`, transform: 'translateY(-2px)' },
    }}
  >
    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <AvatarGroup>
            <Avatar sx={{ bgcolor: pool.pairColors[0], width: 32, height: 32, fontSize: '0.65rem', fontWeight: 700 }}>
              {pool.pair[0].slice(0, 2)}
            </Avatar>
            <Avatar sx={{ bgcolor: pool.pairColors[1], width: 32, height: 32, fontSize: '0.65rem', fontWeight: 700 }}>
              {pool.pair[1].slice(0, 2)}
            </Avatar>
          </AvatarGroup>
          <Typography sx={{ color: palette.text, fontFamily: fontUI, fontWeight: 700, fontSize: '0.95rem' }}>
            {pool.pairLabel}
          </Typography>
        </Stack>
        <Chip
          label={pool.multiplier}
          size="small"
          sx={{
            bgcolor: `${palette.purple}20`,
            color: palette.purple,
            fontFamily: fontMono,
            fontWeight: 700,
            fontSize: '0.72rem',
          }}
        />
      </Stack>

      {/* TVL */}
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Typography sx={{ color: palette.textSecondary, fontFamily: fontUI, fontSize: '0.75rem' }}>TVL</Typography>
        <Typography sx={{ color: palette.text, fontFamily: fontMono, fontSize: '0.85rem', fontWeight: 600 }}>
          ${pool.tvl.toLocaleString()}
        </Typography>
      </Stack>

      {/* APR Breakdown */}
      <Box sx={{ p: 1.5, bgcolor: `${palette.success}08`, borderRadius: 2, border: `1px solid ${palette.success}20`, mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
          <Typography sx={{ color: palette.textSecondary, fontFamily: fontUI, fontSize: '0.72rem' }}>Base APR</Typography>
          <Typography sx={{ color: palette.text, fontFamily: fontMono, fontSize: '0.78rem' }}>{pool.aprBase}%</Typography>
        </Stack>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
          <Typography sx={{ color: palette.textSecondary, fontFamily: fontUI, fontSize: '0.72rem' }}>Reward APR</Typography>
          <Typography sx={{ color: palette.success, fontFamily: fontMono, fontSize: '0.78rem' }}>+{pool.aprReward}%</Typography>
        </Stack>
        <Divider sx={{ borderColor: `${palette.success}20`, my: 0.5 }} />
        <Stack direction="row" justifyContent="space-between">
          <Typography sx={{ color: palette.success, fontFamily: fontUI, fontSize: '0.78rem', fontWeight: 700 }}>Total APR</Typography>
          <Typography sx={{ color: palette.success, fontFamily: fontMono, fontSize: '0.95rem', fontWeight: 700 }}>
            {pool.aprTotal}%
          </Typography>
        </Stack>
      </Box>

      {/* User Position */}
      <Stack spacing={1} sx={{ mb: 2 }}>
        <Stack direction="row" justifyContent="space-between">
          <Typography sx={{ color: palette.textSecondary, fontFamily: fontUI, fontSize: '0.75rem' }}>Your Deposit</Typography>
          <Stack alignItems="flex-end">
            <Typography sx={{ color: palette.text, fontFamily: fontMono, fontSize: '0.85rem', fontWeight: 600 }}>
              {pool.userDeposited.toLocaleString()} LP
            </Typography>
            <Typography sx={{ color: palette.textSecondary, fontFamily: fontMono, fontSize: '0.7rem' }}>
              ${pool.userDepositedUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Typography>
          </Stack>
        </Stack>
        <Stack direction="row" justifyContent="space-between">
          <Typography sx={{ color: palette.textSecondary, fontFamily: fontUI, fontSize: '0.75rem' }}>Pending Rewards</Typography>
          <Stack alignItems="flex-end">
            <Typography sx={{ color: palette.warning, fontFamily: fontMono, fontSize: '0.85rem', fontWeight: 600 }}>
              {pool.pendingRewards.toFixed(2)} WRF
            </Typography>
            <Typography sx={{ color: palette.textSecondary, fontFamily: fontMono, fontSize: '0.7rem' }}>
              ${pool.pendingRewardsUsd.toFixed(2)}
            </Typography>
          </Stack>
        </Stack>
      </Stack>

      {/* Actions */}
      <Stack direction="row" spacing={1}>
        <Button
          fullWidth
          variant="contained"
          size="small"
          sx={{
            bgcolor: palette.warning,
            color: palette.bg,
            fontFamily: fontUI,
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '0.8rem',
            '&:hover': { bgcolor: '#D97706' },
          }}
        >
          Harvest
        </Button>
        <Button
          fullWidth
          variant="outlined"
          size="small"
          sx={{
            borderColor: palette.primary,
            color: palette.primary,
            fontFamily: fontUI,
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '0.8rem',
            '&:hover': { bgcolor: `${palette.primary}15`, borderColor: palette.primary },
          }}
        >
          Deposit
        </Button>
      </Stack>
    </CardContent>
  </Card>
);

// --- IL Calculator ---

const ImpermanentLossCalculator: React.FC = () => {
  const [priceChangeA, setPriceChangeA] = useState(50);
  const [priceChangeB, setPriceChangeB] = useState(0);

  const ilData = useMemo(() => {
    const labels: string[] = [];
    const ilValues: number[] = [];
    const holdValues: number[] = [];
    const lpValues: number[] = [];

    for (let pct = -80; pct <= 300; pct += 5) {
      labels.push(`${pct}%`);
      const ratio = (100 + pct) / 100;
      const il = 2 * Math.sqrt(ratio) / (1 + ratio) - 1;
      ilValues.push(parseFloat((il * 100).toFixed(2)));
      holdValues.push(parseFloat(((ratio - 1) * 50).toFixed(2)));
      lpValues.push(parseFloat(((Math.sqrt(ratio) - 1) * 100).toFixed(2)));
    }

    return { labels, ilValues, holdValues, lpValues };
  }, []);

  const ratioA = (100 + priceChangeA) / 100;
  const ratioB = (100 + priceChangeB) / 100;
  const priceRatio = ratioA / ratioB;
  const ilPercent = (2 * Math.sqrt(priceRatio) / (1 + priceRatio) - 1) * 100;

  const chartData = {
    labels: ilData.labels,
    datasets: [
      {
        label: 'Impermanent Loss %',
        data: ilData.ilValues,
        borderColor: palette.error,
        backgroundColor: `${palette.error}15`,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
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
        bodyFont: { family: fontMono },
      },
    },
    scales: {
      x: {
        ticks: { color: palette.textSecondary, font: { family: fontUI, size: 10 }, maxTicksLimit: 10 },
        grid: { color: `${palette.border}40` },
        title: { display: true, text: 'Price Change of Token A', color: palette.textSecondary, font: { family: fontUI, size: 11 } },
      },
      y: {
        ticks: {
          color: palette.textSecondary,
          font: { family: fontMono, size: 10 },
          callback: (v: number | string) => `${v}%`,
        },
        grid: { color: `${palette.border}40` },
        title: { display: true, text: 'Impermanent Loss', color: palette.textSecondary, font: { family: fontUI, size: 11 } },
      },
    },
  };

  return (
    <Stack spacing={3}>
      <Card sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 3, p: 3 }}>
        <Typography sx={{ color: palette.text, fontFamily: fontUI, fontWeight: 600, fontSize: '1rem', mb: 0.5 }}>
          Impermanent Loss Calculator
        </Typography>
        <Typography sx={{ color: palette.textSecondary, fontFamily: fontUI, fontSize: '0.8rem', mb: 3 }}>
          Estimate potential impermanent loss based on token price changes
        </Typography>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ color: palette.textSecondary, fontFamily: fontUI, fontSize: '0.8rem', mb: 1 }}>
              Token A Price Change: <strong style={{ color: palette.text }}>{priceChangeA}%</strong>
            </Typography>
            <Slider
              value={priceChangeA}
              onChange={(_, v) => setPriceChangeA(v as number)}
              min={-90}
              max={500}
              sx={{
                color: palette.primary,
                '& .MuiSlider-thumb': { bgcolor: palette.primary },
                '& .MuiSlider-track': { bgcolor: palette.primary },
              }}
            />
            <Typography sx={{ color: palette.textSecondary, fontFamily: fontUI, fontSize: '0.8rem', mb: 1, mt: 2 }}>
              Token B Price Change: <strong style={{ color: palette.text }}>{priceChangeB}%</strong>
            </Typography>
            <Slider
              value={priceChangeB}
              onChange={(_, v) => setPriceChangeB(v as number)}
              min={-90}
              max={500}
              sx={{
                color: palette.purple,
                '& .MuiSlider-thumb': { bgcolor: palette.purple },
                '& .MuiSlider-track': { bgcolor: palette.purple },
              }}
            />

            <Box
              sx={{
                mt: 3,
                p: 2,
                borderRadius: 2,
                bgcolor: ilPercent < -5 ? `${palette.error}10` : `${palette.warning}10`,
                border: `1px solid ${ilPercent < -5 ? palette.error : palette.warning}30`,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <WarningIcon sx={{ color: ilPercent < -5 ? palette.error : palette.warning, fontSize: 18 }} />
                <Typography sx={{ color: palette.text, fontFamily: fontUI, fontWeight: 600, fontSize: '0.85rem' }}>
                  Estimated Impermanent Loss
                </Typography>
              </Stack>
              <Typography sx={{ color: palette.error, fontFamily: fontMono, fontWeight: 700, fontSize: '1.5rem' }}>
                {ilPercent.toFixed(2)}%
              </Typography>
              <Typography sx={{ color: palette.textSecondary, fontFamily: fontUI, fontSize: '0.75rem', mt: 0.5 }}>
                On a $1,000 position, you would lose ~${Math.abs(ilPercent * 10).toFixed(2)} compared to holding
              </Typography>
            </Box>
          </Box>

          <Box sx={{ flex: 1.5, height: 300 }}>
            <Line data={chartData} options={chartOptions} />
          </Box>
        </Stack>
      </Card>
    </Stack>
  );
};

// --- Main Component ---

const YieldFarmingPanelSample: React.FC = () => {
  const [subTab, setSubTab] = useState(0);
  const [pools, setPools] = useState<FarmPool[]>([]);
  const [poolsLoading, setPoolsLoading] = useState(true);

  const fetchPools = useCallback(async () => {
    setPoolsLoading(true);
    try {
      const data = await apiClient.get<FarmPool[]>('/defi/yield/pools');
      if (data) setPools(data);
    } catch {
      // keep empty list
    } finally {
      setPoolsLoading(false);
    }
  }, []);

  useEffect(() => { fetchPools(); }, [fetchPools]);

  const totalDeposited = pools.reduce((s, p) => s + p.userDepositedUsd, 0);
  const totalPending = pools.reduce((s, p) => s + p.pendingRewardsUsd, 0);
  const avgApr = pools.length > 0 ? pools.reduce((s, p) => s + p.aprTotal, 0) / pools.length : 0;

  return (
    <Stack spacing={3}>
      {/* Summary */}
      <Stack direction="row" flexWrap="wrap" gap={2}>
        {[
          { label: 'Total Deposited', value: `$${totalDeposited.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: palette.primary },
          { label: 'Pending Rewards', value: `$${totalPending.toFixed(2)}`, color: palette.warning },
          { label: 'Active Pools', value: `${pools.length}`, color: palette.success },
          { label: 'Avg APR', value: `${avgApr.toFixed(1)}%`, color: palette.purple },
        ].map((s) => (
          <Card key={s.label} sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 3, flex: 1, minWidth: 170 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography sx={{ color: palette.textSecondary, fontFamily: fontUI, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5 }}>
                {s.label}
              </Typography>
              <Typography sx={{ color: s.color, fontFamily: fontMono, fontWeight: 700, fontSize: '1.25rem' }}>
                {s.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Sub-tabs */}
      <Card sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 3 }}>
        <Tabs
          value={subTab}
          onChange={(_, v) => setSubTab(v)}
          sx={{
            px: 1,
            '& .MuiTabs-indicator': { bgcolor: palette.primary, height: 3, borderRadius: '3px 3px 0 0' },
            '& .MuiTab-root': {
              color: palette.textSecondary,
              fontFamily: fontUI,
              fontWeight: 500,
              fontSize: '0.85rem',
              textTransform: 'none',
              minHeight: 48,
              '&.Mui-selected': { color: palette.text },
            },
          }}
        >
          <Tab label="Active Pools" icon={<FarmIcon fontSize="small" />} iconPosition="start" />
          <Tab label="IL Calculator" icon={<ChartIcon fontSize="small" />} iconPosition="start" />
        </Tabs>
      </Card>

      {/* Content */}
      {subTab === 0 && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr 1fr' },
            gap: 2,
          }}
        >
          {poolsLoading ? (
            <Box sx={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress sx={{ color: palette.success }} />
            </Box>
          ) : pools.length === 0 ? (
            <Box sx={{ gridColumn: '1 / -1', textAlign: 'center', py: 6 }}>
              <Typography sx={{ color: palette.textSecondary, fontFamily: fontUI }}>No yield pools available</Typography>
            </Box>
          ) : pools.map((pool) => (
            <PoolCard key={pool.id} pool={pool} />
          ))}
        </Box>
      )}
      {subTab === 1 && <ImpermanentLossCalculator />}
    </Stack>
  );
};

const YieldFarmingPanel: React.FC = () => (
  <DemoSurfaceGate
    title="Yield farming is not live yet"
    description="Verified yield pools, deposits and rewards are unavailable. The yield preview uses illustrative values."
    testId="defi-farming"
  >
    <YieldFarmingPanelSample />
  </DemoSurfaceGate>
);

export default YieldFarmingPanel;
