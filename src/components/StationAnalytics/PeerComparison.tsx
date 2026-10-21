// PeerComparison - Station selector, comparison table, radar chart, time series overlay
import React, { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip as ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  ChartOptions,
} from 'chart.js';
import { Radar, Line } from 'react-chartjs-2';
import WrfCard from '../ui/WrfCard';
import WrfBadge from '../ui/WrfBadge';
import WrfDataTable from '../ui/WrfDataTable';
import { colors, spacing, borderRadius } from '../ui/tokens';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, ChartTooltip, Legend, CategoryScale, LinearScale);

// ---------- Types ----------

interface PeerStation {
  id: string;
  name: string;
  location: string;
  distance: number; // km
  quality: number;
  uptime: number;
  consistency: number;
  coverage: number;
  timeliness: number;
  accuracy: number;
  totalReadings: number;
  rank: number;
  status: 'online' | 'offline' | 'degraded';
  monthlyQuality: number[];
}

interface InsightCard {
  title: string;
  description: string;
  type: 'positive' | 'neutral' | 'negative';
}

// ---------- Mock Data ----------

const MY_STATION: PeerStation = {
  id: 'WRF-A7-0042',
  name: 'Station Alpha-7',
  location: 'Denver, CO',
  distance: 0,
  quality: 94.2,
  uptime: 97.8,
  consistency: 91.5,
  coverage: 88.3,
  timeliness: 96.1,
  accuracy: 92.4,
  totalReadings: 105120,
  rank: 370,
  status: 'online',
  monthlyQuality: [89, 90, 91, 92, 91, 93, 94, 93, 95, 94, 93, 94],
};

const PEER_STATIONS: PeerStation[] = [
  {
    id: 'WRF-B3-0118',
    name: 'Station Bravo-3',
    location: 'Boulder, CO',
    distance: 42,
    quality: 91.8,
    uptime: 95.2,
    consistency: 89.1,
    coverage: 86.7,
    timeliness: 93.4,
    accuracy: 90.6,
    totalReadings: 98400,
    rank: 512,
    status: 'online',
    monthlyQuality: [87, 88, 89, 90, 91, 90, 92, 91, 93, 92, 91, 91],
  },
  {
    id: 'WRF-C1-0295',
    name: 'Station Charlie-1',
    location: 'Colorado Springs, CO',
    distance: 112,
    quality: 96.1,
    uptime: 99.1,
    consistency: 95.4,
    coverage: 92.1,
    timeliness: 97.8,
    accuracy: 95.3,
    totalReadings: 112800,
    rank: 128,
    status: 'online',
    monthlyQuality: [93, 94, 95, 95, 96, 95, 96, 97, 96, 97, 96, 96],
  },
  {
    id: 'WRF-D5-0067',
    name: 'Station Delta-5',
    location: 'Fort Collins, CO',
    distance: 105,
    quality: 88.4,
    uptime: 92.6,
    consistency: 84.2,
    coverage: 82.5,
    timeliness: 89.1,
    accuracy: 86.8,
    totalReadings: 87600,
    rank: 892,
    status: 'degraded',
    monthlyQuality: [84, 85, 86, 87, 88, 87, 89, 88, 90, 89, 88, 88],
  },
  {
    id: 'WRF-E2-0413',
    name: 'Station Echo-2',
    location: 'Pueblo, CO',
    distance: 167,
    quality: 90.5,
    uptime: 94.3,
    consistency: 87.6,
    coverage: 85.1,
    timeliness: 91.8,
    accuracy: 89.2,
    totalReadings: 92400,
    rank: 634,
    status: 'online',
    monthlyQuality: [86, 87, 88, 89, 90, 89, 91, 90, 92, 91, 90, 90],
  },
  {
    id: 'WRF-F8-0201',
    name: 'Station Foxtrot-8',
    location: 'Vail, CO',
    distance: 153,
    quality: 85.2,
    uptime: 88.9,
    consistency: 80.3,
    coverage: 78.6,
    timeliness: 86.4,
    accuracy: 83.7,
    totalReadings: 76800,
    rank: 1205,
    status: 'offline',
    monthlyQuality: [80, 81, 82, 83, 84, 83, 85, 84, 86, 85, 85, 85],
  },
];

const REGIONAL_AVG: Omit<PeerStation, 'id' | 'name' | 'location' | 'distance' | 'totalReadings' | 'rank' | 'status' | 'monthlyQuality'> = {
  quality: 82.1,
  uptime: 88.4,
  consistency: 76.3,
  coverage: 79.6,
  timeliness: 84.7,
  accuracy: 81.9,
};

