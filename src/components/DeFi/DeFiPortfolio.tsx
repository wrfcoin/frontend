import React, { useState, useMemo, useEffect, useCallback } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { apiClient } from '../../services/apiClient';
import { isAuthRequiredError } from '../../hooks/api/useBackendHealth';
import { ApiError } from '../../utils/apiError';
import PublicViewerNotice from '../common/PublicViewerNotice';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Tabs,
  Tab,
  Chip,
  Divider,
  Avatar,
  AvatarGroup,
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Savings as StakingIcon,
  Agriculture as FarmIcon,
  SwapHoriz as SwapIcon,
  HowToVote as GovernanceIcon,
  PieChart as PieChartIcon,
} from '@mui/icons-material';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import StakingPanel from './StakingPanel';
import YieldFarmingPanel from './YieldFarmingPanel';
import SwapInterface from './SwapInterface';
import GovernancePanel from './GovernancePanel';

ChartJS.register(ArcElement, ChartTooltip, Legend);

// --- Palette ---

const palette = {
  bg: '#0F172A',
  card: '#1E293B',
  cardHover: '#263548',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  primary: '#3B82F6',
  primaryDark: '#2563EB',
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

interface AssetAllocation {
  label: string;
  value: number;
  color: string;
  usdValue: number;
}

interface PortfolioSummary {
  totalValueUsd: number;
  totalValueWrf: number;
  change24h: number;
  changePercent24h: number;
  allocations: AssetAllocation[];
}

// Mock removed — portfolio fetched from API

const TAB_CONFIG = [
  { label: 'Overview', icon: <PieChartIcon fontSize="small" /> },
  { label: 'Staking', icon: <StakingIcon fontSize="small" /> },
  { label: 'Yield Farming', icon: <FarmIcon fontSize="small" /> },
  { label: 'Swap', icon: <SwapIcon fontSize="small" /> },
  { label: 'Governance', icon: <GovernanceIcon fontSize="small" /> },
];

// --- Sub-components ---

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  trend?: number;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, subValue, trend, icon }) => (
  <Card
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
          sx={{ color: palette.textSecondary, fontSize: '0.75rem', fontFamily: fontUI, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}
        >
          {label}
        </Typography>
        <Box sx={{ color: palette.primary, opacity: 0.7 }}>{icon}</Box>
      </Stack>
      <Typography
        sx={{ color: palette.text, fontSize: '1.5rem', fontFamily: fontMono, fontWeight: 700, lineHeight: 1.2 }}
      >
        {value}
      </Typography>
      {(subValue || trend !== undefined) && (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
          {subValue && (
            <Typography sx={{ color: palette.textSecondary, fontSize: '0.8rem', fontFamily: fontMono }}>
              {subValue}
            </Typography>
          )}
          {trend !== undefined && (
            <Chip
              size="small"
              icon={trend >= 0 ? <TrendingUpIcon sx={{ fontSize: 14 }} /> : <TrendingDownIcon sx={{ fontSize: 14 }} />}
              label={`${trend >= 0 ? '+' : ''}${trend.toFixed(2)}%`}
              sx={{
                bgcolor: trend >= 0 ? `${palette.success}20` : `${palette.error}20`,
                color: trend >= 0 ? palette.success : palette.error,
                fontFamily: fontMono,
                fontSize: '0.7rem',
                fontWeight: 600,
                height: 22,
                '& .MuiChip-icon': { color: 'inherit' },
              }}
            />
          )}
        </Stack>
      )}
    </CardContent>
  </Card>
);

// --- Overview Panel ---

const OverviewPanel: React.FC<{ portfolio: PortfolioSummary }> = ({ portfolio }) => {
  const chartData = useMemo(
    () => ({
      labels: portfolio.allocations.map((a) => a.label),
      datasets: [
        {
          data: portfolio.allocations.map((a) => a.usdValue),
          backgroundColor: portfolio.allocations.map((a) => a.color),
          borderColor: palette.card,
          borderWidth: 3,
          hoverOffset: 8,
        },
      ],
    }),
    [portfolio.allocations],
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: palette.card,
          titleColor: palette.text,
          bodyColor: palette.textSecondary,
          borderColor: palette.border,
          borderWidth: 1,
          cornerRadius: 8,
          titleFont: { family: fontUI, weight: 600 as const },
          bodyFont: { family: fontMono },
          callbacks: {
            label: (ctx: { parsed: number }) =>
              ` $${ctx.parsed.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          },
        },
      },
    }),
    [],
  );

  return (
    <Stack spacing={3}>
      {/* Top Stats Row */}
      <Stack direction="row" flexWrap="wrap" gap={2}>
        <StatCard
          label="Total Portfolio Value"
          value={`$${portfolio.totalValueUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subValue={`${portfolio.totalValueWrf.toLocaleString('en-US', { minimumFractionDigits: 2 })} WRF`}
          trend={portfolio.changePercent24h}
          icon={<WalletIcon />}
        />
        <StatCard
          label="24h Change"
          value={`${portfolio.change24h >= 0 ? '+' : ''}$${portfolio.change24h.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          trend={portfolio.changePercent24h}
          icon={<TrendingUpIcon />}
        />
        <StatCard
          label="Active Positions"
          value="7"
          subValue="3 staking, 4 farms"
          icon={<StakingIcon />}
        />
        <StatCard
          label="Unclaimed Rewards"
          value="$148.23"
          subValue="494.1 WRF"
          icon={<FarmIcon />}
        />
      </Stack>

      {/* Allocation Chart + Legend */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        <Card
          sx={{
            bgcolor: palette.card,
            border: `1px solid ${palette.border}`,
            borderRadius: 3,
            flex: 2,
            p: 3,
          }}
        >
          <Typography
            sx={{ color: palette.text, fontFamily: fontUI, fontWeight: 600, fontSize: '1rem', mb: 2 }}
          >
            Asset Allocation
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
            <Box sx={{ width: 220, height: 220, position: 'relative' }}>
              <Doughnut data={chartData} options={chartOptions} />
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                }}
              >
                <Typography sx={{ color: palette.textSecondary, fontSize: '0.65rem', fontFamily: fontUI }}>
                  TOTAL
                </Typography>
                <Typography sx={{ color: palette.text, fontSize: '1.1rem', fontFamily: fontMono, fontWeight: 700 }}>
                  $12,450
                </Typography>
              </Box>
            </Box>
            <Stack spacing={1.5} sx={{ flex: 1 }}>
              {portfolio.allocations.map((alloc) => (
                <Stack
                  key={alloc.label}
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: `${alloc.color}08`,
                    border: `1px solid ${alloc.color}20`,
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: alloc.color }} />
                    <Typography sx={{ color: palette.text, fontSize: '0.85rem', fontFamily: fontUI, fontWeight: 500 }}>
                      {alloc.label}
                    </Typography>
                  </Stack>
                  <Stack alignItems="flex-end">
                    <Typography sx={{ color: palette.text, fontFamily: fontMono, fontSize: '0.85rem', fontWeight: 600 }}>
                      ${alloc.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Typography>
                    <Typography sx={{ color: palette.textSecondary, fontFamily: fontMono, fontSize: '0.7rem' }}>
                      {alloc.value.toLocaleString('en-US', { minimumFractionDigits: 0 })} WRF
                    </Typography>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          </Stack>
        </Card>

        {/* Quick Actions */}
        <Card
          sx={{
            bgcolor: palette.card,
            border: `1px solid ${palette.border}`,
            borderRadius: 3,
            flex: 1,
            p: 3,
          }}
        >
          <Typography
            sx={{ color: palette.text, fontFamily: fontUI, fontWeight: 600, fontSize: '1rem', mb: 2 }}
          >
            Quick Actions
          </Typography>
          <Stack spacing={1.5}>
            {[
              { label: 'Stake WRF', desc: 'Earn 7.8% APY', icon: <StakingIcon />, color: palette.success },
              { label: 'Add Liquidity', desc: 'Top pools: 12-28% APR', icon: <FarmIcon />, color: palette.purple },
              { label: 'Swap Tokens', desc: 'Best rate: WRF/USDC', icon: <SwapIcon />, color: palette.primary },
              { label: 'Vote on Proposals', desc: '3 active proposals', icon: <GovernanceIcon />, color: palette.warning },
            ].map((action) => (
              <Box
                key={action.label}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: `1px solid ${palette.border}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { bgcolor: `${action.color}10`, borderColor: `${action.color}40` },
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Avatar sx={{ bgcolor: `${action.color}20`, color: action.color, width: 36, height: 36 }}>
                    {action.icon}
                  </Avatar>
                  <Box>
                    <Typography sx={{ color: palette.text, fontSize: '0.85rem', fontFamily: fontUI, fontWeight: 600 }}>
                      {action.label}
                    </Typography>
                    <Typography sx={{ color: palette.textSecondary, fontSize: '0.72rem', fontFamily: fontUI }}>
                      {action.desc}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            ))}
          </Stack>
        </Card>
      </Stack>

      {/* Recent Activity */}
      <Card
        sx={{
          bgcolor: palette.card,
          border: `1px solid ${palette.border}`,
          borderRadius: 3,
          p: 3,
        }}
      >
        <Typography
          sx={{ color: palette.text, fontFamily: fontUI, fontWeight: 600, fontSize: '1rem', mb: 2 }}
        >
          Recent Activity
        </Typography>
        <Stack spacing={1}>
          {[
            { action: 'Staked 2,000 WRF', time: '2 hours ago', type: 'stake', value: '+$600.00' },
            { action: 'Harvested WRF/USDC rewards', time: '5 hours ago', type: 'harvest', value: '+42.5 WRF' },
            { action: 'Swapped 500 WRF for 150 USDC', time: '1 day ago', type: 'swap', value: '$150.00' },
            { action: 'Voted on Proposal #12', time: '2 days ago', type: 'vote', value: '1,200 vWRF' },
            { action: 'Added liquidity to WRF/ETH', time: '3 days ago', type: 'liquidity', value: '$820.00' },
          ].map((item, idx) => (
            <Stack
              key={idx}
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{
                p: 1.5,
                borderRadius: 2,
                '&:hover': { bgcolor: `${palette.primary}08` },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor:
                      item.type === 'stake'
                        ? palette.success
                        : item.type === 'harvest'
                          ? palette.warning
                          : item.type === 'swap'
                            ? palette.primary
                            : item.type === 'vote'
                              ? palette.purple
                              : palette.cyan,
                  }}
                />
                <Typography sx={{ color: palette.text, fontSize: '0.85rem', fontFamily: fontUI }}>
                  {item.action}
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography sx={{ color: palette.textSecondary, fontSize: '0.75rem', fontFamily: fontUI }}>
                  {item.time}
                </Typography>
                <Typography sx={{ color: palette.text, fontSize: '0.8rem', fontFamily: fontMono, fontWeight: 600 }}>
                  {item.value}
                </Typography>
              </Stack>
            </Stack>
          ))}
        </Stack>
      </Card>
    </Stack>
  );
};

