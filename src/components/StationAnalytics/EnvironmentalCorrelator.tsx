// EnvironmentalCorrelator - Scatter plots with trend lines, R-value, outlier highlighting
import React, { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip as ChartTooltip,
  Legend,
  CategoryScale,
  ChartOptions,
  ChartData,
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';
import WrfCard from '../ui/WrfCard';
import WrfBadge from '../ui/WrfBadge';
import { colors, spacing, borderRadius } from '../ui/tokens';

ChartJS.register(LinearScale, PointElement, LineElement, ChartTooltip, Legend, CategoryScale);

// ---------- Types ----------

type CorrelationTab = 'temperature' | 'humidity' | 'wind' | 'pressure';

interface DataPoint {
  x: number;
  y: number;
  isOutlier?: boolean;
}

interface CorrelationConfig {
  key: CorrelationTab;
  label: string;
  xLabel: string;
  xUnit: string;
  yLabel: string;
  yUnit: string;
  color: string;
  outlierColor: string;
}

interface InsightItem {
  title: string;
  description: string;
  severity: 'online' | 'degraded' | 'offline';
}

// ---------- Constants ----------

const TABS: CorrelationConfig[] = [
  { key: 'temperature', label: 'Quality vs Temperature', xLabel: 'Temperature', xUnit: '\u00B0F', yLabel: 'Quality Score', yUnit: '%', color: colors.error.main, outlierColor: colors.warning.main },
  { key: 'humidity', label: 'Quality vs Humidity', xLabel: 'Humidity', xUnit: '%', yLabel: 'Quality Score', yUnit: '%', color: colors.brand.primary, outlierColor: colors.warning.main },
  { key: 'wind', label: 'Quality vs Wind Speed', xLabel: 'Wind Speed', xUnit: 'mph', yLabel: 'Quality Score', yUnit: '%', color: colors.success.main, outlierColor: colors.warning.main },
  { key: 'pressure', label: 'Quality vs Pressure', xLabel: 'Pressure', xUnit: 'hPa', yLabel: 'Quality Score', yUnit: '%', color: '#8B5CF6', outlierColor: colors.warning.main },
];

// ---------- Mock Data Generator ----------

const generateCorrelationData = (tab: CorrelationTab): { points: DataPoint[]; rValue: number; slope: number; intercept: number; insights: InsightItem[] } => {
  const configs: Record<CorrelationTab, { xMin: number; xMax: number; yBase: number; slope: number; noise: number; rTarget: number }> = {
    temperature: { xMin: 20, xMax: 95, yBase: 95, slope: -0.04, noise: 3, rTarget: -0.72 },
    humidity: { xMin: 15, xMax: 90, yBase: 93, slope: -0.03, noise: 4, rTarget: -0.58 },
    wind: { xMin: 0, xMax: 35, yBase: 96, slope: -0.15, noise: 3.5, rTarget: -0.65 },
    pressure: { xMin: 1000, xMax: 1030, yBase: 80, slope: 0.5, noise: 2.5, rTarget: 0.41 },
  };

  const cfg = configs[tab];
  const n = 120;
  const points: DataPoint[] = [];

  for (let i = 0; i < n; i++) {
    const seed = (i * 7 + tab.charCodeAt(0)) % 97;
    const rand = (seed / 97 - 0.5) * 2;
    const x = cfg.xMin + (i / n) * (cfg.xMax - cfg.xMin) + rand * ((cfg.xMax - cfg.xMin) * 0.05);
    const yExpected = cfg.yBase + cfg.slope * (x - cfg.xMin);
    const noise = ((seed * 13 + i * 3) % 41) / 41 * 2 - 1;
    let y = yExpected + noise * cfg.noise;
    y = Math.max(70, Math.min(100, y));

    // Mark outliers: points far from trend
    const residual = Math.abs(y - yExpected);
    const isOutlier = residual > cfg.noise * 2;

    points.push({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, isOutlier });
  }

  // Linear regression
  const xMean = points.reduce((s, p) => s + p.x, 0) / n;
  const yMean = points.reduce((s, p) => s + p.y, 0) / n;
  let ssXY = 0, ssXX = 0, ssYY = 0;
  for (const p of points) {
    ssXY += (p.x - xMean) * (p.y - yMean);
    ssXX += (p.x - xMean) ** 2;
    ssYY += (p.y - yMean) ** 2;
  }
  const slope = ssXX === 0 ? 0 : ssXY / ssXX;
  const intercept = yMean - slope * xMean;
  const rValue = ssXX === 0 || ssYY === 0 ? 0 : Math.round((ssXY / Math.sqrt(ssXX * ssYY)) * 100) / 100;

  const outlierCount = points.filter((p) => p.isOutlier).length;

  const insightsMap: Record<CorrelationTab, InsightItem[]> = {
    temperature: [
      { title: 'Moderate negative correlation', description: `Quality decreases by ${Math.abs(Math.round(slope * 10) / 10)} points per 10${'\u00B0'}F increase. Extreme heat events reduce sensor accuracy.`, severity: 'degraded' },
      { title: `${outlierCount} outlier readings detected`, description: 'Readings deviating significantly from the trend line may indicate sensor drift or local microclimate effects.', severity: 'offline' },
      { title: 'Optimal range: 35-65\u00B0F', description: 'Quality scores are highest within this temperature band, suggesting ideal operating conditions.', severity: 'online' },
    ],
    humidity: [
      { title: 'Weak negative correlation', description: `High humidity slightly reduces quality. R=${rValue} indicates moderate variability.`, severity: 'degraded' },
      { title: 'Condensation risk above 80%', description: 'Sensors exposed to humidity above 80% show greater quality variance. Consider protective housing.', severity: 'offline' },
      { title: `${outlierCount} anomalous readings`, description: 'Outliers clustered in high-humidity range suggest occasional sensor saturation.', severity: 'degraded' },
    ],
    wind: [
      { title: 'Notable negative correlation', description: `Strong winds above 20 mph correlate with lower quality, likely due to sensor vibration.`, severity: 'degraded' },
      { title: 'Calm conditions yield best data', description: 'Wind speeds below 5 mph consistently produce quality scores above 95%.', severity: 'online' },
      { title: `${outlierCount} outliers in high-wind events`, description: 'Storm events cause the largest quality deviations. Consider wind baffles.', severity: 'offline' },
    ],
    pressure: [
      { title: 'Weak positive correlation', description: `Higher pressure slightly improves quality. R=${rValue} suggests other factors dominate.`, severity: 'online' },
      { title: 'Low pressure events', description: 'Readings during storm fronts (< 1008 hPa) show increased variance.', severity: 'degraded' },
      { title: `${outlierCount} flagged measurements`, description: 'Outliers are evenly distributed, indicating no systematic pressure-related bias.', severity: 'online' },
    ],
  };

  return { points, rValue, slope, intercept, insights: insightsMap[tab] };
};

// ---------- Main Component ----------

const EnvironmentalCorrelator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CorrelationTab>('temperature');

  const tabConfig = useMemo(() => TABS.find((t) => t.key === activeTab)!, [activeTab]);
  const { points, rValue, slope, intercept, insights } = useMemo(() => generateCorrelationData(activeTab), [activeTab]);

  // Chart data
  const chartData: ChartData<'scatter'> = useMemo(() => {
    const normal = points.filter((p) => !p.isOutlier);
    const outliers = points.filter((p) => p.isOutlier);
    const xVals = points.map((p) => p.x);
    const xMin = Math.min(...xVals);
    const xMax = Math.max(...xVals);

    return {
      datasets: [
        {
          label: 'Data Points',
          data: normal,
          backgroundColor: `${tabConfig.color}88`,
          borderColor: tabConfig.color,
          borderWidth: 1,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'Outliers',
          data: outliers,
          backgroundColor: `${tabConfig.outlierColor}AA`,
          borderColor: tabConfig.outlierColor,
          borderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointStyle: 'triangle' as const,
        },
        {
          label: 'Trend Line',
          data: [
            { x: xMin, y: slope * xMin + intercept },
            { x: xMax, y: slope * xMax + intercept },
          ],
          type: 'scatter' as const,
          showLine: true,
          backgroundColor: 'transparent',
          borderColor: colors.text.muted,
          borderWidth: 2,
          borderDash: [6, 3],
          pointRadius: 0,
        },
      ],
    };
  }, [points, tabConfig, slope, intercept]);

  const chartOptions: ChartOptions<'scatter'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
          labels: { color: colors.text.secondary, font: { size: 11 }, usePointStyle: true, padding: 16 },
        },
        tooltip: {
          backgroundColor: colors.bg.tertiary,
          titleColor: colors.text.primary,
          bodyColor: colors.text.secondary,
          borderColor: colors.border.default,
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: (ctx) => {
              const p = ctx.raw as DataPoint;
              return `${tabConfig.xLabel}: ${p.x}${tabConfig.xUnit}, Quality: ${p.y}${tabConfig.yUnit}`;
            },
          },
        },
      },
      scales: {
        x: {
          title: { display: true, text: `${tabConfig.xLabel} (${tabConfig.xUnit})`, color: colors.text.secondary, font: { size: 12 } },
          ticks: { color: colors.text.muted, font: { size: 10 } },
          grid: { color: `${colors.border.default}33` },
        },
        y: {
          title: { display: true, text: `${tabConfig.yLabel} (${tabConfig.yUnit})`, color: colors.text.secondary, font: { size: 12 } },
          ticks: { color: colors.text.muted, font: { size: 10 } },
          grid: { color: `${colors.border.default}33` },
          min: 70,
          max: 100,
        },
      },
    }),
    [tabConfig],
  );

  // R-value color
  const absR = Math.abs(rValue);
  const rColor = absR >= 0.7 ? colors.success.main : absR >= 0.4 ? colors.warning.main : colors.error.main;
  const rStrength = absR >= 0.7 ? 'Strong' : absR >= 0.4 ? 'Moderate' : 'Weak';

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: colors.bg.primary, padding: `${spacing.xl}px` }}>
      <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text.primary, marginBottom: `${spacing.lg}px` }}>
        Environmental Correlations
      </Typography>

      {/* Tab Selector */}
      <Box sx={{ display: 'flex', gap: '4px', backgroundColor: colors.bg.secondary, borderRadius: `${borderRadius.md}px`, padding: '3px', marginBottom: `${spacing.lg}px`, overflowX: 'auto' }}>
        {TABS.map((tab) => (
          <Box
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            sx={{
              padding: '8px 16px',
              borderRadius: `${borderRadius.sm}px`,
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              color: activeTab === tab.key ? colors.text.primary : colors.text.muted,
              backgroundColor: activeTab === tab.key ? colors.bg.tertiary : 'transparent',
              '&:hover': {
                color: colors.text.primary,
              },
            }}
          >
            {tab.label}
          </Box>
        ))}
      </Box>

      <Grid container spacing={3}>
        {/* Scatter Chart */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <WrfCard
            title={tabConfig.label}
            subtitle={`${points.length} data points | ${points.filter((p) => p.isOutlier).length} outliers detected`}
            action={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px` }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: `${rColor}15`,
                    borderRadius: `${borderRadius.md}px`,
                    padding: '4px 12px',
                  }}
                >
                  <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted }}>R =</Typography>
                  <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: rColor }}>
                    {rValue > 0 ? '+' : ''}{rValue}
                  </Typography>
                  <Typography sx={{ fontSize: '0.65rem', color: rColor, fontWeight: 500 }}>
                    ({rStrength})
                  </Typography>
                </Box>
              </Box>
            }
          >
            <Box sx={{ height: 420, position: 'relative' }}>
              <Scatter data={chartData} options={chartOptions} />
            </Box>
          </WrfCard>
        </Grid>

        {/* Insights Panel */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <WrfCard title="Insights" subtitle="AI-generated analysis of correlation patterns">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${spacing.md}px` }}>
              {insights.map((insight, idx) => (
                <Box
                  key={idx}
                  sx={{
                    padding: `${spacing.sm + 2}px ${spacing.md}px`,
                    borderRadius: `${borderRadius.md}px`,
                    backgroundColor: colors.bg.primary,
                    border: `1px solid ${colors.border.default}`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px`, marginBottom: '6px' }}>
                    <WrfBadge status={insight.severity} size="sm" />
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: colors.text.primary }}>
                      {insight.title}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: '0.75rem', color: colors.text.secondary, lineHeight: 1.6 }}>
                    {insight.description}
                  </Typography>
                </Box>
              ))}
            </Box>
          </WrfCard>

          {/* Regression Stats */}
          <WrfCard title="Regression Statistics" sx={{ marginTop: `${spacing.md}px` }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${spacing.sm}px` }}>
              {[
                { label: 'Pearson R', value: rValue.toString() },
                { label: 'R-squared', value: (rValue ** 2).toFixed(4) },
                { label: 'Slope', value: slope.toFixed(4) },
                { label: 'Intercept', value: intercept.toFixed(2) },
                { label: 'Sample Size', value: points.length.toString() },
                { label: 'Outliers', value: points.filter((p) => p.isOutlier).length.toString() },
              ].map((stat) => (
                <Box key={stat.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted }}>{stat.label}</Typography>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: colors.text.primary, fontFamily: 'monospace' }}>
                    {stat.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </WrfCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EnvironmentalCorrelator;
