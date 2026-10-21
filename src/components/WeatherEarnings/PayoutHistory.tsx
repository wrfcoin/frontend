import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Pagination,
  Chip,
  SelectChangeEvent,
  CircularProgress,
  Alert,
} from '@mui/material';
import { earningsService } from '../../services/apiClient';
import { formatExactAmount, sumExactBaseUnits } from '../../services/apiClient/amountPrecision';
import { toBaseUnits } from '../../services/apiClient/number';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PayoutEntry {
  id: string;
  date: string;
  amount: string | null;
  rewardType: string;
  qualityScore: number | null;
  txHash: string | null;
}

type SortField = 'date' | 'amount' | 'rewardType' | 'qualityScore';
type SortDir = 'asc' | 'desc';

interface PayoutHistoryProps {
  stationId: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROWS_PER_PAGE = 20;

const REWARD_TYPES = [
  'Data Quality Bonus',
  'Consistency Streak',
  'Spatial Coverage',
  'Network Participation',
  'Referral Reward',
];

const REWARD_COLORS: Record<string, string> = {
  'Data Quality Bonus': '#3B82F6',
  'Consistency Streak': '#10B981',
  'Spatial Coverage': '#8B5CF6',
  'Network Participation': '#F59E0B',
  'Referral Reward': '#EC4899',
};

const REWARD_TYPE_LABELS: Record<string, string> = {
  base_reward: 'Network Participation',
  accuracy_bonus: 'Data Quality Bonus',
  uptime_bonus: 'Consistency Streak',
  quality_bonus: 'Data Quality Bonus',
  penalty: 'Network Participation',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncateHash(hash: string | null): string {
  if (!hash) return 'Unavailable';
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}

export function compareExactBaseUnits(left: string | null, right: string | null): number {
  const leftUnits = toBaseUnits(left);
  const rightUnits = toBaseUnits(right);
  if (leftUnits === null && rightUnits === null) return 0;
  if (leftUnits === null) return -1;
  if (rightUnits === null) return 1;
  return leftUnits < rightUnits ? -1 : leftUnits > rightUnits ? 1 : 0;
}

export function formatPayoutAmount(value: string | null): string {
  return formatExactAmount(value, 4);
}

export function sumPayoutAmounts(values: Array<string | null>): string | null {
  return sumExactBaseUnits(values);
}

function copyToClipboard(text: string): void {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => {
      /* silent fallback */
    });
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PayoutHistory: React.FC<PayoutHistoryProps> = ({ stationId }) => {
  const [allPayouts, setAllPayouts] = useState<PayoutEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    earningsService.getStationHistory(stationId)
      .then((transactions) => {
        const entries: PayoutEntry[] = transactions.map(tx => ({
          id: tx.id,
          date: tx.timestamp,
          amount: tx.amount,
          rewardType: REWARD_TYPE_LABELS[tx.rewardType] ?? tx.rewardType,
          qualityScore: tx.qualityScore ?? null,
          txHash: tx.txHash ?? null,
        }));
        setAllPayouts(entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      })
      .catch((error: unknown) => setLoadError(
        error instanceof Error ? `Payout history unavailable: ${error.message}` : 'Payout history unavailable',
      ))
      .finally(() => setLoading(false));
  }, [stationId]);

  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Filter
  const filtered = useMemo(() => {
    let data = [...allPayouts];

    if (filterType !== 'all') {
      data = data.filter((p) => p.rewardType === filterType);
    }

    if (filterDateRange !== 'all') {
      const now = Date.now();
      const ranges: Record<string, number> = {
        '7d': 7 * 86400000,
        '30d': 30 * 86400000,
        '90d': 90 * 86400000,
      };
      const range = ranges[filterDateRange];
      if (range !== undefined) {
        const cutoff = now - range;
        data = data.filter((p) => new Date(p.date).getTime() >= cutoff);
      }
    }

    return data;
  }, [allPayouts, filterType, filterDateRange]);

  // Sort
  const sorted = useMemo(() => {
    const data = [...filtered];
    data.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
      case 'date':
        cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case 'amount':
        cmp = compareExactBaseUnits(a.amount, b.amount);
        break;
      case 'rewardType':
        cmp = a.rewardType.localeCompare(b.rewardType);
        break;
      case 'qualityScore':
        cmp = a.qualityScore == null && b.qualityScore == null
          ? 0
          : a.qualityScore == null
            ? -1
            : b.qualityScore == null
              ? 1
              : a.qualityScore - b.qualityScore;
        break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return data;
  }, [filtered, sortField, sortDir]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const paginated = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return sorted.slice(start, start + ROWS_PER_PAGE);
  }, [sorted, page]);

