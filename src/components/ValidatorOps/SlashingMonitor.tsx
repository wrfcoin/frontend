import React, { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import GppGoodIcon from '@mui/icons-material/GppGood';
import GppBadIcon from '@mui/icons-material/GppBad';
import ShieldIcon from '@mui/icons-material/Shield';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import WrfCard from '../ui/WrfCard';
import WrfStatCard from '../ui/WrfStatCard';
import WrfBadge from '../ui/WrfBadge';
import WrfDataTable from '../ui/WrfDataTable';
import { colors, borderRadius, spacing } from '../ui/tokens';
import DemoSurfaceGate from '../common/DemoSurfaceGate';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SlashingCondition {
  id: string;
  condition: string;
  description: string;
  status: 'safe' | 'warning' | 'violated';
  severity: 'low' | 'medium' | 'high' | 'critical';
  lastChecked: string;
}

interface SlashingEvent {
  id: string;
  epoch: string;
  validator: string;
  reason: string;
  penalty: number;
  date: string;
  txHash: string;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const RISK_SCORE = 12; // 0-100, lower is better
const TOTAL_PENALTIES = 0;
const INSURANCE_COVERAGE = 95;

const SLASHING_CONDITIONS: SlashingCondition[] = [
  { id: 'sc1', condition: 'Double Voting', description: 'Signing two different blocks for the same slot', status: 'safe', severity: 'critical', lastChecked: '12s ago' },
  { id: 'sc2', condition: 'Surround Voting', description: 'Creating a vote that surrounds a previous vote', status: 'safe', severity: 'critical', lastChecked: '12s ago' },
  { id: 'sc3', condition: 'Proposer Slashing', description: 'Proposing two different blocks for the same slot', status: 'safe', severity: 'critical', lastChecked: '24s ago' },
  { id: 'sc4', condition: 'Attestation Delay', description: 'Attestations arriving after target slot + 1', status: 'warning', severity: 'medium', lastChecked: '36s ago' },
  { id: 'sc5', condition: 'Inactivity Leak', description: 'Extended periods of validator inactivity', status: 'safe', severity: 'high', lastChecked: '12s ago' },
  { id: 'sc6', condition: 'Client Diversity', description: 'Running a minority consensus client', status: 'safe', severity: 'medium', lastChecked: '1m ago' },
  { id: 'sc7', condition: 'Sync Committee Misses', description: 'Missing assigned sync committee duties', status: 'safe', severity: 'low', lastChecked: '2m ago' },
];

const HISTORICAL_EVENTS: SlashingEvent[] = [
  { id: 'ev1', epoch: '298,412', validator: 'External-Node-A', reason: 'Double Voting', penalty: 1.02, date: '2025-11-14', txHash: '0x7a2b...c3d1' },
  { id: 'ev2', epoch: '295,890', validator: 'External-Node-B', reason: 'Surround Voting', penalty: 0.95, date: '2025-10-28', txHash: '0x4e1f...a8b2' },
  { id: 'ev3', epoch: '291,345', validator: 'External-Node-C', reason: 'Proposer Slashing', penalty: 1.15, date: '2025-10-02', txHash: '0x9c3d...f5e7' },
  { id: 'ev4', epoch: '287,102', validator: 'External-Node-D', reason: 'Double Voting', penalty: 1.08, date: '2025-09-15', txHash: '0x2b8a...d4c6' },
  { id: 'ev5', epoch: '282,677', validator: 'External-Node-E', reason: 'Surround Voting', penalty: 0.89, date: '2025-08-22', txHash: '0x6f5e...b1a3' },
];

const PROTECTION_TIPS = [
  { title: 'Use Remote Signing', description: 'Isolate signing keys from the beacon node for maximum security.' },
  { title: 'Run Minority Client', description: 'Avoid correlated slashing by using a minority consensus client (e.g., Teku, Lodestar).' },
  { title: 'Enable Slashing Protection DB', description: 'Always maintain an up-to-date slashing protection database and never delete it.' },
  { title: 'Monitor Validator Health', description: 'Set up alerts for missed attestations and proposal duties.' },
  { title: 'Use Anti-Slashing Middleware', description: 'Deploy Web3Signer or similar middleware with built-in slashing prevention.' },
  { title: 'Avoid Key Duplication', description: 'Never run the same validator key on multiple machines simultaneously.' },
];

// ---------------------------------------------------------------------------
// SVG Risk Gauge
// ---------------------------------------------------------------------------

const RiskGauge: React.FC<{ score: number; size?: number }> = ({ score, size = 200 }) => {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 16;
  const strokeWidth = 14;
  const circumference = Math.PI * radius; // half-circle
  const progress = (score / 100) * circumference;

  const gaugeColor =
    score <= 20 ? colors.success.main :
      score <= 50 ? colors.warning.main :
        colors.error.main;

  const riskLabel =
    score <= 20 ? 'Low Risk' :
      score <= 50 ? 'Medium Risk' :
        'High Risk';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
        {/* Background arc */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke={colors.bg.tertiary}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke={gaugeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
        {/* Score text */}
        <text x={cx} y={cy - 10} fill={colors.text.primary} fontSize={32} fontWeight={800} textAnchor="middle">
          {score}
        </text>
        <text x={cx} y={cy + 10} fill={gaugeColor} fontSize={12} fontWeight={600} textAnchor="middle">
          {riskLabel}
        </text>
        {/* Scale labels */}
        <text x={cx - radius} y={cy + 18} fill={colors.text.muted} fontSize={9} textAnchor="middle">0</text>
        <text x={cx} y={size / 2 + 16} fill={colors.text.muted} fontSize={9} textAnchor="middle">50</text>
        <text x={cx + radius} y={cy + 18} fill={colors.text.muted} fontSize={9} textAnchor="middle">100</text>
      </svg>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SlashingMonitorSample: React.FC = () => {
  const conditionStatusIcon = (status: SlashingCondition['status']) => {
    if (status === 'safe') return <CheckCircleOutlineIcon sx={{ color: colors.success.main, fontSize: 20 }} />;
    if (status === 'warning') return <WarningAmberIcon sx={{ color: colors.warning.main, fontSize: 20 }} />;
    return <CancelOutlinedIcon sx={{ color: colors.error.main, fontSize: 20 }} />;
  };

  const severityChip = (sev: SlashingCondition['severity']) => {
    const colorMap: Record<string, string> = {
      low: colors.text.muted,
      medium: colors.warning.main,
      high: colors.warning.dark,
      critical: colors.error.main,
    };
    return (
      <Chip
        label={sev.toUpperCase()}
        size="small"
        sx={{
          height: 20,
          fontSize: '0.625rem',
          fontWeight: 700,
          letterSpacing: '0.05em',
          bgcolor: colorMap[sev] + '20',
          color: colorMap[sev],
        }}
      />
    );
  };

  // Historical events table columns
  const eventColumns = [
    { key: 'epoch', label: 'Epoch', sortable: true },
    { key: 'validator', label: 'Validator', sortable: true },
    { key: 'reason', label: 'Reason', sortable: true },
    {
      key: 'penalty',
      label: 'Penalty (ETH)',
      sortable: true,
      render: (val: number) => (
        <Typography sx={{ color: colors.error.main, fontWeight: 600, fontSize: '0.875rem' }}>
          -{val.toFixed(2)}
        </Typography>
      ),
    },
    { key: 'date', label: 'Date', sortable: true },
    {
      key: 'txHash',
      label: 'Tx Hash',
      sortable: false,
      render: (val: string) => (
        <Typography sx={{ color: colors.brand.primary, fontFamily: 'monospace', fontSize: '0.75rem' }}>
          {val}
        </Typography>
      ),
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.bg.primary, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <ShieldIcon sx={{ color: colors.brand.primary, fontSize: 32 }} />
        <Box>
          <Typography sx={{ color: colors.text.primary, fontWeight: 700, fontSize: '1.5rem' }}>
            Slashing Monitor
          </Typography>
          <Typography sx={{ color: colors.text.secondary, fontSize: '0.875rem' }}>
            Monitor slashing risks, conditions, and protection status
          </Typography>
        </Box>
      </Box>

      {/* Top Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <WrfStatCard
            value={`${RISK_SCORE}/100`}
            label="Risk Score"
            icon={GppGoodIcon}
            color={colors.success.main}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <WrfStatCard
            value={`${TOTAL_PENALTIES} ETH`}
            label="Total Penalties (Your Validators)"
            icon={GppBadIcon}
            color={colors.success.main}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <WrfStatCard
            value={`${INSURANCE_COVERAGE}%`}
            label="Insurance Coverage"
            icon={VerifiedUserIcon}
            color={colors.brand.primary}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Risk Gauge + Insurance */}
        <Grid size={{ xs: 12, md: 4 }}>
          <WrfCard title="Slashing Risk Assessment" subtitle="Current risk level for your validators">
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 3 }}>
              <RiskGauge score={RISK_SCORE} size={220} />
            </Box>
            <Box
              sx={{
                bgcolor: colors.success.main + '10',
                borderRadius: `${borderRadius.md}px`,
                p: 2,
                border: `1px solid ${colors.success.main}30`,
                mb: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CheckCircleOutlineIcon sx={{ color: colors.success.main, fontSize: 18 }} />
                <Typography sx={{ color: colors.success.main, fontWeight: 600, fontSize: '0.875rem' }}>
                  All Clear
                </Typography>
              </Box>
              <Typography sx={{ color: colors.text.secondary, fontSize: '0.8rem', lineHeight: 1.5 }}>
                No slashing violations detected. Your validators are operating within safe parameters.
              </Typography>
            </Box>

            {/* Insurance Status */}
            <Typography sx={{ color: colors.text.primary, fontWeight: 600, fontSize: '0.875rem', mb: 1.5 }}>
              Insurance Status
            </Typography>
            <Box
              sx={{
                bgcolor: colors.bg.primary,
                borderRadius: `${borderRadius.md}px`,
                p: 2,
                border: `1px solid ${colors.border.default}`,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ color: colors.text.secondary, fontSize: '0.8rem' }}>Coverage</Typography>
                <Typography sx={{ color: colors.brand.primary, fontWeight: 600, fontSize: '0.8rem' }}>
                  {INSURANCE_COVERAGE}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={INSURANCE_COVERAGE}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: colors.bg.tertiary,
                  mb: 1.5,
                  '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: colors.brand.primary },
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography sx={{ color: colors.text.muted, fontSize: '0.75rem' }}>Provider</Typography>
                <Typography sx={{ color: colors.text.primary, fontSize: '0.75rem' }}>Nexus Mutual</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography sx={{ color: colors.text.muted, fontSize: '0.75rem' }}>Max Payout</Typography>
                <Typography sx={{ color: colors.text.primary, fontSize: '0.75rem' }}>32 ETH</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ color: colors.text.muted, fontSize: '0.75rem' }}>Premium</Typography>
                <Typography sx={{ color: colors.text.primary, fontSize: '0.75rem' }}>0.012 ETH/month</Typography>
              </Box>
            </Box>
          </WrfCard>
        </Grid>

        {/* Conditions Checklist */}
        <Grid size={{ xs: 12, md: 8 }}>
          <WrfCard title="Slashing Conditions Checklist" subtitle="Real-time monitoring of all slashable offenses">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {SLASHING_CONDITIONS.map((cond) => (
                <Box
                  key={cond.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    borderRadius: `${borderRadius.md}px`,
                    bgcolor: colors.bg.primary,
                    border: `1px solid ${
                      cond.status === 'safe'
                        ? colors.border.default
                        : cond.status === 'warning'
                          ? colors.warning.main + '40'
                          : colors.error.main + '40'
                    }`,
                  }}
                >
                  {conditionStatusIcon(cond.status)}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
                      <Typography sx={{ color: colors.text.primary, fontWeight: 600, fontSize: '0.875rem' }}>
                        {cond.condition}
                      </Typography>
                      {severityChip(cond.severity)}
                    </Box>
                    <Typography sx={{ color: colors.text.muted, fontSize: '0.75rem' }}>
                      {cond.description}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                    <WrfBadge
                      status={cond.status === 'safe' ? 'online' : cond.status === 'warning' ? 'degraded' : 'offline'}
                      label={cond.status === 'safe' ? 'Safe' : cond.status === 'warning' ? 'Warning' : 'Violated'}
                      size="sm"
                    />
                    <Typography sx={{ color: colors.text.muted, fontSize: '0.625rem', mt: 0.5 }}>
                      {cond.lastChecked}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </WrfCard>
        </Grid>

        {/* Historical Events */}
        <Grid size={12}>
          <WrfCard title="Network Slashing History" subtitle="Recent slashing events observed on the network (not your validators)">
            <WrfDataTable
              columns={eventColumns}
              data={HISTORICAL_EVENTS}
              searchable
              exportable
              pagination
              pageSize={5}
              sx={{ border: 'none', bgcolor: 'transparent' }}
            />
          </WrfCard>
        </Grid>

        {/* Protection Tips */}
        <Grid size={12}>
          <WrfCard
            title="Protection Best Practices"
            subtitle="Follow these guidelines to minimize slashing risk"
            action={<TipsAndUpdatesIcon sx={{ color: colors.warning.main }} />}
          >
            <Grid container spacing={2}>
              {PROTECTION_TIPS.map((tip, i) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: `${borderRadius.md}px`,
                      bgcolor: colors.bg.primary,
                      border: `1px solid ${colors.border.default}`,
                      height: '100%',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          bgcolor: colors.brand.primary + '20',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: colors.brand.primary,
                        }}
                      >
                        {i + 1}
                      </Box>
                      <Typography sx={{ color: colors.text.primary, fontWeight: 600, fontSize: '0.875rem' }}>
                        {tip.title}
                      </Typography>
                    </Box>
                    <Typography sx={{ color: colors.text.muted, fontSize: '0.8rem', lineHeight: 1.5 }}>
                      {tip.description}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </WrfCard>
        </Grid>
      </Grid>
    </Box>
  );
};

// frontend#352: display-only fabricated surface. The default build shows an
// honest not-live state and never mounts the sample.
const SlashingMonitor = () => (
  <DemoSurfaceGate
    title="The slashing monitor is not live on the testnet"
    description="No testnet endpoint reports slashing events or validator risk scores yet."
    testId="slashing-monitor"
  >
    <SlashingMonitorSample />
  </DemoSurfaceGate>
);

export default SlashingMonitor;
