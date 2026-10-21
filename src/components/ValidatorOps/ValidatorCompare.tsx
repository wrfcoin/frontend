import React, { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar, Line } from 'react-chartjs-2';
import WrfCard from '../ui/WrfCard';
import WrfButton from '../ui/WrfButton';
import WrfBadge from '../ui/WrfBadge';
import { colors, borderRadius, spacing } from '../ui/tokens';
import DemoSurfaceGate from '../common/DemoSurfaceGate';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler,
  Tooltip,
  Legend,
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ValidatorProfile {
  id: string;
  name: string;
  status: 'online' | 'degraded' | 'offline';
  effectiveness: number;
  uptime: number;
  apy: number;
  balance: number;
  totalProposals: number;
  totalAttestations: number;
  missedSlots: number;
  inclusionDelay: number;
  peerCount: number;
  clientVersion: string;
  apyHistory: number[];
  color: string;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const ALL_VALIDATORS: ValidatorProfile[] = [
  {
    id: 'val-001',
    name: 'WRF Primary Node',
    status: 'online',
    effectiveness: 99.2,
    uptime: 99.97,
    apy: 4.82,
    balance: 32.145,
    totalProposals: 14,
    totalAttestations: 8742,
    missedSlots: 3,
    inclusionDelay: 1.01,
    peerCount: 78,
    clientVersion: 'Lighthouse v4.5.0',
    apyHistory: [4.5, 4.6, 4.7, 4.6, 4.8, 4.7, 4.9, 4.8, 4.7, 4.8, 4.8, 4.82],
    color: colors.brand.primary,
  },
  {
    id: 'val-002',
    name: 'WRF Secondary Node',
    status: 'online',
    effectiveness: 98.7,
    uptime: 99.91,
    apy: 4.61,
    balance: 32.089,
    totalProposals: 11,
    totalAttestations: 8690,
    missedSlots: 8,
    inclusionDelay: 1.03,
    peerCount: 65,
    clientVersion: 'Prysm v4.1.1',
    apyHistory: [4.3, 4.4, 4.5, 4.4, 4.5, 4.6, 4.5, 4.6, 4.5, 4.6, 4.6, 4.61],
    color: colors.success.main,
  },
  {
    id: 'val-003',
    name: 'WRF Backup Node',
    status: 'degraded',
    effectiveness: 94.3,
    uptime: 97.42,
    apy: 4.12,
    balance: 32.021,
    totalProposals: 9,
    totalAttestations: 8401,
    missedSlots: 47,
    inclusionDelay: 1.38,
    peerCount: 32,
    clientVersion: 'Teku v24.1.0',
    apyHistory: [4.5, 4.4, 4.3, 4.2, 4.3, 4.1, 4.0, 4.1, 4.0, 4.2, 4.1, 4.12],
    color: colors.warning.main,
  },
  {
    id: 'val-004',
    name: 'WRF Edge Node',
    status: 'online',
    effectiveness: 99.0,
    uptime: 99.88,
    apy: 4.73,
    balance: 32.112,
    totalProposals: 12,
    totalAttestations: 8715,
    missedSlots: 5,
    inclusionDelay: 1.02,
    peerCount: 71,
    clientVersion: 'Lodestar v1.13.0',
    apyHistory: [4.4, 4.5, 4.6, 4.5, 4.7, 4.6, 4.7, 4.7, 4.6, 4.7, 4.7, 4.73],
    color: '#8B5CF6',
  },
  {
    id: 'val-005',
    name: 'WRF Storm Node',
    status: 'online',
    effectiveness: 98.9,
    uptime: 99.85,
    apy: 4.58,
    balance: 32.098,
    totalProposals: 10,
    totalAttestations: 8680,
    missedSlots: 6,
    inclusionDelay: 1.05,
    peerCount: 58,
    clientVersion: 'Nimbus v24.2.0',
    apyHistory: [4.2, 4.3, 4.4, 4.3, 4.5, 4.4, 4.5, 4.5, 4.4, 4.5, 4.5, 4.58],
    color: '#06B6D4',
  },
];

const APY_MONTHS = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];

