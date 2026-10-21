// ContributionCalendar - GitHub-style 365-day SVG grid with streak tracking
import React, { useState, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import WrfCard from '../ui/WrfCard';
import WrfStatCard from '../ui/WrfStatCard';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import StarIcon from '@mui/icons-material/Star';
import TimelineIcon from '@mui/icons-material/Timeline';
import { colors, spacing, borderRadius } from '../ui/tokens';

// ---------- Types ----------

interface DayData {
  date: string; // YYYY-MM-DD
  readings: number;
  quality: number;
}

interface TooltipInfo {
  date: string;
  readings: number;
  quality: number;
  x: number;
  y: number;
}

// ---------- Constants ----------

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Green color scale (5 levels including zero)
const COLOR_LEVELS = [
  colors.bg.tertiary,       // 0 readings
  '#0E4429',                 // low
  '#006D32',                 // medium-low
  '#26A641',                 // medium-high
  '#39D353',                 // high
];

// ---------- Mock Data Generator ----------

const generateYearData = (): DayData[] => {
  const data: DayData[] = [];
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 364);

  for (let i = 0; i < 365; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);

    // Deterministic pseudo-random based on date
    const seed = d.getDate() * 7 + d.getMonth() * 31 + d.getFullYear();
    const hash = ((seed * 2654435761) >>> 0) % 1000;
    const rand = hash / 1000;

    // Most days have readings, some have zero
    const hasData = rand > 0.08;
    const readings = hasData ? Math.floor(200 + rand * 150) : 0;
    const quality = hasData ? Math.round((85 + rand * 15) * 10) / 10 : 0;

    data.push({ date: dateStr, readings, quality });
  }
  return data;
};

// ---------- Helpers ----------

const getColorLevel = (readings: number, maxReadings: number): number => {
  if (readings === 0) return 0;
  const ratio = readings / maxReadings;
  if (ratio < 0.25) return 1;
  if (ratio < 0.5) return 2;
  if (ratio < 0.75) return 3;
  return 4;
};

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

// ---------- Main Component ----------

