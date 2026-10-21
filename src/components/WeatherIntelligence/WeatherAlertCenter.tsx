import React, { useState, useMemo, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PlaceIcon from '@mui/icons-material/Place';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SensorsIcon from '@mui/icons-material/Sensors';
import FloodIcon from '@mui/icons-material/Flood';
import ThunderstormIcon from '@mui/icons-material/Thunderstorm';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import AirIcon from '@mui/icons-material/Air';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Circle,
  Popup,
} from 'react-leaflet';
import { MAP_TILE_URL, MAP_TILE_ATTRIBUTION } from '../../config/mapTiles';
import 'leaflet/dist/leaflet.css';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { WrfCard, WrfStatCard, WrfBadge, WrfButton } from '../ui';
import { WrfCapabilityReadinessBadge } from '../DesignSystem';
import { colors, spacing, borderRadius } from '../ui/tokens';
import { apiClient } from '../../services/apiClient';

ChartJS.register(ArcElement, Tooltip, Legend);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WeatherAlert {
  id: string;
  type: 'thunderstorm' | 'flood' | 'winter_storm' | 'heat_wave' | 'high_wind' | 'tornado';
  severity: 'extreme' | 'severe' | 'moderate' | 'minor';
  title: string;
  description: string;
  issuedAt: string;
  expiresAt: string;
  lat: number;
  lng: number;
  radius: number;
  affectedStations: string[];
  status: 'active' | 'expired' | 'cancelled';
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const ALERT_TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  thunderstorm: { icon: ThunderstormIcon, color: '#8B5CF6', label: 'Thunderstorm' },
  flood: { icon: FloodIcon, color: colors.brand.primary, label: 'Flood' },
  winter_storm: { icon: AcUnitIcon, color: '#06B6D4', label: 'Winter Storm' },
  heat_wave: { icon: WhatshotIcon, color: colors.error.main, label: 'Heat Wave' },
  high_wind: { icon: AirIcon, color: colors.warning.main, label: 'High Wind' },
  tornado: { icon: ThunderstormIcon, color: colors.error.dark, label: 'Tornado' },
};

const SEVERITY_CONFIG: Record<string, { color: string; bg: string }> = {
  extreme: { color: colors.error.main, bg: 'rgba(239, 68, 68, 0.12)' },
  severe: { color: colors.warning.main, bg: 'rgba(245, 158, 11, 0.12)' },
  moderate: { color: colors.warning.light, bg: 'rgba(251, 191, 36, 0.10)' },
  minor: { color: colors.text.muted, bg: 'rgba(100, 116, 139, 0.10)' },
};

// (MOCK_ALERTS removed — fetched from API)

// Timeline milestones
const TIMELINE_EVENTS = [
  { time: '04:00', label: 'Winter Storm Warning Issued', severity: 'extreme' as const },
  { time: '06:00', label: 'Coastal Flood Advisory Issued', severity: 'moderate' as const },
  { time: '08:30', label: 'Thunderstorm Warning Issued', severity: 'severe' as const },
  { time: '10:00', label: 'Wind Advisory Issued', severity: 'moderate' as const },
  { time: '14:00', label: 'Thunderstorm Warning Expires', severity: 'minor' as const },
  { time: '18:00', label: 'Flood Advisory Expires', severity: 'minor' as const },
  { time: '22:00', label: 'Wind Advisory Expires', severity: 'minor' as const },
];

// ---------------------------------------------------------------------------
// Timeline SVG
// ---------------------------------------------------------------------------