  // Totals
  const totalFiltered = useMemo(() => sumPayoutAmounts(filtered.map((payout) => payout.amount)), [filtered]);

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDir('desc');
      }
      setPage(1);
    },
    [sortField],
  );

  const handleFilterType = useCallback((e: SelectChangeEvent<string>) => {
    setFilterType(e.target.value);
    setPage(1);
  }, []);

  const handleFilterDate = useCallback((e: SelectChangeEvent<string>) => {
    setFilterDateRange(e.target.value);
    setPage(1);
  }, []);

  const handleCopy = useCallback((hash: string) => {
    copyToClipboard(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  }, []);

  const cellSx = { color: '#E2E8F0', borderBottom: '1px solid #334155', py: 1.5, fontSize: '0.8rem' };
  const headerSx = { color: '#94A3B8', borderBottom: '1px solid #334155', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em' };

  if (loading) {
    return (
      <Paper elevation={0} sx={{ borderRadius: 2, bgcolor: '#1E293B', border: '1px solid #334155', p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={32} sx={{ color: '#3B82F6' }} />
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ borderRadius: 2, bgcolor: '#1E293B', border: '1px solid #334155', overflow: 'hidden' }}>
      {loadError && <Alert severity="error" sx={{ m: 2 }}>{loadError}</Alert>}
      {/* Filters */}
      <Box sx={{ p: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2 }}>
        <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 700 }}>
          Payout History
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel sx={{ color: '#94A3B8' }}>Reward Type</InputLabel>
            <Select
              value={filterType}
              label="Reward Type"
              onChange={handleFilterType}
              sx={{
                color: '#E2E8F0',
                '.MuiOutlinedInput-notchedOutline': { borderColor: '#334155' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3B82F6' },
                '.MuiSvgIcon-root': { color: '#94A3B8' },
              }}
            >
              <MenuItem value="all">All Types</MenuItem>
              {REWARD_TYPES.map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ color: '#94A3B8' }}>Date Range</InputLabel>
            <Select
              value={filterDateRange}
              label="Date Range"
              onChange={handleFilterDate}
              sx={{
                color: '#E2E8F0',
                '.MuiOutlinedInput-notchedOutline': { borderColor: '#334155' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3B82F6' },
                '.MuiSvgIcon-root': { color: '#94A3B8' },
              }}
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="90d">Last 90 Days</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Table */}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#0F172A' }}>
              <TableCell sx={headerSx}>
                <TableSortLabel
                  active={sortField === 'date'}
                  direction={sortField === 'date' ? sortDir : 'desc'}
                  onClick={() => handleSort('date')}
                  sx={{ color: '#94A3B8 !important', '& .MuiTableSortLabel-icon': { color: '#94A3B8 !important' } }}
                >
                  Date
                </TableSortLabel>
              </TableCell>
              <TableCell sx={headerSx}>
                <TableSortLabel
                  active={sortField === 'amount'}
                  direction={sortField === 'amount' ? sortDir : 'desc'}
                  onClick={() => handleSort('amount')}
                  sx={{ color: '#94A3B8 !important', '& .MuiTableSortLabel-icon': { color: '#94A3B8 !important' } }}
                >
                  Amount (WRF)
                </TableSortLabel>
              </TableCell>
              <TableCell sx={headerSx}>
                <TableSortLabel
                  active={sortField === 'rewardType'}
                  direction={sortField === 'rewardType' ? sortDir : 'desc'}
                  onClick={() => handleSort('rewardType')}
                  sx={{ color: '#94A3B8 !important', '& .MuiTableSortLabel-icon': { color: '#94A3B8 !important' } }}
                >
                  Reward Type
                </TableSortLabel>
              </TableCell>
              <TableCell sx={headerSx}>
                <TableSortLabel
                  active={sortField === 'qualityScore'}
                  direction={sortField === 'qualityScore' ? sortDir : 'desc'}
                  onClick={() => handleSort('qualityScore')}
                  sx={{ color: '#94A3B8 !important', '& .MuiTableSortLabel-icon': { color: '#94A3B8 !important' } }}
                >
                  Quality
                </TableSortLabel>
              </TableCell>
              <TableCell sx={headerSx}>Tx Hash</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: 'center', py: 6, color: '#64748B', borderBottom: 'none' }}>
                  No payout history yet
                </TableCell>
              </TableRow>
            )}
            {paginated.map((payout) => {
              const color = REWARD_COLORS[payout.rewardType] || '#94A3B8';
              const qualityColor = payout.qualityScore == null
                ? '#94A3B8'
                : payout.qualityScore >= 90 ? '#10B981' : payout.qualityScore >= 80 ? '#F59E0B' : '#EF4444';
              return (
                <TableRow
                  key={payout.id}
                  sx={{
                    '&:hover': { bgcolor: 'rgba(59,130,246,0.04)' },
                    transition: 'background-color 0.15s',
                  }}
                >
                  <TableCell sx={cellSx}>
                    <Box>
                      <Typography variant="body2" sx={{ color: '#E2E8F0', fontSize: '0.8rem' }}>
                        {new Date(payout.date).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.65rem' }}>
                        {new Date(payout.date).toLocaleTimeString()}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={cellSx}>
                    <Typography variant="body2" sx={{ color: '#10B981', fontWeight: 600, fontSize: '0.8rem' }}>
                      +{formatPayoutAmount(payout.amount)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={cellSx}>
                    <Chip
                      label={payout.rewardType}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        bgcolor: `${color}15`,
                        color,
                        border: `1px solid ${color}30`,
                      }}
                    />
                  </TableCell>
                  <TableCell sx={cellSx}>
                    <Typography variant="body2" sx={{ color: qualityColor, fontWeight: 600, fontSize: '0.8rem' }}>
                      {payout.qualityScore == null ? 'Unavailable' : payout.qualityScore}
                    </Typography>
                  </TableCell>
                  <TableCell sx={cellSx}>
                    <Tooltip title={copiedHash === payout.txHash ? 'Copied!' : 'Click to copy'} arrow>
                      <Box
                        component="span"
                        onClick={() => { if (payout.txHash) handleCopy(payout.txHash); }}
                        sx={{
                          cursor: 'pointer',
                          fontFamily: 'monospace',
                          fontSize: '0.7rem',
                          color: '#64748B',
                          '&:hover': { color: '#3B82F6' },
                          transition: 'color 0.15s',
                        }}
                      >
                        {truncateHash(payout.txHash)}
                      </Box>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Footer: Total + Pagination */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          borderTop: '1px solid #334155',
          bgcolor: '#0F172A',
        }}
      >
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Typography variant="body2" sx={{ color: '#94A3B8' }}>
            Showing {paginated.length} of {sorted.length} payouts
          </Typography>
          <Typography variant="body2" sx={{ color: '#94A3B8' }}>
            Total: <Box component="span" sx={{ color: '#10B981', fontWeight: 700 }}>{formatExactAmount(totalFiltered, 2)} WRF</Box>
          </Typography>
        </Box>
        {totalPages > 1 && (
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, p) => setPage(p)}
            size="small"
            sx={{
              '.MuiPaginationItem-root': {
                color: '#94A3B8',
                borderColor: '#334155',
                '&.Mui-selected': { bgcolor: '#3B82F6', color: '#FFFFFF' },
              },
            }}
          />
        )}
      </Box>
    </Paper>
  );
};

export default PayoutHistory;
