// FieldMap - Leaflet map with offline tile cache, station markers, and deployment planning
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import LayersIcon from '@mui/icons-material/Layers';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import DeleteIcon from '@mui/icons-material/Delete';
import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt';
import SensorsIcon from '@mui/icons-material/Sensors';
import StorageIcon from '@mui/icons-material/Storage';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, Rectangle, useMapEvents } from 'react-leaflet';
import { MAP_TILE_URL, MAP_TILE_ATTRIBUTION } from '../../config/mapTiles';
import WrfCard from '../ui/WrfCard';
import WrfButton from '../ui/WrfButton';
import WrfBadge from '../ui/WrfBadge';
import { colors, borderRadius, spacing, shadows } from '../ui/tokens';
import { apiClient } from '../../services/apiClient';

// Fix default marker icon issue in webpack/vite bundled leaflet
// @ts-ignore
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ----- Types & Mock Data -----

interface CachedStation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: 'online' | 'offline' | 'degraded';
  lastReading: string;
  temperature: number;
  humidity: number;
  cachedReadings: number;
}

interface DeploymentMarker {
  id: string;
  lat: number;
  lng: number;
  notes: string;
  timestamp: string;
}

interface CachedTileArea {
  id: string;
  bounds: [[number, number], [number, number]];
  zoomLevels: string;
  tileCount: number;
  sizeMB: number;
  lastUpdated: string;
}

// cachedStations and cachedAreas removed — data fetched from API

const CURRENT_LOCATION = { lat: 40.7484, lng: -73.9857 };

// Station status colors for CircleMarker
const stationStatusColors: Record<string, string> = {
  online: colors.success.main,
  offline: colors.error.main,
  degraded: colors.warning.main,
};

// ----- Map Click Handler Component -----

interface MapClickHandlerProps {
  onMapClick: (lat: number, lng: number) => void;
  placementMode: boolean;
}

