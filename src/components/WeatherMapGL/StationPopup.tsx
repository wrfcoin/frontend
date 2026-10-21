import React from 'react';
import { stationStatusPresentation, type WeatherDisplayStatus } from '../../lib/weatherViewModels';

export interface StationData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: WeatherDisplayStatus;
  temperature: number | null;
  humidity: number | null;
  pressure: number | null;
  windSpeed: number | null;
  windDirection: number | null;
  precipitation: number | null;
  quality: number | null;
  earnings: number | null;
  lastUpdate: string;
  history: HistoryPoint[];
}

interface HistoryPoint {
  time: string;
  temperature: number | null;
  humidity: number | null;
  pressure: number | null;
  windSpeed: number | null;
}

interface StationPopupProps {
  station: StationData;
  onViewReport?: (stationId: string) => void;
  onViewFleet?: () => void;
  /** FALSE in the Stage 1.5 public build: per-station earnings are not published there. */
  showEarnings?: boolean;
}

const formatValue = (
  value: number | null,
  digits = 1,
  suffix = '',
) => (typeof value === 'number' && Number.isFinite(value) ? `${value.toFixed(digits)}${suffix}` : '--');

const qualityColor = (value: number | null): string => {
  if (value == null) return '#94A3B8';
  if (value >= 90) return '#22C55E';
  if (value >= 75) return '#84CC16';
  if (value >= 50) return '#EAB308';
  return '#EF4444';
};

const Reading = ({ label, value }: { label: string; value: string }) => (
  <div
    style={{
      background: 'rgba(15,23,42,0.55)',
      border: '1px solid rgba(148,163,184,0.14)',
      borderRadius: 10,
      padding: '10px 12px',
    }}
  >
    <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 14, color: '#F8FAFC', fontWeight: 700 }}>{value}</div>
  </div>
);

const Sparkline = ({ values, color }: { values: (number | null)[]; color: string }) => {
  // Missing readings are dropped rather than plotted as 0, so a gap in the
  // feed doesn't render as a spurious dive to the axis.
  const points_data = values.filter((v): v is number => v != null);
  if (points_data.length < 2) {
    return <div style={{ fontSize: 11, color: '#94A3B8' }}>Waiting for more live observations.</div>;
  }

  const width = 120;
  const height = 34;
  const max = Math.max(...points_data);
  const min = Math.min(...points_data);
  const range = max - min || 1;
  const points = points_data
    .map((value, index) => {
      const x = (index / (points_data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

const StationPopup: React.FC<StationPopupProps> = ({
  station,
  onViewReport,
  onViewFleet,
  showEarnings = true,
}) => {
  const temperatureHistory = station.history.map((entry) => entry.temperature);
  const { color: statusColor, label: statusLabel } = stationStatusPresentation(station.status);

  return (
    <div
      style={{
        width: 320,
        background: '#0F172A',
        color: '#E2E8F0',
        border: '1px solid rgba(148,163,184,0.18)',
        borderRadius: 14,
        padding: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{station.name}</div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{station.lastUpdate}</div>
        </div>
        <div
          style={{
            alignSelf: 'flex-start',
            padding: '4px 8px',
            borderRadius: 999,
            background: `${statusColor}1f`,
            color: statusColor,
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
          }}
        >
          {statusLabel}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 10,
          marginBottom: 14,
        }}
      >
        <Reading label="Temperature" value={formatValue(station.temperature, 1, '°F')} />
        <Reading label="Humidity" value={formatValue(station.humidity, 0, '%')} />
        <Reading label="Pressure" value={formatValue(station.pressure, 1, ' hPa')} />
        <Reading label="Wind" value={formatValue(station.windSpeed, 1, ' mph')} />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>Quality</div>
          <div style={{ color: qualityColor(station.quality), fontSize: 22, fontWeight: 800 }}>
            {station.quality == null ? '--' : `${Math.round(station.quality)}%`}
          </div>
        </div>
        {showEarnings && (
          <div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>Earnings</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {/* null means no earnings answer, not one on its way. */}
              {station.earnings == null ? '--' : `${station.earnings.toFixed(2)} WRF/day`}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 6 }}>Temperature trend</div>
        <Sparkline values={temperatureHistory} color="#38BDF8" />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 10,
          fontSize: 12,
          color: '#94A3B8',
          marginBottom: 14,
        }}
      >
        <span>Wind dir: {station.windDirection == null ? '--' : `${Math.round(station.windDirection)}°`}</span>
        <span>Rain: {formatValue(station.precipitation, 2, ' in/hr')}</span>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {onViewReport && (
          <button
            type="button"
            onClick={() => onViewReport(station.id)}
            style={{
              flex: 1,
              borderRadius: 10,
              border: '1px solid rgba(56,189,248,0.35)',
              background: 'rgba(56,189,248,0.14)',
              color: '#BAE6FD',
              padding: '9px 12px',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            Station report
          </button>
        )}
        {onViewFleet && (
          <button
            type="button"
            onClick={onViewFleet}
            style={{
              flex: 1,
              borderRadius: 10,
              border: '1px solid rgba(148,163,184,0.24)',
              background: 'rgba(30,41,59,0.7)',
              color: '#E2E8F0',
              padding: '9px 12px',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            Fleet view
          </button>
        )}
      </div>
    </div>
  );
};

export default StationPopup;
