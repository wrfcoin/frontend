import DemoSurfaceGate from '../common/DemoSurfaceGate';
import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Select,
  MenuItem,
  TextField,
  Divider,
  Tooltip,
  InputAdornment,
  FormControl,
  InputLabel,
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import BoltIcon from '@mui/icons-material/Bolt';
import ShieldIcon from '@mui/icons-material/Shield';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import StarIcon from '@mui/icons-material/Star';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import RouteIcon from '@mui/icons-material/Route';
import WrfCard from '../ui/WrfCard';
import WrfButton from '../ui/WrfButton';
import WrfBadge from '../ui/WrfBadge';
import WrfStatCard from '../ui/WrfStatCard';
import { colors, borderRadius, spacing } from '../ui/tokens';
import { apiClient } from '../../services/apiClient';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHAINS = [
  { id: 'ethereum', name: 'Ethereum', color: '#627EEA', symbol: 'ETH' },
  { id: 'polygon', name: 'Polygon', color: '#8247E5', symbol: 'MATIC' },
  { id: 'bsc', name: 'BSC', color: '#F3BA2F', symbol: 'BNB' },
  { id: 'avalanche', name: 'Avalanche', color: '#E84142', symbol: 'AVAX' },
  { id: 'cosmos', name: 'Cosmos', color: '#2E3148', symbol: 'ATOM' },
  { id: 'polkadot', name: 'Polkadot', color: '#E6007A', symbol: 'DOT' },
  { id: 'solana', name: 'Solana', color: '#14F195', symbol: 'SOL' },
];

const TOKENS = ['WRF', 'USDC', 'USDT', 'ETH', 'WBTC', 'DAI'];

interface RouteOption {
  protocol: string;
  fee: number;
  feeUsd: number;
  time: number;
  timeLabel: string;
  securityScore: number;
  liquidity: number;
  isBestPrice: boolean;
  isFastest: boolean;
  gasEstimate: number;
  bridgeFee: number;
  protocolFee: number;
  slippage: number;
  sparkline: number[];
}

// (MOCK_ROUTES removed — routes fetched from API)

// ---------------------------------------------------------------------------
// Sparkline SVG
// ---------------------------------------------------------------------------

const MiniSparkline: React.FC<{ data: number[]; color: string; width?: number; height?: number }> = ({
  data,
  color,
  width = 100,
  height = 28,
}) => {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);

  const points = data
    .map((val, i) => `${i * stepX},${height - ((val - min) / range) * height}`)
    .join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#spark-${color.replace('#', '')})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Security Bar
// ---------------------------------------------------------------------------