const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onMapClick, placementMode }) => {
  useMapEvents({
    click: (e) => {
      if (placementMode) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

// ----- Component -----

const FieldMap: React.FC = () => {
  const [placementMode, setPlacementMode] = useState<boolean>(false);
  const [deploymentMarkers, setDeploymentMarkers] = useState<DeploymentMarker[]>([]);
  const [pendingMarker, setPendingMarker] = useState<{ lat: number; lng: number } | null>(null);
  const [markerNotes, setMarkerNotes] = useState<string>('');
  const [showCachedAreas, setShowCachedAreas] = useState<boolean>(true);
  const [downloadingTiles, setDownloadingTiles] = useState<boolean>(false);
  const [cachedStations, setCachedStations] = useState<CachedStation[]>([]);
  const [cachedAreas, setCachedAreas] = useState<CachedTileArea[]>([]);

  useEffect(() => {
    apiClient.get<CachedStation[]>('/field/stations')
      .then((data) => { if (data) setCachedStations(data); })
      .catch(() => {});
    apiClient.get<CachedTileArea[]>('/field/tiles/cached')
      .then((data) => { if (data) setCachedAreas(data); })
      .catch(() => {});
  }, []);

  const totalCachedTiles = useMemo(
    () => cachedAreas.reduce((sum, area) => sum + area.tileCount, 0),
    [cachedAreas],
  );

  const totalCachedSizeMB = useMemo(
    () => cachedAreas.reduce((sum, area) => sum + area.sizeMB, 0),
    [cachedAreas],
  );

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (placementMode) {
        setPendingMarker({ lat, lng });
        setMarkerNotes('');
      }
    },
    [placementMode],
  );

  const confirmDeploymentMarker = useCallback(() => {
    if (!pendingMarker) return;
    const newMarker: DeploymentMarker = {
      id: `deploy-${Date.now()}`,
      lat: pendingMarker.lat,
      lng: pendingMarker.lng,
      notes: markerNotes,
      timestamp: new Date().toISOString(),
    };
    setDeploymentMarkers((prev) => [...prev, newMarker]);
    setPendingMarker(null);
    setMarkerNotes('');
  }, [pendingMarker, markerNotes]);

  const cancelPendingMarker = useCallback(() => {
    setPendingMarker(null);
    setMarkerNotes('');
  }, []);

  const handleDownloadTiles = useCallback(() => {
    setDownloadingTiles(true);
    // In production: would iterate over tile coordinates at specified zoom levels
    // and cache them in IndexedDB or Cache API for offline access
    setTimeout(() => setDownloadingTiles(false), 3000);
  }, []);

  const removeDeploymentMarker = useCallback((id: string) => {
    setDeploymentMarkers((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: colors.bg.primary,
        padding: `${spacing.lg}px`,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: `${spacing.lg}px`,
        }}
      >
        <Box>
          <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: colors.text.primary }}>
            Field Map
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: colors.text.secondary, mt: `${spacing.xs}px` }}>
            Offline-capable map with station locations and deployment planning
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: `${spacing.sm}px`, alignItems: 'center' }}>
          <WrfBadge
            status={placementMode ? 'syncing' : 'online'}
            label={placementMode ? 'Placement Mode' : 'View Mode'}
          />
        </Box>
      </Box>

      {/* Map Controls Bar */}
      <WrfCard sx={{ mb: `${spacing.md}px`, padding: `${spacing.md}px !important` }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: `${spacing.md}px`,
            flexWrap: 'wrap',
          }}
        >
          <WrfButton
            variant={placementMode ? 'danger' : 'secondary'}
            size="sm"
            startIcon={<AddLocationAltIcon />}
            onClick={() => {
              setPlacementMode(!placementMode);
              setPendingMarker(null);
            }}
          >
            {placementMode ? 'Exit Placement' : 'Place Marker'}
          </WrfButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.xs}px` }}>
            <Typography sx={{ fontSize: '0.75rem', color: colors.text.secondary }}>
              Show Cached Areas
            </Typography>
            <Switch
              checked={showCachedAreas}
              onChange={(e) => setShowCachedAreas(e.target.checked)}
              size="small"
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': { color: colors.brand.primary },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: colors.brand.primary,
                },
              }}
            />
          </Box>

          <Box sx={{ flex: 1 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px` }}>
            <SensorsIcon sx={{ fontSize: 16, color: colors.text.muted }} />
            <Typography sx={{ fontSize: '0.75rem', color: colors.text.secondary }}>
              {cachedStations.length} stations | {deploymentMarkers.length} deployments
            </Typography>
          </Box>
        </Box>
      </WrfCard>

      {/* Leaflet Map */}
      <Box
        sx={{
          borderRadius: `${borderRadius.lg}px`,
          overflow: 'hidden',
          border: `1px solid ${colors.border.default}`,
          mb: `${spacing.lg}px`,
          position: 'relative',
        }}
      >
        {placementMode && (
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              padding: `${spacing.xs}px ${spacing.md}px`,
              borderRadius: `${borderRadius.md}px`,
              backgroundColor: `${colors.warning.main}E0`,
              color: '#000',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            Tap map to place a deployment marker
          </Box>
        )}

        <MapContainer
          center={[CURRENT_LOCATION.lat, CURRENT_LOCATION.lng]}
          zoom={12}
          style={{ height: 500, width: '100%' }}
          zoomControl={true}
        >
          {/* CartoDB dark tiles */}
          <TileLayer
            attribution={MAP_TILE_ATTRIBUTION}
            url={MAP_TILE_URL}
          />

          {/* Map click handler for placement mode */}
          <MapClickHandler onMapClick={handleMapClick} placementMode={placementMode} />

          {/* Current location marker */}
          <CircleMarker
            center={[CURRENT_LOCATION.lat, CURRENT_LOCATION.lng]}
            radius={8}
            pathOptions={{
              fillColor: colors.brand.primary,
              fillOpacity: 0.9,
              color: '#FFFFFF',
              weight: 3,
            }}
          >
            <Popup>
              <div style={{ color: '#333', fontFamily: 'inherit' }}>
                <strong>Your Location</strong>
                <br />
                {CURRENT_LOCATION.lat.toFixed(4)}, {CURRENT_LOCATION.lng.toFixed(4)}
              </div>
            </Popup>
          </CircleMarker>

          {/* Pulsing ring around current location */}
          <CircleMarker
            center={[CURRENT_LOCATION.lat, CURRENT_LOCATION.lng]}
            radius={20}
            pathOptions={{
              fillColor: colors.brand.primary,
              fillOpacity: 0.15,
              color: colors.brand.primary,
              weight: 1,
              opacity: 0.4,
            }}
          />

          {/* Cached station markers */}
          {cachedStations.map((station) => (
            <CircleMarker
              key={station.id}
              center={[station.lat, station.lng]}
              radius={10}
              pathOptions={{
                fillColor: stationStatusColors[station.status],
                fillOpacity: 0.85,
                color: '#FFFFFF',
                weight: 2,
              }}
            >
              <Popup>
                <div style={{ color: '#333', fontFamily: 'inherit', minWidth: 180 }}>
                  <strong>{station.name}</strong>
                  <br />
                  <span style={{ fontSize: '0.8em', color: '#666' }}>{station.id}</span>
                  <br />
                  <br />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Temperature:</span>
                    <strong>{station.temperature}C</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Humidity:</span>
                    <strong>{station.humidity}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Status:</span>
                    <strong style={{ color: stationStatusColors[station.status] }}>
                      {station.status}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Cached:</span>
                    <strong>{station.cachedReadings} readings</strong>
                  </div>
                  <br />
                  <span style={{ fontSize: '0.75em', color: '#999' }}>
                    Last: {new Date(station.lastReading).toLocaleTimeString()}
                  </span>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* Cached area rectangles */}
          {showCachedAreas &&
            cachedAreas.map((area) => (
              <Rectangle
                key={area.id}
                bounds={area.bounds}
                pathOptions={{
                  color: colors.brand.primary,
                  weight: 2,
                  fillColor: colors.brand.primary,
                  fillOpacity: 0.08,
                  dashArray: '8, 4',
                }}
              >
                <Popup>
                  <div style={{ color: '#333', fontFamily: 'inherit' }}>
                    <strong>Cached Tile Area</strong>
                    <br />
                    Zoom: {area.zoomLevels}
                    <br />
                    Tiles: {area.tileCount}
                    <br />
                    Size: {area.sizeMB} MB
                    <br />
                    Updated: {new Date(area.lastUpdated).toLocaleString()}
                  </div>
                </Popup>
              </Rectangle>
            ))}

          {/* Deployment markers */}
          {deploymentMarkers.map((marker) => (
            <Marker key={marker.id} position={[marker.lat, marker.lng]}>
              <Popup>
                <div style={{ color: '#333', fontFamily: 'inherit', minWidth: 160 }}>
                  <strong>Deployment Site</strong>
                  <br />
                  <span style={{ fontSize: '0.8em' }}>
                    {marker.lat.toFixed(5)}, {marker.lng.toFixed(5)}
                  </span>
                  {marker.notes && (
                    <>
                      <br />
                      <br />
                      <em>{marker.notes}</em>
                    </>
                  )}
                  <br />
                  <span style={{ fontSize: '0.75em', color: '#999' }}>
                    Placed: {new Date(marker.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Pending deployment marker */}
          {pendingMarker && (
            <Marker position={[pendingMarker.lat, pendingMarker.lng]}>
              <Popup>
                <div style={{ color: '#333', fontFamily: 'inherit' }}>
                  <strong>New Deployment Site</strong>
                  <br />
                  <span style={{ fontSize: '0.8em' }}>Confirm placement below</span>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </Box>

      {/* Pending Marker Notes Form */}
      {pendingMarker && (
        <WrfCard
          title="New Deployment Marker"
          subtitle={`${pendingMarker.lat.toFixed(5)}, ${pendingMarker.lng.toFixed(5)}`}
          sx={{ mb: `${spacing.lg}px` }}
        >
          <TextField
            value={markerNotes}
            onChange={(e) => setMarkerNotes(e.target.value)}
            placeholder="Notes about this deployment site..."
            multiline
            rows={2}
            fullWidth
            inputProps={{
              style: { color: colors.text.primary, fontSize: '0.875rem' },
            }}
            sx={{
              mb: `${spacing.md}px`,
              '& .MuiOutlinedInput-root': {
                backgroundColor: colors.bg.primary,
                borderRadius: `${borderRadius.md}px`,
                '& fieldset': { borderColor: colors.border.default },
                '&:hover fieldset': { borderColor: colors.brand.primary },
                '&.Mui-focused fieldset': { borderColor: colors.brand.primary },
              },
            }}
          />
          <Box sx={{ display: 'flex', gap: `${spacing.sm}px` }}>
            <WrfButton
              variant="primary"
              size="md"
              fullWidth
              startIcon={<CheckIcon />}
              onClick={confirmDeploymentMarker}
            >
              Confirm Placement
            </WrfButton>
            <WrfButton
              variant="ghost"
              size="md"
              startIcon={<CloseIcon />}
              onClick={cancelPendingMarker}
            >
              Cancel
            </WrfButton>
          </Box>
        </WrfCard>
      )}

      {/* Deployment Markers List */}
      {deploymentMarkers.length > 0 && (
        <WrfCard
          title="Deployment Markers"
          subtitle={`${deploymentMarkers.length} planned deployment sites`}
          sx={{ mb: `${spacing.lg}px` }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${spacing.sm}px` }}>
            {deploymentMarkers.map((marker) => (
              <Box
                key={marker.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: `${spacing.md}px`,
                  padding: `${spacing.sm}px ${spacing.md}px`,
                  borderRadius: `${borderRadius.md}px`,
                  backgroundColor: colors.bg.primary,
                  border: `1px solid ${colors.border.default}`,
                }}
              >
                <AddLocationAltIcon sx={{ fontSize: 20, color: colors.brand.primary }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: colors.text.primary }}>
                    {marker.lat.toFixed(5)}, {marker.lng.toFixed(5)}
                  </Typography>
                  {marker.notes && (
                    <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted }}>
                      {marker.notes}
                    </Typography>
                  )}
                </Box>
                <Typography sx={{ fontSize: '0.65rem', color: colors.text.muted }}>
                  {new Date(marker.timestamp).toLocaleTimeString()}
                </Typography>
                <Tooltip title="Remove marker">
                  <IconButton
                    size="small"
                    onClick={() => removeDeploymentMarker(marker.id)}
                    sx={{ color: colors.error.main }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
          </Box>
        </WrfCard>
      )}

      {/* Offline Tile Cache Controls */}
      <WrfCard
        title="Offline Tile Cache"
        subtitle="Download map tiles for offline use"
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px` }}>
            <StorageIcon sx={{ fontSize: 16, color: colors.text.muted }} />
            <Typography sx={{ fontSize: '0.75rem', color: colors.text.secondary }}>
              {totalCachedTiles} tiles | {totalCachedSizeMB.toFixed(1)} MB
            </Typography>
          </Box>
        }
      >
        {/* Cached areas list */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${spacing.sm}px`, mb: `${spacing.lg}px` }}>
          {cachedAreas.map((area) => (
            <Box
              key={area.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: `${spacing.md}px`,
                padding: `${spacing.md}px`,
                borderRadius: `${borderRadius.md}px`,
                backgroundColor: colors.bg.primary,
                border: `1px solid ${colors.border.default}`,
              }}
            >
              <LayersIcon sx={{ fontSize: 20, color: colors.brand.primary }} />
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: colors.text.primary }}>
                  Area {area.id.split('-')[1]} (Zoom {area.zoomLevels})
                </Typography>
                <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted }}>
                  {area.tileCount} tiles | {area.sizeMB} MB | Updated{' '}
                  {new Date(area.lastUpdated).toLocaleDateString()}
                </Typography>
              </Box>
              <Tooltip title="Delete cached tiles">
                <IconButton size="small" sx={{ color: colors.error.main }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          ))}
        </Box>

        {/* Download current view */}
        <Box
          sx={{
            padding: `${spacing.md}px`,
            borderRadius: `${borderRadius.md}px`,
            backgroundColor: `${colors.brand.primary}08`,
            border: `1px solid ${colors.brand.primary}30`,
          }}
        >
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.text.primary, mb: `${spacing.sm}px` }}>
            Download Current View
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted, mb: `${spacing.md}px` }}>
            Cache map tiles for the currently visible area at zoom levels 10-16. Estimated size: ~25
            MB.
          </Typography>

          {downloadingTiles && (
            <Box sx={{ mb: `${spacing.md}px` }}>
              <LinearProgress
                sx={{
                  height: 6,
                  borderRadius: `${borderRadius.sm}px`,
                  backgroundColor: colors.bg.tertiary,
                  '& .MuiLinearProgress-bar': {
                    borderRadius: `${borderRadius.sm}px`,
                    backgroundColor: colors.brand.primary,
                  },
                }}
              />
              <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted, mt: `${spacing.xs}px` }}>
                Downloading tiles for offline use...
              </Typography>
            </Box>
          )}

          <WrfButton
            variant="primary"
            size="md"
            fullWidth
            loading={downloadingTiles}
            startIcon={<CloudDownloadIcon />}
            onClick={handleDownloadTiles}
          >
            {downloadingTiles ? 'Downloading Tiles...' : 'Download Map Tiles'}
          </WrfButton>
        </Box>

        {/* Station legend */}
        <Box sx={{ mt: `${spacing.lg}px` }}>
          <Typography
            sx={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: colors.text.muted,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              mb: `${spacing.sm}px`,
            }}
          >
            Map Legend
          </Typography>
          <Box sx={{ display: 'flex', gap: `${spacing.md}px`, flexWrap: 'wrap' }}>
            {[
              { label: 'Online Station', color: colors.success.main },
              { label: 'Degraded Station', color: colors.warning.main },
              { label: 'Offline Station', color: colors.error.main },
              { label: 'Your Location', color: colors.brand.primary },
              { label: 'Cached Area', color: colors.brand.primary, dashed: true },
            ].map((item) => (
              <Box
                key={item.label}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: `${spacing.xs}px`,
                }}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: item.dashed ? 2 : '50%',
                    backgroundColor: item.dashed ? 'transparent' : item.color,
                    border: item.dashed
                      ? `2px dashed ${item.color}`
                      : `2px solid #FFFFFF`,
                    flexShrink: 0,
                  }}
                />
                <Typography sx={{ fontSize: '0.7rem', color: colors.text.secondary }}>
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </WrfCard>
    </Box>
  );
};

export default FieldMap;
