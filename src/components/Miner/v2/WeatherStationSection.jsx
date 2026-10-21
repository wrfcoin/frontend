/**
 * WeatherStationSection - Weather station mining integration
 * Displays connected weather stations with real earnings from the API.
 * Live sensor readings are not available via the station metadata endpoint;
 * see IoTDashboard/SensorDataStream for real-time sensor data.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Cloud, MapPin, Radio, WifiOff } from 'lucide-react';
import { weatherEarningsAPI } from '../../../services/api';

const STATUS_COLORS = {
  online: '#4ADE80',
  offline: '#94A3B8',
  maintenance: '#FBBF24',
  error: '#F87171',
};

function stationLocation(station) {
  if (station.location?.address) return station.location.address;
  const lat = station.location?.latitude;
  const lon = station.location?.longitude;
  if (lat != null && lon != null) return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  return 'Location unknown';
}

const WeatherStationCard = ({ station }) => {
  const status = station.status ?? 'offline';
  const statusColor = STATUS_COLORS[status] ?? STATUS_COLORS.offline;
  const dailyEarnings = parseFloat(station.earnings?.daily ?? '0') || 0;

  return (
    <div className="weather-station-card">
      <div className="station-header">
        <div>
          <div className="station-name">{station.name ?? 'Unknown Station'}</div>
          <div className="station-location">
            <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
            {stationLocation(station)}
          </div>
        </div>
        <div className="station-status" style={{ color: statusColor }}>
          {status === 'online' ? <Radio size={12} /> : <WifiOff size={12} />}
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      </div>

      <div
        className="station-readings"
        data-testid="station-no-readings"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px 0',
          color: '#64748B',
          fontSize: '0.75rem',
          fontStyle: 'italic',
        }}
      >
        Live sensor readings available in IoT Stream
      </div>

      <div className="station-earnings">
        <span className="earnings-label">Today's Earnings</span>
        <span className="earnings-value" data-testid="station-earnings">
          {dailyEarnings > 0 ? `+${dailyEarnings.toFixed(4)} WRF` : '—'}
        </span>
      </div>
    </div>
  );
};

const WeatherStationSection = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStations = useCallback(async () => {
    try {
      const data = await weatherEarningsAPI.getWeatherStations();
      setStations(Array.isArray(data) ? data : []);
      setError(null);
    } catch {
      setError('Could not load station data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStations();
    const id = setInterval(fetchStations, 60_000);
    return () => clearInterval(id);
  }, [fetchStations]);

  const totalEarnings = stations.reduce(
    (sum, s) => sum + (parseFloat(s.earnings?.daily ?? '0') || 0),
    0,
  );

  return (
    <div>
      {/* Summary Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        background: 'rgba(14, 165, 233, 0.08)',
        borderRadius: '12px',
        marginBottom: '16px',
        border: '1px solid rgba(14, 165, 233, 0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Cloud size={20} style={{ color: '#0EA5E9' }} />
          <span style={{ fontSize: '0.875rem', color: 'rgba(232, 232, 240, 0.8)' }}>
            {loading ? (
              <span data-testid="stations-loading">Loading stations…</span>
            ) : (
              <>
                <strong style={{ color: '#0EA5E9' }} data-testid="station-count">{stations.length}</strong> Weather Stations Contributing
              </>
            )}
          </span>
        </div>
        <div style={{
          fontFamily: '\'JetBrains Mono\', monospace',
          fontSize: '1rem',
          fontWeight: '600',
          color: '#4ADE80',
        }}>
          {stations.length > 0 ? `+${totalEarnings.toFixed(4)} WRF today` : '—'}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          data-testid="stations-error"
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#F87171',
            fontSize: '0.85rem',
            marginBottom: '16px',
          }}
        >
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && stations.length === 0 && (
        <div
          data-testid="stations-empty"
          style={{
            padding: '32px',
            textAlign: 'center',
            color: '#64748B',
            fontSize: '0.875rem',
          }}
        >
          No weather stations found. Connect a station to start earning.
        </div>
      )}

      {/* Station Grid */}
      {stations.length > 0 && (
        <div className="weather-stations-grid">
          {stations.map(station => (
            <WeatherStationCard key={station.id} station={station} />
          ))}
        </div>
      )}
    </div>
  );
};

export default WeatherStationSection;
