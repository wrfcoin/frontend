import React, { useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Slider from '@mui/material/Slider';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Skeleton from '@mui/material/Skeleton';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LockIcon from '@mui/icons-material/Lock';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import SendIcon from '@mui/icons-material/Send';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import WrfCard from '../ui/WrfCard';
import WrfStatCard from '../ui/WrfStatCard';
import WrfButton from '../ui/WrfButton';
import WrfInput from '../ui/WrfInput';
import WrfDataTable from '../ui/WrfDataTable';
import WrfBadge from '../ui/WrfBadge';
import { colors, borderRadius, spacing } from '../ui/tokens';
import type { StakingPosition, ValidatorInfo } from '../../services/apiClient';
import { formatBaseUnitsToWrf, toBaseUnits, toWrfNumberForChart, WRF_UNITS_PER_COIN } from '../../services/apiClient/number';
import { formatExactAmount, sumExactBaseUnits } from '../../services/apiClient/amountPrecision';
import { useNetworkStats, useStakingPositions, useValidators } from '../../hooks/api/useValidatorQueries';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface RewardEntry {
  epoch: string;
  amount: number | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const StakingManager: React.FC = () => {
  const [stakeAmount, setStakeAmount] = useState<string>('0');
  const [selectedValidator, setSelectedValidator] = useState<string>('');
  const [autoCompound, setAutoCompound] = useState<boolean>(true);
  const [unstakeDialogOpen, setUnstakeDialogOpen] = useState<boolean>(false);
  const [unstakeAmount, setUnstakeAmount] = useState<string>('');
  const [unstakeValidator, setUnstakeValidator] = useState<string>('');

  const validatorsQuery = useValidators();
  const networkStatsQuery = useNetworkStats();
  const positionsQuery = useStakingPositions();

  const validators: ValidatorInfo[] = validatorsQuery.data || [];
  const delegations: StakingPosition[] = positionsQuery.data || [];

  const availableBalance = networkStatsQuery.data?.availableBalance ?? null;
  const totalStaked = networkStatsQuery.data?.totalStaked ?? sumExactBaseUnits(delegations.map((position) => position.amount));
  const totalRewards = networkStatsQuery.data?.totalRewards ?? sumExactBaseUnits(delegations.map((position) => position.rewards));
  const pendingRewards = networkStatsQuery.data?.pendingRewards ?? null;
  const availableBalanceUnits = toBaseUnits(availableBalance);

  useEffect(() => {
    if (!selectedValidator && validators.length > 0) {
      setSelectedValidator(validators[0].name);
    }
  }, [selectedValidator, validators]);

  useEffect(() => {
    if (selectedValidator && validators.length > 0 && !validators.some(validator => validator.name === selectedValidator)) {
      setSelectedValidator(validators[0].name);
    }
  }, [selectedValidator, validators]);

  const stakeAmountUnits = useMemo(() => parseWrfInputToBaseUnits(stakeAmount), [stakeAmount]);
  const stakeAmountChart = toWrfNumberForChart(stakeAmountUnits);
  const isStakeValid = stakeAmountUnits !== null && availableBalanceUnits !== null &&
    stakeAmountUnits >= WRF_UNITS_PER_COIN / 100n && stakeAmountUnits <= availableBalanceUnits;

  // Delegations table columns
  const delegationColumns = [
    { key: 'validator', label: 'Validator', sortable: true },
    {
      key: 'amount',
      label: 'Staked (ETH)',
      sortable: true,
      render: (val: string) => {
        return (
          <Typography sx={{ color: colors.text.primary, fontWeight: 600, fontSize: '0.875rem' }}>
          {formatExactAmount(val, 3)}
        </Typography>
        );
      },
    },
    {
      key: 'apy',
      label: 'APY',
      sortable: true,
      render: (val: number) => (
        <Typography sx={{ color: colors.success.main, fontWeight: 600, fontSize: '0.875rem' }}>
          {val}%
        </Typography>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (val: string) => <WrfBadge status={val === 'active' ? 'online' : val === 'pending' ? 'pending' : 'degraded'} label={val} size="sm" />,
    },
    { key: 'delegatedAt', label: 'Since', sortable: true },
    {
      key: 'rewards',
      label: 'Rewards (ETH)',
      sortable: true,
      render: (val: string) => {
        return (
          <Typography sx={{ color: colors.brand.primary, fontWeight: 600, fontSize: '0.875rem' }}>
          +{formatExactAmount(val, 3)}
        </Typography>
        );
      },
    },
    {
      key: 'id',
      label: 'Actions',
      sortable: false,
      render: (_val: string, row: StakingPosition) => (
        <WrfButton
          variant="secondary"
          size="sm"
          onClick={() => {
            setUnstakeValidator(row.validator);
            setUnstakeAmount(formatInputAmount(row.amount, 3));
            setUnstakeDialogOpen(true);
          }}
        >
          Unstake
        </WrfButton>
      ),
    },
  ];

  const rewardHistory: RewardEntry[] = useMemo(
    () =>
      delegations
        .slice()
        .sort(
          (a, b) =>
            new Date(a.delegatedAt).getTime() - new Date(b.delegatedAt).getTime(),
        )
        .slice(-12)
        .map((delegation, index) => ({
          epoch: `${index + 1}`,
          amount: toWrfNumberForChart(delegation.rewards),
        })),
    [delegations],
  );
  const rewardTotal = sumExactBaseUnits(delegations.map((delegation) => delegation.rewards));
  const rewardAverage = rewardTotal === null || rewardHistory.length === 0
    ? null
    : formatBaseUnitsToWrf(BigInt(rewardTotal) / BigInt(rewardHistory.length), 4);

  // Reward chart
  const rewardChartData = {
    labels: rewardHistory.map((r) => r.epoch),
    datasets: [
      {
        label: 'Epoch Rewards (ETH)',
        data: rewardHistory.map((r) => r.amount),
        backgroundColor: rewardHistory.map((_, i) =>
          i === rewardHistory.length - 1 ? colors.brand.primary : colors.brand.primary + '80',
        ),
        borderRadius: 4,
        borderSkipped: false as const,
        barThickness: 18,
      },
    ],
  };

  const rewardChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: colors.bg.secondary,
        titleColor: colors.text.primary,
        bodyColor: colors.text.secondary,
        borderColor: colors.border.default,
        borderWidth: 1,
        callbacks: {
          label: (ctx: any) => ctx.parsed.y == null ? 'Reward unavailable' : `Reward: ${ctx.parsed.y.toFixed(4)} ETH`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: colors.text.muted, font: { size: 10 }, maxRotation: 45 },
        grid: { display: false },
      },
      y: {
        ticks: {
          color: colors.text.muted,
          font: { size: 10 },
          callback: (val: any) => `${val}`,
        },
        grid: { color: colors.border.default + '30' },
      },
    },
  };

  if (validatorsQuery.isLoading || networkStatsQuery.isLoading || positionsQuery.isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: colors.bg.primary, p: 3 }}>
        <Skeleton variant="rounded" height={56} sx={{ bgcolor: colors.bg.secondary, mb: 2 }} />
        <Skeleton variant="rounded" height={120} sx={{ bgcolor: colors.bg.secondary, mb: 2 }} />
        <Skeleton variant="rounded" height={320} sx={{ bgcolor: colors.bg.secondary }} />
      </Box>
    );
  }

  if (validatorsQuery.isError || networkStatsQuery.isError || positionsQuery.isError) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: colors.bg.primary, p: 3 }}>
        <Alert severity="error" sx={{ bgcolor: colors.error.main + '1a', color: colors.text.primary }}>
          {getErrorMessage(
            validatorsQuery.error || networkStatsQuery.error || positionsQuery.error,
            'Unable to load staking data.',
          )}
        </Alert>
      </Box>
    );
  }

  if (validators.length === 0) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: colors.bg.primary, p: 3 }}>
        <Alert severity="info" sx={{ bgcolor: colors.brand.primary + '1a', color: colors.text.primary }}>
          No validators are currently available for staking.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.bg.primary, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <LockIcon sx={{ color: colors.brand.primary, fontSize: 32 }} />
        <Box>
          <Typography sx={{ color: colors.text.primary, fontWeight: 700, fontSize: '1.5rem' }}>
            Staking Manager
          </Typography>
          <Typography sx={{ color: colors.text.secondary, fontSize: '0.875rem' }}>
            Stake, delegate, and manage your validator positions
          </Typography>
        </Box>
      </Box>

      {/* Balance Overview */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            value={`${formatExactAmount(availableBalance, 3)} ETH`}
            label="Available Balance"
            icon={AccountBalanceWalletIcon}
            sparklineData={[14.1, 14.3, 14.5, 14.6, 14.7, 14.8, 14.8]}
            color={colors.brand.primary}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            value={`${formatExactAmount(totalStaked, 3)} ETH`}
            label="Total Staked"
            trend={2.4}
            trendLabel="vs last month"
            icon={LockIcon}
            sparklineData={[124.2, 125.0, 126.1, 126.8, 127.3, 128.0, 128.4]}
            color={colors.success.main}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            value={`${formatExactAmount(totalRewards, 3)} ETH`}
            label="Total Rewards Earned"
            trend={8.6}
            trendLabel="all time"
            icon={TrendingUpIcon}
            sparklineData={[1.8, 1.9, 2.0, 2.1, 2.2, 2.3, 2.5]}
            color={colors.warning.main}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            value={`${formatExactAmount(pendingRewards, 4)} ETH`}
            label="Pending Rewards"
            icon={AutorenewIcon}
            sparklineData={[0.012, 0.014, 0.015, 0.016, 0.017, 0.018, 0.019]}
            color={colors.brand.primary}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Stake Form */}
        <Grid size={{ xs: 12, md: 5 }}>
          <WrfCard title="Stake Tokens" subtitle="Delegate ETH to a validator">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* Validator Selection */}
              <Box>
                <Typography sx={{ color: colors.text.secondary, fontSize: '0.875rem', fontWeight: 500, mb: 1 }}>
                  Select Validator
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {validators.map((validator) => (
                    <Box
                      key={validator.id}
                      onClick={() => setSelectedValidator(validator.name)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1.5,
                        borderRadius: `${borderRadius.md}px`,
                        border: `1px solid ${selectedValidator === validator.name ? colors.brand.primary : colors.border.default}`,
                        bgcolor: selectedValidator === validator.name ? colors.brand.primary + '10' : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        '&:hover': { borderColor: colors.brand.primary },
                      }}
                    >
                      <Typography sx={{ color: colors.text.primary, fontSize: '0.875rem', fontWeight: selectedValidator === validator.name ? 600 : 400 }}>
                        {validator.name}
                      </Typography>
                      {selectedValidator === validator.name && (
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: colors.brand.primary }} />
                      )}
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Amount Input */}
              <WrfInput
                label="Stake Amount (ETH)"
                value={stakeAmount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStakeAmount(e.target.value)}
                type="number"
                placeholder="Enter amount..."
                helperText={`Available: ${formatExactAmount(availableBalance, 3)} ETH`}
                error={stakeAmountUnits !== null && availableBalanceUnits !== null && stakeAmountUnits > availableBalanceUnits}
                errorMessage={stakeAmountUnits !== null && availableBalanceUnits !== null && stakeAmountUnits > availableBalanceUnits ? 'Insufficient balance' : undefined}
              />

              {/* Quick Amount Buttons */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                {[8, 16, 32].map((amt) => (
                  <WrfButton
                    key={amt}
                    variant={stakeAmount === amt.toString() ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setStakeAmount(amt.toString())}
                    sx={{ flex: 1 }}
                  >
                    {amt} ETH
                  </WrfButton>
                ))}
                <WrfButton
                  variant="secondary"
                  size="sm"
                  onClick={() => setStakeAmount(formatInputAmount(availableBalance, 3))}
                  sx={{ flex: 1 }}
                >
                  Max
                </WrfButton>
              </Box>

              {/* Estimated Earnings */}
              <Box
                sx={{
                  bgcolor: colors.bg.primary,
                  borderRadius: `${borderRadius.md}px`,
                  p: 2,
                  border: `1px solid ${colors.border.default}`,
                }}
              >
                <Typography sx={{ color: colors.text.muted, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
                  Estimated Annual Earnings
                </Typography>
                <Typography sx={{ color: colors.success.main, fontWeight: 700, fontSize: '1.25rem' }}>
                  {stakeAmountChart === null ? 'Unavailable' : `~${(stakeAmountChart * 0.047).toFixed(4)}`} ETH / year
                </Typography>
                <Typography sx={{ color: colors.text.muted, fontSize: '0.75rem', mt: 0.5 }}>
                  At current APY of ~4.7%
                </Typography>
              </Box>

              <WrfButton
                variant="primary"
                size="lg"
                fullWidth
                disabled={!isStakeValid}
                startIcon={<SendIcon sx={{ fontSize: 18 }} />}
              >
                Stake {stakeAmountUnits !== null && stakeAmountUnits > 0n ? `${stakeAmount} ETH` : ''}
              </WrfButton>
            </Box>
          </WrfCard>

          {/* Auto-Compound Toggle */}
          <WrfCard title="Auto-Compound" subtitle="Automatically restake earned rewards" sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography sx={{ color: colors.text.primary, fontSize: '0.875rem', fontWeight: 500 }}>
                  Enable Auto-Compound
                </Typography>
                <Typography sx={{ color: colors.text.muted, fontSize: '0.75rem', mt: 0.5 }}>
                  {autoCompound
                    ? 'Rewards are automatically restaked every epoch'
                    : 'Rewards accumulate as pending balance'}
                </Typography>
              </Box>
              <Switch
                checked={autoCompound}
                onChange={(e) => setAutoCompound(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: colors.brand.primary,
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: colors.brand.primary,
                  },
                  '& .MuiSwitch-track': {
                    backgroundColor: colors.bg.tertiary,
                  },
                }}
              />
            </Box>
            {autoCompound && (
              <Box
                sx={{
                  mt: 2,
                  p: 1.5,
                  bgcolor: colors.success.main + '10',
                  borderRadius: `${borderRadius.md}px`,
                  border: `1px solid ${colors.success.main}30`,
                }}
              >
                <Typography sx={{ color: colors.success.main, fontSize: '0.8rem' }}>
                  Auto-compound is active. Estimated compounded yield: 4.92% APY
                </Typography>
              </Box>
            )}
          </WrfCard>
        </Grid>

        {/* Delegations Table + Reward Chart */}
        <Grid size={{ xs: 12, md: 7 }}>
          {/* Delegations */}
          <WrfCard title="Active Delegations" subtitle={`${delegations.length} active positions`} sx={{ mb: 3 }}>
            {delegations.length === 0 ? (
              <Alert severity="info" sx={{ bgcolor: colors.brand.primary + '1a', color: colors.text.primary }}>
                No staking positions found for this account context.
              </Alert>
            ) : (
              <WrfDataTable
                columns={delegationColumns}
                data={delegations}
                searchable
                exportable
                pagination={false}
                sx={{ border: 'none', bgcolor: 'transparent' }}
              />
            )}
          </WrfCard>

          {/* Reward History Chart */}
          <WrfCard title="Reward History" subtitle="Rewards earned per epoch">
            <Box sx={{ height: 280 }}>
              {rewardHistory.length > 0 ? (
                <Bar data={rewardChartData} options={rewardChartOptions} />
              ) : (
                <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography sx={{ color: colors.text.muted, fontSize: '0.8rem' }}>
                    No reward history available yet.
                  </Typography>
                </Box>
              )}
            </Box>
            <Divider sx={{ borderColor: colors.border.default, my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography sx={{ color: colors.text.muted, fontSize: '0.75rem' }}>Average per Epoch</Typography>
                <Typography sx={{ color: colors.text.primary, fontWeight: 600, fontSize: '0.875rem' }}>
                  {rewardAverage ?? 'Unavailable'} ETH
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ color: colors.text.muted, fontSize: '0.75rem' }}>Total Shown</Typography>
                <Typography sx={{ color: colors.success.main, fontWeight: 600, fontSize: '0.875rem' }}>
                  {formatExactAmount(rewardTotal, 4)} ETH
                </Typography>
              </Box>
              <WrfButton variant="secondary" size="sm">
                Claim All Rewards
              </WrfButton>
            </Box>
          </WrfCard>
        </Grid>
      </Grid>

      {/* Unstake Dialog */}
      <Dialog
        open={unstakeDialogOpen}
        onClose={() => setUnstakeDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: colors.bg.secondary,
            border: `1px solid ${colors.border.default}`,
            borderRadius: `${borderRadius.lg}px`,
            minWidth: 400,
          },
        }}
      >
        <DialogTitle sx={{ color: colors.text.primary, fontWeight: 600 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LockOpenIcon sx={{ color: colors.warning.main }} />
            Unstake from {unstakeValidator}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: colors.text.secondary, fontSize: '0.875rem', mb: 2 }}>
            Unstaking requires a cooldown period of approximately 27 hours. During this time your
            tokens will not earn rewards.
          </Typography>
          <WrfInput
            label="Amount to Unstake (ETH)"
            value={unstakeAmount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUnstakeAmount(e.target.value)}
            type="number"
            placeholder="Enter amount..."
          />
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              bgcolor: colors.warning.main + '10',
              borderRadius: `${borderRadius.md}px`,
              border: `1px solid ${colors.warning.main}30`,
            }}
          >
            <Typography sx={{ color: colors.warning.main, fontSize: '0.8rem' }}>
              Warning: Unstaking will reduce your validator effectiveness and may affect rewards.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <WrfButton variant="ghost" onClick={() => setUnstakeDialogOpen(false)}>
            Cancel
          </WrfButton>
          <WrfButton variant="danger" onClick={() => setUnstakeDialogOpen(false)}>
            Confirm Unstake
          </WrfButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

function parseWrfInputToBaseUnits(value: string): bigint | null {
  const trimmed = value.trim();
  if (trimmed === '' || !/^\d*\.?\d*$/.test(trimmed)) return null;
  const [whole = '0', fraction = ''] = trimmed.split('.');
  try {
    return BigInt(whole || '0') * WRF_UNITS_PER_COIN +
      BigInt(fraction.slice(0, 8).padEnd(8, '0') || '0');
  } catch {
    return null;
  }
}

function formatInputAmount(value: unknown, fractionDigits: number): string {
  return (formatBaseUnitsToWrf(value, fractionDigits) ?? '').replace(/,/g, '');
}

export default StakingManager;
