import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Chip,
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartOptions,
} from 'chart.js';
import { ModelScorecardEntry } from './types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement);

export interface ForecastScorecardProps {
  entries: ModelScorecardEntry[];
}

/** Inline sparkline component rendered with Chart.js */
const Sparkline: React.FC<{ data: number[]; color: string; width?: number; height?: number }> = ({
  data,
  color,
  width = 100,
  height = 28,
}) => {
  const chartData = useMemo(
    () => ({
      labels: data.map((_, i) => String(i)),
      datasets: [
        {
          data,
          borderColor: color,
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.4,
          fill: false,
        },
      ],
    }),
    [data, color],
  );

  const options: ChartOptions<'line'> = useMemo(
    () => ({
      responsive: false,
      maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: {
        x: { display: false },
        y: { display: false },
      },
    }),
    [],
  );

  return (
    <Box sx={{ width, height, display: 'inline-block' }}>
      <Line data={chartData} options={options} width={width} height={height} />
    </Box>
  );
};

const ForecastScorecard: React.FC<ForecastScorecardProps> = ({ entries }) => {
  const [selectedModels, setSelectedModels] = useState<Set<string>>(() => new Set());

  // Compute averages for color-coding
  const averages = useMemo(() => {
    const n = entries.length;
    if (n === 0) return { rmse: 0, mae: 0, bias: 0, score: 0 };
    return {
      rmse: entries.reduce((s, e) => s + e.rmse, 0) / n,
      mae: entries.reduce((s, e) => s + e.mae, 0) / n,
      bias: entries.reduce((s, e) => s + Math.abs(e.bias), 0) / n,
      score: entries.reduce((s, e) => s + e.wrfcoinScore, 0) / n,
    };
  }, [entries]);

  const toggleModel = (modelId: string) => {
    setSelectedModels((prev) => {
      const next = new Set(prev);
      if (next.has(modelId)) {
        next.delete(modelId);
      } else {
        next.add(modelId);
      }
      return next;
    });
  };

  /** Return green if better than average, red if worse, for a "lower is better" metric */
  const lowerBetterColor = (value: number, avg: number) =>
    value <= avg ? '#10B981' : '#EF4444';

  /** Return green if better than average, red if worse, for a "higher is better" metric */
  const higherBetterColor = (value: number, avg: number) =>
    value >= avg ? '#10B981' : '#EF4444';

  // Head-to-head comparison data
  const h2hEntries = useMemo(() => {
    if (selectedModels.size !== 2) return null;
    const [a, b] = [...selectedModels].map((id) => entries.find((e) => e.modelId === id)!);
    if (!a || !b) return null;
    return { a, b };
  }, [selectedModels, entries]);

  const cellSx = {
    color: '#CBD5E1',
    fontFamily: 'JetBrains Mono',
    fontSize: '0.8rem',
    borderBottom: '1px solid #334155',
    py: 1,
    px: 1.5,
  };

  const headerSx = {
    ...cellSx,
    color: '#94A3B8',
    fontFamily: 'Inter',
    fontWeight: 600,
    fontSize: '0.7rem',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  };

  return (
    <Box>
      <Typography
        variant="subtitle2"
        sx={{ color: '#94A3B8', fontFamily: 'Inter', textTransform: 'uppercase', letterSpacing: 1, mb: 1.5 }}
      >
        Forecast Scorecard
      </Typography>

      <TableContainer
        sx={{
          bgcolor: '#1E293B',
          borderRadius: 2,
          '& .MuiTable-root': { minWidth: 700 },
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={headerSx} width={40}>
                H2H
              </TableCell>
              <TableCell sx={headerSx}>Model</TableCell>
              <TableCell sx={headerSx} align="right">
                RMSE
              </TableCell>
              <TableCell sx={headerSx} align="center" width={110}>
                Trend (30d)
              </TableCell>
              <TableCell sx={headerSx} align="right">
                MAE
              </TableCell>
              <TableCell sx={headerSx} align="center" width={110}>
                Trend (30d)
              </TableCell>
              <TableCell sx={headerSx} align="right">
                Bias
              </TableCell>
              <TableCell sx={headerSx} align="center" width={110}>
                Trend (30d)
              </TableCell>
              <TableCell sx={headerSx} align="right">
                WRF Score
              </TableCell>
              <TableCell sx={headerSx} align="center" width={110}>
                Trend (30d)
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((entry) => (
              <TableRow
                key={entry.modelId}
                sx={{
                  '&:hover': { bgcolor: '#334155' },
                  bgcolor: selectedModels.has(entry.modelId) ? '#33415540' : 'transparent',
                }}
              >
                <TableCell sx={cellSx}>
                  <Checkbox
                    checked={selectedModels.has(entry.modelId)}
                    onChange={() => toggleModel(entry.modelId)}
                    size="small"
                    sx={{
                      color: '#475569',
                      '&.Mui-checked': { color: entry.color },
                      p: 0,
                    }}
                  />
                </TableCell>
                <TableCell sx={cellSx}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: entry.color,
                        flexShrink: 0,
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ color: '#F8FAFC', fontFamily: 'Inter', fontWeight: 500, fontSize: '0.8rem' }}
                    >
                      {entry.modelName}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ ...cellSx, color: lowerBetterColor(entry.rmse, averages.rmse) }} align="right">
                  {entry.rmse.toFixed(2)}
                </TableCell>
                <TableCell sx={cellSx} align="center">
                  <Sparkline data={entry.rmseTrend} color={entry.color} />
                </TableCell>
                <TableCell sx={{ ...cellSx, color: lowerBetterColor(entry.mae, averages.mae) }} align="right">
                  {entry.mae.toFixed(2)}
                </TableCell>
                <TableCell sx={cellSx} align="center">
                  <Sparkline data={entry.maeTrend} color={entry.color} />
                </TableCell>
                <TableCell
                  sx={{ ...cellSx, color: lowerBetterColor(Math.abs(entry.bias), averages.bias) }}
                  align="right"
                >
                  {entry.bias > 0 ? '+' : ''}
                  {entry.bias.toFixed(2)}
                </TableCell>
                <TableCell sx={cellSx} align="center">
                  <Sparkline data={entry.biasTrend} color={entry.color} />
                </TableCell>
                <TableCell
                  sx={{ ...cellSx, color: higherBetterColor(entry.wrfcoinScore, averages.score) }}
                  align="right"
                >
                  {entry.wrfcoinScore.toFixed(1)}
                </TableCell>
                <TableCell sx={cellSx} align="center">
                  <Sparkline data={entry.scoreTrend} color={entry.color} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Head-to-Head comparison panel */}
      {h2hEntries && (
        <Box
          sx={{
            mt: 2,
            p: 2,
            bgcolor: '#1E293B',
            borderRadius: 2,
            border: '1px solid #334155',
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ color: '#F8FAFC', fontFamily: 'Inter', fontWeight: 600, mb: 1.5 }}
          >
            Head-to-Head: {h2hEntries.a.modelName} vs {h2hEntries.b.modelName}
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {(['rmse', 'mae', 'bias', 'wrfcoinScore'] as const).map((metric) => {
              const aVal = metric === 'bias' ? Math.abs(h2hEntries.a[metric]) : h2hEntries.a[metric];
              const bVal = metric === 'bias' ? Math.abs(h2hEntries.b[metric]) : h2hEntries.b[metric];
              const isLowerBetter = metric !== 'wrfcoinScore';
              const aWins = isLowerBetter ? aVal < bVal : aVal > bVal;
              const label =
                metric === 'wrfcoinScore'
                  ? 'WRF Score'
                  : metric.toUpperCase();

              return (
                <Box
                  key={metric}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.5,
                    minWidth: 120,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: '#94A3B8', fontFamily: 'Inter', fontSize: '0.65rem', textTransform: 'uppercase' }}
                  >
                    {label}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip
                      label={h2hEntries.a[metric].toFixed(2)}
                      size="small"
                      sx={{
                        bgcolor: aWins ? '#10B98130' : '#EF444430',
                        color: aWins ? '#10B981' : '#EF4444',
                        fontFamily: 'JetBrains Mono',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        border: `1px solid ${aWins ? '#10B98150' : '#EF444450'}`,
                      }}
                    />
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      vs
                    </Typography>
                    <Chip
                      label={h2hEntries.b[metric].toFixed(2)}
                      size="small"
                      sx={{
                        bgcolor: !aWins ? '#10B98130' : '#EF444430',
                        color: !aWins ? '#10B981' : '#EF4444',
                        fontFamily: 'JetBrains Mono',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        border: `1px solid ${!aWins ? '#10B98150' : '#EF444450'}`,
                      }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: h2hEntries.a.color,
                      }}
                    />
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: h2hEntries.b.color,
                      }}
                    />
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Hint text */}
      {selectedModels.size !== 2 && (
        <Typography
          variant="caption"
          sx={{ color: '#64748B', fontFamily: 'Inter', mt: 1, display: 'block' }}
        >
          Select exactly 2 models to see head-to-head comparison.
        </Typography>
      )}
    </Box>
  );
};

export default ForecastScorecard;
