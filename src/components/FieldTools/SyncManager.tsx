// SyncManager - Sync status dashboard with history, bandwidth chart, and conflict resolution
import React, { useState, useMemo, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import SyncIcon from '@mui/icons-material/Sync';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SpeedIcon from '@mui/icons-material/Speed';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import MergeTypeIcon from '@mui/icons-material/MergeType';
import StorageIcon from '@mui/icons-material/Storage';
import WifiIcon from '@mui/icons-material/Wifi';
import DataUsageIcon from '@mui/icons-material/DataUsage';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import WrfCard from '../ui/WrfCard';
import WrfStatCard from '../ui/WrfStatCard';
import WrfButton from '../ui/WrfButton';
import WrfBadge from '../ui/WrfBadge';
import { colors, borderRadius, spacing, shadows } from '../ui/tokens';
import { apiClient } from '../../services/apiClient';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, ChartTooltip, Legend);

// ----- Mock Data -----

interface SyncEvent {
  id: string;
  timestamp: string;
  type: 'upload' | 'download' | 'conflict' | 'error';
  itemCount: number;
  sizeKB: number;
  durationMs: number;
  status: 'completed' | 'failed' | 'partial';
  details: string;
}

interface ConflictItem {
  id: string;
  field: string;
  localValue: string;
  remoteValue: string;
  timestamp: string;
  stationId: string;
  resolved: boolean;
}

// syncHistory and MOCK_CONFLICTS removed — data fetched from API

const PENDING_BY_TYPE = [
  { type: 'Weather Readings', count: 6, icon: DataUsageIcon },
  { type: 'Air Quality', count: 2, icon: DataUsageIcon },
  { type: 'Photos', count: 3, icon: DataUsageIcon },
  { type: 'Soil Data', count: 1, icon: StorageIcon },
];

// Bandwidth data for chart (KB/s over last 30 minutes in 1-minute intervals)
const BANDWIDTH_LABELS = Array.from({ length: 30 }, (_, i) => {
  const m = 30 - i;
  return m === 0 ? 'Now' : `-${m}m`;
});

const BANDWIDTH_UPLOAD = [
  0, 0, 12, 45, 38, 0, 0, 0, 8, 22, 35, 42, 28, 0, 0,
  5, 15, 48, 52, 44, 0, 0, 0, 18, 32, 55, 48, 0, 12, 38,
];

const BANDWIDTH_DOWNLOAD = [
  0, 5, 0, 0, 0, 22, 45, 62, 55, 0, 0, 0, 0, 15, 38,
  52, 0, 0, 0, 0, 28, 42, 58, 0, 0, 0, 0, 32, 0, 0,
];

// ----- Helpers -----

const typeIcons: Record<string, React.ReactNode> = {
  upload: <CloudDoneIcon sx={{ fontSize: 18, color: colors.success.main }} />,
  download: <SyncIcon sx={{ fontSize: 18, color: colors.brand.primary }} />,
  conflict: <MergeTypeIcon sx={{ fontSize: 18, color: colors.warning.main }} />,
  error: <ErrorOutlineIcon sx={{ fontSize: 18, color: colors.error.main }} />,
};

