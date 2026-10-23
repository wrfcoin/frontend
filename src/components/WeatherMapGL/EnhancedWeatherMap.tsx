import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import { MAP_TILE_URL, MAP_TILE_ATTRIBUTION } from '../../config/mapTiles';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import WindFlowOverlay from './WindFlowOverlay';
import TemperatureOverlay from './TemperatureOverlay';
import StationPopup from './StationPopup';
import LayerControls from './LayerControls';
import MapLegend from './MapLegend';
import { useCompactMapLayout } from './useCompactMapLayout';
import type { LayerState, LayerOpacity } from './LayerControls';
import type { StationData } from './StationPopup';
import { useNavigate } from 'react-router-dom';
import { FEATURES } from '../../config/features';
import {
  isFullStudioEnabled,
  isOperatorPreviewEnabled,
  isPublicReadonlyEnabled,
  isPublicTestnetPath,
} from '../../config/contractSurfacePolicy';
import { displayStationName, projectStationCoordinates } from '../../utils/publicStationProjection';
import {
  useWeatherStationSnapshots,
  useWeatherStationsWithCoords,
} from '../../hooks/api/useWeatherQueries';
import {
  buildWeatherStationViewModel,
  stationHasCoordinates,
  stationStatusPresentation,
} from '../../lib/weatherViewModels';
import { mapOverlayTextMuted, primaryDeep } from '../../theme/tokens';

const INJECTED_CSS = `
  .wrfcoin-station-marker {
    background: none !important;
    border: none !important;
  }
  .enhanced-station-popup .leaflet-popup-content-wrapper {
    background: transparent !important;
    box-shadow: none !important;
    padding: 0 !important;
    border-radius: 12px !important;
    overflow: hidden;
  }
  .enhanced-station-popup .leaflet-popup-content {
    margin: 0 !important;
    width: auto !important;
  }
  .enhanced-station-popup .leaflet-popup-tip {
    background: #1E293B !important;
    border: 1px solid rgba(255,255,255,0.06);
  }
  .enhanced-station-popup .leaflet-popup-close-button {
    color: #94A3B8 !important;
    font-size: 18px !important;
    top: 6px !important;
    right: 8px !important;
    z-index: 10;
  }
  .station-name-tooltip {
    background: rgba(15,23,42,0.85) !important;
    border: 1px solid rgba(255,255,255,0.1) !important;
    color: #E2E8F0 !important;
    padding: 2px 6px !important;
    border-radius: 4px !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
  }
  .station-name-tooltip::before {
    border-top-color: rgba(15,23,42,0.85) !important;
  }
`;

const qualityToColor = (quality: number | null, status: string): string => {
  // Freshness states (frontend#415) take the shared neutral/amber colours; a
  // never-reported station is slate, never red.
  if (status !== 'online') return stationStatusPresentation(status).color;
  if (quality == null) return '#94A3B8';
  if (quality >= 90) return '#22C55E';
  if (quality >= 75) return '#84CC16';
  if (quality >= 50) return '#EAB308';
  return '#F97316';
};

const createStationIcon = (station: StationData): L.DivIcon => {
  const color = qualityToColor(station.quality, station.status);
  const tempLabel =
    typeof station.temperature === 'number' ? `${Math.round(station.temperature)}°` : '--';

  return L.divIcon({
    html: `
      <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 24 16 24s16-15.163 16-24C32 7.163 24.837 0 16 0z" fill="${color}"/>
        <circle cx="16" cy="16" r="10" fill="#0F172A"/>
        <text x="16" y="20" font-family="JetBrains Mono, monospace" font-size="10" fill="white" text-anchor="middle">${tempLabel}</text>
      </svg>
    `,
    className: 'wrfcoin-station-marker',
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -42],
  });
};

// Several stations in one public 0.1 degree cell share one position. One marker
// per cell, with the count, instead of identical markers stacked so that the
// last hides the rest (frontend#436 review). No jitter: a spread-out marker
// would imply a finer position than the cell.
const createCellIcon = (count: number) =>
  L.divIcon({
    html: `
      <svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 0C8.059 0 0 8.059 0 18c0 9.941 18 26 18 26s18-16.059 18-26C36 8.059 27.941 0 18 0z" fill="#38BDF8"/>
        <circle cx="18" cy="18" r="12" fill="#0F172A"/>
        <text x="18" y="22" font-family="JetBrains Mono, monospace" font-size="11" font-weight="700" fill="white" text-anchor="middle">${count}</text>
      </svg>
    `,
    className: 'wrfcoin-station-marker wrfcoin-station-cell-marker',
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -46],
  });