const AlertTimeline: React.FC = () => {
  const svgW = 640;
  const svgH = 220;
  const lineY = 40;
  const stepX = svgW / (TIMELINE_EVENTS.length + 1);

  return (
    <svg width="100%" height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="xMidYMid meet">
      {/* Main timeline line */}
      <line x1={20} y1={lineY} x2={svgW - 20} y2={lineY} stroke={colors.border.default} strokeWidth={2} />

      {TIMELINE_EVENTS.map((evt, i) => {
        const x = stepX * (i + 1);
        const sevConfig = SEVERITY_CONFIG[evt.severity];
        return (
          <g key={i}>
            {/* Vertical tick */}
            <line x1={x} y1={lineY - 8} x2={x} y2={lineY + 8} stroke={sevConfig.color} strokeWidth={2} />
            {/* Dot */}
            <circle cx={x} cy={lineY} r={5} fill={sevConfig.color} />
            {/* Time label */}
            <text x={x} y={lineY + 24} textAnchor="middle" fill={colors.text.primary} fontSize={11} fontWeight={600}>
              {evt.time}
            </text>
            {/* Event label - alternating above/below */}
            <text
              x={x}
              y={i % 2 === 0 ? lineY + 42 : lineY + 56}
              textAnchor="middle"
              fill={colors.text.secondary}
              fontSize={9}
            >
              {evt.label.length > 28 ? evt.label.substring(0, 28) + '...' : evt.label}
            </text>
          </g>
        );
      })}

      {/* Current time marker */}
      <g>
        <line x1={stepX * 4.3} y1={lineY - 14} x2={stepX * 4.3} y2={lineY + 14} stroke={colors.brand.primary} strokeWidth={2} strokeDasharray="4 2" />
        <text x={stepX * 4.3} y={lineY + 80} textAnchor="middle" fill={colors.brand.primary} fontSize={10} fontWeight={600}>
          NOW
        </text>
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const WeatherAlertCenter: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<string>('active');
  const [selectedAlert, setSelectedAlert] = useState<WeatherAlert | null>(null);
  const [allAlerts, setAllAlerts] = useState<WeatherAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setFetchError(null);
    apiClient.get<WeatherAlert[]>('/weather/alerts/active')
      .then((data) => {
        setAllAlerts(Array.isArray(data) ? data : []);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        setFetchError(err instanceof Error ? err.message : 'Failed to load alerts');
        setIsLoading(false);
      });
  }, []);

  const filteredAlerts = useMemo(() => {
    if (filterStatus === 'all') return allAlerts;
    return allAlerts.filter((a) => a.status === filterStatus);
  }, [allAlerts, filterStatus]);

  const activeAlerts = useMemo(() => allAlerts.filter((a) => a.status === 'active'), [allAlerts]);
  const extremeCount = useMemo(() => activeAlerts.filter((a) => a.severity === 'extreme').length, [activeAlerts]);
  const affectedStationCount = useMemo(
    () => new Set(activeAlerts.flatMap((a) => a.affectedStations)).size,
    [activeAlerts],
  );

  // Type breakdown for doughnut
  const typeBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    allAlerts.forEach((a) => {
      counts[a.type] = (counts[a.type] || 0) + 1;
    });
    const entries = Object.entries(counts);
    return {
      labels: entries.map(([type]) => ALERT_TYPE_CONFIG[type]?.label || type),
      datasets: [
        {
          data: entries.map(([, count]) => count),
          backgroundColor: entries.map(([type]) => ALERT_TYPE_CONFIG[type]?.color || colors.text.muted),
          borderColor: colors.bg.secondary,
          borderWidth: 2,
        },
      ],
    };
  }, [allAlerts]);

  const mapCenter: [number, number] = [40.7528, -73.9360];

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: colors.bg.primary, padding: `${spacing.lg}px` }}>
      {/* Page Header */}
      <Box sx={{ marginBottom: `${spacing.lg}px` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px`, marginBottom: `${spacing.xs}px` }}>
          <NotificationsActiveIcon sx={{ color: colors.warning.main, fontSize: 28 }} />
          <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: colors.text.primary }}>
            Weather Alert Center
          </Typography>
          <WrfCapabilityReadinessBadge featureName="weatherIntelligence" compact sx={{ ml: 1 }} />
          {activeAlerts.length > 0 && (
            <WrfBadge status="degraded" label={`${activeAlerts.length} Active`} size="md" pulse />
          )}
        </Box>
        <Typography sx={{ fontSize: '0.875rem', color: colors.text.secondary }}>
          Real-time weather alerts, severity tracking, and station impact analysis for the WRFCoin network.
        </Typography>
      </Box>

      {/* Active Alerts Banner */}
      {extremeCount > 0 && (
        <Box
          sx={{
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: `1px solid ${colors.error.main}`,
            borderRadius: `${borderRadius.lg}px`,
            padding: `${spacing.md}px ${spacing.lg}px`,
            display: 'flex',
            alignItems: 'center',
            gap: `${spacing.md}px`,
            marginBottom: `${spacing.lg}px`,
          }}
        >
          <WarningAmberIcon sx={{ color: colors.error.main, fontSize: 28 }} />
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: '0.9375rem', fontWeight: 700, color: colors.error.main }}>
              {extremeCount} Extreme Weather Alert{extremeCount > 1 ? 's' : ''} Active
            </Typography>
            <Typography sx={{ fontSize: '0.8125rem', color: colors.text.secondary }}>
              {activeAlerts
                .filter((a) => a.severity === 'extreme')
                .map((a) => a.title)
                .join(' | ')}
            </Typography>
          </Box>
          <WrfButton variant="danger" size="sm">
            View All
          </WrfButton>
        </Box>
      )}

      {/* Stat Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: `${spacing.md}px`, marginBottom: `${spacing.lg}px` }}>
        <WrfStatCard
          label="Active Alerts"
          value={activeAlerts.length}
          trend={-15}
          trendLabel="vs yesterday"
          icon={NotificationsActiveIcon}
          color={colors.warning.main}
          sparklineData={[8, 7, 6, 7, 5, 5, 4, 4]}
        />
        <WrfStatCard
          label="Extreme Severity"
          value={extremeCount}
          trend={0}
          trendLabel="no change"
          icon={WarningAmberIcon}
          color={colors.error.main}
          sparklineData={[2, 1, 2, 1, 1, 2, 1, 1]}
        />
        <WrfStatCard
          label="Affected Stations"
          value={affectedStationCount}
          trend={-8.3}
          trendLabel="vs yesterday"
          icon={SensorsIcon}
          color={colors.brand.primary}
          sparklineData={[12, 11, 10, 9, 9, 8, 7, 7]}
        />
        <WrfStatCard
          label="Avg Response Time"
          value="4.2 min"
          trend={-22.4}
          trendLabel="improvement"
          icon={AccessTimeIcon}
          color={colors.success.main}
          sparklineData={[8.1, 7.2, 6.5, 5.8, 5.2, 4.8, 4.5, 4.2]}
        />
      </Box>

      {/* Main Content */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 380px' }, gap: `${spacing.md}px`, marginBottom: `${spacing.md}px` }}>
        {/* Alert Feed */}
        <WrfCard
          title="Alert Feed"
          action={
            <Box sx={{ display: 'flex', gap: `${spacing.xs}px` }}>
              {['active', 'expired', 'cancelled', 'all'].map((status) => (
                <Chip
                  key={status}
                  label={status.charAt(0).toUpperCase() + status.slice(1)}
                  size="small"
                  onClick={() => setFilterStatus(status)}
                  sx={{
                    backgroundColor: filterStatus === status ? colors.brand.primary : colors.bg.tertiary,
                    color: filterStatus === status ? '#fff' : colors.text.secondary,
                    fontWeight: 500,
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: filterStatus === status ? colors.brand.hover : colors.border.default },
                  }}
                />
              ))}
            </Box>
          }
        >
          <List disablePadding sx={{ maxHeight: 480, overflowY: 'auto' }}>
            {isLoading && (
              <ListItem sx={{ justifyContent: 'center', py: 4 }}>
                <Typography sx={{ fontSize: '0.875rem', color: colors.text.muted }}>
                  Loading alerts…
                </Typography>
              </ListItem>
            )}
            {!isLoading && fetchError && (
              <ListItem sx={{ justifyContent: 'center', py: 4 }}>
                <Typography sx={{ fontSize: '0.875rem', color: colors.error.main }}>
                  {fetchError}
                </Typography>
              </ListItem>
            )}
            {!isLoading && !fetchError && filteredAlerts.length === 0 && (
              <ListItem sx={{ justifyContent: 'center', py: 4 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <CheckCircleIcon sx={{ fontSize: 32, color: colors.success.main, mb: 1 }} />
                  <Typography sx={{ fontSize: '0.875rem', color: colors.text.muted }}>
                    No {filterStatus !== 'all' ? filterStatus : ''} alerts
                  </Typography>
                </Box>
              </ListItem>
            )}
            {!isLoading && !fetchError && filteredAlerts.map((alert, idx) => {
              const typeConf = ALERT_TYPE_CONFIG[alert.type];
              const sevConf = SEVERITY_CONFIG[alert.severity];
              const IconComp = typeConf?.icon || WarningAmberIcon;

              return (
                <React.Fragment key={alert.id}>
                  {idx > 0 && <Divider sx={{ borderColor: colors.border.default }} />}
                  <ListItem
                    sx={{
                      px: 0,
                      py: 1.5,
                      cursor: 'pointer',
                      borderRadius: `${borderRadius.md}px`,
                      backgroundColor: selectedAlert?.id === alert.id ? 'rgba(59, 130, 246, 0.06)' : 'transparent',
                      '&:hover': { backgroundColor: 'rgba(59, 130, 246, 0.04)' },
                      opacity: alert.status !== 'active' ? 0.6 : 1,
                    }}
                    onClick={() => setSelectedAlert(alert)}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: `${borderRadius.md}px`,
                          backgroundColor: sevConf.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <IconComp sx={{ fontSize: 18, color: typeConf?.color || colors.text.muted }} />
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: colors.text.primary, flex: 1 }}>
                            {alert.title}
                          </Typography>
                          <Chip
                            label={alert.severity}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.625rem',
                              fontWeight: 600,
                              backgroundColor: sevConf.bg,
                              color: sevConf.color,
                              textTransform: 'uppercase',
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted, lineHeight: 1.4, mb: 0.5 }}>
                            {alert.description.substring(0, 100)}...
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccessTimeIcon sx={{ fontSize: 12, color: colors.text.muted }} />
                            <Typography sx={{ fontSize: '0.6875rem', color: colors.text.muted }}>
                              Issued: {new Date(alert.issuedAt).toLocaleString()}
                            </Typography>
                            {alert.status === 'active' ? (
                              <WrfBadge status="degraded" label="Active" size="sm" />
                            ) : alert.status === 'expired' ? (
                              <WrfBadge status="offline" label="Expired" size="sm" />
                            ) : (
                              <WrfBadge status="offline" label="Cancelled" size="sm" />
                            )}
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                </React.Fragment>
              );
            })}
          </List>
        </WrfCard>

        {/* Right Column */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${spacing.md}px` }}>
          {/* Alert Zone Map */}
          <WrfCard title="Alert Zone Map">
            <Box
              sx={{
                height: 280,
                borderRadius: `${borderRadius.md}px`,
                overflow: 'hidden',
                border: `1px solid ${colors.border.default}`,
                '& .leaflet-container': { height: '100%', width: '100%', background: colors.bg.primary },
              }}
            >
              <MapContainer
                center={mapCenter}
                zoom={10}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
              >
                <TileLayer url={MAP_TILE_URL} attribution={MAP_TILE_ATTRIBUTION} />

                {activeAlerts.map((alert) => {
                  const sevConf = SEVERITY_CONFIG[alert.severity];
                  return (
                    <Circle
                      key={alert.id}
                      center={[alert.lat, alert.lng]}
                      radius={alert.radius}
                      pathOptions={{
                        fillColor: sevConf.color,
                        fillOpacity: 0.15,
                        color: sevConf.color,
                        weight: 2,
                        opacity: 0.6,
                      }}
                    >
                      <Popup>
                        <div style={{ color: '#111', minWidth: 160 }}>
                          <strong>{alert.title}</strong>
                          <br />
                          Severity: {alert.severity.toUpperCase()}
                          <br />
                          Stations: {alert.affectedStations.length}
                        </div>
                      </Popup>
                    </Circle>
                  );
                })}
              </MapContainer>
            </Box>
          </WrfCard>

          {/* Affected Stations */}
          {selectedAlert && (
            <WrfCard title="Affected Stations" subtitle={selectedAlert.title}>
              <List disablePadding>
                {selectedAlert.affectedStations.map((stationId) => (
                  <ListItem key={stationId} sx={{ px: 0, py: 0.75 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <SensorsIcon sx={{ fontSize: 16, color: colors.warning.main }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography sx={{ fontSize: '0.8125rem', color: colors.text.primary }}>{stationId}</Typography>
                      }
                    />
                    <WrfBadge status="degraded" label="Impacted" size="sm" />
                  </ListItem>
                ))}
              </List>
            </WrfCard>
          )}

          {/* Type Breakdown Doughnut */}
          <WrfCard title="Alert Type Breakdown">
            <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Doughnut
                data={typeBreakdown}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '60%',
                  plugins: {
                    legend: {
                      position: 'right' as const,
                      labels: { color: colors.text.secondary, font: { size: 10 }, padding: 8, usePointStyle: true, pointStyleWidth: 8 },
                    },
                    tooltip: {
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      titleColor: colors.text.primary,
                      bodyColor: colors.text.secondary,
                      borderColor: colors.border.default,
                      borderWidth: 1,
                    },
                  },
                }}
              />
            </Box>
          </WrfCard>
        </Box>
      </Box>

      {/* Timeline */}
      <WrfCard title="Alert Timeline" subtitle="Chronological view of all alert activity for today (Feb 14, 2026)">
        <Box sx={{ overflowX: 'auto', py: 1 }}>
          <AlertTimeline />
        </Box>
      </WrfCard>
    </Box>
  );
};

export default WeatherAlertCenter;
