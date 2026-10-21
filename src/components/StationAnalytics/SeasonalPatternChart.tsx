// SeasonalPatternChart - 12-month heatmap with color scale, volume overlay, year selector
import React, { useState, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import WrfCard from '../ui/WrfCard';
import WrfStatCard from '../ui/WrfStatCard';
import WrfButton from '../ui/WrfButton';
import { colors, spacing, borderRadius } from '../ui/tokens';

// ---------- Types ----------

interface MonthlyData {
  month: number; // 0-11
  avgTemp: number;
  avgHumidity: number;
  avgPressure: number;
  avgWind: number;
  totalReadings: number;
  qualityScore: number;
}

type MetricKey = 'avgTemp' | 'avgHumidity' | 'avgPressure' | 'avgWind' | 'qualityScore';

interface HeatmapCell {
  row: number;
  col: number;
  value: number;
  month: string;
  metric: string;
}

// ---------- Constants ----------

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const METRICS: { key: MetricKey; label: string; unit: string; colorStart: string; colorEnd: string }[] = [
  { key: 'avgTemp', label: 'Temperature', unit: '\u00B0F', colorStart: '#3B82F6', colorEnd: '#EF4444' },
  { key: 'avgHumidity', label: 'Humidity', unit: '%', colorStart: '#F59E0B', colorEnd: '#3B82F6' },
  { key: 'avgPressure', label: 'Pressure', unit: 'hPa', colorStart: '#10B981', colorEnd: '#8B5CF6' },
  { key: 'avgWind', label: 'Wind Speed', unit: 'mph', colorStart: '#06B6D4', colorEnd: '#F59E0B' },
  { key: 'qualityScore', label: 'Quality', unit: '%', colorStart: '#EF4444', colorEnd: '#10B981' },
];

const AVAILABLE_YEARS = [2024, 2025, 2026];

// ---------- Mock Data Generator ----------

const generateYearData = (year: number): MonthlyData[] => {
  const seed = year * 7;
  return Array.from({ length: 12 }, (_, m) => {
    const seasonalBase = Math.sin(((m - 1) * Math.PI) / 6);
    const noise = ((seed + m * 13) % 17) / 17 - 0.5;
    return {
      month: m,
      avgTemp: Math.round((55 + seasonalBase * 25 + noise * 6) * 10) / 10,
      avgHumidity: Math.round((50 - seasonalBase * 15 + noise * 8) * 10) / 10,
      avgPressure: Math.round((1015 + seasonalBase * 3 + noise * 2) * 10) / 10,
      avgWind: Math.round((10 + Math.abs(seasonalBase) * 5 + noise * 3) * 10) / 10,
      totalReadings: Math.round(8000 + noise * 1200 + m * 40),
      qualityScore: Math.round((90 + noise * 6 + m * 0.3) * 10) / 10,
    };
  });
};

// ---------- Color Interpolation ----------

const hexToRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const interpolateColor = (start: string, end: string, t: number): string => {
  const [r1, g1, b1] = hexToRgb(start);
  const [r2, g2, b2] = hexToRgb(end);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${b})`;
};

// ---------- Main Component ----------

const SeasonalPatternChart: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const yearData = useMemo(() => generateYearData(selectedYear), [selectedYear]);

  // Build heatmap grid: rows = metrics, cols = months
  const heatmapData = useMemo(() => {
    return METRICS.map((metric, rowIdx) => {
      const values = yearData.map((d) => d[metric.key]);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min || 1;

      return yearData.map((d, colIdx) => {
        const raw = d[metric.key];
        const t = (raw - min) / range;
        return {
          row: rowIdx,
          col: colIdx,
          value: raw,
          normalized: t,
          color: interpolateColor(metric.colorStart, metric.colorEnd, t),
          month: MONTHS[colIdx],
          metric: metric.label,
          unit: metric.unit,
        };
      });
    });
  }, [yearData]);

  // Volume overlay data (total readings per month)
  const maxReadings = useMemo(() => Math.max(...yearData.map((d) => d.totalReadings)), [yearData]);

  // Summary stats
  const summary = useMemo(() => {
    const temps = yearData.map((d) => d.avgTemp);
    const qualities = yearData.map((d) => d.qualityScore);
    const totalReadings = yearData.reduce((sum, d) => sum + d.totalReadings, 0);
    return {
      peakTempMonth: MONTHS[temps.indexOf(Math.max(...temps))],
      peakTemp: Math.max(...temps),
      lowTempMonth: MONTHS[temps.indexOf(Math.min(...temps))],
      lowTemp: Math.min(...temps),
      avgQuality: Math.round((qualities.reduce((s, v) => s + v, 0) / qualities.length) * 10) / 10,
      totalReadings,
    };
  }, [yearData]);

  // SVG dimensions
  const cellW = 56;
  const cellH = 40;
  const labelW = 90;
  const topLabelH = 24;
  const volumeH = 60;
  const gapH = 12;
  const gridW = 12 * cellW;
  const gridH = METRICS.length * cellH;
  const svgW = labelW + gridW + 20;
  const svgH = topLabelH + gridH + gapH + volumeH + 10;

  const handleCellHover = useCallback(
    (cell: HeatmapCell & { unit: string; normalized: number; color: string }, e: React.MouseEvent) => {
      setHoveredCell(cell);
      const svgRect = (e.currentTarget as SVGElement).closest('svg')?.getBoundingClientRect();
      if (svgRect) {
        setTooltipPos({
          x: e.clientX - svgRect.left,
          y: e.clientY - svgRect.top - 50,
        });
      }
    },
    [],
  );

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: colors.bg.primary, padding: `${spacing.xl}px` }}>
      <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text.primary, marginBottom: `${spacing.lg}px` }}>
        Seasonal Patterns
      </Typography>

      {/* Year Selector */}
      <Box sx={{ display: 'flex', gap: `${spacing.sm}px`, marginBottom: `${spacing.lg}px` }}>
        {AVAILABLE_YEARS.map((year) => (
          <WrfButton
            key={year}
            variant={year === selectedYear ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedYear(year)}
          >
            {year}
          </WrfButton>
        ))}
      </Box>

      {/* Heatmap */}
      <WrfCard title={`${selectedYear} Monthly Heatmap`} subtitle="Each row represents a metric across 12 months">
        <Box sx={{ overflowX: 'auto', position: 'relative' }}>
          <svg
            width={svgW}
            height={svgH}
            viewBox={`0 0 ${svgW} ${svgH}`}
            style={{ display: 'block', minWidth: svgW }}
          >
            {/* Month labels */}
            {MONTHS.map((m, i) => (
              <text
                key={`ml-${i}`}
                x={labelW + i * cellW + cellW / 2}
                y={topLabelH - 6}
                textAnchor="middle"
                fill={colors.text.muted}
                fontSize="11"
                fontWeight={500}
              >
                {m}
              </text>
            ))}

            {/* Metric row labels + cells */}
            {heatmapData.map((row, ri) => (
              <g key={`row-${ri}`}>
                <text
                  x={labelW - 8}
                  y={topLabelH + ri * cellH + cellH / 2 + 4}
                  textAnchor="end"
                  fill={colors.text.secondary}
                  fontSize="11"
                  fontWeight={500}
                >
                  {METRICS[ri].label}
                </text>
                {row.map((cell, ci) => (
                  <g key={`cell-${ri}-${ci}`}>
                    <rect
                      x={labelW + ci * cellW + 1}
                      y={topLabelH + ri * cellH + 1}
                      width={cellW - 2}
                      height={cellH - 2}
                      rx={4}
                      fill={cell.color}
                      opacity={0.85}
                      style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
                      onMouseEnter={(e) => handleCellHover(cell, e)}
                      onMouseLeave={() => setHoveredCell(null)}
                    />
                    <text
                      x={labelW + ci * cellW + cellW / 2}
                      y={topLabelH + ri * cellH + cellH / 2 + 4}
                      textAnchor="middle"
                      fill="#fff"
                      fontSize="10"
                      fontWeight={600}
                      style={{ pointerEvents: 'none' }}
                    >
                      {cell.value}
                    </text>
                  </g>
                ))}
              </g>
            ))}

            {/* Volume overlay (bar chart) */}
            <text
              x={labelW - 8}
              y={topLabelH + gridH + gapH + 12}
              textAnchor="end"
              fill={colors.text.muted}
              fontSize="10"
              fontWeight={500}
            >
              Volume
            </text>
            {yearData.map((d, i) => {
              const barH = (d.totalReadings / maxReadings) * volumeH;
              return (
                <g key={`vol-${i}`}>
                  <rect
                    x={labelW + i * cellW + 6}
                    y={topLabelH + gridH + gapH + volumeH - barH}
                    width={cellW - 12}
                    height={barH}
                    rx={3}
                    fill={colors.brand.primary}
                    opacity={0.5}
                  />
                  <text
                    x={labelW + i * cellW + cellW / 2}
                    y={topLabelH + gridH + gapH + volumeH + 12}
                    textAnchor="middle"
                    fill={colors.text.muted}
                    fontSize="9"
                  >
                    {(d.totalReadings / 1000).toFixed(1)}k
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Tooltip */}
          {hoveredCell && (
            <Box
              sx={{
                position: 'absolute',
                left: tooltipPos.x,
                top: tooltipPos.y,
                transform: 'translateX(-50%)',
                backgroundColor: colors.bg.tertiary,
                border: `1px solid ${colors.border.default}`,
                borderRadius: `${borderRadius.md}px`,
                padding: '8px 12px',
                pointerEvents: 'none',
                zIndex: 10,
                whiteSpace: 'nowrap',
              }}
            >
              <Typography sx={{ fontSize: '0.75rem', color: colors.text.primary, fontWeight: 600 }}>
                {hoveredCell.month} -- {hoveredCell.metric}
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: colors.text.secondary }}>
                Value: {hoveredCell.value}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Color Scale Legend */}
        <Box sx={{ marginTop: `${spacing.lg}px`, display: 'flex', flexWrap: 'wrap', gap: `${spacing.md}px` }}>
          {METRICS.map((metric) => (
            <Box key={metric.key} sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted, minWidth: 70 }}>
                {metric.label}:
              </Typography>
              <Box
                sx={{
                  width: 80,
                  height: 10,
                  borderRadius: '5px',
                  background: `linear-gradient(90deg, ${metric.colorStart}, ${metric.colorEnd})`,
                }}
              />
              <Typography sx={{ fontSize: '0.65rem', color: colors.text.muted }}>
                Low{'\u2192'}High
              </Typography>
            </Box>
          ))}
        </Box>
      </WrfCard>

      {/* Summary Stats */}
      <Grid container spacing={2} sx={{ marginTop: `${spacing.lg}px` }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard label="Peak Temperature" value={`${summary.peakTemp}\u00B0F`} trendLabel={summary.peakTempMonth} color={colors.error.main} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard label="Lowest Temperature" value={`${summary.lowTemp}\u00B0F`} trendLabel={summary.lowTempMonth} color={colors.brand.primary} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard label="Avg Quality Score" value={`${summary.avgQuality}%`} color={colors.success.main} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard label="Total Readings" value={summary.totalReadings.toLocaleString()} color="#06B6D4" />
        </Grid>
      </Grid>
    </Box>
  );
};

export default SeasonalPatternChart;
