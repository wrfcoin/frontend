import React, { useState, useCallback, useMemo, useEffect, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router';
import {
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Drawer,
  Stack,
  Chip,
  useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PlaceIcon from '@mui/icons-material/Place';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import AirIcon from '@mui/icons-material/Air';
import SpeedIcon from '@mui/icons-material/Speed';
import TimelineIcon from '@mui/icons-material/Timeline';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { MAP_TILE_URL, MAP_TILE_ATTRIBUTION } from '../../config/mapTiles';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { colors } from '../ui/tokens';
import { useWeatherStationsWithCoords } from '../../hooks/api/useWeatherQueries';
import { useLatestObservations } from '../../hooks/api/useWeatherQueries';
import type { WeatherStation } from '../../services/apiClient/types';
import { mapWeatherStatus, stationStatusPresentation } from '../../lib/weatherViewModels';
import FEATURES from '../../config/features';
import { displayStationName, formatStationPosition } from '../../utils/publicStationProjection';

// The public build shows positions on the 0.1 degree grid only (owner ruling
// 2026-10-01), the same policy as the public map and station page.
const projectionFlags = () => ({
  publicReadonly: FEATURES.publicReadonly ? 'true' : undefined,
  fullStudio: FEATURES.fullStudio ? 'true' : undefined,
});
const stationPositionText = (station: WeatherStation): string =>
  formatStationPosition(station, projectionFlags());
const stationNameText = (station: WeatherStation): string =>
  displayStationName(station.name, projectionFlags());

const ForecastViewer = lazy(() => import('../ForecastViewer/ForecastViewer'));

// MOCK_STATIONS removed — using API via useWeatherStationsWithCoords hook

// ---------------------------------------------------------------------------
// Marker icon (reuses pattern from EnhancedWeatherMap)
// ---------------------------------------------------------------------------

// frontend#415: one label/colour table for every station surface. Stale is
// amber, registered and unrecognised are neutral slate, only an explicit
// offline is red, and nothing falls back to the online green.
const statusPresentation = (status: WeatherStation['status'] | undefined) =>
  stationStatusPresentation(mapWeatherStatus(status));
const statusToColor = (status: WeatherStation['status'] | undefined): string =>
  statusPresentation(status).color;

const createStationIcon = (station: WeatherStation): L.DivIcon => {
  const color = statusToColor(station.status);
  const svg = `
    <svg width="28" height="36" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 24 16 24s16-15.163 16-24C32 7.163 24.837 0 16 0z" fill="${color}"/>
      <circle cx="16" cy="16" r="8" fill="#0F172A"/>
      <circle cx="16" cy="16" r="4" fill="${color}" opacity="0.7"/>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: 'wrfcoin-explorer-marker',
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -38],
  });
};

// ---------------------------------------------------------------------------
// MapFlyTo — imperatively fly the map to a position when props change
// ---------------------------------------------------------------------------

const MapFlyTo: React.FC<{ lat: number; lng: number; zoom: number }> = ({ lat, lng, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], zoom, { duration: 1.2 });
    }
  }, [map, lat, lng, zoom]);
  return null;
};

// ---------------------------------------------------------------------------
// StationDetailPanel
// ---------------------------------------------------------------------------

const StationDetailPanel: React.FC<{
  station: WeatherStation;
  onClose: () => void;
  onViewForecast: () => void;
}> = ({ station, onClose, onViewForecast }) => {
  const { data: observations, isLoading } = useLatestObservations(station.id);
  const latest = observations?.[0];

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        bgcolor: colors.bg.secondary,
        color: colors.text.primary,
        overflow: 'auto',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${colors.border.default}` }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>{stationNameText(station)}</Typography>
          <Typography variant="caption" sx={{ color: colors.text.secondary }}>
            {stationPositionText(station)}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: colors.text.secondary }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Status */}
      <Box sx={{ px: 2, py: 1.5 }}>
        <Chip
          label={statusPresentation(station.status).label}
          size="small"
          sx={{
            bgcolor: statusToColor(station.status) + '20',
            color: statusToColor(station.status),
            fontWeight: 600,
            fontSize: '0.7rem',
            textTransform: 'capitalize',
          }}
        />
      </Box>

      {/* Observations */}
      <Box sx={{ px: 2, pb: 2 }}>
        <Typography variant="caption" sx={{ color: colors.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem' }}>
          Latest Observations
        </Typography>
        {isLoading ? (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <CircularProgress size={24} sx={{ color: colors.brand.primary }} />
          </Box>
        ) : latest ? (
          <Stack spacing={1.5} sx={{ mt: 1.5 }}>
            <ObsRow icon={<ThermostatIcon sx={{ fontSize: 16 }} />} label="Temperature" value={latest.temperatureC != null ? `${latest.temperatureC.toFixed(1)} °C` : '—'} />
            <ObsRow icon={<WaterDropIcon sx={{ fontSize: 16 }} />} label="Humidity" value={latest.humidityPct != null ? `${latest.humidityPct.toFixed(0)}%` : '—'} />
            <ObsRow icon={<AirIcon sx={{ fontSize: 16 }} />} label="Wind" value={latest.windSpeedMs != null ? `${latest.windSpeedMs.toFixed(1)} m/s` : '—'} />
            <ObsRow icon={<SpeedIcon sx={{ fontSize: 16 }} />} label="Pressure" value={latest.pressureHpa != null ? `${latest.pressureHpa.toFixed(1)} hPa` : '—'} />
          </Stack>
        ) : (
          <Typography variant="body2" sx={{ color: colors.text.secondary, mt: 1 }}>
            No observations available
          </Typography>
        )}
      </Box>

      {/* View Forecast button */}
      <Box sx={{ px: 2, pb: 2 }}>
        <Box
          component="button"
          onClick={onViewForecast}
          sx={{
            width: '100%',
            py: 1.25,
            px: 2,
            bgcolor: colors.brand.primary,
            color: '#fff',
            border: 'none',
            borderRadius: 1.5,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            fontSize: '0.85rem',
            '&:hover': { bgcolor: '#2563EB' },
          }}
        >
          <TimelineIcon sx={{ fontSize: 18 }} />
          View Forecast
        </Box>
      </Box>
    </Box>
  );
};

