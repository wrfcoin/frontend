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
} from '@mui/material';

// --- Types ---

interface Validator {
  rank: number;
  name: string;
  address: string;
  stake: number;
  uptime: number;
  blocksProposed: number;
  status: 'active' | 'slashed' | 'jailed';
}

type SortField = 'rank' | 'stake' | 'uptime' | 'blocksProposed';
type SortDirection = 'asc' | 'desc';

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
  slashed: palette.error,
  jailed: palette.warning,
};

// --- Mock Data ---

function generateMockValidators(): Validator[] {
  return [
    { rank: 1, name: 'WRF Validator Alpha', address: 'wrfval1q8z...3k7d', stake: 250000, uptime: 99.97, blocksProposed: 14523, status: 'active' },
    { rank: 2, name: 'StormNode Capital', address: 'wrfval1m2n...9p4x', stake: 180000, uptime: 99.94, blocksProposed: 11234, status: 'active' },
    { rank: 3, name: 'Climate Stakers', address: 'wrfval1v6t...2h8j', stake: 150000, uptime: 99.91, blocksProposed: 9876, status: 'active' },
    { rank: 4, name: 'WeatherDAO Collective', address: 'wrfval1f4r...7w1c', stake: 120000, uptime: 99.88, blocksProposed: 8234, status: 'active' },
    { rank: 5, name: 'TempGuard Labs', address: 'wrfval1d9s...5a6y', stake: 95000, uptime: 99.85, blocksProposed: 7012, status: 'active' },
    { rank: 6, name: 'Barometric Pool', address: 'wrfval1k3p...8m2b', stake: 85000, uptime: 99.82, blocksProposed: 6543, status: 'active' },
    { rank: 7, name: 'Anemometer DAO', address: 'wrfval1h7g...4n3t', stake: 72000, uptime: 99.76, blocksProposed: 5432, status: 'active' },
    { rank: 8, name: 'FrostByte Systems', address: 'wrfval1j5w...6r9q', stake: 60000, uptime: 99.71, blocksProposed: 4890, status: 'active' },
    { rank: 9, name: 'Celsius Networks', address: 'wrfval1a2b...c3d4', stake: 52000, uptime: 99.65, blocksProposed: 4321, status: 'active' },
    { rank: 10, name: 'HumidityVault', address: 'wrfval1e5f...g6h7', stake: 45000, uptime: 99.54, blocksProposed: 3987, status: 'active' },
    { rank: 11, name: 'Dewpoint Capital', address: 'wrfval1i8j...k9l0', stake: 38000, uptime: 98.32, blocksProposed: 3210, status: 'slashed' },
    { rank: 12, name: 'WindShear Protocol', address: 'wrfval1m1n...o2p3', stake: 31000, uptime: 99.42, blocksProposed: 2876, status: 'active' },
    { rank: 13, name: 'ThunderStake', address: 'wrfval1q4r...s5t6', stake: 25000, uptime: 97.89, blocksProposed: 2345, status: 'active' },
    { rank: 14, name: 'IsobarNode', address: 'wrfval1u7v...w8x9', stake: 18000, uptime: 0, blocksProposed: 1567, status: 'jailed' },
    { rank: 15, name: 'PrecipStake', address: 'wrfval1y0z...a1b2', stake: 12000, uptime: 96.20, blocksProposed: 987, status: 'active' },
  ];
}

// --- Component ---

