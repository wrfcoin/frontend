import React, { useEffect, useState } from 'react';
import { mapOverlayTextMuted } from '../../theme/tokens';
import type { ScarcityRuleState } from '../../hooks/useScarcityRule';
import { SCARCITY_BASE_COLOR, SCARCITY_BONUS_COLOR } from './ScarcityCellsLayer';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LegendStop {
  color: string;
  label: string;
}

interface LegendSection {
  id: string;
  title: string;
  stops: LegendStop[];
  unit?: string;
}

interface MapLegendProps {
  activeLayers: string[];
  /**
   * Start collapsed (phones, frontend#560). Re-applied when the value changes,
   * so a rotation across the 768 px breakpoint lands on that width's default.
   */
  defaultCollapsed?: boolean;
  /** Controlled open state (the phone toolbar owns it); with `onToggle`. */
  collapsed?: boolean;
  onToggle?: () => void;
  /**
   * Phone layout: the toolbar above the map carries the "Legend" chip, so a
   * collapsed legend renders nothing and an open one is a sheet across the
   * top of the map.
   */
  compact?: boolean;
  /** The paid scarcity rule read from the chain; the 'scarcity' layer's legend is built from it. */
  scarcity?: ScarcityRuleState;
}

// ---------------------------------------------------------------------------
// Legend data per layer
// ---------------------------------------------------------------------------

const TEMPERATURE_LEGEND: LegendSection = {
  id: 'temperature',
  title: 'Temperature',
  unit: '\u00B0F',
  stops: [
    { color: '#1E3A5F', label: '< 0' },
    { color: '#2563EB', label: '10' },
    { color: '#06B6D4', label: '20' },
    { color: '#10B981', label: '32' },
    { color: '#84CC16', label: '50' },
    { color: '#EAB308', label: '65' },
    { color: '#F97316', label: '80' },
    { color: '#EF4444', label: '90' },
    { color: '#991B1B', label: '100+' },
  ],
};

const WIND_LEGEND: LegendSection = {
  id: 'wind',
  title: 'Wind Speed',
  unit: 'mph',
  stops: [
    { color: 'rgba(96,165,250,0.4)', label: 'Calm (0-3)' },
    { color: 'rgba(96,165,250,0.6)', label: 'Light (4-7)' },
    { color: 'rgba(59,130,246,0.7)', label: 'Gentle (8-12)' },
    { color: 'rgba(37,99,235,0.8)', label: 'Moderate (13-18)' },
    { color: 'rgba(234,179,8,0.8)', label: 'Fresh (19-24)' },
    { color: 'rgba(249,115,22,0.85)', label: 'Strong (25-31)' },
    { color: 'rgba(239,68,68,0.9)', label: 'Gale (32-46)' },
    { color: 'rgba(153,27,27,0.95)', label: 'Storm (47+)' },
  ],
};

const STATION_QUALITY_LEGEND: LegendSection = {
  id: 'stations',
  title: 'Station Quality',
  stops: [
    { color: '#22C55E', label: 'Excellent (90-100)' },
    { color: '#84CC16', label: 'Good (75-89)' },
    { color: '#EAB308', label: 'Fair (50-74)' },
    { color: '#F97316', label: 'Poor (25-49)' },
    { color: '#EF4444', label: 'Critical (0-24)' },
  ],
};

const PRECIPITATION_LEGEND: LegendSection = {
  id: 'precipitation',
  title: 'Precipitation',
  unit: 'in/hr',
  stops: [
    { color: 'rgba(96,165,250,0.2)', label: 'Trace' },
    { color: 'rgba(59,130,246,0.4)', label: 'Light (0.01-0.1)' },
    { color: 'rgba(37,99,235,0.6)', label: 'Moderate (0.1-0.3)' },
    { color: 'rgba(29,78,216,0.75)', label: 'Heavy (0.3-0.6)' },
    { color: 'rgba(30,58,138,0.9)', label: 'Violent (0.6+)' },
  ],
};

const PRESSURE_LEGEND: LegendSection = {
  id: 'pressure',
  title: 'Pressure',
  unit: 'hPa',
  stops: [
    { color: '#7C3AED', label: '< 990 (Low)' },
    { color: '#6366F1', label: '990-1000' },
    { color: '#818CF8', label: '1000-1010' },
    { color: '#A5B4FC', label: '1010-1020' },
    { color: '#C7D2FE', label: '1020-1030' },
    { color: '#E0E7FF', label: '> 1030 (High)' },
  ],
};

const LAYER_TO_LEGEND: Record<string, LegendSection> = {
  temperature: TEMPERATURE_LEGEND,
  wind: WIND_LEGEND,
  stations: STATION_QUALITY_LEGEND,
  precipitation: PRECIPITATION_LEGEND,
  pressure: PRESSURE_LEGEND,
};

// ---------------------------------------------------------------------------
// Gradient bar (for continuous scales like temperature)
// ---------------------------------------------------------------------------

