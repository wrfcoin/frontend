/**
 * HardwareStatusSection - Enhanced CPU, GPU, and Memory monitoring
 *
 * Features:
 * - Circular utilization gauges with animated arcs
 * - Temperature history charts (Recharts LineChart, 2-minute rolling window)
 * - Fan speed indicators with animated rotation
 * - Responsive 2x2 grid → single column on mobile
 *
 * Maintains "Terminal Luxe" aesthetic: Orbitron numbers, JetBrains Mono data,
 * purple (#A855F7) accent, deep space backgrounds.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { miningAPI } from '../../../services/api';
import DemoSurfaceGate from '../../common/DemoSurfaceGate';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  ReferenceLine,
  YAxis,
  Tooltip,
} from 'recharts';
import { Cpu, Zap, HardDrive, Fan } from 'lucide-react';
import type { HardwareDevice, TemperatureReading } from './types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HISTORY_MAX = 60; // 60 readings × 2s = 2 minutes
const UPDATE_INTERVAL_MS = 2000;

const COLORS = {
  purple: '#A855F7',
  purpleGlow: 'rgba(168, 85, 247, 0.4)',
  cyan: '#00F0FF',
  amber: '#FBBF24',
  red: '#F87171',
  green: '#4ADE80',
  dimText: 'rgba(232, 232, 240, 0.5)',
  cardBg: 'rgba(15, 15, 25, 0.6)',
  cardBorder: 'rgba(168, 85, 247, 0.12)',
};

// ---------------------------------------------------------------------------
// Utilization Gauge (SVG arc)
// ---------------------------------------------------------------------------

const UtilizationGauge: React.FC<{
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}> = ({ value, size = 88, strokeWidth = 6, color = COLORS.purple }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = 0.75; // 270° arc
  const dashTotal = circumference * arcLength;
  const dashFilled = dashTotal * (Math.min(value, 100) / 100);
  const rotation = 135; // start at bottom-left

  const getColor = () => {
    if (value > 90) return COLORS.red;
    if (value > 75) return COLORS.amber;
    return color;
  };

  const activeColor = getColor();

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Glow filter */}
      <defs>
        <filter id={`gauge-glow-${value}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Background track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(168, 85, 247, 0.08)"
        strokeWidth={strokeWidth}
        strokeDasharray={`${dashTotal} ${circumference - dashTotal}`}
        strokeLinecap="round"
        transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
      />
      {/* Filled arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={activeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={`${dashFilled} ${circumference - dashFilled}`}
        strokeLinecap="round"
        transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
        style={{
          transition: 'stroke-dasharray 0.8s ease, stroke 0.4s ease',
          filter: `drop-shadow(0 0 6px ${activeColor}66)`,
        }}
      />
      {/* Center text */}
      <text
        x={size / 2}
        y={size / 2 - 4}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontFamily: '\'Orbitron\', sans-serif',
          fontSize: size > 80 ? '1.25rem' : '1rem',
          fontWeight: 700,
          fill: '#E8E8F0',
        }}
      >
        {Math.round(value)}
      </text>
      <text
        x={size / 2}
        y={size / 2 + 16}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontFamily: '\'JetBrains Mono\', monospace',
          fontSize: '0.6rem',
          fill: COLORS.dimText,
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
        }}
      >
        % UTIL
      </text>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Custom Recharts tooltip
// ---------------------------------------------------------------------------

const TempTooltip: React.FC<{ active?: boolean; payload?: any[] }> = ({
  active,
  payload,
}) => {
  if (!active || !payload?.length) return null;
  const temp = payload[0].value;
  return (
    <div
      style={{
        background: 'rgba(7, 7, 13, 0.95)',
        border: '1px solid rgba(168, 85, 247, 0.3)',
        borderRadius: 8,
        padding: '6px 10px',
        fontFamily: '\'JetBrains Mono\', monospace',
        fontSize: '0.75rem',
        color: '#E8E8F0',
      }}
    >
      {temp.toFixed(1)}°C
    </div>
  );
};

// ---------------------------------------------------------------------------
// Temperature Chart
// ---------------------------------------------------------------------------

const TemperatureChart: React.FC<{
  data: TemperatureReading[];
  maxTemp: number;
}> = ({ data, maxTemp }) => {
  const warningTemp = maxTemp * 0.85;

  return (
    <div style={{ width: '100%', height: 64, marginTop: 8 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.purple} stopOpacity={0.6} />
              <stop offset="100%" stopColor={COLORS.purple} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis domain={['dataMin - 5', 'dataMax + 5']} hide />
          <Tooltip content={<TempTooltip />} />
          <ReferenceLine
            y={warningTemp}
            stroke={COLORS.amber}
            strokeDasharray="4 4"
            strokeOpacity={0.4}
          />
          <Line
            type="monotone"
            dataKey="temp"
            stroke={COLORS.purple}
            strokeWidth={2}
            dot={false}
            activeDot={{
              r: 3,
              fill: COLORS.purple,
              stroke: COLORS.purpleGlow,
              strokeWidth: 4,
            }}
            animationDuration={300}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Fan Speed Indicator
// ---------------------------------------------------------------------------

const FanIndicator: React.FC<{ speed: number; maxSpeed: number; isActive: boolean }> = ({
  speed,
  maxSpeed,
  isActive,
}) => {
  const pct = maxSpeed > 0 ? (speed / maxSpeed) * 100 : 0;
  const animDuration = isActive ? Math.max(0.15, 1.5 - (pct / 100) * 1.3) : 0;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: '0.75rem',
        color: COLORS.dimText,
      }}
    >
      <div
        style={{
          animation: isActive ? `spin ${animDuration}s linear infinite` : 'none',
          display: 'flex',
        }}
      >
        <Fan size={14} style={{ color: isActive ? COLORS.cyan : COLORS.dimText }} />
      </div>
      <span
        style={{
          fontFamily: '\'JetBrains Mono\', monospace',
          color: pct > 85 ? COLORS.amber : '#E8E8F0',
        }}
      >
        {speed} RPM
      </span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Hardware Card
// ---------------------------------------------------------------------------

const ICON_MAP = {
  cpu: Cpu,
  gpu: Zap,
  memory: HardDrive,
};

const HardwareCard: React.FC<{ device: HardwareDevice }> = ({ device }) => {
  const Icon = ICON_MAP[device.type] || Cpu;

  const getTempColor = (temp: number, max: number) => {
    const ratio = temp / max;
    if (ratio > 0.9) return COLORS.red;
    if (ratio > 0.75) return COLORS.amber;
    return COLORS.green;
  };

  const tempColor = getTempColor(device.temperature, device.maxTemp);

  return (
    <div
      className="miner-card"
      style={{
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(168, 85, 247, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={16} style={{ color: COLORS.purple }} />
          </div>
          <div>
            <div
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#E8E8F0',
                lineHeight: 1.2,
              }}
            >
              {device.name}
            </div>
            <div
              style={{
                fontFamily: '\'JetBrains Mono\', monospace',
                fontSize: '0.6875rem',
                color: COLORS.dimText,
                marginTop: 1,
              }}
            >
              {device.model}
            </div>
          </div>
        </div>
        <div
          style={{
            padding: '3px 8px',
            borderRadius: 6,
            background: device.isActive
              ? 'rgba(74, 222, 128, 0.12)'
              : 'rgba(251, 191, 36, 0.12)',
            fontSize: '0.6875rem',
            fontWeight: 500,
            color: device.isActive ? COLORS.green : COLORS.amber,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {device.isActive ? 'Active' : 'Idle'}
        </div>
      </div>

      {/* Gauge + Temperature */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <UtilizationGauge value={device.usage} />

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Temperature readout */}
          <div style={{ marginBottom: 8 }}>
            <div
              style={{
                fontSize: '0.6875rem',
                color: COLORS.dimText,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 4,
              }}
            >
              Temperature
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span
                style={{
                  fontFamily: '\'Orbitron\', sans-serif',
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: tempColor,
                  transition: 'color 0.4s ease',
                }}
              >
                {Math.round(device.temperature)}
              </span>
              <span
                style={{
                  fontFamily: '\'JetBrains Mono\', monospace',
                  fontSize: '0.75rem',
                  color: COLORS.dimText,
                }}
              >
                °C / {device.maxTemp}°C
              </span>
            </div>
          </div>

          {/* Fan speed */}
          <FanIndicator
            speed={device.fanSpeed}
            maxSpeed={device.fanMax}
            isActive={device.isActive}
          />
        </div>
      </div>

      {/* Temperature history chart */}
      <TemperatureChart data={device.temperatureHistory} maxTemp={device.maxTemp} />

      {/* Inline keyframes for fan spin */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const HardwareStatusSample: React.FC = () => {
  const [devices, setDevices] = useState<HardwareDevice[]>(() => [
    {
      id: 'cpu-0',
      name: 'CPU',
      model: 'AMD Ryzen 9 5950X',
      type: 'cpu',
      usage: 67,
      temperature: 58,
      maxTemp: 95,
      fanSpeed: 1450,
      fanMax: 2400,
      isActive: true,
      temperatureHistory: [],
    },
    {
      id: 'gpu-0',
      name: 'GPU 0',
      model: 'NVIDIA RTX 4090',
      type: 'gpu',
      usage: 94,
      temperature: 72,
      maxTemp: 83,
      fanSpeed: 1850,
      fanMax: 2600,
      isActive: true,
      temperatureHistory: [],
    },
    {
      id: 'gpu-1',
      name: 'GPU 1',
      model: 'NVIDIA RTX 4090',
      type: 'gpu',
      usage: 91,
      temperature: 69,
      maxTemp: 83,
      fanSpeed: 1720,
      fanMax: 2600,
      isActive: true,
      temperatureHistory: [],
    },
    {
      id: 'mem-0',
      name: 'Memory',
      model: '64 GB DDR5-6000',
      type: 'memory',
      usage: 45,
      temperature: 42,
      maxTemp: 70,
      fanSpeed: 800,
      fanMax: 1600,
      isActive: true,
      temperatureHistory: [],
    },
  ]);

  // Poll real hardware info from the API
  const fetchHardware = useCallback(async () => {
    try {
      const data = await miningAPI.getHardwareInfo();
      if (!data) return;
      // Map API response fields to device state if available
      setDevices(prev => prev.map(d => {
        const apiDevice = Array.isArray(data.devices)
          ? data.devices.find((a: any) => a.id === d.id || a.type === d.type)
          : null;
        if (!apiDevice) return d;
        const newTemp = typeof apiDevice.temperature === 'number' ? apiDevice.temperature : d.temperature;
        const newHistory: TemperatureReading[] = [
          ...d.temperatureHistory,
          { time: Date.now(), temp: newTemp },
        ].slice(-HISTORY_MAX);
        return {
          ...d,
          usage: typeof apiDevice.usage === 'number' ? apiDevice.usage : d.usage,
          temperature: newTemp,
          fanSpeed: typeof apiDevice.fanSpeed === 'number' ? apiDevice.fanSpeed : d.fanSpeed,
          temperatureHistory: newHistory,
        };
      }));
    } catch {
      // leave state unchanged
    }
  }, []);

  useEffect(() => {
    fetchHardware();
    const id = setInterval(fetchHardware, UPDATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchHardware]);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 16,
      }}
    >
      {devices.map(device => (
        <HardwareCard key={device.id} device={device} />
      ))}

      {/* Responsive: single column on mobile */}
      <style>{`
        @media (max-width: 767px) {
          .miner-section .section-content > div {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * frontend#354: GET /api/mining/hardware answers 501 by design (the core4
 * launch API has no hardware telemetry; MiningContext keeps
 * `telemetryAvailable` false), so the CPU/GPU models, temperatures and fan
 * speeds above are a sample. The default build shows the honest not-live
 * state and never mounts the sample (so it does not poll the 501 route either).
 */
const HardwareStatusSection: React.FC = () => (
  <DemoSurfaceGate
    title="Hardware telemetry is not live on the testnet"
    description="No testnet endpoint reports CPU, GPU, memory or fan readings for this machine."
    testId="miner-hardware"
  >
    <HardwareStatusSample />
  </DemoSurfaceGate>
);

export default HardwareStatusSection;