const ValidatorGridSample: React.FC = () => {
  const validators = useMemo(() => generateMockValidators(), []);
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDir(field === 'rank' ? 'asc' : 'desc');
      }
    },
    [sortField],
  );

  const sortedValidators = useMemo(() => {
    const sorted = [...validators];
    sorted.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const cmp =
        typeof aVal === 'number' && typeof bVal === 'number'
          ? aVal - bVal
          : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [validators, sortField, sortDir]);

  const totalStake = useMemo(
    () => validators.reduce((s, v) => s + v.stake, 0),
    [validators],
  );

  const activeCount = validators.filter(v => v.status === 'active').length;

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 2 }}>
      {/* Summary stats */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Paper
          sx={{
            bgcolor: palette.card,
            px: 1.5,
            py: 0.75,
            borderRadius: 1.5,
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: palette.textSecondary }}
          >
            Total Validators:{' '}
            <span style={{ color: palette.text, fontWeight: 600 }}>
              {validators.length}
            </span>
          </Typography>
        </Paper>
        <Paper
          sx={{
            bgcolor: palette.card,
            px: 1.5,
            py: 0.75,
            borderRadius: 1.5,
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: palette.textSecondary }}
          >
            Active:{' '}
            <span style={{ color: palette.success, fontWeight: 600 }}>
              {activeCount}
            </span>
          </Typography>
        </Paper>
        <Paper
          sx={{
            bgcolor: palette.card,
            px: 1.5,
            py: 0.75,
            borderRadius: 1.5,
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: palette.textSecondary }}
          >
            Total Stake:{' '}
            <span style={{ color: palette.text, fontWeight: 600 }}>
              {totalStake.toLocaleString()} WRF
            </span>
          </Typography>
        </Paper>
      </Stack>

      {/* Validator table */}
      <Paper
        sx={{ bgcolor: palette.card, borderRadius: 2, overflow: 'hidden' }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              {(
                [
                  { field: 'rank' as const, label: 'Rank', sortable: true },
                  { field: null, label: 'Validator', sortable: false },
                  { field: 'stake' as const, label: 'Stake (WRF)', sortable: true },
                  { field: 'uptime' as const, label: 'Uptime %', sortable: true },
                  { field: 'blocksProposed' as const, label: 'Blocks', sortable: true },
                  { field: null, label: 'Status', sortable: false },
                ]
              ).map((col, i) => (
                <TableCell
                  key={i}
                  sx={{
                    color: palette.textSecondary,
                    fontSize: 10,
                    fontWeight: 600,
                    borderBottom: `1px solid ${palette.border}`,
                    py: 0.75,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {col.sortable && col.field ? (
                    <TableSortLabel
                      active={sortField === col.field}
                      direction={sortField === col.field ? sortDir : 'asc'}
                      onClick={() => handleSort(col.field!)}
                      sx={{
                        color: `${palette.textSecondary} !important`,
                        '& .MuiTableSortLabel-icon': {
                          color: `${palette.textSecondary} !important`,
                        },
                      }}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedValidators.map(v => (
              <TableRow
                key={v.rank}
                sx={{ '&:hover': { bgcolor: 'rgba(59,130,246,0.06)' } }}
              >
                <TableCell
                  sx={{
                    color: palette.text,
                    fontSize: 11,
                    borderBottom: `1px solid ${palette.border}`,
                    py: 0.75,
                    fontWeight: 600,
                  }}
                >
                  {v.rank}
                </TableCell>
                <TableCell
                  sx={{
                    borderBottom: `1px solid ${palette.border}`,
                    py: 0.75,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: palette.text,
                      fontWeight: 500,
                      display: 'block',
                      fontSize: 11,
                    }}
                  >
                    {v.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: palette.textSecondary,
                      fontFamily: 'monospace',
                      fontSize: 9,
                    }}
                  >
                    {v.address}
                  </Typography>
                </TableCell>
                <TableCell
                  sx={{
                    borderBottom: `1px solid ${palette.border}`,
                    py: 0.75,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: palette.text, fontSize: 11 }}
                  >
                    {v.stake.toLocaleString()}
                  </Typography>
                  <Box sx={{ mt: 0.25 }}>
                    <LinearProgress
                      variant="determinate"
                      value={(v.stake / validators[0].stake) * 100}
                      sx={{
                        height: 3,
                        borderRadius: 1,
                        bgcolor: palette.border,
                        '& .MuiLinearProgress-bar': {
                          bgcolor: palette.primary,
                        },
                      }}
                    />
                  </Box>
                </TableCell>
                <TableCell
                  sx={{
                    borderBottom: `1px solid ${palette.border}`,
                    py: 0.75,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color:
                        v.uptime >= 99.5
                          ? palette.success
                          : v.uptime >= 99
                            ? palette.warning
                            : palette.error,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {v.uptime > 0 ? v.uptime.toFixed(2) + '%' : '--'}
                  </Typography>
                </TableCell>
                <TableCell
                  sx={{
                    color: palette.text,
                    fontSize: 11,
                    borderBottom: `1px solid ${palette.border}`,
                    py: 0.75,
                  }}
                >
                  {v.blocksProposed.toLocaleString()}
                </TableCell>
                <TableCell
                  sx={{
                    borderBottom: `1px solid ${palette.border}`,
                    py: 0.75,
                  }}
                >
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
    </Box>
  );
};

// frontend#324: every figure in ValidatorGridSample is generated in-component; nothing
// on the testnet API backs it. The default build renders the honest not-live
// state and never mounts the sample.
const ValidatorGrid: React.FC = (props) => (
  <DemoSurfaceGate
    title="Validator set is not live on the testnet yet"
    description="No validator route is mounted on the testnet API, so the producer set cannot be listed here."
    testId="validator-grid"
  >
    <ValidatorGridSample {...props} />
  </DemoSurfaceGate>
);

export default ValidatorGrid;
