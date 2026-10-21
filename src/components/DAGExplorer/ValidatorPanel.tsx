import React, { useState, useMemo, useCallback } from 'react';
import DemoSurfaceGate from '../common/DemoSurfaceGate';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableSortLabel,
  Stack,
  Chip,
  LinearProgress,
  Divider,
} from '@mui/material';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip, Legend);

// --- Types ---

interface Validator {
  rank: number;
  name: string;
  address: string;
  totalStake: number;
  selfStake: number;
  delegatedStake: number;
  uptime: number;
  blocksProposed: number;
  attestations: number;
  status: 'active' | 'jailed' | 'inactive';
  slashingHistory: SlashingEvent[];
}

interface SlashingEvent {
  epoch: number;
  reason: string;
  amount: number;
}

type SortField = 'rank' | 'totalStake' | 'uptime' | 'blocksProposed' | 'attestations';
type SortDirection = 'asc' | 'desc';

interface ValidatorPanelProps {
  className?: string;
}

// --- Constants ---

const palette = {
  bg: '#0F172A',
  card: '#1E293B',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  primary: '#3B82F6',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  border: '#334155',
};

const STATUS_COLORS: Record<Validator['status'], string> = {
  active: palette.success,
  jailed: palette.error,
  inactive: '#64748B',
};

// --- Mock Data ---

function generateMockValidators(): Validator[] {
  const validators: Validator[] = [
    { rank: 1, name: 'WRF Validator Alpha', address: 'wrfval1q8z...3k7d', totalStake: 250000, selfStake: 100000, delegatedStake: 150000, uptime: 99.97, blocksProposed: 14523, attestations: 892341, status: 'active', slashingHistory: [] },
    { rank: 2, name: 'StormNode Capital', address: 'wrfval1m2n...9p4x', totalStake: 180000, selfStake: 80000, delegatedStake: 100000, uptime: 99.94, blocksProposed: 11234, attestations: 876123, status: 'active', slashingHistory: [] },
    { rank: 3, name: 'Climate Stakers', address: 'wrfval1v6t...2h8j', totalStake: 150000, selfStake: 60000, delegatedStake: 90000, uptime: 99.91, blocksProposed: 9876, attestations: 854312, status: 'active', slashingHistory: [] },
    { rank: 4, name: 'WeatherDAO Collective', address: 'wrfval1f4r...7w1c', totalStake: 120000, selfStake: 50000, delegatedStake: 70000, uptime: 99.88, blocksProposed: 8234, attestations: 831204, status: 'active', slashingHistory: [] },
    { rank: 5, name: 'TempGuard Labs', address: 'wrfval1d9s...5a6y', totalStake: 95000, selfStake: 45000, delegatedStake: 50000, uptime: 99.85, blocksProposed: 7012, attestations: 812456, status: 'active', slashingHistory: [] },
    { rank: 6, name: 'Barometric Pool', address: 'wrfval1k3p...8m2b', totalStake: 85000, selfStake: 40000, delegatedStake: 45000, uptime: 99.82, blocksProposed: 6543, attestations: 798234, status: 'active', slashingHistory: [{ epoch: 14520, reason: 'Double attestation', amount: 425 }] },
    { rank: 7, name: 'Anemometer DAO', address: 'wrfval1h7g...4n3t', totalStake: 72000, selfStake: 30000, delegatedStake: 42000, uptime: 99.76, blocksProposed: 5432, attestations: 781023, status: 'active', slashingHistory: [] },
    { rank: 8, name: 'FrostByte Systems', address: 'wrfval1j5w...6r9q', totalStake: 60000, selfStake: 25000, delegatedStake: 35000, uptime: 99.71, blocksProposed: 4890, attestations: 762312, status: 'active', slashingHistory: [] },
    { rank: 9, name: 'Celsius Networks', address: 'wrfval1a2b...c3d4', totalStake: 52000, selfStake: 22000, delegatedStake: 30000, uptime: 99.65, blocksProposed: 4321, attestations: 743102, status: 'active', slashingHistory: [] },
    { rank: 10, name: 'HumidityVault', address: 'wrfval1e5f...g6h7', totalStake: 45000, selfStake: 20000, delegatedStake: 25000, uptime: 99.54, blocksProposed: 3987, attestations: 721345, status: 'active', slashingHistory: [] },
    { rank: 11, name: 'Dewpoint Capital', address: 'wrfval1i8j...k9l0', totalStake: 38000, selfStake: 18000, delegatedStake: 20000, uptime: 98.32, blocksProposed: 3210, attestations: 698765, status: 'active', slashingHistory: [{ epoch: 12100, reason: 'Proposer slashing', amount: 1900 }] },
    { rank: 12, name: 'WindShear Protocol', address: 'wrfval1m1n...o2p3', totalStake: 31000, selfStake: 15000, delegatedStake: 16000, uptime: 99.42, blocksProposed: 2876, attestations: 678901, status: 'active', slashingHistory: [] },
    { rank: 13, name: 'ThunderStake', address: 'wrfval1q4r...s5t6', totalStake: 25000, selfStake: 12000, delegatedStake: 13000, uptime: 97.89, blocksProposed: 2345, attestations: 654320, status: 'active', slashingHistory: [] },
    { rank: 14, name: 'IsobarNode', address: 'wrfval1u7v...w8x9', totalStake: 18000, selfStake: 10000, delegatedStake: 8000, uptime: 0, blocksProposed: 1567, attestations: 612345, status: 'jailed', slashingHistory: [{ epoch: 15200, reason: 'Extended downtime (72h)', amount: 900 }] },
    { rank: 15, name: 'PrecipStake', address: 'wrfval1y0z...a1b2', totalStake: 12000, selfStake: 8000, delegatedStake: 4000, uptime: 0, blocksProposed: 987, attestations: 543210, status: 'inactive', slashingHistory: [] },
  ];
  return validators;
}