// --- Main Component ---

const EMPTY_PORTFOLIO: PortfolioSummary = {
  totalValueUsd: 0,
  totalValueWrf: 0,
  change24h: 0,
  changePercent24h: 0,
  allocations: [],
};

const DeFiPortfolio: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [portfolio, setPortfolio] = useState<PortfolioSummary>(EMPTY_PORTFOLIO);
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);
  const [portfolioAuthRequired, setPortfolioAuthRequired] = useState(false);

  const fetchPortfolio = useCallback(async () => {
    setPortfolioLoading(true);
    setPortfolioError(null);
    setPortfolioAuthRequired(false);
    try {
      // TODO: confirm endpoint path with backend team when /defi/portfolio is deployed
      const raw = await apiClient.get<any>('/defi/portfolio');
      const ALLOC_COLORS = [palette.primary, palette.success, palette.purple, palette.warning, palette.pink, palette.cyan];
      const rawAllocs = Array.isArray(raw.allocations) ? raw.allocations : [];
      setPortfolio({
        totalValueUsd: Number(raw.totalValueUsd ?? raw.total_value_usd ?? 0),
        totalValueWrf: Number(raw.totalValueWrf ?? raw.total_value_wrf ?? 0),
        change24h: Number(raw.change24h ?? raw.change_24h ?? 0),
        changePercent24h: Number(raw.changePercent24h ?? raw.change_percent_24h ?? 0),
        allocations: rawAllocs.map((a: any, i: number) => ({
          label: a.label ?? a.name ?? `Asset ${i + 1}`,
          value: Number(a.value ?? a.amount ?? 0),
          color: a.color ?? ALLOC_COLORS[i % ALLOC_COLORS.length],
          usdValue: Number(a.usdValue ?? a.usd_value ?? 0),
        })),
      });
    } catch (err: unknown) {
      // frontend#299: never surface the raw backend string ("Bearer Token
      // Required") to a visitor — a 401/403 is a sign-in prompt, anything
      // else gets the user-facing message.
      if (isAuthRequiredError(err)) {
        setPortfolioAuthRequired(true);
      } else {
        setPortfolioError(ApiError.fromError(err, 'Portfolio unavailable').getUserMessage());
      }
    } finally {
      setPortfolioLoading(false);
    }
  }, []);

  useEffect(() => { fetchPortfolio(); }, [fetchPortfolio]);

  return (
    <Box
      sx={{
        bgcolor: palette.bg,
        minHeight: '100vh',
        p: { xs: 2, md: 3 },
        fontFamily: fontUI,
      }}
    >
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Avatar
          sx={{
            bgcolor: `${palette.primary}20`,
            color: palette.primary,
            width: 48,
            height: 48,
          }}
        >
          <WalletIcon />
        </Avatar>
        <Box>
          <Typography
            sx={{
              color: palette.text,
              fontSize: '1.5rem',
              fontFamily: fontUI,
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            Your Financial Command Center
          </Typography>
          <Typography sx={{ color: palette.textSecondary, fontSize: '0.85rem', fontFamily: fontUI }}>
            Manage your DeFi portfolio across staking, farming, swaps, and governance
          </Typography>
        </Box>
      </Stack>

      {/* Tab Navigation */}
      <Card
        sx={{
          bgcolor: palette.card,
          border: `1px solid ${palette.border}`,
          borderRadius: 3,
          mb: 3,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 1,
            '& .MuiTabs-indicator': {
              bgcolor: palette.primary,
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
            '& .MuiTab-root': {
              color: palette.textSecondary,
              fontFamily: fontUI,
              fontWeight: 500,
              fontSize: '0.85rem',
              textTransform: 'none',
              minHeight: 52,
              '&.Mui-selected': { color: palette.text },
            },
          }}
        >
          {TAB_CONFIG.map((tab, idx) => (
            <Tab key={idx} label={tab.label} icon={tab.icon} iconPosition="start" />
          ))}
        </Tabs>
      </Card>

      {/* Tab Content */}
      <Box>
        {activeTab === 0 && (
          portfolioLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress sx={{ color: palette.primary }} />
            </Box>
          ) : portfolioAuthRequired ? (
            <PublicViewerNotice
              reason="wallet"
              title="Sign in to see your DeFi portfolio"
              description="Portfolio balances are tied to a signed-in wallet. Connect a wallet to load them."
            />
          ) : portfolioError ? (
            <Alert severity="error" action={<button onClick={fetchPortfolio}>Retry</button>}>{portfolioError}</Alert>
          ) : (
            <OverviewPanel portfolio={portfolio} />
          )
        )}
        {activeTab === 1 && <StakingPanel />}
        {activeTab === 2 && <YieldFarmingPanel />}
        {activeTab === 3 && <SwapInterface />}
        {activeTab === 4 && <GovernancePanel />}
      </Box>
    </Box>
  );
};

export default DeFiPortfolio;
