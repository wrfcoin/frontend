import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import PublicViewerNotice from '../common/PublicViewerNotice';
import {
  Box,
  Typography,
  Paper,
  Button,
  Avatar,
  Chip,
  TextField,
  Tabs,
  Tab,
  IconButton,
  Grid,
  Divider,
  Tooltip,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
} from '@mui/material';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import SearchIcon from '@mui/icons-material/Search';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import StarIcon from '@mui/icons-material/Star';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import VerifiedIcon from '@mui/icons-material/Verified';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import PublicIcon from '@mui/icons-material/Public';
import FilterListIcon from '@mui/icons-material/FilterList';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useOptionalWallet } from '../../contexts/WalletContext.jsx';
import { sameWallet } from '../../utils/publicAddress';
import RoleEarningsBoard from './RoleEarnings';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DARK = {
  bg: '#0F172A',
  card: '#1E293B',
  cardHover: '#263548',
  border: '#334155',
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  purple: '#8B5CF6',
  pink: '#EC4899',
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
};

const REGIONS = [
  'Global',
  'North America',
  'Europe',
  'Asia Pacific',
  'South America',
  'Africa',
  'Middle East',
  'Oceania',
];

const TIME_PERIODS = [
  { label: '24h', value: '24h' },
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: 'All Time', value: 'all' },
];

const PAGE_SIZE = 25;

const AVATAR_COLORS = [DARK.primary, DARK.success, DARK.warning, DARK.purple, DARK.pink];

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

const getMedalColor = (rank) => {
  if (rank === 1) return DARK.gold;
  if (rank === 2) return DARK.silver;
  if (rank === 3) return DARK.bronze;
  return null;
};

