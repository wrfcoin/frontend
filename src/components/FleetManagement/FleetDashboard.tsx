import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Grid,
  Paper,
  Switch,
  FormControlLabel,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon, CompareArrows as CompareIcon } from '@mui/icons-material';
import { apiClient } from '../../services/apiClient';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { MAP_TILE_URL, MAP_TILE_ATTRIBUTION } from '../../config/mapTiles';
import 'leaflet/dist/leaflet.css';
import StationCard from './StationCard';
import ComparePanel from './ComparePanel';
import BatchOperationsBar from './BatchOperationsBar';
import type { FleetStation, StationStatus } from './StationCard';
import type { BatchAction } from './BatchOperationsBar';
import { devLog } from '../../utils/logger';
import PublicViewerNotice from '../common/PublicViewerNotice';

// (mock data removed — fleet stations fetched from API)

// --- Helpers ---

const STATUS_MARKER_COLORS: Record<StationStatus, string> = {
  live: '#10B981',
  warning: '#F59E0B',
  offline: '#EF4444',
  paused: '#6B7280',
};

const pulseKeyframes = `
@keyframes fleetPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.3); }
}
`;

// --- Component ---

const FleetDashboard: React.FC = () => {
  const [stations, setStations] = useState<FleetStation[]>([]);
  const [stationsLoading, setStationsLoading] = useState(true);
  const [stationsError, setStationsError] = useState(false);

  useEffect(() => {
    apiClient.get<FleetStation[]>('/fleet/stations')
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('Fleet response is incomplete');
        setStations(data);
      })
      .catch(() => setStationsError(true))
      .finally(() => setStationsLoading(false));
  }, []);

  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Fleet summary stats
  const summary = useMemo(() => {
    const liveStations = stations.filter((s) => s.status === 'live');
    const activeStations = stations.filter((s) => s.status !== 'offline' && s.status !== 'paused');
    const offlineCount = stations.filter((s) => s.status === 'offline').length;

    const totalEarnings = stations.reduce((sum, s) => sum + s.earningsToday, 0);
    const avgQuality =
      activeStations.length > 0
        ? activeStations.reduce((sum, s) => sum + s.qualityScore, 0) / activeStations.length
        : 0;
    const avgUptime =
      activeStations.length > 0
        ? activeStations.reduce((sum, s) => sum + s.uptimePercent, 0) / activeStations.length
        : 0;

    let suggestion = '';
    if (offlineCount > 0) {
      suggestion = `${offlineCount} station${offlineCount > 1 ? 's' : ''} offline -- check connectivity to resume earning.`;
    } else if (stations.some((s) => s.status === 'warning')) {
      suggestion = 'Some stations have quality warnings. Review sensor calibration.';
    }

    return {
      totalEarnings,
      avgQuality: Math.round(avgQuality),
      avgUptime: Math.round(avgUptime),
      liveCount: liveStations.length,
      suggestion,
    };
  }, [stations]);

  const selectedStations = useMemo(
    () => stations.filter((s) => selectedIds.has(s.id)),
    [stations, selectedIds],
  );

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 4) {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleNavigate = useCallback((id: string) => {
    // In a real app, this would use react-router navigation
    devLog(`Navigate to /weather/station/${id}`);
  }, []);

  const handleRename = useCallback((id: string, newName: string) => {
    setStations((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name: newName } : s)),
    );
  }, []);

  const handleRemoveFromCompare = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const handleBatchAction = useCallback((action: BatchAction, params?: Record<string, unknown>) => {
    devLog(`Batch action: ${action}`, { selectedIds: [...selectedIds], params });
    // In a real app, this would call the API
  }, [selectedIds]);

  const handleToggleCompare = useCallback(() => {
    setCompareMode((prev) => {
      if (prev) {
        // Exiting compare mode clears selection
        setSelectedIds(new Set());
      }
      return !prev;
    });
  }, []);

  if (stationsLoading) return <Box role="status"><CircularProgress /><Typography>Loading fleet stations.</Typography></Box>;
  if (stationsError) return <PublicViewerNotice title="Fleet management is unavailable" description="Fleet stations could not be read. No station status or earnings are available." />;

  return (
    <Box
      sx={{
        bgcolor: '#0F172A',
        minHeight: '100vh',
        color: '#F8FAFC',
        position: 'relative',
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
          flexWrap: 'wrap',
          gap: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              letterSpacing: 2,
              fontFamily: '"Inter", sans-serif',
              background: 'linear-gradient(135deg, #60A5FA, #A78BFA)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            MY STATIONS
          </Typography>
          <Chip
            label={`${stations.length}`}
            size="small"
            sx={{
              height: 24,
              bgcolor: 'rgba(59,130,246,0.1)',
              color: '#3B82F6',
              fontWeight: 800,
              fontSize: '0.75rem',
              fontFamily: '"JetBrains Mono", monospace',
              border: '1px solid rgba(59,130,246,0.2)',
              '& .MuiChip-label': { px: 0.75 },
            }}
          />
          <Chip
            label={`${summary.liveCount} LIVE`}
            size="small"
            sx={{
              height: 24,
              bgcolor: 'rgba(16,185,129,0.1)',
              color: '#10B981',
              fontWeight: 700,
              fontSize: '0.7rem',
              letterSpacing: 0.5,
              border: '1px solid rgba(16,185,129,0.2)',
              '& .MuiChip-label': { px: 1 },
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Compare toggle */}
          <FormControlLabel
            control={
              <Switch
                checked={compareMode}
                onChange={handleToggleCompare}
                size="small"
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#3B82F6' },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    bgcolor: '#3B82F6',
                  },
                }}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CompareIcon sx={{ fontSize: 16, color: compareMode ? '#3B82F6' : '#64748B' }} />
                <Typography
                  variant="caption"
                  sx={{
                    color: compareMode ? '#3B82F6' : '#64748B',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  Compare
                </Typography>
              </Box>
            }
            sx={{ mr: 0 }}
          />

          {/* Add Station */}
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            onClick={() => {
              devLog('Navigate to /weather/onboarding');
            }}
            sx={{
              bgcolor: '#3B82F6',
              color: '#F8FAFC',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.78rem',
              fontFamily: '"Inter", sans-serif',
              borderRadius: 2,
              px: 2,
              boxShadow: 'none',
              '&:hover': {
                bgcolor: '#2563EB',
                boxShadow: '0 2px 8px rgba(59,130,246,0.3)',
              },
            }}
          >
            Add Station
          </Button>
        </Box>
      </Box>

      {/* ============ FLEET SUMMARY BAR ============ */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          px: 3,
          py: 1.5,
          borderBottom: '1px solid rgba(248,250,252,0.04)',
          flexWrap: 'wrap',
        }}
      >
        {/* Total Earnings */}
        <Box>
          <Typography
            variant="caption"
            sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.6rem', letterSpacing: 0.5 }}
          >
            TOTAL EARNINGS TODAY
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
            <Typography
              sx={{
                color: '#FBBF24',
                fontWeight: 800,
                fontSize: '1.2rem',
                fontFamily: '"JetBrains Mono", monospace',
                lineHeight: 1,
              }}
            >
              {summary.totalEarnings.toFixed(1)}
            </Typography>
            <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 600 }}>
              WRF
            </Typography>
          </Box>
        </Box>

        {/* Average Quality */}
        <Box>
          <Typography
            variant="caption"
            sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.6rem', letterSpacing: 0.5 }}
          >
            AVG QUALITY
          </Typography>
          <Typography
            sx={{
              color: summary.avgQuality >= 85 ? '#10B981' : summary.avgQuality >= 70 ? '#F59E0B' : '#EF4444',
              fontWeight: 800,
              fontSize: '1.2rem',
              fontFamily: '"JetBrains Mono", monospace',
              lineHeight: 1,
            }}
          >
            {summary.avgQuality}
          </Typography>
        </Box>

        {/* Fleet Uptime */}
        <Box>
          <Typography
            variant="caption"
            sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.6rem', letterSpacing: 0.5 }}
          >
            FLEET UPTIME
          </Typography>
          <Typography
            sx={{
              color: summary.avgUptime >= 95 ? '#10B981' : summary.avgUptime >= 80 ? '#F59E0B' : '#EF4444',
              fontWeight: 800,
              fontSize: '1.2rem',
              fontFamily: '"JetBrains Mono", monospace',
              lineHeight: 1,
            }}
          >
            {summary.avgUptime}%
          </Typography>
        </Box>

        {/* Suggestion */}
        {summary.suggestion && (
          <Box
            sx={{
              flex: 1,
              bgcolor: 'rgba(245,158,11,0.06)',
              border: '1px solid rgba(245,158,11,0.15)',
              borderRadius: 2,
              px: 2,
              py: 0.75,
              minWidth: 200,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: '#F59E0B',
                fontWeight: 600,
                fontSize: '0.72rem',
                fontFamily: '"Inter", sans-serif',
              }}
            >
              {summary.suggestion}
            </Typography>
          </Box>
        )}
      </Box>

      {/* ============ MAIN CONTENT ============ */}
      <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* Map */}
        <Paper
          elevation={0}
          sx={{
            bgcolor: '#1E293B',
            borderRadius: 3,
            border: '1px solid rgba(248,250,252,0.06)',
            overflow: 'hidden',
            height: 320,
          }}
        >
          {/* react-leaflet v5 props typed via spread to work around hoisted leaflet types */}
          <MapContainer
            {...({ center: [40.73, -73.99], zoom: 11 } as any)}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url={MAP_TILE_URL}
              attribution={MAP_TILE_ATTRIBUTION}
            />
            {stations.map((station) => {
              const markerColor = STATUS_MARKER_COLORS[station.status];
              return (
                <CircleMarker
                  key={station.id}
                  {...({ center: [station.lat, station.lng], radius: station.status === 'live' ? 10 : 8 } as any)}
                  pathOptions={{
                    color: markerColor,
                    fillColor: markerColor,
                    fillOpacity: station.status === 'live' ? 0.8 : 0.5,
                    weight: 2,
                  }}
                  eventHandlers={{
                    click: () => {
                      if (compareMode) {
                        handleToggleSelect(station.id);
                      } else {
                        handleNavigate(station.id);
                      }
                    },
                  }}
                >
                  <Popup>
                    <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 12 }}>
                      <strong>{station.name}</strong>
                      <br />
                      Status: {station.status.toUpperCase()}
                      <br />
                      Quality: {station.qualityScore}/100
                      <br />
                      Earnings: {station.earningsToday.toFixed(1)} WRF
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </Paper>

        {/* Compare Panel (if active) */}
        {compareMode && selectedStations.length >= 2 && (
          <ComparePanel
            stations={selectedStations}
            onClose={handleToggleCompare}
            onRemoveStation={handleRemoveFromCompare}
          />
        )}

        {/* Station Grid */}
        {compareMode && (
          <Typography
            variant="caption"
            sx={{ color: '#64748B', fontWeight: 600, letterSpacing: 0.5, px: 0.5 }}
          >
            {selectedIds.size < 4
              ? `Select stations to compare (${selectedIds.size}/4)`
              : 'Maximum 4 stations selected'}
          </Typography>
        )}
        {stationsLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#10B981' }} />
          </Box>
        )}
        {!stationsLoading && stations.length === 0 && (
          <PublicViewerNotice reason="not-live" />
        )}
        {(stationsLoading || stations.length > 0) && (
          <Grid container spacing={2}>
            {stations.map((station) => (
              <Grid key={station.id} size={{ xs: 12, sm: 6, lg: 4, xl: 3 }}>
                <StationCard
                  station={station}
                  selected={selectedIds.has(station.id)}
                  compareMode={compareMode}
                  onToggleSelect={handleToggleSelect}
                  onNavigate={handleNavigate}
                  onRename={handleRename}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* ============ BATCH OPERATIONS BAR ============ */}
      {compareMode && (
        <BatchOperationsBar
          selectedCount={selectedIds.size}
          onAction={handleBatchAction}
          onClearSelection={handleClearSelection}
        />
      )}
    </Box>
  );
};

export default FleetDashboard;
