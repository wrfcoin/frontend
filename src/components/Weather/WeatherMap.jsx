import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import { MAP_TILE_URL, MAP_TILE_ATTRIBUTION } from '../../config/mapTiles';
import L from 'leaflet';
import {
  Thermometer,
  Droplets,
  Wind,
  Gauge,
  Coins,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

import {
  useWeatherStationSnapshots,
  useWeatherStationsWithCoords,
} from '../../hooks/api/useWeatherQueries';
import {
  buildWeatherStationViewModel,
  stationHasCoordinates,
  stationStatusPresentation,
} from '../../lib/weatherViewModels';
import './WeatherMap.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const formatNumber = (value, digits = 1, suffix = '') =>
  typeof value === 'number' && Number.isFinite(value) ? `${value.toFixed(digits)}${suffix}` : '--';

const createStationIcon = (status, temperature) => {
  // frontend#415: the shared presentation table; an unrecognised status is
  // neutral slate, never the online green.
  const label = typeof temperature === 'number' ? `${Math.round(temperature)}°` : '--';
  const { color } = stationStatusPresentation(status);

  return L.divIcon({
    html: `
      <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 24 16 24s16-15.163 16-24C32 7.163 24.837 0 16 0z" fill="${color}"/>
        <circle cx="16" cy="16" r="10" fill="#0F172A"/>
        <text x="16" y="20" font-family="JetBrains Mono, monospace" font-size="9" fill="white" text-anchor="middle">${label}</text>
      </svg>
    `,
    className: 'custom-station-marker',
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
  });
};

const MapControls = ({ onZoomIn, onZoomOut, onFullscreen }) => (
  <div className="map-controls">
    <button className="map-control-btn" onClick={onZoomIn} title="Zoom In">
      <ZoomIn size={18} />
    </button>
    <button className="map-control-btn" onClick={onZoomOut} title="Zoom Out">
      <ZoomOut size={18} />
    </button>
    <button className="map-control-btn" onClick={onFullscreen} title="Fullscreen">
      <Maximize2 size={18} />
    </button>
  </div>
);

const LayerToggle = ({ layers, activeLayers, onToggle }) => (
  <div className="layer-toggle">
    <div className="layer-toggle-header">
      <Layers size={14} />
      <span>Layers</span>
    </div>
    <div className="layer-options">
      {layers.map((layer) => (
        <label key={layer.id} className="layer-option">
          <input
            type="checkbox"
            checked={activeLayers.includes(layer.id)}
            onChange={() => onToggle(layer.id)}
          />
          <span className="layer-dot" style={{ background: layer.color }} />
          <span>{layer.label}</span>
        </label>
      ))}
    </div>
  </div>
);

const StationPopup = ({ station }) => (
  <div className="station-popup">
    <div className="popup-header">
      <h4>{station.name}</h4>
      <span
        className={`status-badge ${station.status}`}
        style={{ color: stationStatusPresentation(station.status).color }}
      >
        {stationStatusPresentation(station.status).label}
      </span>
    </div>

    <div className="popup-readings">
      <div className="reading-item">
        <Thermometer size={14} className="reading-icon" />
        <span className="reading-value">{formatNumber(station.temperatureF, 1, '°F')}</span>
        <span className="reading-label">Temp</span>
      </div>
      <div className="reading-item">
        <Droplets size={14} className="reading-icon" />
        <span className="reading-value">{formatNumber(station.humidity, 0, '%')}</span>
        <span className="reading-label">Humidity</span>
      </div>
      <div className="reading-item">
        <Wind size={14} className="reading-icon" />
        <span className="reading-value">{formatNumber(station.windSpeedMph, 1, ' mph')}</span>
        <span className="reading-label">Wind</span>
      </div>
      <div className="reading-item">
        <Gauge size={14} className="reading-icon" />
        <span className="reading-value">{formatNumber(station.pressure, 1)}</span>
        <span className="reading-label">hPa</span>
      </div>
    </div>

    <div className="popup-footer">
      <div className="earnings-display">
        <Coins size={14} />
        <span className="font-mono">
          {station.earningsRatePerDay == null
            ? 'Pending reward sync'
            : `${station.earningsRatePerDay.toFixed(2)} WRF/day`}
        </span>
      </div>
      <div className="quality-score">
        Quality: <strong>{station.quality == null ? '--' : `${Math.round(station.quality)}%`}</strong>
      </div>
    </div>

    <div className="popup-timestamp">Last update: {station.lastUpdateLabel}</div>
  </div>
);

const MapZoomHandler = ({ zoomIn, zoomOut }) => {
  const map = useMap();

  useEffect(() => {
    if (zoomIn) {
      map.zoomIn();
    }
  }, [zoomIn, map]);

  useEffect(() => {
    if (zoomOut) {
      map.zoomOut();
    }
  }, [zoomOut, map]);

  return null;
};

const WeatherMap = () => {
  const [activeLayers, setActiveLayers] = useState(['stations', 'temperature']);
  const [zoomAction, setZoomAction] = useState({ in: 0, out: 0 });

  const stationsQuery = useWeatherStationsWithCoords();
  const snapshotsQuery = useWeatherStationSnapshots(stationsQuery.data);

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
      .filter(stationHasCoordinates);
  }, [snapshotsQuery.data, stationsQuery.data]);

  const layers = [
    { id: 'stations', label: 'Stations', color: '#22C55E' },
    { id: 'temperature', label: 'Temperature', color: '#EF4444' },
  ];

  const center = useMemo(() => {
    if (stations.length === 0) {
      return [39.8283, -98.5795];
    }

    const latitude = stations.reduce((sum, station) => sum + station.latitude, 0) / stations.length;
    const longitude = stations.reduce((sum, station) => sum + station.longitude, 0) / stations.length;
    return [latitude, longitude];
  }, [stations]);

  const onlineCount = stations.filter((station) => station.status === 'online').length;
  const handleLayerToggle = (layerId) => {
    setActiveLayers((prev) =>
      prev.includes(layerId)
        ? prev.filter((id) => id !== layerId)
        : [...prev, layerId],
    );
  };

  const handleZoomIn = () => setZoomAction((prev) => ({ ...prev, in: prev.in + 1 }));
  const handleZoomOut = () => setZoomAction((prev) => ({ ...prev, out: prev.out + 1 }));
  const handleFullscreen = () => {
    const mapContainer = document.querySelector('.weather-map');
    if (mapContainer) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        mapContainer.requestFullscreen();
      }
    }
  };

  const tileUrl = MAP_TILE_URL;
  const attribution = MAP_TILE_ATTRIBUTION;

  return (
    <div className="weather-map dashboard-card">
      <div className="map-header">
        <h3>Weather Network</h3>
        <div className="station-count">
          <span className="count-number">{onlineCount}</span>
          <span className="count-label">Active Stations</span>
        </div>
      </div>

      {stationsQuery.isLoading && (
        <div style={{ padding: 24, color: '#CBD5E1' }}>Loading live station map...</div>
      )}

      {!stationsQuery.isLoading && stations.length === 0 && (
        <div style={{ padding: 24, color: '#CBD5E1' }}>No stations connected yet.</div>
      )}

      {!stationsQuery.isLoading && stations.length > 0 && (
        <div className="map-container">
          <MapContainer
            center={center}
            zoom={stations.length === 1 ? 8 : 4}
            scrollWheelZoom={true}
            className="leaflet-map"
          >
            <TileLayer url={tileUrl} attribution={attribution} />
            <MapZoomHandler zoomIn={zoomAction.in} zoomOut={zoomAction.out} />

            {activeLayers.includes('stations') &&
              stations.map((station) => (
                <Marker
                  key={station.id}
                  position={[station.latitude, station.longitude]}
                  icon={createStationIcon(station.status, station.temperatureF)}
                >
                  <Popup>
                    <StationPopup station={station} />
                  </Popup>
                </Marker>
              ))}

            {activeLayers.includes('temperature') &&
              stations
                .filter((station) => station.temperatureF != null)
                .map((station) => (
                  <Circle
                    key={`temp-${station.id}`}
                    center={[station.latitude, station.longitude]}
                    radius={6000}
                    pathOptions={{
                      color: 'transparent',
                      fillColor: station.temperatureF >= 70 ? '#EF4444' : '#3B82F6',
                      fillOpacity: 0.12,
                    }}
                  />
                ))}
          </MapContainer>

          <MapControls
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onFullscreen={handleFullscreen}
          />

          <LayerToggle
            layers={layers}
            activeLayers={activeLayers}
            onToggle={handleLayerToggle}
          />
        </div>
      )}
    </div>
  );
};

export default WeatherMap;