const SecurityBar: React.FC<{ score: number }> = ({ score }) => {
  const barColor =
    score >= 90 ? colors.success.main : score >= 80 ? colors.warning.main : colors.error.main;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box
        sx={{
          flex: 1,
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.bg.tertiary,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            width: `${score}%`,
            height: '100%',
            borderRadius: 3,
            backgroundColor: barColor,
            transition: 'width 0.3s ease',
          }}
        />
      </Box>
      <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: barColor, minWidth: 32 }}>
        {score}%
      </Typography>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const BridgeRouteOptimizerSample: React.FC = () => {
  const [sourceChain, setSourceChain] = useState('ethereum');
  const [destChain, setDestChain] = useState('polygon');
  const [token, setToken] = useState('WRF');
  const [amount, setAmount] = useState('1000');
  const [sortBy, setSortBy] = useState<'fee' | 'time' | 'security'>('fee');
  const [routes, setRoutes] = useState<RouteOption[]>([]);

  useEffect(() => {
    apiClient.get<RouteOption[]>(
      `/bridge/routes?from=${sourceChain}&to=${destChain}&token=${token}&amount=${amount}`,
    )
      .then((data) => { if (data) setRoutes(data); })
      .catch(() => { /* keep empty */ });
  }, [sourceChain, destChain, token, amount]);

  const sourceChainData = CHAINS.find((c) => c.id === sourceChain);
  const destChainData = CHAINS.find((c) => c.id === destChain);

  const sortedRoutes = useMemo(() => {
    const sorted = [...routes];
    if (sortBy === 'fee') sorted.sort((a, b) => a.feeUsd - b.feeUsd);
    else if (sortBy === 'time') sorted.sort((a, b) => a.time - b.time);
    else sorted.sort((a, b) => b.securityScore - a.securityScore);
    return sorted;
  }, [routes, sortBy]);

  const bestPrice = useMemo(
    () => routes.length > 0 ? Math.min(...routes.map((r) => r.feeUsd)) : 0,
    [routes],
  );
  const fastestTime = useMemo(
    () => routes.length > 0 ? Math.min(...routes.map((r) => r.time)) : 0,
    [routes],
  );

  const handleSwapChains = () => {
    setSourceChain(destChain);
    setDestChain(sourceChain);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.bg.primary, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <RouteIcon sx={{ color: colors.brand.primary, fontSize: 32 }} />
        <Box>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text.primary }}>
            Bridge Route Optimizer
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: colors.text.secondary }}>
            Compare cross-chain routes across protocols for optimal fees, speed, and security
          </Typography>
        </Box>
      </Box>

      {/* Stats Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Best Route Fee"
            value={`$${bestPrice.toFixed(2)}`}
            trend={-12.4}
            trendLabel="vs last hour"
            icon={LocalGasStationIcon}
            color={colors.success.main}
            sparklineData={[5.2, 4.9, 5.1, 4.7, 4.5, 4.8, 4.6, 4.3, 4.5, 4.2, 4.0, 4.0]}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Fastest Route"
            value={`${Math.round(fastestTime / 60)} min`}
            trend={-8.2}
            trendLabel="vs avg"
            icon={BoltIcon}
            color={colors.brand.primary}
            sparklineData={[3.5, 3.2, 3.8, 2.9, 3.1, 2.8, 3.0, 2.5, 2.7, 2.4, 2.3, 2.0]}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Active Protocols"
            value="6"
            trend={2}
            trendLabel="new this month"
            icon={CompareArrowsIcon}
            color="#8B5CF6"
            sparklineData={[4, 4, 4, 5, 5, 5, 5, 5, 6, 6, 6, 6]}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Total Liquidity"
            value="$260M"
            trend={5.7}
            trendLabel="24h"
            icon={WaterDropIcon}
            color={colors.warning.main}
            sparklineData={[240, 242, 248, 245, 250, 253, 249, 255, 258, 254, 257, 260]}
          />
        </Grid>
      </Grid>

      {/* Transfer Form */}
      <WrfCard title="Transfer Configuration" sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel
                sx={{ color: colors.text.secondary, '&.Mui-focused': { color: colors.brand.primary } }}
              >
                Source Chain
              </InputLabel>
              <Select
                value={sourceChain}
                onChange={(e) => setSourceChain(e.target.value)}
                label="Source Chain"
                sx={{
                  color: colors.text.primary,
                  '.MuiOutlinedInput-notchedOutline': { borderColor: colors.border.default },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.border.light },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.brand.primary },
                  '.MuiSvgIcon-root': { color: colors.text.secondary },
                }}
              >
                {CHAINS.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: c.color }} />
                      {c.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 1 }} sx={{ display: 'flex', justifyContent: 'center' }}>
            <WrfButton variant="ghost" size="sm" onClick={handleSwapChains}>
              <SwapHorizIcon sx={{ fontSize: 24 }} />
            </WrfButton>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel
                sx={{ color: colors.text.secondary, '&.Mui-focused': { color: colors.brand.primary } }}
              >
                Destination Chain
              </InputLabel>
              <Select
                value={destChain}
                onChange={(e) => setDestChain(e.target.value)}
                label="Destination Chain"
                sx={{
                  color: colors.text.primary,
                  '.MuiOutlinedInput-notchedOutline': { borderColor: colors.border.default },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.border.light },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.brand.primary },
                  '.MuiSvgIcon-root': { color: colors.text.secondary },
                }}
              >
                {CHAINS.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: c.color }} />
                      {c.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel
                sx={{ color: colors.text.secondary, '&.Mui-focused': { color: colors.brand.primary } }}
              >
                Token
              </InputLabel>
              <Select
                value={token}
                onChange={(e) => setToken(e.target.value)}
                label="Token"
                sx={{
                  color: colors.text.primary,
                  '.MuiOutlinedInput-notchedOutline': { borderColor: colors.border.default },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.border.light },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.brand.primary },
                  '.MuiSvgIcon-root': { color: colors.text.secondary },
                }}
              >
                {TOKENS.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              label="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Typography sx={{ color: colors.text.muted, fontSize: '0.75rem' }}>
                      {token}
                    </Typography>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: colors.text.primary,
                  '& fieldset': { borderColor: colors.border.default },
                  '&:hover fieldset': { borderColor: colors.border.light },
                  '&.Mui-focused fieldset': { borderColor: colors.brand.primary },
                },
                '& .MuiInputLabel-root': {
                  color: colors.text.secondary,
                  '&.Mui-focused': { color: colors.brand.primary },
                },
              }}
            />
          </Grid>
        </Grid>

        {/* Route direction indicator */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 2, pt: 2, borderTop: `1px solid ${colors.border.default}` }}>
          <Box
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: `${borderRadius.md}px`,
              bgcolor: `${sourceChainData?.color || colors.brand.primary}22`,
              border: `1px solid ${sourceChainData?.color || colors.brand.primary}44`,
            }}
          >
            <Typography sx={{ color: sourceChainData?.color, fontSize: '0.8rem', fontWeight: 600 }}>
              {sourceChainData?.name}
            </Typography>
          </Box>
          <SwapHorizIcon sx={{ color: colors.text.muted, fontSize: 20 }} />
          <Box
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: `${borderRadius.md}px`,
              bgcolor: `${destChainData?.color || colors.brand.primary}22`,
              border: `1px solid ${destChainData?.color || colors.brand.primary}44`,
            }}
          >
            <Typography sx={{ color: destChainData?.color, fontSize: '0.8rem', fontWeight: 600 }}>
              {destChainData?.name}
            </Typography>
          </Box>
          <Typography sx={{ color: colors.text.muted, fontSize: '0.8rem', ml: 1 }}>
            {amount} {token}
          </Typography>
        </Box>
      </WrfCard>

      {/* Sort Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography sx={{ color: colors.text.secondary, fontSize: '0.875rem', mr: 1 }}>
          Sort by:
        </Typography>
        {(['fee', 'time', 'security'] as const).map((s) => (
          <WrfButton
            key={s}
            variant={sortBy === s ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSortBy(s)}
          >
            {s === 'fee' ? 'Lowest Fee' : s === 'time' ? 'Fastest' : 'Most Secure'}
          </WrfButton>
        ))}
      </Box>

      {/* Route Cards */}
      <Grid container spacing={2}>
        {sortedRoutes.map((route, idx) => {
          const isTop = idx === 0;
          return (
            <Grid size={{ xs: 12, md: 6 }} key={route.protocol}>
              <WrfCard
                variant={isTop ? 'elevated' : 'default'}
                sx={{
                  position: 'relative',
                  border: isTop
                    ? `1px solid ${colors.brand.primary}66`
                    : `1px solid ${colors.border.default}`,
                  '&:hover': { borderColor: colors.brand.primary },
                  transition: 'border-color 0.2s ease',
                }}
              >
                {/* Badges */}
                <Box sx={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 0.5 }}>
                  {route.feeUsd === bestPrice && (
                    <WrfBadge status="online" label="Best Price" size="sm" />
                  )}
                  {route.time === fastestTime && (
                    <WrfBadge status="syncing" label="Fastest" size="sm" />
                  )}
                  {isTop && (
                    <Tooltip title="Recommended route based on sort criteria">
                      <Box sx={{ display: 'inline-flex' }}>
                        <StarIcon sx={{ color: colors.warning.main, fontSize: 18 }} />
                      </Box>
                    </Tooltip>
                  )}
                </Box>

                {/* Protocol Name */}
                <Typography sx={{ fontSize: '1.125rem', fontWeight: 700, color: colors.text.primary, mb: 1.5 }}>
                  {route.protocol}
                </Typography>

                {/* Key Metrics Row */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid size={3}>
                    <Typography sx={{ fontSize: '0.65rem', color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                      Total Fee
                    </Typography>
                    <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: colors.text.primary }}>
                      ${route.feeUsd.toFixed(2)}
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted }}>
                      {route.fee}%
                    </Typography>
                  </Grid>
                  <Grid size={3}>
                    <Typography sx={{ fontSize: '0.65rem', color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                      Est. Time
                    </Typography>
                    <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: colors.text.primary }}>
                      {route.timeLabel}
                    </Typography>
                  </Grid>
                  <Grid size={3}>
                    <Typography sx={{ fontSize: '0.65rem', color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                      Security
                    </Typography>
                    <SecurityBar score={route.securityScore} />
                  </Grid>
                  <Grid size={3}>
                    <Typography sx={{ fontSize: '0.65rem', color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                      Liquidity
                    </Typography>
                    <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: colors.text.primary }}>
                      ${(route.liquidity / 1000000).toFixed(0)}M
                    </Typography>
                  </Grid>
                </Grid>

                {/* Fee Sparkline */}
                <Box sx={{ mb: 2 }}>
                  <Typography sx={{ fontSize: '0.65rem', color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                    Fee History (24h)
                  </Typography>
                  <MiniSparkline data={route.sparkline} color={colors.brand.primary} width={280} height={24} />
                </Box>

                {/* Fee Breakdown */}
                <Box
                  sx={{
                    bgcolor: colors.bg.primary,
                    borderRadius: `${borderRadius.md}px`,
                    p: 1.5,
                    mb: 2,
                  }}
                >
                  <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
                    Fee Breakdown
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontSize: '0.8rem', color: colors.text.secondary }}>
                      Gas Estimate
                    </Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: colors.text.primary, fontWeight: 500 }}>
                      ${route.gasEstimate.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontSize: '0.8rem', color: colors.text.secondary }}>
                      Bridge Fee
                    </Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: colors.text.primary, fontWeight: 500 }}>
                      ${route.bridgeFee.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontSize: '0.8rem', color: colors.text.secondary }}>
                      Protocol Fee
                    </Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: colors.text.primary, fontWeight: 500 }}>
                      ${route.protocolFee.toFixed(2)}
                    </Typography>
                  </Box>
                  <Divider sx={{ borderColor: colors.border.default, my: 0.5 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '0.8rem', color: colors.text.secondary }}>
                      Max Slippage
                    </Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: colors.warning.main, fontWeight: 600 }}>
                      {route.slippage}%
                    </Typography>
                  </Box>
                </Box>

                {/* Action Button */}
                <WrfButton variant="primary" fullWidth size="md">
                  Bridge via {route.protocol}
                </WrfButton>
              </WrfCard>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

const BridgeRouteOptimizer: React.FC = () => (
  <DemoSurfaceGate
    title="Bridge quotations are not live on the testnet yet"
    description="No verified bridge route quotations are available."
    testId="bridge-optimizer"
  >
    <BridgeRouteOptimizerSample />
  </DemoSurfaceGate>
);

export default BridgeRouteOptimizer;