// --- Component ---

const ValidatorPanelSample: React.FC<ValidatorPanelProps> = () => {
  const validators = useMemo(() => generateMockValidators(), []);
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'rank' ? 'asc' : 'desc');
    }
  }, [sortField]);

  const sortedValidators = useMemo(() => {
    const sorted = [...validators];
    sorted.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const cmp = typeof aVal === 'number' && typeof bVal === 'number' ? aVal - bVal : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [validators, sortField, sortDir]);

  const totalStake = useMemo(() => validators.reduce((s, v) => s + v.totalStake, 0), [validators]);

  const top10 = validators.slice(0, 10);
  const stakeDistributionData = useMemo(() => ({
    labels: top10.map(v => v.name.length > 12 ? v.name.slice(0, 12) + '...' : v.name),
    datasets: [
      {
        label: 'Self Stake',
        data: top10.map(v => v.selfStake),
        backgroundColor: palette.primary + '99',
        borderColor: palette.primary,
        borderWidth: 1,
      },
      {
        label: 'Delegated',
        data: top10.map(v => v.delegatedStake),
        backgroundColor: palette.success + '99',
        borderColor: palette.success,
        borderWidth: 1,
      },
    ],
  }), [top10]);

  const allSlashingEvents = useMemo(() =>
    validators.flatMap(v =>
      v.slashingHistory.map(s => ({ validator: v.name, ...s })),
    ),
  [validators]);

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 2 }}>
      {/* Stake distribution chart */}
      <Paper sx={{ bgcolor: palette.card, p: 1.5, mb: 2, borderRadius: 2 }}>
        <Typography variant="caption" sx={{ color: palette.textSecondary, fontWeight: 600, display: 'block', mb: 1 }}>
          Stake Distribution (Top 10)
        </Typography>
        <Box sx={{ height: 200 }}>
          <Bar
            data={stakeDistributionData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  labels: { color: palette.textSecondary, font: { size: 10 } },
                  position: 'top',
                },
                tooltip: {
                  callbacks: {
                    label: (ctx) => `${ctx.dataset.label}: ${(ctx.parsed.y ?? 0).toLocaleString()} WRF`,
                  },
                },
              },
              scales: {
                x: {
                  stacked: true,
                  ticks: { color: palette.textSecondary, font: { size: 8 }, maxRotation: 45 },
                  grid: { display: false },
                },
                y: {
                  stacked: true,
                  ticks: {
                    color: palette.textSecondary,
                    font: { size: 9 },
                    callback: (v) => (Number(v) / 1000).toFixed(0) + 'k',
                  },
                  grid: { color: palette.border },
                },
              },
            }}
          />
        </Box>
        <Typography variant="caption" sx={{ color: palette.textSecondary, display: 'block', mt: 1, textAlign: 'center' }}>
          Total Network Stake: <span style={{ color: palette.text, fontWeight: 600 }}>{totalStake.toLocaleString()} WRF</span>
        </Typography>
      </Paper>

      {/* Validator table */}
      <Paper sx={{ bgcolor: palette.card, borderRadius: 2, overflow: 'hidden', mb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {(['rank', 'Validator', 'totalStake', 'uptime', 'blocksProposed', 'attestations', 'Status'] as const).map(col => {
                const sortable = ['rank', 'totalStake', 'uptime', 'blocksProposed', 'attestations'].includes(col);
                return (
                  <TableCell
                    key={col}
                    sx={{
                      color: palette.textSecondary,
                      fontSize: 10,
                      fontWeight: 600,
                      borderBottom: `1px solid ${palette.border}`,
                      py: 0.75,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {sortable ? (
                      <TableSortLabel
                        active={sortField === col}
                        direction={sortField === col ? sortDir : 'asc'}
                        onClick={() => handleSort(col as SortField)}
                        sx={{
                          color: `${palette.textSecondary} !important`,
                          '& .MuiTableSortLabel-icon': { color: `${palette.textSecondary} !important` },
                        }}
                      >
                        {col === 'totalStake' ? 'Stake (WRF)' :
                          col === 'blocksProposed' ? 'Blocks' :
                            col === 'attestations' ? 'Attest.' :
                              col.charAt(0).toUpperCase() + col.slice(1)}
                      </TableSortLabel>
                    ) : (
                      col === 'Validator' ? 'Validator' : col
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedValidators.map(v => (
              <TableRow key={v.rank} sx={{ '&:hover': { bgcolor: 'rgba(59,130,246,0.06)' } }}>
                <TableCell sx={{ color: palette.text, fontSize: 11, borderBottom: `1px solid ${palette.border}`, py: 0.75, fontWeight: 600 }}>
                  {v.rank}
                </TableCell>
                <TableCell sx={{ borderBottom: `1px solid ${palette.border}`, py: 0.75 }}>
                  <Typography variant="caption" sx={{ color: palette.text, fontWeight: 500, display: 'block', fontSize: 11 }}>
                    {v.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: palette.textSecondary, fontFamily: 'monospace', fontSize: 9 }}>
                    {v.address}
                  </Typography>
                </TableCell>
                <TableCell sx={{ borderBottom: `1px solid ${palette.border}`, py: 0.75 }}>
                  <Typography variant="caption" sx={{ color: palette.text, fontSize: 11 }}>
                    {v.totalStake.toLocaleString()}
                  </Typography>
                  <Box sx={{ mt: 0.25 }}>
                    <LinearProgress
                      variant="determinate"
                      value={(v.totalStake / validators[0].totalStake) * 100}
                      sx={{
                        height: 3,
                        borderRadius: 1,
                        bgcolor: palette.border,
                        '& .MuiLinearProgress-bar': { bgcolor: palette.primary },
                      }}
                    />
                  </Box>
                </TableCell>
                <TableCell sx={{ borderBottom: `1px solid ${palette.border}`, py: 0.75 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: v.uptime >= 99.5 ? palette.success : v.uptime >= 99 ? palette.warning : palette.error,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {v.uptime > 0 ? v.uptime.toFixed(2) + '%' : '--'}
                  </Typography>
                </TableCell>
                <TableCell sx={{ color: palette.text, fontSize: 11, borderBottom: `1px solid ${palette.border}`, py: 0.75 }}>
                  {v.blocksProposed.toLocaleString()}
                </TableCell>
                <TableCell sx={{ color: palette.text, fontSize: 11, borderBottom: `1px solid ${palette.border}`, py: 0.75 }}>
                  {v.attestations.toLocaleString()}
                </TableCell>
                <TableCell sx={{ borderBottom: `1px solid ${palette.border}`, py: 0.75 }}>
                  <Chip
                    label={v.status.toUpperCase()}
                    size="small"
                    sx={{
                      bgcolor: STATUS_COLORS[v.status] + '22',
                      color: STATUS_COLORS[v.status],
                      fontSize: 9,
                      height: 20,
                      fontWeight: 600,
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Slashing history */}
      {allSlashingEvents.length > 0 && (
        <Paper sx={{ bgcolor: palette.card, borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ px: 1.5, py: 1 }}>
            <Typography variant="caption" sx={{ color: palette.error, fontWeight: 600 }}>
              Slashing History ({allSlashingEvents.length} events)
            </Typography>
          </Box>
          <Divider sx={{ borderColor: palette.border }} />
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: palette.textSecondary, fontSize: 10, borderBottom: `1px solid ${palette.border}`, py: 0.5 }}>Validator</TableCell>
                <TableCell sx={{ color: palette.textSecondary, fontSize: 10, borderBottom: `1px solid ${palette.border}`, py: 0.5 }}>Epoch</TableCell>
                <TableCell sx={{ color: palette.textSecondary, fontSize: 10, borderBottom: `1px solid ${palette.border}`, py: 0.5 }}>Reason</TableCell>
                <TableCell sx={{ color: palette.textSecondary, fontSize: 10, borderBottom: `1px solid ${palette.border}`, py: 0.5 }}>Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allSlashingEvents.map((evt, i) => (
                <TableRow key={i}>
                  <TableCell sx={{ color: palette.text, fontSize: 10, borderBottom: `1px solid ${palette.border}`, py: 0.5 }}>{evt.validator}</TableCell>
                  <TableCell sx={{ color: palette.textSecondary, fontSize: 10, borderBottom: `1px solid ${palette.border}`, py: 0.5 }}>{evt.epoch}</TableCell>
                  <TableCell sx={{ color: palette.warning, fontSize: 10, borderBottom: `1px solid ${palette.border}`, py: 0.5 }}>{evt.reason}</TableCell>
                  <TableCell sx={{ color: palette.error, fontSize: 10, fontWeight: 600, borderBottom: `1px solid ${palette.border}`, py: 0.5 }}>-{evt.amount} WRF</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
};

// frontend#324: every figure in ValidatorPanelSample is generated in-component; nothing
// on the testnet API backs it. The default build renders the honest not-live
// state and never mounts the sample.
const ValidatorPanel: React.FC<ValidatorPanelProps> = (props) => (
  <DemoSurfaceGate
    title="Validator set is not live on the testnet yet"
    description="No validator route is mounted on the testnet API, so the producer set cannot be listed here."
    testId="validator-panel"
  >
    <ValidatorPanelSample {...props} />
  </DemoSurfaceGate>
);

export default ValidatorPanel;
