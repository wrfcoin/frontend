import PublicViewerNotice from '../common/PublicViewerNotice';
import React, { useMemo } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import HubIcon from '@mui/icons-material/Hub';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PercentIcon from '@mui/icons-material/Percent';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import RefreshIcon from '@mui/icons-material/Refresh';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import WrfCard from '../ui/WrfCard';
import WrfStatCard from '../ui/WrfStatCard';
import WrfBadge from '../ui/WrfBadge';
import WrfButton from '../ui/WrfButton';
import { WrfCapabilityReadinessBadge } from '../DesignSystem';
import { colors, borderRadius, spacing } from '../ui/tokens';
import type { ValidatorInfo } from '../../services/apiClient';
import { formatBaseUnitsToWrf } from '../../services/apiClient/number';
import { sumExactBaseUnits } from '../../services/apiClient/amountPrecision';
import { useNetworkStats, useValidators } from '../../hooks/api/useValidatorQueries';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const effectivenessColor = (eff: number): string => {
  if (eff >= 98) return colors.success.main;
  if (eff >= 95) return colors.warning.main;
  return colors.error.main;
};

const badgeStatus = (status: string): 'online' | 'degraded' | 'offline' | 'pending' | 'syncing' => {
  if (status === 'online' || status === 'degraded' || status === 'offline') return status;
  return 'offline';
};

const safeErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ValidatorOperationsCenter: React.FC = () => {
  const validatorsQuery = useValidators();
  const networkStatsQuery = useNetworkStats();
  const validators: ValidatorInfo[] = validatorsQuery.data || [];

  const totalStaked = useMemo(
    () =>
      networkStatsQuery.data?.totalStaked ??
      sumExactBaseUnits(validators.map((validator) => validator.balance)),
    [networkStatsQuery.data?.totalStaked, validators],
  );

  const avgEffectiveness = useMemo(() => {
    if (validators.length === 0) return '0.0';
    const sum = validators.reduce((acc, validator) => acc + validator.effectiveness, 0);
    return (sum / validators.length).toFixed(1);
  }, [validators]);

  const avgUptime = useMemo(() => {
    if (validators.length === 0) return '0.00';
    const sum = validators.reduce((acc, validator) => acc + validator.uptime, 0);
    return (sum / validators.length).toFixed(2);
  }, [validators]);

  const healthSummary = useMemo(
    () => ({
      green: validators.filter(validator => validator.status === 'online').length,
      yellow: validators.filter(validator => validator.status === 'degraded').length,
      red: validators.filter(validator => validator.status === 'offline').length,
    }),
    [validators],
  );

  const chartLabels = validators.map(validator => validator.name);
  const earningsChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Effectiveness %',
        data: validators.map(validator => validator.effectiveness),
        borderColor: colors.brand.primary,
        backgroundColor: colors.brand.primary + '20',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2,
      },
      {
        label: 'Uptime %',
        data: validators.map(validator => validator.uptime),
        borderColor: colors.success.main,
        backgroundColor: colors.success.main + '15',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2,
      },
    ],
  };

  const earningsChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: colors.text.secondary,
          font: { size: 11 },
          usePointStyle: true,
          pointStyleWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: colors.bg.secondary,
        titleColor: colors.text.primary,
        bodyColor: colors.text.secondary,
        borderColor: colors.border.default,
        borderWidth: 1,
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}%`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: colors.text.muted, font: { size: 11 } },
        grid: { color: colors.border.default + '40' },
      },
      y: {
        ticks: {
          color: colors.text.muted,
          font: { size: 11 },
          callback: (val: any) => `${val}%`,
        },
        grid: { color: colors.border.default + '40' },
      },
    },
  };

  if (validatorsQuery.isLoading || networkStatsQuery.isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: colors.bg.primary, p: 3 }}>
        <Skeleton variant="rounded" height={56} sx={{ bgcolor: colors.bg.secondary, mb: 2 }} />
        <Skeleton variant="rounded" height={120} sx={{ bgcolor: colors.bg.secondary, mb: 2 }} />
        <Skeleton variant="rounded" height={320} sx={{ bgcolor: colors.bg.secondary }} />
      </Box>
    );
  }

  if (validatorsQuery.isError || networkStatsQuery.isError) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: colors.bg.primary, p: 3 }}>
        <Alert severity="error" sx={{ bgcolor: colors.error.main + '1a', color: colors.text.primary }}>
          {safeErrorMessage(
            validatorsQuery.error || networkStatsQuery.error,
            'Unable to load validator operations data.',
          )}
        </Alert>
      </Box>
    );
  }

  if (validators.length === 0) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: colors.bg.primary, p: 3 }}>
        <Alert severity="info" sx={{ bgcolor: colors.brand.primary + '1a', color: colors.text.primary }}>
          No validators are currently available.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.bg.primary, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <HubIcon sx={{ color: colors.brand.primary, fontSize: 32 }} />
          <Box>
            <Typography sx={{ color: colors.text.primary, fontWeight: 700, fontSize: '1.5rem' }}>
              Validator Operations Center
            </Typography>
            <Typography sx={{ color: colors.text.secondary, fontSize: '0.875rem' }}>
              Monitor, manage, and optimize your validator fleet
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WrfCapabilityReadinessBadge featureName="validatorOps" compact />
          <WrfBadge status="online" label="All Systems" pulse />
          <IconButton sx={{ color: colors.text.secondary }}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Top Stats Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            value={validators.length.toString()}
            label="Total Validators"
            trend={0}
            trendLabel="active"
            icon={HubIcon}
            sparklineData={[3, 3, 3, 4, 4, 4, 4]}
            color={colors.brand.primary}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            value={`${formatBaseUnitsToWrf(totalStaked, 3) ?? 'Unavailable'} ETH`}
            label="Total Staked"
            trend={1.2}
            trendLabel="vs last week"
            icon={AccountBalanceWalletIcon}
            sparklineData={[127.8, 128.0, 128.1, 128.2, 128.3, 128.3, 128.4]}
            color={colors.success.main}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            value={`${avgEffectiveness}%`}
            label="Avg Effectiveness"
            trend={-0.3}
            trendLabel="vs last epoch"
            icon={PercentIcon}
            sparklineData={[98.8, 99.1, 98.9, 99.0, 98.5, 97.8, 97.8]}
            color={colors.warning.main}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            value={`${avgUptime}%`}
            label="Avg Uptime"
            trend={0.1}
            trendLabel="30d"
            icon={AccessTimeIcon}
            sparklineData={[99.5, 99.6, 99.7, 99.7, 99.6, 99.3, 99.3]}
            color={colors.success.main}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* My Validators */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <WrfCard
            title="My Validators"
            subtitle={`${validators.length} validators active`}
            action={
              <WrfButton variant="ghost" size="sm">
                <MoreVertIcon sx={{ fontSize: 18 }} />
              </WrfButton>
            }
          >
            <Grid container spacing={2}>
              {validators.map((v) => (
                <Grid size={{ xs: 12, sm: 6 }} key={v.id}>
                  <Box
                    sx={{
                      bgcolor: colors.bg.primary,
                      borderRadius: `${borderRadius.md}px`,
                      border: `1px solid ${colors.border.default}`,
                      p: 2,
                      transition: 'border-color 0.2s',
                      '&:hover': { borderColor: colors.brand.primary },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography sx={{ color: colors.text.primary, fontWeight: 600, fontSize: '0.875rem' }}>
                        {v.name}
                      </Typography>
                      <WrfBadge status={badgeStatus(v.status)} size="sm" />
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ color: colors.text.muted, fontSize: '0.75rem' }}>Balance</Typography>
                      <Typography sx={{ color: colors.text.primary, fontWeight: 600, fontSize: '0.75rem' }}>
                          {formatBaseUnitsToWrf(v.balance, 3) ?? 'Unavailable'} WRF
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography sx={{ color: colors.text.muted, fontSize: '0.75rem' }}>Effectiveness</Typography>
                        <Typography
                          sx={{
                            color: effectivenessColor(v.effectiveness),
                            fontWeight: 600,
                            fontSize: '0.75rem',
                          }}
                        >
                          {v.effectiveness}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={v.effectiveness}
                        sx={{
                          height: 4,
                          borderRadius: 2,
                          bgcolor: colors.bg.tertiary,
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 2,
                            bgcolor: effectivenessColor(v.effectiveness),
                          },
                        }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography sx={{ color: colors.text.muted, fontSize: '0.625rem', textTransform: 'uppercase' }}>
                          Proposals
                        </Typography>
                        <Typography sx={{ color: colors.text.primary, fontWeight: 600, fontSize: '0.8rem' }}>
                          {v.proposals}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ color: colors.text.muted, fontSize: '0.625rem', textTransform: 'uppercase' }}>
                          Attestations
                        </Typography>
                        <Typography sx={{ color: colors.text.primary, fontWeight: 600, fontSize: '0.8rem' }}>
                          {v.attestations.toLocaleString()}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ color: colors.text.muted, fontSize: '0.625rem', textTransform: 'uppercase' }}>
                          Missed
                        </Typography>
                        <Typography
                          sx={{
                            color: v.missedSlots > 10 ? colors.error.main : colors.text.primary,
                            fontWeight: 600,
                            fontSize: '0.8rem',
                          }}
                        >
                          {v.missedSlots}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ color: colors.text.muted, fontSize: '0.625rem', textTransform: 'uppercase' }}>
                          Last Attest
                        </Typography>
                        <Typography sx={{ color: colors.success.main, fontWeight: 600, fontSize: '0.8rem' }}>
                          {v.lastAttestation}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </WrfCard>
        </Grid>

        {/* Health Overview */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <WrfCard title="Fleet Health" subtitle="Validator health distribution">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
              {/* Green */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CheckCircleIcon sx={{ color: colors.success.main, fontSize: 28 }} />
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ color: colors.text.primary, fontWeight: 600, fontSize: '0.875rem' }}>
                      Healthy
                    </Typography>
                      <Typography sx={{ color: colors.success.main, fontWeight: 700, fontSize: '0.875rem' }}>
                      {healthSummary.green}
                      </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(healthSummary.green / validators.length) * 100}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: colors.bg.tertiary,
                      '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: colors.success.main },
                    }}
                  />
                </Box>
              </Box>
              {/* Yellow */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <WarningIcon sx={{ color: colors.warning.main, fontSize: 28 }} />
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ color: colors.text.primary, fontWeight: 600, fontSize: '0.875rem' }}>
                      Degraded
                    </Typography>
                      <Typography sx={{ color: colors.warning.main, fontWeight: 700, fontSize: '0.875rem' }}>
                      {healthSummary.yellow}
                      </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(healthSummary.yellow / validators.length) * 100}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: colors.bg.tertiary,
                      '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: colors.warning.main },
                    }}
                  />
                </Box>
              </Box>
              {/* Red */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <ErrorIcon sx={{ color: colors.error.main, fontSize: 28 }} />
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ color: colors.text.primary, fontWeight: 600, fontSize: '0.875rem' }}>
                      Offline
                    </Typography>
                      <Typography sx={{ color: colors.error.main, fontWeight: 700, fontSize: '0.875rem' }}>
                      {healthSummary.red}
                      </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={healthSummary.red > 0 ? (healthSummary.red / validators.length) * 100 : 0}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: colors.bg.tertiary,
                      '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: colors.error.main },
                    }}
                  />
                </Box>
              </Box>
            </Box>

            {/* Uptime Summary */}
            <Box
              sx={{
                bgcolor: colors.bg.primary,
                borderRadius: `${borderRadius.md}px`,
                p: 2,
                border: `1px solid ${colors.border.default}`,
              }}
            >
              <Typography sx={{ color: colors.text.muted, fontSize: '0.75rem', mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Fleet Summary
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography sx={{ color: colors.text.secondary, fontSize: '0.8rem' }}>Total Attestations</Typography>
                <Typography sx={{ color: colors.text.primary, fontWeight: 600, fontSize: '0.8rem' }}>
                  {validators.reduce((s, v) => s + v.attestations, 0).toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography sx={{ color: colors.text.secondary, fontSize: '0.8rem' }}>Total Proposals</Typography>
                <Typography sx={{ color: colors.text.primary, fontWeight: 600, fontSize: '0.8rem' }}>
                  {validators.reduce((s, v) => s + v.proposals, 0)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ color: colors.text.secondary, fontSize: '0.8rem' }}>Total Missed Slots</Typography>
                <Typography
                  sx={{
                    color: colors.warning.main,
                    fontWeight: 600,
                    fontSize: '0.8rem',
                  }}
                >
                  {validators.reduce((s, v) => s + v.missedSlots, 0)}
                </Typography>
              </Box>
            </Box>
          </WrfCard>
        </Grid>

        {/* Earnings Chart */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <WrfCard title="Validator Performance" subtitle="Current effectiveness and uptime (%)">
            <Box sx={{ height: 300 }}>
              <Line data={earningsChartData} options={earningsChartOptions} />
            </Box>
          </WrfCard>
        </Grid>

        {/* Alerts Panel */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <WrfCard title="Active Alerts">
            <PublicViewerNotice reason="not-live" title="Validator alerts are unavailable"
              description="The backend does not serve validator alert reads or acknowledgements." />
          </WrfCard>
        </Grid>
      </Grid>
    </Box>
  );
};


export default ValidatorOperationsCenter;
