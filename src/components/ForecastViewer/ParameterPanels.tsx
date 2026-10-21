import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Filler,
  ChartOptions,
  ChartData,
  Plugin,
} from 'chart.js';
import { ModelForecast, ConfidenceBand, PARAMETER_CONFIG } from './types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Filler);

export interface ParameterPanelsProps {
  models: ModelForecast[];
  confidence: {
    temperature: ConfidenceBand[];
    precipitation: ConfidenceBand[];
    windSpeed: ConfidenceBand[];
    pressure: ConfidenceBand[];
    humidity: ConfidenceBand[];
    cloudCover: ConfidenceBand[];
  };
  visibleHours?: number;
}

/** Crosshair plugin for synchronized hover across all panels */
const crosshairPlugin: Plugin<'line' | 'bar'> = {
  id: 'crosshairSync',
  afterDraw(chart) {
    const activeElements = chart.tooltip?.getActiveElements();
    if (!activeElements?.length) return;

    const { ctx } = chart;
    const x = activeElements[0].element.x;
    const topY = chart.scales.y.top;
    const bottomY = chart.scales.y.bottom;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, topY);
    ctx.lineTo(x, bottomY);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#475569';
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.restore();
  },
};

ChartJS.register(crosshairPlugin);

interface PanelConfig {
  key: string;
  label: string;
  unit: string;
  color: string;
  type: 'line' | 'bar' | 'area';
  yMin?: number;
  yMax?: number;
}

const PANELS: PanelConfig[] = [
  { key: 'temperature', label: 'Temperature', unit: '\u00B0F', color: '#EF4444', type: 'line' },
  { key: 'precipitation', label: 'Precipitation Probability', unit: '%', color: '#3B82F6', type: 'bar', yMin: 0, yMax: 100 },
  { key: 'windSpeed', label: 'Wind Speed', unit: 'mph', color: '#8B5CF6', type: 'line', yMin: 0 },
  { key: 'cloudCover', label: 'Cloud Cover', unit: '%', color: '#6B7280', type: 'area', yMin: 0, yMax: 100 },
  { key: 'humidity', label: 'Humidity', unit: '%', color: '#06B6D4', type: 'line', yMin: 0, yMax: 100 },
  { key: 'pressure', label: 'Pressure', unit: 'hPa', color: '#10B981', type: 'line' },
];

