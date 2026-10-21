import React, { useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Checkbox,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Edit as EditIcon, OpenInNew as OpenInNewIcon } from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip as ChartTooltip,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTooltip);

// --- Types ---

export type StationStatus = 'live' | 'warning' | 'offline' | 'paused';

export interface FleetStation {
  id: string;
  name: string;
  status: StationStatus;
  hardwareModel: string;
  platform: string;
  platformIcon: string;
  qualityScore: number;
  earningsToday: number;
  uptimePercent: number;
  lat: number;
  lng: number;
  lastHourTemps: number[];
}

interface StationCardProps {
  station: FleetStation;
  selected: boolean;
  compareMode: boolean;
  onToggleSelect: (id: string) => void;
  onNavigate: (id: string) => void;
  onRename: (id: string, newName: string) => void;
}

// --- Helpers ---

const STATUS_CONFIG: Record<StationStatus, { label: string; color: string; bgAlpha: string }> = {
  live: { label: 'LIVE', color: '#10B981', bgAlpha: '1a' },
  warning: { label: 'WARNING', color: '#F59E0B', bgAlpha: '1a' },
  offline: { label: 'OFFLINE', color: '#EF4444', bgAlpha: '1a' },
  paused: { label: 'PAUSED', color: '#6B7280', bgAlpha: '1a' },
};

// --- Quality Ring Sub-component ---

const QualityRing: React.FC<{ score: number; size?: number }> = ({ score, size = 48 }) => {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 90 ? '#10B981' : score >= 75 ? '#F59E0B' : '#EF4444';

  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(248,250,252,0.06)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          sx={{
            color,
            fontWeight: 800,
            fontSize: '0.7rem',
            fontFamily: '"JetBrains Mono", monospace',
          }}
        >
          {score}
        </Typography>
      </Box>
    </Box>
  );
};

// --- Micro Sparkline Sub-component ---

