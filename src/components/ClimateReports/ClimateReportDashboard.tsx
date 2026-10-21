import DemoSurfaceGate from '../common/DemoSurfaceGate';
import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  InputAdornment,
  Chip,
  Switch,
  FormControlLabel,
  SelectChangeEvent,
} from '@mui/material';
import {
  Search,
  Public,
  Sensors,
  Thermostat,
  TrendingUp,
  FlashOn,
  FileDownload,
} from '@mui/icons-material';
// Note: @types/leaflet and @types/geojson are not installed as project dependencies.
// react-leaflet types reference leaflet's MapOptions which resolve to {} without them.
// Using type-safe wrappers to avoid TS errors while keeping runtime behavior correct.
import {
  MapContainer as RawMapContainer,
  TileLayer as RawTileLayer,
  GeoJSON as RawGeoJSON,
} from 'react-leaflet';
import { MAP_TILE_URL, MAP_TILE_ATTRIBUTION } from '../../config/mapTiles';
import 'leaflet/dist/leaflet.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MapContainer = RawMapContainer as React.ComponentType<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TileLayer = RawTileLayer as React.ComponentType<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LeafletGeoJSON = RawGeoJSON as React.ComponentType<any>;

import SeasonalSummary from './SeasonalSummary';
import TrendAnalysis from './TrendAnalysis';
import ExtremeEvents from './ExtremeEvents';
import ReportExporter from './ReportExporter';
import { apiClient } from '../../services/apiClient';

// --- Types ---

export interface Region {
  id: string;
  name: string;
  type: 'country' | 'state' | 'custom';
  stationCount: number;
  center: [number, number];
  bbox: [[number, number], [number, number]];
}

export interface SeasonData {
  season: 'Spring' | 'Summer' | 'Autumn' | 'Winter';
  avgTemp: number;
  tempNormal: number;
  totalPrecip: number;
  precipNormal: number;
  hottestDay: { date: string; value: number };
  coldestNight: { date: string; value: number };
  heaviestRainfall: { date: string; value: number };
  stationCount: number;
  percentile: number;
}

export interface AnnualRecord {
  year: number;
  avgTemp: number;
  totalPrecip: number;
  frostFreeDays: number;
  daysAbove35: number;
  daysBelow10: number;
  daysHeavyPrecip: number;
  daysHighWind: number;
  heatingDegreeDays: number;
  coolingDegreeDays: number;
  spiIndex: number;
}

// --- Mock Data ---

const REGIONS: Region[] = [
  { id: 'us-northeast', name: 'US Northeast', type: 'state', stationCount: 147, center: [42.0, -73.5], bbox: [[39.0, -80.0], [47.5, -66.9]] },
  { id: 'us-southeast', name: 'US Southeast', type: 'state', stationCount: 203, center: [33.0, -84.0], bbox: [[24.5, -91.6], [39.0, -75.5]] },
  { id: 'us-midwest', name: 'US Midwest', type: 'state', stationCount: 189, center: [41.5, -89.0], bbox: [[36.0, -104.0], [49.4, -80.5]] },
  { id: 'us-west', name: 'US West', type: 'state', stationCount: 134, center: [39.0, -119.0], bbox: [[32.5, -124.8], [49.0, -104.0]] },
  { id: 'uk', name: 'United Kingdom', type: 'country', stationCount: 98, center: [54.0, -2.0], bbox: [[49.9, -8.2], [60.9, 1.8]] },
  { id: 'germany', name: 'Germany', type: 'country', stationCount: 112, center: [51.2, 10.4], bbox: [[47.3, 5.9], [55.1, 15.0]] },
];

function generateAnnualData(): AnnualRecord[] {
  const records: AnnualRecord[] = [];
  const baseTemp = 9.2;
  const basePrecip = 1120;
  const baseFrostFree = 170;

  for (let year = 1994; year <= 2024; year++) {
    const idx = year - 1994;
    const warmingTrend = idx * 0.035;
    const noise = (Math.sin(year * 3.7) * 0.4) + (Math.cos(year * 1.3) * 0.3);
    const precipNoise = Math.sin(year * 2.1) * 80 + Math.cos(year * 4.7) * 50;

    records.push({
      year,
      avgTemp: parseFloat((baseTemp + warmingTrend + noise).toFixed(1)),
      totalPrecip: Math.round(basePrecip + idx * 3.5 + precipNoise),
      frostFreeDays: Math.round(baseFrostFree + idx * 0.8 + Math.sin(year * 2.3) * 8),
      daysAbove35: Math.max(0, Math.round(2 + idx * 0.25 + Math.sin(year * 5.1) * 3)),
      daysBelow10: Math.max(0, Math.round(18 - idx * 0.3 + Math.cos(year * 3.2) * 5)),
      daysHeavyPrecip: Math.max(0, Math.round(8 + idx * 0.15 + Math.sin(year * 4.3) * 3)),
      daysHighWind: Math.max(0, Math.round(5 + Math.sin(year * 6.1) * 3)),
      heatingDegreeDays: Math.round(4800 - idx * 25 + Math.cos(year * 2.9) * 150),
      coolingDegreeDays: Math.round(650 + idx * 12 + Math.sin(year * 3.1) * 80),
      spiIndex: parseFloat((-0.2 + Math.sin(year * 1.7) * 1.2 + Math.cos(year * 3.9) * 0.5).toFixed(2)),
    });
  }
  return records;
}