const getTrendIcon = (trend) => {
  if (trend === 'up') return <TrendingUpIcon sx={{ fontSize: 16, color: DARK.success }} />;
  if (trend === 'down') return <TrendingDownIcon sx={{ fontSize: 16, color: DARK.error }} />;
  return <TrendingFlatIcon sx={{ fontSize: 16, color: DARK.textSecondary }} />;
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const initialsFor = (name) =>
  String(name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || '?';

const isPresent = (value) => value !== null && value !== undefined;

// WRF amounts are exact integers of base units (8 decimals). They are parsed and formatted as
// BigInt and never pass through Number(): Number().toLocaleString() rounds to 3 decimals, which
// would show a real 0.00000001 WRF reward as "0" (SOL-W2 P2 on frontend#526).
const WRF_UNITS_PER_COIN = 100000000n;
const parseWrfDecimal = (raw) => {
  const text = typeof raw === 'number' ? (Number.isFinite(raw) ? String(raw) : '')
    : typeof raw === 'string' ? raw.trim() : '';
  const match = /^(\d+)(?:\.(\d{1,8}))?$/.exec(text);
  if (!match) return null;
  return BigInt(match[1]) * WRF_UNITS_PER_COIN + BigInt((match[2] ?? '').padEnd(8, '0'));
};
const parseBaseUnits = (raw) => (typeof raw === 'string' && /^\d{1,39}$/.test(raw) ? BigInt(raw) : null);
const formatWrf = (baseUnits) => {
  const whole = (baseUnits / WRF_UNITS_PER_COIN).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const fraction = (baseUnits % WRF_UNITS_PER_COIN).toString().padStart(8, '0').replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole;
};
const compareBigInt = (a, b) => (a > b ? 1 : a < b ? -1 : 0);
const isFiniteMetric = (value) =>
  (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')) && Number.isFinite(Number(value));

// Real WRF earnings are the backend's lifetime real_paid, sent as a WRF display string
// (earningsWrf). Only the earnings amount and the ranking value are required: they are the
// two figures the backend proves. Quality, station count and streak are shown only when the
// backend sends them; an absent one is "not available", never zero (S55, owner ruling 2026-10-03).
const normalizeContributor = (entry, index) => {
  const earningsRaw = entry.earningsWrf ?? entry.earnings ?? entry.totalEarnings ?? entry.wrfEarned ?? entry.wrfDistributed;
  const riseRaw = entry.riseScore ?? entry.rankDelta ?? entry.value;
  // Exact base units: from earningsBaseUnits when sent, else parsed from the WRF decimal string.
  // When both are sent they must agree. Anything else is not a proven amount.
  const fromDisplay = parseWrfDecimal(earningsRaw);
  const fromUnits = isPresent(entry.earningsBaseUnits) ? parseBaseUnits(entry.earningsBaseUnits) : null;
  const unitsPresentButInvalid = isPresent(entry.earningsBaseUnits) && fromUnits === null;
  const earnings = fromUnits ?? fromDisplay;
  // A metric-only weather leaderboard is not an earnings summary: missing or invalid
  // required data must not be normalized into a successful zero balance.
  if (earnings === null || unitsPresentButInvalid || (fromUnits !== null && fromDisplay !== null && fromUnits !== fromDisplay)
    || !isFiniteMetric(riseRaw)) {
    throw new Error('Leaderboard metrics are incomplete');
  }
  const optionalMetric = (...candidates) => {
    const raw = candidates.find(isPresent);
    if (!isPresent(raw)) return null;
    if (!isFiniteMetric(raw)) throw new Error('Leaderboard metrics are incomplete');
    return Number(raw);
  };
  const quality = optionalMetric(entry.quality, entry.qualityScore, entry.avgQualityScore, entry.quality_score);
  const stations = optionalMetric(entry.stations, entry.stationCount, entry.activeStations);
  const consistency = optionalMetric(entry.consistency, entry.streak, entry.streakDays);
  const riseScore = Number(riseRaw);
  const walletAddress = entry.walletAddress || entry.address || entry.id;
  const name = entry.displayName || entry.name || walletAddress || `Contributor ${index + 1}`;

  return {
    // backend#1361: the API sends a short address plus an opaque profileKey to anonymous callers.
    id: String(entry.profileKey || walletAddress || `contributor-${index}`),
    walletAddress: walletAddress ? String(walletAddress) : null,
    isYou: entry.isYou === true,
    name: String(name),
    avatar: entry.avatar || initialsFor(name),
    avatarColor: entry.avatarColor || AVATAR_COLORS[index % AVATAR_COLORS.length],
    stations,
    earnings,
    quality,
    consistency,
    riseScore,
    trend: entry.trend || (toNumber(entry.rankDelta) > 0 ? 'up' : toNumber(entry.rankDelta) < 0 ? 'down' : 'flat'),
    region: entry.region || entry.country || 'Global',
  };
};

const buildOverviewStats = (contributors) => {
  const totalContributors = contributors.length;
  const wrfEarned = contributors.reduce((sum, c) => sum + c.earnings, 0n);
  const allHave = (key) => contributors.every(c => c[key] !== null);
  const qualityRows = contributors.filter(c => toNumber(c.quality) > 0);
  const avgQuality =
    qualityRows.length > 0
      ? qualityRows.reduce((sum, c) => sum + toNumber(c.quality), 0) / qualityRows.length
      : 0;
  const activeStations = contributors.reduce((sum, c) => sum + toNumber(c.stations), 0);
  const qualityKnown = contributors.length === 0 || allHave('quality');
  const stationsKnown = contributors.length === 0 || allHave('stations');

  return [
    { label: 'Total Contributors', value: totalContributors.toLocaleString(), icon: PublicIcon, color: DARK.primary },
    // Lifetime real WRF paid to the listed contributors (node-proven), not a network total.
    { label: 'WRF Distributed', value: formatWrf(wrfEarned), icon: MonetizationOnIcon, color: DARK.success },
    { label: 'Avg Quality Score', value: !qualityKnown ? 'Not available' : avgQuality > 0 ? avgQuality.toFixed(1) : 'No data', icon: VerifiedIcon, color: DARK.warning },
    { label: 'Active Stations', value: !stationsKnown ? 'Not available' : activeStations.toLocaleString(), icon: WhatshotIcon, color: DARK.error },
  ];
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const StatsRow = ({ stats }) => (
  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
    {stats.map((stat) => {
      const Icon = stat.icon;
      return (
        <Paper
          key={stat.label}
          sx={{
            bgcolor: DARK.card,
            border: `1px solid ${DARK.border}`,
            px: 3,
            py: 2,
            borderRadius: 3,
            flex: '1 1 200px',
            minWidth: 180,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: `${stat.color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon sx={{ color: stat.color, fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ color: DARK.text, fontWeight: 700, lineHeight: 1.2 }}>
                {stat.value}
              </Typography>
              <Typography variant="caption" sx={{ color: DARK.textSecondary }}>
                {stat.label}
              </Typography>
            </Box>
          </Box>
        </Paper>
      );
    })}
  </Box>
);

const TopThreeCard = ({ contributor, position }) => {
  const medalColor = getMedalColor(contributor.rank);
  const sizes = { 1: { card: 260, avatar: 64 }, 2: { card: 230, avatar: 52 }, 3: { card: 230, avatar: 52 } };
  const size = sizes[position] || sizes[3];

  return (
    <Paper
      sx={{
        bgcolor: DARK.card,
        border: `1px solid ${medalColor}44`,
        borderRadius: 3,
        p: 3,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        flex: `1 1 ${size.card}px`,
        minWidth: 200,
        transition: 'all 0.3s',
        '&:hover': {
          borderColor: medalColor,
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 32px ${medalColor}22`,
        },
      }}
    >
      {/* Medal badge */}
      <Box
        sx={{
          position: 'absolute',
          top: 12,
          right: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
        }}
      >
        <EmojiEventsIcon sx={{ color: medalColor, fontSize: 24 }} />
      </Box>

      {/* Rank number */}
      <Typography
        sx={{
          position: 'absolute',
          top: 12,
          left: 16,
          color: `${medalColor}88`,
          fontSize: 28,
          fontWeight: 800,
          lineHeight: 1,
        }}
      >
        #{contributor.rank}
      </Typography>

      {/* Avatar */}
      <Avatar
        sx={{
          width: size.avatar,
          height: size.avatar,
          bgcolor: contributor.avatarColor,
          fontSize: size.avatar / 2.8,
          fontWeight: 700,
          mx: 'auto',
          mb: 1.5,
          mt: 1,
          border: `3px solid ${medalColor}`,
          boxShadow: `0 0 20px ${medalColor}33`,
        }}
      >
        {contributor.avatar}
      </Avatar>

      <Typography variant="subtitle1" sx={{ color: DARK.text, fontWeight: 700, mb: 0.5 }}>
        {contributor.name}
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 1.5 }}>
        <Chip
          label={contributor.stations === null ? 'stations: n/a' : `${contributor.stations} stations`}
          size="small"
          sx={{ bgcolor: `${DARK.primary}22`, color: DARK.primary, height: 22, fontSize: '0.7rem' }}
        />
        {getTrendIcon(contributor.trend)}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-around', gap: 1 }}>
        <Box>
          <Typography variant="h6" sx={{ color: DARK.success, fontWeight: 700, fontSize: '1rem' }}>
            {formatWrf(contributor.earnings)}
          </Typography>
          <Typography variant="caption" sx={{ color: DARK.textSecondary }}>WRF Earned</Typography>
        </Box>
        <Divider orientation="vertical" flexItem sx={{ borderColor: DARK.border }} />
        <Box>
          <Typography variant="h6" sx={{ color: DARK.warning, fontWeight: 700, fontSize: '1rem' }}>
            {contributor.quality === null ? '—' : `${contributor.quality}%`}
          </Typography>
          <Typography variant="caption" sx={{ color: DARK.textSecondary }}>Quality</Typography>
        </Box>
      </Box>
    </Paper>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const LegacyGlobalLeaderboard = () => {
  // frontend#302: /leaderboard is routed without a WalletProvider; the wallet
  // is only used to highlight the viewer's own row, so it is optional.
  const wallet = useOptionalWallet();
  const account = wallet?.account ?? null;
  const [contributors, setContributors] = useState([]);
  const [hasFetched, setHasFetched] = useState(false);
  const [readState, setReadState] = useState('loading');
  const [retryNonce, setRetryNonce] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [region, setRegion] = useState('Global');
  const [timePeriod, setTimePeriod] = useState('30d');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setReadState('loading');
    setContributors([]);
    setHasFetched(false);
    const weatherPeriod = timePeriod === 'all' ? 'all' : timePeriod === '30d' ? '30d' : '7d';
    apiClient.getWithFallback([
      `/leaderboard/contributors?period=${timePeriod}`,
      `/weather/leaderboard?metric=earnings&period=${weatherPeriod}&limit=30`,
    ])
      .then((data) => {
        const rows = Array.isArray(data) ? data : (data?.contributors ?? data?.entries ?? data?.leaderboard);
        if (!Array.isArray(rows) || rows.some(row => !row || typeof row !== 'object' || Array.isArray(row))) {
          throw new Error('Leaderboard response is incomplete');
        }
        // The backend says outright when it could not prove the earnings amounts (S55).
        const reportedUnavailable = !Array.isArray(data) && (
          (Array.isArray(data?.unavailable) && data.unavailable.includes('earnings'))
          || (data?.amountUnits && (data.amountUnits.available === false
            || (data.amountUnits.denomination && data.amountUnits.denomination !== 'WRF')))
        );
        if (reportedUnavailable) throw new Error('Leaderboard earnings are unavailable');
        if (!cancelled) {
          setContributors(rows.map(normalizeContributor));
          setReadState('ready');
        }
      })
      .catch(() => { if (!cancelled) setReadState('unavailable'); })
      .finally(() => { if (!cancelled) setHasFetched(true); });
    return () => { cancelled = true; };
  }, [timePeriod, retryNonce]);

  const handleTabChange = useCallback((_, newVal) => {
    setActiveTab(newVal);
    setPage(1);
  }, []);

  const tabLabels = ['Top Earners', 'Quality Leaders', 'Most Consistent', 'Rising Stars'];

  // Sort based on active tab
  const sortedContributors = useMemo(() => {
    let list = [...contributors];

    // Region filter
    if (region !== 'Global') {
      list = list.filter((c) => c.region === region);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q));
    }

    // Sort by tab
    switch (activeTab) {
    case 0: // Top Earners
      list.sort((a, b) => compareBigInt(b.earnings, a.earnings));
      break;
    case 1: // Quality Leaders
      list.sort((a, b) => (b.quality ?? -1) - (a.quality ?? -1));
      break;
    case 2: // Most Consistent
      list.sort((a, b) => (b.consistency ?? -1) - (a.consistency ?? -1));
      break;
    case 3: // Rising Stars
      list.sort((a, b) => b.riseScore - a.riseScore);
      break;
    default:
      break;
    }

    // Re-assign ranks
    return list.map((c, idx) => ({ ...c, rank: idx + 1 }));
  }, [activeTab, contributors, region, searchQuery]);

  const overviewStats = useMemo(() => buildOverviewStats(contributors), [contributors]);

  const totalPages = Math.max(1, Math.ceil(sortedContributors.length / PAGE_SIZE));
  const paginatedContributors = sortedContributors.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const topThree = sortedContributors.slice(0, 3);

  const getMetricValue = (contributor) => {
    switch (activeTab) {
    case 0:
      return `${formatWrf(contributor.earnings)} WRF`;
    case 1:
      return contributor.quality === null ? '—' : `${contributor.quality}%`;
    case 2:
      return contributor.consistency === null ? '—' : `${contributor.consistency} days`;
    case 3:
      return `+${contributor.riseScore}`;
    default:
      return '';
    }
  };

  const getMetricLabel = () => {
    switch (activeTab) {
    case 0: return 'Earnings (lifetime)';
    case 1: return 'Quality Score';
    case 2: return 'Streak (days)';
    case 3: return 'Rise Score';
    default: return 'Value';
    }
  };

  if (readState !== 'ready') {
    return <Box sx={{ bgcolor: DARK.bg, minHeight: '100vh', p: 3 }}>
      {readState === 'loading' ? <Typography role="status">Loading leaderboard…</Typography> : <>
        <PublicViewerNotice reason="not-live" description="Leaderboard data is unavailable. Try again later." />
        <Button onClick={() => setRetryNonce(value => value + 1)}>Retry</Button>
      </>}
    </Box>;
  }

  return (
    <Box sx={{ bgcolor: DARK.bg, minHeight: '100vh', p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              bgcolor: `${DARK.primary}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LeaderboardIcon sx={{ color: DARK.primary, fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ color: DARK.text, fontWeight: 700 }}>
              Global Leaderboard
            </Typography>
            <Typography variant="body2" sx={{ color: DARK.textSecondary }}>
              Top weather data contributors across the WRFCoin network
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Stats */}
      <StatsRow stats={overviewStats} />
      <Typography variant="caption" sx={{ display: 'block', color: DARK.textSecondary, mb: 2 }}>
        Earnings are lifetime real-station rewards paid to each address (read from the node). The period filter ranks only.
      </Typography>

      {/* Filters Row */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Region Select */}
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel
            sx={{
              color: DARK.textSecondary,
              '&.Mui-focused': { color: DARK.primary },
            }}
          >
            Region
          </InputLabel>
          <Select
            value={region}
            label="Region"
            onChange={(e) => { setRegion(e.target.value); setPage(1); }}
            sx={{
              color: DARK.text,
              bgcolor: DARK.card,
              borderRadius: 2,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: DARK.border },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: DARK.primary },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: DARK.primary },
              '& .MuiSvgIcon-root': { color: DARK.textSecondary },
            }}
          >
            {REGIONS.map((r) => (
              <MenuItem key={r} value={r}>{r}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Time Period */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {TIME_PERIODS.map((tp) => (
            <Button
              key={tp.value}
              size="small"
              onClick={() => { setTimePeriod(tp.value); setPage(1); }}
              sx={{
                color: timePeriod === tp.value ? DARK.text : DARK.textSecondary,
                bgcolor: timePeriod === tp.value ? DARK.primary : DARK.card,
                border: `1px solid ${timePeriod === tp.value ? DARK.primary : DARK.border}`,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 2,
                minWidth: 'auto',
                '&:hover': {
                  bgcolor: timePeriod === tp.value ? '#2563EB' : DARK.cardHover,
                },
              }}
            >
              {tp.label}
            </Button>
          ))}
        </Box>

        <Box sx={{ flex: 1 }} />

        {/* Search */}
        <TextField
          size="small"
          placeholder="Search contributors..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: DARK.textSecondary }} />
              </InputAdornment>
            ),
          }}
          sx={{
            width: 260,
            '& .MuiOutlinedInput-root': {
              bgcolor: DARK.card,
              color: DARK.text,
              borderRadius: 2,
              '& fieldset': { borderColor: DARK.border },
              '&:hover fieldset': { borderColor: DARK.primary },
              '&.Mui-focused fieldset': { borderColor: DARK.primary },
            },
            '& .MuiInputBase-input::placeholder': { color: DARK.textSecondary },
          }}
        />
      </Box>

      {/* Tabs */}
      <Paper sx={{ bgcolor: DARK.card, border: `1px solid ${DARK.border}`, borderRadius: 3, mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            px: 2,
            '& .MuiTab-root': {
              color: DARK.textSecondary,
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.95rem',
              minHeight: 52,
            },
            '& .Mui-selected': { color: DARK.primary, fontWeight: 600 },
            '& .MuiTabs-indicator': { bgcolor: DARK.primary, height: 3, borderRadius: '3px 3px 0 0' },
          }}
        >
          <Tab icon={<MonetizationOnIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Top Earners" />
          <Tab icon={<VerifiedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Quality Leaders" />
          <Tab icon={<CalendarTodayIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Most Consistent" />
          <Tab icon={<WhatshotIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Rising Stars" />
        </Tabs>
      </Paper>

      {/* Top 3 Podium */}
      {topThree.length >= 3 && !searchQuery.trim() && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-end' }}>
          <TopThreeCard contributor={topThree[1]} position={2} />
          <TopThreeCard contributor={topThree[0]} position={1} />
          <TopThreeCard contributor={topThree[2]} position={3} />
        </Box>
      )}

      {/* Leaderboard Table */}
      <Paper sx={{ bgcolor: DARK.card, border: `1px solid ${DARK.border}`, borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: DARK.textSecondary, fontSize: 11, fontWeight: 600, borderColor: DARK.border, textTransform: 'uppercase', letterSpacing: 0.5, py: 1.5, width: 60 }}>
                  Rank
                </TableCell>
                <TableCell sx={{ color: DARK.textSecondary, fontSize: 11, fontWeight: 600, borderColor: DARK.border, textTransform: 'uppercase', letterSpacing: 0.5, py: 1.5 }}>
                  Contributor
                </TableCell>
                <TableCell sx={{ color: DARK.textSecondary, fontSize: 11, fontWeight: 600, borderColor: DARK.border, textTransform: 'uppercase', letterSpacing: 0.5, py: 1.5 }} align="center">
                  Stations
                </TableCell>
                <TableCell sx={{ color: DARK.textSecondary, fontSize: 11, fontWeight: 600, borderColor: DARK.border, textTransform: 'uppercase', letterSpacing: 0.5, py: 1.5 }} align="center">
                  {getMetricLabel()}
                </TableCell>
                <TableCell sx={{ color: DARK.textSecondary, fontSize: 11, fontWeight: 600, borderColor: DARK.border, textTransform: 'uppercase', letterSpacing: 0.5, py: 1.5 }} align="center">
                  Trend
                </TableCell>
                <TableCell sx={{ color: DARK.textSecondary, fontSize: 11, fontWeight: 600, borderColor: DARK.border, textTransform: 'uppercase', letterSpacing: 0.5, py: 1.5 }} align="center">
                  Region
                </TableCell>
                <TableCell sx={{ color: DARK.textSecondary, fontSize: 11, fontWeight: 600, borderColor: DARK.border, textTransform: 'uppercase', letterSpacing: 0.5, py: 1.5 }} align="right">
                  Profile
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedContributors.map((contributor) => {
                const medal = getMedalColor(contributor.rank);
                const isCurrentUser = Boolean(contributor.isYou || sameWallet(account, contributor.walletAddress));

                return (
                  <TableRow
                    key={contributor.id}
                    sx={{
                      bgcolor: isCurrentUser ? `${DARK.primary}12` : 'transparent',
                      '&:hover': { bgcolor: isCurrentUser ? `${DARK.primary}18` : DARK.cardHover },
                      cursor: 'pointer',
                      borderLeft: isCurrentUser ? `3px solid ${DARK.primary}` : '3px solid transparent',
                    }}
                  >
                    {/* Rank */}
                    <TableCell sx={{ borderColor: DARK.border, py: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {medal ? (
                          <EmojiEventsIcon sx={{ color: medal, fontSize: 20 }} />
                        ) : (
                          <Typography sx={{ color: DARK.textSecondary, fontSize: 14, fontWeight: 600, pl: 0.5 }}>
                            {contributor.rank}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>

                    {/* Contributor */}
                    <TableCell sx={{ borderColor: DARK.border, py: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            bgcolor: contributor.avatarColor,
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            border: medal ? `2px solid ${medal}` : 'none',
                          }}
                        >
                          {contributor.avatar}
                        </Avatar>
                        <Box>
                          <Typography sx={{ color: DARK.text, fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>
                            {contributor.name}
                            {isCurrentUser && (
                              <Chip
                                label="You"
                                size="small"
                                sx={{
                                  ml: 1,
                                  height: 18,
                                  fontSize: '0.65rem',
                                  bgcolor: `${DARK.primary}22`,
                                  color: DARK.primary,
                                  fontWeight: 700,
                                }}
                              />
                            )}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Stations */}
                    <TableCell sx={{ borderColor: DARK.border, py: 1.5 }} align="center">
                      <Chip
                        label={contributor.stations === null ? '—' : contributor.stations}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          bgcolor: `${DARK.purple}22`,
                          color: DARK.purple,
                        }}
                      />
                    </TableCell>

                    {/* Metric Value */}
                    <TableCell sx={{ borderColor: DARK.border, py: 1.5 }} align="center">
                      <Typography sx={{ color: DARK.text, fontSize: 13, fontWeight: 700 }}>
                        {getMetricValue(contributor)}
                      </Typography>
                    </TableCell>

                    {/* Trend */}
                    <TableCell sx={{ borderColor: DARK.border, py: 1.5 }} align="center">
                      {getTrendIcon(contributor.trend)}
                    </TableCell>

                    {/* Region */}
                    <TableCell sx={{ borderColor: DARK.border, py: 1.5 }} align="center">
                      <Typography sx={{ color: DARK.textSecondary, fontSize: 12 }}>
                        {contributor.region}
                      </Typography>
                    </TableCell>

                    {/* Profile Link */}
                    <TableCell sx={{ borderColor: DARK.border, py: 1.5 }} align="right">
                      <Tooltip title="View Profile">
                        <IconButton size="small" sx={{ color: DARK.textSecondary, '&:hover': { color: DARK.primary } }}>
                          <OpenInNewIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}

              {paginatedContributors.length === 0 && hasFetched && contributors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} sx={{ borderColor: DARK.border, py: 2 }}>
                    <Typography>No contributors reported for this period.</Typography>
                  </TableCell>
                </TableRow>
              )}
              {paginatedContributors.length === 0 && (contributors.length > 0 || !hasFetched) && (
                <TableRow>
                  <TableCell colSpan={7} sx={{ borderColor: DARK.border, py: 6, textAlign: 'center' }}>
                    <SearchIcon sx={{ color: DARK.textSecondary, fontSize: 40, mb: 1 }} />
                    <Typography sx={{ color: DARK.textSecondary }}>
                      No contributors found matching your criteria.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, borderTop: `1px solid ${DARK.border}` }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, val) => setPage(val)}
              sx={{
                '& .MuiPaginationItem-root': {
                  color: DARK.textSecondary,
                  '&.Mui-selected': { bgcolor: DARK.primary, color: DARK.text },
                  '&:hover': { bgcolor: DARK.cardHover },
                },
              }}
            />
          </Box>
        )}
      </Paper>

      {/* Footer */}
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="caption" sx={{ color: DARK.textSecondary }}>
          Reported contributor data for {timePeriod === 'all' ? 'all time' : `the last ${timePeriod}`}.
        </Typography>
      </Box>
    </Box>
  );
};

export default function GlobalLeaderboard() {
  return <><RoleEarningsBoard /><LegacyGlobalLeaderboard /></>;
}