const ContributionCalendar: React.FC = () => {
  const [tooltipInfo, setTooltipInfo] = useState<TooltipInfo | null>(null);

  const yearData = useMemo(() => generateYearData(), []);
  const maxReadings = useMemo(() => Math.max(...yearData.map((d) => d.readings)), [yearData]);

  // Build 52x7 grid (cols = weeks, rows = days of week)
  const { grid, monthLabels } = useMemo(() => {
    const firstDate = new Date(yearData[0].date + 'T00:00:00');
    const firstDayOfWeek = firstDate.getDay(); // 0 = Sunday

    // Map data by date for quick lookup
    const dataMap = new Map<string, DayData>();
    for (const d of yearData) {
      dataMap.set(d.date, d);
    }

    // Build grid
    const cols: (DayData | null)[][] = [];
    let currentCol: (DayData | null)[] = [];

    // Fill leading nulls in first week
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentCol.push(null);
    }

    for (const d of yearData) {
      currentCol.push(d);
      if (currentCol.length === 7) {
        cols.push(currentCol);
        currentCol = [];
      }
    }
    if (currentCol.length > 0) {
      while (currentCol.length < 7) currentCol.push(null);
      cols.push(currentCol);
    }

    // Month labels with positions
    const labels: { month: string; col: number }[] = [];
    let lastMonth = -1;
    for (let c = 0; c < cols.length; c++) {
      const firstNonNull = cols[c].find((d) => d !== null);
      if (firstNonNull) {
        const m = new Date(firstNonNull.date + 'T00:00:00').getMonth();
        if (m !== lastMonth) {
          labels.push({ month: MONTH_NAMES[m], col: c });
          lastMonth = m;
        }
      }
    }

    return { grid: cols, monthLabels: labels };
  }, [yearData]);

  // Streak calculations
  const { currentStreak, longestStreak, totalActive, totalReadings } = useMemo(() => {
    let current = 0;
    let longest = 0;
    let running = 0;
    let totalActive = 0;
    let totalReadings = 0;

    // Process in reverse to find current streak from today
    const reversed = [...yearData].reverse();
    let currentStreakFound = false;

    for (const d of reversed) {
      if (d.readings > 0) {
        if (!currentStreakFound) current++;
        running++;
        totalActive++;
        totalReadings += d.readings;
      } else {
        if (!currentStreakFound) currentStreakFound = true;
        longest = Math.max(longest, running);
        running = 0;
      }
    }
    longest = Math.max(longest, running);

    // Also compute longest from forward pass
    running = 0;
    let fwdLongest = 0;
    for (const d of yearData) {
      if (d.readings > 0) {
        running++;
        fwdLongest = Math.max(fwdLongest, running);
      } else {
        running = 0;
      }
    }

    return {
      currentStreak: current,
      longestStreak: Math.max(longest, fwdLongest),
      totalActive,
      totalReadings,
    };
  }, [yearData]);

  // SVG dimensions
  const cellSize = 14;
  const cellGap = 3;
  const dayLabelW = 30;
  const monthLabelH = 18;
  const numCols = grid.length;
  const svgW = dayLabelW + numCols * (cellSize + cellGap) + 10;
  const svgH = monthLabelH + 7 * (cellSize + cellGap) + 10;

  const handleCellHover = useCallback(
    (d: DayData, e: React.MouseEvent) => {
      const svgRect = (e.currentTarget as SVGElement).closest('svg')?.getBoundingClientRect();
      if (svgRect) {
        setTooltipInfo({
          date: d.date,
          readings: d.readings,
          quality: d.quality,
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
        Contribution Calendar
      </Typography>

      {/* Summary Stats */}
      <Grid container spacing={2} sx={{ marginBottom: `${spacing.lg}px` }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <WrfStatCard
            label="Current Streak"
            value={`${currentStreak} days`}
            icon={LocalFireDepartmentIcon}
            color={colors.warning.main}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <WrfStatCard
            label="Longest Streak"
            value={`${longestStreak} days`}
            icon={StarIcon}
            color={colors.success.main}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <WrfStatCard
            label="Active Days"
            value={`${totalActive}/365`}
            icon={CalendarMonthIcon}
            color={colors.brand.primary}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <WrfStatCard
            label="Total Readings"
            value={totalReadings.toLocaleString()}
            icon={TimelineIcon}
            color="#8B5CF6"
          />
        </Grid>
      </Grid>

      {/* Calendar Grid */}
      <WrfCard title="365-Day Activity" subtitle={`${totalActive} active days out of 365 (${Math.round((totalActive / 365) * 100)}% uptime)`}>
        <Box sx={{ overflowX: 'auto', position: 'relative' }}>
          <svg
            width={svgW}
            height={svgH}
            viewBox={`0 0 ${svgW} ${svgH}`}
            style={{ display: 'block', minWidth: svgW }}
          >
            {/* Month labels */}
            {monthLabels.map((ml, i) => (
              <text
                key={`month-${i}`}
                x={dayLabelW + ml.col * (cellSize + cellGap)}
                y={monthLabelH - 4}
                fill={colors.text.muted}
                fontSize="10"
                fontWeight={500}
              >
                {ml.month}
              </text>
            ))}

            {/* Day of week labels (Mon, Wed, Fri) */}
            {[1, 3, 5].map((dayIdx) => (
              <text
                key={`day-${dayIdx}`}
                x={dayLabelW - 6}
                y={monthLabelH + dayIdx * (cellSize + cellGap) + cellSize / 2 + 3}
                textAnchor="end"
                fill={colors.text.muted}
                fontSize="9"
              >
                {DAYS_OF_WEEK[dayIdx]}
              </text>
            ))}

            {/* Grid cells */}
            {grid.map((col, ci) =>
              col.map((cell, ri) => {
                if (!cell) return null;
                const level = getColorLevel(cell.readings, maxReadings);
                const x = dayLabelW + ci * (cellSize + cellGap);
                const y = monthLabelH + ri * (cellSize + cellGap);

                return (
                  <rect
                    key={`${ci}-${ri}`}
                    x={x}
                    y={y}
                    width={cellSize}
                    height={cellSize}
                    rx={2}
                    fill={COLOR_LEVELS[level]}
                    style={{ cursor: 'pointer', transition: 'opacity 0.1s' }}
                    onMouseEnter={(e) => handleCellHover(cell, e)}
                    onMouseLeave={() => setTooltipInfo(null)}
                  />
                );
              }),
            )}
          </svg>

          {/* Tooltip */}
          {tooltipInfo && (
            <Box
              sx={{
                position: 'absolute',
                left: tooltipInfo.x,
                top: tooltipInfo.y,
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
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: colors.text.primary }}>
                {formatDate(tooltipInfo.date)}
              </Typography>
              {tooltipInfo.readings > 0 ? (
                <>
                  <Typography sx={{ fontSize: '0.7rem', color: colors.text.secondary }}>
                    {tooltipInfo.readings} readings
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: colors.text.secondary }}>
                    Quality: {tooltipInfo.quality}%
                  </Typography>
                </>
              ) : (
                <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted }}>
                  No data submitted
                </Typography>
              )}
            </Box>
          )}
        </Box>

        {/* Color scale legend */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: `${spacing.md}px` }}>
          <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted }}>Less</Typography>
          {COLOR_LEVELS.map((c, i) => (
            <Box
              key={i}
              sx={{
                width: 12,
                height: 12,
                borderRadius: '2px',
                backgroundColor: c,
              }}
            />
          ))}
          <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted }}>More</Typography>
        </Box>
      </WrfCard>

      {/* Streak Details */}
      <WrfCard title="Streak Tracking" subtitle="Consecutive days of data submission" sx={{ marginTop: `${spacing.lg}px` }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: `${spacing.md}px`,
                padding: `${spacing.md}px`,
                borderRadius: `${borderRadius.md}px`,
                backgroundColor: colors.bg.primary,
                border: `1px solid ${colors.border.default}`,
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: `${colors.warning.main}15`,
                }}
              >
                <LocalFireDepartmentIcon sx={{ fontSize: 24, color: colors.warning.main }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Current Streak
                </Typography>
                <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text.primary }}>
                  {currentStreak} days
                </Typography>
                <Typography sx={{ fontSize: '0.7rem', color: colors.text.secondary }}>
                  {currentStreak >= 30 ? 'Consistency Champion tier reached' : `${30 - currentStreak} days until Silver tier`}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: `${spacing.md}px`,
                padding: `${spacing.md}px`,
                borderRadius: `${borderRadius.md}px`,
                backgroundColor: colors.bg.primary,
                border: `1px solid ${colors.border.default}`,
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: `${colors.success.main}15`,
                }}
              >
                <StarIcon sx={{ fontSize: 24, color: colors.success.main }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Best Streak
                </Typography>
                <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text.primary }}>
                  {longestStreak} days
                </Typography>
                <Typography sx={{ fontSize: '0.7rem', color: colors.text.secondary }}>
                  {longestStreak >= 90 ? 'Gold tier achieved' : longestStreak >= 30 ? 'Silver tier achieved' : 'Working toward Bronze'}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </WrfCard>
    </Box>
  );
};

export default ContributionCalendar;