/** Stations grouped by their (already projected) position, in input order. */
export function groupStationsByPosition<T extends { lat: number; lng: number }>(stations: T[]): T[][] {
  const cells = new Map<string, T[]>();
  for (const station of stations) {
    const key = `${station.lat},${station.lng}`;
    const cell = cells.get(key);
    if (cell) cell.push(station);
    else cells.set(key, [station]);
  }
  return [...cells.values()];
}

const CellStationList: React.FC<{
  stations: StationData[];
  onViewReport: (stationId: string) => void;
}> = ({ stations, onViewReport }) => (
  <div data-testid="station-cell-list" style={{ minWidth: 220 }}>
    <div style={{ fontWeight: 700, marginBottom: 6 }}>{stations.length} stations in this area</div>
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {stations.map((station) => (
        <li key={station.id} style={{ margin: '4px 0' }}>
          <button
            type="button"
            onClick={() => onViewReport(station.id)}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '6px 8px',
              border: '1px solid #334155',
              borderRadius: 6,
              background: '#0F172A',
              color: '#F8FAFC',
              cursor: 'pointer',
            }}
          >
            {station.name || 'Station'}
          </button>
        </li>
      ))}
    </ul>
  </div>
);

// /fleet is operator-only (frontend#348): offer it only where the route exists.
const fleetRouteReachable = () =>
  isPublicTestnetPath(
    '/fleet',
    isFullStudioEnabled(import.meta.env?.VITE_ENABLE_FULL_STUDIO),
    isPublicReadonlyEnabled(import.meta.env?.VITE_PUBLIC_READONLY_PATHS),
    isOperatorPreviewEnabled(import.meta.env?.VITE_ENABLE_OPERATOR_PREVIEW),
  );

const MapInternals: React.FC<{
  layers: LayerState;
  opacity: LayerOpacity;
  stations: StationData[];
  onStationHover: (station: StationData | null) => void;
  onViewReport: (stationId: string) => void;
  onViewFleet?: () => void;
  showEarnings: boolean;
}> = ({ layers, opacity, stations, onStationHover, onViewReport, onViewFleet, showEarnings }) => {
  const map = useMap();

  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 100);
  }, [map]);

  // MapContainer reads `center`/`zoom` only on mount, when the station list
  // has not arrived yet, so a lone station 7 degrees from the US default
  // centre loaded off-screen. Bring the stations into view whenever the set
  // itself changes (not on every re-render, so the viewer's pan survives).
  const stationSetKey = stations.map((station) => `${station.id}@${station.lat},${station.lng}`).join('|');
  useEffect(() => {
    if (stations.length === 0) return;
    if (stations.length === 1) {
      map.setView([stations[0].lat, stations[0].lng], 8);
      return;
    }
    map.fitBounds(
      L.latLngBounds(stations.map((station) => [station.lat, station.lng] as [number, number])),
      { padding: [48, 48], maxZoom: 8 },
    );
  }, [map, stationSetKey]);

  const windStations = useMemo(
    () =>
      stations
        .filter((station) => station.windSpeed != null && station.windDirection != null)
        .map((station) => ({
          lat: station.lat,
          lng: station.lng,
          windSpeed: station.windSpeed ?? 0,
          windDirection: station.windDirection ?? 0,
        })),
    [stations],
  );

  const tempStations = useMemo(
    () =>
      stations
        .filter((station) => station.temperature != null)
        .map((station) => ({
          lat: station.lat,
          lng: station.lng,
          temperature: station.temperature ?? 0,
        })),
    [stations],
  );

  return (
    <>
      {/* No station reported the quantity, so there is no field to draw:
          the wind overlay would otherwise scatter 1800 particles over the
          map as if it had data. */}
      <TemperatureOverlay
        stations={tempStations}
        opacity={opacity.temperature}
        visible={layers.temperature && tempStations.length > 0}
        showContours={true}
      />
      <WindFlowOverlay
        stations={windStations}
        opacity={opacity.wind}
        visible={layers.wind && windStations.length > 0}
        showBarbs={false}
        particleCount={1800}
      />

      {layers.stations &&
        groupStationsByPosition(stations).filter((cell) => cell.length > 1).map((cell) => (
          <Marker
            key={`cell:${cell.map((station) => station.id).join('|')}`}
            position={[cell[0].lat, cell[0].lng]}
            icon={createCellIcon(cell.length)}
            title={`${cell.length} stations`}
          >
            <Popup maxWidth={320} minWidth={220} className="enhanced-station-popup" closeButton={true}>
              <CellStationList stations={cell} onViewReport={onViewReport} />
            </Popup>
          </Marker>
        ))}

      {layers.stations &&
        groupStationsByPosition(stations).filter((cell) => cell.length === 1).map(([station]) => (
          <Marker
            key={station.id}
            title={station.name || "Weather station"}
            position={[station.lat, station.lng]}
            icon={createStationIcon(station)}
            eventHandlers={{
              mouseover: () => onStationHover(station),
              mouseout: () => onStationHover(null),
            }}
          >
            {layers.stationNames && (
              <Tooltip direction="top" offset={[0, -44]} permanent className="station-name-tooltip">
                <span style={{ fontSize: 10, fontWeight: 600 }}>{station.name}</span>
              </Tooltip>
            )}
            <Popup maxWidth={360} minWidth={320} className="enhanced-station-popup" closeButton={true}>
              <StationPopup
                station={station}
                onViewReport={onViewReport}
                onViewFleet={onViewFleet}
                showEarnings={showEarnings}
              />
            </Popup>
          </Marker>
        ))}
    </>
  );
};

