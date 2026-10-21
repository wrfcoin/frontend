import DemoSurfaceGate from '../common/DemoSurfaceGate';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  TextField,
  Button,
  IconButton,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Divider,
  LinearProgress,
  CircularProgress,
} from '@mui/material';
import { apiClient } from '../../services/apiClient';
import {
  SwapVert as SwapVertIcon,
  TrendingUp as TrendingUpIcon,
  ArrowForward as ArrowIcon,
  Schedule as ScheduleIcon,
  Info as InfoIcon,
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
};

const fontMono = '"JetBrains Mono", "Fira Code", monospace';
const fontUI = '"Inter", "Segoe UI", sans-serif';

// --- Types ---

interface Token {
  symbol: string;
  name: string;
  balance: number;
  price: number;
  color: string;
}

interface RecentSwap {
  id: string;
  fromToken: string;
  toToken: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  priceImpact: number;
  timestamp: string;
  txHash: string;
}

interface RouteHop {
  from: string;
  to: string;
  pool: string;
  fee: string;
}

// --- Mock Data ---

const TOKENS: Record<string, Token> = {
  WRF: { symbol: 'WRF', name: 'WRFCoin', balance: 4_820, price: 0.30, color: palette.primary },
  USDC: { symbol: 'USDC', name: 'USD Coin', balance: 1_245.50, price: 1.00, color: palette.success },
  ETH: { symbol: 'ETH', name: 'Ethereum', balance: 0.45, price: 3_200.00, color: palette.purple },
  stWRF: { symbol: 'stWRF', name: 'Staked WRF', balance: 17_745.12, price: 0.313, color: palette.cyan },
  CARBON: { symbol: 'CARBON', name: 'Carbon Credit', balance: 320, price: 0.85, color: palette.warning },
};

interface PricePoint {
  timestamp: string;
  price: number;
}

const EMPTY_PRICE_HISTORY = { labels: [] as string[], values: [] as number[] };

// --- Main Component ---

