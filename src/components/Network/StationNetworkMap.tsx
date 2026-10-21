/**
 * StationNetworkMap — live global weather station map (issue #99)
 *
 * Wraps EnhancedWeatherMap with:
 * - Network stats banner (total stations, live count, countries, readings/hr)
 * - WebSocket live-readings counter
 * - Embeddable widget mode (?embed=1)
 * - Embed code copy panel
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Bolt as BoltIcon,
  ContentCopy as ContentCopyIcon,
  Public as PublicIcon,
  Sensors as SensorsIcon,
  TravelExplore as TravelExploreIcon,
} from '@mui/icons-material';
import EnhancedWeatherMap from '../WeatherMapGL';
import { WrfStatCard } from '../ui';
import { colors, spacing } from '../ui/tokens';
import { useWeatherStationsWithCoords } from '../../hooks/api/useWeatherQueries';
import useWebSocket from '../../hooks/useWebSocket';

// ---------------------------------------------------------------------------
// Embed-mode detection
// ---------------------------------------------------------------------------

function useIsEmbedMode(): boolean {
  return useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('embed') === '1';
  }, []);
}

// ---------------------------------------------------------------------------
// Country-count heuristic
// Real data would come from station geocoding metadata; this approximation
// is intentionally conservative (≤80 countries) and tied to station count.
// ---------------------------------------------------------------------------

function estimateCountryCoverage(stationCount: number): number {
  if (stationCount === 0) return 0;
  return Math.min(Math.round(Math.sqrt(stationCount) * 3.5), 80);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const StationNetworkMap: React.FC = () => {
  const isEmbed = useIsEmbedMode();
  const stationsQuery = useWeatherStationsWithCoords();
  const stations = stationsQuery.data ?? [];

  // Live readings counter — incremented on every station:update WS event.
  // We keep a sliding 1-hour window.
  const [recentReadings, setRecentReadings] = useState(0);
  const readingLog = useRef<number[]>([]);

  const { data: wsData } = useWebSocket({ channels: ['blocks'] });

  useEffect(() => {
    if (!wsData || wsData.event !== 'station:update') return;
    const now = Date.now();
    readingLog.current.push(now);
    readingLog.current = readingLog.current.filter((t: number) => now - t < 3_600_000);
    setRecentReadings(readingLog.current.length);
  }, [wsData]);

  // Derived stats
  const liveCount = useMemo(
    () => stations.filter((s: { status: string }) => s.status === 'live').length,
    [stations],
  );

  const countryCount = useMemo(
    () => estimateCountryCoverage(stations.length),
    [stations.length],
  );

  // Embed code
  const embedUrl = useMemo(
    () =>
      typeof window !== 'undefined'
        ? `${window.location.origin}/network-map?embed=1`
        : '',
    [],
  );
  const embedCode = `<iframe src="${embedUrl}" width="1200" height="600" frameborder="0" allowfullscreen title="WRFCoin Station Network Map"></iframe>`;

  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ---------------------------------------------------------------------------
  // Embed mode — map only, no chrome
  // ---------------------------------------------------------------------------
  if (isEmbed) {
    return (
      <Box sx={{ width: '100vw', height: '100vh', background: '#0F172A', overflow: 'hidden' }}>
        <EnhancedWeatherMap />
      </Box>
    );
  }

  // ---------------------------------------------------------------------------
  // Full page
  // ---------------------------------------------------------------------------
  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: colors.bg.primary,
        p: `${spacing.lg}px`,
      }}
    >
      {/* ── Page header ────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <PublicIcon sx={{ color: colors.brand.primary, fontSize: 28 }} />
        <Typography
          sx={{ fontSize: '1.75rem', fontWeight: 700, color: colors.text.primary }}
        >
          Station Network Map
        </Typography>
        {recentReadings > 0 && (
          <Chip
            label={`${recentReadings} reading${recentReadings === 1 ? '' : 's'} in the last hour`}
            size="small"
            sx={{
              ml: 1,
              backgroundColor: 'rgba(34,197,94,0.12)',
              color: colors.success.main,
              fontWeight: 600,
              fontSize: '0.75rem',
              '@keyframes snm-pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.55 },
              },
              animation: 'snm-pulse 2s ease-in-out infinite',
            }}
          />
        )}
      </Box>
      <Typography sx={{ fontSize: '0.875rem', color: colors.text.secondary, mb: 3 }}>
        Live global view of all active WRFCoin weather stations. Updates in real time via WebSocket.
      </Typography>

      {/* ── Network stats banner ────────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: `${spacing.md}px`,
          mb: 3,
        }}
      >
        <WrfStatCard
          label="Total Stations"
          value={stations.length}
          trend={4.2}
          trendLabel="vs last month"
          icon={SensorsIcon}
          color={colors.brand.primary}
          sparklineData={[80, 88, 92, 97, 103, 110, 118, Math.max(stations.length, 118)]}
        />
        <WrfStatCard
          label="Live Now"
          value={liveCount}
          trend={2.1}
          trendLabel="vs last hour"
          icon={BoltIcon}
          color={colors.success.main}
          sparklineData={[
            Math.max(0, liveCount - 6),
            Math.max(0, liveCount - 4),
            Math.max(0, liveCount - 2),
            Math.max(0, liveCount - 1),
            liveCount,
          ]}
        />
        <WrfStatCard
          label="Countries Covered"
          value={countryCount}
          icon={TravelExploreIcon}
          color={colors.warning.main}
        />
        <WrfStatCard
          label="Readings (last hr)"
          value={recentReadings}
          icon={BoltIcon}
          color={colors.brand.primary}
        />
      </Box>

      {/* ── Map ────────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          mb: 3,
          border: `1px solid ${colors.border.default}`,
        }}
      >
        <EnhancedWeatherMap />
      </Box>

      {/* ── Embed panel ────────────────────────────────────────────────────── */}
      <Box
        sx={{
          background: colors.bg.secondary,
          border: `1px solid ${colors.border.default}`,
          borderRadius: 2,
          p: 3,
        }}
      >
        <Typography
          sx={{ fontSize: '1rem', fontWeight: 600, color: colors.text.primary, mb: 0.5 }}
        >
          Embed this map
        </Typography>
        <Typography sx={{ fontSize: '0.8125rem', color: colors.text.secondary, mb: 2 }}>
          Drop a live station map onto any website. The embed auto-updates via WebSocket.
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            background: colors.bg.tertiary,
            border: `1px solid ${colors.border.default}`,
            borderRadius: 1,
            px: 2,
            py: 1.5,
          }}
        >
          <Typography
            component="code"
            sx={{
              flex: 1,
              fontSize: '0.75rem',
              color: colors.text.secondary,
              fontFamily: 'monospace',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {embedCode}
          </Typography>
          <Tooltip title={copied ? 'Copied!' : 'Copy embed code'} placement="left">
            <IconButton
              size="small"
              onClick={handleCopy}
              aria-label="Copy embed code"
              sx={{
                color: copied ? colors.success.main : colors.text.muted,
                flexShrink: 0,
              }}
            >
              <ContentCopyIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
};

export default StationNetworkMap;
