import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Tabs,
  Tab,
  TextField,
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  InputAdornment,
  Tooltip,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  AccountBalance as StakeIcon,
  SwapVert as SwapIcon,
  Timeline as TimelineIcon,
  Info as InfoIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Groups as ValidatorsIcon,
  LocalAtm as FeeIcon,
  Lock as LockIcon,
  ArrowDownward as ArrowDownIcon,
} from '@mui/icons-material';
import { WrfPreflightSimulation } from '../DesignSystem';
import { usePreflightChecks } from '../../hooks/usePreflightChecks';
import { useCapabilitiesContext } from '../../contexts/CapabilitiesContext';
import PublicViewerNotice from '../common/PublicViewerNotice';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler,
);

// --- Types ---

interface WithdrawalRequest {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'claimable' | 'completed';
  requestDate: string;
  estimatedCompletion: string;
  wrfReceived: number | null;
}

// --- Constants ---

const palette = {
  bg: '#0F172A',
  card: '#1E293B',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  border: '#334155',
  purple: '#8B5CF6',
};

// MOCK_PROTOCOL_STATS, MOCK_USER, MOCK_WITHDRAWALS removed — fetched from API

function generateExchangeRateHistory() {
  return { labels: [] as string[], values: [] as number[] };
}

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  pending: { color: palette.textSecondary, label: 'Pending' },
  processing: { color: palette.warning, label: 'Processing' },
  claimable: { color: palette.success, label: 'Claimable' },
  completed: { color: palette.primary, label: 'Completed' },
};

type ProtocolStats = typeof defaultProtocolStats;
type UserStats = typeof defaultUserStats;

const defaultProtocolStats = {
  totalStaked: 0, apy: 0, validatorCount: 0, activeValidators: 0,
  exchangeRate: 1, feeRate: 0, minStake: 10, rewardsDistribution: '',
};
const defaultUserStats = { wrfBalance: 0, stWrfBalance: 0, stWrfValueInWrf: 0, totalRewardsEarned: 0 };

// --- Component ---

