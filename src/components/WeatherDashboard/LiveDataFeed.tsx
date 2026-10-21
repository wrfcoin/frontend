import React, { useRef, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler);

// --- Types ---

export interface SensorChannel {
  id: string;
  label: string;
  unit: string;
  value: number;
  delta: number;
  history: number[];
  status: 'normal' | 'warning' | 'critical';
  /** Only for wind direction: compass degrees 0-360 */
  compassDeg?: number;
}

interface LiveDataFeedProps {
  channels: SensorChannel[];
}

// --- Helpers ---

const STATUS_COLORS = {
  normal: '#22C55E',
  warning: '#F59E0B',
  critical: '#EF4444',
} as const;

function compassLabel(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const idx = Math.round(((deg % 360) + 360) % 360 / 22.5) % 16;
  return dirs[idx];
}

const pulseKeyframes = `
@keyframes livePulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
  50% { opacity: 0.7; box-shadow: 0 0 0 4px rgba(34,197,94,0); }
}
`;

// --- Sparkline Sub-component ---

const Sparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  const chartData = {
    labels: data.map((_, i) => String(i)),
    datasets: [
      {
        data,
        borderColor: color,
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.4,
        fill: true,
        backgroundColor: `${color}15`,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: {
      x: { display: false },
      y: { display: false },
    },
    animation: { duration: 0 } as const,
  };

  return (
    <Box sx={{ width: 120, height: 32 }}>
      <Line data={chartData} options={options} />
    </Box>
  );
};

// --- Compass Rose Sub-component ---

const CompassRose: React.FC<{ degrees: number }> = ({ degrees }) => {
  return (
    <Box
      sx={{
        width: 32,
        height: 32,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          width: 24,
          height: 24,
          border: '1.5px solid rgba(248,250,252,0.15)',
          borderRadius: '50%',
          position: 'relative',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 2,
            height: 10,
            bgcolor: '#60A5FA',
            borderRadius: 1,
            transformOrigin: 'bottom center',
            transform: `translate(-50%, -100%) rotate(${degrees}deg)`,
            transition: 'transform 0.5s ease',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: -1,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '0.45rem',
            color: '#94A3B8',
            fontWeight: 700,
          }}
        >
          N
        </Box>
      </Box>
    </Box>
  );
};

// --- Channel Row ---

const ChannelRow: React.FC<{ channel: SensorChannel }> = ({ channel }) => {
  const color = STATUS_COLORS[channel.status];
  const isCompass = channel.id === 'wind_dir';
  const displayValue = isCompass && channel.compassDeg != null
    ? compassLabel(channel.compassDeg)
    : channel.value;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        py: 1.25,
        px: 2,
        borderBottom: '1px solid rgba(248,250,252,0.04)',
        '&:last-child': { borderBottom: 'none' },
        '&:hover': { bgcolor: 'rgba(248,250,252,0.02)' },
        transition: 'background 0.15s ease',
      }}
    >
      {/* Live indicator */}
      <Box
        sx={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          bgcolor: '#22C55E',
          animation: 'livePulse 2s ease-in-out infinite',
          flexShrink: 0,
        }}
      />

      {/* Label */}
      <Typography
        variant="caption"
        sx={{ width: 110, color: '#94A3B8', fontWeight: 500, fontSize: '0.8rem', flexShrink: 0 }}
      >
        {channel.label}
      </Typography>

      {/* Current value */}
      <Box sx={{ width: 90, display: 'flex', alignItems: 'baseline', gap: 0.5, flexShrink: 0 }}>
        <Typography sx={{ color: '#F8FAFC', fontWeight: 700, fontSize: '1.15rem', fontFamily: 'monospace' }}>
          {displayValue}
        </Typography>
        {channel.unit && (
          <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.7rem' }}>
            {channel.unit}
          </Typography>
        )}
      </Box>

      {/* Sparkline or compass */}
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', minWidth: 120 }}>
        {isCompass && channel.compassDeg != null ? (
          <CompassRose degrees={channel.compassDeg} />
        ) : (
          <Sparkline data={channel.history} color={color} />
        )}
      </Box>

      {/* Delta */}
      <Box sx={{ width: 70, display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0, justifyContent: 'flex-end' }}>
        {channel.delta !== 0 && (
          <>
            <Typography
              sx={{
                color: channel.delta > 0 ? '#22C55E' : '#EF4444',
                fontSize: '0.85rem',
                lineHeight: 1,
              }}
            >
              {channel.delta > 0 ? '\u25B2' : '\u25BC'}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: channel.delta > 0 ? '#22C55E' : '#EF4444',
                fontWeight: 600,
                fontFamily: 'monospace',
                fontSize: '0.75rem',
              }}
            >
              {Math.abs(channel.delta).toFixed(1)}
            </Typography>
          </>
        )}
        {channel.delta === 0 && (
          <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.75rem' }}>
            --
          </Typography>
        )}
      </Box>
    </Box>
  );
};

// --- Main Component ---

const LiveDataFeed: React.FC<LiveDataFeedProps> = ({ channels }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: '#1E293B',
        borderRadius: 3,
        border: '1px solid rgba(248,250,252,0.06)',
        overflow: 'hidden',
        height: '100%',
      }}
    >
      <style>{pulseKeyframes}</style>

      {/* Header */}
      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          borderBottom: '1px solid rgba(248,250,252,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle2" sx={{ color: '#F8FAFC', fontWeight: 700, letterSpacing: 0.5 }}>
            LIVE DATA FEED
          </Typography>
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: '#22C55E',
              animation: 'livePulse 2s ease-in-out infinite',
            }}
          />
        </Box>
        <Typography variant="caption" sx={{ color: '#64748B' }}>
          Last 2h &middot; 5s interval
        </Typography>
      </Box>

      {/* Channel Rows */}
      <Box>
        {channels.length === 0 && (
          <Box sx={{ px: 2.5, py: 3 }}>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              No live observations available for the selected station.
            </Typography>
          </Box>
        )}
        {channels.map((ch) => (
          <ChannelRow key={ch.id} channel={ch} />
        ))}
      </Box>
    </Paper>
  );
};

export default LiveDataFeed;