const ObsRow: React.FC<{ icon: React.ReactElement; label: string; value: string }> = ({ icon, label, value }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: colors.text.secondary }}>
      {icon}
      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{label}</Typography>
    </Box>
    <Typography variant="body2" sx={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', fontWeight: 600 }}>
      {value}
    </Typography>
  </Box>
);

// ---------------------------------------------------------------------------
// ExplorerMap (main component)
// ---------------------------------------------------------------------------

const ExplorerMap: React.FC = () => {
  const [searchParams] = useSearchParams();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const { data: apiStations, isLoading } = useWeatherStationsWithCoords();
  const stations = useMemo(() => apiStations, [apiStations]);

  const [selectedStationId, setSelectedStationId] = useState<string | null>(
    searchParams.get('station'),
  );
  const [forecastOpen, setForecastOpen] = useState(false);

  const selectedStation = useMemo(
    () => stations.find((s) => s.id === selectedStationId) ?? null,
    [stations, selectedStationId],
  );

  // Deep-link: initial map center from URL params
  const initialLat = parseFloat(searchParams.get('lat') || '39.8283');
  const initialLng = parseFloat(searchParams.get('lng') || '-98.5795');
  const initialZoom = parseInt(searchParams.get('zoom') || '4', 10);

  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number; zoom: number } | null>(
    searchParams.get('lat') ? { lat: initialLat, lng: initialLng, zoom: initialZoom } : null,
  );

  // When a station is selected via URL param, fly to it
  useEffect(() => {
    if (selectedStation && selectedStation.latitude != null && selectedStation.longitude != null) {
      setFlyTarget({ lat: selectedStation.latitude, lng: selectedStation.longitude, zoom: 10 });
    }
  }, [selectedStation]);

  const handleStationClick = useCallback((station: WeatherStation) => {
    setSelectedStationId(station.id);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedStationId(null);
  }, []);

  const handleViewForecast = useCallback(() => {
    setForecastOpen(true);
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <CircularProgress size={36} sx={{ color: colors.brand.primary }} />
      </Box>
    );
  }

  if (stations.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 2 }}>
        <PlaceIcon sx={{ fontSize: 48, color: colors.text.secondary }} />
        <Typography sx={{ color: colors.text.secondary }}>No weather stations with location data available</Typography>
      </Box>
    );
  }

  const detailPanelWidth = 340;

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 140px)', position: 'relative' }}>
      {/* Map */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        <MapContainer
          center={[initialLat, initialLng] as [number, number]}
          zoom={initialZoom}
          scrollWheelZoom
          zoomControl={false}
          style={{ width: '100%', height: '100%', background: '#0F172A' }}
        >
          <TileLayer
            url={MAP_TILE_URL}
            attribution={MAP_TILE_ATTRIBUTION}
          />
          {flyTarget && <MapFlyTo lat={flyTarget.lat} lng={flyTarget.lng} zoom={flyTarget.zoom} />}
          {stations.map((station) => (
            <Marker
              key={station.id}
              position={[station.latitude!, station.longitude!] as [number, number]}
              icon={createStationIcon(station)}
              eventHandlers={{ click: () => handleStationClick(station) }}
            >
              <Popup>
                <div style={{ fontFamily: 'Inter, sans-serif', color: '#0F172A' }}>
                  <strong>{stationNameText(station)}</strong>
                  <br />
                  <span style={{ fontSize: 12, color: '#64748B' }}>
                    {stationPositionText(station)}
                  </span>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Station count badge */}
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 1000,
            bgcolor: 'rgba(15, 23, 42, 0.85)',
            borderRadius: 1.5,
            px: 1.5,
            py: 0.75,
            backdropFilter: 'blur(8px)',
          }}
        >
          <Typography variant="caption" sx={{ color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem' }}>
            {stations.length} stations
          </Typography>
        </Box>
      </Box>

      {/* Station detail panel (desktop: side panel, mobile: bottom drawer) */}
      {selectedStation && !isMobile && (
        <Box sx={{ width: detailPanelWidth, borderLeft: `1px solid ${colors.border.default}`, flexShrink: 0 }}>
          <StationDetailPanel
            station={selectedStation}
            onClose={handleCloseDetail}
            onViewForecast={handleViewForecast}
          />
        </Box>
      )}

      {selectedStation && isMobile && (
        <Drawer
          anchor="bottom"
          open
          onClose={handleCloseDetail}
          PaperProps={{
            sx: {
              maxHeight: '60vh',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              bgcolor: colors.bg.secondary,
            },
          }}
        >
          <StationDetailPanel
            station={selectedStation}
            onClose={handleCloseDetail}
            onViewForecast={handleViewForecast}
          />
        </Drawer>
      )}

      {/* Forecast Viewer drawer */}
      <Drawer
        anchor={isMobile ? 'bottom' : 'right'}
        open={forecastOpen}
        onClose={() => setForecastOpen(false)}
        PaperProps={{
          sx: {
            width: isMobile ? '100%' : 720,
            maxWidth: '100vw',
            height: isMobile ? '90vh' : '100%',
            bgcolor: '#0F172A',
            borderTopLeftRadius: isMobile ? 16 : 0,
            borderTopRightRadius: isMobile ? 16 : 0,
          },
        }}
      >
        <Suspense
          fallback={
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <CircularProgress size={36} sx={{ color: colors.brand.primary }} />
            </Box>
          }
        >
          <ForecastViewer
            stationId={selectedStation?.id}
            locationName={selectedStation ? stationNameText(selectedStation) : undefined}
            latitude={selectedStation?.latitude}
            longitude={selectedStation?.longitude}
            compact
            onClose={() => setForecastOpen(false)}
          />
        </Suspense>
      </Drawer>
    </Box>
  );
};

export default ExplorerMap;