const MONTHS = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
const RADAR_LABELS = ['Quality', 'Uptime', 'Consistency', 'Coverage', 'Timeliness', 'Accuracy'];
const CHART_COLORS = [colors.brand.primary, '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

// ---------- Main Component ----------

const PeerComparison: React.FC = () => {
  const [selectedPeers, setSelectedPeers] = useState<string[]>([PEER_STATIONS[0].id, PEER_STATIONS[1].id]);

  const allStations = useMemo(() => [MY_STATION, ...PEER_STATIONS], []);
  const activeComparison = useMemo(
    () => [MY_STATION, ...PEER_STATIONS.filter((s) => selectedPeers.includes(s.id))],
    [selectedPeers],
  );

  // Radar chart data
  const radarData = useMemo(() => {
    const getMetrics = (s: PeerStation) => [s.quality, s.uptime, s.consistency, s.coverage, s.timeliness, s.accuracy];
    const datasets = activeComparison.map((station, idx) => ({
      label: station.name,
      data: getMetrics(station),
      backgroundColor: `${CHART_COLORS[idx % CHART_COLORS.length]}20`,
      borderColor: CHART_COLORS[idx % CHART_COLORS.length],
      borderWidth: 2,
      pointRadius: 4,
      pointBackgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
      pointBorderColor: colors.bg.secondary,
      pointBorderWidth: 2,
    }));

    // Add regional average
    datasets.push({
      label: 'Regional Avg',
      data: [REGIONAL_AVG.quality, REGIONAL_AVG.uptime, REGIONAL_AVG.consistency, REGIONAL_AVG.coverage, REGIONAL_AVG.timeliness, REGIONAL_AVG.accuracy],
      backgroundColor: `${colors.text.muted}10`,
      borderColor: colors.text.muted,
      borderWidth: 1,
      pointRadius: 3,
      pointBackgroundColor: colors.text.muted,
      pointBorderColor: colors.bg.secondary,
      pointBorderWidth: 1,
    });

    return { labels: RADAR_LABELS, datasets };
  }, [activeComparison]);

  const radarOptions: ChartOptions<'radar'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: { color: colors.text.secondary, font: { size: 11 }, usePointStyle: true, padding: 12 },
        },
        tooltip: {
          backgroundColor: colors.bg.tertiary,
          titleColor: colors.text.primary,
          bodyColor: colors.text.secondary,
          borderColor: colors.border.default,
          borderWidth: 1,
        },
      },
      scales: {
        r: {
          min: 60,
          max: 100,
          ticks: { display: false, stepSize: 10 },
          pointLabels: { color: colors.text.secondary, font: { size: 11 } },
          grid: { color: `${colors.border.default}33` },
          angleLines: { color: `${colors.border.default}33` },
        },
      },
    }),
    [],
  );

  // Time series overlay
  const timeSeriesData = useMemo(() => ({
    labels: MONTHS,
    datasets: activeComparison.map((station, idx) => ({
      label: station.name,
      data: station.monthlyQuality,
      borderColor: CHART_COLORS[idx % CHART_COLORS.length],
      backgroundColor: 'transparent',
      borderWidth: 2,
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 5,
      pointBackgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
      pointBorderColor: colors.bg.secondary,
      pointBorderWidth: 2,
    })),
  }), [activeComparison]);

  const lineOptions: ChartOptions<'line'> = useMemo(
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
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}%`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: colors.text.muted, font: { size: 10 } },
          grid: { color: `${colors.border.default}22` },
        },
        y: {
          min: 75,
          max: 100,
          ticks: {
            color: colors.text.muted,
            font: { size: 10 },
            callback: (value) => `${value}%`,
          },
          grid: { color: `${colors.border.default}22` },
        },
      },
    }),
    [],
  );

  // Comparison table columns
  const tableColumns = useMemo(
    () => [
      {
        key: 'name',
        label: 'Station',
        sortable: true,
        render: (val: string, row: Record<string, unknown>) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: (row as unknown as PeerStation).id === MY_STATION.id ? colors.brand.primary : colors.text.primary }}>
              {val}
            </Typography>
            {(row as unknown as PeerStation).id === MY_STATION.id && (
              <WrfBadge status="online" label="You" size="sm" />
            )}
          </Box>
        ),
      },
      { key: 'location', label: 'Location', sortable: true },
      { key: 'distance', label: 'Dist (km)', sortable: true },
      {
        key: 'quality',
        label: 'Quality',
        sortable: true,
        render: (val: number) => (
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: val >= 90 ? colors.success.main : val >= 80 ? colors.warning.main : colors.error.main }}>
            {val}%
          </Typography>
        ),
      },
      {
        key: 'uptime',
        label: 'Uptime',
        sortable: true,
        render: (val: number) => (
          <Typography sx={{ fontSize: '0.8rem', color: colors.text.primary }}>{val}%</Typography>
        ),
      },
      { key: 'rank', label: 'Rank', sortable: true },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        render: (val: string) => <WrfBadge status={val as 'online' | 'offline' | 'degraded'} size="sm" />,
      },
    ],
    [],
  );

  const tableData = useMemo(() => allStations.map((s) => ({ ...s })), [allStations]);

  // Insight cards
  const insights: InsightCard[] = useMemo(() => {
    const bestPeer = PEER_STATIONS.reduce((a, b) => (a.quality > b.quality ? a : b));
    const worstPeer = PEER_STATIONS.reduce((a, b) => (a.quality < b.quality ? a : b));
    const aboveAvgMetrics = RADAR_LABELS.filter((_, i) => {
      const myVal = [MY_STATION.quality, MY_STATION.uptime, MY_STATION.consistency, MY_STATION.coverage, MY_STATION.timeliness, MY_STATION.accuracy][i];
      const avgVal = [REGIONAL_AVG.quality, REGIONAL_AVG.uptime, REGIONAL_AVG.consistency, REGIONAL_AVG.coverage, REGIONAL_AVG.timeliness, REGIONAL_AVG.accuracy][i];
      return myVal > avgVal;
    });

    return [
      {
        title: `Outperforming ${aboveAvgMetrics.length}/6 metrics`,
        description: `Your station exceeds the regional average in ${aboveAvgMetrics.join(', ')}. Strong performance across the board.`,
        type: 'positive' as const,
      },
      {
        title: `${bestPeer.name} leads the region`,
        description: `With a ${bestPeer.quality}% quality score, ${bestPeer.name} in ${bestPeer.location} is the top-performing peer station.`,
        type: 'neutral' as const,
      },
      {
        title: `${worstPeer.name} may need attention`,
        description: `${worstPeer.name} shows a ${worstPeer.quality}% quality score and ${worstPeer.status} status. Consider offering calibration support.`,
        type: 'negative' as const,
      },
    ];
  }, []);

  const insightColors: Record<string, string> = {
    positive: colors.success.main,
    neutral: colors.brand.primary,
    negative: colors.warning.main,
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: colors.bg.primary, padding: `${spacing.xl}px` }}>
      <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text.primary, marginBottom: `${spacing.lg}px` }}>
        Peer Comparison
      </Typography>

      {/* Station Selector */}
      <WrfCard title="Select Peer Stations" subtitle="Choose stations to compare against your own" sx={{ marginBottom: `${spacing.lg}px` }}>
        <FormControl fullWidth size="small">
          <InputLabel
            sx={{
              color: colors.text.muted,
              '&.Mui-focused': { color: colors.brand.primary },
            }}
          >
            Compare with
          </InputLabel>
          <Select
            multiple
            value={selectedPeers}
            onChange={(e) => setSelectedPeers(e.target.value as string[])}
            label="Compare with"
            sx={{
              color: colors.text.primary,
              backgroundColor: colors.bg.primary,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border.default },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.border.light },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.brand.primary },
              '& .MuiSvgIcon-root': { color: colors.text.muted },
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  backgroundColor: colors.bg.secondary,
                  border: `1px solid ${colors.border.default}`,
                  '& .MuiMenuItem-root': {
                    color: colors.text.primary,
                    '&:hover': { backgroundColor: colors.bg.tertiary },
                    '&.Mui-selected': { backgroundColor: `${colors.brand.primary}20` },
                  },
                },
              },
            }}
            renderValue={(selected) =>
              (selected as string[])
                .map((id) => PEER_STATIONS.find((s) => s.id === id)?.name || id)
                .join(', ')
            }
          >
            {PEER_STATIONS.map((station) => (
              <MenuItem key={station.id} value={station.id}>
                {station.name} -- {station.location} ({station.distance} km)
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </WrfCard>

      <Grid container spacing={3}>
        {/* Radar Chart */}
        <Grid size={{ xs: 12, md: 6 }}>
          <WrfCard title="Performance Radar" subtitle="Multi-metric comparison with regional baseline">
            <Box sx={{ height: 380 }}>
              <Radar data={radarData} options={radarOptions} />
            </Box>
          </WrfCard>
        </Grid>

        {/* Insight Cards */}
        <Grid size={{ xs: 12, md: 6 }}>
          <WrfCard title="Comparative Insights" subtitle="Key findings from peer analysis">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${spacing.md}px` }}>
              {insights.map((insight, idx) => (
                <Box
                  key={idx}
                  sx={{
                    padding: `${spacing.md}px`,
                    borderRadius: `${borderRadius.md}px`,
                    backgroundColor: colors.bg.primary,
                    borderLeft: `3px solid ${insightColors[insight.type]}`,
                  }}
                >
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: colors.text.primary, marginBottom: '4px' }}>
                    {insight.title}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: colors.text.secondary, lineHeight: 1.6 }}>
                    {insight.description}
                  </Typography>
                </Box>
              ))}
            </Box>
          </WrfCard>
        </Grid>

        {/* Time Series Overlay */}
        <Grid size={{ xs: 12 }}>
          <WrfCard title="Quality Score Trend" subtitle="Monthly quality comparison over the past year">
            <Box sx={{ height: 300 }}>
              <Line data={timeSeriesData} options={lineOptions} />
            </Box>
          </WrfCard>
        </Grid>

        {/* Comparison Table */}
        <Grid size={{ xs: 12 }}>
          <WrfCard title="Station Comparison Table" subtitle="All peer stations with sortable metrics">
            <WrfDataTable
              columns={tableColumns}
              data={tableData}
              searchable
              exportable
              pagination={false}
            />
          </WrfCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PeerComparison;
