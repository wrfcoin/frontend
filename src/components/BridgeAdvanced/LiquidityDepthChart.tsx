import DemoSurfaceGate from '../common/DemoSurfaceGate';
import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import StackedBarChartIcon from '@mui/icons-material/StackedBarChart';
import WrfCard from '../ui/WrfCard';
import WrfStatCard from '../ui/WrfStatCard';
import WrfDataTable from '../ui/WrfDataTable';
import { colors, borderRadius, spacing } from '../ui/tokens';
import { apiClient } from '../../services/apiClient';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ChartTooltip, Legend, Filler);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHAINS = [
  { id: 'ethereum', name: 'Ethereum', color: '#627EEA' },
  { id: 'polygon', name: 'Polygon', color: '#8247E5' },
  { id: 'bsc', name: 'BSC', color: '#F3BA2F' },
  { id: 'avalanche', name: 'Avalanche', color: '#E84142' },
  { id: 'cosmos', name: 'Cosmos', color: '#2E3148' },
  { id: 'polkadot', name: 'Polkadot', color: '#E6007A' },
  { id: 'solana', name: 'Solana', color: '#14F195' },
];

const PROTOCOLS = [
  { name: 'Axelar', color: '#3B82F6' },
  { name: 'LayerZero', color: '#8B5CF6' },
  { name: 'Wormhole', color: '#06B6D4' },
  { name: 'Stargate', color: '#10B981' },
  { name: 'Synapse', color: '#F59E0B' },
  { name: 'Hop', color: '#EC4899' },
];

interface DepthLevel {
  price: number;
  bidVolume: number;
  askVolume: number;
}

// (depth removed — depth data fetched from API)

const PROTOCOL_LIQUIDITY = {
  labels: ['ETH-MATIC', 'ETH-BSC', 'ETH-AVAX', 'MATIC-BSC', 'ETH-SOL', 'ETH-ATOM'],
  axelar: [42, 38, 28, 15, 22, 18],
  layerZero: [38, 35, 32, 12, 28, 0],
  wormhole: [55, 42, 35, 18, 45, 0],
  stargate: [62, 48, 25, 22, 0, 0],
  synapse: [28, 22, 18, 8, 0, 0],
  hop: [35, 30, 0, 20, 0, 0],
};

const LIQUIDITY_OVER_TIME = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  total: [180, 195, 210, 205, 220, 235, 228, 245, 252, 248, 255, 260],
  axelar: [28, 30, 32, 34, 36, 38, 37, 39, 40, 41, 42, 42],
  wormhole: [42, 44, 46, 45, 48, 50, 49, 52, 53, 54, 55, 55],
  stargate: [48, 50, 53, 52, 56, 58, 57, 60, 61, 60, 62, 62],
};

const TOP_LPS = [
  { id: 1, address: '0x7a25...3f8e', pool: 'ETH-MATIC', protocol: 'Stargate', tvl: 4200000, share: 6.8, apy: 12.4, deposited: '2025-08-15' },
  { id: 2, address: '0x3b91...c4d2', pool: 'ETH-MATIC', protocol: 'Wormhole', tvl: 3800000, share: 5.2, apy: 10.8, deposited: '2025-07-22' },
  { id: 3, address: '0x9e44...a1b7', pool: 'ETH-BSC', protocol: 'Axelar', tvl: 3200000, share: 4.5, apy: 14.2, deposited: '2025-09-03' },
  { id: 4, address: '0x1f63...d9e5', pool: 'ETH-SOL', protocol: 'Wormhole', tvl: 2900000, share: 4.1, apy: 16.8, deposited: '2025-10-11' },
  { id: 5, address: '0x5c28...b6f3', pool: 'ETH-AVAX', protocol: 'LayerZero', tvl: 2600000, share: 3.7, apy: 11.5, deposited: '2025-06-28' },
  { id: 6, address: '0x8d72...e0a9', pool: 'MATIC-BSC', protocol: 'Stargate', tvl: 2100000, share: 3.0, apy: 9.2, deposited: '2025-11-14' },
  { id: 7, address: '0x4a15...c7d8', pool: 'ETH-ATOM', protocol: 'Axelar', tvl: 1800000, share: 2.6, apy: 18.4, deposited: '2025-12-01' },
];