// ---------------------------------------------------------------------------
// Comparison metrics for the table
// ---------------------------------------------------------------------------

interface ComparisonMetric {
  label: string;
  key: keyof ValidatorProfile | string;
  format: (v: ValidatorProfile) => string;
  highlight?: (v: ValidatorProfile, all: ValidatorProfile[]) => 'best' | 'worst' | 'neutral';
}

const COMPARISON_METRICS: ComparisonMetric[] = [
  {
    label: 'Status',
    key: 'status',
    format: (v) => v.status,
  },
  {
    label: 'Effectiveness',
    key: 'effectiveness',
    format: (v) => `${v.effectiveness}%`,
    highlight: (v, all) => {
      const max = Math.max(...all.map((a) => a.effectiveness));
      const min = Math.min(...all.map((a) => a.effectiveness));
      if (v.effectiveness === max) return 'best';
      if (v.effectiveness === min && all.length > 1) return 'worst';
      return 'neutral';
    },
  },
  {
    label: 'Uptime',
    key: 'uptime',
    format: (v) => `${v.uptime}%`,
    highlight: (v, all) => {
      const max = Math.max(...all.map((a) => a.uptime));
      const min = Math.min(...all.map((a) => a.uptime));
      if (v.uptime === max) return 'best';
      if (v.uptime === min && all.length > 1) return 'worst';
      return 'neutral';
    },
  },
  {
    label: 'APY',
    key: 'apy',
    format: (v) => `${v.apy}%`,
    highlight: (v, all) => {
      const max = Math.max(...all.map((a) => a.apy));
      const min = Math.min(...all.map((a) => a.apy));
      if (v.apy === max) return 'best';
      if (v.apy === min && all.length > 1) return 'worst';
      return 'neutral';
    },
  },
  {
    label: 'Balance',
    key: 'balance',
    format: (v) => `${v.balance.toFixed(3)} ETH`,
  },
  {
    label: 'Total Proposals',
    key: 'totalProposals',
    format: (v) => v.totalProposals.toString(),
  },
  {
    label: 'Total Attestations',
    key: 'totalAttestations',
    format: (v) => v.totalAttestations.toLocaleString(),
  },
  {
    label: 'Missed Slots',
    key: 'missedSlots',
    format: (v) => v.missedSlots.toString(),
    highlight: (v, all) => {
      const min = Math.min(...all.map((a) => a.missedSlots));
      const max = Math.max(...all.map((a) => a.missedSlots));
      if (v.missedSlots === min) return 'best';
      if (v.missedSlots === max && all.length > 1) return 'worst';
      return 'neutral';
    },
  },
  {
    label: 'Avg Inclusion Delay',
    key: 'inclusionDelay',
    format: (v) => `${v.inclusionDelay} slots`,
    highlight: (v, all) => {
      const min = Math.min(...all.map((a) => a.inclusionDelay));
      const max = Math.max(...all.map((a) => a.inclusionDelay));
      if (v.inclusionDelay === min) return 'best';
      if (v.inclusionDelay === max && all.length > 1) return 'worst';
      return 'neutral';
    },
  },
  {
    label: 'Peer Count',
    key: 'peerCount',
    format: (v) => v.peerCount.toString(),
  },
  {
    label: 'Client Version',
    key: 'clientVersion',
    format: (v) => v.clientVersion,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ValidatorCompareSample: React.FC = () => {
  const [selectedIds, setSelectedIds] = useState<string[]>(['val-001', 'val-002', 'val-003']);

  const selectedValidators = useMemo(
    () => ALL_VALIDATORS.filter((v) => selectedIds.includes(v.id)),
    [selectedIds],
  );

  const toggleValidator = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      }
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  // Radar chart data
  const radarData = {
    labels: ['Effectiveness', 'Uptime', 'APY', 'Proposals', 'Attestations', 'Peer Count'],
    datasets: selectedValidators.map((v) => ({
      label: v.name,
      data: [
        v.effectiveness,
        v.uptime,
        (v.apy / 5) * 100, // normalize APY to 0-100
        (v.totalProposals / 15) * 100, // normalize proposals
        (v.totalAttestations / 9000) * 100, // normalize attestations
        (v.peerCount / 80) * 100, // normalize peer count
      ],
      borderColor: v.color,
      backgroundColor: v.color + '20',
      borderWidth: 2,
      pointBackgroundColor: v.color,
      pointBorderColor: v.color,
      pointRadius: 3,
    })),
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: colors.text.secondary,
          font: { size: 11 },
          usePointStyle: true,
          pointStyleWidth: 8,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: colors.bg.secondary,
        titleColor: colors.text.primary,
        bodyColor: colors.text.secondary,
        borderColor: colors.border.default,
        borderWidth: 1,
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: colors.text.muted,
          backdropColor: 'transparent',
          font: { size: 9 },
          stepSize: 25,
        },
        grid: { color: colors.border.default + '40' },
        pointLabels: {
          color: colors.text.secondary,
          font: { size: 10 },
        },
        angleLines: { color: colors.border.default + '40' },
      },
    },
  };

  // Historical APY line chart
  const apyLineData = {
    labels: APY_MONTHS,
    datasets: selectedValidators.map((v) => ({
      label: v.name,
      data: v.apyHistory,
      borderColor: v.color,
      backgroundColor: 'transparent',
      tension: 0.3,
      pointRadius: 3,
      pointHoverRadius: 5,
      borderWidth: 2,
    })),
  };

  const apyLineOptions = {
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
        ticks: { color: colors.text.muted, font: { size: 10 } },
        grid: { color: colors.border.default + '30' },
      },
      y: {
        ticks: {
          color: colors.text.muted,
          font: { size: 10 },
          callback: (val: any) => `${val}%`,
        },
        grid: { color: colors.border.default + '30' },
      },
    },
  };

  const highlightColor = (result: 'best' | 'worst' | 'neutral') => {
    if (result === 'best') return colors.success.main;
    if (result === 'worst') return colors.error.main;
    return colors.text.primary;
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.bg.primary, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <CompareArrowsIcon sx={{ color: colors.brand.primary, fontSize: 32 }} />
        <Box>
          <Typography sx={{ color: colors.text.primary, fontWeight: 700, fontSize: '1.5rem' }}>
            Validator Compare
          </Typography>
          <Typography sx={{ color: colors.text.secondary, fontSize: '0.875rem' }}>
            Side-by-side comparison of validator performance (select up to 3)
          </Typography>
        </Box>
      </Box>

      {/* Validator Selector */}
      <WrfCard title="Select Validators" subtitle={`${selectedIds.length}/3 selected`} sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          {ALL_VALIDATORS.map((v) => {
            const isSelected = selectedIds.includes(v.id);
            const isDisabled = !isSelected && selectedIds.length >= 3;
            return (
              <Box
                key={v.id}
                onClick={() => !isDisabled && toggleValidator(v.id)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: `${borderRadius.md}px`,
                  border: `1px solid ${isSelected ? v.color : colors.border.default}`,
                  bgcolor: isSelected ? v.color + '10' : 'transparent',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  opacity: isDisabled ? 0.4 : 1,
                  transition: 'all 0.15s ease',
                  '&:hover': isDisabled ? {} : { borderColor: v.color },
                  minWidth: 220,
                }}
              >
                <Checkbox
                  checked={isSelected}
                  disabled={isDisabled}
                  icon={<CheckBoxOutlineBlankIcon sx={{ color: colors.text.muted }} />}
                  checkedIcon={<CheckBoxIcon sx={{ color: v.color }} />}
                  sx={{ p: 0 }}
                  size="small"
                />
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ color: colors.text.primary, fontWeight: 500, fontSize: '0.875rem' }}>
                    {v.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.3 }}>
                    <WrfBadge status={v.status} size="sm" />
                    <Typography sx={{ color: colors.text.muted, fontSize: '0.7rem' }}>
                      {v.effectiveness}% eff
                    </Typography>
                  </Box>
                </Box>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: v.color,
                    opacity: isSelected ? 1 : 0.3,
                    flexShrink: 0,
                  }}
                />
              </Box>
            );
          })}
        </Box>
      </WrfCard>

      {selectedValidators.length === 0 ? (
        <WrfCard>
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CompareArrowsIcon sx={{ fontSize: 48, color: colors.text.muted, mb: 2 }} />
            <Typography sx={{ color: colors.text.secondary, fontSize: '1rem' }}>
              Select at least one validator to begin comparison
            </Typography>
          </Box>
        </WrfCard>
      ) : (
        <>
          <Grid container spacing={3}>
            {/* Comparison Table */}
            <Grid size={12}>
              <WrfCard title="Detailed Comparison" subtitle="Side-by-side metrics for selected validators">
                <Box sx={{ overflowX: 'auto' }}>
                  <Box
                    component="table"
                    sx={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      '& th, & td': {
                        p: 1.5,
                        borderBottom: `1px solid ${colors.border.default}`,
                        fontSize: '0.8rem',
                        whiteSpace: 'nowrap',
                      },
                      '& th': {
                        textAlign: 'left',
                        color: colors.text.muted,
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      },
                    }}
                  >
                    <thead>
                      <tr>
                        <th style={{ width: 180 }}>Metric</th>
                        {selectedValidators.map((v) => (
                          <th key={v.id} style={{ textAlign: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: v.color }} />
                              <span style={{ color: colors.text.primary, fontWeight: 600 }}>{v.name}</span>
                            </Box>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {COMPARISON_METRICS.map((metric) => (
                        <tr key={metric.key}>
                          <td style={{ color: colors.text.secondary, fontWeight: 500 }}>{metric.label}</td>
                          {selectedValidators.map((v) => {
                            const result = metric.highlight
                              ? metric.highlight(v, selectedValidators)
                              : 'neutral';
                            const formatted = metric.format(v);
                            return (
                              <td key={v.id} style={{ textAlign: 'center' }}>
                                {metric.key === 'status' ? (
                                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                    <WrfBadge status={v.status} size="sm" />
                                  </Box>
                                ) : (
                                  <Typography
                                    sx={{
                                      color: highlightColor(result),
                                      fontWeight: result !== 'neutral' ? 700 : 500,
                                      fontSize: '0.85rem',
                                    }}
                                  >
                                    {formatted}
                                    {result === 'best' && (
                                      <Chip
                                        label="BEST"
                                        size="small"
                                        sx={{
                                          ml: 1,
                                          height: 16,
                                          fontSize: '0.55rem',
                                          fontWeight: 700,
                                          bgcolor: colors.success.main + '20',
                                          color: colors.success.main,
                                        }}
                                      />
                                    )}
                                  </Typography>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </Box>
                </Box>
              </WrfCard>
            </Grid>

            {/* Radar Chart */}
            <Grid size={{ xs: 12, md: 6 }}>
              <WrfCard title="Performance Radar" subtitle="Normalized multi-axis comparison">
                <Box sx={{ height: 380 }}>
                  <Radar data={radarData} options={radarOptions} />
                </Box>
              </WrfCard>
            </Grid>

            {/* Historical APY Line Chart */}
            <Grid size={{ xs: 12, md: 6 }}>
              <WrfCard title="Historical APY" subtitle="Monthly APY trend over the past 12 months">
                <Box sx={{ height: 380 }}>
                  <Line data={apyLineData} options={apyLineOptions} />
                </Box>
              </WrfCard>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

// frontend#352: display-only fabricated surface. The default build shows an
// honest not-live state and never mounts the sample.
const ValidatorCompare = () => (
  <DemoSurfaceGate
    title="Validator comparison is not live on the testnet"
    description="No testnet endpoint serves per-validator performance, commission or uptime history yet."
    testId="validator-compare"
  >
    <ValidatorCompareSample />
  </DemoSurfaceGate>
);

export default ValidatorCompare;