const MicroSparkline: React.FC<{ data: number[]; width?: number; height?: number }> = ({
  data,
  width = 100,
  height = 28,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padding = 2;

    const stepX = (width - padding * 2) / (data.length - 1);

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.02)');

    ctx.beginPath();
    ctx.moveTo(padding, height);
    data.forEach((val, i) => {
      const x = padding + i * stepX;
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      if (i === 0) ctx.lineTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(padding + (data.length - 1) * stepX, height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Line
    ctx.beginPath();
    data.forEach((val, i) => {
      const x = padding + i * stepX;
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // End dot
    const lastX = padding + (data.length - 1) * stepX;
    const lastY =
      height - padding - ((data[data.length - 1] - min) / range) * (height - padding * 2);
    ctx.beginPath();
    ctx.arc(lastX, lastY, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#3B82F6';
    ctx.fill();
  }, [data, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height, display: 'block' }}
    />
  );
};

// --- Component ---

const StationCard: React.FC<StationCardProps> = ({
  station,
  selected,
  compareMode,
  onToggleSelect,
  onNavigate,
  onRename,
}) => {
  const cfg = STATUS_CONFIG[station.status];
  const [editing, setEditing] = React.useState(false);
  const [nameValue, setNameValue] = React.useState(station.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleNameSubmit = () => {
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== station.name) {
      onRename(station.id, trimmed);
    } else {
      setNameValue(station.name);
    }
    setEditing(false);
  };

  const lastTemp = station.lastHourTemps[station.lastHourTemps.length - 1];

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: '#1E293B',
        borderRadius: 3,
        border: selected
          ? `2px solid ${cfg.color}`
          : '1px solid rgba(248,250,252,0.06)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: `${cfg.color}60`,
          transform: 'translateY(-1px)',
          boxShadow: `0 4px 12px rgba(0,0,0,0.3)`,
        },
      }}
      onClick={() => {
        if (compareMode) {
          onToggleSelect(station.id);
        } else {
          onNavigate(station.id);
        }
      }}
    >
      {/* Header row */}
      <Box
        sx={{
          px: 2,
          pt: 1.5,
          pb: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        {compareMode && (
          <Checkbox
            checked={selected}
            onChange={() => onToggleSelect(station.id)}
            onClick={(e) => e.stopPropagation()}
            size="small"
            sx={{
              p: 0,
              color: 'rgba(248,250,252,0.3)',
              '&.Mui-checked': { color: cfg.color },
            }}
          />
        )}

        <Box sx={{ flex: 1, minWidth: 0 }}>
          {editing ? (
            <input
              ref={inputRef}
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameSubmit();
                if (e.key === 'Escape') {
                  setNameValue(station.name);
                  setEditing(false);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'rgba(248,250,252,0.06)',
                border: '1px solid rgba(59,130,246,0.4)',
                borderRadius: 4,
                color: '#F8FAFC',
                fontWeight: 700,
                fontSize: '0.85rem',
                fontFamily: '"Inter", sans-serif',
                padding: '2px 6px',
                outline: 'none',
                width: '100%',
              }}
            />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography
                sx={{
                  color: '#F8FAFC',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  fontFamily: '"Inter", sans-serif',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {station.name}
              </Typography>
              <Tooltip title="Rename station">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditing(true);
                  }}
                  sx={{ p: 0.25, color: '#475569', '&:hover': { color: '#94A3B8' } }}
                >
                  <EditIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            </Box>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
            <Typography
              variant="caption"
              sx={{ color: '#64748B', fontSize: '0.68rem' }}
            >
              {station.hardwareModel}
            </Typography>
            <Typography sx={{ color: '#475569', fontSize: '0.6rem' }}>|</Typography>
            <Typography
              variant="caption"
              sx={{ color: '#64748B', fontSize: '0.68rem' }}
            >
              {station.platformIcon} {station.platform}
            </Typography>
          </Box>
        </Box>

        <Chip
          label={cfg.label}
          size="small"
          sx={{
            height: 22,
            bgcolor: `${cfg.color}${cfg.bgAlpha}`,
            color: cfg.color,
            fontWeight: 800,
            fontSize: '0.6rem',
            letterSpacing: 0.8,
            border: `1px solid ${cfg.color}40`,
            '& .MuiChip-label': { px: 1 },
            ...(station.status === 'live' && {
              animation: 'stationCardPulse 2.5s ease-in-out infinite',
              '@keyframes stationCardPulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.7 },
              },
            }),
          }}
        />
      </Box>

      {/* Stats row */}
      <Box
        sx={{
          px: 2,
          pb: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        {/* Quality ring */}
        <QualityRing score={station.qualityScore} />

        {/* Metrics */}
        <Box sx={{ flex: 1, display: 'flex', gap: 2 }}>
          {/* Earnings */}
          <Box>
            <Typography
              variant="caption"
              sx={{ color: '#64748B', fontSize: '0.58rem', fontWeight: 600, letterSpacing: 0.3 }}
            >
              TODAY
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.3 }}>
              <Typography
                sx={{
                  color: '#FBBF24',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  fontFamily: '"JetBrains Mono", monospace',
                  lineHeight: 1,
                }}
              >
                {station.earningsToday.toFixed(1)}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: '#F59E0B', fontWeight: 600, fontSize: '0.55rem' }}
              >
                WRF
              </Typography>
            </Box>
          </Box>

          {/* Uptime */}
          <Box>
            <Typography
              variant="caption"
              sx={{ color: '#64748B', fontSize: '0.58rem', fontWeight: 600, letterSpacing: 0.3 }}
            >
              UPTIME
            </Typography>
            <Typography
              sx={{
                color: station.uptimePercent >= 95 ? '#10B981' : station.uptimePercent >= 80 ? '#F59E0B' : '#EF4444',
                fontWeight: 800,
                fontSize: '0.9rem',
                fontFamily: '"JetBrains Mono", monospace',
                lineHeight: 1,
              }}
            >
              {station.uptimePercent}%
            </Typography>
          </Box>
        </Box>

        {/* Sparkline */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <MicroSparkline data={station.lastHourTemps} width={80} height={24} />
          <Typography
            variant="caption"
            sx={{
              color: '#94A3B8',
              fontSize: '0.58rem',
              fontFamily: '"JetBrains Mono", monospace',
              mt: 0.25,
            }}
          >
            {lastTemp !== undefined ? `${lastTemp.toFixed(1)}°C` : '--'}
          </Typography>
        </Box>
      </Box>

      {/* Footer link */}
      <Box
        sx={{
          px: 2,
          py: 0.75,
          borderTop: '1px solid rgba(248,250,252,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        <Tooltip title="Open station details">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(station.id);
            }}
            sx={{ p: 0.25, color: '#475569', '&:hover': { color: '#3B82F6' } }}
          >
            <OpenInNewIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Paper>
  );
};

export default StationCard;
