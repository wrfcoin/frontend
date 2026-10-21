import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  Grid,
  LinearProgress,
  Paper,
  Skeleton,
  Typography,
} from '@mui/material';

import type {
  EarningsHistoryEntry,
  EarningsSummary,
  StationObservation,
  StationQuality,
  StationSubmissionLogEntry,
} from '../../services/apiClient';
import { formatBaseUnitsToWrf, toBaseUnits, toWrfNumberForChart } from '../../services/apiClient/number';
import { useWeatherEarnings, useWeatherEarningsHistory } from '../../hooks/api/useEarningsQueries';
import {
  useLatestObservations,
  useStationQuality,
  useSubmissionLog,
  useWeatherStationSnapshots,
  useWeatherStations,
} from '../../hooks/api/useWeatherQueries';
import {
  buildWeatherStationViewModel,
  type WeatherStationViewModel,
} from '../../lib/weatherViewModels';
import EarningsTimeline, { type EarningsPoint, type EarningsStats } from './EarningsTimeline';
import LiveDataFeed, { type SensorChannel } from './LiveDataFeed';
import QualityMonitor, { type QualityData } from './QualityMonitor';
import StationStatusBar from './StationStatusBar';
import SubmissionLog, { type LogEntry } from './SubmissionLog';

// --- Types ---

export interface Achievement {
  id: string;
  title: string;
  description: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  unlockedAt: string;
}

export interface NetworkPeer {
  id: string;
  name: string;
  distance: string;
  qualityScore: number;
  status: 'live' | 'offline';
}

// --- Helpers ---

const TIER_COLORS = {
  bronze: { bg: '#92400E', text: '#FCD34D', border: '#B45309' },
  silver: { bg: '#374151', text: '#E5E7EB', border: '#6B7280' },
  gold: { bg: '#854D0E', text: '#FDE047', border: '#CA8A04' },
  platinum: { bg: '#1E3A5F', text: '#93C5FD', border: '#3B82F6' },
  diamond: { bg: '#581C87', text: '#D8B4FE', border: '#9333EA' },
} as const;

const pulseKeyframes = `
@keyframes topBarPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
`;

// --- Sub-components ---

const AchievementCard: React.FC<{ achievement: Achievement }> = ({ achievement }) => {
  const tier = TIER_COLORS[achievement.tier];
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        py: 1.25,
        px: 0.5,
        borderBottom: '1px solid rgba(248,250,252,0.04)',
        '&:last-child': { borderBottom: 'none' },
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 2,
          bgcolor: `${tier.bg}40`,
          border: `1.5px solid ${tier.border}60`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Typography sx={{ fontSize: '1rem' }}>
          {achievement.tier === 'diamond' ? '\u2666' :
            achievement.tier === 'platinum' ? '\u2605' :
              achievement.tier === 'gold' ? '\u2605' :
                achievement.tier === 'silver' ? '\u25CB' : '\u25CF'}
        </Typography>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            variant="caption"
            sx={{ color: '#F8FAFC', fontWeight: 600, fontSize: '0.78rem' }}
          >
            {achievement.title}
          </Typography>
          <Chip
            label={achievement.tier.toUpperCase()}
            size="small"
            sx={{
              height: 18,
              bgcolor: `${tier.bg}60`,
              color: tier.text,
              fontWeight: 700,
              fontSize: '0.55rem',
              letterSpacing: 0.5,
              '& .MuiChip-label': { px: 0.75 },
            }}
          />
        </Box>
        <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.68rem' }}>
          {achievement.description}
        </Typography>
      </Box>
      <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.65rem', flexShrink: 0 }}>
        {achievement.unlockedAt}
      </Typography>
    </Box>
  );
};

