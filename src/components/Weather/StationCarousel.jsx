import React, { useMemo, useRef, useState } from 'react';
import {
  Thermometer,
  Droplets,
  Wind,
  Gauge,
  CloudRain,
  Coins,
  ChevronLeft,
  ChevronRight,
  Activity,
} from 'lucide-react';

import {
  useWeatherStationSnapshots,
  useWeatherStations,
} from '../../hooks/api/useWeatherQueries';
import { buildWeatherStationViewModel } from '../../lib/weatherViewModels';
import './StationCarousel.css';

const formatNumber = (value, digits = 1, suffix = '') =>
  typeof value === 'number' && Number.isFinite(value) ? `${value.toFixed(digits)}${suffix}` : '--';

const Sparkline = ({ data, color, height = 30, width = 80 }) => {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="sparkline">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      <circle
        cx={width}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        r="3"
        fill={color}
      />
    </svg>
  );
};

const StationCard = ({ station }) => {
  const temperatureTrend = station.history.map((entry) => entry.temperature);
  const humidityTrend = station.history.map((entry) => entry.humidity);
  const tempColor = (station.temperatureF ?? 0) > 70 ? '#EF4444' : '#3B82F6';

  return (
    <div className={`station-card ${station.status}`}>
      <div className="station-card-header">
        <div className="station-info">
          <h4 className="station-name">{station.name}</h4>
          <span className={`station-status ${station.status}`}>
            <span className="status-dot" />
            {station.status}
          </span>
        </div>
        <span className="station-update">{station.lastUpdateLabel}</span>
      </div>

      <div className="station-main-reading">
        <div className="temperature-display">
          <Thermometer size={20} style={{ color: tempColor }} />
          <span className="temperature-value font-mono">
            {formatNumber(station.temperatureF, 1, '°F')}
          </span>
        </div>
        <Sparkline data={temperatureTrend} color={tempColor} height={40} width={100} />
      </div>

      <div className="station-readings">
        <div className="reading">
          <Droplets size={14} />
          <span className="font-mono">{formatNumber(station.humidity, 0, '%')}</span>
        </div>
        <div className="reading">
          <Wind size={14} />
          <span className="font-mono">{formatNumber(station.windSpeedMph, 1, ' mph')}</span>
        </div>
        <div className="reading">
          <Gauge size={14} />
          <span className="font-mono">{formatNumber(station.pressure, 1)}</span>
        </div>
        {station.precipitationIn != null && station.precipitationIn > 0 && (
          <div className="reading rain">
            <CloudRain size={14} />
            <span className="font-mono">{formatNumber(station.precipitationIn, 2, '"')}</span>
          </div>
        )}
      </div>

      <div className="station-card-footer">
        <div className="station-earnings">
          <Coins size={14} />
          <span className="font-mono">
            {station.earningsRatePerDay == null
              ? 'Syncing'
              : station.earningsRatePerDay.toFixed(2)}
          </span>
          <span className="earnings-period">{station.earningsRatePerDay == null ? '' : '/day'}</span>
        </div>
        <div className="station-quality">
          <Activity size={14} />
          <span className="quality-value">
            {station.quality == null ? '--' : `${Math.round(station.quality)}%`}
          </span>
        </div>
      </div>

      {humidityTrend.length < 2 && (
        <div style={{ marginTop: 12, color: '#94A3B8', fontSize: 12 }}>
          Waiting for more live observations.
        </div>
      )}
    </div>
  );
};

const LoadingCard = ({ index }) => (
  <div
    key={`loading-${index}`}
    className="station-card"
    style={{ minHeight: 190, opacity: 0.6 }}
  >
    <div style={{ height: 18, width: '60%', background: '#1E293B', borderRadius: 6, marginBottom: 16 }} />
    <div style={{ height: 48, width: '75%', background: '#1E293B', borderRadius: 10, marginBottom: 16 }} />
    <div style={{ height: 14, width: '90%', background: '#1E293B', borderRadius: 6, marginBottom: 10 }} />
    <div style={{ height: 14, width: '80%', background: '#1E293B', borderRadius: 6 }} />
  </div>
);

const StationCarousel = () => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const stationsQuery = useWeatherStations();
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

    return baseSnapshots.map(buildWeatherStationViewModel);
  }, [snapshotsQuery.data, stationsQuery.data]);

  const updateScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="station-carousel dashboard-card">
      <div className="carousel-header">
        <h3>Your Weather Stations</h3>
        <div className="carousel-nav">
          <button
            className={`nav-btn ${!canScrollLeft ? 'disabled' : ''}`}
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            className={`nav-btn ${!canScrollRight ? 'disabled' : ''}`}
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="carousel-track" ref={scrollRef} onScroll={updateScrollButtons}>
        {stationsQuery.isLoading && [0, 1, 2].map((index) => <LoadingCard key={index} index={index} />)}
        {!stationsQuery.isLoading && stations.length === 0 && (
          <div style={{ color: '#CBD5E1', padding: 12 }}>No stations connected yet.</div>
        )}
        {!stationsQuery.isLoading &&
          stations.map((station) => <StationCard key={station.id} station={station} />)}
      </div>
    </div>
  );
};

export default StationCarousel;
