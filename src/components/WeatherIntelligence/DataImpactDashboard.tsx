import React, { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import InsightsIcon from '@mui/icons-material/Insights';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArticleIcon from '@mui/icons-material/Article';
import ForestIcon from '@mui/icons-material/Forest';
import DataUsageIcon from '@mui/icons-material/DataUsage';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { WrfCard, WrfStatCard, WrfBadge } from '../ui';
import { WrfCapabilityReadinessBadge } from '../DesignSystem';
import { colors, spacing, borderRadius } from '../ui/tokens';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Tooltip, Legend);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Citation {
  id: string;
  title: string;
  journal: string;
  year: number;
  authors: string;
  impact: 'high' | 'medium' | 'low';
  doi: string;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MONTHS = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];

const ACCURACY_BEFORE = [72.1, 73.4, 74.0, 74.8, 75.2, 76.1, 76.5, 77.0];
const ACCURACY_AFTER = [78.3, 80.1, 82.5, 84.2, 85.9, 87.3, 88.1, 89.4];

const CARBON_MONTHS = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
const CARBON_CREDITS_EARNED = [124, 156, 189, 215, 248, 272];
const CARBON_CREDITS_TRADED = [98, 120, 145, 178, 210, 235];

const UTILIZATION_DATA = {
  labels: ['Forecasting', 'Research', 'Agriculture', 'Insurance', 'Government', 'Unused'],
  values: [34, 22, 18, 12, 9, 5],
  bgColors: [
    colors.brand.primary,
    colors.success.main,
    colors.warning.main,
    '#8B5CF6',
    '#EC4899',
    colors.bg.tertiary,
  ],
};

const CITATIONS: Citation[] = [
  { id: 'C001', title: 'Decentralized Weather Networks: Improving Mesoscale Forecast Accuracy', journal: 'Nature Climate', year: 2025, authors: 'Chen, R. et al.', impact: 'high', doi: '10.1038/s41558-025-02134' },
  { id: 'C002', title: 'Blockchain-Validated IoT Sensor Data for NWP Model Assimilation', journal: 'J. Atmos. Sci.', year: 2025, authors: 'Patel, S. & Kim, H.', impact: 'high', doi: '10.1175/JAS-D-25-0142' },
  { id: 'C003', title: 'Economic Impact of Community Weather Station Networks on Crop Insurance', journal: 'Agricultural Economics', year: 2026, authors: 'Gonzalez, M. et al.', impact: 'medium', doi: '10.1111/agec.12893' },
  { id: 'C004', title: 'Tokenized Carbon Credits from Environmental Monitoring Infrastructure', journal: 'Environmental Research Letters', year: 2025, authors: 'Liu, W. & Davis, T.', impact: 'high', doi: '10.1088/1748-9326/ac9f21' },
  { id: 'C005', title: 'Quality-Weighted Data Fusion in Dense Urban Sensor Networks', journal: 'Weather & Forecasting', year: 2026, authors: 'Nakamura, Y. et al.', impact: 'medium', doi: '10.1175/WAF-D-26-0038' },
  { id: 'C006', title: 'Privacy-Preserving Geolocation for Decentralized Weather Stations', journal: 'IEEE IoT Journal', year: 2025, authors: 'Eriksson, A. & Zhou, L.', impact: 'low', doi: '10.1109/JIOT.2025.3312456' },
];

// ---------------------------------------------------------------------------
// Flow Diagram SVG
// ---------------------------------------------------------------------------

const FlowDiagram: React.FC = () => {
  const boxW = 130;
  const boxH = 48;
  const svgW = 740;
  const svgH = 100;

  const nodes = [
    { x: 20, y: 26, label: 'IoT Sensors', color: colors.success.main },
    { x: 175, y: 26, label: 'Data Validation', color: colors.brand.primary },
    { x: 330, y: 26, label: 'Blockchain', color: '#8B5CF6' },
    { x: 485, y: 26, label: 'ML Models', color: colors.warning.main },
    { x: 600, y: 26, label: 'Impact', color: colors.success.main },
  ];

  return (
    <svg width="100%" height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill={colors.text.muted} />
        </marker>
      </defs>
      {nodes.map((node, i) => (
        <g key={i}>
          <rect
            x={node.x}
            y={node.y}
            width={boxW}
            height={boxH}
            rx={8}
            fill={colors.bg.tertiary}
            stroke={node.color}
            strokeWidth={1.5}
          />
          <text
            x={node.x + boxW / 2}
            y={node.y + boxH / 2 + 5}
            textAnchor="middle"
            fill={colors.text.primary}
            fontSize={12}
            fontWeight={600}
          >
            {node.label}
          </text>
          {i < nodes.length - 1 && (
            <line
              x1={node.x + boxW + 4}
              y1={node.y + boxH / 2}
              x2={nodes[i + 1].x - 4}
              y2={nodes[i + 1].y + boxH / 2}
              stroke={colors.text.muted}
              strokeWidth={1.5}
              markerEnd="url(#arrowhead)"
            />
          )}
        </g>
      ))}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Chart Options
// ---------------------------------------------------------------------------

const commonChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: colors.text.secondary, font: { size: 11 } },
    },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      titleColor: colors.text.primary,
      bodyColor: colors.text.secondary,
      borderColor: colors.border.default,
      borderWidth: 1,
    },
  },
  scales: {
    x: {
      ticks: { color: colors.text.muted, font: { size: 11 } },
      grid: { color: 'rgba(51, 65, 85, 0.3)' },
    },
    y: {
      ticks: { color: colors.text.muted, font: { size: 11 } },
      grid: { color: 'rgba(51, 65, 85, 0.3)' },
    },
  },
};

