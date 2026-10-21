import React, { useState, useMemo, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import SensorsIcon from '@mui/icons-material/Sensors';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PlaceIcon from '@mui/icons-material/Place';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import PublicIcon from '@mui/icons-material/Public';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Circle,
  Popup,
  Tooltip as LeafletTooltip,
} from 'react-leaflet';
import { MAP_TILE_URL, MAP_TILE_ATTRIBUTION } from '../../config/mapTiles';
import 'leaflet/dist/leaflet.css';
import { WrfCard, WrfStatCard, WrfButton, WrfBadge } from '../ui';
import { WrfCapabilityReadinessBadge } from '../DesignSystem';
import { colors, spacing, borderRadius, shadows } from '../ui/tokens';
import { apiClient } from '../../services/apiClient';
import DemoSurfaceGate from '../common/DemoSurfaceGate';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  quality: number;
  status: 'online' | 'offline' | 'degraded';
  type: string;
  uptime: number;
}

interface GapZone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
  severity: 'critical' | 'high' | 'moderate';
  rewardMultiplier: number;
  estimatedEarnings: number;
  nearestStation: string;
  distanceKm: number;
  population: number;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

// (MOCK_STATIONS and MOCK_GAPS removed — data fetched from API)

const SEVERITY_COLORS: Record<string, string> = {
  critical: colors.error.main,
  high: colors.warning.main,
  moderate: '#F59E0B80',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CoverageGapMap: React.FC = () => {
  const [selectedGap, setSelectedGap] = useState<GapZone | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [stations, setStations] = useState<Station[]>([]);
  const [gaps, setGaps] = useState<GapZone[]>([]);

  useEffect(() => {
    apiClient.get<Station[]>('/weather/intelligence/stations')
      .then((data) => { if (data) setStations(data); })
      .catch(() => { /* keep empty */ });
    apiClient.get<GapZone[]>('/weather/intelligence/gaps')
      .then((data) => { if (data) setGaps(data); })
      .catch(() => { /* keep empty */ });
  }, []);

  const filteredGaps = useMemo(() => {
    if (filterSeverity === 'all') return gaps;
    return gaps.filter((g) => g.severity === filterSeverity);
  }, [gaps, filterSeverity]);

  const stats = useMemo(() => {
    const onlineCount = stations.filter((s) => s.status === 'online').length;
    const avgQuality = stations.length > 0
      ? Math.round(stations.reduce((sum, s) => sum + s.quality, 0) / stations.length)
      : 0;
    const totalPop = gaps.reduce((sum, g) => sum + g.population, 0);
    const criticalGaps = gaps.filter((g) => g.severity === 'critical').length;
    return { onlineCount, avgQuality, totalPop, criticalGaps };
  }, [stations, gaps]);

  const mapCenter: [number, number] = [40.7328, -73.9560];

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: colors.bg.primary, padding: `${spacing.lg}px` }}>
      {/* Page Header */}
      <Box sx={{ marginBottom: `${spacing.lg}px` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px`, marginBottom: `${spacing.xs}px` }}>
          <PublicIcon sx={{ color: colors.brand.primary, fontSize: 28 }} />
          <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: colors.text.primary }}>
            Coverage Gap Map
          </Typography>
          <WrfCapabilityReadinessBadge featureName="weatherIntelligence" compact sx={{ ml: 1 }} />
        </Box>
        <Typography sx={{ fontSize: '0.875rem', color: colors.text.secondary }}>
          Identify coverage gaps in the weather station network and discover high-reward deployment opportunities.
        </Typography>
      </Box>

      {/* Stat Cards Row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: `${spacing.md}px`, marginBottom: `${spacing.lg}px` }}>
        <WrfStatCard
          label="Active Stations"
          value={stats.onlineCount}
          trend={8.2}
          trendLabel="vs last month"
          icon={SensorsIcon}
          color={colors.success.main}
          sparklineData={[12, 13, 13, 14, 15, 15, 16, 16, 17, 18]}
        />
        <WrfStatCard
          label="Coverage Gaps"
          value={gaps.length}
          trend={-12.5}
          trendLabel="vs last month"
          icon={WarningAmberIcon}
          color={colors.warning.main}
          sparklineData={[14, 13, 12, 11, 11, 10, 9, 8]}
        />
        <WrfStatCard
          label="Critical Gaps"
          value={stats.criticalGaps}
          trend={-25}
          trendLabel="vs last month"
          icon={WarningAmberIcon}
          color={colors.error.main}
          sparklineData={[5, 4, 4, 3, 3, 3, 2, 2]}
        />
        <WrfStatCard
          label="Avg Quality Score"
          value={`${stats.avgQuality}/100`}
          trend={3.1}
          trendLabel="vs last month"
          icon={SignalCellularAltIcon}
          color={colors.brand.primary}
          sparklineData={[85, 86, 87, 87, 88, 89, 90, 91]}
        />
      </Box>

      {/* Main Content: Map + Side Panel */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 380px' }, gap: `${spacing.md}px` }}>
        {/* Map */}
        <WrfCard title="Network Coverage Map" subtitle="Green markers = active stations. Red/amber zones = coverage gaps.">
          <Box
            sx={{
              height: 560,
              borderRadius: `${borderRadius.md}px`,
              overflow: 'hidden',
              border: `1px solid ${colors.border.default}`,
              '& .leaflet-container': { height: '100%', width: '100%', background: colors.bg.primary },
            }}
          >
            <MapContainer
              center={mapCenter}
              zoom={11}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
            >
              <TileLayer
                url={MAP_TILE_URL}
                attribution={MAP_TILE_ATTRIBUTION}
              />

              {/* Station Markers */}
              {stations.map((station) => {
                const markerColor =
                  station.status === 'online'
                    ? colors.success.main
                    : station.status === 'degraded'
                      ? colors.warning.main
                      : colors.text.muted;

                return (
                  <CircleMarker
                    key={station.id}
                    center={[station.lat, station.lng]}
                    radius={6}
                    pathOptions={{
                      fillColor: markerColor,
                      fillOpacity: 0.9,
                      color: markerColor,
                      weight: 2,
                      opacity: 1,
                    }}
                  >
                    <Popup>
                      <div style={{ color: '#111', minWidth: 160 }}>
                        <strong>{station.name}</strong>
                        <br />
                        ID: {station.id}
                        <br />
                        Type: {station.type}
                        <br />
                        Quality: {station.quality}/100
                        <br />
                        Uptime: {station.uptime}%
                        <br />
                        Status: {station.status}
                      </div>
                    </Popup>
                    <LeafletTooltip direction="top" offset={[0, -8]}>
                      {station.name} ({station.quality}/100)
                    </LeafletTooltip>
                  </CircleMarker>
                );
              })}

              {/* Gap Zones */}
              {filteredGaps.map((gap) => (
                <Circle
                  key={gap.id}
                  center={[gap.lat, gap.lng]}
                  radius={gap.radius}
                  pathOptions={{
                    fillColor: SEVERITY_COLORS[gap.severity],
                    fillOpacity: 0.18,
                    color: SEVERITY_COLORS[gap.severity],
                    weight: 2,
                    opacity: 0.7,
                    dashArray: gap.severity === 'critical' ? undefined : '6 4',
                  }}
                  eventHandlers={{
                    click: () => setSelectedGap(gap),
                  }}
                >
                  <Popup>
                    <div style={{ color: '#111', minWidth: 180 }}>
                      <strong>{gap.name} - Coverage Gap</strong>
                      <br />
                      Severity: {gap.severity.toUpperCase()}
                      <br />
                      Reward Multiplier: {gap.rewardMultiplier}x
                      <br />
                      Est. Earnings: {gap.estimatedEarnings} WRF/month
                      <br />
                      Population: {gap.population.toLocaleString()}
                      <br />
                      Nearest: {gap.nearestStation} ({gap.distanceKm} km)
                    </div>
                  </Popup>
                </Circle>
              ))}
            </MapContainer>
          </Box>
        </WrfCard>

        {/* Side Panel */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${spacing.md}px` }}>
          {/* Coverage Stats */}
          <WrfCard title="Coverage Summary">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${spacing.sm}px` }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontSize: '0.8125rem', color: colors.text.secondary }}>Network Coverage</Typography>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.text.primary }}>73.4%</Typography>
              </Box>
              <Box sx={{ width: '100%', height: 6, backgroundColor: colors.bg.tertiary, borderRadius: `${borderRadius.full}px`, overflow: 'hidden' }}>
                <Box sx={{ width: '73.4%', height: '100%', backgroundColor: colors.success.main, borderRadius: `${borderRadius.full}px` }} />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                <Typography sx={{ fontSize: '0.8125rem', color: colors.text.secondary }}>Population Covered</Typography>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.text.primary }}>
                  {((1 - stats.totalPop / 8336817) * 100).toFixed(1)}%
                </Typography>
              </Box>
              <Box sx={{ width: '100%', height: 6, backgroundColor: colors.bg.tertiary, borderRadius: `${borderRadius.full}px`, overflow: 'hidden' }}>
                <Box sx={{ width: '93.2%', height: '100%', backgroundColor: colors.brand.primary, borderRadius: `${borderRadius.full}px` }} />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                <Typography sx={{ fontSize: '0.8125rem', color: colors.text.secondary }}>Avg Station Uptime</Typography>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.text.primary }}>96.1%</Typography>
              </Box>
              <Box sx={{ width: '100%', height: 6, backgroundColor: colors.bg.tertiary, borderRadius: `${borderRadius.full}px`, overflow: 'hidden' }}>
                <Box sx={{ width: '96.1%', height: '100%', backgroundColor: colors.success.light, borderRadius: `${borderRadius.full}px` }} />
              </Box>
            </Box>
          </WrfCard>

          {/* Severity Filter */}
          <WrfCard title="Gap Severity Filter">
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: `${spacing.xs}px` }}>
              {['all', 'critical', 'high', 'moderate'].map((sev) => (
                <Chip
                  key={sev}
                  label={sev === 'all' ? 'All Gaps' : sev.charAt(0).toUpperCase() + sev.slice(1)}
                  size="small"
                  onClick={() => setFilterSeverity(sev)}
                  sx={{
                    backgroundColor: filterSeverity === sev ? colors.brand.primary : colors.bg.tertiary,
                    color: filterSeverity === sev ? '#fff' : colors.text.secondary,
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: filterSeverity === sev ? colors.brand.hover : colors.border.default },
                  }}
                />
              ))}
            </Box>
          </WrfCard>

          {/* Deploy Here Callouts */}
          <WrfCard
            title="Deploy Here"
            subtitle="Top reward opportunities for new station deployments"
            action={<WrfBadge status="online" label={`${filteredGaps.length} zones`} size="sm" />}
          >
            <List disablePadding sx={{ maxHeight: 320, overflowY: 'auto' }}>
              {filteredGaps
                .sort((a, b) => b.estimatedEarnings - a.estimatedEarnings)
                .map((gap, idx) => (
                  <React.Fragment key={gap.id}>
                    {idx > 0 && <Divider sx={{ borderColor: colors.border.default }} />}
                    <ListItem
                      sx={{
                        px: 0,
                        py: 1,
                        cursor: 'pointer',
                        borderRadius: `${borderRadius.md}px`,
                        '&:hover': { backgroundColor: 'rgba(59, 130, 246, 0.06)' },
                        backgroundColor: selectedGap?.id === gap.id ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                      }}
                      onClick={() => setSelectedGap(gap)}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <PlaceIcon sx={{ color: SEVERITY_COLORS[gap.severity], fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: colors.text.primary }}>
                              {gap.name}
                            </Typography>
                            <Chip
                              label={`${gap.rewardMultiplier}x`}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.625rem',
                                fontWeight: 700,
                                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                color: colors.success.main,
                              }}
                            />
                          </Box>
                        }
                        secondary={
                          <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted }}>
                            ~{gap.estimatedEarnings} WRF/mo &middot; {gap.distanceKm} km from {gap.nearestStation}
                          </Typography>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
            </List>
          </WrfCard>

          {/* Selected Gap Details */}
          {selectedGap && (
            <WrfCard variant="glass" title={`${selectedGap.name} Details`}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${spacing.sm}px` }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: '0.8125rem', color: colors.text.muted }}>Severity</Typography>
                  <WrfBadge
                    status={selectedGap.severity === 'critical' ? 'offline' : selectedGap.severity === 'high' ? 'degraded' : 'pending'}
                    label={selectedGap.severity.toUpperCase()}
                    size="sm"
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: '0.8125rem', color: colors.text.muted }}>Reward Multiplier</Typography>
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.success.main }}>{selectedGap.rewardMultiplier}x</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: '0.8125rem', color: colors.text.muted }}>Est. Monthly Earnings</Typography>
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.text.primary }}>{selectedGap.estimatedEarnings} WRF</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: '0.8125rem', color: colors.text.muted }}>Population Served</Typography>
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.text.primary }}>{selectedGap.population.toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: '0.8125rem', color: colors.text.muted }}>Nearest Station</Typography>
                  <Typography sx={{ fontSize: '0.875rem', color: colors.text.secondary }}>{selectedGap.nearestStation}</Typography>
                </Box>

                <WrfButton
                  variant="primary"
                  size="md"
                  fullWidth
                  startIcon={<RocketLaunchIcon sx={{ fontSize: 18 }} />}
                  sx={{ marginTop: `${spacing.sm}px` }}
                >
                  Deploy Station Here
                </WrfButton>
              </Box>
            </WrfCard>
          )}
        </Box>
      </Box>
    </Box>
  );
};

// frontend#415: the backend has no /api/weather/intelligence/* routes, so the map
// could never show a station or a gap. The default build shows the honest
// not-live state instead and never mounts the map.
const CoverageGapMapGate: React.FC = () => (
  <DemoSurfaceGate
    testId="coverage-gap-map"
    title="Coverage gap analysis is not live"
    description="The backend has no weather-intelligence station or gap routes yet."
  >
    <CoverageGapMap />
  </DemoSurfaceGate>
);

export default CoverageGapMapGate;