const statusColors: Record<string, string> = {
  completed: colors.success.main,
  failed: colors.error.main,
  partial: colors.warning.main,
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ----- Component -----

const SyncManager: React.FC = () => {
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [syncHistory, setSyncHistory] = useState<SyncEvent[]>([]);
  const [syncInterval, setSyncInterval] = useState<number>(5);
  const [wifiOnly, setWifiOnly] = useState<boolean>(true);
  const [compressData, setCompressData] = useState<boolean>(true);

  useEffect(() => {
    apiClient.get<SyncEvent[]>('/field/sync/history')
      .then((data) => { if (data) setSyncHistory(data); })
      .catch(() => {});
    apiClient.get<ConflictItem[]>('/field/sync/conflicts')
      .then((data) => { if (data) setConflicts(data); })
      .catch(() => {});
  }, []);

  const lastSync = syncHistory[0] ?? null;
  const avgSpeed = useMemo(() => {
    const completed = syncHistory.filter((e) => e.status === 'completed');
    if (completed.length === 0) return 0;
    const totalKB = completed.reduce((s, e) => s + e.sizeKB, 0);
    const totalMs = completed.reduce((s, e) => s + e.durationMs, 0);
    return Math.round((totalKB / (totalMs / 1000)) * 10) / 10;
  }, [syncHistory]);

  const handleResolveConflict = (id: string, choice: 'local' | 'remote') => {
    setConflicts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, resolved: true } : c)),
    );
  };

  // Chart config
  const bandwidthChartData = {
    labels: BANDWIDTH_LABELS,
    datasets: [
      {
        label: 'Upload (KB/s)',
        data: BANDWIDTH_UPLOAD,
        borderColor: colors.success.main,
        backgroundColor: `${colors.success.main}20`,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
      },
      {
        label: 'Download (KB/s)',
        data: BANDWIDTH_DOWNLOAD,
        borderColor: colors.brand.primary,
        backgroundColor: `${colors.brand.primary}20`,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  };

  const bandwidthChartOptions = {
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
      },
    },
    scales: {
      x: {
        grid: { color: `${colors.border.default}40` },
        ticks: { color: colors.text.muted, font: { size: 10 }, maxTicksLimit: 10 },
      },
      y: {
        grid: { color: `${colors.border.default}40` },
        ticks: { color: colors.text.muted, font: { size: 10 } },
        title: {
          display: true,
          text: 'KB/s',
          color: colors.text.muted,
          font: { size: 10 },
        },
      },
    },
  };

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
          Sync Manager
        </Typography>
        <Typography sx={{ fontSize: '0.875rem', color: colors.text.secondary, mt: `${spacing.xs}px` }}>
          Data synchronization status, history, and conflict resolution
        </Typography>
      </Box>

      {/* Speed Metrics Stat Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: `${spacing.md}px`,
          mb: `${spacing.lg}px`,
        }}
      >
        <WrfStatCard
          label="Last Sync"
          value={lastSync ? formatTime(lastSync.timestamp) : '--'}
          icon={ScheduleIcon}
          color={colors.brand.primary}
        />
        <WrfStatCard
          label="Avg Sync Speed"
          value={`${avgSpeed} KB/s`}
          trend={15}
          trendLabel="improvement"
          icon={SpeedIcon}
          color={colors.success.main}
          sparklineData={[8.2, 9.1, 10.5, 11.2, 12.8, 14.1, avgSpeed]}
        />
        <WrfStatCard
          label="Synced Today"
          value="47 items"
          trend={22}
          trendLabel="vs yesterday"
          icon={CloudDoneIcon}
          color={colors.success.main}
          sparklineData={[28, 32, 35, 38, 41, 44, 47]}
        />
        <WrfStatCard
          label="Unresolved Conflicts"
          value={conflicts.filter((c) => !c.resolved).length}
          icon={MergeTypeIcon}
          color={conflicts.some((c) => !c.resolved) ? colors.warning.main : colors.success.main}
        />
      </Box>

      {/* Sync Status Card */}
      <WrfCard
        title="Sync Status"
        action={<WrfBadge status="online" label="Connected" pulse />}
        sx={{ mb: `${spacing.lg}px` }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: `${spacing.lg}px`,
            padding: `${spacing.md}px`,
            borderRadius: `${borderRadius.md}px`,
            backgroundColor: `${colors.success.main}08`,
            border: `1px solid ${colors.success.main}30`,
          }}
        >
          <CloudDoneIcon sx={{ fontSize: 32, color: colors.success.main }} />
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: colors.text.primary }}>
              All Data Synchronized
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: colors.text.secondary }}>
              {lastSync
                ? `Last sync: ${formatTime(lastSync.timestamp)} | ${lastSync.itemCount} items | ${lastSync.sizeKB} KB in ${(lastSync.durationMs / 1000).toFixed(1)}s`
                : 'No sync history available'}
            </Typography>
          </Box>
          <WrfButton variant="secondary" size="sm" startIcon={<SyncIcon />}>
            Sync Now
          </WrfButton>
        </Box>

        {/* Pending items by type */}
        <Box sx={{ mt: `${spacing.lg}px` }}>
          <Typography
            sx={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: colors.text.muted,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              mb: `${spacing.sm}px`,
            }}
          >
            Pending Items by Type
          </Typography>
          <Box sx={{ display: 'flex', gap: `${spacing.sm}px`, flexWrap: 'wrap' }}>
            {PENDING_BY_TYPE.map((item) => (
              <Box
                key={item.type}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: `${spacing.sm}px`,
                  padding: `${spacing.sm}px ${spacing.md}px`,
                  borderRadius: `${borderRadius.md}px`,
                  backgroundColor: colors.bg.primary,
                  border: `1px solid ${colors.border.default}`,
                }}
              >
                <Typography sx={{ fontSize: '0.8rem', color: colors.text.secondary }}>
                  {item.type}
                </Typography>
                <Chip
                  label={item.count}
                  size="small"
                  sx={{
                    height: 20,
                    minWidth: 28,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    backgroundColor: `${colors.brand.primary}15`,
                    color: colors.brand.primary,
                  }}
                />
              </Box>
            ))}
          </Box>
        </Box>
      </WrfCard>

      {/* Bandwidth Chart */}
      <WrfCard
        title="Bandwidth Usage"
        subtitle="Upload and download speeds over the last 30 minutes"
        sx={{ mb: `${spacing.lg}px` }}
      >
        <Box sx={{ height: 280 }}>
          <Line data={bandwidthChartData} options={bandwidthChartOptions} />
        </Box>
      </WrfCard>

      {/* Sync History Timeline */}
      <WrfCard
        title="Sync History"
        subtitle="Recent synchronization events"
        sx={{ mb: `${spacing.lg}px` }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {/* Timeline line */}
          <Box
            sx={{
              position: 'absolute',
              left: 15,
              top: 8,
              bottom: 8,
              width: 2,
              backgroundColor: colors.border.default,
            }}
          />

          {syncHistory.map((event, index) => (
            <Box
              key={event.id}
              sx={{
                display: 'flex',
                gap: `${spacing.md}px`,
                padding: `${spacing.sm}px 0`,
                position: 'relative',
              }}
            >
              {/* Timeline dot */}
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: `${statusColors[event.status]}15`,
                  border: `2px solid ${statusColors[event.status]}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  zIndex: 1,
                }}
              >
                {typeIcons[event.type]}
              </Box>

              {/* Event details */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px`, mb: '2px' }}>
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.text.primary }}>
                    {event.details}
                  </Typography>
                  <Chip
                    label={event.status}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '0.6rem',
                      fontWeight: 600,
                      backgroundColor: `${statusColors[event.status]}15`,
                      color: statusColors[event.status],
                    }}
                  />
                </Box>
                <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted }}>
                  {formatTime(event.timestamp)} | {event.itemCount} items | {event.sizeKB} KB |{' '}
                  {(event.durationMs / 1000).toFixed(1)}s
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </WrfCard>

      {/* Conflict Resolution Panel */}
      <WrfCard
        title="Conflict Resolution"
        subtitle={`${conflicts.filter((c) => !c.resolved).length} unresolved conflicts`}
        action={
          <WrfBadge
            status={conflicts.some((c) => !c.resolved) ? 'degraded' : 'online'}
            label={conflicts.some((c) => !c.resolved) ? 'Conflicts' : 'Resolved'}
          />
        }
        sx={{ mb: `${spacing.lg}px` }}
      >
        {conflicts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: `${spacing.xl}px` }}>
            <CheckCircleIcon sx={{ fontSize: 48, color: colors.success.main, mb: `${spacing.sm}px` }} />
            <Typography sx={{ color: colors.text.secondary }}>No conflicts to resolve</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${spacing.sm}px` }}>
            {conflicts.map((conflict) => (
              <Box
                key={conflict.id}
                sx={{
                  padding: `${spacing.md}px`,
                  borderRadius: `${borderRadius.md}px`,
                  backgroundColor: conflict.resolved
                    ? `${colors.success.main}05`
                    : `${colors.warning.main}08`,
                  border: `1px solid ${
                    conflict.resolved ? `${colors.success.main}30` : `${colors.warning.main}30`
                  }`,
                  opacity: conflict.resolved ? 0.6 : 1,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: `${spacing.sm}px` }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px` }}>
                    <MergeTypeIcon
                      sx={{
                        fontSize: 18,
                        color: conflict.resolved ? colors.success.main : colors.warning.main,
                      }}
                    />
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.text.primary }}>
                      {conflict.field} - {conflict.stationId}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted }}>
                    {formatTime(conflict.timestamp)}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    gap: `${spacing.sm}px`,
                    alignItems: 'center',
                  }}
                >
                  {/* Local value */}
                  <Box
                    sx={{
                      padding: `${spacing.sm}px`,
                      borderRadius: `${borderRadius.sm}px`,
                      backgroundColor: colors.bg.primary,
                      border: `1px solid ${colors.border.default}`,
                      textAlign: 'center',
                    }}
                  >
                    <Typography sx={{ fontSize: '0.625rem', color: colors.text.muted, mb: '2px' }}>
                      LOCAL
                    </Typography>
                    <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: colors.text.primary }}>
                      {conflict.localValue}
                    </Typography>
                  </Box>

                  <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted }}>vs</Typography>

                  {/* Remote value */}
                  <Box
                    sx={{
                      padding: `${spacing.sm}px`,
                      borderRadius: `${borderRadius.sm}px`,
                      backgroundColor: colors.bg.primary,
                      border: `1px solid ${colors.border.default}`,
                      textAlign: 'center',
                    }}
                  >
                    <Typography sx={{ fontSize: '0.625rem', color: colors.text.muted, mb: '2px' }}>
                      REMOTE
                    </Typography>
                    <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: colors.text.primary }}>
                      {conflict.remoteValue}
                    </Typography>
                  </Box>
                </Box>

                {!conflict.resolved && (
                  <Box sx={{ display: 'flex', gap: `${spacing.sm}px`, mt: `${spacing.sm}px` }}>
                    <WrfButton
                      variant="secondary"
                      size="sm"
                      fullWidth
                      onClick={() => handleResolveConflict(conflict.id, 'local')}
                    >
                      Keep Local
                    </WrfButton>
                    <WrfButton
                      variant="primary"
                      size="sm"
                      fullWidth
                      onClick={() => handleResolveConflict(conflict.id, 'remote')}
                    >
                      Use Remote
                    </WrfButton>
                  </Box>
                )}

                {conflict.resolved && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.xs}px`, mt: `${spacing.sm}px` }}>
                    <CheckCircleIcon sx={{ fontSize: 14, color: colors.success.main }} />
                    <Typography sx={{ fontSize: '0.75rem', color: colors.success.main }}>Resolved</Typography>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}
      </WrfCard>

      {/* Sync Settings */}
      <WrfCard title="Sync Settings">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${spacing.md}px` }}>
          {/* Sync interval */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: `${spacing.sm}px ${spacing.md}px`,
              borderRadius: `${borderRadius.md}px`,
              backgroundColor: colors.bg.primary,
              border: `1px solid ${colors.border.default}`,
            }}
          >
            <Box>
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.text.primary }}>
                Sync Interval
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted }}>
                How often to check for sync
              </Typography>
            </Box>
            <Select
              value={syncInterval}
              onChange={(e) => setSyncInterval(e.target.value as number)}
              size="small"
              sx={{
                minWidth: 120,
                color: colors.text.primary,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border.default },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.brand.primary },
                '& .MuiSvgIcon-root': { color: colors.text.secondary },
              }}
            >
              <MenuItem value={1}>Every 1 min</MenuItem>
              <MenuItem value={5}>Every 5 min</MenuItem>
              <MenuItem value={15}>Every 15 min</MenuItem>
              <MenuItem value={30}>Every 30 min</MenuItem>
              <MenuItem value={60}>Every 1 hour</MenuItem>
            </Select>
          </Box>

          {/* Wi-Fi only */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: `${spacing.sm}px ${spacing.md}px`,
              borderRadius: `${borderRadius.md}px`,
              backgroundColor: colors.bg.primary,
              border: `1px solid ${colors.border.default}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px` }}>
              <WifiIcon sx={{ fontSize: 20, color: colors.text.secondary }} />
              <Box>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.text.primary }}>
                  Wi-Fi Only Sync
                </Typography>
                <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted }}>
                  Prevent sync over cellular data
                </Typography>
              </Box>
            </Box>
            <Switch
              checked={wifiOnly}
              onChange={(e) => setWifiOnly(e.target.checked)}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': { color: colors.brand.primary },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: colors.brand.primary,
                },
                '& .MuiSwitch-track': { backgroundColor: colors.bg.tertiary },
              }}
            />
          </Box>

          {/* Compress data */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: `${spacing.sm}px ${spacing.md}px`,
              borderRadius: `${borderRadius.md}px`,
              backgroundColor: colors.bg.primary,
              border: `1px solid ${colors.border.default}`,
            }}
          >
            <Box>
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.text.primary }}>
                Compress Data
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted }}>
                Compress data before upload to save bandwidth
              </Typography>
            </Box>
            <Switch
              checked={compressData}
              onChange={(e) => setCompressData(e.target.checked)}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': { color: colors.brand.primary },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: colors.brand.primary,
                },
                '& .MuiSwitch-track': { backgroundColor: colors.bg.tertiary },
              }}
            />
          </Box>
        </Box>
      </WrfCard>
    </Box>
  );
};

export default SyncManager;
