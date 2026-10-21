import DemoSurfaceGate from '../common/DemoSurfaceGate';
import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import { Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PieChartIcon from '@mui/icons-material/PieChart';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import BalanceIcon from '@mui/icons-material/Balance';
import FavoriteIcon from '@mui/icons-material/Favorite';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WrfCard from '../ui/WrfCard';
import WrfStatCard from '../ui/WrfStatCard';
import WrfBadge from '../ui/WrfBadge';
import WrfDataTable from '../ui/WrfDataTable';
import WrfButton from '../ui/WrfButton';
import { colors, borderRadius, spacing } from '../ui/tokens';

ChartJS.register(ArcElement, CategoryScale, LinearScale, LineElement, PointElement, ChartTooltip, Legend, Filler);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

interface ChainInfo {
  id: string;
  name: string;
  color: string;
  health: 'healthy' | 'degraded' | 'down';
  blockTime: string;
  gasPrice: string;
}

const CHAINS: ChainInfo[] = [
  { id: 'ethereum', name: 'Ethereum', color: '#627EEA', health: 'healthy', blockTime: '12s', gasPrice: '24 Gwei' },
  { id: 'polygon', name: 'Polygon', color: '#8247E5', health: 'healthy', blockTime: '2s', gasPrice: '35 Gwei' },
  { id: 'bsc', name: 'BSC', color: '#F3BA2F', health: 'healthy', blockTime: '3s', gasPrice: '5 Gwei' },
  { id: 'avalanche', name: 'Avalanche', color: '#E84142', health: 'degraded', blockTime: '2s', gasPrice: '28 nAVAX' },
  { id: 'cosmos', name: 'Cosmos', color: '#2E3148', health: 'healthy', blockTime: '6s', gasPrice: '0.025 ATOM' },
  { id: 'polkadot', name: 'Polkadot', color: '#E6007A', health: 'healthy', blockTime: '6s', gasPrice: '0.01 DOT' },
  { id: 'solana', name: 'Solana', color: '#14F195', health: 'healthy', blockTime: '0.4s', gasPrice: '0.00025 SOL' },
];

interface Asset {
  id: number;
  token: string;
  chain: string;
  balance: number;
  valueUsd: number;
  priceChange24h: number;
  apy: number;
}

const PORTFOLIO_ASSETS: Asset[] = [
  { id: 1, token: 'WRF', chain: 'ethereum', balance: 125000, valueUsd: 187500, priceChange24h: 4.2, apy: 0 },
  { id: 2, token: 'WRF', chain: 'polygon', balance: 85000, valueUsd: 127500, priceChange24h: 4.2, apy: 12.5 },
  { id: 3, token: 'USDC', chain: 'ethereum', balance: 95000, valueUsd: 95000, priceChange24h: 0.01, apy: 3.8 },
  { id: 4, token: 'ETH', chain: 'ethereum', balance: 28.5, valueUsd: 85500, priceChange24h: 2.8, apy: 4.2 },
  { id: 5, token: 'MATIC', chain: 'polygon', balance: 120000, valueUsd: 72000, priceChange24h: -1.5, apy: 8.4 },
  { id: 6, token: 'WRF', chain: 'bsc', balance: 45000, valueUsd: 67500, priceChange24h: 4.2, apy: 15.2 },
  { id: 7, token: 'BNB', chain: 'bsc', balance: 85, valueUsd: 51000, priceChange24h: 1.2, apy: 6.8 },
  { id: 8, token: 'AVAX', chain: 'avalanche', balance: 1200, valueUsd: 42000, priceChange24h: -2.1, apy: 7.5 },
  { id: 9, token: 'ATOM', chain: 'cosmos', balance: 3500, valueUsd: 35000, priceChange24h: 3.1, apy: 18.2 },
  { id: 10, token: 'SOL', chain: 'solana', balance: 180, valueUsd: 27000, priceChange24h: 5.4, apy: 6.2 },
  { id: 11, token: 'USDT', chain: 'bsc', balance: 22000, valueUsd: 22000, priceChange24h: -0.02, apy: 4.1 },
  { id: 12, token: 'DOT', chain: 'polkadot', balance: 2800, valueUsd: 19600, priceChange24h: -0.8, apy: 14.5 },
];

interface RebalanceSuggestion {
  id: number;
  action: string;
  token: string;
  fromChain: string;
  toChain: string;
  amount: number;
  reason: string;
  savings: string;
  priority: 'high' | 'medium' | 'low';
}

const REBALANCE_SUGGESTIONS: RebalanceSuggestion[] = [
  { id: 1, action: 'Move', token: 'WRF', fromChain: 'ethereum', toChain: 'polygon', amount: 20000, reason: 'Higher yield on Polygon (12.5% vs 0%)', savings: '+$2,500/yr', priority: 'high' },
  { id: 2, action: 'Move', token: 'USDC', fromChain: 'ethereum', toChain: 'bsc', amount: 15000, reason: 'Better LP rewards on BSC', savings: '+$420/yr', priority: 'medium' },
  { id: 3, action: 'Consolidate', token: 'WRF', fromChain: 'bsc', toChain: 'polygon', amount: 10000, reason: 'Reduce fragmentation, increase staking power', savings: '+$180/yr', priority: 'low' },
];

const VALUE_OVER_TIME = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
  total: [580, 620, 590, 640, 680, 710, 695, 740, 780, 760, 810, 850, 880, 931],
  ethereum: [220, 235, 225, 245, 260, 275, 268, 285, 300, 292, 310, 325, 340, 368],
  polygon: [120, 128, 122, 135, 142, 150, 148, 158, 165, 160, 172, 180, 188, 200],
  bsc: [95, 100, 96, 105, 110, 115, 113, 120, 128, 125, 132, 138, 142, 141],
  other: [145, 157, 147, 155, 168, 170, 166, 177, 187, 183, 196, 207, 210, 222],
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const CrossChainPortfolioSample: React.FC = () => {
  const [selectedChain, setSelectedChain] = useState<string | null>(null);

  const totalValue = useMemo(
    () => PORTFOLIO_ASSETS.reduce((sum, a) => sum + a.valueUsd, 0),
    [],
  );

  const chainBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    PORTFOLIO_ASSETS.forEach((a) => {
      breakdown[a.chain] = (breakdown[a.chain] || 0) + a.valueUsd;
    });
    return CHAINS.map((c) => ({
      ...c,
      value: breakdown[c.id] || 0,
      percentage: ((breakdown[c.id] || 0) / totalValue) * 100,
    })).filter((c) => c.value > 0);
  }, [totalValue]);

  const filteredAssets = useMemo(() => {
    if (!selectedChain) return PORTFOLIO_ASSETS;
    return PORTFOLIO_ASSETS.filter((a) => a.chain === selectedChain);
  }, [selectedChain]);

  // Doughnut data
  const doughnutData = {
    labels: chainBreakdown.map((c) => c.name),
    datasets: [
      {
        data: chainBreakdown.map((c) => c.value),
        backgroundColor: chainBreakdown.map((c) => `${c.color}CC`),
        borderColor: chainBreakdown.map((c) => c.color),
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const val = ctx.parsed;
            const pct = ((val / totalValue) * 100).toFixed(1);
            return `$${(val / 1000).toFixed(0)}k (${pct}%)`;
          },
        },
      },
    },
  };

  // Line chart
  const lineData = {
    labels: VALUE_OVER_TIME.labels,
    datasets: [
      {
        label: 'Total Portfolio',
        data: VALUE_OVER_TIME.total,
        borderColor: colors.brand.primary,
        backgroundColor: `${colors.brand.primary}18`,
        borderWidth: 2.5,
        fill: true,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
      {
        label: 'Ethereum',
        data: VALUE_OVER_TIME.ethereum,
        borderColor: '#627EEA',
        borderWidth: 1.5,
        borderDash: [4, 2],
        tension: 0.3,
        pointRadius: 0,
        fill: false,
      },
      {
        label: 'Polygon',
        data: VALUE_OVER_TIME.polygon,
        borderColor: '#8247E5',
        borderWidth: 1.5,
        borderDash: [4, 2],
        tension: 0.3,
        pointRadius: 0,
        fill: false,
      },
      {
        label: 'BSC',
        data: VALUE_OVER_TIME.bsc,
        borderColor: '#F3BA2F',
        borderWidth: 1.5,
        borderDash: [4, 2],
        tension: 0.3,
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: colors.text.secondary, font: { size: 11 } },
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: $${ctx.parsed.y}k`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: colors.text.muted, font: { size: 10 } },
        grid: { color: `${colors.border.default}44` },
      },
      y: {
        ticks: {
          color: colors.text.muted,
          font: { size: 10 },
          callback: (val: any) => `$${val}k`,
        },
        grid: { color: `${colors.border.default}44` },
      },
    },
  };

  // Asset table columns
  const assetColumns = [
    {
      key: 'token',
      label: 'Token',
      sortable: true,
      render: (val: string) => (
        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: colors.text.primary }}>{val}</Typography>
      ),
    },
    {
      key: 'chain',
      label: 'Chain',
      sortable: true,
      render: (val: string) => {
        const chain = CHAINS.find((c) => c.id === val);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: chain?.color }} />
            <Typography sx={{ fontSize: '0.8rem', color: colors.text.secondary }}>{chain?.name}</Typography>
          </Box>
        );
      },
    },
    {
      key: 'balance',
      label: 'Balance',
      sortable: true,
      render: (val: number) => (
        <Typography sx={{ fontSize: '0.8rem', color: colors.text.primary }}>{val.toLocaleString()}</Typography>
      ),
    },
    {
      key: 'valueUsd',
      label: 'Value (USD)',
      sortable: true,
      render: (val: number) => (
        <Typography sx={{ fontSize: '0.8rem', color: colors.text.primary, fontWeight: 600 }}>
          ${val.toLocaleString()}
        </Typography>
      ),
    },
    {
      key: 'priceChange24h',
      label: '24h Change',
      sortable: true,
      render: (val: number) => (
        <Typography
          sx={{
            fontSize: '0.8rem',
            fontWeight: 600,
            color: val >= 0 ? colors.success.main : colors.error.main,
          }}
        >
          {val >= 0 ? '+' : ''}{val.toFixed(2)}%
        </Typography>
      ),
    },
    {
      key: 'apy',
      label: 'APY',
      sortable: true,
      render: (val: number) => (
        <Typography sx={{ fontSize: '0.8rem', color: val > 0 ? colors.success.main : colors.text.muted, fontWeight: val > 0 ? 600 : 400 }}>
          {val > 0 ? `${val}%` : '--'}
        </Typography>
      ),
    },
  ];

  const healthBadgeMap: Record<string, { status: string; label: string }> = {
    healthy: { status: 'online', label: 'Healthy' },
    degraded: { status: 'degraded', label: 'Degraded' },
    down: { status: 'offline', label: 'Down' },
  };

  const priorityColor: Record<string, string> = {
    high: colors.error.main,
    medium: colors.warning.main,
    low: colors.brand.primary,
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.bg.primary, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <AccountBalanceWalletIcon sx={{ color: '#8B5CF6', fontSize: 32 }} />
        <Box>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text.primary }}>
            Cross-Chain Portfolio
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: colors.text.secondary }}>
            Unified view of assets across all connected chains with rebalancing suggestions
          </Typography>
        </Box>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Total Portfolio Value"
            value={`$${(totalValue / 1000).toFixed(0)}k`}
            trend={6.8}
            trendLabel="30d"
            icon={AccountBalanceWalletIcon}
            color="#8B5CF6"
            sparklineData={VALUE_OVER_TIME.total.slice(-12)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Active Chains"
            value={chainBreakdown.length.toString()}
            trend={0}
            icon={PieChartIcon}
            color={colors.brand.primary}
            sparklineData={[5, 5, 5, 6, 6, 6, 7, 7, 7, 7, 7, 7]}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="24h Change"
            value="+$18,420"
            trend={2.4}
            trendLabel="24h"
            icon={TrendingUpIcon}
            color={colors.success.main}
            sparklineData={[910, 918, 915, 922, 928, 925, 930, 935, 928, 932, 938, 931]}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Avg Weighted APY"
            value="8.4%"
            trend={1.2}
            trendLabel="vs last month"
            icon={FavoriteIcon}
            color={colors.warning.main}
            sparklineData={[7.2, 7.5, 7.8, 7.6, 8.0, 8.2, 8.1, 8.3, 8.5, 8.2, 8.4, 8.4]}
          />
        </Grid>
      </Grid>

      {/* Doughnut + Chain Legend */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 5 }}>
          <WrfCard title="Chain Breakdown" sx={{ height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box sx={{ width: 200, height: 200, position: 'relative' }}>
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
                  <Typography sx={{ fontSize: '1.25rem', fontWeight: 800, color: colors.text.primary }}>
                    ${(totalValue / 1000).toFixed(0)}k
                  </Typography>
                  <Typography sx={{ fontSize: '0.65rem', color: colors.text.muted }}>Total Value</Typography>
                </Box>
              </Box>
              <Box sx={{ flex: 1 }}>
                {chainBreakdown.map((c) => (
                  <Box
                    key={c.id}
                    onClick={() => setSelectedChain(selectedChain === c.id ? null : c.id)}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 0.8,
                      px: 1,
                      borderRadius: `${borderRadius.sm}px`,
                      cursor: 'pointer',
                      bgcolor: selectedChain === c.id ? `${c.color}15` : 'transparent',
                      '&:hover': { bgcolor: `${c.color}10` },
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c.color }} />
                      <Typography sx={{ fontSize: '0.8rem', color: colors.text.secondary }}>{c.name}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontSize: '0.8rem', color: colors.text.primary, fontWeight: 600 }}>
                        ${(c.value / 1000).toFixed(0)}k
                      </Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: c.color, fontWeight: 600 }}>
                        {c.percentage.toFixed(1)}%
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </WrfCard>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <WrfCard title="Portfolio Value Over Time" sx={{ height: '100%' }}>
            <Box sx={{ height: 240 }}>
              <Line data={lineData} options={lineOptions as any} />
            </Box>
          </WrfCard>
        </Grid>
      </Grid>

      {/* Asset Table */}
      <WrfCard
        title={selectedChain ? `Assets on ${CHAINS.find((c) => c.id === selectedChain)?.name}` : 'All Assets'}
        action={
          selectedChain && (
            <WrfButton variant="ghost" size="sm" onClick={() => setSelectedChain(null)}>
              Show All Chains
            </WrfButton>
          )
        }
        sx={{ mb: 3 }}
      >
        <WrfDataTable
          columns={assetColumns}
          data={filteredAssets}
          searchable
          exportable
          pagination
          pageSize={8}
          sx={{ border: 'none' }}
        />
      </WrfCard>

      {/* Rebalance Suggestions + Chain Health */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <WrfCard title="Rebalance Suggestions" subtitle="AI-powered portfolio optimization recommendations">
            {REBALANCE_SUGGESTIONS.map((suggestion) => {
              const fromChain = CHAINS.find((c) => c.id === suggestion.fromChain);
              const toChain = CHAINS.find((c) => c.id === suggestion.toChain);
              return (
                <Box
                  key={suggestion.id}
                  sx={{
                    bgcolor: colors.bg.primary,
                    borderRadius: `${borderRadius.lg}px`,
                    border: `1px solid ${colors.border.default}`,
                    p: 2,
                    mb: 1.5,
                    '&:last-child': { mb: 0 },
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        size="small"
                        label={suggestion.priority.toUpperCase()}
                        sx={{
                          height: 20,
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          bgcolor: `${priorityColor[suggestion.priority]}22`,
                          color: priorityColor[suggestion.priority],
                        }}
                      />
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: colors.text.primary }}>
                        {suggestion.action} {suggestion.amount.toLocaleString()} {suggestion.token}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: colors.success.main }}>
                      {suggestion.savings}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: fromChain?.color }} />
                    <Typography sx={{ fontSize: '0.75rem', color: colors.text.secondary }}>{fromChain?.name}</Typography>
                    <SwapHorizIcon sx={{ fontSize: 14, color: colors.text.muted }} />
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: toChain?.color }} />
                    <Typography sx={{ fontSize: '0.75rem', color: colors.text.secondary }}>{toChain?.name}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted, mb: 1.5 }}>
                    {suggestion.reason}
                  </Typography>
                  <WrfButton variant="secondary" size="sm">
                    Execute Rebalance
                  </WrfButton>
                </Box>
              );
            })}
          </WrfCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <WrfCard title="Chain Health Status" subtitle="Real-time network status for connected chains">
            {CHAINS.map((chain) => {
              const badge = healthBadgeMap[chain.health];
              return (
                <Box
                  key={chain.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1.5,
                    borderBottom: `1px solid ${colors.border.default}`,
                    '&:last-child': { borderBottom: 'none' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: chain.color }} />
                    <Box>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: colors.text.primary }}>
                        {chain.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted }}>
                          Block: {chain.blockTime}
                        </Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted }}>
                          Gas: {chain.gasPrice}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <WrfBadge
                    status={badge.status as any}
                    label={badge.label}
                    size="sm"
                    pulse={chain.health === 'healthy'}
                  />
                </Box>
              );
            })}
          </WrfCard>
        </Grid>
      </Grid>
    </Box>
  );
};

const CrossChainPortfolio: React.FC = () => (
  <DemoSurfaceGate
    title="Cross-chain balances are not live on the testnet yet"
    description="No verified cross-chain portfolio balances are available."
    testId="bridge-portfolio"
  >
    <CrossChainPortfolioSample />
  </DemoSurfaceGate>
);

export default CrossChainPortfolio;