const PeerRow: React.FC<{ peer: NetworkPeer }> = ({ peer }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      py: 1,
      px: 0.5,
      borderBottom: '1px solid rgba(248,250,252,0.04)',
      '&:last-child': { borderBottom: 'none' },
    }}
  >
    <Box
      sx={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        bgcolor: peer.status === 'live' ? '#22C55E' : '#EF4444',
        flexShrink: 0,
      }}
    />
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="caption" sx={{ color: '#F8FAFC', fontWeight: 600, fontSize: '0.78rem' }}>
        {peer.name}
      </Typography>
      <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.65rem', display: 'block' }}>
        {peer.distance} away
      </Typography>
    </Box>
    <Box sx={{ width: 80, mr: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
        <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.6rem' }}>
          Quality
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: peer.qualityScore >= 90 ? '#22C55E' : peer.qualityScore >= 75 ? '#FACC15' : '#F97316',
            fontWeight: 700,
            fontSize: '0.65rem',
            fontFamily: 'monospace',
          }}
        >
          {peer.qualityScore}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={peer.qualityScore}
        sx={{
          height: 3,
          borderRadius: 2,
          bgcolor: 'rgba(248,250,252,0.06)',
          '& .MuiLinearProgress-bar': {
            bgcolor: peer.qualityScore >= 90 ? '#22C55E' : peer.qualityScore >= 75 ? '#FACC15' : '#F97316',
            borderRadius: 2,
          },
        }}
      />
    </Box>
  </Box>
);

const QUALITY_COLORS = ['#22C55E', '#3B82F6', '#A855F7', '#F97316', '#06B6D4'] as const;

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function channelStatus(metric: string, value: number): SensorChannel['status'] {
  if (metric === 'temp') {
    if (value > 40 || value < -20) return 'critical';
    if (value > 35 || value < -10) return 'warning';
    return 'normal';
  }
  if (metric === 'humidity') {
    if (value > 95 || value < 5) return 'critical';
    if (value > 85 || value < 15) return 'warning';
    return 'normal';
  }
  if (metric === 'pressure') {
    if (value > 1060 || value < 950) return 'critical';
    if (value > 1040 || value < 980) return 'warning';
    return 'normal';
  }
  if (metric === 'wind_speed') {
    if (value > 20) return 'critical';
    if (value > 12) return 'warning';
    return 'normal';
  }
  if (metric === 'rain') {
    if (value > 50) return 'critical';
    if (value > 20) return 'warning';
    return 'normal';
  }
  if (metric === 'uv') {
    if (value > 9) return 'critical';
    if (value > 6) return 'warning';
    return 'normal';
  }
  if (metric === 'pm25') {
    if (value > 75) return 'critical';
    if (value > 35) return 'warning';
    return 'normal';
  }
  return 'normal';
}

function buildChannels(observations: StationObservation[] | undefined): SensorChannel[] {
  if (!observations || observations.length === 0) return [];

  const ordered = [...observations].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  const configs: Array<{
    id: string;
    label: string;
    unit: string;
    pick: (entry: StationObservation) => number | undefined;
    compass?: boolean;
  }> = [
    { id: 'temp', label: 'Temperature', unit: '\u00B0C', pick: entry => entry.temperatureC },
    { id: 'humidity', label: 'Humidity', unit: '%', pick: entry => entry.humidityPct },
    { id: 'pressure', label: 'Pressure', unit: 'hPa', pick: entry => entry.pressureHpa },
    { id: 'wind_speed', label: 'Wind Speed', unit: 'm/s', pick: entry => entry.windSpeedMs },
    { id: 'wind_dir', label: 'Wind Direction', unit: '\u00B0', pick: entry => entry.windDirectionDeg, compass: true },
    { id: 'rain', label: 'Rain Rate', unit: 'mm/h', pick: entry => entry.rainRateMmHr },
    { id: 'uv', label: 'UV Index', unit: '', pick: entry => entry.uvIndex },
    { id: 'pm25', label: 'PM2.5', unit: '\u00B5g/m\u00B3', pick: entry => entry.pm25UgM3 },
  ];

  return configs.flatMap(config => {
    const history = ordered
      .map(config.pick)
      .filter((value): value is number => typeof value === 'number')
      .map(value => Number(value.toFixed(1)));

    if (history.length === 0) return [];

    const value = history[history.length - 1];
    const previous = history.length > 1 ? history[history.length - 2] : value;

    return [{
      id: config.id,
      label: config.label,
      unit: config.unit,
      value,
      delta: Number((value - previous).toFixed(1)),
      history,
      status: channelStatus(config.id, value),
      compassDeg: config.compass ? value : undefined,
    }];
  });
}

