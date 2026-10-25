import React, { useEffect, useState } from 'react';
import { mapOverlayTextMuted } from '../../theme/tokens';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LayerState {
  stations: boolean;
  wind: boolean;
  temperature: boolean;
  precipitation: boolean;
  pressure: boolean;
  stationNames: boolean;
  scarcity: boolean;
}

export interface LayerOpacity {
  wind: number;
  temperature: number;
  precipitation: number;
  pressure: number;
}

interface LayerControlsProps {
  layers: LayerState;
  opacity: LayerOpacity;
  onToggleLayer: (layer: keyof LayerState) => void;
  onOpacityChange: (layer: keyof LayerOpacity, value: number) => void;
  /**
   * Start collapsed (phones, frontend#560). Re-applied when the value changes,
   * so a rotation across the 768 px breakpoint lands on that width's default.
   */
  defaultCollapsed?: boolean;
  /** Controlled open state (the phone toolbar owns it); with `onToggle`. */
  collapsed?: boolean;
  onToggle?: () => void;
  /**
   * Phone layout: the toolbar above the map carries the "Layers" chip, so a
   * collapsed panel renders nothing and an open one is a sheet across the top
   * of the map.
   */
  compact?: boolean;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  top: 12,
  right: 12,
  zIndex: 1000,
  background: 'rgba(15,23,42,0.92)',
  backdropFilter: 'blur(12px)',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.08)',
  width: 240,
  overflow: 'hidden',
  transition: 'height 0.25s ease',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  width: '100%',
  padding: '10px 14px',
  background: 'none',
  border: 'none',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  color: '#E2E8F0',
  font: 'inherit',
  textAlign: 'left',
  cursor: 'pointer',
  userSelect: 'none',
};

const sectionLabel: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: mapOverlayTextMuted,
  padding: '10px 14px 4px',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '5px 14px',
};

// ---------------------------------------------------------------------------
// Toggle switch
// ---------------------------------------------------------------------------

const ToggleSwitch: React.FC<{
  label: string;
  checked: boolean;
  onChange: () => void;
  color?: string;
}> = ({ label, checked, onChange, color = '#3B82F6' }) => (
  <button
    type="button"
    onClick={onChange}
    aria-checked={checked}
    role="switch"
    aria-label={label}
    style={{
      width: 36,
      height: 20,
      borderRadius: 10,
      border: 'none',
      padding: 2,
      background: checked ? color : 'rgba(255,255,255,0.1)',
      cursor: 'pointer',
      transition: 'background 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: checked ? 'flex-end' : 'flex-start',
      flexShrink: 0,
    }}
  >
    <span
      style={{
        width: 16,
        height: 16,
        borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        transition: 'transform 0.15s ease',
      }}
    />
  </button>
);

// ---------------------------------------------------------------------------
// Opacity slider
// ---------------------------------------------------------------------------

const OpacitySlider: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
}> = ({ label, value, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 14px 6px 28px' }}>
    <input
      type="range"
      aria-label={label}
      min={0}
      max={100}
      value={Math.round(value * 100)}
      onChange={(e) => onChange(Number(e.target.value) / 100)}
      style={{
        flex: 1,
        height: 3,
        accentColor: '#3B82F6',
        cursor: 'pointer',
      }}
    />
    <span style={{ fontSize: 10, color: '#94A3B8', width: 28, textAlign: 'right' }}>
      {Math.round(value * 100)}%
    </span>
  </div>
);

// ---------------------------------------------------------------------------
// Layer definitions
// ---------------------------------------------------------------------------

interface LayerDef {
  key: keyof LayerState;
  label: string;
  color: string;
  icon: string;
  hasOpacity: boolean;
}

const LAYER_DEFS: LayerDef[] = [
  { key: 'stations', label: 'Stations', color: '#22C55E', icon: '\u2B24', hasOpacity: false },
  { key: 'wind', label: 'Wind Flow', color: '#60A5FA', icon: '\uD83C\uDF2C\uFE0F', hasOpacity: true },
  { key: 'temperature', label: 'Temperature', color: '#EF4444', icon: '\uD83C\uDF21\uFE0F', hasOpacity: true },
  { key: 'precipitation', label: 'Precipitation', color: '#3B82F6', icon: '\uD83C\uDF27\uFE0F', hasOpacity: true },
  { key: 'pressure', label: 'Pressure', color: '#8B5CF6', icon: '\uD83D\uDCCA', hasOpacity: true },
  { key: 'stationNames', label: 'Station Names', color: '#94A3B8', icon: 'Aa', hasOpacity: false },
  { key: 'scarcity', label: 'Paid scarcity bonus', color: '#F59E0B', icon: '\u00D7', hasOpacity: false },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const LayerControls: React.FC<LayerControlsProps> = ({
  layers,
  opacity,
  onToggleLayer,
  onOpacityChange,
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

  // Phones: the chip lives in the map toolbar; nothing to draw while collapsed.
  if (compact && collapsed) return null;

  const panelSizing: React.CSSProperties = compact
    ? { left: 12, right: 12, width: 'auto', maxHeight: 'calc(100% - 24px)', overflowY: 'auto' }
    : {};

  return (
    <div
      style={{ ...panelStyle, ...panelSizing }}
      data-testid="map-layers-panel"
      data-collapsed={collapsed ? 'true' : 'false'}
    >
      {/* Header */}
      <button
        type="button"
        style={{ ...headerStyle, borderBottom: collapsed ? 'none' : headerStyle.borderBottom }}
        onClick={toggle}
        aria-expanded={!collapsed}
        aria-controls="map-layers-body"
        aria-label={collapsed ? 'Show map layers' : 'Hide map layers'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0' }}>
            Layers
          </span>
        </div>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#94A3B8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          style={{
            transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {!collapsed && (
        <div id="map-layers-body" style={{ paddingBottom: 10 }}>
          {/* Data Layers */}
          <div style={sectionLabel}>Data Layers</div>

          {LAYER_DEFS.map((def) => (
            <div key={def.key}>
              <div style={rowStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: def.color,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 12, color: '#CBD5E1' }}>{def.label}</span>
                </div>
                <ToggleSwitch
                  label={def.label}
                  checked={layers[def.key]}
                  onChange={() => onToggleLayer(def.key)}
                  color={def.color}
                />
              </div>
              {def.hasOpacity && layers[def.key] && (
                <OpacitySlider
                  label={`${def.label} opacity`}
                  value={opacity[def.key as keyof LayerOpacity]}
                  onChange={(v) => onOpacityChange(def.key as keyof LayerOpacity, v)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LayerControls;