function generateSeasonData(): SeasonData[] {
  return [
    {
      season: 'Spring',
      avgTemp: 11.3,
      tempNormal: 10.5,
      totalPrecip: 278,
      precipNormal: 265,
      hottestDay: { date: 'May 28', value: 33.2 },
      coldestNight: { date: 'Mar 4', value: -6.1 },
      heaviestRainfall: { date: 'Apr 15', value: 62.4 },
      stationCount: 142,
      percentile: 72,
    },
    {
      season: 'Summer',
      avgTemp: 23.8,
      tempNormal: 22.4,
      totalPrecip: 312,
      precipNormal: 295,
      hottestDay: { date: 'Jul 22', value: 39.1 },
      coldestNight: { date: 'Jun 3', value: 8.4 },
      heaviestRainfall: { date: 'Aug 9', value: 88.7 },
      stationCount: 147,
      percentile: 89,
    },
    {
      season: 'Autumn',
      avgTemp: 12.1,
      tempNormal: 11.8,
      totalPrecip: 295,
      precipNormal: 280,
      hottestDay: { date: 'Sep 8', value: 34.5 },
      coldestNight: { date: 'Nov 27', value: -4.2 },
      heaviestRainfall: { date: 'Oct 3', value: 71.3 },
      stationCount: 145,
      percentile: 58,
    },
    {
      season: 'Winter',
      avgTemp: -1.4,
      tempNormal: -2.1,
      totalPrecip: 235,
      precipNormal: 250,
      hottestDay: { date: 'Feb 18', value: 14.8 },
      coldestNight: { date: 'Jan 15', value: -24.3 },
      heaviestRainfall: { date: 'Dec 22', value: 45.6 },
      stationCount: 139,
      percentile: 65,
    },
  ];
}

// (MOCK_ANNUAL_DATA and MOCK_SEASON_DATA removed — fetched from API)

// GeoJSON outline for US Northeast (simplified)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NORTHEAST_GEOJSON: any = {
  type: 'Feature',
  properties: { name: 'US Northeast' },
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [-80.0, 39.0], [-75.5, 39.0], [-73.7, 40.5], [-71.8, 41.2],
      [-69.9, 41.7], [-67.0, 44.0], [-67.0, 47.5], [-75.0, 45.0],
      [-79.8, 42.5], [-80.0, 39.0],
    ]],
  },
};

// --- Tab Panel ---

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <Box role="tabpanel" hidden={value !== index} sx={{ pt: 3 }}>
    {value === index && children}
  </Box>
);

// --- Main Component ---