function buildQualityData(quality: StationQuality | undefined): QualityData {
  if (!quality) {
    return { overall: 0, dimensions: [] };
  }

  return {
    overall: Number((quality.overall ?? 0).toFixed(1)),
    dimensions: quality.dimensions.map((dimension, index) => ({
      key: dimension.key,
      label: dimension.label,
      score: Number((dimension.score ?? 0).toFixed(1)),
      color: dimension.color || QUALITY_COLORS[index % QUALITY_COLORS.length],
    })),
  };
}

function buildSubmissionEntries(entries: StationSubmissionLogEntry[] | undefined): LogEntry[] {
  if (!entries) return [];

  return [...entries]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20)
    .map(entry => ({
      id: entry.id,
      timestamp: new Date(entry.timestamp).toLocaleTimeString('en-US', { hour12: false }),
      success: entry.success,
      summary: entry.summary,
      qualityScore: entry.qualityScore ?? 0,
      wrfEarned: entry.wrfEarned,
    }));
}

function buildEarningsPoints(history: EarningsHistoryEntry[] | undefined): EarningsPoint[] {
  if (!history || history.length === 0) return [];

  const totalsByHour = new Map<string, number | null>();

  history.forEach(entry => {
    const date = new Date(entry.timestamp);
    const key = `${String(date.getHours()).padStart(2, '0')}:00`;
    const amount = toWrfNumberForChart(entry.amount);
    const previous = totalsByHour.get(key);
    totalsByHour.set(key, previous === null || amount === null ? null : (previous ?? 0) + amount);
  });

  const sortedHours = [...totalsByHour.entries()].sort(([a], [b]) => a.localeCompare(b));
  let cumulative = 0;
  let cumulativeUnavailable = false;

  return sortedHours.map(([hour, total]) => {
    if (total === null) {
      cumulativeUnavailable = true;
    } else if (!cumulativeUnavailable) {
      cumulative += total;
    }
    const related = history.filter(entry => {
      const date = new Date(entry.timestamp);
      return `${String(date.getHours()).padStart(2, '0')}:00` === hour;
    });
    return {
      hour,
      wrf: cumulativeUnavailable ? null : Number(cumulative.toFixed(2)),
      isBonus: related.some(entry => entry.rewardType.toLowerCase().includes('bonus')),
      isAchievement: related.some(entry => entry.rewardType.toLowerCase().includes('achievement') || entry.rewardType.toLowerCase().includes('streak')),
    };
  });
}

