import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  SelectChangeEvent,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useWeatherEarnings, useWeatherEarningsHistory } from '../../hooks/api/useEarningsQueries';
import { useStationQuality, useWeatherStations } from '../../hooks/api/useWeatherQueries';
import EarningsChart from './EarningsChart';
import EarningsProjection from './EarningsProjection';
import PayoutHistory from './PayoutHistory';
import RewardBreakdown from './RewardBreakdown';
import { formatBaseUnitsToWrf } from '../../services/apiClient/number';
import PublicViewerNotice from '../common/PublicViewerNotice';
import { STATION_QUALITY_NOT_LIVE } from '../../services/apiClient/weatherService';
import { FEATURES } from '../../config/features';
import type { EarningsWindow } from '../../services/apiClient/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StationSummary {
  id: string;
  name: string;
  location: string;
  qualityScore: number;
  isOnline: boolean;
}

export interface EarningEntry {
  id: string;
  timestamp: string;
  amount: string;
  rewardType: string;
  stationId: string;
  qualityScore: number;
  txHash: string;
}

export interface EarningsPeriodSummary {
  today: string | null;
  thisWeek: string | null;
  thisMonth: string | null;
  allTime: string | null;
  currentRate: string | null; // base units per hour
  window: EarningsWindow | null;
}

type PeriodView = 'daily' | 'weekly' | 'monthly';