const ParameterPanels: React.FC<ParameterPanelsProps> = ({
  models,
  confidence,
  visibleHours,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const chartRefs = useRef<(ChartJS | null)[]>([]);

  const maxPoints = visibleHours ?? models[0]?.points.length ?? 0;
  const refModel = models[0];

  const labels = useMemo(() => {
    if (!refModel) return [];
    return refModel.points.slice(0, maxPoints).map((p) => {
      const d = new Date(p.timestamp);
      return d.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric' });
    });
  }, [refModel, maxPoints]);

  const displayLabels = useMemo(() => {
    const step = Math.max(1, Math.floor(labels.length / 16));
    return labels.map((l, i) => (i % step === 0 ? l : ''));
  }, [labels]);

  // Sync crosshair across charts on hover
  const handleHover = useCallback(
    (_: unknown, elements: { index: number }[]) => {
      if (!elements.length) {
        setHoverIndex(null);
        return;
      }
      const idx = elements[0].index;
      setHoverIndex(idx);
    },
    [],
  );

  // Update all charts when hover index changes
  useEffect(() => {
    if (hoverIndex === null) return;
    chartRefs.current.forEach((chart) => {
      if (!chart) return;
      const meta = chart.getDatasetMeta(0);
      if (!meta?.data[hoverIndex]) return;
      chart.tooltip?.setActiveElements(
        [{ datasetIndex: 0, index: hoverIndex }],
        { x: meta.data[hoverIndex].x, y: meta.data[hoverIndex].y },
      );
      chart.setActiveElements([{ datasetIndex: 0, index: hoverIndex }]);
      chart.update('none');
    });
  }, [hoverIndex]);

  const baseChartOptions = useCallback(
    (panel: PanelConfig): ChartOptions<'line'> & ChartOptions<'bar'> => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: 'index', intersect: false },
      onHover: handleHover as ChartOptions<'line'>['onHover'],
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#F8FAFC',
          bodyColor: '#CBD5E1',
          borderColor: '#334155',
          borderWidth: 1,
          padding: 8,
          titleFont: { family: 'Inter', size: 11 },
          bodyFont: { family: 'JetBrains Mono', size: 11 },
          callbacks: {
            title: (items) => {
              if (!items.length) return '';
              const idx = items[0].dataIndex;
              const p = refModel?.points[idx];
              if (!p) return '';
              return new Date(p.timestamp).toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
              });
            },
            label: (item) => {
              const val = typeof item.raw === 'number' ? item.raw.toFixed(1) : String(item.raw);
              return ` ${val} ${panel.unit}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: '#1E293B', drawTicks: false },
          ticks: { color: '#64748B', font: { family: 'Inter', size: 9 }, maxRotation: 0 },
        },
        y: {
          min: panel.yMin,
          max: panel.yMax,
          grid: { color: '#1E293B' },
          ticks: {
            color: '#64748B',
            font: { family: 'JetBrains Mono', size: 9 },
            callback: (v) => `${v}`,
          },
        },
      },
    }),
    [handleHover, refModel],
  );

  const buildPanelData = useCallback(
    (panel: PanelConfig): ChartData<'line'> | ChartData<'bar'> => {
      const confBands = confidence[panel.key as keyof typeof confidence]?.slice(0, maxPoints) ?? [];
      const ensembleMean = confBands.map((b) => b.mean);

      if (panel.type === 'bar') {
        // Precipitation: bar chart colored by precipitation type
        const precipData = refModel?.points.slice(0, maxPoints) ?? [];
        const colors = precipData.map((p) => {
          switch (p.precipitationType) {
          case 'snow': return '#F8FAFC';
          case 'mixed': return '#8B5CF6';
          case 'rain': return '#3B82F6';
          default: return '#3B82F633';
          }
        });

        return {
          labels: displayLabels,
          datasets: [
            {
              label: panel.label,
              data: precipData.map((p) => p.precipitationProbability),
              backgroundColor: colors,
              borderColor: 'transparent',
              borderWidth: 0,
              barPercentage: 1.0,
              categoryPercentage: 1.0,
            },
          ],
        } as ChartData<'bar'>;
      }

      if (panel.type === 'area') {
        // Cloud cover: filled area
        return {
          labels: displayLabels,
          datasets: [
            {
              label: panel.label,
              data: ensembleMean,
              borderColor: panel.color,
              backgroundColor: panel.color + '30',
              borderWidth: 1.5,
              pointRadius: 0,
              tension: 0.3,
              fill: 'origin',
            },
          ],
        };
      }

      // Line chart with confidence bands
      const datasets = [
        // 50% confidence band
        {
          label: 'Upper 50%',
          data: confBands.map((b) => b.p75),
          borderColor: 'transparent',
          backgroundColor: panel.color + '20',
          fill: '+1',
          pointRadius: 0,
          order: 3,
        },
        {
          label: 'Lower 50%',
          data: confBands.map((b) => b.p25),
          borderColor: 'transparent',
          backgroundColor: 'transparent',
          fill: false,
          pointRadius: 0,
          order: 3,
        },
        // Mean line
        {
          label: panel.label,
          data: ensembleMean,
          borderColor: panel.color,
          backgroundColor: panel.color,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.3,
          fill: false,
          order: 1,
        },
      ];

      // Wind: add barb direction markers every 6 hours
      if (panel.key === 'windSpeed' && refModel) {
        const directionPoints = refModel.points.slice(0, maxPoints).map((p, i) => {
          if (i % 6 !== 0) return null;
          return p.windSpeed;
        });
        datasets.push({
          label: 'Wind Direction',
          data: directionPoints as (number | null)[],
          borderColor: '#8B5CF680',
          backgroundColor: '#8B5CF6',
          borderWidth: 0,
          pointRadius: directionPoints.map((v) => (v !== null ? 3 : 0)) as unknown as number,
          pointHoverRadius: 5,
          tension: 0,
          fill: false,
          order: 0,
          pointStyle: 'triangle' as const,
          pointRotation: refModel.points.slice(0, maxPoints).map((p) => p.windDirection),
        } as typeof datasets[0]);
      }

      // Pressure: add trend arrow concept via slight extra thickness at end
      if (panel.key === 'pressure' && confBands.length > 1) {
        const lastTwo = confBands.slice(-2);
        const trend = lastTwo[1].mean - lastTwo[0].mean;
        const trendLabel = trend > 0.5 ? ' (Rising)' : trend < -0.5 ? ' (Falling)' : ' (Steady)';
        datasets[2].label = panel.label + trendLabel;
      }

      return { labels: displayLabels, datasets };
    },
    [confidence, displayLabels, maxPoints, refModel],
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography
        variant="subtitle2"
        sx={{ color: '#94A3B8', fontFamily: 'Inter', textTransform: 'uppercase', letterSpacing: 1, mb: 0.5 }}
      >
        Multi-Parameter View
      </Typography>
      {PANELS.map((panel, panelIdx) => (
        <Box
          key={panel.key}
          sx={{
            bgcolor: '#1E293B',
            borderRadius: 1.5,
            px: 2,
            py: 1,
            position: 'relative',
          }}
        >
          {/* Panel header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography
              variant="caption"
              sx={{ color: panel.color, fontFamily: 'Inter', fontWeight: 600, fontSize: '0.7rem' }}
            >
              {panel.label}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: '#64748B', fontFamily: 'JetBrains Mono', fontSize: '0.65rem' }}
            >
              {panel.unit}
            </Typography>
          </Box>

          {/* Chart */}
          <Box sx={{ height: 100 }}>
            {panel.type === 'bar' ? (
              <Bar
                ref={(el) => {
                  chartRefs.current[panelIdx] = el as unknown as ChartJS | null;
                }}
                data={buildPanelData(panel) as ChartData<'bar'>}
                options={baseChartOptions(panel) as ChartOptions<'bar'>}
              />
            ) : (
              <Line
                ref={(el) => {
                  chartRefs.current[panelIdx] = el as unknown as ChartJS | null;
                }}
                data={buildPanelData(panel) as ChartData<'line'>}
                options={baseChartOptions(panel) as ChartOptions<'line'>}
              />
            )}
          </Box>
        </Box>
      ))}

      {/* Precipitation type legend */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 0.5 }}>
        {[
          { label: 'Rain', color: '#3B82F6' },
          { label: 'Snow', color: '#F8FAFC' },
          { label: 'Mixed', color: '#8B5CF6' },
        ].map((item) => (
          <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, bgcolor: item.color, borderRadius: 0.5 }} />
            <Typography variant="caption" sx={{ color: '#64748B', fontFamily: 'Inter', fontSize: '0.65rem' }}>
              {item.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default ParameterPanels;
