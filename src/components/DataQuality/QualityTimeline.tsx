import DemoSurfaceGate from '../common/DemoSurfaceGate';
import React, { useState, useMemo } from 'react';
import { Box, Typography, Paper, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  type Plugin,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
);

// Custom inline plugin to draw threshold line (no external dependency)
const thresholdPlugin: Plugin<'line'> = {
  id: 'thresholdLine',
  afterDraw(chart, _args, options: any) {
    const threshold = options?.threshold;
    if (threshold == null) return;
    const { ctx } = chart;
    const yScale = chart.scales['y'];
    if (!yScale) return;
    const yPixel = yScale.getPixelForValue(threshold);
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([6, 3]);
    ctx.strokeStyle = 'rgba(239,68,68,0.35)';
    ctx.lineWidth = 1;
    ctx.moveTo(chart.chartArea.left, yPixel);
    ctx.lineTo(chart.chartArea.right, yPixel);
    ctx.stroke();
    // Label
    ctx.fillStyle = '#EF4444';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Threshold: ${threshold}`, chart.chartArea.right, yPixel - 4);
    ctx.restore();
  },
};

// --- Types ---

export interface QualityTimePoint {
  date: string; // ISO date string
  overall: number;
  range: number;
  temporal: number;
  spatial: number;
  crossParameter: number;
}

export interface TimelineEvent {
  date: string;
  label: string;
  type: 'calibration' | 'outage' | 'firmware_update' | 'maintenance';
}

type TimeRange = '7d' | '30d' | '90d';

interface QualityTimelineProps {
  history: QualityTimePoint[];
  events?: TimelineEvent[];
  threshold?: number;
  defaultRange?: TimeRange;
}

// --- Mock Data Generator ---

// (mock history/events removed — data provided via props from DataQualityDashboard)

function getDateDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

// --- Helpers ---

const EVENT_COLORS: Record<TimelineEvent['type'], string> = {
  calibration: '#3B82F6',
  outage: '#EF4444',
  firmware_update: '#A855F7',
  maintenance: '#F59E0B',
};

const DIMENSION_COLORS: Record<string, string> = {
  overall: '#F8FAFC',
  range: '#10B981',
  temporal: '#3B82F6',
  spatial: '#A855F7',
  crossParameter: '#F59E0B',
};

const DIMENSION_LABELS: Record<string, string> = {
  overall: 'Overall',
  range: 'Range',
  temporal: 'Temporal',
  spatial: 'Spatial',
  crossParameter: 'Cross-Param',
};

function filterByRange(history: QualityTimePoint[], range: TimeRange): QualityTimePoint[] {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  return history.slice(-days - 1);
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// --- Component ---

const QualityTimelineSample: React.FC<QualityTimelineProps> = ({
  history,
  events = [],
  threshold = 70,
  defaultRange = '30d',
}) => {
  const [range, setRange] = useState<TimeRange>(defaultRange);
  const [visibleDimensions, setVisibleDimensions] = useState<Set<string>>(
    new Set(['overall']),
  );

  const filteredHistory = useMemo(() => filterByRange(history, range), [history, range]);

  const labels = useMemo(
    () => filteredHistory.map((p) => formatDateLabel(p.date)),
    [filteredHistory],
  );

  const toggleDimension = (dim: string) => {
    setVisibleDimensions((prev) => {
      const next = new Set(prev);
      if (next.has(dim)) {
        if (next.size > 1) next.delete(dim);
      } else {
        next.add(dim);
      }
      return next;
    });
  };

  // Build event marker data for the custom plugin
  const eventMarkers = useMemo(() => {
    const rangeDates = new Set(filteredHistory.map((p) => p.date));
    return events
      .map((ev) => {
        if (!rangeDates.has(ev.date)) return null;
        const idx = filteredHistory.findIndex((p) => p.date === ev.date);
        if (idx < 0) return null;
        return { idx, label: ev.label, color: EVENT_COLORS[ev.type] || '#64748B' };
      })
      .filter(Boolean) as { idx: number; label: string; color: string }[];
  }, [filteredHistory, events]);

  // Custom plugin to draw event marker lines on the chart
  const eventMarkersPlugin: Plugin<'line'> = useMemo(
    () => ({
      id: 'eventMarkers',
      afterDraw(chart) {
        const { ctx } = chart;
        const xScale = chart.scales['x'];
        if (!xScale) return;
        eventMarkers.forEach(({ idx, label, color }) => {
          const xPixel = xScale.getPixelForValue(idx);
          ctx.save();
          ctx.beginPath();
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.moveTo(xPixel, chart.chartArea.top);
          ctx.lineTo(xPixel, chart.chartArea.bottom);
          ctx.stroke();
          // Label at top
          ctx.fillStyle = color;
          ctx.font = '9px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(label, xPixel, chart.chartArea.top - 4);
          ctx.restore();
        });
      },
    }),
    [eventMarkers],
  );

  const datasets = useMemo(() => {
    const dims: (keyof QualityTimePoint)[] = [
      'overall',
      'range',
      'temporal',
      'spatial',
      'crossParameter',
    ];

    return dims
      .filter((d) => visibleDimensions.has(d))
      .map((dim) => ({
        label: DIMENSION_LABELS[dim],
        data: filteredHistory.map((p) => p[dim] as number),
        borderColor: DIMENSION_COLORS[dim],
        backgroundColor:
          dim === 'overall'
            ? 'rgba(248,250,252,0.05)'
            : `${DIMENSION_COLORS[dim]}10`,
        borderWidth: dim === 'overall' ? 2.5 : 1.5,
        pointRadius: range === '7d' ? 4 : range === '30d' ? 2 : 0,
        pointHoverRadius: 5,
        pointBackgroundColor: DIMENSION_COLORS[dim],
        tension: 0.3,
        fill: dim === 'overall',
      }));
  }, [filteredHistory, visibleDimensions, range]);

  const chartData = useMemo(() => ({ labels, datasets }), [labels, datasets]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      scales: {
        x: {
          grid: { color: 'rgba(148,163,184,0.08)' },
          ticks: {
            color: '#64748B',
            font: { size: 10 },
            maxRotation: 0,
            maxTicksLimit: range === '7d' ? 7 : range === '30d' ? 10 : 12,
          },
        },
        y: {
          min: 0,
          max: 100,
          grid: { color: 'rgba(148,163,184,0.08)' },
          ticks: {
            color: '#64748B',
            font: { size: 10 },
            stepSize: 20,
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1E293B',
          titleColor: '#F8FAFC',
          bodyColor: '#CBD5E1',
          borderColor: 'rgba(248,250,252,0.10)',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            title: (items: any[]) => {
              if (!items.length) return '';
              const idx = items[0].dataIndex;
              return filteredHistory[idx]?.date || '';
            },
            label: (ctx: any) => ` ${ctx.dataset.label}: ${ctx.raw}/100`,
          },
        },
        thresholdLine: {
          threshold,
        },
      },
      animation: {
        duration: 600,
      },
    }),
    [range, threshold, filteredHistory],
  );

  // Identify below-threshold zones for the "alert strip"
  const belowThresholdDays = useMemo(
    () => filteredHistory.filter((p) => p.overall < threshold).length,
    [filteredHistory, threshold],
  );

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: '#1E293B',
        borderRadius: 3,
        border: '1px solid rgba(248,250,252,0.06)',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          borderBottom: '1px solid rgba(248,250,252,0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography
            variant="subtitle2"
            sx={{ color: '#F8FAFC', fontWeight: 700, letterSpacing: 0.5 }}
          >
            QUALITY TREND
          </Typography>
          {belowThresholdDays > 0 && (
            <Typography
              variant="caption"
              sx={{
                color: '#EF4444',
                bgcolor: 'rgba(239,68,68,0.12)',
                px: 1,
                py: 0.25,
                borderRadius: 1,
                fontWeight: 600,
                fontSize: '0.65rem',
              }}
            >
              {belowThresholdDays} day{belowThresholdDays > 1 ? 's' : ''} below threshold
            </Typography>
          )}
        </Box>

        <ToggleButtonGroup
          value={range}
          exclusive
          onChange={(_, v) => v && setRange(v)}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              color: '#64748B',
              borderColor: 'rgba(148,163,184,0.15)',
              textTransform: 'none',
              px: 1.5,
              py: 0.25,
              fontSize: '0.7rem',
              fontWeight: 600,
              '&.Mui-selected': {
                color: '#3B82F6',
                bgcolor: 'rgba(59,130,246,0.12)',
                borderColor: 'rgba(59,130,246,0.30)',
              },
            },
          }}
        >
          <ToggleButton value="7d">7D</ToggleButton>
          <ToggleButton value="30d">30D</ToggleButton>
          <ToggleButton value="90d">90D</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Dimension toggles */}
      <Box sx={{ px: 2.5, pt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
        {Object.entries(DIMENSION_LABELS).map(([key, label]) => {
          const active = visibleDimensions.has(key);
          const color = DIMENSION_COLORS[key];
          return (
            <Box
              key={key}
              onClick={() => toggleDimension(key)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1,
                py: 0.25,
                borderRadius: 1,
                cursor: 'pointer',
                bgcolor: active ? `${color}15` : 'transparent',
                border: `1px solid ${active ? `${color}40` : 'rgba(148,163,184,0.12)'}`,
                transition: 'all 0.15s ease',
                '&:hover': { bgcolor: `${color}10` },
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: active ? color : '#475569',
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  color: active ? color : '#64748B',
                  fontWeight: 600,
                  fontSize: '0.65rem',
                  userSelect: 'none',
                }}
              >
                {label}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* Chart */}
      <Box sx={{ flex: 1, p: 2, minHeight: 260 }}>
        <Line data={chartData} options={options} plugins={[thresholdPlugin, eventMarkersPlugin]} />
      </Box>

      {/* Events Legend */}
      {events.length > 0 && (
        <Box
          sx={{
            px: 2.5,
            pb: 1.5,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1.5,
            borderTop: '1px solid rgba(248,250,252,0.06)',
            pt: 1,
          }}
        >
          {Object.entries(EVENT_COLORS).map(([type, color]) => (
            <Box key={type} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                sx={{
                  width: 12,
                  height: 0,
                  borderTop: `2px dashed ${color}`,
                }}
              />
              <Typography
                variant="caption"
                sx={{ color: '#64748B', fontSize: '0.6rem', textTransform: 'capitalize' }}
              >
                {type.replace('_', ' ')}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
};

const QualityTimeline: React.FC<React.ComponentProps<typeof QualityTimelineSample>> = (props) => (
  <DemoSurfaceGate
    testId="quality-timeline"
    title="Quality history is not live on this testnet"
    description="This preview contains illustrative data or simulated actions, not verified testnet results."
  >
    <QualityTimelineSample {...props} />
  </DemoSurfaceGate>
);

export default QualityTimeline;
