// LocalDataCache - Browse and manage locally cached weather data with storage analytics
import React, { useState, useMemo, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import StorageIcon from '@mui/icons-material/Storage';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import CloudIcon from '@mui/icons-material/Cloud';
import MapIcon from '@mui/icons-material/Map';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import DataUsageIcon from '@mui/icons-material/DataUsage';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import WrfCard from '../ui/WrfCard';
import WrfStatCard from '../ui/WrfStatCard';
import WrfButton from '../ui/WrfButton';
import WrfBadge from '../ui/WrfBadge';
import WrfDataTable from '../ui/WrfDataTable';
import { colors, borderRadius, spacing, shadows } from '../ui/tokens';
import { apiClient } from '../../services/apiClient';

ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTooltip, Legend);

// ----- Mock Data -----

interface CachedReading {
  id: string;
  stationId: string;
  timestamp: string;
  temperature: number;
  humidity: number;
  pressure: number;
  freshness: 'fresh' | 'aging' | 'stale';
  sizeKB: number;
}

interface CachedForecast {
  id: string;
  region: string;
  validFrom: string;
  validTo: string;
  model: string;
  freshness: 'fresh' | 'aging' | 'stale';
  sizeKB: number;
}

// cachedReadings and cachedForecasts removed — data fetched from API