const LiquidStakingBody: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [user, setUser] = useState<UserStats>(defaultUserStats);
  const [protocol, setProtocol] = useState<ProtocolStats>(defaultProtocolStats);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStakeSimulation, setShowStakeSimulation] = useState(false);
  const [showUnstakeSimulation, setShowUnstakeSimulation] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [protocolRes, userRes, withdrawalsRes] = await Promise.allSettled([
        // TODO: confirm endpoint paths with backend team
        fetch('/api/staking/liquid/protocol', { headers: { Accept: 'application/json' } }),
        fetch('/api/staking/liquid/user', { headers: { Accept: 'application/json' } }),
        fetch('/api/staking/liquid/withdrawals', { headers: { Accept: 'application/json' } }),
      ]);

      if (protocolRes.status === 'fulfilled' && protocolRes.value.ok) {
        const data = await protocolRes.value.json();
        const raw = data.data ?? data;
        setProtocol({
          totalStaked: Number(raw.totalStaked ?? raw.total_staked ?? 0),
          apy: Number(raw.apy ?? 0),
          validatorCount: Number(raw.validatorCount ?? raw.validator_count ?? 0),
          activeValidators: Number(raw.activeValidators ?? raw.active_validators ?? 0),
          exchangeRate: Number(raw.exchangeRate ?? raw.exchange_rate ?? 1),
          feeRate: Number(raw.feeRate ?? raw.fee_rate ?? 0),
          minStake: Number(raw.minStake ?? raw.min_stake ?? 10),
          rewardsDistribution: String(raw.rewardsDistribution ?? raw.rewards_distribution ?? ''),
        });
      }

      if (userRes.status === 'fulfilled' && userRes.value.ok) {
        const data = await userRes.value.json();
        const raw = data.data ?? data;
        setUser({
          wrfBalance: Number(raw.wrfBalance ?? raw.wrf_balance ?? 0),
          stWrfBalance: Number(raw.stWrfBalance ?? raw.st_wrf_balance ?? 0),
          stWrfValueInWrf: Number(raw.stWrfValueInWrf ?? raw.st_wrf_value_in_wrf ?? 0),
          totalRewardsEarned: Number(raw.totalRewardsEarned ?? raw.total_rewards_earned ?? 0),
        });
      }

      if (withdrawalsRes.status === 'fulfilled' && withdrawalsRes.value.ok) {
        const data = await withdrawalsRes.value.json();
        const rows = Array.isArray(data) ? data : (data.data ?? data.withdrawals ?? []);
        setWithdrawals(rows.map((w: any) => ({
          id: String(w.id ?? ''),
          amount: Number(w.amount ?? 0),
          status: w.status ?? 'pending',
          requestDate: w.requestDate ?? w.request_date ?? '',
          estimatedCompletion: w.estimatedCompletion ?? w.estimated_completion ?? '',
          wrfReceived: w.wrfReceived != null ? Number(w.wrfReceived) : (w.wrf_received != null ? Number(w.wrf_received) : null),
        })));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load staking data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const preflightChecks = usePreflightChecks({
    requiredCapabilities: ['liquidStaking'],
    blockDuringTransition: true,
  });

  const exchangeHistory = useMemo(() => generateExchangeRateHistory(), []);

  const stakeValue = parseFloat(stakeAmount) || 0;
  const unstakeValue = parseFloat(unstakeAmount) || 0;
  const estimatedStWrf = stakeValue / protocol.exchangeRate;
  const estimatedWrf = unstakeValue * protocol.exchangeRate;

  const exchangeChartData = {
    labels: exchangeHistory.labels,
    datasets: [{
      label: 'WRF:stWRF Exchange Rate',
      data: exchangeHistory.values,
      borderColor: palette.purple,
      backgroundColor: `${palette.purple}15`,
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 4,
    }],
  };

  const exchangeChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { position: 'top' as const, labels: { color: palette.textSecondary, font: { size: 11 }, usePointStyle: true, pointStyleWidth: 8 } },
      tooltip: {
        backgroundColor: palette.card,
        titleColor: palette.text,
        bodyColor: palette.textSecondary,
        borderColor: palette.border,
        borderWidth: 1,
        callbacks: { label: (ctx: { raw?: unknown }) => ` 1 stWRF = ${Number(ctx.raw).toFixed(4)} WRF` },
      },
    },
    scales: {
      x: { grid: { color: `${palette.border}30` }, ticks: { color: palette.textSecondary, font: { size: 9 }, maxTicksLimit: 12 } },
      y: { grid: { color: `${palette.border}30` }, ticks: { color: palette.textSecondary, font: { size: 10 }, callback: (v: number | string) => Number(v).toFixed(3) } },
    },
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress sx={{ color: palette.purple }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={<Button size="small" onClick={fetchData}>Retry</Button>}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ bgcolor: palette.bg, minHeight: '100vh', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
          <StakeIcon sx={{ color: palette.purple, fontSize: 28 }} />
          <Typography variant="h5" sx={{ color: palette.text, fontWeight: 700 }}>
            Liquid Staking
          </Typography>
          <Chip label="stWRF" size="small" sx={{ bgcolor: `${palette.purple}1a`, color: palette.purple, fontWeight: 700, fontSize: '0.7rem' }} />
        </Stack>
        <Typography variant="body2" sx={{ color: palette.textSecondary }}>
          Stake WRF to receive stWRF liquid staking tokens. Earn staking rewards while maintaining liquidity.
        </Typography>
      </Box>

      {/* Protocol Stats Row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 3 }}>
        {[
          { label: 'TOTAL STAKED', value: `${(protocol.totalStaked / 1e6).toFixed(2)}M`, sub: 'WRF', color: palette.primary, icon: <LockIcon sx={{ fontSize: 16 }} /> },
          { label: 'APY', value: `${protocol.apy}%`, sub: 'current rate', color: palette.success, icon: <TrendingUpIcon sx={{ fontSize: 16 }} /> },
          { label: 'VALIDATORS', value: `${protocol.activeValidators}/${protocol.validatorCount}`, sub: 'active', color: palette.purple, icon: <ValidatorsIcon sx={{ fontSize: 16 }} /> },
          { label: 'EXCHANGE RATE', value: protocol.exchangeRate.toFixed(4), sub: '1 stWRF = ? WRF', color: palette.warning, icon: <SwapIcon sx={{ fontSize: 16 }} /> },
        ].map((stat, i) => (
          <Card key={i} sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 3 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.5 }}>
                <Box sx={{ color: stat.color }}>{stat.icon}</Box>
                <Typography variant="caption" sx={{ color: palette.textSecondary, fontWeight: 600, letterSpacing: 0.5 }}>
                  {stat.label}
                </Typography>
              </Stack>
              <Typography sx={{ color: stat.color, fontSize: '1.6rem', fontWeight: 800, fontFamily: 'monospace' }}>
                {stat.value}
              </Typography>
              <Typography variant="caption" sx={{ color: palette.textSecondary }}>{stat.sub}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Stake / Unstake Panel + User Position */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
        {/* Stake/Unstake Tabs */}
        <Card sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              sx={{
                mb: 3,
                '& .MuiTabs-indicator': { bgcolor: palette.primary },
                '& .MuiTab-root': { color: palette.textSecondary, textTransform: 'none', fontWeight: 600, minWidth: 0 },
                '& .Mui-selected': { color: palette.primary },
              }}
            >
              <Tab label="Stake" />
              <Tab label="Unstake" />
            </Tabs>

            {activeTab === 0 ? (
              /* Stake Tab */
              <Box>
                <Typography variant="body2" sx={{ color: palette.textSecondary, mb: 2 }}>
                  Stake your WRF tokens and receive stWRF. Your stWRF balance automatically accrues staking rewards.
                </Typography>
                <TextField
                  fullWidth
                  label="Amount to Stake"
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="0.00"
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <Chip
                            label="MAX"
                            size="small"
                            onClick={() => setStakeAmount(user.wrfBalance.toString())}
                            sx={{ cursor: 'pointer', bgcolor: `${palette.primary}1a`, color: palette.primary, fontWeight: 600, fontSize: '0.65rem' }}
                          />
                          <Typography sx={{ color: palette.textSecondary, ml: 1, fontWeight: 600 }}>WRF</Typography>
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    mb: 1,
                    '& .MuiOutlinedInput-root': { color: palette.text, '& fieldset': { borderColor: palette.border }, '&:hover fieldset': { borderColor: palette.primary }, '&.Mui-focused fieldset': { borderColor: palette.primary } },
                    '& .MuiInputLabel-root': { color: palette.textSecondary },
                  }}
                />
                <Typography variant="caption" sx={{ color: palette.textSecondary, display: 'block', mb: 2 }}>
                  Balance: {user.wrfBalance.toLocaleString()} WRF
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
                  <ArrowDownIcon sx={{ color: palette.textSecondary }} />
                </Box>

                {/* Exchange Rate Preview */}
                <Paper sx={{ bgcolor: `${palette.bg}80`, border: `1px solid ${palette.border}`, borderRadius: 2, p: 2, mb: 2 }}>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" sx={{ color: palette.textSecondary }}>You receive</Typography>
                      <Typography variant="body2" sx={{ color: palette.text, fontWeight: 700, fontFamily: 'monospace' }}>
                        {stakeValue > 0 ? estimatedStWrf.toFixed(4) : '0.00'} stWRF
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" sx={{ color: palette.textSecondary }}>Exchange rate</Typography>
                      <Typography variant="body2" sx={{ color: palette.textSecondary, fontFamily: 'monospace' }}>
                        1 WRF = {(1 / protocol.exchangeRate).toFixed(4)} stWRF
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" sx={{ color: palette.textSecondary }}>Protocol fee</Typography>
                      <Typography variant="body2" sx={{ color: palette.textSecondary, fontFamily: 'monospace' }}>
                        {protocol.feeRate}%
                      </Typography>
                    </Stack>
                  </Stack>
                </Paper>

                <Button
                  fullWidth
                  variant="contained"
                  disabled={stakeValue <= 0 || stakeValue > user.wrfBalance}
                  onClick={() => setShowStakeSimulation(true)}
                  sx={{ bgcolor: palette.primary, '&:hover': { bgcolor: palette.primaryDark }, textTransform: 'none', fontWeight: 700, py: 1.5 }}
                >
                  Stake WRF
                </Button>
              </Box>
            ) : (
              /* Unstake Tab */
              <Box>
                <Typography variant="body2" sx={{ color: palette.textSecondary, mb: 2 }}>
                  Unstake your stWRF tokens. There is a ~3 day unbonding period before you can claim your WRF.
                </Typography>
                <TextField
                  fullWidth
                  label="Amount to Unstake"
                  type="number"
                  value={unstakeAmount}
                  onChange={(e) => setUnstakeAmount(e.target.value)}
                  placeholder="0.00"
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <Chip
                            label="MAX"
                            size="small"
                            onClick={() => setUnstakeAmount(user.stWrfBalance.toString())}
                            sx={{ cursor: 'pointer', bgcolor: `${palette.purple}1a`, color: palette.purple, fontWeight: 600, fontSize: '0.65rem' }}
                          />
                          <Typography sx={{ color: palette.textSecondary, ml: 1, fontWeight: 600 }}>stWRF</Typography>
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    mb: 1,
                    '& .MuiOutlinedInput-root': { color: palette.text, '& fieldset': { borderColor: palette.border }, '&:hover fieldset': { borderColor: palette.purple }, '&.Mui-focused fieldset': { borderColor: palette.purple } },
                    '& .MuiInputLabel-root': { color: palette.textSecondary },
                  }}
                />
                <Typography variant="caption" sx={{ color: palette.textSecondary, display: 'block', mb: 2 }}>
                  Balance: {user.stWrfBalance.toLocaleString()} stWRF
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
                  <ArrowDownIcon sx={{ color: palette.textSecondary }} />
                </Box>

                <Paper sx={{ bgcolor: `${palette.bg}80`, border: `1px solid ${palette.border}`, borderRadius: 2, p: 2, mb: 2 }}>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" sx={{ color: palette.textSecondary }}>You receive (estimated)</Typography>
                      <Typography variant="body2" sx={{ color: palette.text, fontWeight: 700, fontFamily: 'monospace' }}>
                        {unstakeValue > 0 ? estimatedWrf.toFixed(4) : '0.00'} WRF
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" sx={{ color: palette.textSecondary }}>Unbonding period</Typography>
                      <Typography variant="body2" sx={{ color: palette.warning, fontFamily: 'monospace' }}>
                        ~3 days
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" sx={{ color: palette.textSecondary }}>Protocol fee</Typography>
                      <Typography variant="body2" sx={{ color: palette.textSecondary, fontFamily: 'monospace' }}>
                        {protocol.feeRate}%
                      </Typography>
                    </Stack>
                  </Stack>
                </Paper>

                <Button
                  fullWidth
                  variant="contained"
                  disabled={unstakeValue <= 0 || unstakeValue > user.stWrfBalance}
                  onClick={() => setShowUnstakeSimulation(true)}
                  sx={{ bgcolor: palette.purple, '&:hover': { bgcolor: '#7C3AED' }, textTransform: 'none', fontWeight: 700, py: 1.5 }}
                >
                  Unstake stWRF
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Your Position */}
        <Card sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ color: palette.text, fontWeight: 700, mb: 2 }}>
              Your Position
            </Typography>
            <Stack spacing={2}>
              <Paper sx={{ bgcolor: `${palette.bg}80`, border: `1px solid ${palette.border}`, borderRadius: 2, p: 2.5 }}>
                <Typography variant="caption" sx={{ color: palette.textSecondary, fontWeight: 600 }}>WRF BALANCE</Typography>
                <Typography sx={{ color: palette.text, fontSize: '1.4rem', fontWeight: 800, fontFamily: 'monospace' }}>
                  {user.wrfBalance.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: palette.textSecondary }}>WRF</Typography>
              </Paper>
              <Paper sx={{ bgcolor: `${palette.purple}08`, border: `1px solid ${palette.purple}33`, borderRadius: 2, p: 2.5 }}>
                <Typography variant="caption" sx={{ color: palette.purple, fontWeight: 600 }}>stWRF BALANCE</Typography>
                <Typography sx={{ color: palette.purple, fontSize: '1.4rem', fontWeight: 800, fontFamily: 'monospace' }}>
                  {user.stWrfBalance.toLocaleString()}
                </Typography>
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                  <Typography variant="caption" sx={{ color: palette.textSecondary }}>
                    Value: {user.stWrfValueInWrf.toLocaleString()} WRF
                  </Typography>
                  <Chip
                    label={`+${user.totalRewardsEarned.toFixed(2)} WRF earned`}
                    size="small"
                    sx={{ bgcolor: `${palette.success}1a`, color: palette.success, fontWeight: 600, fontSize: '0.65rem' }}
                  />
                </Stack>
              </Paper>
            </Stack>

            <Divider sx={{ borderColor: palette.border, my: 3 }} />

            {/* Protocol Info */}
            <Typography variant="subtitle2" sx={{ color: palette.text, fontWeight: 700, mb: 1.5 }}>
              Protocol Info
            </Typography>
            <Stack spacing={1.5}>
              {[
                { icon: <FeeIcon sx={{ fontSize: 16 }} />, label: 'Protocol Fee', value: `${protocol.feeRate}%` },
                { icon: <LockIcon sx={{ fontSize: 16 }} />, label: 'Minimum Stake', value: `${protocol.minStake} WRF` },
                { icon: <ScheduleIcon sx={{ fontSize: 16 }} />, label: 'Rewards Distribution', value: protocol.rewardsDistribution },
                { icon: <ValidatorsIcon sx={{ fontSize: 16 }} />, label: 'Validators Backing', value: `${protocol.activeValidators} active` },
              ].map((item, i) => (
                <Stack key={i} direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ color: palette.textSecondary }}>{item.icon}</Box>
                    <Typography variant="body2" sx={{ color: palette.textSecondary }}>{item.label}</Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ color: palette.text, fontWeight: 600, fontFamily: 'monospace', fontSize: '0.85rem', textAlign: 'right', maxWidth: '50%' }}>
                    {item.value}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Box>

      {/* Exchange Rate Chart */}
      <Card sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <TimelineIcon sx={{ color: palette.purple }} />
            <Typography variant="h6" sx={{ color: palette.text, fontWeight: 700 }}>
              Exchange Rate History (WRF per stWRF)
            </Typography>
          </Stack>
          <Box sx={{ height: 280 }}>
            <Line data={exchangeChartData} options={exchangeChartOptions} />
          </Box>
        </CardContent>
      </Card>

      {/* Withdrawal Queue */}
      <Card sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <ScheduleIcon sx={{ color: palette.warning }} />
            <Typography variant="h6" sx={{ color: palette.text, fontWeight: 700 }}>
              Withdrawal Queue
            </Typography>
          </Stack>
          <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Request ID', 'Amount (stWRF)', 'Status', 'Requested', 'Est. Completion', 'WRF Received'].map(h => (
                    <TableCell key={h} sx={{ color: palette.textSecondary, borderBottom: `1px solid ${palette.border}`, fontWeight: 600, fontSize: '0.75rem' }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {withdrawals.map((w) => {
                  const statusConf = STATUS_CONFIG[w.status];
                  return (
                    <TableRow key={w.id} sx={{ '&:hover': { bgcolor: `${palette.primary}08` } }}>
                      <TableCell sx={{ color: palette.text, fontFamily: 'monospace', fontSize: '0.8rem', borderBottom: `1px solid ${palette.border}` }}>
                        {w.id}
                      </TableCell>
                      <TableCell sx={{ color: palette.text, fontFamily: 'monospace', fontWeight: 600, fontSize: '0.85rem', borderBottom: `1px solid ${palette.border}` }}>
                        {w.amount.toLocaleString()}
                      </TableCell>
                      <TableCell sx={{ borderBottom: `1px solid ${palette.border}` }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Chip
                            label={statusConf.label}
                            size="small"
                            sx={{ bgcolor: `${statusConf.color}1a`, color: statusConf.color, fontWeight: 600, fontSize: '0.65rem', border: `1px solid ${statusConf.color}33` }}
                          />
                          {w.status === 'claimable' && (
                            <Button size="small" variant="outlined" sx={{ color: palette.success, borderColor: palette.success, textTransform: 'none', fontWeight: 600, fontSize: '0.7rem', py: 0, minHeight: 24, '&:hover': { bgcolor: `${palette.success}15`, borderColor: palette.success } }}>
                              Claim
                            </Button>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ color: palette.textSecondary, fontSize: '0.8rem', borderBottom: `1px solid ${palette.border}` }}>
                        {new Date(w.requestDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell sx={{ color: palette.textSecondary, fontSize: '0.8rem', borderBottom: `1px solid ${palette.border}` }}>
                        {new Date(w.estimatedCompletion).toLocaleDateString()}
                      </TableCell>
                      <TableCell sx={{ color: w.wrfReceived ? palette.success : palette.textSecondary, fontFamily: 'monospace', fontWeight: 600, fontSize: '0.85rem', borderBottom: `1px solid ${palette.border}` }}>
                        {w.wrfReceived ? `${w.wrfReceived.toLocaleString()} WRF` : '--'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Stake Preflight Simulation */}
      <WrfPreflightSimulation
        open={showStakeSimulation}
        title="Stake WRF Tokens"
        severity="medium"
        stateTransitions={[
          { field: 'WRF Balance', currentValue: user.wrfBalance.toLocaleString(), expectedValue: (user.wrfBalance - stakeValue).toLocaleString(), direction: 'decrease' },
          { field: 'stWRF Balance', currentValue: user.stWrfBalance.toLocaleString(), expectedValue: (user.stWrfBalance + estimatedStWrf).toFixed(4), direction: 'increase' },
          { field: 'Exchange Rate', currentValue: `1 WRF = ${(1 / protocol.exchangeRate).toFixed(4)} stWRF`, expectedValue: `1 WRF = ${(1 / protocol.exchangeRate).toFixed(4)} stWRF`, direction: 'unchanged' },
        ]}
        preflightChecks={preflightChecks}
        riskFactors={[
          { label: 'Protocol Fee', severity: 'low', description: `A ${protocol.feeRate}% protocol fee applies to staking operations.` },
        ]}
        confidence={85}
        onConfirm={() => {
          setShowStakeSimulation(false);
          setStakeAmount('');
        }}
        onCancel={() => setShowStakeSimulation(false)}
      />

      {/* Unstake Preflight Simulation */}
      <WrfPreflightSimulation
        open={showUnstakeSimulation}
        title="Unstake stWRF Tokens"
        severity="high"
        stateTransitions={[
          { field: 'stWRF Balance', currentValue: user.stWrfBalance.toLocaleString(), expectedValue: (user.stWrfBalance - unstakeValue).toLocaleString(), direction: 'decrease' },
          { field: 'WRF Received (est.)', currentValue: '0', expectedValue: estimatedWrf.toFixed(4), direction: 'increase' },
        ]}
        preflightChecks={preflightChecks}
        riskFactors={[
          { label: 'Unbonding Period', severity: 'medium', description: 'Unstaked tokens are locked for approximately 3 days before they can be claimed.' },
          { label: 'Protocol Fee', severity: 'low', description: `A ${protocol.feeRate}% protocol fee applies to unstaking operations.` },
          { label: 'Exchange Rate Risk', severity: 'medium', description: 'The final WRF amount may vary based on exchange rate changes during the unbonding period.' },
        ]}
        confidence={78}
        onConfirm={() => {
          setShowUnstakeSimulation(false);
          setUnstakeAmount('');
        }}
        onCancel={() => setShowUnstakeSimulation(false)}
      />
    </Box>
  );
};

const LiquidStakingDashboard: React.FC = () => {
  const { capabilities, loading, error } = useCapabilitiesContext();
  const status = capabilities?.features?.liquidStaking?.status;
  // Do not mount the read effects or staking simulation inputs on weaker,
  // missing or cached-after-error capability evidence.
  if (loading || error || (status !== 'operational' && status !== 'degraded')) {
    return <PublicViewerNotice reason="not-live" />;
  }
  return <LiquidStakingBody />;
};

export default LiquidStakingDashboard;