const ClimateReportDashboardSample: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<string>('us-northeast');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [drawMode, setDrawMode] = useState(false);
  const [annualData, setAnnualData] = useState<AnnualRecord[]>([]);
  const [seasonData, setSeasonData] = useState<SeasonData[]>([]);

  useEffect(() => {
    apiClient.get<AnnualRecord[]>(`/climate/reports/${selectedRegion}/annual`)
      .then((data) => { if (data) setAnnualData(data); })
      .catch(() => { /* keep empty */ });
    apiClient.get<SeasonData[]>(`/climate/reports/${selectedRegion}/seasonal`)
      .then((data) => { if (data) setSeasonData(data); })
      .catch(() => { /* keep empty */ });
  }, [selectedRegion]);

  const region = useMemo(
    () => REGIONS.find(r => r.id === selectedRegion) ?? REGIONS[0],
    [selectedRegion],
  );

  const filteredRegions = useMemo(
    () =>
      searchQuery
        ? REGIONS.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : REGIONS,
    [searchQuery],
  );

  const handleRegionChange = (event: SelectChangeEvent<string>) => {
    setSelectedRegion(event.target.value);
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#0F172A', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Public sx={{ color: '#3B82F6', fontSize: 32 }} />
        <Typography
          variant="h4"
          sx={{ color: '#F8FAFC', fontFamily: 'Inter, sans-serif', fontWeight: 700 }}
        >
          Regional Climate Reports
        </Typography>
      </Box>

      {/* Controls Row */}
      <Paper
        sx={{
          bgcolor: '#1E293B',
          p: 2.5,
          borderRadius: 2,
          mb: 3,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'center',
        }}
      >
        {/* Search */}
        <TextField
          size="small"
          placeholder="Search regions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: '#94A3B8' }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            width: 220,
            '& .MuiOutlinedInput-root': {
              color: '#F8FAFC',
              bgcolor: '#0F172A',
              '& fieldset': { borderColor: '#334155' },
              '&:hover fieldset': { borderColor: '#3B82F6' },
            },
          }}
        />

        {/* Region Selector */}
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel sx={{ color: '#94A3B8' }}>Region</InputLabel>
          <Select
            value={selectedRegion}
            label="Region"
            onChange={handleRegionChange}
            sx={{
              color: '#F8FAFC',
              bgcolor: '#0F172A',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3B82F6' },
              '& .MuiSvgIcon-root': { color: '#94A3B8' },
            }}
          >
            {filteredRegions.map(r => (
              <MenuItem key={r.id} value={r.id}>
                {r.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Draw Custom Region Toggle */}
        <FormControlLabel
          control={
            <Switch
              checked={drawMode}
              onChange={(_, checked) => setDrawMode(checked)}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': { color: '#3B82F6' },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#3B82F6' },
              }}
            />
          }
          label={
            <Typography sx={{ color: '#94A3B8', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
              Draw Custom Region
            </Typography>
          }
        />

        {/* Station Count Chip */}
        <Chip
          icon={<Sensors sx={{ color: '#10B981 !important' }} />}
          label={`${region.stationCount} active stations`}
          sx={{
            bgcolor: 'rgba(16, 185, 129, 0.15)',
            color: '#10B981',
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 600,
            ml: 'auto',
          }}
        />
      </Paper>

      {/* Mini Map */}
      <Paper
        sx={{
          bgcolor: '#1E293B',
          borderRadius: 2,
          mb: 3,
          overflow: 'hidden',
          height: 420,
        }}
      >
        <MapContainer
          center={region.center}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url={MAP_TILE_URL}
            attribution={MAP_TILE_ATTRIBUTION}
          />
          <LeafletGeoJSON
            key={region.id}
            data={NORTHEAST_GEOJSON}
            style={{
              fillColor: '#3B82F6',
              fillOpacity: 0.25,
              color: '#3B82F6',
              weight: 2,
            }}
          />
        </MapContainer>
      </Paper>

      {/* Tab Navigation */}
      <Paper sx={{ bgcolor: '#1E293B', borderRadius: 2, p: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            '& .MuiTab-root': {
              color: '#94A3B8',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              textTransform: 'none',
              fontSize: 14,
            },
            '& .Mui-selected': { color: '#3B82F6 !important' },
            '& .MuiTabs-indicator': { bgcolor: '#3B82F6' },
          }}
        >
          <Tab icon={<Thermostat sx={{ fontSize: 18 }} />} iconPosition="start" label="Seasonal Summary" />
          <Tab icon={<TrendingUp sx={{ fontSize: 18 }} />} iconPosition="start" label="Trends" />
          <Tab icon={<FlashOn sx={{ fontSize: 18 }} />} iconPosition="start" label="Extremes" />
          <Tab icon={<FileDownload sx={{ fontSize: 18 }} />} iconPosition="start" label="Export" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <SeasonalSummary data={seasonData} />
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <TrendAnalysis data={annualData} />
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          <ExtremeEvents data={annualData} />
        </TabPanel>
        <TabPanel value={activeTab} index={3}>
          <ReportExporter
            region={region}
            annualData={annualData}
            seasonData={seasonData}
          />
        </TabPanel>
      </Paper>
    </Box>
  );
};

const ClimateReportDashboard: React.FC<React.ComponentProps<typeof ClimateReportDashboardSample>> = (props) => (
  <DemoSurfaceGate
    testId="climate-reports"
    title="Climate reports is not live on this testnet"
    description="This preview contains illustrative data or simulated actions, not verified testnet results."
  >
    <ClimateReportDashboardSample {...props} />
  </DemoSurfaceGate>
);

export default ClimateReportDashboard;