const SwapInterfaceSample: React.FC = () => {
  const [fromToken, setFromToken] = useState('WRF');
  const [toToken, setToToken] = useState('USDC');
  const [fromAmount, setFromAmount] = useState('1000');
  const [recentSwaps, setRecentSwaps] = useState<RecentSwap[]>([]);
  const [priceHistory, setPriceHistory] = useState(EMPTY_PRICE_HISTORY);
  const [swapsLoading, setSwapsLoading] = useState(true);

  const fetchRecentData = useCallback(async () => {
    setSwapsLoading(true);
    const [swapsRes, historyRes] = await Promise.allSettled([
      apiClient.get<RecentSwap[]>('/defi/swaps/recent?limit=10'),
      apiClient.get<PricePoint[]>(`/defi/price-history?from=${fromToken}&to=${toToken}&hours=24`),
    ]);
    if (swapsRes.status === 'fulfilled' && swapsRes.value) setRecentSwaps(swapsRes.value);
    if (historyRes.status === 'fulfilled' && historyRes.value) {
      const pts = historyRes.value;
      setPriceHistory({
        labels: pts.map((p) => new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
        values: pts.map((p) => p.price),
      });
    }
    setSwapsLoading(false);
  }, [fromToken, toToken]);

  useEffect(() => { fetchRecentData(); }, [fetchRecentData]);

  const from = TOKENS[fromToken];
  const to = TOKENS[toToken];

  const exchangeRate = useMemo(() => {
    if (!from || !to || to.price === 0) return 0;
    return from.price / to.price;
  }, [from, to]);

  const toAmount = useMemo(() => {
    const amt = parseFloat(fromAmount);
    if (isNaN(amt)) return 0;
    return amt * exchangeRate;
  }, [fromAmount, exchangeRate]);

  const priceImpact = useMemo(() => {
    const amt = parseFloat(fromAmount);
    if (isNaN(amt)) return 0;
    return Math.min(amt * 0.00012, 5.0);
  }, [fromAmount]);

  const route: RouteHop[] = useMemo(() => {
    if (fromToken === toToken) return [];
    if (fromToken === 'WRF' && toToken === 'USDC') {
      return [{ from: 'WRF', to: 'USDC', pool: 'WRF/USDC', fee: '0.3%' }];
    }
    if (fromToken === 'ETH' && toToken === 'WRF') {
      return [{ from: 'ETH', to: 'WRF', pool: 'WRF/ETH', fee: '0.3%' }];
    }
    return [
      { from: fromToken, to: 'WRF', pool: `${fromToken}/WRF`, fee: '0.3%' },
      { from: 'WRF', to: toToken, pool: `WRF/${toToken}`, fee: '0.3%' },
    ];
  }, [fromToken, toToken]);

  const handleFlip = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount.toFixed(4));
  };

  const chartData = useMemo(
    () => ({
      labels: priceHistory.labels,
      datasets: [
        {
          label: `${fromToken}/${toToken}`,
          data: priceHistory.values,
          borderColor: palette.primary,
          backgroundColor: `${palette.primary}15`,
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 4,
          borderWidth: 2,
        },
      ],
    }),
    [fromToken, toToken, priceHistory],
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
          bodyFont: { family: fontMono },
        },
      },
      scales: {
        x: {
          ticks: { color: palette.textSecondary, font: { family: fontUI, size: 10 }, maxTicksLimit: 8 },
          grid: { color: `${palette.border}40` },
        },
        y: {
          ticks: { color: palette.textSecondary, font: { family: fontMono, size: 10 } },
          grid: { color: `${palette.border}40` },
        },
      },
    }),
    [],
  );

  const tokenOptions = Object.keys(TOKENS);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffH = Math.round((now.getTime() - d.getTime()) / 3_600_000);
    if (diffH < 1) return 'Just now';
    if (diffH < 24) return `${diffH}h ago`;
    return `${Math.round(diffH / 24)}d ago`;
  };

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
        {/* Swap Card */}
        <Card sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 3, flex: 1, p: 3 }}>
          <Typography sx={{ color: palette.text, fontFamily: fontUI, fontWeight: 600, fontSize: '1rem', mb: 2 }}>
            Swap Tokens
          </Typography>

          {/* From */}
          <Box sx={{ p: 2, bgcolor: palette.bg, borderRadius: 2, border: `1px solid ${palette.border}`, mb: 1 }}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography sx={{ color: palette.textSecondary, fontFamily: fontUI, fontSize: '0.75rem' }}>From</Typography>
              <Typography
                sx={{ color: palette.textSecondary, fontFamily: fontMono, fontSize: '0.72rem', cursor: 'pointer', '&:hover': { color: palette.primary } }}
                onClick={() => setFromAmount(from.balance.toString())}
              >
                Balance: {from.balance.toLocaleString()}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                variant="standard"
                placeholder="0.0"
                slotProps={{
                  input: {
                    disableUnderline: true,
                    sx: { color: palette.text, fontFamily: fontMono, fontSize: '1.5rem', fontWeight: 600 },
                  },
                }}
                sx={{ flex: 1 }}
              />
              <Select
                value={fromToken}
                onChange={(e) => setFromToken(e.target.value)}
                variant="standard"
                disableUnderline
                sx={{
                  color: palette.text,
                  fontFamily: fontMono,
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  bgcolor: `${palette.primary}15`,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  '& .MuiSelect-icon': { color: palette.textSecondary },
                }}
              >
                {tokenOptions.map((t) => (
                  <MenuItem key={t} value={t} sx={{ fontFamily: fontMono }}>
                    {t}
                  </MenuItem>
                ))}
              </Select>
            </Stack>
            <Typography sx={{ color: palette.textSecondary, fontFamily: fontMono, fontSize: '0.72rem', mt: 0.5 }}>
              ~${(parseFloat(fromAmount || '0') * from.price).toFixed(2)}
            </Typography>
          </Box>

          {/* Flip Button */}
          <Stack alignItems="center" sx={{ my: -1, zIndex: 1, position: 'relative' }}>
            <IconButton
              onClick={handleFlip}
              sx={{
                bgcolor: palette.card,
                border: `2px solid ${palette.border}`,
                color: palette.primary,
                '&:hover': { bgcolor: `${palette.primary}15`, borderColor: palette.primary },
              }}
            >
              <SwapVertIcon />
            </IconButton>
          </Stack>

          {/* To */}
          <Box sx={{ p: 2, bgcolor: palette.bg, borderRadius: 2, border: `1px solid ${palette.border}`, mb: 2 }}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography sx={{ color: palette.textSecondary, fontFamily: fontUI, fontSize: '0.75rem' }}>To (estimated)</Typography>
              <Typography sx={{ color: palette.textSecondary, fontFamily: fontMono, fontSize: '0.72rem' }}>
                Balance: {to.balance.toLocaleString()}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography sx={{ color: palette.text, fontFamily: fontMono, fontSize: '1.5rem', fontWeight: 600, flex: 1 }}>
                {toAmount > 0 ? toAmount.toFixed(4) : '0.0'}
              </Typography>
              <Select
                value={toToken}
                onChange={(e) => setToToken(e.target.value)}
                variant="standard"
                disableUnderline
                sx={{
                  color: palette.text,
                  fontFamily: fontMono,
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  bgcolor: `${palette.primary}15`,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  '& .MuiSelect-icon': { color: palette.textSecondary },
                }}
              >
                {tokenOptions.map((t) => (
                  <MenuItem key={t} value={t} sx={{ fontFamily: fontMono }}>
                    {t}
                  </MenuItem>
                ))}
              </Select>
            </Stack>
            <Typography sx={{ color: palette.textSecondary, fontFamily: fontMono, fontSize: '0.72rem', mt: 0.5 }}>
              ~${(toAmount * to.price).toFixed(2)}
            </Typography>
          </Box>

          {/* Swap Details */}
          <Box sx={{ p: 2, borderRadius: 2, border: `1px solid ${palette.border}`, mb: 2 }}>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ color: palette.textSecondary, fontFamily: fontUI, fontSize: '0.78rem' }}>Exchange Rate</Typography>
                <Typography sx={{ color: palette.text, fontFamily: fontMono, fontSize: '0.78rem' }}>
                  1 {fromToken} = {exchangeRate.toFixed(6)} {toToken}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ color: palette.textSecondary, fontFamily: fontUI, fontSize: '0.78rem' }}>Price Impact</Typography>
                <Typography
                  sx={{
                    color: priceImpact > 1 ? palette.warning : priceImpact > 3 ? palette.error : palette.success,
                    fontFamily: fontMono,
                    fontSize: '0.78rem',
                  }}
                >
                  {priceImpact.toFixed(2)}%
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ color: palette.textSecondary, fontFamily: fontUI, fontSize: '0.78rem' }}>Network Fee</Typography>
                <Typography sx={{ color: palette.textSecondary, fontFamily: fontMono, fontSize: '0.78rem' }}>~$0.12</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ color: palette.textSecondary, fontFamily: fontUI, fontSize: '0.78rem' }}>Min. Received</Typography>
                <Typography sx={{ color: palette.text, fontFamily: fontMono, fontSize: '0.78rem' }}>
                  {(toAmount * 0.995).toFixed(4)} {toToken}
                </Typography>
              </Stack>
            </Stack>
          </Box>

          {/* Route Visualization */}
          {route.length > 0 && (
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: `${palette.primary}08`, border: `1px solid ${palette.primary}20`, mb: 2 }}>
              <Typography sx={{ color: palette.textSecondary, fontFamily: fontUI, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.5, mb: 1 }}>
                Swap Route
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                {route.map((hop, idx) => (
                  <React.Fragment key={idx}>
                    {idx === 0 && (
                      <Chip label={hop.from} size="small" sx={{ bgcolor: `${palette.primary}20`, color: palette.text, fontFamily: fontMono, fontWeight: 600, fontSize: '0.72rem' }} />
                    )}
                    <Stack alignItems="center" spacing={0.25}>
                      <ArrowIcon sx={{ color: palette.primary, fontSize: 16 }} />
                      <Typography sx={{ color: palette.textSecondary, fontFamily: fontMono, fontSize: '0.6rem' }}>{hop.fee}</Typography>
                    </Stack>
                    <Chip label={hop.to} size="small" sx={{ bgcolor: `${palette.primary}20`, color: palette.text, fontFamily: fontMono, fontWeight: 600, fontSize: '0.72rem' }} />
                  </React.Fragment>
                ))}
              </Stack>
            </Box>
          )}

          {/* Swap Button */}
          <Button
            fullWidth
            variant="contained"
            size="large"
            sx={{
              bgcolor: palette.primary,
              color: palette.text,
              fontFamily: fontUI,
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '1rem',
              py: 1.5,
              borderRadius: 2,
              '&:hover': { bgcolor: '#2563EB' },
            }}
          >
            Swap {fromToken} for {toToken}
          </Button>
        </Card>

        {/* Price Chart */}
        <Card sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 3, flex: 1, p: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Box>
              <Typography sx={{ color: palette.text, fontFamily: fontUI, fontWeight: 600, fontSize: '1rem' }}>
                {fromToken}/{toToken} Price
              </Typography>
              <Typography sx={{ color: palette.textSecondary, fontFamily: fontUI, fontSize: '0.8rem' }}>
                24h chart
              </Typography>
            </Box>
            <Stack alignItems="flex-end">
              <Typography sx={{ color: palette.text, fontFamily: fontMono, fontWeight: 700, fontSize: '1.25rem' }}>
                {exchangeRate.toFixed(6)}
              </Typography>
              <Chip
                size="small"
                label="+2.4%"
                icon={<TrendingUpIcon sx={{ fontSize: 14 }} />}
                sx={{
                  bgcolor: `${palette.success}20`,
                  color: palette.success,
                  fontFamily: fontMono,
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: 22,
                  '& .MuiChip-icon': { color: 'inherit' },
                }}
              />
            </Stack>
          </Stack>
          <Box sx={{ height: 300 }}>
            <Line data={chartData} options={chartOptions} />
          </Box>

          {/* Quick Stats */}
          <Divider sx={{ borderColor: palette.border, my: 2 }} />
          <Stack direction="row" justifyContent="space-around">
            {[
              { label: '24h High', value: '0.3142' },
              { label: '24h Low', value: '0.2801' },
              { label: '24h Volume', value: '$482K' },
              { label: 'Liquidity', value: '$2.4M' },
            ].map((s) => (
              <Box key={s.label} sx={{ textAlign: 'center' }}>
                <Typography sx={{ color: palette.textSecondary, fontFamily: fontUI, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {s.label}
                </Typography>
                <Typography sx={{ color: palette.text, fontFamily: fontMono, fontWeight: 600, fontSize: '0.85rem' }}>
                  {s.value}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Card>
      </Stack>

      {/* Recent Swaps */}
      <Card sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 3 }}>
        <Box sx={{ p: 2.5, pb: 0 }}>
          <Typography sx={{ color: palette.text, fontFamily: fontUI, fontWeight: 600, fontSize: '1rem' }}>
            Recent Swaps
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {['Pair', 'From', 'To', 'Rate', 'Price Impact', 'Time', 'Tx'].map((h) => (
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
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {swapsLoading ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 3, borderColor: palette.border }}>
                    <CircularProgress size={24} sx={{ color: palette.primary }} />
                  </TableCell>
                </TableRow>
              ) : recentSwaps.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 3, color: palette.textSecondary, fontFamily: fontUI, borderColor: palette.border }}>
                    No recent swaps
                  </TableCell>
                </TableRow>
              ) : recentSwaps.map((swap) => (
                <TableRow key={swap.id} sx={{ '& td': { borderColor: palette.border } }}>
                  <TableCell>
                    <Chip
                      label={`${swap.fromToken} > ${swap.toToken}`}
                      size="small"
                      sx={{ bgcolor: `${palette.primary}15`, color: palette.text, fontFamily: fontMono, fontSize: '0.72rem' }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: palette.text, fontFamily: fontMono, fontSize: '0.8rem' }}>
                    {swap.fromAmount.toLocaleString()} {swap.fromToken}
                  </TableCell>
                  <TableCell sx={{ color: palette.success, fontFamily: fontMono, fontSize: '0.8rem' }}>
                    {swap.toAmount.toLocaleString()} {swap.toToken}
                  </TableCell>
                  <TableCell sx={{ color: palette.textSecondary, fontFamily: fontMono, fontSize: '0.78rem' }}>
                    {swap.rate}
                  </TableCell>
                  <TableCell>
                    <Typography
                      sx={{
                        color: swap.priceImpact > 0.2 ? palette.warning : palette.success,
                        fontFamily: fontMono,
                        fontSize: '0.78rem',
                      }}
                    >
                      {swap.priceImpact}%
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ color: palette.textSecondary, fontFamily: fontUI, fontSize: '0.78rem' }}>
                    {formatTime(swap.timestamp)}
                  </TableCell>
                  <TableCell sx={{ color: palette.primary, fontFamily: fontMono, fontSize: '0.72rem' }}>
                    {swap.txHash}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Stack>
  );
};

const SwapInterface: React.FC = () => (
  <DemoSurfaceGate
    title="Swaps are not live yet"
    description="Verified token balances, market prices and swap execution are unavailable. The swap preview uses illustrative values."
    testId="defi-swap"
  >
    <SwapInterfaceSample />
  </DemoSurfaceGate>
);

export default SwapInterface;