// Storage breakdown data
const STORAGE_BREAKDOWN = {
  labels: ['Readings', 'Forecasts', 'Map Tiles', 'Photos'],
  readings: [4.2, 3.8, 4.5, 3.1, 5.2, 4.8, 3.6],
  forecasts: [12.4, 11.8, 13.2, 10.5, 14.1, 12.9, 11.2],
  mapTiles: [8.6, 7.2, 9.1, 8.8, 7.5, 8.3, 9.4],
  photos: [3.2, 4.5, 2.8, 5.1, 3.9, 4.2, 3.6],
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ----- Helpers -----

const freshnessConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  fresh: {
    color: colors.success.main,
    label: 'Fresh',
    icon: <CheckCircleIcon sx={{ fontSize: 14 }} />,
  },
  aging: {
    color: colors.warning.main,
    label: 'Aging',
    icon: <WarningAmberIcon sx={{ fontSize: 14 }} />,
  },
  stale: {
    color: colors.error.main,
    label: 'Stale',
    icon: <ErrorOutlineIcon sx={{ fontSize: 14 }} />,
  },
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ----- Component -----

const LocalDataCache: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [clearDialogOpen, setClearDialogOpen] = useState<boolean>(false);
  const [clearTarget, setClearTarget] = useState<string>('');
  const [cachedReadings, setCachedReadings] = useState<CachedReading[]>([]);
  const [cachedForecasts, setCachedForecasts] = useState<CachedForecast[]>([]);

  useEffect(() => {
    apiClient.get<CachedReading[]>('/field/cache/readings')
      .then((data) => { if (data) setCachedReadings(data); })
      .catch(() => {});
    apiClient.get<CachedForecast[]>('/field/cache/forecasts')
      .then((data) => { if (data) setCachedForecasts(data); })
      .catch(() => {});
  }, []);

  // Storage stats
  const totalReadingsMB = 18.9;
  const totalForecastsMB = 706.0 / 1024;
  const totalMapTilesMB = 58.9;
  const totalPhotosMB = 27.3;

  const totalCachedMB = totalReadingsMB + totalForecastsMB + totalMapTilesMB + totalPhotosMB;

  const handleClearCache = (target: string) => {
    setClearTarget(target);
    setClearDialogOpen(true);
  };

  const confirmClear = () => {
    // IndexedDB: would clear the target object store
    // db.clear(clearTarget) or db.delete(clearTarget, key)
    setClearDialogOpen(false);
  };

  // Stacked bar chart data
  const storageChartData = {
    labels: DAY_LABELS,
    datasets: [
      {
        label: 'Readings',
        data: STORAGE_BREAKDOWN.readings,
        backgroundColor: colors.brand.primary,
        borderRadius: 2,
      },
      {
        label: 'Forecasts',
        data: STORAGE_BREAKDOWN.forecasts,
        backgroundColor: colors.success.main,
        borderRadius: 2,
      },
      {
        label: 'Map Tiles',
        data: STORAGE_BREAKDOWN.mapTiles,
        backgroundColor: colors.warning.main,
        borderRadius: 2,
      },
      {
        label: 'Photos',
        data: STORAGE_BREAKDOWN.photos,
        backgroundColor: '#8B5CF6',
        borderRadius: 2,
      },
    ],
  };

  const storageChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: colors.text.secondary,
          boxWidth: 12,
          font: { size: 11 },
        },
      },
      tooltip: {
        backgroundColor: colors.bg.secondary,
        titleColor: colors.text.primary,
        bodyColor: colors.text.secondary,
        borderColor: colors.border.default,
        borderWidth: 1,
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)} MB`,
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { color: colors.text.muted, font: { size: 11 } },
      },
      y: {
        stacked: true,
        grid: { color: `${colors.border.default}40` },
        ticks: { color: colors.text.muted, font: { size: 10 } },
        title: {
          display: true,
          text: 'MB',
          color: colors.text.muted,
          font: { size: 10 },
        },
      },
    },
  };

  // Readings table columns
  const readingsColumns = [
    { key: 'stationId', label: 'Station', sortable: true },
    {
      key: 'timestamp',
      label: 'Time',
      sortable: true,
      render: (val: string) => (
        <Typography sx={{ fontSize: '0.8rem', color: colors.text.secondary }}>
          {formatTime(val)}
        </Typography>
      ),
    },
    {
      key: 'temperature',
      label: 'Temp',
      sortable: true,
      render: (val: number) => (
        <Typography sx={{ fontSize: '0.8rem', color: colors.text.primary, fontWeight: 600 }}>
          {val.toFixed(1)}C
        </Typography>
      ),
    },
    {
      key: 'humidity',
      label: 'Humidity',
      sortable: true,
      render: (val: number) => `${val}%`,
    },
    {
      key: 'pressure',
      label: 'Pressure',
      sortable: true,
      render: (val: number) => `${val} hPa`,
    },
    {
      key: 'freshness',
      label: 'Freshness',
      sortable: true,
      render: (val: string) => {
        const config = freshnessConfig[val];
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Box sx={{ color: config.color, display: 'flex' }}>{config.icon}</Box>
            <Typography sx={{ fontSize: '0.7rem', color: config.color, fontWeight: 600 }}>
              {config.label}
            </Typography>
          </Box>
        );
      },
    },
    {
      key: 'sizeKB',
      label: 'Size',
      sortable: true,
      render: (val: number) => `${val} KB`,
    },
  ];

  // Forecasts table columns
  const forecastColumns = [
    { key: 'region', label: 'Region', sortable: true },
    { key: 'model', label: 'Model', sortable: true },
    {
      key: 'validFrom',
      label: 'Valid From',
      sortable: true,
      render: (val: string) => `${formatDate(val)} ${formatTime(val)}`,
    },
    {
      key: 'validTo',
      label: 'Valid To',
      sortable: true,
      render: (val: string) => `${formatDate(val)} ${formatTime(val)}`,
    },
    {
      key: 'freshness',
      label: 'Freshness',
      sortable: true,
      render: (val: string) => {
        const config = freshnessConfig[val];
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Box sx={{ color: config.color, display: 'flex' }}>{config.icon}</Box>
            <Typography sx={{ fontSize: '0.7rem', color: config.color, fontWeight: 600 }}>
              {config.label}
            </Typography>
          </Box>
        );
      },
    },
    {
      key: 'sizeKB',
      label: 'Size',
      sortable: true,
      render: (val: number) => (val > 100 ? `${(val / 1024).toFixed(1)} MB` : `${val} KB`),
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: colors.bg.primary,
        padding: `${spacing.lg}px`,
      }}
    >
      {/* Header */}
      <Box sx={{ mb: `${spacing.lg}px` }}>
        <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: colors.text.primary }}>
          Local Data Cache
        </Typography>
        <Typography sx={{ fontSize: '0.875rem', color: colors.text.secondary, mt: `${spacing.xs}px` }}>
          Browse and manage cached weather data for offline access
        </Typography>
      </Box>

      {/* Stat Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: `${spacing.md}px`,
          mb: `${spacing.lg}px`,
        }}
      >
        <WrfStatCard
          label="Cached Readings"
          value={cachedReadings.length}
          icon={ThermostatIcon}
          color={colors.brand.primary}
          sparklineData={[4, 6, 5, 8, 7, 9, 8]}
        />
        <WrfStatCard
          label="Cached Forecasts"
          value={cachedForecasts.length}
          icon={CloudIcon}
          color={colors.success.main}
          sparklineData={[2, 3, 4, 3, 5, 4, 4]}
        />
        <WrfStatCard
          label="Map Tiles Cached"
          value="1,247"
          icon={MapIcon}
          color={colors.warning.main}
          sparklineData={[800, 920, 1050, 1100, 1180, 1200, 1247]}
        />
        <WrfStatCard
          label="Photos Cached"
          value="18"
          icon={PhotoCameraIcon}
          color="#8B5CF6"
          sparklineData={[8, 10, 12, 14, 15, 17, 18]}
        />
      </Box>

      {/* Storage Breakdown Chart */}
      <WrfCard
        title="Storage Breakdown"
        subtitle={`${totalCachedMB.toFixed(1)} MB total cached data (7-day trend)`}
        sx={{ mb: `${spacing.lg}px` }}
      >
        <Box sx={{ height: 280 }}>
          <Bar data={storageChartData} options={storageChartOptions} />
        </Box>
      </WrfCard>

      {/* Freshness Legend */}
      <WrfCard
        title="Data Freshness Guide"
        sx={{ mb: `${spacing.lg}px` }}
      >
        <Box sx={{ display: 'flex', gap: `${spacing.lg}px`, flexWrap: 'wrap' }}>
          {Object.entries(freshnessConfig).map(([key, config]) => (
            <Box
              key={key}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: `${spacing.sm}px`,
                padding: `${spacing.sm}px ${spacing.md}px`,
                borderRadius: `${borderRadius.md}px`,
                backgroundColor: `${config.color}08`,
                border: `1px solid ${config.color}30`,
              }}
            >
              <Box sx={{ color: config.color, display: 'flex' }}>{config.icon}</Box>
              <Box>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: config.color }}>
                  {config.label}
                </Typography>
                <Typography sx={{ fontSize: '0.65rem', color: colors.text.muted }}>
                  {key === 'fresh' && '< 30 min old'}
                  {key === 'aging' && '30 min - 2 hours old'}
                  {key === 'stale' && '> 2 hours old'}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </WrfCard>

      {/* Cached Data Browser with Tabs */}
      <WrfCard
        title="Cached Data Browser"
        action={
          <Tooltip title="Refresh cache index">
            <IconButton size="small" sx={{ color: colors.text.secondary }}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        }
        sx={{ mb: `${spacing.lg}px` }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            mb: `${spacing.md}px`,
            '& .MuiTab-root': {
              color: colors.text.muted,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              minHeight: 40,
            },
            '& .Mui-selected': { color: colors.brand.primary },
            '& .MuiTabs-indicator': { backgroundColor: colors.brand.primary },
          }}
        >
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.xs}px` }}>
                Readings
                <Chip
                  label={cachedReadings.length}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    backgroundColor: `${colors.brand.primary}15`,
                    color: colors.brand.primary,
                  }}
                />
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.xs}px` }}>
                Forecasts
                <Chip
                  label={cachedForecasts.length}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    backgroundColor: `${colors.success.main}15`,
                    color: colors.success.main,
                  }}
                />
              </Box>
            }
          />
        </Tabs>

        {activeTab === 0 && (
          <WrfDataTable
            columns={readingsColumns}
            data={cachedReadings}
            searchable
            exportable
            pagination
            pageSize={5}
          />
        )}

        {activeTab === 1 && (
          <WrfDataTable
            columns={forecastColumns}
            data={cachedForecasts}
            searchable
            exportable
            pagination
            pageSize={5}
          />
        )}
      </WrfCard>

      {/* Clear Cache Buttons */}
      <WrfCard title="Cache Management" subtitle="Clear specific cached data categories">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: `${spacing.md}px`,
          }}
        >
          {[
            { key: 'readings', label: 'Weather Readings', size: totalReadingsMB, icon: ThermostatIcon, color: colors.brand.primary },
            { key: 'forecasts', label: 'Forecasts', size: totalForecastsMB, icon: CloudIcon, color: colors.success.main },
            { key: 'map-tiles', label: 'Map Tiles', size: totalMapTilesMB, icon: MapIcon, color: colors.warning.main },
            { key: 'photos', label: 'Photos', size: totalPhotosMB, icon: PhotoCameraIcon, color: '#8B5CF6' },
          ].map((item) => (
            <Box
              key={item.key}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: `${spacing.sm}px`,
                padding: `${spacing.md}px`,
                borderRadius: `${borderRadius.md}px`,
                backgroundColor: colors.bg.primary,
                border: `1px solid ${colors.border.default}`,
              }}
            >
              <item.icon sx={{ fontSize: 28, color: item.color }} />
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.text.primary }}>
                {item.label}
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted }}>
                {item.size.toFixed(1)} MB
              </Typography>
              <WrfButton
                variant="danger"
                size="sm"
                startIcon={<DeleteIcon />}
                onClick={() => handleClearCache(item.key)}
                sx={{ mt: `${spacing.xs}px` }}
              >
                Clear
              </WrfButton>
            </Box>
          ))}
        </Box>

        {/* Clear all */}
        <Box
          sx={{
            mt: `${spacing.lg}px`,
            padding: `${spacing.md}px`,
            borderRadius: `${borderRadius.md}px`,
            backgroundColor: `${colors.error.main}08`,
            border: `1px solid ${colors.error.main}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.text.primary }}>
              Clear All Cached Data
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted }}>
              Remove all locally cached data ({totalCachedMB.toFixed(1)} MB)
            </Typography>
          </Box>
          <WrfButton
            variant="danger"
            size="sm"
            startIcon={<DeleteIcon />}
            onClick={() => handleClearCache('all')}
          >
            Clear All
          </WrfButton>
        </Box>
      </WrfCard>

      {/* Confirmation Dialog */}
      <Dialog
        open={clearDialogOpen}
        onClose={() => setClearDialogOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: colors.bg.secondary,
            border: `1px solid ${colors.border.default}`,
            borderRadius: `${borderRadius.lg}px`,
            color: colors.text.primary,
            minWidth: 360,
          },
        }}
      >
        <DialogTitle sx={{ color: colors.text.primary, fontWeight: 600 }}>
          Confirm Clear Cache
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: colors.text.secondary, fontSize: '0.875rem' }}>
            Are you sure you want to clear{' '}
            {clearTarget === 'all' ? 'all cached data' : `cached ${clearTarget}`}? This action
            cannot be undone and the data will need to be re-downloaded when online.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ padding: `${spacing.md}px ${spacing.lg}px` }}>
          <WrfButton variant="ghost" size="sm" onClick={() => setClearDialogOpen(false)}>
            Cancel
          </WrfButton>
          <WrfButton variant="danger" size="sm" onClick={confirmClear}>
            Clear {clearTarget === 'all' ? 'All' : clearTarget}
          </WrfButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LocalDataCache;
