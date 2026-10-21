import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import RefreshIcon from '@mui/icons-material/Refresh';
import ShieldIcon from '@mui/icons-material/Shield';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import SyncIcon from '@mui/icons-material/Sync';
import ReplayIcon from '@mui/icons-material/Replay';
import StorageIcon from '@mui/icons-material/Storage';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import { colors, borderRadius, spacing } from '../ui/tokens';
import WrfCard from '../ui/WrfCard';
import WrfStatCard from '../ui/WrfStatCard';
import WrfBadge from '../ui/WrfBadge';
import WrfButton from '../ui/WrfButton';
import {
  useStateSyncStatus,
  type ProofStatus,
  type SyncOperation,
  type ReplayStatus,
  type SyncReadiness,
  type SyncAction,
} from '../../hooks/useStateSyncStatus';

function proofStatusToBadge(status: ProofStatus): {
  badgeStatus: 'online' | 'syncing' | 'degraded' | 'offline';
  label: string;
} {
  switch (status) {
  case 'verified':
    return { badgeStatus: 'online', label: 'Verified' };
  case 'pending':
    return { badgeStatus: 'syncing', label: 'Pending' };
  case 'failed':
    return { badgeStatus: 'offline', label: 'Failed' };
  }
}

function replayStatusToBadge(status: ReplayStatus): {
  badgeStatus: 'online' | 'degraded' | 'offline';
  label: string;
} {
  switch (status) {
  case 'enforced':
    return { badgeStatus: 'online', label: 'Enforced' };
  case 'at_risk':
    return { badgeStatus: 'degraded', label: 'At Risk' };
  case 'rejected':
    return { badgeStatus: 'offline', label: 'Rejected' };
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

function proofStatusColor(status: ProofStatus): string {
  switch (status) {
  case 'verified':
    return colors.success.main;
  case 'pending':
    return colors.warning.main;
  case 'failed':
    return colors.error.main;
  }
}

function truncateHex(hex: string, chars: number = 8): string {
  if (!hex) return '--';
  if (hex.length <= chars * 2 + 3) return hex;
  return `${hex.slice(0, chars)}...${hex.slice(-chars)}`;
}

function formatTimestamp(ts: number): string {
  if (!ts) return '--';
  const date = new Date(ts);
  const now = Date.now();
  const diffMs = now - ts;

  if (diffMs < 60_000) return 'just now';
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
  if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}h ago`;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const ProofStatusIcon: React.FC<{ status: ProofStatus }> = ({ status }) => {
  switch (status) {
  case 'verified':
    return <CheckCircleIcon sx={{ fontSize: 16, color: colors.success.main }} />;
  case 'pending':
    return <WarningIcon sx={{ fontSize: 16, color: colors.warning.main }} />;
  case 'failed':
    return <ErrorIcon sx={{ fontSize: 16, color: colors.error.main }} />;
  }
};

const SyncOperationRow: React.FC<{ op: SyncOperation }> = ({ op }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: `${spacing.sm}px`,
      padding: `${spacing.sm}px`,
      backgroundColor: colors.bg.tertiary + '44',
      borderRadius: `${borderRadius.sm}px`,
      borderLeft: `3px solid ${op.verified ? colors.success.main : colors.warning.main}`,
    }}
  >
    {op.verified ? (
      <CheckCircleIcon sx={{ fontSize: 14, color: colors.success.main, flexShrink: 0 }} />
    ) : (
      <WarningIcon sx={{ fontSize: 14, color: colors.warning.main, flexShrink: 0 }} />
    )}
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.xs}px` }}>
        <Typography
          sx={{
            fontSize: '0.75rem',
            fontWeight: 500,
            color: colors.text.primary,
            fontFamily: 'monospace',
          }}
        >
          Height {op.height.toLocaleString()}
        </Typography>
        <Typography
          sx={{
            fontSize: '0.6875rem',
            color: colors.text.muted,
            fontFamily: 'monospace',
          }}
        >
          {truncateHex(op.id)}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px`, mt: '2px' }}>
        <Typography sx={{ fontSize: '0.6875rem', color: colors.text.secondary }}>
          Signer: {truncateHex(op.signerId, 6)}
        </Typography>
        {op.entryCount > 0 && (
          <Typography sx={{ fontSize: '0.6875rem', color: colors.text.muted }}>
            {op.entryCount} attestation{op.entryCount !== 1 ? 's' : ''}
          </Typography>
        )}
      </Box>
    </Box>
    <Typography sx={{ fontSize: '0.6875rem', color: colors.text.muted, flexShrink: 0 }}>
      {formatTimestamp(op.timestamp)}
    </Typography>
  </Box>
);

const StateSyncPanel: React.FC = () => {
  const {
    readiness,
    healthScore,
    healthSummary,
    failureCauses,
    snapshotHeight,
    proofStatus,
    replayStatus,
    replayNonce,
    recentSyncOps,
    stateRootHex,
    snapshotRootHex,
    entryCount,
    remediationActions,
    canOperate,
    loading,
    error,
    lastUpdated,
    remediationBusy,
    remediationMessage,
    remediationError,
    refresh,
    runRemediation,
  } = useStateSyncStatus();

  const proofBadge = proofStatusToBadge(proofStatus);
  const replayBadge = replayStatusToBadge(replayStatus);
  const readinessBadge = readinessToBadge(readiness);

  const handleRemediation = async (action: SyncAction) => {
    if (action === 'trigger_sync') {
      await runRemediation('trigger_sync', {
        reason: 'Operator-triggered guarded sync after health review',
      });
      return;
    }

    if (action === 'pause_all') {
      await runRemediation('pause_all', {
        reason: 'Safety pause requested by operator',
      });
      return;
    }

    if (action === 'clear_blacklist') {
      await runRemediation('clear_blacklist', {
        reason: 'Manual trust review approved temporary unblock batch',
        clearLimit: 3,
      });
    }
  };

  if (loading && snapshotHeight === null) {
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
          Loading state sync status...
        </Typography>
      </Box>
    );
  }

  if (error && snapshotHeight === null) {
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
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px` }}>
            <ShieldIcon sx={{ fontSize: 28, color: colors.error.main }} />
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text.primary }}>
              State Sync & Replay Protection
            </Typography>
            <WrfBadge status="offline" label="Unavailable" size="sm" />
          </Box>
        </Box>
        <WrfCard title="Backend Unavailable" subtitle="Could not connect to the sync orchestrator">
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: `${spacing.md}px`,
              padding: `${spacing.xl}px`,
            }}
          >
            <ErrorIcon sx={{ fontSize: 48, color: colors.error.main, opacity: 0.6 }} />
            <Typography sx={{ fontSize: '0.875rem', color: colors.text.secondary, textAlign: 'center' }}>
              {error}
            </Typography>
            <WrfButton variant="secondary" size="sm" onClick={refresh}>
              <RefreshIcon sx={{ fontSize: 16, mr: 1 }} />
              Retry Connection
            </WrfButton>
          </Box>
        </WrfCard>
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
          gap: `${spacing.sm}px`,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px` }}>
          <ShieldIcon sx={{ fontSize: 28, color: proofStatusColor(proofStatus) }} />
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text.primary }}>
            State Sync & Replay Protection
          </Typography>
          <WrfBadge status={readinessBadge.badgeStatus} label={readinessBadge.label} size="sm" />
          <WrfBadge status={proofBadge.badgeStatus} label={`Proof ${proofBadge.label}`} size="sm" />
          <WrfBadge status={replayBadge.badgeStatus} label={`Replay ${replayBadge.label}`} size="sm" />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px`, flexWrap: 'wrap' }}>
          {lastUpdated && (
            <Typography sx={{ fontSize: '0.6875rem', color: colors.text.muted }}>
              Updated {formatTimestamp(lastUpdated)}
            </Typography>
          )}
          {remediationActions
            .filter(action => action.action !== 'resume_job')
            .slice(0, 3)
            .map(action => (
              <WrfButton
                key={action.id}
                variant="secondary"
                size="sm"
                disabled={remediationBusy || !canOperate || !action.enabled}
                onClick={() => handleRemediation(action.action)}
              >
                {action.label}
              </WrfButton>
            ))}
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

      {remediationMessage && (
        <Box sx={{ mb: `${spacing.md}px` }}>
          <Alert severity="success">{remediationMessage}</Alert>
        </Box>
      )}
      {remediationError && (
        <Box sx={{ mb: `${spacing.md}px` }}>
          <Alert severity="error">{remediationError}</Alert>
        </Box>
      )}
      {!canOperate && (
        <Box sx={{ mb: `${spacing.md}px` }}>
          <Alert severity="info">
            Read-only mode: sync remediation actions require `sync:operate` authorization.
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
          label="Snapshot Height"
          value={snapshotHeight !== null ? snapshotHeight.toLocaleString() : '--'}
          color={colors.brand.primary}
          icon={StorageIcon}
        />
        <WrfStatCard
          label="Health Score"
          value={`${healthScore.toFixed(0)}%`}
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
          label="Proof State"
          value={proofBadge.label}
          color={proofStatusColor(proofStatus)}
          icon={VerifiedUserIcon}
        />
        <WrfStatCard
          label="Replay Nonce"
          value={replayNonce.toLocaleString()}
          color={colors.brand.primary}
          icon={FingerprintIcon}
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: `${spacing.lg}px`,
          marginBottom: `${spacing.lg}px`,
        }}
      >
        <WrfCard
          title="Orchestration Readiness"
          subtitle="Real readiness, health, and failure causes for state-sync"
          action={<WrfBadge status={readinessBadge.badgeStatus} label={readinessBadge.label} size="sm" />}
        >
          <Typography sx={{ fontSize: '0.8125rem', color: colors.text.secondary, mb: `${spacing.sm}px` }}>
            {healthSummary}
          </Typography>

          {failureCauses.length === 0 && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: `${spacing.sm}px`,
                padding: `${spacing.sm}px`,
                backgroundColor: colors.success.main + '11',
                borderRadius: `${borderRadius.sm}px`,
                borderLeft: `3px solid ${colors.success.main}`,
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 14, color: colors.success.main }} />
              <Typography sx={{ fontSize: '0.75rem', color: colors.text.secondary }}>
                No active failure causes.
              </Typography>
            </Box>
          )}

          {failureCauses.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${spacing.sm}px` }}>
              {failureCauses.slice(0, 5).map(cause => (
                <Box
                  key={`${cause.code}-${cause.since}`}
                  sx={{
                    padding: `${spacing.sm}px`,
                    backgroundColor:
                      cause.severity === 'critical'
                        ? colors.error.main + '11'
                        : colors.warning.main + '11',
                    borderRadius: `${borderRadius.sm}px`,
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

        <WrfCard
          title="Proof & Replay Controls"
          subtitle="Explicit proof verification and replay protection states"
          action={<ProofStatusIcon status={proofStatus} />}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${spacing.sm}px` }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: `${spacing.sm}px`,
                backgroundColor: colors.bg.tertiary + '44',
                borderRadius: `${borderRadius.sm}px`,
              }}
            >
              <Typography sx={{ fontSize: '0.8125rem', color: colors.text.secondary }}>
                Proof Verification
              </Typography>
              <WrfBadge status={proofBadge.badgeStatus} label={proofBadge.label} size="sm" />
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: `${spacing.sm}px`,
                backgroundColor: colors.bg.tertiary + '44',
                borderRadius: `${borderRadius.sm}px`,
              }}
            >
              <Typography sx={{ fontSize: '0.8125rem', color: colors.text.secondary }}>
                Replay Protection
              </Typography>
              <WrfBadge status={replayBadge.badgeStatus} label={replayBadge.label} size="sm" />
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: `${spacing.sm}px`,
                backgroundColor: colors.bg.tertiary + '44',
                borderRadius: `${borderRadius.sm}px`,
              }}
            >
              <Typography sx={{ fontSize: '0.8125rem', color: colors.text.secondary }}>
                State Root
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: colors.text.primary, fontFamily: 'monospace' }}>
                {stateRootHex ? truncateHex(stateRootHex, 10) : '--'}
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: `${spacing.sm}px`,
                backgroundColor: colors.bg.tertiary + '44',
                borderRadius: `${borderRadius.sm}px`,
              }}
            >
              <Typography sx={{ fontSize: '0.8125rem', color: colors.text.secondary }}>
                Snapshot Root
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: colors.text.primary, fontFamily: 'monospace' }}>
                {snapshotRootHex ? truncateHex(snapshotRootHex, 10) : '--'}
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: `${spacing.sm}px`,
                backgroundColor: colors.bg.tertiary + '44',
                borderRadius: `${borderRadius.sm}px`,
              }}
            >
              <Typography sx={{ fontSize: '0.8125rem', color: colors.text.secondary }}>
                Tracked Entries
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: colors.text.primary, fontFamily: 'monospace' }}>
                {entryCount.toLocaleString()}
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: `${spacing.sm}px`,
                padding: `${spacing.sm}px`,
                backgroundColor: colors.bg.tertiary + '44',
                borderRadius: `${borderRadius.sm}px`,
              }}
            >
              <ReplayIcon sx={{ fontSize: 16, color: colors.brand.primary }} />
              <Typography sx={{ fontSize: '0.8125rem', color: colors.text.secondary }}>
                Current replay nonce baseline: {replayNonce.toLocaleString()}
              </Typography>
            </Box>
          </Box>
        </WrfCard>
      </Box>

      <WrfCard
        title="Recent Sync Operations"
        subtitle="Verified and pending state synchronization events"
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px` }}>
            <Typography sx={{ fontSize: '0.6875rem', color: colors.text.muted }}>
              {recentSyncOps.length} operation{recentSyncOps.length !== 1 ? 's' : ''}
            </Typography>
            <WrfBadge
              status={
                recentSyncOps.length > 0 && recentSyncOps.every(op => op.verified)
                  ? 'online'
                  : recentSyncOps.length > 0
                    ? 'degraded'
                    : 'offline'
              }
              label={
                recentSyncOps.length > 0 && recentSyncOps.every(op => op.verified)
                  ? 'All Verified'
                  : recentSyncOps.length > 0
                    ? 'Mixed'
                    : 'No Data'
              }
              size="sm"
            />
          </Box>
        }
      >
        {recentSyncOps.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${spacing.sm}px` }}>
            {recentSyncOps.slice(0, 10).map(op => (
              <SyncOperationRow key={op.id} op={op} />
            ))}
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: `${spacing.xl}px`,
              gap: `${spacing.sm}px`,
            }}
          >
            <SyncIcon sx={{ fontSize: 36, color: colors.text.muted, opacity: 0.4 }} />
            <Typography sx={{ fontSize: '0.875rem', color: colors.text.muted }}>
              No recent sync operations recorded
            </Typography>
          </Box>
        )}
      </WrfCard>
    </Box>
  );
};

export default StateSyncPanel;
