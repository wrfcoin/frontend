// OfflineSubmissionQueue - Manages queued weather data submissions with offline-first approach
import React, { useState, useMemo, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import QueueIcon from '@mui/icons-material/Queue';
import StorageIcon from '@mui/icons-material/Storage';
import TimerIcon from '@mui/icons-material/Timer';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import ReplayIcon from '@mui/icons-material/Replay';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import SyncIcon from '@mui/icons-material/Sync';
import WrfCard from '../ui/WrfCard';
import WrfStatCard from '../ui/WrfStatCard';
import WrfButton from '../ui/WrfButton';
import WrfBadge from '../ui/WrfBadge';
import { colors, borderRadius, spacing, shadows } from '../ui/tokens';
import { apiClient } from '../../services/apiClient';

// ----- Mock Data -----

interface QueuedReading {
  id: string;
  stationId: string;
  timestamp: string;
  type: 'weather' | 'air_quality' | 'soil' | 'photo';
  sizeKB: number;
  status: 'pending' | 'syncing' | 'failed' | 'retrying';
  retries: number;
  errorMessage?: string;
  temperature?: number;
  humidity?: number;
}

// MOCK_QUEUED removed — data fetched from API

const STORAGE_CAPACITY_MB = 50;
const STORAGE_USED_MB = 12.6;

// ----- Helpers -----

const statusColors: Record<string, string> = {
  pending: colors.brand.primary,
  syncing: colors.warning.main,
  failed: colors.error.main,
  retrying: colors.warning.main,
};

const typeLabels: Record<string, string> = {
  weather: 'Weather',
  air_quality: 'Air Quality',
  soil: 'Soil',
  photo: 'Photo',
};

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getOldestAge(readings: QueuedReading[]): string {
  if (readings.length === 0) return '--';
  const oldest = readings.reduce((a, b) =>
    new Date(a.timestamp) < new Date(b.timestamp) ? a : b,
  );
  const minutes = Math.round(
    (Date.now() - new Date(oldest.timestamp).getTime()) / 60000,
  );
  if (minutes < 60) return `${minutes}m`;
  return `${Math.round(minutes / 60)}h ${minutes % 60}m`;
}

// ----- Component -----

const OfflineSubmissionQueue: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [autoSync, setAutoSync] = useState<boolean>(true);
  const [queue, setQueue] = useState<QueuedReading[]>([]);

  useEffect(() => {
    apiClient.get<QueuedReading[]>('/field/queue')
      .then((data) => { if (data) setQueue(data); })
      .catch(() => {});
  }, []);

  const pendingCount = useMemo(() => queue.filter((r) => r.status !== 'failed').length, [queue]);
  const totalSizeKB = useMemo(() => queue.reduce((sum, r) => sum + r.sizeKB, 0), [queue]);
  const successRate = 94.2; // Mock calculated value
  const storagePercent = (STORAGE_USED_MB / STORAGE_CAPACITY_MB) * 100;

  const handleRetryAll = () => {
    // IndexedDB: would iterate failed items and re-enqueue for sync
    setQueue((prev) =>
      prev.map((r) =>
        r.status === 'failed' ? { ...r, status: 'retrying' as const, retries: r.retries + 1, errorMessage: undefined } : r,
      ),
    );
  };

  const handleClearCompleted = () => {
    // IndexedDB: would delete synced items from the offline store
    setQueue((prev) => prev.filter((r) => r.status !== 'failed'));
  };

  const handleRetryOne = (id: string) => {
    // IndexedDB: would update the status of a single record
    setQueue((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: 'retrying' as const, retries: r.retries + 1, errorMessage: undefined } : r,
      ),
    );
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: colors.bg.primary,
        padding: `${spacing.lg}px`,
      }}
    >
      {/* Online/Offline Banner */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: `${spacing.md}px`,
          padding: `${spacing.md}px ${spacing.lg}px`,
          borderRadius: `${borderRadius.lg}px`,
          backgroundColor: isOnline ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
          border: `1px solid ${isOnline ? colors.success.main : colors.error.main}`,
          marginBottom: `${spacing.lg}px`,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onClick={() => setIsOnline(!isOnline)}
      >
        {isOnline ? (
          <WifiIcon sx={{ color: colors.success.main, fontSize: 24 }} />
        ) : (
          <WifiOffIcon sx={{ color: colors.error.main, fontSize: 24 }} />
        )}
        <Box sx={{ flex: 1 }}>
          <Typography
            sx={{
              fontSize: '1rem',
              fontWeight: 600,
              color: isOnline ? colors.success.main : colors.error.main,
            }}
          >
            {isOnline ? 'Online - Ready to Sync' : 'Offline - Data Queued Locally'}
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: colors.text.secondary }}>
            {isOnline
              ? `${pendingCount} submissions ready to upload`
              : 'Submissions will sync when connection is restored'}
          </Typography>
        </Box>
        <WrfBadge status={isOnline ? 'online' : 'offline'} pulse={isOnline} />
      </Box>

      {/* Page Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: `${spacing.lg}px` }}>
        <Box>
          <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: colors.text.primary }}>
            Submission Queue
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: colors.text.secondary, mt: `${spacing.xs}px` }}>
            Offline-first weather data submissions with automatic sync
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: `${spacing.sm}px` }}>
          <WrfButton
            variant="secondary"
            size="sm"
            startIcon={<ReplayIcon />}
            onClick={handleRetryAll}
          >
            Retry Failed
          </WrfButton>
          <WrfButton
            variant="ghost"
            size="sm"
            startIcon={<DeleteSweepIcon />}
            onClick={handleClearCompleted}
          >
            Clear Failed
          </WrfButton>
        </Box>
      </Box>

      {/* Stat Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: `${spacing.md}px`,
          marginBottom: `${spacing.lg}px`,
        }}
      >
        <WrfStatCard
          label="Pending Submissions"
          value={pendingCount}
          trend={-12}
          trendLabel="vs last session"
          icon={QueueIcon}
          color={colors.brand.primary}
          sparklineData={[8, 12, 9, 15, 11, 7, pendingCount]}
        />
        <WrfStatCard
          label="Queue Size"
          value={`${(totalSizeKB / 1024).toFixed(1)} MB`}
          trend={8}
          trendLabel="growth"
          icon={StorageIcon}
          color={colors.warning.main}
          sparklineData={[0.3, 0.5, 0.4, 0.7, 0.6, 0.8, totalSizeKB / 1024]}
        />
        <WrfStatCard
          label="Oldest Entry"
          value={getOldestAge(queue)}
          icon={TimerIcon}
          color={colors.text.secondary}
        />
        <WrfStatCard
          label="Success Rate"
          value={`${successRate}%`}
          trend={2.1}
          trendLabel="this week"
          icon={CheckCircleIcon}
          color={colors.success.main}
          sparklineData={[88, 91, 89, 93, 92, 95, 94.2]}
        />
      </Box>

      {/* Queue List */}
      <WrfCard
        title="Queued Readings"
        subtitle={`${queue.length} items in local queue`}
        action={
          <Tooltip title="Refresh queue from local storage">
            <IconButton size="small" sx={{ color: colors.text.secondary }}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        }
        sx={{ marginBottom: `${spacing.lg}px` }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${spacing.sm}px` }}>
          {queue.map((reading) => (
            <Box
              key={reading.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: `${spacing.md}px`,
                padding: `${spacing.md}px`,
                borderRadius: `${borderRadius.md}px`,
                backgroundColor: colors.bg.primary,
                border: `1px solid ${colors.border.default}`,
                transition: 'border-color 0.2s ease',
                '&:hover': {
                  borderColor: statusColors[reading.status] || colors.border.default,
                },
              }}
            >
              {/* Status indicator */}
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: statusColors[reading.status],
                  flexShrink: 0,
                  animation:
                    reading.status === 'syncing' || reading.status === 'retrying'
                      ? 'wrfPulse 1.5s ease-in-out infinite'
                      : 'none',
                  '@keyframes wrfPulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.3 },
                  },
                }}
              />

              {/* Type icon */}
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: `${borderRadius.md}px`,
                  backgroundColor: `${statusColors[reading.status]}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {reading.status === 'syncing' || reading.status === 'retrying' ? (
                  <SyncIcon
                    sx={{
                      fontSize: 18,
                      color: statusColors[reading.status],
                      animation: 'wrfSpin 1.2s linear infinite',
                      '@keyframes wrfSpin': {
                        from: { transform: 'rotate(0deg)' },
                        to: { transform: 'rotate(360deg)' },
                      },
                    }}
                  />
                ) : reading.status === 'failed' ? (
                  <ErrorOutlineIcon sx={{ fontSize: 18, color: colors.error.main }} />
                ) : (
                  <CloudUploadIcon sx={{ fontSize: 18, color: colors.brand.primary }} />
                )}
              </Box>

              {/* Details */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px`, mb: '2px' }}>
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.text.primary }}>
                    {reading.stationId}
                  </Typography>
                  <Chip
                    label={typeLabels[reading.type]}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.625rem',
                      fontWeight: 600,
                      backgroundColor: `${colors.brand.primary}15`,
                      color: colors.brand.primary,
                      border: 'none',
                    }}
                  />
                </Box>
                <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted }}>
                  {formatTimestamp(reading.timestamp)}
                  {reading.temperature !== undefined && ` | ${reading.temperature}C`}
                  {reading.humidity !== undefined && ` | ${reading.humidity}%`}
                  {' | '}
                  {reading.sizeKB < 100 ? `${reading.sizeKB} KB` : `${(reading.sizeKB / 1024).toFixed(1)} MB`}
                </Typography>
                {reading.errorMessage && (
                  <Typography sx={{ fontSize: '0.7rem', color: colors.error.light, mt: '2px' }}>
                    {reading.errorMessage}
                  </Typography>
                )}
              </Box>

              {/* Status badge */}
              <WrfBadge
                status={
                  reading.status === 'syncing' || reading.status === 'retrying'
                    ? 'syncing'
                    : reading.status === 'failed'
                      ? 'degraded'
                      : 'pending'
                }
                label={reading.status === 'retrying' ? `Retry #${reading.retries}` : reading.status}
                size="sm"
              />

              {/* Actions */}
              {reading.status === 'failed' && (
                <Tooltip title="Retry this submission">
                  <IconButton
                    size="small"
                    onClick={() => handleRetryOne(reading.id)}
                    sx={{ color: colors.warning.main }}
                  >
                    <ReplayIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          ))}

          {queue.length === 0 && (
            <Box
              sx={{
                textAlign: 'center',
                padding: `${spacing.xl}px`,
                color: colors.text.muted,
              }}
            >
              <CloudUploadIcon sx={{ fontSize: 48, mb: `${spacing.sm}px`, opacity: 0.3 }} />
              <Typography sx={{ fontSize: '0.875rem' }}>No queued submissions</Typography>
            </Box>
          )}
        </Box>
      </WrfCard>

      {/* Storage Usage Bar */}
      <WrfCard title="Local Storage Usage" subtitle="IndexedDB offline data store">
        <Box sx={{ mb: `${spacing.md}px` }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: `${spacing.xs}px` }}>
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.text.primary }}>
              {STORAGE_USED_MB.toFixed(1)} MB
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted }}>
              {STORAGE_CAPACITY_MB} MB capacity
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={storagePercent}
            sx={{
              height: 12,
              borderRadius: `${borderRadius.md}px`,
              backgroundColor: colors.bg.tertiary,
              '& .MuiLinearProgress-bar': {
                borderRadius: `${borderRadius.md}px`,
                background:
                  storagePercent > 80
                    ? `linear-gradient(90deg, ${colors.warning.main}, ${colors.error.main})`
                    : `linear-gradient(90deg, ${colors.brand.primary}, ${colors.success.main})`,
              },
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: `${spacing.xs}px` }}>
            <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted }}>
              {storagePercent.toFixed(1)}% used
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted }}>
              {(STORAGE_CAPACITY_MB - STORAGE_USED_MB).toFixed(1)} MB available
            </Typography>
          </Box>
        </Box>

        {/* Storage breakdown */}
        <Box sx={{ display: 'flex', gap: `${spacing.md}px`, flexWrap: 'wrap', mt: `${spacing.md}px` }}>
          {[
            { label: 'Weather Readings', size: 4.2, color: colors.brand.primary },
            { label: 'Air Quality', size: 2.8, color: colors.success.main },
            { label: 'Photos', size: 4.1, color: colors.warning.main },
            { label: 'Soil Data', size: 1.5, color: '#8B5CF6' },
          ].map((item) => (
            <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.xs}px` }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  backgroundColor: item.color,
                  flexShrink: 0,
                }}
              />
              <Typography sx={{ fontSize: '0.75rem', color: colors.text.secondary }}>
                {item.label}: {item.size} MB
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Auto-sync toggle */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mt: `${spacing.lg}px`,
            padding: `${spacing.md}px`,
            borderRadius: `${borderRadius.md}px`,
            backgroundColor: colors.bg.primary,
            border: `1px solid ${colors.border.default}`,
          }}
        >
          <Box>
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.text.primary }}>
              Auto-Sync When Online
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted }}>
              Automatically upload queued data when connectivity is restored
            </Typography>
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: colors.brand.primary,
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: colors.brand.primary,
                  },
                  '& .MuiSwitch-track': {
                    backgroundColor: colors.bg.tertiary,
                  },
                }}
              />
            }
            label=""
            sx={{ margin: 0 }}
          />
        </Box>

        {/* IndexedDB integration comment */}
        {/*
          IndexedDB Integration Points:
          - openDB('wrfcoin-offline', 1) with stores: 'submissions', 'metadata'
          - submissions store: { id, stationId, timestamp, type, data, status, retries, sizeKB }
          - On enqueue: db.add('submissions', reading)
          - On sync success: db.delete('submissions', id)
          - On retry: db.put('submissions', { ...reading, status: 'retrying', retries: retries + 1 })
          - Storage estimate: navigator.storage.estimate() for usage/quota
          - Auto-sync: window.addEventListener('online', syncAllPending)
          - Background sync: navigator.serviceWorker.ready.then(reg => reg.sync.register('sync-queue'))
        */}
      </WrfCard>
    </Box>
  );
};

export default OfflineSubmissionQueue;
