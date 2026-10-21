/**
 * PerformanceSection - Enhanced performance analytics with Recharts
 *
 * Features:
 * - Recharts AreaChart replacing custom SVG sparklines
 * - Full-width hashrate history ComposedChart (hashrate area + efficiency line)
 * - Styled time range toggle buttons
 * - Earnings projection metric card
 * - Responsive 2-column grid → single column on mobile
 *
 * Terminal Luxe aesthetic: Orbitron numbers, JetBrains Mono data,
 * purple/cyan/amber/green palette, gradient fills.
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { miningAPI } from '../../../services/api';
import {
  AreaChart,
  Area,
  ComposedChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Activity, Zap, TrendingUp, Clock, DollarSign } from 'lucide-react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLORS = {
  purple: '#A855F7',
  purpleDim: 'rgba(168, 85, 247, 0.5)',
  cyan: '#00F0FF',
  amber: '#F59E0B',
  green: '#22C55E',
  sky: '#0EA5E9',
  dimText: 'rgba(232, 232, 240, 0.5)',
  text: '#E8E8F0',
  gridLine: 'rgba(168, 85, 247, 0.06)',
};

const TIME_RANGES = ['1h', '6h', '24h', '7d', '30d'] as const;
type TimeRange = (typeof TIME_RANGES)[number];

const RANGE_POINTS: Record<TimeRange, number> = {
  '1h': 12,
  '6h': 24,
  '24h': 48,
  '7d': 28,
  '30d': 30,
};

// No local data generation — all values come from miningAPI or show "—"

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------

const ChartTooltip: React.FC<{
  active?: boolean;
  payload?: any[];
  label?: string;
  unit?: string;
}> = ({ active, payload, label, unit = '' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'rgba(7, 7, 13, 0.95)',
        border: '1px solid rgba(168, 85, 247, 0.3)',
        borderRadius: 8,
        padding: '8px 12px',
        fontFamily: '\'JetBrains Mono\', monospace',
        fontSize: '0.75rem',
      }}
    >
      <div style={{ color: COLORS.dimText, marginBottom: 4 }}>{label}</div>
      {payload.map((entry: any, i: number) => (
        <div key={i} style={{ color: entry.color, fontWeight: 600 }}>
          {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
          {i === 0 ? ` ${unit}` : ''}
        </div>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Metric Card with Sparkline
// ---------------------------------------------------------------------------

interface MetricCardProps {
  icon: React.FC<{ size?: number; style?: React.CSSProperties }>;
  label: string;
  value: string;
  unit: string;
  change: number;
  chartData: { time: string; value: number }[];
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  icon: Icon,
  label,
  value,
  unit,
  change,
  chartData,
  color,
}) => {
  const gradientId = `metric-${label.replace(/\s/g, '-').toLowerCase()}`;

  return (
    <div className="miner-card" style={{ padding: 20 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.6875rem',
              color: COLORS.dimText,
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            <Icon size={13} style={{ color }} />
            {label}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span
              style={{
                fontFamily: '\'Orbitron\', sans-serif',
                fontSize: '1.5rem',
                fontWeight: 700,
                color: COLORS.text,
              }}
            >
              {value}
            </span>
            <span
              style={{
                fontFamily: '\'JetBrains Mono\', monospace',
                fontSize: '0.8125rem',
                color: COLORS.dimText,
              }}
            >
              {unit}
            </span>
          </div>
        </div>
        {change !== undefined && (
          <div
            style={{
              padding: '3px 8px',
              borderRadius: 6,
              background:
                change >= 0 ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              fontSize: '0.75rem',
              fontWeight: 600,
              fontFamily: '\'JetBrains Mono\', monospace',
              color: change >= 0 ? '#4ADE80' : '#F87171',
            }}
          >
            {change >= 0 ? '+' : ''}
            {change}%
          </div>
        )}
      </div>

      {/* Sparkline */}
      <div style={{ height: 52 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 2, right: 2, bottom: 0, left: 2 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              animationDuration={300}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Hashrate History Chart (full-width ComposedChart)
// ---------------------------------------------------------------------------

const HashrateHistoryChart: React.FC<{ range: TimeRange }> = ({ range: _range }) => {
  const data: { time: string; hashrate: number; efficiency: number }[] = [];

  return (
    <div className="miner-card" style={{ padding: 20, gridColumn: 'span 2' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: '0.75rem',
            color: COLORS.dimText,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <TrendingUp size={14} style={{ color: COLORS.purple }} />
          Hashrate & Efficiency History
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: '0.6875rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span
              style={{ width: 8, height: 3, borderRadius: 2, background: COLORS.purple, display: 'inline-block' }}
            />
            <span style={{ color: COLORS.dimText }}>Processing Rate</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span
              style={{ width: 8, height: 2, borderRadius: 2, background: COLORS.cyan, display: 'inline-block' }}
            />
            <span style={{ color: COLORS.dimText }}>Efficiency</span>
          </span>
        </div>
      </div>

      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <defs>
              <linearGradient id="hashrate-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.purple} stopOpacity={0.25} />
                <stop offset="100%" stopColor={COLORS.purple} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={COLORS.gridLine}
              vertical={false}
            />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: COLORS.dimText, fontFamily: '\'JetBrains Mono\', monospace' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="hashrate"
              tick={{ fontSize: 10, fill: COLORS.dimText, fontFamily: '\'JetBrains Mono\', monospace' }}
              axisLine={false}
              tickLine={false}
              domain={['dataMin - 15', 'dataMax + 15']}
            />
            <YAxis
              yAxisId="efficiency"
              orientation="right"
              tick={{ fontSize: 10, fill: COLORS.dimText, fontFamily: '\'JetBrains Mono\', monospace' }}
              axisLine={false}
              tickLine={false}
              domain={['dataMin - 0.1', 'dataMax + 0.1']}
            />
            <Tooltip content={<ChartTooltip unit="obs/min" />} />
            <Area
              yAxisId="hashrate"
              type="monotone"
              dataKey="hashrate"
              stroke={COLORS.purple}
              strokeWidth={2}
              fill="url(#hashrate-grad)"
              dot={false}
              animationDuration={400}
            />
            <Line
              yAxisId="efficiency"
              type="monotone"
              dataKey="efficiency"
              stroke={COLORS.cyan}
              strokeWidth={1.5}
              strokeDasharray="4 2"
              dot={false}
              animationDuration={400}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Earnings Projection Card
// ---------------------------------------------------------------------------

const EarningsCard: React.FC<{ dailyWrf?: number | null }> = ({ dailyWrf }) => {
  const weeklyWrf = dailyWrf != null ? dailyWrf * 7 : null;

  return (
    <div className="miner-card" style={{ padding: 20 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: '0.6875rem',
          color: COLORS.dimText,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 12,
        }}
      >
        <DollarSign size={13} style={{ color: COLORS.green }} />
        Earnings Projection
      </div>

      {dailyWrf == null ? (
        <div style={{ color: COLORS.dimText, fontSize: '0.75rem', fontFamily: '\'JetBrains Mono\', monospace', textAlign: 'center', padding: '12px 0' }}>
          No earnings data yet
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div style={{ fontSize: '0.625rem', color: COLORS.dimText, marginBottom: 2 }}>
              DAILY EST.
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: '\'Orbitron\', sans-serif', fontSize: '1.25rem', fontWeight: 700, color: COLORS.text }}>
                {dailyWrf.toFixed(2)}
              </span>
              <span style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: '0.75rem', color: COLORS.purple }}>
                WRF
              </span>
            </div>
          </div>
          <div style={{ height: 1, background: 'rgba(168, 85, 247, 0.1)' }} />
          <div>
            <div style={{ fontSize: '0.625rem', color: COLORS.dimText, marginBottom: 2 }}>
              WEEKLY EST.
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: '\'Orbitron\', sans-serif', fontSize: '1rem', fontWeight: 600, color: COLORS.text }}>
                {weeklyWrf!.toFixed(2)}
              </span>
              <span style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: '0.75rem', color: COLORS.purple }}>
                WRF
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const PerformanceSection: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [nodeStats, setNodeStats] = useState<{ hashRate: string; efficiency: number; uptime: number; earnings: string } | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const s = await miningAPI.getNodeStats();
      setNodeStats({ hashRate: s.hashRate, efficiency: s.efficiency, uptime: s.uptime, earnings: s.earnings });
    } catch {
      // leave null
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const id = setInterval(fetchStats, 30_000);
    return () => clearInterval(id);
  }, [fetchStats]);

  // Empty history — no historical data from API yet
  const emptyHistory: { time: string; value: number }[] = [];
  const metrics = useMemo(() => ({
    hashrate: emptyHistory,
    power: emptyHistory,
    efficiency: emptyHistory,
    shares: emptyHistory,
  }), []);  // eslint-disable-line react-hooks/exhaustive-deps

  const displayHashrate = nodeStats?.hashRate ?? '—';
  const displayEfficiency = nodeStats != null ? nodeStats.efficiency.toFixed(2) : '—';
  const displayUptime = nodeStats != null ? `${nodeStats.uptime.toFixed(1)}%` : '—';
  const dailyEarnings = nodeStats?.earnings ? parseFloat(nodeStats.earnings) : null;

  return (
    <div>
      {/* Time Range Toggle */}
      <div
        style={{
          display: 'inline-flex',
          gap: 2,
          padding: 3,
          background: 'rgba(168, 85, 247, 0.06)',
          borderRadius: 10,
          marginBottom: 20,
        }}
      >
        {TIME_RANGES.map(range => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            style={{
              padding: '7px 14px',
              background:
                timeRange === range
                  ? 'rgba(168, 85, 247, 0.2)'
                  : 'transparent',
              border: 'none',
              borderRadius: 8,
              color:
                timeRange === range ? '#A855F7' : 'rgba(232, 232, 240, 0.5)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              fontFamily: '\'JetBrains Mono\', monospace',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              letterSpacing: '0.02em',
            }}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Metric Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 16,
        }}
      >
        <MetricCard
          icon={Activity}
          label="Avg Hashrate"
          value={displayHashrate}
          unit="obs/min"
          change={0}
          chartData={metrics.hashrate}
          color={COLORS.purple}
        />
        <MetricCard
          icon={Zap}
          label="Power Draw"
          value="—"
          unit="W"
          change={0}
          chartData={metrics.power}
          color={COLORS.amber}
        />
        <MetricCard
          icon={TrendingUp}
          label="Efficiency"
          value={displayEfficiency}
          unit="Obs/W"
          change={0}
          chartData={metrics.efficiency}
          color={COLORS.green}
        />
        <MetricCard
          icon={Clock}
          label="Uptime"
          value={displayUptime}
          unit=""
          change={0}
          chartData={metrics.shares}
          color={COLORS.sky}
        />

        {/* Full-width Hashrate History */}
        <HashrateHistoryChart range={timeRange} />

        {/* Earnings Projection */}
        <EarningsCard dailyWrf={dailyEarnings} />
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 767px) {
          .miner-section .section-content > div > div {
            grid-template-columns: 1fr !important;
          }
          .miner-section .section-content > div > div > div[style*="span 2"] {
            grid-column: span 1 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PerformanceSection;

