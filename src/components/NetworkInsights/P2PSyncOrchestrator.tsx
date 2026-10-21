import React, { useState, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import RefreshIcon from '@mui/icons-material/Refresh';
import HubIcon from '@mui/icons-material/Hub';
import PeopleIcon from '@mui/icons-material/People';
import SyncIcon from '@mui/icons-material/Sync';
import SpeedIcon from '@mui/icons-material/Speed';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import BlockIcon from '@mui/icons-material/Block';
import SecurityIcon from '@mui/icons-material/Security';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import ShieldIcon from '@mui/icons-material/Shield';
import ReplayIcon from '@mui/icons-material/Replay';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import { colors, borderRadius, spacing } from '../ui/tokens';
import WrfCard from '../ui/WrfCard';
import WrfStatCard from '../ui/WrfStatCard';
import { WrfRiskyActionConfirmation, type ActionSeverity } from '../DesignSystem';
import { usePreflightChecks } from '../../hooks/usePreflightChecks';
import WrfBadge from '../ui/WrfBadge';
import WrfButton from '../ui/WrfButton';
import WrfDataTable from '../ui/WrfDataTable';
import {
  useP2PSyncStatus,
  type P2PPeer,
  type SyncJob,
  type PeerStatus,
  type SyncJobStatus,
  type SyncAction,
  type SyncReadiness,
  type ProofStatus,
  type ReplayStatus,
} from '../../hooks/useP2PSyncStatus';

function peerStatusToBadge(status: PeerStatus): {
  badgeStatus: 'online' | 'syncing' | 'degraded' | 'offline';
  label: string;
} {
  switch (status) {
  case 'syncing':
    return { badgeStatus: 'syncing', label: 'Syncing' };
  case 'idle':
    return { badgeStatus: 'online', label: 'Idle' };
  case 'stalled':
    return { badgeStatus: 'degraded', label: 'Stalled' };
  case 'blacklisted':
    return { badgeStatus: 'offline', label: 'Blacklisted' };
  }
}

function jobStatusToBadge(status: SyncJobStatus): {
  badgeStatus: 'online' | 'syncing' | 'degraded' | 'offline' | 'pending';
  label: string;
} {
  switch (status) {
  case 'active':
    return { badgeStatus: 'syncing', label: 'Active' };
  case 'paused':
    return { badgeStatus: 'pending', label: 'Paused' };
  case 'completed':
    return { badgeStatus: 'online', label: 'Completed' };
  case 'failed':
    return { badgeStatus: 'offline', label: 'Failed' };
  }
}

function readinessToBadge(readiness: SyncReadiness): {
  badgeStatus: 'online' | 'degraded' | 'offline';
  label: string;
} {
  switch (readiness) {
  case 'operational':
    return { badgeStatus: 'online', label: 'Operational' };
  case 'degraded':
    return { badgeStatus: 'degraded', label: 'Degraded' };
  case 'unavailable':
    return { badgeStatus: 'offline', label: 'Unavailable' };
  }
}

function proofToBadge(status: ProofStatus): {
  badgeStatus: 'online' | 'syncing' | 'offline';
  label: string;
} {
  switch (status) {
  case 'verified':
    return { badgeStatus: 'online', label: 'Proof Verified' };
  case 'pending':
    return { badgeStatus: 'syncing', label: 'Proof Pending' };
  case 'failed':
    return { badgeStatus: 'offline', label: 'Proof Failed' };
  }
}

function replayToBadge(status: ReplayStatus): {
  badgeStatus: 'online' | 'degraded' | 'offline';
  label: string;
} {
  switch (status) {
  case 'enforced':
    return { badgeStatus: 'online', label: 'Replay Enforced' };
  case 'at_risk':
    return { badgeStatus: 'degraded', label: 'Replay At Risk' };
  case 'rejected':
    return { badgeStatus: 'offline', label: 'Replay Rejected' };
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1_073_741_824) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  return `${(bytes / 1_073_741_824).toFixed(2)} GB`;
}

function formatLatency(ms: number): { text: string; color: string } {
  if (ms === 0) return { text: '--', color: colors.text.muted };
  if (ms < 50) return { text: `${ms}ms`, color: colors.success.main };
  if (ms < 150) return { text: `${ms}ms`, color: colors.warning.main };
  return { text: `${ms}ms`, color: colors.error.main };
}

function formatTimeRelative(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  if (diff < 0) {
    const absDiff = Math.abs(diff);
    if (absDiff < 60_000) return `in ${Math.floor(absDiff / 1000)}s`;
    if (absDiff < 3_600_000) return `in ${Math.floor(absDiff / 60_000)}m`;
    return `in ${Math.floor(absDiff / 3_600_000)}h`;
  }
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(isoStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncateId(id: string, chars: number = 6): string {
  if (id.length <= chars * 2 + 3) return id;
  return `${id.slice(0, chars)}...${id.slice(-chars)}`;
}

/** Severity mapping for sync orchestrator actions */
const ACTION_SEVERITY: Record<string, ActionSeverity> = {
  trigger_sync: 'medium',
  pause_all: 'high',
  clear_blacklist: 'high',
  pause_job: 'medium',
  resume_job: 'low',
  cancel_job: 'high',
};

const P2PSyncOrchestrator: React.FC = () => {
  const {
    readiness,
    healthScore,
    healthSummary,
    failureCauses,
    proof,
    replay,
    peers,
    syncJobs,
    antiAbuse,
    canOperate,
    loading,
    error,
    actionBusy,
    actionMessage,
    actionError,
    refresh,
    runAction,
  } = useP2PSyncStatus();

  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    description: string;
    severity: ActionSeverity;
    action: () => Promise<void>;
      } | null>(null);

  const preflightChecks = usePreflightChecks({
    requiredCapabilities: ['networkInsights'],
    blockDuringTransition: true,
  });

  const readinessBadge = readinessToBadge(readiness);
  const proofBadge = proofToBadge(proof.status);
  const replayBadge = replayToBadge(replay.status);

  const totalPeers = peers.length;
  const activeSyncJobs = syncJobs.filter(j => j.status === 'active').length;
  const avgLatency = useMemo(() => {
    const connected = peers.filter(p => p.latencyMs > 0);
    if (connected.length === 0) return 0;
    return Math.round(connected.reduce((sum, p) => sum + p.latencyMs, 0) / connected.length);
  }, [peers]);
  const totalBlocksBehind = useMemo(
    () =>
      syncJobs
        .filter(j => j.status === 'active' || j.status === 'paused')
        .reduce((sum, j) => sum + j.blocksRemaining, 0),
    [syncJobs],
  );

  const openConfirm = useCallback(
    (title: string, description: string, action: SyncAction, options?: { jobId?: string; reason?: string; clearLimit?: number }) => {
      setConfirmAction({
        title,
        description,
        severity: ACTION_SEVERITY[action] ?? 'medium',
        action: async () => {
          setConfirmAction(null);
          await runAction(action, options);
        },
      });
    },
    [runAction],
  );

  const handleTriggerSync = useCallback(() => {
    openConfirm(
      'Trigger Guarded Sync',
      'Request a guarded sync round across eligible peers with proof verification.',
      'trigger_sync',
      { reason: 'Operator-triggered guarded sync after health review' },
    );
  }, [openConfirm]);

  const handlePauseAll = useCallback(() => {
    openConfirm(
      'Pause All Sync Jobs',
      'Pause active sync jobs to stabilize orchestration during investigation.',
      'pause_all',
      { reason: 'Operator safety pause during orchestration review' },
    );
  }, [openConfirm]);

  const handleClearBlacklist = useCallback(() => {
    openConfirm(
      'Clear Blacklist (Limited Batch)',
      `Clear up to 3 blacklisted peer(s). Use only after manual trust verification.`,
      'clear_blacklist',
      {
        reason: 'Manual trust review approved temporary peer unblocking',
        clearLimit: 3,
      },
    );
  }, [openConfirm]);

  const peerColumns = useMemo(
    () => [
      {
        key: 'peerId',
        label: 'Peer ID',
        sortable: true,
        render: (val: string) => (
          <Typography
            sx={{ fontSize: '0.8125rem', fontFamily: 'monospace', color: colors.text.primary }}
          >
            {truncateId(val)}
          </Typography>
        ),
      },
      { key: 'address', label: 'Address', sortable: true },
      {
        key: 'syncProgress',
        label: 'Progress',
        sortable: true,
        render: (val: number, row: P2PPeer) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px`, minWidth: 120 }}>
            <LinearProgress
              variant="determinate"
              value={val}
              sx={{
                flex: 1,
                height: 6,
                borderRadius: 3,
                backgroundColor: colors.bg.tertiary,
                '& .MuiLinearProgress-bar': {
                  backgroundColor:
                    row.status === 'blacklisted'
                      ? colors.text.muted
                      : val === 100
                        ? colors.success.main
                        : colors.brand.primary,
                  borderRadius: 3,
                },
              }}
            />
            <Typography sx={{ fontSize: '0.75rem', color: colors.text.secondary, minWidth: 40 }}>
              {val.toFixed(1)}%
            </Typography>
          </Box>
        ),
      },
      {
        key: 'latencyMs',
        label: 'Latency',
        sortable: true,
        render: (val: number) => {
          const lat = formatLatency(val);
          return (
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: lat.color }}>
              {lat.text}
            </Typography>
          );
        },
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        render: (val: PeerStatus) => {
          const badge = peerStatusToBadge(val);
          return <WrfBadge status={badge.badgeStatus} label={badge.label} size="sm" />;
        },
      },
      {
        key: 'bytesTransferred',
        label: 'Transferred',
        sortable: true,
        render: (val: number) => (
          <Typography sx={{ fontSize: '0.8125rem', color: colors.text.secondary }}>
            {formatBytes(val)}
          </Typography>
        ),
      },
      {
        key: 'lastSeen',
        label: 'Last Seen',
        sortable: true,
        render: (val: string) => (
          <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted }}>
            {formatTimeRelative(val)}
          </Typography>
        ),
      },
    ],
    [],
  );

  const jobColumns = useMemo(
    () => [
      {
        key: 'id',
        label: 'Job ID',
        sortable: true,
        render: (val: string) => (
          <Typography
            sx={{ fontSize: '0.8125rem', fontFamily: 'monospace', color: colors.text.primary }}
          >
            {val}
          </Typography>
        ),
      },
      {
        key: 'peerId',
        label: 'Peer',
        sortable: true,
        render: (val: string) => (
          <Typography
            sx={{ fontSize: '0.8125rem', fontFamily: 'monospace', color: colors.text.secondary }}
          >
            {truncateId(val)}
          </Typography>
        ),
      },
      {
        key: 'blocksRemaining',
        label: 'Blocks Left',
        sortable: true,
        render: (val: number) => (
          <Typography sx={{ fontSize: '0.8125rem', color: colors.text.primary, fontWeight: 500 }}>
            {val.toLocaleString()}
          </Typography>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        render: (val: SyncJobStatus) => {
          const badge = jobStatusToBadge(val);
          return <WrfBadge status={badge.badgeStatus} label={badge.label} size="sm" />;
        },
      },
      {
        key: 'startedAt',
        label: 'Started',
        sortable: true,
        render: (val: string) => (
          <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted }}>
            {formatTimeRelative(val)}
          </Typography>
        ),
      },
      {
        key: 'estimatedCompletion',
        label: 'ETA',
        sortable: true,
        render: (val: string, row: SyncJob) => (
          <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted }}>
            {row.status === 'completed' ? 'Done' : formatTimeRelative(val)}
          </Typography>
        ),
      },
      {
        key: '_actions',
        label: 'Actions',
        sortable: false,
        render: (_val: unknown, row: SyncJob) => {
          if (row.status === 'completed') return null;

          return (
            <Box sx={{ display: 'flex', gap: `${spacing.xs}px` }}>
              {row.status === 'active' ? (
                <WrfButton
                  variant="ghost"
                  size="sm"
                  disabled={actionBusy || !canOperate}
                  onClick={() =>
                    openConfirm(
                      `Pause ${row.id}`,
                      'Pause this sync job for safe troubleshooting.',
                      'pause_job',
                      { jobId: row.id, reason: 'Paused by operator for review' },
                    )
                  }
                >
                  <PauseCircleOutlineIcon sx={{ fontSize: 16 }} />
                </WrfButton>
              ) : (
                <WrfButton
                  variant="ghost"
                  size="sm"
                  disabled={actionBusy || !canOperate}
                  onClick={() =>
                    openConfirm(
                      `Resume ${row.id}`,
                      'Resume this sync job with proof verification checks.',
                      'resume_job',
                      { jobId: row.id, reason: 'Resumed by operator after verification' },
                    )
                  }
                >
                  <PlayCircleOutlineIcon sx={{ fontSize: 16 }} />
                </WrfButton>
              )}
              <WrfButton
                variant="ghost"
                size="sm"
                disabled={actionBusy || !canOperate}
                onClick={() =>
                  openConfirm(
                    `Cancel ${row.id}`,
                    'Cancel this sync job and mark as failed with operator reason.',
                    'cancel_job',
                    { jobId: row.id, reason: 'Cancelled by operator during remediation' },
                  )
                }
              >
                <CancelIcon sx={{ fontSize: 16, color: colors.error.main }} />
              </WrfButton>
            </Box>
          );
        },
      },
    ],
    [actionBusy, canOperate, openConfirm],
  );

  if (loading && peers.length === 0) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: colors.bg.primary,
          padding: `${spacing.lg}px`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: `${spacing.md}px`,
        }}
      >
        <CircularProgress sx={{ color: colors.brand.primary }} />
        <Typography sx={{ fontSize: '0.875rem', color: colors.text.secondary }}>
          Loading P2P sync status...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: colors.bg.primary,
        padding: `${spacing.lg}px`,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: `${spacing.lg}px`,
          flexWrap: 'wrap',
          gap: `${spacing.sm}px`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px`, flexWrap: 'wrap' }}>
          <HubIcon sx={{ fontSize: 28, color: colors.brand.primary }} />
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text.primary }}>
            P2P Sync Orchestration
          </Typography>
          <WrfBadge status={readinessBadge.badgeStatus} label={readinessBadge.label} size="sm" />
          <WrfBadge status={proofBadge.badgeStatus} label={proofBadge.label} size="sm" />
          <WrfBadge status={replayBadge.badgeStatus} label={replayBadge.label} size="sm" />
          {error && <WrfBadge status="degraded" label="API unavailable" size="sm" />}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px`, flexWrap: 'wrap' }}>
          <WrfButton
            variant="primary"
            size="sm"
            disabled={actionBusy || !canOperate}
            onClick={handleTriggerSync}
          >
            <SyncIcon sx={{ fontSize: 16, mr: 0.5 }} />
            Trigger Sync
          </WrfButton>
          <WrfButton
            variant="secondary"
            size="sm"
            disabled={actionBusy || !canOperate}
            onClick={handlePauseAll}
          >
            <PauseCircleOutlineIcon sx={{ fontSize: 16, mr: 0.5 }} />
            Pause All
          </WrfButton>
          <WrfButton variant="ghost" size="sm" onClick={refresh}>
            <RefreshIcon
              sx={{
                fontSize: 16,
                mr: 0.5,
                animation: loading ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  from: { transform: 'rotate(0deg)' },
                  to: { transform: 'rotate(360deg)' },
                },
              }}
            />
            Refresh
          </WrfButton>
        </Box>
      </Box>

      {actionMessage && (
        <Box sx={{ mb: `${spacing.md}px` }}>
          <Alert severity="success">{actionMessage}</Alert>
        </Box>
      )}
      {actionError && (
        <Box sx={{ mb: `${spacing.md}px` }}>
          <Alert severity="error">{actionError}</Alert>
        </Box>
      )}
      {!canOperate && (
        <Box sx={{ mb: `${spacing.md}px` }}>
          <Alert severity="info">
            Read-only mode: orchestrator actions require `sync:operate` authorization.
          </Alert>
        </Box>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: `${spacing.md}px`,
          marginBottom: `${spacing.lg}px`,
        }}
      >
        <WrfStatCard
          label="Total Peers"
          value={totalPeers.toString()}
          color={colors.brand.primary}
          icon={PeopleIcon}
        />
        <WrfStatCard
          label="Active Sync Jobs"
          value={activeSyncJobs.toString()}
          color={colors.success.main}
          icon={SyncIcon}
        />
        <WrfStatCard
          label="Health Score"
          value={error ? 'unavailable' : `${healthScore.toFixed(0)}%`}
          color={
            readiness === 'operational'
              ? colors.success.main
              : readiness === 'degraded'
                ? colors.warning.main
                : colors.error.main
          }
          icon={HealthAndSafetyIcon}
        />
        <WrfStatCard
          label="Blocks Behind"
          value={totalBlocksBehind.toLocaleString()}
          color={totalBlocksBehind > 0 ? colors.warning.main : colors.success.main}
          icon={ViewInArIcon}
        />
      </Box>

      <Box sx={{ marginBottom: `${spacing.lg}px` }}>
        <WrfCard
          title="Orchestration Health"
          subtitle={healthSummary}
          action={<WrfBadge status={readinessBadge.badgeStatus} label={readinessBadge.label} size="sm" />}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: `${spacing.md}px`,
            }}
          >
            <Box
              sx={{
                padding: `${spacing.md}px`,
                backgroundColor: colors.bg.tertiary + '44',
                borderRadius: `${borderRadius.md}px`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px`, mb: 1 }}>
                <VerifiedUserIcon sx={{ fontSize: 18, color: colors.brand.primary }} />
                <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: colors.text.secondary }}>
                  Proof Verification
                </Typography>
              </Box>
              <WrfBadge status={proofBadge.badgeStatus} label={proofBadge.label} size="sm" />
            </Box>

            <Box
              sx={{
                padding: `${spacing.md}px`,
                backgroundColor: colors.bg.tertiary + '44',
                borderRadius: `${borderRadius.md}px`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px`, mb: 1 }}>
                <ReplayIcon sx={{ fontSize: 18, color: colors.brand.primary }} />
                <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: colors.text.secondary }}>
                  Replay Protection
                </Typography>
              </Box>
              <WrfBadge status={replayBadge.badgeStatus} label={replayBadge.label} size="sm" />
            </Box>
          </Box>

          {failureCauses.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${spacing.sm}px`, mt: `${spacing.md}px` }}>
              {failureCauses.slice(0, 5).map(cause => (
                <Box
                  key={`${cause.code}-${cause.since}`}
                  sx={{
                    padding: `${spacing.sm}px`,
                    borderRadius: `${borderRadius.sm}px`,
                    backgroundColor:
                      cause.severity === 'critical'
                        ? colors.error.main + '11'
                        : colors.warning.main + '11',
                    borderLeft: `3px solid ${
                      cause.severity === 'critical' ? colors.error.main : colors.warning.main
                    }`,
                  }}
                >
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: colors.text.primary }}>
                    {cause.code}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: colors.text.secondary }}>
                    {cause.message}
                  </Typography>
                  <Typography sx={{ fontSize: '0.6875rem', color: colors.text.muted }}>
                    Remediation: {cause.remediation}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </WrfCard>
      </Box>

      <Box sx={{ marginBottom: `${spacing.lg}px` }}>
        <WrfCard
          title="Peer Connections"
          subtitle="Connected peers and their sync status"
          action={
            <Typography sx={{ fontSize: '0.6875rem', color: colors.text.muted }}>
              {peers.filter(p => p.status !== 'blacklisted').length} connected
            </Typography>
          }
        >
          <WrfDataTable
            columns={peerColumns}
            data={peers}
            searchable
            exportable
            pagination
            pageSize={10}
            emptyMessage="No peers connected"
            loading={loading && peers.length === 0}
          />
        </WrfCard>
      </Box>

      <Box sx={{ marginBottom: `${spacing.lg}px` }}>
        <WrfCard
          title="Sync Job Manager"
          subtitle="Active, paused, failed, and completed synchronization jobs"
          action={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px` }}>
              <Typography sx={{ fontSize: '0.6875rem', color: colors.text.muted }}>
                {activeSyncJobs} active
              </Typography>
              <WrfBadge
                status={activeSyncJobs > 0 ? 'syncing' : 'online'}
                label={activeSyncJobs > 0 ? 'Syncing' : 'Idle'}
                size="sm"
              />
            </Box>
          }
        >
          <WrfDataTable
            columns={jobColumns}
            data={syncJobs}
            searchable={false}
            pagination={false}
            emptyMessage="No sync jobs"
            loading={loading && syncJobs.length === 0}
          />
        </WrfCard>
      </Box>

      <WrfCard
        title="Anti-Abuse Dashboard"
        subtitle="Rate limiting, burst control, and peer blacklist guardrails"
        action={
          <WrfButton
            variant="ghost"
            size="sm"
            disabled={actionBusy || !canOperate || antiAbuse.blacklistedPeers.length === 0}
            onClick={handleClearBlacklist}
          >
            <DeleteSweepIcon sx={{ fontSize: 16, mr: 0.5 }} />
            Clear Blacklist
          </WrfButton>
        }
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
            gap: `${spacing.md}px`,
            marginBottom: `${spacing.lg}px`,
          }}
        >
          <Box
            sx={{
              padding: `${spacing.md}px`,
              backgroundColor: colors.bg.tertiary + '44',
              borderRadius: `${borderRadius.md}px`,
              borderLeft: `3px solid ${colors.warning.main}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px`, mb: 1 }}>
              <SpeedIcon sx={{ fontSize: 18, color: colors.warning.main }} />
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: colors.text.secondary }}>
                Rate-Limited Actors
              </Typography>
            </Box>
            <Typography
              sx={{
                fontSize: '2rem',
                fontWeight: 700,
                color: colors.warning.main,
                fontFamily: 'monospace',
              }}
            >
              {antiAbuse.rateLimitedPeers}
            </Typography>
            {(antiAbuse.rateLimitPerMinute || antiAbuse.burstLimitPer10Seconds) && (
              <Typography sx={{ fontSize: '0.6875rem', color: colors.text.muted }}>
                Limit: {antiAbuse.rateLimitPerMinute || 0}/min, Burst: {antiAbuse.burstLimitPer10Seconds || 0}/10s
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              padding: `${spacing.md}px`,
              backgroundColor: colors.bg.tertiary + '44',
              borderRadius: `${borderRadius.md}px`,
              borderLeft: `3px solid ${colors.error.main}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px`, mb: 1 }}>
              <BlockIcon sx={{ fontSize: 18, color: colors.error.main }} />
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: colors.text.secondary }}>
                Requests Blocked
              </Typography>
            </Box>
            <Typography
              sx={{
                fontSize: '2rem',
                fontWeight: 700,
                color: colors.error.main,
                fontFamily: 'monospace',
              }}
            >
              {antiAbuse.totalRequestsBlocked.toLocaleString()}
            </Typography>
          </Box>

          <Box
            sx={{
              padding: `${spacing.md}px`,
              backgroundColor: colors.bg.tertiary + '44',
              borderRadius: `${borderRadius.md}px`,
              borderLeft: `3px solid ${colors.brand.primary}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px`, mb: 1 }}>
              <SecurityIcon sx={{ fontSize: 18, color: colors.brand.primary }} />
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: colors.text.secondary }}>
                Monitoring Window
              </Typography>
            </Box>
            <Typography
              sx={{
                fontSize: '1rem',
                fontWeight: 500,
                color: colors.text.primary,
                fontFamily: 'monospace',
              }}
            >
              Since {formatTimeRelative(antiAbuse.windowStart)}
            </Typography>
          </Box>
        </Box>

        {antiAbuse.blacklistedPeers.length > 0 ? (
          <Box>
            <Typography
              sx={{
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: colors.text.secondary,
                mb: 1,
              }}
            >
              Blacklisted Peers ({antiAbuse.blacklistedPeers.length})
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${spacing.xs}px` }}>
              {antiAbuse.blacklistedPeers.map(peerId => (
                <Box
                  key={peerId}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: `${spacing.sm}px`,
                    backgroundColor: colors.error.main + '11',
                    borderRadius: `${borderRadius.sm}px`,
                    borderLeft: `3px solid ${colors.error.main}`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px` }}>
                    <BlockIcon sx={{ fontSize: 14, color: colors.error.main }} />
                    <Typography
                      sx={{
                        fontSize: '0.8125rem',
                        fontFamily: 'monospace',
                        color: colors.text.primary,
                      }}
                    >
                      {peerId}
                    </Typography>
                  </Box>
                  <WrfBadge status="offline" label="Blacklisted" size="sm" />
                </Box>
              ))}
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: `${spacing.sm}px`,
              padding: `${spacing.md}px`,
              backgroundColor: colors.success.main + '11',
              borderRadius: `${borderRadius.sm}px`,
              borderLeft: `3px solid ${colors.success.main}`,
            }}
          >
            <ShieldIcon sx={{ fontSize: 16, color: colors.success.main }} />
            <Typography sx={{ fontSize: '0.8125rem', color: colors.text.secondary }}>
              No peers are currently blacklisted.
            </Typography>
          </Box>
        )}
      </WrfCard>

      {confirmAction && (
        <WrfRiskyActionConfirmation
          open={true}
          title={confirmAction.title}
          description={confirmAction.description}
          severity={confirmAction.severity}
          preflightChecks={preflightChecks}
          onConfirm={confirmAction.action}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </Box>
  );
};

export default P2PSyncOrchestrator;