function streakDays(history: EarningsHistoryEntry[] | undefined): number {
  if (!history || history.length === 0) return 0;

  const byDay = new Map<string, bigint>();
  history.forEach(entry => {
    const dayKey = entry.timestamp.slice(0, 10);
    const units = toBaseUnits(entry.amount);
    if (units !== null) byDay.set(dayKey, (byDay.get(dayKey) || 0n) + units);
  });

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if ((byDay.get(key) || 0n) <= 0n) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function buildEarningsStats(
  summary: EarningsSummary | undefined,
  history: EarningsHistoryEntry[] | undefined,
): EarningsStats {
  const entries = history || [];
  const totalsByDay = new Map<string, bigint>();
  entries.forEach(entry => {
    const dayKey = entry.timestamp.slice(0, 10);
    const units = toBaseUnits(entry.amount);
    if (units !== null) totalsByDay.set(dayKey, (totalsByDay.get(dayKey) || 0n) + units);
  });

  const sortedDailyTotals = [...totalsByDay.entries()]
    .sort(([a], [b]) => (a > b ? -1 : 1))
    .map(([, total]) => total);

  const trailingWeekAverage =
    sortedDailyTotals.length > 1
      ? sortedDailyTotals.slice(1, 8).reduce((sum, total) => sum + total, 0n) /
        BigInt(Math.max(1, sortedDailyTotals.slice(1, 8).length))
      : 0n;
  const previousWeekTotal = sortedDailyTotals.slice(7, 14).reduce((sum, total) => sum + total, 0n);

  const today = summary?.today ?? null;
  const thisWeek = summary?.thisWeek ?? null;
  const todayChart = toWrfNumberForChart(today);
  const weekChart = toWrfNumberForChart(thisWeek);
  const trailingWeekAverageChart = toWrfNumberForChart(trailingWeekAverage);
  const previousWeekTotalChart = toWrfNumberForChart(previousWeekTotal);

  const todayDelta = todayChart !== null && trailingWeekAverageChart !== null && trailingWeekAverageChart > 0
    ? Number((((todayChart - trailingWeekAverageChart) / trailingWeekAverageChart) * 100).toFixed(1))
    : null;
  const weekDelta = weekChart !== null && previousWeekTotalChart !== null && previousWeekTotalChart > 0
    ? Number((((weekChart - previousWeekTotalChart) / previousWeekTotalChart) * 100).toFixed(1))
    : null;

  return {
    today,
    todayDelta,
    week: thisWeek,
    weekDelta,
    allTime: summary?.allTime ?? null,
    streakDays: streakDays(history),
  };
}

function achievementTier(score: number): Achievement['tier'] {
  if (score >= 95) return 'platinum';
  if (score >= 85) return 'gold';
  if (score >= 70) return 'silver';
  return 'bronze';
}

function buildAchievements(
  station: WeatherStationViewModel | undefined,
  quality: QualityData,
  earnings: EarningsStats,
  channels: SensorChannel[],
  submissions: LogEntry[],
): Achievement[] {
  if (!station) return [];

  const items: Achievement[] = [];

  if (quality.overall > 0) {
    items.push({
      id: 'quality-signal',
      title: 'Quality Signal',
      description: `Current station quality is ${quality.overall.toFixed(0)}/100.`,
      tier: achievementTier(quality.overall),
      unlockedAt: station.lastUpdateLabel,
    });
  }

  const todayChart = toWrfNumberForChart(earnings.today);
  if (todayChart !== null && todayChart > 0) {
    items.push({
      id: 'earnings-live',
      title: 'Daily Contributions Active',
      description: `${formatBaseUnitsToWrf(earnings.today, 1) ?? '--'} credits earned today.`,
      tier: achievementTier(Math.min(100, todayChart * 8)),
      unlockedAt: station.lastUpdateLabel,
    });
  }

  if (earnings.streakDays > 0) {
    items.push({
      id: 'consistency',
      title: 'Consistency Streak',
      description: `${earnings.streakDays} consecutive contribution day${earnings.streakDays === 1 ? '' : 's'}.`,
      tier: achievementTier(Math.min(100, earnings.streakDays * 12)),
      unlockedAt: station.lastUpdateLabel,
    });
  }

  if (channels.length >= 4) {
    items.push({
      id: 'multi-sensor',
      title: 'Multi-Sensor Live',
      description: `${channels.length} live weather channels are reporting.`,
      tier: channels.length >= 6 ? 'gold' : 'silver',
      unlockedAt: station.lastUpdateLabel,
    });
  }

  if (submissions.some((entry) => entry.success)) {
    const successRate = submissions.length
      ? (submissions.filter((entry) => entry.success).length / submissions.length) * 100
      : 0;
    items.push({
      id: 'submission-health',
      title: 'Submission Health',
      description: `${successRate.toFixed(0)}% of recent submissions succeeded.`,
      tier: achievementTier(successRate),
      unlockedAt: station.lastUpdateLabel,
    });
  }

  return items.slice(0, 4);
}

function distanceKm(
  left: Pick<WeatherStationViewModel, 'latitude' | 'longitude'>,
  right: Pick<WeatherStationViewModel, 'latitude' | 'longitude'>,
): number | null {
  if (
    left.latitude == null ||
    left.longitude == null ||
    right.latitude == null ||
    right.longitude == null
  ) {
    return null;
  }

  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(right.latitude - left.latitude);
  const dLng = toRadians(right.longitude - left.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(left.latitude)) *
      Math.cos(toRadians(right.latitude)) *
      Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildPeers(
  stations: WeatherStationViewModel[],
  selectedStationId: string | undefined,
): NetworkPeer[] {
  const selected = stations.find((station) => station.id === selectedStationId);

  return stations
    .filter((station) => station.id !== selectedStationId)
    .map((station) => {
      const km = selected ? distanceKm(selected, station) : null;
      const status: NetworkPeer['status'] = station.status === 'offline' ? 'offline' : 'live';
      return {
        id: station.id,
        name: station.name,
        distance: km == null ? 'Distance unavailable' : `${km.toFixed(1)} km`,
        qualityScore: Math.round(station.quality ?? 0),
        status,
      };
    })
    .sort((left, right) => {
      const leftDistance = Number.parseFloat(left.distance);
      const rightDistance = Number.parseFloat(right.distance);
      if (Number.isNaN(leftDistance) && Number.isNaN(rightDistance)) return 0;
      if (Number.isNaN(leftDistance)) return 1;
      if (Number.isNaN(rightDistance)) return -1;
      return leftDistance - rightDistance;
    })
    .slice(0, 4);
}

// --- Main Dashboard ---

const WeatherContributorDashboard: React.FC = () => {
  const [activeStation, setActiveStation] = useState<string>('');

  const stationsQuery = useWeatherStations();
  const stations = stationsQuery.data || [];
  const stationSnapshotsQuery = useWeatherStationSnapshots(stationsQuery.data);

  useEffect(() => {
    if (!activeStation && stations.length > 0) {
      setActiveStation(stations[0].id);
    }
  }, [activeStation, stations]);

  useEffect(() => {
    if (activeStation && stations.length > 0 && !stations.some(station => station.id === activeStation)) {
      setActiveStation(stations[0].id);
    }
  }, [activeStation, stations]);

  const selectedStationId = activeStation || undefined;
  const observationsQuery = useLatestObservations(selectedStationId);
  const qualityQuery = useStationQuality(selectedStationId);
  const submissionsQuery = useSubmissionLog(selectedStationId);
  const earningsSummaryQuery = useWeatherEarnings(selectedStationId);
  const earningsHistoryQuery = useWeatherEarningsHistory(selectedStationId);

  const liveStationCount = stations.filter(station => station.status === 'live').length;
  const stationViews = useMemo(() => {
    const baseSnapshots =
      stationSnapshotsQuery.data ??
      stations.map((station) => ({
        station,
        observations: [],
        quality: null,
        earnings: null,
        submissions: [],
      }));

    return baseSnapshots.map(buildWeatherStationViewModel);
  }, [stationSnapshotsQuery.data, stations]);
  const selectedStationView = useMemo(
    () => stationViews.find((station) => station.id === selectedStationId),
    [selectedStationId, stationViews],
  );
  const qualityData = useMemo(
    () => buildQualityData(qualityQuery.data),
    [qualityQuery.data],
  );
  const channels = useMemo(
    () => buildChannels(observationsQuery.data),
    [observationsQuery.data],
  );
  const submissionEntries = useMemo(
    () => buildSubmissionEntries(submissionsQuery.data),
    [submissionsQuery.data],
  );
  const earningsStats = useMemo(
    () => buildEarningsStats(earningsSummaryQuery.data, earningsHistoryQuery.data),
    [earningsSummaryQuery.data, earningsHistoryQuery.data],
  );
  const earningsPoints = useMemo(
    () => buildEarningsPoints(earningsHistoryQuery.data),
    [earningsHistoryQuery.data],
  );
  const recentAchievements = useMemo(
    () =>
      buildAchievements(
        selectedStationView,
        qualityData,
        earningsStats,
        channels,
        submissionEntries,
      ),
    [channels, earningsStats, qualityData, selectedStationView, submissionEntries],
  );
  const nearbyPeers = useMemo(
    () => buildPeers(stationViews, selectedStationId),
    [selectedStationId, stationViews],
  );
  const stationDataError = observationsQuery.error || qualityQuery.error || submissionsQuery.error || earningsHistoryQuery.error || earningsSummaryQuery.error;

  if (stationsQuery.isLoading) {
    return (
      <Box sx={{ bgcolor: '#0F172A', minHeight: '100vh', color: '#F8FAFC', p: 3 }}>
        <Typography sx={{ mb: 2, color: '#94A3B8' }}>Loading weather stations...</Typography>
        <Skeleton variant="rounded" height={56} sx={{ bgcolor: 'rgba(248,250,252,0.08)', mb: 2 }} />
        <Skeleton variant="rounded" height={300} sx={{ bgcolor: 'rgba(248,250,252,0.08)', mb: 2 }} />
        <Skeleton variant="rounded" height={220} sx={{ bgcolor: 'rgba(248,250,252,0.08)' }} />
      </Box>
    );
  }

  if (stationsQuery.isError) {
    return (
      <Box sx={{ bgcolor: '#0F172A', minHeight: '100vh', color: '#F8FAFC', p: 3 }}>
        <Alert severity="error" sx={{ bgcolor: 'rgba(239,68,68,0.12)', color: '#FECACA' }}>
          {getErrorMessage(stationsQuery.error, 'Unable to load weather stations.')}
        </Alert>
      </Box>
    );
  }

  if (stations.length === 0) {
    return (
      <Box sx={{ bgcolor: '#0F172A', minHeight: '100vh', color: '#F8FAFC', p: 3 }}>
        <Alert severity="info" sx={{ bgcolor: 'rgba(59,130,246,0.12)', color: '#BFDBFE' }}>
          No weather stations are currently available.
        </Alert>
      </Box>
    );
  }

  if (!selectedStationId) {
    return (
      <Box sx={{ bgcolor: '#0F172A', minHeight: '100vh', color: '#F8FAFC', p: 3 }}>
        <Typography sx={{ mb: 2, color: '#94A3B8' }}>Preparing station context...</Typography>
        <Skeleton variant="rounded" height={56} sx={{ bgcolor: 'rgba(248,250,252,0.08)' }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: '#0F172A',
        minHeight: '100vh',
        color: '#F8FAFC',
      }}
    >
      <style>{pulseKeyframes}</style>

      {/* ============ TOP BAR ============ */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2,
          borderBottom: '1px solid rgba(248,250,252,0.06)',
        }}
      >
        {/* Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              letterSpacing: 2,
              background: 'linear-gradient(135deg, #60A5FA, #A78BFA)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            DATA HUB
          </Typography>
          <Chip
            label={`${liveStationCount}/${stations.length} LIVE`}
            size="small"
            sx={{
              bgcolor: 'rgba(34,197,94,0.1)',
              color: '#22C55E',
              fontWeight: 700,
              fontSize: '0.7rem',
              letterSpacing: 0.5,
              border: '1px solid rgba(34,197,94,0.2)',
              '& .MuiChip-label': { px: 1 },
            }}
          />
        </Box>

        {/* Earnings counter + Quality badge */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
          {/* Earnings today */}
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, letterSpacing: 0.5 }}>
              CONTRIBUTION SCORE
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: 0.5 }}>
              <Typography
                sx={{
                  color: '#FBBF24',
                  fontWeight: 800,
                  fontSize: '1.3rem',
                  fontFamily: 'monospace',
                  lineHeight: 1,
                }}
              >
                {formatBaseUnitsToWrf(earningsStats.today, 1) ?? '--'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 600 }}>
                Credits
              </Typography>
            </Box>
          </Box>

          {/* Quality badge */}
          <Box
            sx={{
              bgcolor: 'rgba(34,197,94,0.08)',
              border: '1.5px solid rgba(34,197,94,0.25)',
              borderRadius: 2,
              px: 2,
              py: 0.75,
              textAlign: 'center',
            }}
          >
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.6rem', letterSpacing: 0.5 }}>
              QUALITY
            </Typography>
            <Typography
              sx={{
                color: '#22C55E',
                fontWeight: 800,
                fontSize: '1.1rem',
                fontFamily: 'monospace',
                lineHeight: 1,
              }}
            >
              {qualityQuery.data ? qualityData.overall : '--'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ============ STATION STATUS BAR ============ */}
      <Box sx={{ borderBottom: '1px solid rgba(248,250,252,0.06)' }}>
        <StationStatusBar
          stations={stations}
          activeStationId={activeStation}
          onStationSelect={setActiveStation}
        />
      </Box>

      {/* ============ MAIN CONTENT ============ */}
      <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {stationDataError && (
          <Alert severity="warning" sx={{ bgcolor: 'rgba(245,158,11,0.1)', color: '#FDE68A' }}>
            {getErrorMessage(stationDataError, 'Some live weather data is currently unavailable.')}
          </Alert>
        )}

        {/* Row 1: Live Data Feed (60%) + Quality Monitor (40%) */}
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, lg: 7 }}>
            {observationsQuery.isLoading ? (
              <Skeleton variant="rounded" height={420} sx={{ bgcolor: 'rgba(248,250,252,0.08)' }} />
            ) : observationsQuery.isError ? (
              <Alert severity="error" sx={{ bgcolor: 'rgba(239,68,68,0.12)', color: '#FECACA' }}>
                {getErrorMessage(observationsQuery.error, 'Unable to load live observations.')}
              </Alert>
            ) : (
              <LiveDataFeed channels={channels} />
            )}
          </Grid>
          <Grid size={{ xs: 12, lg: 5 }}>
            {qualityQuery.isLoading ? (
              <Skeleton variant="rounded" height={420} sx={{ bgcolor: 'rgba(248,250,252,0.08)' }} />
            ) : qualityQuery.isError ? (
              <Alert severity="error" sx={{ bgcolor: 'rgba(239,68,68,0.12)', color: '#FECACA' }}>
                {getErrorMessage(qualityQuery.error, 'Unable to load quality metrics.')}
              </Alert>
            ) : (
              <QualityMonitor quality={qualityData} />
            )}
          </Grid>
        </Grid>

        {/* Row 2: Earnings Timeline (full width) */}
        {earningsHistoryQuery.isLoading || earningsSummaryQuery.isLoading ? (
          <Skeleton variant="rounded" height={440} sx={{ bgcolor: 'rgba(248,250,252,0.08)' }} />
        ) : earningsHistoryQuery.isError || earningsSummaryQuery.isError ? (
          <Alert severity="error" sx={{ bgcolor: 'rgba(239,68,68,0.12)', color: '#FECACA' }}>
            {getErrorMessage(earningsHistoryQuery.error || earningsSummaryQuery.error, 'Unable to load station earnings.')}
          </Alert>
        ) : (
          <EarningsTimeline dataPoints={earningsPoints} stats={earningsStats} />
        )}

        {/* Row 3: Recent Achievements + Network Context */}
        <Grid container spacing={2.5}>
          {/* Recent Achievements */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              elevation={0}
              sx={{
                bgcolor: '#1E293B',
                borderRadius: 3,
                border: '1px solid rgba(248,250,252,0.06)',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  px: 2.5,
                  py: 1.5,
                  borderBottom: '1px solid rgba(248,250,252,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Typography variant="subtitle2" sx={{ color: '#F8FAFC', fontWeight: 700, letterSpacing: 0.5 }}>
                  RECENT ACHIEVEMENTS
                </Typography>
                <Chip
                  label={recentAchievements.length > 0 ? `${recentAchievements.length} LIVE` : 'NO DATA'}
                  size="small"
                  sx={{
                    height: 20,
                    bgcolor: 'rgba(168,85,247,0.1)',
                    color: '#A855F7',
                    fontWeight: 700,
                    fontSize: '0.6rem',
                    border: '1px solid rgba(168,85,247,0.2)',
                    '& .MuiChip-label': { px: 0.75 },
                  }}
                />
              </Box>
              <Box sx={{ px: 2, py: 0.5 }}>
                {recentAchievements.length > 0 ? (
                  recentAchievements.map((ach) => (
                    <AchievementCard key={ach.id} achievement={ach} />
                  ))
                ) : (
                  <Typography sx={{ px: 0.5, py: 2, color: '#94A3B8', fontSize: '0.78rem' }}>
                    Live achievement milestones will appear after the station reports quality, rewards, and submission activity.
                  </Typography>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Network Context */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              elevation={0}
              sx={{
                bgcolor: '#1E293B',
                borderRadius: 3,
                border: '1px solid rgba(248,250,252,0.06)',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  px: 2.5,
                  py: 1.5,
                  borderBottom: '1px solid rgba(248,250,252,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Typography variant="subtitle2" sx={{ color: '#F8FAFC', fontWeight: 700, letterSpacing: 0.5 }}>
                  NETWORK CONTEXT
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  Live station peers
                </Typography>
              </Box>
              <Box sx={{ px: 2, py: 0.5 }}>
                {nearbyPeers.length > 0 ? (
                  nearbyPeers.map((peer) => (
                    <PeerRow key={peer.id} peer={peer} />
                  ))
                ) : (
                  <Typography sx={{ px: 0.5, py: 2, color: '#94A3B8', fontSize: '0.78rem' }}>
                    No nearby peer stations are available yet.
                  </Typography>
                )}
              </Box>
              {/* Network summary */}
              <Box
                sx={{
                  mx: 2,
                  mb: 2,
                  mt: 1,
                  bgcolor: 'rgba(96,165,250,0.06)',
                  border: '1px solid rgba(96,165,250,0.12)',
                  borderRadius: 2,
                  px: 2,
                  py: 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.6rem' }}>
                    SPATIAL CONSENSUS
                  </Typography>
                  <Typography sx={{ color: '#60A5FA', fontWeight: 700, fontSize: '0.85rem', fontFamily: 'monospace' }}>
                    {qualityData.dimensions.find((d) => d.key === 'spatial')?.score ?? '--'}/100
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.6rem' }}>
                    PEERS IN RANGE
                  </Typography>
                  <Typography sx={{ color: '#F8FAFC', fontWeight: 700, fontSize: '0.85rem', fontFamily: 'monospace' }}>
                    {nearbyPeers.filter((peer) => peer.status === 'live').length}/{nearbyPeers.length}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.6rem' }}>
                    AVG PEER QUALITY
                  </Typography>
                  <Typography sx={{ color: '#22C55E', fontWeight: 700, fontSize: '0.85rem', fontFamily: 'monospace' }}>
                    {nearbyPeers.length > 0
                      ? Math.round(nearbyPeers.reduce((sum, peer) => sum + peer.qualityScore, 0) / nearbyPeers.length)
                      : '--'}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Row 4: Submission Log (collapsible) */}
        {submissionsQuery.isLoading ? (
          <Skeleton variant="rounded" height={120} sx={{ bgcolor: 'rgba(248,250,252,0.08)' }} />
        ) : submissionsQuery.isError ? (
          <Alert severity="error" sx={{ bgcolor: 'rgba(239,68,68,0.12)', color: '#FECACA' }}>
            {getErrorMessage(submissionsQuery.error, 'Unable to load submission log.')}
          </Alert>
        ) : (
          <SubmissionLog entries={submissionEntries} />
        )}
      </Box>
    </Box>
  );
};

export default WeatherContributorDashboard;