// Testnet WRF has no monetary value, so the page shows no currency figure.
// Totals come from the backend's recent-observation window (core4 reward
// evidence), never a lifetime sum. Projections and the per-type breakdown have
// no backend source; they render only in demo builds (FEATURES.demoSurfaces).

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface SummaryCardProps {
  label: string;
  wrf: string | null;
  highlight?: boolean;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, wrf, highlight }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.5,
      borderRadius: 2,
      bgcolor: highlight ? '#10B981' : '#1E293B',
      border: highlight ? '1px solid #34D399' : '1px solid #334155',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: highlight ? '0 4px 20px rgba(16,185,129,0.25)' : '0 4px 20px rgba(59,130,246,0.15)',
      },
    }}
  >
    <Typography variant="caption" sx={{ color: highlight ? 'rgba(255,255,255,0.8)' : '#94A3B8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {label}
    </Typography>
    <Typography variant="h5" sx={{ color: '#FFFFFF', fontWeight: 700, mt: 0.5 }}>
      {formatBaseUnitsToWrf(wrf, 2) ?? '—'} WRF
    </Typography>
    <Typography variant="body2" sx={{ color: highlight ? 'rgba(255,255,255,0.7)' : '#64748B', mt: 0.25 }}>
      within the recent window
    </Typography>
  </Paper>
);

interface RecentEarningRowProps {
  entry: EarningEntry;
}

const RecentEarningRow: React.FC<RecentEarningRowProps> = ({ entry }) => {
  const typeColors: Record<string, string> = {
    'Data Quality Bonus': '#3B82F6',
    'Consistency Streak': '#10B981',
    'Spatial Coverage': '#8B5CF6',
    'Network Participation': '#F59E0B',
    'Referral Reward': '#EC4899',
  };
  const color = typeColors[entry.rewardType] || '#94A3B8';
  const relativeTime = formatRelativeTime(entry.timestamp);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.25, borderBottom: '1px solid #1E293B', '&:last-child': { borderBottom: 'none' } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
        <Box>
          <Typography variant="body2" sx={{ color: '#E2E8F0', fontWeight: 500 }}>
            {entry.rewardType}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B' }}>
            {relativeTime}
          </Typography>
        </Box>
      </Box>
      <Typography variant="body2" sx={{ color: '#10B981', fontWeight: 600 }}>
        +{formatBaseUnitsToWrf(entry.amount, 4) ?? '—'} WRF
      </Typography>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}


// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const EarningsDashboard: React.FC = () => {
  const [selectedStation, setSelectedStation] = useState<string>('');
  const [periodView, setPeriodView] = useState<PeriodView>('daily');
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'projection'>('overview');

  const stationsQuery = useWeatherStations();
  const stations = stationsQuery.data || [];

  const selectedStationId = selectedStation || undefined;
  const summaryQuery = useWeatherEarnings(selectedStationId);
  const historyQuery = useWeatherEarningsHistory(selectedStationId);
  const qualityQuery = useStationQuality(selectedStationId);

  useEffect(() => {
    if (!selectedStation && stations.length > 0) {
      setSelectedStation(stations[0].id);
    }
  }, [selectedStation, stations]);

  useEffect(() => {
    if (selectedStation && stations.length > 0 && !stations.some(stationItem => stationItem.id === selectedStation)) {
      setSelectedStation(stations[0].id);
    }
  }, [selectedStation, stations]);

  const station = useMemo(
    () => stations.find(stationItem => stationItem.id === selectedStation),
    [selectedStation, stations],
  );

  const summary = useMemo<EarningsPeriodSummary>(() => ({
    today: summaryQuery.data?.today ?? null,
    thisWeek: summaryQuery.data?.thisWeek ?? null,
    thisMonth: summaryQuery.data?.thisMonth ?? null,
    allTime: summaryQuery.data?.allTime ?? null,
    currentRate: summaryQuery.data?.currentRate ?? null,
    window: summaryQuery.data?.window ?? null,
  }), [summaryQuery.data]);

  const recentEarnings = useMemo<EarningEntry[]>(
    () =>
      [...(historyQuery.data || [])]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10)
        .map(entry => ({
          id: entry.id,
          timestamp: entry.timestamp,
          amount: entry.amount,
          rewardType: entry.rewardType,
          stationId: entry.stationId,
          qualityScore: entry.qualityScore ?? 0,
          txHash: entry.txHash || '',
        })),
    [historyQuery.data],
  );

  const stationSummary: StationSummary = useMemo(() => ({
    id: station?.id || 'unknown',
    name: station?.name || 'Unknown station',
    location: station?.location || 'Unknown',
    qualityScore: Number((qualityQuery.data?.overall ?? 0).toFixed(1)),
    isOnline: station?.status === 'live',
  }), [station, qualityQuery.data]);

  const handleStationChange = useCallback((event: SelectChangeEvent<string>) => {
    setSelectedStation(event.target.value);
  }, []);

  const handlePeriodChange = useCallback((_: React.MouseEvent<HTMLElement>, value: PeriodView | null) => {
    if (value) setPeriodView(value);
  }, []);

  const handleTabChange = useCallback((_: React.MouseEvent<HTMLElement>, value: string | null) => {
    if (value) setActiveTab(value as 'overview' | 'history' | 'projection');
  }, []);

  if (stationsQuery.isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#0F172A', p: { xs: 2, md: 3 } }}>
        <Skeleton variant="rounded" height={64} sx={{ bgcolor: '#1E293B', mb: 2 }} />
        <Skeleton variant="rounded" height={220} sx={{ bgcolor: '#1E293B', mb: 2 }} />
        <Skeleton variant="rounded" height={280} sx={{ bgcolor: '#1E293B' }} />
      </Box>
    );
  }

  if (stationsQuery.isError) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#0F172A', p: { xs: 2, md: 3 } }}>
        <Alert severity="error" sx={{ bgcolor: 'rgba(239,68,68,0.12)', color: '#FECACA' }}>
          {getErrorMessage(stationsQuery.error, 'Unable to load weather stations.')}
        </Alert>
      </Box>
    );
  }

  if (stations.length === 0) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#0F172A', p: { xs: 2, md: 3 } }}>
        <Alert severity="info" sx={{ bgcolor: 'rgba(59,130,246,0.12)', color: '#BFDBFE' }}>
          No weather stations available for earnings analytics.
        </Alert>
      </Box>
    );
  }

  if (!selectedStationId) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#0F172A', p: { xs: 2, md: 3 } }}>
        <Skeleton variant="rounded" height={64} sx={{ bgcolor: '#1E293B', mb: 2 }} />
        <Skeleton variant="rounded" height={220} sx={{ bgcolor: '#1E293B' }} />
      </Box>
    );
  }

  const stationDataError = summaryQuery.error || historyQuery.error || qualityQuery.error;
  const stationDataNotLive = stationDataError instanceof Error &&
    (stationDataError.name === 'StationEarningsUnavailableError' || stationDataError.message === STATION_QUALITY_NOT_LIVE);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0F172A', color: '#E2E8F0', p: { xs: 2, md: 3 } }}>
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        {/* ---- Header ---- */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, mb: 3, gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#FFFFFF' }}>
              Weather Earnings
            </Typography>
            <Typography variant="body2" sx={{ color: '#94A3B8', mt: 0.5 }}>
              Track your WRF token rewards from weather data contributions
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel sx={{ color: '#94A3B8' }}>Station</InputLabel>
              <Select
                value={selectedStation}
                label="Station"
                onChange={handleStationChange}
                sx={{
                  color: '#E2E8F0',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: '#334155' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3B82F6' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3B82F6' },
                  '.MuiSvgIcon-root': { color: '#94A3B8' },
                }}
              >
                {stations.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.status === 'live' ? '#10B981' : '#EF4444' }} />
                      {s.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <ToggleButtonGroup
              size="small"
              exclusive
              value={periodView}
              onChange={handlePeriodChange}
              sx={{
                '.MuiToggleButton-root': {
                  color: '#94A3B8',
                  borderColor: '#334155',
                  textTransform: 'none',
                  px: 2,
                  '&.Mui-selected': { bgcolor: '#3B82F6', color: '#FFFFFF', borderColor: '#3B82F6' },
                  '&.Mui-selected:hover': { bgcolor: '#2563EB' },
                },
              }}
            >
              <ToggleButton value="daily">Daily</ToggleButton>
              <ToggleButton value="weekly">Weekly</ToggleButton>
              <ToggleButton value="monthly">Monthly</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {summaryQuery.isLoading || historyQuery.isLoading || qualityQuery.isLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Skeleton variant="rounded" height={220} sx={{ bgcolor: '#1E293B' }} />
            <Skeleton variant="rounded" height={120} sx={{ bgcolor: '#1E293B' }} />
            <Skeleton variant="rounded" height={280} sx={{ bgcolor: '#1E293B' }} />
          </Box>
        ) : stationDataNotLive ? (
          <PublicViewerNotice reason="not-live" />
        ) : stationDataError ? (
          <Alert severity="error" sx={{ mb: 3, bgcolor: 'rgba(239,68,68,0.12)', color: '#FECACA' }}>
            {getErrorMessage(stationDataError, 'Unable to load station earnings data.')}
          </Alert>
        ) : (
          <>
        {/* ---- Recent-window rewards ---- */}
        <Paper
              elevation={0}
              sx={{
                p: { xs: 3, md: 4 },
                mb: 3,
                borderRadius: 3,
                bgcolor: '#1E293B',
                border: '1px solid #334155',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  background: 'linear-gradient(90deg, #3B82F6, #10B981)',
                },
              }}
            >
          <Typography variant="overline" sx={{ color: '#94A3B8', letterSpacing: '0.12em' }}>
            Rewarded in the recent window
          </Typography>
          <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  mt: 1,
                  background: 'linear-gradient(135deg, #10B981, #3B82F6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                }}
              >
            {formatBaseUnitsToWrf(summary.window?.rewardedBaseUnits ?? null, 2) ?? '—'} WRF
          </Typography>
          <Typography variant="body2" data-testid="earnings-window-note" sx={{ color: '#64748B', mt: 0.5 }}>
            {summary.window
                  ? `${summary.window.rewardedCommits} rewarded of the last ${summary.window.commits} observations`
                + (summary.window.unknownCommits > 0 ? `; ${summary.window.unknownCommits} without readable evidence yet` : '')
                + (summary.window.complete ? '' : '; partial window')
                + '. Not a lifetime total. Testnet WRF has no monetary value.'
                  : 'Reward evidence unavailable.'}
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2, flexWrap: 'wrap' }}>
            <Chip
                  label={`Station: ${stationSummary.name}`}
                  size="small"
                  sx={{ bgcolor: '#334155', color: '#E2E8F0' }}
                />
            <Chip
                  label={`Quality: ${stationSummary.qualityScore}/100`}
                  size="small"
                  sx={{
                    bgcolor: stationSummary.qualityScore >= 90 ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                    color: stationSummary.qualityScore >= 90 ? '#10B981' : '#F59E0B',
                    fontWeight: 600,
                  }}
                />
          </Box>
        </Paper>

        {/* ---- Summary Cards ---- */}
        <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                gap: 2,
                mb: 3,
              }}
            >
          <SummaryCard label="Today" wrf={summary.today} highlight />
          <SummaryCard label="This Week" wrf={summary.thisWeek} />
          <SummaryCard label="This Month" wrf={summary.thisMonth} />
        </Box>

        {/* ---- Tab Navigation ---- */}
        <Box sx={{ mb: 3 }}>
          <ToggleButtonGroup
                exclusive
                value={activeTab}
                onChange={handleTabChange}
                sx={{
                  width: '100%',
                  '.MuiToggleButton-root': {
                    flex: 1,
                    color: '#94A3B8',
                    borderColor: '#334155',
                    textTransform: 'none',
                    py: 1.5,
                    fontWeight: 600,
                    '&.Mui-selected': { bgcolor: '#1E293B', color: '#3B82F6', borderColor: '#3B82F6' },
                    '&.Mui-selected:hover': { bgcolor: '#1E293B' },
                  },
                }}
              >
            <ToggleButton value="overview">Overview</ToggleButton>
            <ToggleButton value="history">Payout History</ToggleButton>
            {FEATURES.demoSurfaces && <ToggleButton value="projection">Projections</ToggleButton>}
          </ToggleButtonGroup>
        </Box>

        {/* ---- Tab Content ---- */}
        {activeTab === 'overview' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Earnings Chart + Reward Breakdown side by side on large screens */}
            <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
                    gap: 3,
                  }}
                >
              <EarningsChart stationId={selectedStation} periodView={periodView} />
              {FEATURES.demoSurfaces ? (
                    <RewardBreakdown stationId={selectedStation} />
                  ) : (
                    <Paper elevation={0} data-testid="reward-breakdown-unavailable" sx={{ p: 3, borderRadius: 2, bgcolor: '#1E293B', border: '1px solid #334155' }}>
                  <Typography variant="body2" sx={{ color: '#94A3B8' }}>
                    A breakdown by reward type is not available on this testnet: rewards are recorded per observation.
                  </Typography>
                </Paper>
                  )}
            </Box>

            {/* Recent Earnings */}
            <Paper
                  elevation={0}
                  sx={{ p: 3, borderRadius: 2, bgcolor: '#1E293B', border: '1px solid #334155' }}
                >
              <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 700, mb: 2 }}>
                Recent Earnings
              </Typography>
              <Box>
                {recentEarnings.length === 0 && (
                      <Typography variant="body2" sx={{ color: '#94A3B8' }}>
                    No earnings have been recorded yet for this station.
                  </Typography>
                    )}
                {recentEarnings.map((entry) => (
                      <RecentEarningRow key={entry.id} entry={entry} />
                    ))}
              </Box>
            </Paper>
          </Box>
            )}

        {activeTab === 'history' && (
              <PayoutHistory stationId={selectedStation} />
            )}

        {FEATURES.demoSurfaces && activeTab === 'projection' && (
              <EarningsProjection stationId={selectedStation} summary={summary} />
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default EarningsDashboard;