const ZoomControlsInner: React.FC = () => {
  const map = useMap();

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 24,
        right: 12,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      {['+', '-', '⤢'].map((label, index) => (
        <button
          key={label}
          type="button"
          onClick={() => {
            if (index === 0) map.zoomIn();
            if (index === 1) map.zoomOut();
            if (index === 2) {
              const container = map.getContainer().closest('.enhanced-weather-map');
              if (container) {
                if (document.fullscreenElement) {
                  document.exitFullscreen();
                } else {
                  (container as HTMLElement).requestFullscreen();
                }
              }
            }
          }}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(15,23,42,0.85)',
            color: '#E2E8F0',
            cursor: 'pointer',
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

const EnhancedWeatherMap: React.FC = () => {
  const coarsenPublicPositions =
    FEATURES.publicReadonly && !FEATURES.fullStudio;
  const [layers, setLayers] = useState<LayerState>({
    stations: true,
    wind: true,
    temperature: true,
    precipitation: false,
    pressure: false,
    stationNames: false,
  });
  const [opacity, setOpacity] = useState<LayerOpacity>({
    wind: 0.7,
    temperature: 0.5,
    precipitation: 0.5,
    pressure: 0.4,
  });
  const [hoveredStation, setHoveredStation] = useState<StationData | null>(null);
  const styleInjected = useRef(false);
  // Under 768 px the legend and layer panels start collapsed (frontend#560):
  // a toolbar above the map carries the Layers / Legend chips and the zoom
  // buttons, and at most one panel is open at a time as a sheet over the map.
  const compactLayout = useCompactMapLayout();
  const [compactPanel, setCompactPanel] = useState<'layers' | 'legend' | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const toggleCompactPanel = useCallback((panel: 'layers' | 'legend') => {
    setCompactPanel((current) => (current === panel ? null : panel));
  }, []);
  const toggleFullscreen = useCallback(() => {
    const container = mapRef.current?.getContainer().closest('.enhanced-weather-map');
    if (!container) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void (container as HTMLElement).requestFullscreen();
  }, []);

  // The app runs under BrowserRouter: setting location.hash only appended
  // `#/weather/station/<id>` to /map and never navigated.
  const navigate = useNavigate();
  const handleViewReport = useCallback(
    (stationId: string) => navigate(`/weather/station/${encodeURIComponent(stationId)}`),
    [navigate],
  );
  const handleViewFleet = useMemo(
    () => (fleetRouteReachable() ? () => navigate('/fleet') : undefined),
    [navigate],
  );

  const stationsQuery = useWeatherStationsWithCoords();
  const snapshotsQuery = useWeatherStationSnapshots(
    stationsQuery.data,
    !coarsenPublicPositions,
  );

  useEffect(() => {
    if (styleInjected.current) return;
    const style = document.createElement('style');
    style.textContent = INJECTED_CSS;
    document.head.appendChild(style);
    styleInjected.current = true;
    return () => {
      document.head.removeChild(style);
      styleInjected.current = false;
    };
  }, []);

  const stations = useMemo(() => {
    const baseSnapshots =
      snapshotsQuery.data ??
      (stationsQuery.data ?? []).map((station) => ({
        station,
        observations: [],
        quality: null,
        earnings: null,
        submissions: [],
      }));

    return baseSnapshots
      .map(buildWeatherStationViewModel)
      .filter(stationHasCoordinates)
      .map(
        (station): StationData => ({
          id: station.id,
          // Every map surface (tooltip, cell list, popup, hover card) reads
          // this projected name (frontend#436 review).
          name: displayStationName(station.name, {
            publicReadonly: FEATURES.publicReadonly ? 'true' : undefined,
            fullStudio: FEATURES.fullStudio ? 'true' : undefined,
          }),
          ...projectStationCoordinates(station, {
            publicReadonly: FEATURES.publicReadonly ? 'true' : undefined,
            fullStudio: FEATURES.fullStudio ? 'true' : undefined,
          }),
          status: station.status,
          temperature: station.temperatureF,
          humidity: station.humidity,
          pressure: station.pressure,
          windSpeed: station.windSpeedMph,
          windDirection: station.windDirection,
          precipitation: station.precipitationIn,
          quality: station.quality,
          earnings: station.earningsRatePerDay,
          lastUpdate: station.lastUpdateLabel,
          history: station.history,
        }),
      );
  }, [coarsenPublicPositions, snapshotsQuery.data, stationsQuery.data]);

  const activeLayers = useMemo(() => {
    const active: string[] = [];
    if (layers.stations) active.push('stations');
    if (layers.wind) active.push('wind');
    if (layers.temperature) active.push('temperature');
    if (layers.precipitation) active.push('precipitation');
    if (layers.pressure) active.push('pressure');
    return active;
  }, [layers]);

  // Always show the freshness trio plus Offline; Degraded / Status unknown only
  // when a station is actually in that state.
  const statusBadges = (['online', 'stale', 'registered', 'offline', 'degraded', 'unknown'] as const)
    .map((status) => ({
      status,
      count: stations.filter((station) => station.status === status).length,
      ...stationStatusPresentation(status),
    }))
    .filter((badge) => badge.count > 0 || ['online', 'stale', 'registered', 'offline'].includes(badge.status));

  const center = useMemo<[number, number]>(() => {
    if (stations.length === 0) {
      return [39.8283, -98.5795];
    }
    const latitude = stations.reduce((sum, station) => sum + station.lat, 0) / stations.length;
    const longitude = stations.reduce((sum, station) => sum + station.lng, 0) / stations.length;
    return [latitude, longitude];
  }, [stations]);

  const handleToggleLayer = useCallback((layer: keyof LayerState) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  const handleOpacityChange = useCallback((layer: keyof LayerOpacity, value: number) => {
    setOpacity((prev) => ({ ...prev, [layer]: value }));
  }, []);

  const tileUrl = MAP_TILE_URL;
  const attribution = MAP_TILE_ATTRIBUTION;

  // Phones: fill the screen below the toolbar instead of leaving a band above
  // the pinned Start bar; clamped so very short viewports still get a usable map.
  const mapHeight = compactLayout ? 'clamp(420px, calc(100dvh - 200px), 640px)' : 640;
  const toolbarButton: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    height: 36,
    padding: '0 12px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(30,41,59,0.9)',
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  };

  return (
    <div
      className="enhanced-weather-map"
      style={{
        position: 'relative',
        width: '100%',
        background: '#0F172A',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {compactLayout && (
        <div
          data-testid="map-toolbar"
          role="toolbar"
          aria-label="Map controls"
          style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <button
            type="button"
            style={{ ...toolbarButton, background: compactPanel === 'layers' ? primaryDeep : toolbarButton.background }}
            aria-expanded={compactPanel === 'layers'}
            aria-controls="map-layers-body"
            aria-label={compactPanel === 'layers' ? 'Hide map layers' : 'Show map layers'}
            onClick={() => toggleCompactPanel('layers')}
          >
            Layers
          </button>
          <button
            type="button"
            style={{ ...toolbarButton, background: compactPanel === 'legend' ? primaryDeep : toolbarButton.background }}
            aria-expanded={compactPanel === 'legend'}
            aria-controls="map-legend-body"
            aria-label={compactPanel === 'legend' ? 'Hide map legend' : 'Show map legend'}
            onClick={() => toggleCompactPanel('legend')}
          >
            Legend
          </button>
          <span style={{ flex: 1 }} />
          <button type="button" style={{ ...toolbarButton, padding: '0 10px' }} aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn()}>+</button>
          <button type="button" style={{ ...toolbarButton, padding: '0 10px' }} aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut()}>−</button>
          <button type="button" style={{ ...toolbarButton, padding: '0 10px' }} aria-label="Full screen" onClick={toggleFullscreen}>⤢</button>
        </div>
      )}
      <div style={{ position: 'relative', width: '100%', minHeight: mapHeight }}>
        <div
          data-testid="map-header"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            display: 'flex',
            // Phones: title row, then the status badges wrapped underneath.
            flexDirection: compactLayout ? 'column' : 'row',
            justifyContent: 'space-between',
            gap: compactLayout ? 8 : 12,
            padding: '12px 16px',
            background: 'linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0) 100%)',
            pointerEvents: 'none',
          }}
        >
          <div style={{ pointerEvents: 'auto' }}>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#F1F5F9' }}>
            Weather Network Map
            </h1>
            <div style={{ fontSize: 11, color: mapOverlayTextMuted, marginTop: 2 }}>
            Station coverage across {stations.length} registered stations
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: compactLayout ? 6 : 12,
              // Desktop: keep the badges clear of the 240 px Layers panel in the corner.
              paddingRight: compactLayout ? 0 : 252,
              pointerEvents: 'auto',
            }}
          >
            {statusBadges.map((badge) => (
              <div
                key={badge.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(15,23,42,0.8)',
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: badge.color,
                  }}
                />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#E2E8F0' }}>{badge.count}</span>
                <span style={{ fontSize: 10, color: mapOverlayTextMuted }}>{badge.label}</span>
              </div>
            ))}
          </div>
        </div>

        {hoveredStation && !layers.stationNames && (
          <div
            style={{
              position: 'absolute',
              top: 60,
              left: 16,
              zIndex: 1001,
              background: 'rgba(15,23,42,0.92)',
              borderRadius: 8,
              padding: '8px 12px',
              border: '1px solid rgba(255,255,255,0.08)',
              pointerEvents: 'none',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: '#F1F5F9' }}>{hoveredStation.name}</div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
              {typeof hoveredStation.temperature === 'number'
                ? `${hoveredStation.temperature.toFixed(1)}°F`
                : '--'}
              {' · '}
              {typeof hoveredStation.humidity === 'number' ? `${hoveredStation.humidity.toFixed(0)}%` : '--'}
              {' · '}
              {typeof hoveredStation.windSpeed === 'number'
                ? `${hoveredStation.windSpeed.toFixed(1)} mph`
                : '--'}
            </div>
          </div>
        )}

        {(stationsQuery.isLoading || snapshotsQuery.isLoading) && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1001,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#E2E8F0',
              background: 'rgba(15,23,42,0.6)',
            }}
          >
          Loading live station map...
          </div>
        )}

        {stationsQuery.isError && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1001,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#E2E8F0',
            }}
          >
          Station data is unavailable right now.
          </div>
        )}

        {!stationsQuery.isLoading && !stationsQuery.isError && stations.length === 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1001,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#E2E8F0',
            }}
          >
          No stations connected yet.
          </div>
        )}

        <MapContainer
          ref={mapRef}
          center={center}
          zoom={stations.length <= 1 ? 8 : 4}
          scrollWheelZoom={true}
          zoomControl={false}
          style={{ width: '100%', height: mapHeight, background: '#0F172A' }}
        >
          <TileLayer url={tileUrl} attribution={attribution} />
          <MapInternals
            layers={layers}
            opacity={opacity}
            stations={stations}
            onStationHover={setHoveredStation}
            onViewReport={handleViewReport}
            onViewFleet={handleViewFleet}
            showEarnings={!coarsenPublicPositions}
          />
          {!compactLayout && <ZoomControlsInner />}
        </MapContainer>

        <LayerControls
          layers={layers}
          opacity={opacity}
          onToggleLayer={handleToggleLayer}
          onOpacityChange={handleOpacityChange}
          compact={compactLayout}
          collapsed={compactLayout ? compactPanel !== 'layers' : undefined}
          onToggle={compactLayout ? () => toggleCompactPanel('layers') : undefined}
        />

        <MapLegend
          activeLayers={activeLayers}
          compact={compactLayout}
          collapsed={compactLayout ? compactPanel !== 'legend' : undefined}
          onToggle={compactLayout ? () => toggleCompactPanel('legend') : undefined}
        />
      </div>
    </div>
  );
};

export default EnhancedWeatherMap;