const IMPACT_COLORS: Record<string, string> = {
  high: colors.success.main,
  medium: colors.warning.main,
  low: colors.text.muted,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const DataImpactDashboard: React.FC = () => {
  const [citationFilter, setCitationFilter] = useState<string>('all');

  const filteredCitations = useMemo(() => {
    if (citationFilter === 'all') return CITATIONS;
    return CITATIONS.filter((c) => c.impact === citationFilter);
  }, [citationFilter]);

  const accuracyData = useMemo(
    () => ({
      labels: MONTHS,
      datasets: [
        {
          label: 'Before WRFCoin Data',
          data: ACCURACY_BEFORE,
          borderColor: colors.text.muted,
          backgroundColor: 'rgba(100, 116, 139, 0.1)',
          borderDash: [6, 4],
          tension: 0.35,
          pointRadius: 3,
          fill: false,
        },
        {
          label: 'After WRFCoin Data',
          data: ACCURACY_AFTER,
          borderColor: colors.success.main,
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          tension: 0.35,
          pointRadius: 4,
          fill: true,
        },
      ],
    }),
    [],
  );

  const carbonData = useMemo(
    () => ({
      labels: CARBON_MONTHS,
      datasets: [
        {
          label: 'Credits Earned',
          data: CARBON_CREDITS_EARNED,
          backgroundColor: 'rgba(16, 185, 129, 0.7)',
          borderRadius: 4,
        },
        {
          label: 'Credits Traded',
          data: CARBON_CREDITS_TRADED,
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderRadius: 4,
        },
      ],
    }),
    [],
  );

  const donutData = useMemo(
    () => ({
      labels: UTILIZATION_DATA.labels,
      datasets: [
        {
          data: UTILIZATION_DATA.values,
          backgroundColor: UTILIZATION_DATA.bgColors,
          borderColor: colors.bg.secondary,
          borderWidth: 2,
        },
      ],
    }),
    [],
  );

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: colors.bg.primary, padding: `${spacing.lg}px` }}>
      {/* Page Header */}
      <Box sx={{ marginBottom: `${spacing.lg}px` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px`, marginBottom: `${spacing.xs}px` }}>
          <InsightsIcon sx={{ color: colors.brand.primary, fontSize: 28 }} />
          <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: colors.text.primary }}>
            Data Impact Dashboard
          </Typography>
          <WrfCapabilityReadinessBadge featureName="weatherIntelligence" compact sx={{ ml: 1 }} />
        </Box>
        <Typography sx={{ fontSize: '0.875rem', color: colors.text.secondary }}>
          Measure the real-world impact of WRFCoin weather data on forecast accuracy, research, and carbon credit generation.
        </Typography>
      </Box>

      {/* Stat Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: `${spacing.md}px`, marginBottom: `${spacing.lg}px` }}>
        <WrfStatCard
          label="Accuracy Improvement"
          value="+12.4%"
          trend={3.8}
          trendLabel="this quarter"
          icon={TrendingUpIcon}
          color={colors.success.main}
          sparklineData={[6.2, 7.1, 8.5, 9.4, 10.1, 10.8, 11.6, 12.4]}
        />
        <WrfStatCard
          label="Research Citations"
          value="42"
          trend={16.7}
          trendLabel="vs last quarter"
          icon={ArticleIcon}
          color={colors.brand.primary}
          sparklineData={[18, 22, 26, 29, 33, 36, 39, 42]}
        />
        <WrfStatCard
          label="Carbon Credits"
          value="1,204"
          trend={22.4}
          trendLabel="vs last quarter"
          icon={ForestIcon}
          color={colors.success.main}
          sparklineData={[420, 530, 680, 810, 950, 1050, 1130, 1204]}
        />
        <WrfStatCard
          label="Data Utilization"
          value="95%"
          trend={4.2}
          trendLabel="vs last month"
          icon={DataUsageIcon}
          color="#8B5CF6"
          sparklineData={[78, 82, 85, 87, 90, 91, 93, 95]}
        />
      </Box>

      {/* Flow Diagram */}
      <WrfCard title="Data Impact Flow" subtitle="End-to-end pipeline from sensor data collection to measurable real-world impact" sx={{ marginBottom: `${spacing.md}px` }}>
        <Box sx={{ overflowX: 'auto', py: 1 }}>
          <FlowDiagram />
        </Box>
      </WrfCard>

      {/* Charts Row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: `${spacing.md}px`, marginBottom: `${spacing.md}px` }}>
        {/* Accuracy Before/After */}
        <WrfCard title="Forecast Accuracy: Before vs After" subtitle="NWP model skill scores with and without WRFCoin station data">
          <Box sx={{ height: 320 }}>
            <Line
              data={accuracyData}
              options={{
                ...commonChartOptions,
                scales: {
                  ...commonChartOptions.scales,
                  y: {
                    ...commonChartOptions.scales.y,
                    min: 65,
                    max: 95,
                    title: { display: true, text: 'Accuracy %', color: colors.text.muted },
                  },
                },
              }}
            />
          </Box>
        </WrfCard>

        {/* Carbon Credits */}
        <WrfCard title="Carbon Credit Generation" subtitle="Monthly credits earned through verified environmental monitoring">
          <Box sx={{ height: 320 }}>
            <Bar
              data={carbonData}
              options={{
                ...commonChartOptions,
                scales: {
                  ...commonChartOptions.scales,
                  y: {
                    ...commonChartOptions.scales.y,
                    title: { display: true, text: 'Credits', color: colors.text.muted },
                  },
                },
              }}
            />
          </Box>
        </WrfCard>
      </Box>

      {/* Bottom Row: Donut + Citations */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '360px 1fr' }, gap: `${spacing.md}px` }}>
        {/* Donut Utilization */}
        <WrfCard title="Data Utilization Breakdown" subtitle="How WRFCoin data is consumed across sectors">
          <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Doughnut
              data={donutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                  legend: {
                    position: 'bottom' as const,
                    labels: { color: colors.text.secondary, font: { size: 11 }, padding: 12, usePointStyle: true, pointStyleWidth: 8 },
                  },
                  tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: colors.text.primary,
                    bodyColor: colors.text.secondary,
                    borderColor: colors.border.default,
                    borderWidth: 1,
                    callbacks: {
                      label: (ctx: any) => ` ${ctx.label}: ${ctx.parsed}%`,
                    },
                  },
                },
              }}
            />
          </Box>
        </WrfCard>

        {/* Research Citations */}
        <WrfCard
          title="Research Citations"
          subtitle="Peer-reviewed publications using WRFCoin weather data"
          action={<WrfBadge status="online" label={`${CITATIONS.length} papers`} size="sm" />}
        >
          <Box sx={{ display: 'flex', gap: `${spacing.xs}px`, mb: 2, flexWrap: 'wrap' }}>
            {['all', 'high', 'medium', 'low'].map((f) => (
              <Chip
                key={f}
                label={f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1) + ' Impact'}
                size="small"
                onClick={() => setCitationFilter(f)}
                sx={{
                  backgroundColor: citationFilter === f ? colors.brand.primary : colors.bg.tertiary,
                  color: citationFilter === f ? '#fff' : colors.text.secondary,
                  fontWeight: 500,
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: citationFilter === f ? colors.brand.hover : colors.border.default },
                }}
              />
            ))}
          </Box>

          <List disablePadding sx={{ maxHeight: 300, overflowY: 'auto' }}>
            {filteredCitations.map((cite) => (
              <ListItem
                key={cite.id}
                sx={{
                  px: 0,
                  py: 1,
                  borderBottom: `1px solid ${colors.border.default}`,
                  '&:last-child': { borderBottom: 'none' },
                  alignItems: 'flex-start',
                }}
              >
                <ListItemIcon sx={{ minWidth: 32, mt: 0.5 }}>
                  <ArticleIcon sx={{ color: IMPACT_COLORS[cite.impact], fontSize: 18 }} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: colors.text.primary, lineHeight: 1.4 }}>
                      {cite.title}
                    </Typography>
                  }
                  secondary={
                    <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography component="span" sx={{ fontSize: '0.75rem', color: colors.text.muted }}>
                        {cite.authors} &middot; {cite.journal} ({cite.year})
                      </Typography>
                      <Chip
                        label={cite.impact}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '0.625rem',
                          fontWeight: 600,
                          backgroundColor: `${IMPACT_COLORS[cite.impact]}18`,
                          color: IMPACT_COLORS[cite.impact],
                        }}
                      />
                      <OpenInNewIcon sx={{ fontSize: 12, color: colors.text.muted, cursor: 'pointer', '&:hover': { color: colors.brand.primary } }} />
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </WrfCard>
      </Box>
    </Box>
  );
};

export default DataImpactDashboard;
