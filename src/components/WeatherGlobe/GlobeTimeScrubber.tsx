// GlobeTimeScrubber - Time navigation with play/pause, step controls, and keyboard shortcuts
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import { colors, spacing, borderRadius, shadows } from '../ui/tokens';
import { WrfCard, WrfBadge, WrfButton } from '../ui';

interface GlobeTimeScrubberProps {
  currentHour?: number;
  onHourChange?: (hour: number | ((prev: number) => number)) => void;
  isPlaying?: boolean;
  onPlayToggle?: () => void;
}

const DATA_DENSITY = [
  12, 11, 10, 9, 9, 10, 12, 14, 16, 18, 19, 20,
  20, 19, 18, 17, 17, 16, 15, 14, 14, 13, 13, 12,
];

const SPEEDS = [1, 2, 5, 10];

const SVG_WIDTH = 560;
const SVG_HEIGHT = 80;
const TIMELINE_Y = 22;
const TIMELINE_LEFT = 30;
const TIMELINE_RIGHT = SVG_WIDTH - 10;
const TIMELINE_WIDTH = TIMELINE_RIGHT - TIMELINE_LEFT;
const SPARKLINE_TOP = 42;
const SPARKLINE_HEIGHT = 28;

const GlobeTimeScrubber: React.FC<GlobeTimeScrubberProps> = ({
  currentHour = new Date().getHours(),
  onHourChange = () => {},
  isPlaying = false,
  onPlayToggle = () => {},
}) => {
  const [speed, setSpeed] = useState(1);
  const [dateStr, setDateStr] = useState('2026-02-14');
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isLive = currentHour === new Date().getHours() && dateStr === '2026-02-14';

  // Auto-advance when playing
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        onHourChange((prev: number) => (prev + 1) % 24);
      }, 1000 / speed);
    } else if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, speed, onHourChange]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
      case ' ':
        e.preventDefault();
        onPlayToggle();
        break;
      case 'ArrowRight':
        e.preventDefault();
        onHourChange((prev: number) => Math.min(23, prev + 1));
        break;
      case 'ArrowLeft':
        e.preventDefault();
        onHourChange((prev: number) => Math.max(0, prev - 1));
        break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPlayToggle, onHourChange]);

  const hourToX = useCallback((hour: number): number => {
    return TIMELINE_LEFT + (hour / 23) * TIMELINE_WIDTH;
  }, []);

  const xToHour = useCallback((x: number): number => {
    const fraction = (x - TIMELINE_LEFT) / TIMELINE_WIDTH;
    return Math.max(0, Math.min(23, Math.round(fraction * 23)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    setIsDragging(true);
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const svgX = ((e.clientX - rect.left) / rect.width) * SVG_WIDTH;
      onHourChange(xToHour(svgX));
    }
  }, [onHourChange, xToHour]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const svgX = ((e.clientX - rect.left) / rect.width) * SVG_WIDTH;
      onHourChange(xToHour(svgX));
    }
  }, [isDragging, onHourChange, xToHour]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleStepBack = useCallback(() => {
    onHourChange((prev: number) => Math.max(0, prev - 1));
  }, [onHourChange]);

  const handleStepForward = useCallback(() => {
    onHourChange((prev: number) => Math.min(23, prev + 1));
  }, [onHourChange]);

  const sparklinePath = useMemo(() => {
    const maxDensity = Math.max(...DATA_DENSITY);
    const points = DATA_DENSITY.map((val, i) => {
      const x = TIMELINE_LEFT + (i / 23) * TIMELINE_WIDTH;
      const y = SPARKLINE_TOP + SPARKLINE_HEIGHT - (val / maxDensity) * SPARKLINE_HEIGHT;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const linePoints = points.join(' ');
    const areaPath =
      `M ${TIMELINE_LEFT},${SPARKLINE_TOP + SPARKLINE_HEIGHT} ` +
      points.map((p) => `L ${p}`).join(' ') +
      ` L ${TIMELINE_RIGHT},${SPARKLINE_TOP + SPARKLINE_HEIGHT} Z`;

    return { linePoints, areaPath };
  }, []);

  const timeDisplay = useMemo(() => {
    const h = currentHour.toString().padStart(2, '0');
    return `${dateStr} ${h}:00 UTC`;
  }, [currentHour, dateStr]);

  const handleSpeedCycle = useCallback(() => {
    setSpeed((prev) => {
      const idx = SPEEDS.indexOf(prev);
      return SPEEDS[(idx + 1) % SPEEDS.length];
    });
  }, []);

  const playheadX = hourToX(currentHour);

  return (
    <WrfCard variant="glass" sx={{ p: `${spacing.md}px` }}>
      {/* Top controls row */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: `${spacing.sm}px` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.xs}px` }}>
          {/* Step backward */}
          <Tooltip title="Step back (Left arrow)" placement="top">
            <IconButton
              onClick={handleStepBack}
              size="small"
              disabled={currentHour === 0}
              sx={{
                color: colors.text.secondary,
                width: 28,
                height: 28,
                '&:hover': { bgcolor: `${colors.brand.primary}20` },
                '&.Mui-disabled': { color: colors.text.muted },
              }}
            >
              <SkipPreviousIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>

          {/* Play/Pause */}
          <Tooltip title={isPlaying ? 'Pause (Space)' : 'Play (Space)'} placement="top">
            <IconButton
              onClick={onPlayToggle}
              size="small"
              sx={{
                bgcolor: isPlaying ? colors.warning.main : colors.brand.primary,
                color: '#fff',
                width: 30,
                height: 30,
                '&:hover': { bgcolor: isPlaying ? colors.warning.dark : colors.brand.hover },
              }}
            >
              {isPlaying ? <PauseIcon sx={{ fontSize: 16 }} /> : <PlayArrowIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          </Tooltip>

          {/* Step forward */}
          <Tooltip title="Step forward (Right arrow)" placement="top">
            <IconButton
              onClick={handleStepForward}
              size="small"
              disabled={currentHour === 23}
              sx={{
                color: colors.text.secondary,
                width: 28,
                height: 28,
                '&:hover': { bgcolor: `${colors.brand.primary}20` },
                '&.Mui-disabled': { color: colors.text.muted },
              }}
            >
              <SkipNextIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>

          {/* Speed selector */}
          <Tooltip title="Playback speed" placement="top">
            <span>
              <WrfButton
                variant="ghost"
                size="sm"
                onClick={handleSpeedCycle}
                sx={{ minWidth: 'auto', px: 1 }}
              >
                {speed}x
              </WrfButton>
            </span>
          </Tooltip>

          {/* Current time display */}
          <Typography
            sx={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: colors.text.primary,
              fontFamily: 'monospace',
            }}
          >
            {timeDisplay}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px` }}>
          <WrfBadge
            status={isLive ? 'online' : 'pending'}
            label={isLive ? 'LIVE' : 'HISTORICAL'}
            size="sm"
            pulse={isLive}
          />

          <TextField
            type="date"
            size="small"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            InputProps={{
              sx: {
                fontSize: '0.75rem',
                color: colors.text.secondary,
                bgcolor: colors.bg.tertiary,
                borderRadius: `${borderRadius.sm}px`,
                height: 28,
                '& input': {
                  padding: '4px 8px',
                  color: colors.text.secondary,
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.border.default,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.border.light,
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.brand.primary,
                },
              },
            }}
          />
        </Box>
      </Box>

      {/* SVG Timeline */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        width="100%"
        style={{ cursor: isDragging ? 'grabbing' : 'pointer', display: 'block' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Timeline base line */}
        <line
          x1={TIMELINE_LEFT}
          y1={TIMELINE_Y}
          x2={TIMELINE_RIGHT}
          y2={TIMELINE_Y}
          stroke={colors.border.default}
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Hour markers */}
        {Array.from({ length: 24 }, (_, i) => {
          const x = hourToX(i);
          const isMajor = i % 6 === 0;
          return (
            <g key={`hour-${i}`}>
              <line
                x1={x}
                y1={TIMELINE_Y - (isMajor ? 6 : 3)}
                x2={x}
                y2={TIMELINE_Y + (isMajor ? 6 : 3)}
                stroke={isMajor ? colors.text.secondary : colors.border.default}
                strokeWidth={isMajor ? 1.5 : 1}
              />
              {isMajor && (
                <text
                  x={x}
                  y={TIMELINE_Y - 10}
                  textAnchor="middle"
                  fill={colors.text.muted}
                  fontSize="8"
                  fontFamily="sans-serif"
                >
                  {`${i.toString().padStart(2, '0')}:00`}
                </text>
              )}
            </g>
          );
        })}

        {/* Active range highlight */}
        <line
          x1={TIMELINE_LEFT}
          y1={TIMELINE_Y}
          x2={playheadX}
          y2={TIMELINE_Y}
          stroke={colors.brand.primary}
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Playhead line */}
        <line
          x1={playheadX}
          y1={TIMELINE_Y - 8}
          x2={playheadX}
          y2={SPARKLINE_TOP + SPARKLINE_HEIGHT + 2}
          stroke={colors.brand.primary}
          strokeWidth="1.5"
          strokeDasharray="2 2"
          opacity="0.5"
        />

        {/* Playhead dot */}
        <circle
          cx={playheadX}
          cy={TIMELINE_Y}
          r="5"
          fill={colors.brand.primary}
          stroke={colors.text.primary}
          strokeWidth="2"
          style={{ filter: `drop-shadow(0 0 4px ${colors.brand.primary}66)` }}
        />

        {/* Data density sparkline */}
        <path
          d={sparklinePath.areaPath}
          fill={`${colors.brand.primary}15`}
        />
        <polyline
          points={sparklinePath.linePoints}
          fill="none"
          stroke={colors.brand.primary}
          strokeWidth="1.2"
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Current hour density indicator */}
        {(() => {
          const x = hourToX(currentHour);
          const maxDensity = Math.max(...DATA_DENSITY);
          const y = SPARKLINE_TOP + SPARKLINE_HEIGHT - (DATA_DENSITY[currentHour] / maxDensity) * SPARKLINE_HEIGHT;
          return (
            <circle
              cx={x}
              cy={y}
              r="3"
              fill={colors.brand.primary}
              stroke={colors.text.primary}
              strokeWidth="1"
            />
          );
        })()}

        {/* Sparkline label */}
        <text
          x={TIMELINE_LEFT - 4}
          y={SPARKLINE_TOP + 8}
          textAnchor="end"
          fill={colors.text.muted}
          fontSize="6"
          fontFamily="sans-serif"
        >
          Stn
        </text>
      </svg>

      {/* Bottom info */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: `${spacing.xs}px` }}>
        <Typography sx={{ fontSize: '0.625rem', color: colors.text.muted }}>
          Stations reporting: {DATA_DENSITY[currentHour]}/20
        </Typography>
        <Typography sx={{ fontSize: '0.625rem', color: colors.text.muted }}>
          Space: play/pause | Arrows: step
        </Typography>
      </Box>
    </WrfCard>
  );
};

export default GlobeTimeScrubber;