const GradientBar: React.FC<{ stops: LegendStop[]; unit?: string }> = ({
  stops,
  unit,
}) => {
  const gradient = stops.map((s, i) => {
    const pct = (i / (stops.length - 1)) * 100;
    return `${s.color} ${pct}%`;
  });

  return (
    <div style={{ marginTop: 6 }}>
      <div
        style={{
          height: 12,
          borderRadius: 4,
          background: `linear-gradient(to right, ${gradient.join(', ')})`,
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 3,
          fontSize: 10,
          color: '#94A3B8',
        }}
      >
        {stops
          .filter((_, i) => i === 0 || i === stops.length - 1 || i % 2 === 0)
          .map((s, i) => (
            <span key={i}>
              {s.label}
              {unit && i === stops.length - 1 ? '' : ''}
            </span>
          ))}
      </div>
      {unit && (
        <div style={{ textAlign: 'right', fontSize: 9, color: mapOverlayTextMuted, marginTop: 1 }}>
          {unit}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Swatch list (for discrete / categorical scales)
// ---------------------------------------------------------------------------

const SwatchList: React.FC<{ stops: LegendStop[] }> = ({ stops }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
    {stops.map((s, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            width: 14,
            height: 14,
            borderRadius: 3,
            backgroundColor: s.color,
            border: '1px solid rgba(255,255,255,0.1)',
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 11, color: '#CBD5E1' }}>{s.label}</span>
      </div>
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// Section (one per active layer)
// ---------------------------------------------------------------------------

const LegendSectionBlock: React.FC<{ section: LegendSection }> = ({
  section,
}) => {
  const useContinuous = section.id === 'temperature' || section.id === 'precipitation';

  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: '#E2E8F0',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: 2,
        }}
      >
        {section.title}
      </div>
      {useContinuous ? (
        <GradientBar stops={section.stops} unit={section.unit} />
      ) : (
        <SwatchList stops={section.stops} />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// MapLegend component
// ---------------------------------------------------------------------------

const ScarcityLegendBlock: React.FC<{ scarcity: ScarcityRuleState }> = ({ scarcity }) => {
  const title = (
    <div style={{ fontSize: 11, fontWeight: 600, color: '#E2E8F0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
      Paid scarcity bonus
    </div>
  );
  if (scarcity.state === 'loading') return null;
  if (scarcity.state === 'unavailable') {
    return (
      <div style={{ marginBottom: 12 }} data-testid="map-legend-scarcity">
        {title}
        <div style={{ fontSize: 11, color: '#CBD5E1', marginTop: 6 }}>Unavailable: the node did not report the rule.</div>
      </div>
    );
  }
  const { rule } = scarcity;
  const x = (m: number) => `\u00D7${Number(m.toFixed(2))}`;
  return (
    <div style={{ marginBottom: 12 }} data-testid="map-legend-scarcity">
      {title}
      <SwatchList
        stops={[
          { color: SCARCITY_BONUS_COLOR, label: `${x(rule.desertBonusMultiplier)}: fewer than ${rule.minStationDensity} active registered stations in the ~${rule.cellSizeDegrees}\u00B0 cell` },
          { color: SCARCITY_BASE_COLOR, label: `${x(rule.baselineMultiplier)}: otherwise` },
        ]}
      />
      {!rule.active && (
        <div style={{ fontSize: 10, color: mapOverlayTextMuted, marginTop: 4 }}>
          Not active until block {rule.activationHeight.toLocaleString('en-US')}.
        </div>
      )}
    </div>
  );
};

const MapLegend: React.FC<MapLegendProps> = ({
  activeLayers,
  scarcity,
  defaultCollapsed = false,
  collapsed: controlledCollapsed,
  onToggle,
  compact = false,
}) => {
  const [ownCollapsed, setOwnCollapsed] = useState(defaultCollapsed);
  useEffect(() => {
    setOwnCollapsed(defaultCollapsed);
  }, [defaultCollapsed]);
  const controlled = controlledCollapsed !== undefined;
  const collapsed = controlled ? controlledCollapsed : ownCollapsed;
  const toggle = () => {
    if (onToggle) onToggle();
    if (!controlled) setOwnCollapsed(!collapsed);
  };

  const sections = activeLayers
    .map((l) => LAYER_TO_LEGEND[l])
    .filter(Boolean);

  const showScarcity = activeLayers.includes('scarcity') && scarcity !== undefined && scarcity.state !== 'loading';
  if (sections.length === 0 && !showScarcity) return null;
  // Phones: the chip lives in the map toolbar; nothing to draw while collapsed.
  if (compact && collapsed) return null;

  return (
    <div
      data-testid="map-legend-panel"
      data-collapsed={collapsed ? 'true' : 'false'}
      style={{
        position: 'absolute',
        ...(compact ? { top: 12, left: 12, right: 12 } : { bottom: 24, left: 12 }),
        zIndex: 1000,
        background: 'rgba(15,23,42,0.92)',
        backdropFilter: 'blur(12px)',
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.08)',
        minWidth: collapsed ? 36 : 180,
        maxWidth: compact ? undefined : 220,
        maxHeight: compact ? 'calc(100% - 24px)' : undefined,
        overflow: 'hidden',
        overflowY: compact ? 'auto' : 'hidden',
        transition: 'min-width 0.2s ease',
      }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={toggle}
        aria-expanded={!collapsed}
        aria-controls="map-legend-body"
        aria-label={collapsed ? 'Show map legend' : 'Hide map legend'}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '8px 12px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#E2E8F0',
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        {!collapsed && <span>Legend</span>}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          style={{
            transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Body */}
      {!collapsed && (
        <div id="map-legend-body" style={{ padding: '0 12px 12px' }}>
          {sections.map((s) => (
            <LegendSectionBlock key={s.id} section={s} />
          ))}
          {showScarcity && scarcity && <ScarcityLegendBlock scarcity={scarcity} />}
        </div>
      )}
    </div>
  );
};

export default MapLegend;