// ---------------------------------------------------------------------------
// Chart Options
// ---------------------------------------------------------------------------

const chartBaseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: colors.text.secondary, font: { size: 11 } },
    },
  },
  scales: {
    x: {
      ticks: { color: colors.text.muted, font: { size: 10 } },
      grid: { color: `${colors.border.default}44` },
    },
    y: {
      ticks: { color: colors.text.muted, font: { size: 10 } },
      grid: { color: `${colors.border.default}44` },
    },
  },
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const LiquidityDepthChartSample: React.FC = () => {
  const [sourceChain, setSourceChain] = useState('ethereum');
  const [destChain, setDestChain] = useState('polygon');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('1y');
  const [depth, setDepth] = useState<DepthLevel[]>([]);

  useEffect(() => {
    apiClient.get<DepthLevel[]>(`/bridge/liquidity/depth?from=${sourceChain}&to=${destChain}`)
      .then((data) => { if (data) setDepth(data); })
      .catch(() => { /* keep empty */ });
  }, [sourceChain, destChain]);

  const sourceData = CHAINS.find((c) => c.id === sourceChain);
  const destData = CHAINS.find((c) => c.id === destChain);

  const totalLiquidity = useMemo(() => {
    return depth.reduce((sum, d) => sum + d.bidVolume + d.askVolume, 0);
  }, [depth]);

  const bidTotal = useMemo(
    () => depth.reduce((sum, d) => sum + d.bidVolume, 0),
    [depth],
  );
  const askTotal = useMemo(
    () => depth.reduce((sum, d) => sum + d.askVolume, 0),
    [depth],
  );

  // Depth chart data
  const depthChartData = {
    labels: depth.map((d) => d.price.toFixed(3)),
    datasets: [
      {
        label: 'Bids',
        data: depth.map((d) => d.bidVolume / 1000000),
        backgroundColor: `${colors.success.main}88`,
        borderColor: colors.success.main,
        borderWidth: 1,
        borderRadius: 2,
      },
      {
        label: 'Asks',
        data: depth.map((d) => d.askVolume / 1000000),
        backgroundColor: `${colors.error.main}88`,
        borderColor: colors.error.main,
        borderWidth: 1,
        borderRadius: 2,
      },
    ],
  };

  const depthChartOptions = {
    ...chartBaseOptions,
    plugins: {
      ...chartBaseOptions.plugins,
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: $${ctx.parsed.y.toFixed(2)}M`,
        },
      },
    },
    scales: {
      ...chartBaseOptions.scales,
      y: {
        ...chartBaseOptions.scales.y,
        title: {
          display: true,
          text: 'Volume ($M)',
          color: colors.text.muted,
          font: { size: 10 },
        },
      },
      x: {
        ...chartBaseOptions.scales.x,
        title: {
          display: true,
          text: 'Price Ratio',
          color: colors.text.muted,
          font: { size: 10 },
        },
      },
    },
  };

  // Stacked bar chart for liquidity by protocol
  const stackedBarData = {
    labels: PROTOCOL_LIQUIDITY.labels,
    datasets: PROTOCOLS.map((p) => ({
      label: p.name,
      data: PROTOCOL_LIQUIDITY[p.name.toLowerCase().replace(/\s/g, '') as keyof typeof PROTOCOL_LIQUIDITY] as number[] || [],
      backgroundColor: `${p.color}CC`,
      borderColor: p.color,
      borderWidth: 1,
      borderRadius: 2,
    })),
  };

  const stackedBarOptions = {
    ...chartBaseOptions,
    plugins: {
      ...chartBaseOptions.plugins,
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: $${ctx.parsed.y}M`,
        },
      },
    },
    scales: {
      ...chartBaseOptions.scales,
      x: { ...chartBaseOptions.scales.x, stacked: true },
      y: {
        ...chartBaseOptions.scales.y,
        stacked: true,
        title: {
          display: true,
          text: 'Liquidity ($M)',
          color: colors.text.muted,
          font: { size: 10 },
        },
      },
    },
  };

  // Line chart for liquidity over time
  const lineChartData = {
    labels: LIQUIDITY_OVER_TIME.labels,
    datasets: [
      {
        label: 'Total',
        data: LIQUIDITY_OVER_TIME.total,
        borderColor: colors.brand.primary,
        backgroundColor: `${colors.brand.primary}22`,
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
      {
        label: 'Stargate',
        data: LIQUIDITY_OVER_TIME.stargate,
        borderColor: '#10B981',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderDash: [4, 2],
        tension: 0.3,
        pointRadius: 2,
      },
      {
        label: 'Wormhole',
        data: LIQUIDITY_OVER_TIME.wormhole,
        borderColor: '#06B6D4',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderDash: [4, 2],
        tension: 0.3,
        pointRadius: 2,
      },
      {
        label: 'Axelar',
        data: LIQUIDITY_OVER_TIME.axelar,
        borderColor: '#3B82F6',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderDash: [4, 2],
        tension: 0.3,
        pointRadius: 2,
      },
    ],
  };

  const lineChartOptions = {
    ...chartBaseOptions,
    plugins: {
      ...chartBaseOptions.plugins,
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: $${ctx.parsed.y}M`,
        },
      },
    },
    scales: {
      ...chartBaseOptions.scales,
      y: {
        ...chartBaseOptions.scales.y,
        title: {
          display: true,
          text: 'Liquidity ($M)',
          color: colors.text.muted,
          font: { size: 10 },
        },
      },
    },
  };

  // Table columns
  const lpColumns = [
    { key: 'address', label: 'Address', sortable: true, render: (val: string) => (
      <Typography sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: colors.brand.primary }}>{val}</Typography>
    )},
    { key: 'pool', label: 'Pool', sortable: true },
    { key: 'protocol', label: 'Protocol', sortable: true, render: (val: string) => {
      const proto = PROTOCOLS.find((p) => p.name === val);
      return (
        <Chip
          size="small"
          label={val}
          sx={{
            height: 22,
            bgcolor: `${proto?.color || colors.brand.primary}22`,
            color: proto?.color || colors.brand.primary,
            fontSize: '0.7rem',
            fontWeight: 600,
          }}
        />
      );
    }},
    { key: 'tvl', label: 'TVL', sortable: true, render: (val: number) => (
      <Typography sx={{ fontSize: '0.8rem', color: colors.text.primary, fontWeight: 600 }}>
        ${(val / 1000000).toFixed(2)}M
      </Typography>
    )},
    { key: 'share', label: 'Share %', sortable: true, render: (val: number) => (
      <Typography sx={{ fontSize: '0.8rem', color: colors.text.secondary }}>{val}%</Typography>
    )},
    { key: 'apy', label: 'APY', sortable: true, render: (val: number) => (
      <Typography sx={{ fontSize: '0.8rem', color: colors.success.main, fontWeight: 600 }}>{val}%</Typography>
    )},
    { key: 'deposited', label: 'Since', sortable: true },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.bg.primary, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <WaterDropIcon sx={{ color: '#06B6D4', fontSize: 32 }} />
        <Box>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text.primary }}>
            Liquidity Depth Analysis
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: colors.text.secondary }}>
            Cross-chain liquidity depth, protocol distribution, and LP analytics
          </Typography>
        </Box>
      </Box>

      {/* Chain Pair Selector + Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <WrfCard title="Chain Pair" sx={{ height: '100%' }}>
            <Grid container spacing={2}>
              <Grid size={5}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: colors.text.secondary, '&.Mui-focused': { color: colors.brand.primary } }}>
                    Source
                  </InputLabel>
                  <Select
                    value={sourceChain}
                    onChange={(e) => setSourceChain(e.target.value)}
                    label="Source"
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
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c.color }} />
                          {c.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SwapVertIcon sx={{ color: colors.text.muted }} />
              </Grid>
              <Grid size={5}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: colors.text.secondary, '&.Mui-focused': { color: colors.brand.primary } }}>
                    Dest
                  </InputLabel>
                  <Select
                    value={destChain}
                    onChange={(e) => setDestChain(e.target.value)}
                    label="Dest"
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
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c.color }} />
                          {c.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  px: 1.5,
                  py: 0.5,
                  borderRadius: `${borderRadius.md}px`,
                  bgcolor: `${sourceData?.color}22`,
                  border: `1px solid ${sourceData?.color}44`,
                }}
              >
                <Typography sx={{ color: sourceData?.color, fontSize: '0.75rem', fontWeight: 600 }}>
                  {sourceData?.name}
                </Typography>
              </Box>
              <SwapVertIcon sx={{ color: colors.text.muted, fontSize: 16 }} />
              <Box
                sx={{
                  px: 1.5,
                  py: 0.5,
                  borderRadius: `${borderRadius.md}px`,
                  bgcolor: `${destData?.color}22`,
                  border: `1px solid ${destData?.color}44`,
                }}
              >
                <Typography sx={{ color: destData?.color, fontSize: '0.75rem', fontWeight: 600 }}>
                  {destData?.name}
                </Typography>
              </Box>
            </Box>
          </WrfCard>
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <WrfStatCard
            label="Total Depth"
            value={`$${(totalLiquidity / 1000000).toFixed(0)}M`}
            trend={5.2}
            trendLabel="24h"
            icon={WaterDropIcon}
            color="#06B6D4"
            sparklineData={[120, 125, 128, 130, 127, 132, 135, 133, 138, 140, 137, 142]}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <WrfStatCard
            label="Bid Side"
            value={`$${(bidTotal / 1000000).toFixed(0)}M`}
            trend={3.8}
            trendLabel="24h"
            icon={TrendingUpIcon}
            color={colors.success.main}
            sparklineData={[58, 60, 62, 61, 63, 65, 64, 66, 68, 67, 69, 70]}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <WrfStatCard
            label="Ask Side"
            value={`$${(askTotal / 1000000).toFixed(0)}M`}
            trend={-1.4}
            trendLabel="24h"
            icon={AccountBalanceIcon}
            color={colors.error.main}
            sparklineData={[65, 64, 63, 65, 62, 64, 63, 61, 62, 60, 61, 60]}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <WrfStatCard
            label="Active LPs"
            value="284"
            trend={12}
            trendLabel="this week"
            icon={StackedBarChartIcon}
            color="#8B5CF6"
            sparklineData={[240, 245, 250, 255, 258, 262, 268, 270, 274, 278, 280, 284]}
          />
        </Grid>
      </Grid>

      {/* Depth Chart */}
      <WrfCard title="Liquidity Depth" subtitle={`${sourceData?.name} / ${destData?.name} bridge liquidity book`} sx={{ mb: 3 }}>
        <Box sx={{ height: 320 }}>
          <Bar data={depthChartData} options={depthChartOptions as any} />
        </Box>
      </WrfCard>

      {/* Protocol Breakdown + Liquidity Over Time */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <WrfCard title="Liquidity by Protocol" subtitle="Stacked breakdown across chain pairs">
            <Box sx={{ height: 320 }}>
              <Bar data={stackedBarData} options={stackedBarOptions as any} />
            </Box>
          </WrfCard>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <WrfCard
            title="Liquidity Over Time"
            subtitle="Total and per-protocol liquidity trend"
            action={
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {(['7d', '30d', '90d', '1y'] as const).map((r) => (
                  <Chip
                    key={r}
                    label={r}
                    size="small"
                    onClick={() => setTimeRange(r)}
                    sx={{
                      height: 22,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      bgcolor: timeRange === r ? colors.brand.primary : colors.bg.tertiary,
                      color: timeRange === r ? '#FFFFFF' : colors.text.secondary,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: timeRange === r ? colors.brand.hover : colors.border.light },
                    }}
                  />
                ))}
              </Box>
            }
          >
            <Box sx={{ height: 320 }}>
              <Line data={lineChartData} options={lineChartOptions as any} />
            </Box>
          </WrfCard>
        </Grid>
      </Grid>

      {/* Top LPs Table */}
      <WrfCard title="Top Liquidity Providers" subtitle="Largest LP positions across bridge protocols">
        <WrfDataTable
          columns={lpColumns}
          data={TOP_LPS}
          searchable
          exportable
          pagination
          pageSize={7}
          sx={{ border: 'none' }}
        />
      </WrfCard>
    </Box>
  );
};

const LiquidityDepthChart: React.FC = () => (
  <DemoSurfaceGate
    title="Bridge liquidity is not live on the testnet yet"
    description="No verified bridge liquidity source is available."
    testId="bridge-liquidity"
  >
    <LiquidityDepthChartSample />
  </DemoSurfaceGate>
);

export default LiquidityDepthChart;
