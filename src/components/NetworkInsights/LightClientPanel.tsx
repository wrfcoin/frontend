import DemoSurfaceGate from '../common/DemoSurfaceGate';
import React, { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Switch from '@mui/material/Switch';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import VerifiedIcon from '@mui/icons-material/Verified';
import SyncIcon from '@mui/icons-material/Sync';
import SettingsIcon from '@mui/icons-material/Settings';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { colors, borderRadius, spacing, shadows } from '../ui/tokens';
import WrfCard from '../ui/WrfCard';
import WrfStatCard from '../ui/WrfStatCard';
import WrfBadge from '../ui/WrfBadge';
import WrfButton from '../ui/WrfButton';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VerificationEvent {
  block: number;
  hash: string;
  timestamp: number;
  valid: boolean;
  duration: number; // ms
}

interface HealthIndicator {
  label: string;
  status: 'healthy' | 'warning' | 'error';
  detail: string;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const SYNC_PROGRESS = 97.4;
const CURRENT_BLOCK = 1_842_567;
const HEAD_BLOCK = 1_891_203;
const SYNC_SPEED = 142; // blocks/s

const VERIFICATION_EVENTS: VerificationEvent[] = [
  { block: 1891203, hash: '0xa3f2...8d91', timestamp: Date.now() - 2000, valid: true, duration: 3 },
  { block: 1891202, hash: '0x7b1c...e4f2', timestamp: Date.now() - 14000, valid: true, duration: 4 },
  { block: 1891201, hash: '0xd9e8...3a7c', timestamp: Date.now() - 26000, valid: true, duration: 2 },
  { block: 1891200, hash: '0x4f6a...b12d', timestamp: Date.now() - 38000, valid: false, duration: 18 },
  { block: 1891199, hash: '0x8c3b...f9e5', timestamp: Date.now() - 50000, valid: true, duration: 3 },
  { block: 1891198, hash: '0x1d7f...6a83', timestamp: Date.now() - 62000, valid: true, duration: 5 },
  { block: 1891197, hash: '0xe2c4...0b9f', timestamp: Date.now() - 74000, valid: true, duration: 2 },
  { block: 1891196, hash: '0x5a98...d3c1', timestamp: Date.now() - 86000, valid: true, duration: 4 },
];

const HEALTH_INDICATORS: HealthIndicator[] = [
  { label: 'Peer Connectivity', status: 'healthy', detail: '8/8 peers connected' },
  { label: 'Header Sync', status: 'healthy', detail: 'Synced to tip' },
  { label: 'Proof Verification', status: 'warning', detail: '1 failed proof in last hour' },
  { label: 'Checkpoint Anchoring', status: 'healthy', detail: 'Last checkpoint: 5 min ago' },
  { label: 'Bandwidth Usage', status: 'healthy', detail: '1.2 MB/min' },
  { label: 'Memory', status: 'healthy', detail: '48 MB / 128 MB limit' },
];

const CONFIG_OPTIONS = [
  { key: 'autoSync', label: 'Auto-Sync Headers', description: 'Automatically sync new block headers', enabled: true },
  { key: 'proofCache', label: 'Proof Caching', description: 'Cache Merkle proofs for faster re-verification', enabled: true },
  { key: 'pruneOld', label: 'Prune Old Headers', description: 'Remove headers older than 30 days', enabled: false },
  { key: 'verifyAll', label: 'Full Verification', description: 'Verify all headers, not just checkpoints', enabled: false },
];

// Merkle proof tree data (simplified)
const MERKLE_LEVELS = [
  ['Root: 0xa3f2...8d91'],
  ['0x7b1c...e4f2', '0xd9e8...3a7c'],
  ['0x4f6a...b12d', '0x8c3b...f9e5', '0x1d7f...6a83', '0xe2c4...0b9f'],
  ['Tx1', 'Tx2', 'Tx3', 'Tx4', 'Tx5', 'Tx6', 'Tx7', 'Tx8'],
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const StatusIcon: React.FC<{ status: string }> = ({ status }) => {
  if (status === 'healthy')
    return <CheckCircleIcon sx={{ fontSize: 16, color: colors.success.main }} />;
  if (status === 'warning')
    return <WarningIcon sx={{ fontSize: 16, color: colors.warning.main }} />;
  return <ErrorIcon sx={{ fontSize: 16, color: colors.error.main }} />;
};

const statusToColor = (status: string): string => {
  if (status === 'healthy') return colors.success.main;
  if (status === 'warning') return colors.warning.main;
  return colors.error.main;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const LightClientPanelSample: React.FC = () => {
  const [configState, setConfigState] = useState<Record<string, boolean>>(
    CONFIG_OPTIONS.reduce((acc, opt) => ({ ...acc, [opt.key]: opt.enabled }), {} as Record<string, boolean>),
  );

  const toggleConfig = (key: string) => {
    setConfigState((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // SVG Header Verification Timeline
  const timelineSvg = useMemo(() => {
    const w = 680;
    const h = 80;
    const padding = { left: 10, right: 10, top: 15, bottom: 15 };
    const usable = w - padding.left - padding.right;
    const events = VERIFICATION_EVENTS.slice(0, 8);
    const step = usable / (events.length - 1 || 1);

    return (
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
        {/* Timeline line */}
        <line
          x1={padding.left}
          y1={h / 2}
          x2={w - padding.right}
          y2={h / 2}
          stroke={colors.border.default}
          strokeWidth={2}
        />
        {/* Events */}
        {events.map((ev, i) => {
          const x = padding.left + i * step;
          const col = ev.valid ? colors.success.main : colors.error.main;
          return (
            <g key={ev.block}>
              {/* Connector to circle */}
              <circle cx={x} cy={h / 2} r={8} fill={col} opacity={0.2} />
              <circle cx={x} cy={h / 2} r={5} fill={col} />
              {/* Block number */}
              <text
                x={x}
                y={h / 2 - 14}
                textAnchor="middle"
                fill={colors.text.secondary}
                fontSize={8}
                fontFamily="monospace"
              >
                #{ev.block}
              </text>
              {/* Duration */}
              <text
                x={x}
                y={h / 2 + 22}
                textAnchor="middle"
                fill={colors.text.muted}
                fontSize={7}
                fontFamily="monospace"
              >
                {ev.duration}ms
              </text>
            </g>
          );
        })}
      </svg>
    );
  }, []);

  // SVG Merkle proof tree
  const merkleTreeSvg = useMemo(() => {
    const w = 560;
    const h = 220;
    const levelHeight = h / MERKLE_LEVELS.length;

    return (
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
        {MERKLE_LEVELS.map((level, li) => {
          const nodeCount = level.length;
          const nodeSpacing = w / (nodeCount + 1);
          return level.map((label, ni) => {
            const x = nodeSpacing * (ni + 1);
            const y = li * levelHeight + levelHeight / 2;
            const isRoot = li === 0;
            const isLeaf = li === MERKLE_LEVELS.length - 1;
            const nodeColor = isRoot
              ? colors.brand.primary
              : isLeaf
                ? colors.warning.main
                : colors.success.main;

            // Draw lines to children
            const children: React.ReactNode[] = [];
            if (li < MERKLE_LEVELS.length - 1) {
              const nextLevel = MERKLE_LEVELS[li + 1];
              const nextSpacing = w / (nextLevel.length + 1);
              const childStart = ni * (nextLevel.length / nodeCount);
              const childEnd = (ni + 1) * (nextLevel.length / nodeCount);
              for (let ci = Math.floor(childStart); ci < Math.floor(childEnd); ci++) {
                const cx = nextSpacing * (ci + 1);
                const cy = (li + 1) * levelHeight + levelHeight / 2;
                children.push(
                  <line
                    key={`${li}-${ni}-${ci}`}
                    x1={x}
                    y1={y + 12}
                    x2={cx}
                    y2={cy - 12}
                    stroke={`${colors.border.default}`}
                    strokeWidth={1}
                    strokeDasharray="3 3"
                  />,
                );
              }
            }

            return (
              <g key={`${li}-${ni}`}>
                {children}
                <rect
                  x={x - 38}
                  y={y - 11}
                  width={76}
                  height={22}
                  rx={4}
                  fill={`${nodeColor}22`}
                  stroke={nodeColor}
                  strokeWidth={1}
                />
                <text
                  x={x}
                  y={y + 4}
                  textAnchor="middle"
                  fill={colors.text.primary}
                  fontSize={8}
                  fontFamily="monospace"
                >
                  {label}
                </text>
              </g>
            );
          });
        })}
      </svg>
    );
  }, []);

  const blocksRemaining = HEAD_BLOCK - CURRENT_BLOCK;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: colors.bg.primary,
        padding: `${spacing.lg}px`,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: `${spacing.lg}px`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px` }}>
          <FlashOnIcon sx={{ fontSize: 28, color: colors.warning.main }} />
          <Typography
            sx={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text.primary }}
          >
            Light Client Panel
          </Typography>
          <WrfBadge status="syncing" label="Syncing" size="sm" />
        </Box>
      </Box>

      {/* Stat cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: `${spacing.md}px`,
          marginBottom: `${spacing.lg}px`,
        }}
      >
        <WrfStatCard
          label="Sync Progress"
          value={`${SYNC_PROGRESS}%`}
          trend={1.2}
          trendLabel="per hour"
          color={colors.brand.primary}
          icon={SyncIcon}
          sparklineData={[88, 90, 92, 93, 94, 95, 96, 97.4]}
        />
        <WrfStatCard
          label="Sync Speed"
          value={`${SYNC_SPEED} blk/s`}
          trend={5.3}
          trendLabel="faster"
          color={colors.success.main}
          icon={FlashOnIcon}
          sparklineData={[110, 118, 125, 130, 135, 138, 140, 142]}
        />
        <WrfStatCard
          label="Head Block"
          value={HEAD_BLOCK.toLocaleString()}
          color={colors.brand.primary}
          icon={VerifiedIcon}
        />
        <WrfStatCard
          label="Blocks Remaining"
          value={blocksRemaining.toLocaleString()}
          trend={-12.5}
          trendLabel="catching up"
          color={colors.warning.main}
        />
      </Box>

      {/* Sync progress bar */}
      <WrfCard
        title="Sync Status"
        subtitle={`Block ${CURRENT_BLOCK.toLocaleString()} / ${HEAD_BLOCK.toLocaleString()}`}
        sx={{ marginBottom: `${spacing.lg}px` }}
      >
        <Box sx={{ marginBottom: `${spacing.md}px` }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: `${spacing.xs}px`,
            }}
          >
            <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted }}>
              Genesis
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: colors.brand.primary }}>
              {SYNC_PROGRESS}%
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted }}>
              Head
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={SYNC_PROGRESS}
            sx={{
              height: 12,
              borderRadius: 6,
              backgroundColor: colors.bg.tertiary,
              '& .MuiLinearProgress-bar': {
                borderRadius: 6,
                background: `linear-gradient(90deg, ${colors.brand.primary}, ${colors.success.main})`,
              },
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: `${spacing.lg}px`, flexWrap: 'wrap' }}>
          <Typography sx={{ fontSize: '0.75rem', color: colors.text.secondary }}>
            ETA: ~{Math.round(blocksRemaining / SYNC_SPEED / 60)} min
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: colors.text.secondary }}>
            Speed: {SYNC_SPEED} blocks/sec
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: colors.text.secondary }}>
            Connected peers: 8
          </Typography>
        </Box>
      </WrfCard>

      {/* Main content */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: `${spacing.lg}px`,
          marginBottom: `${spacing.lg}px`,
        }}
      >
        {/* Header verification timeline */}
        <WrfCard
          title="Header Verification Timeline"
          subtitle="Recent block header verification events"
          action={
            <WrfBadge
              status={VERIFICATION_EVENTS.some((e) => !e.valid) ? 'degraded' : 'online'}
              label={VERIFICATION_EVENTS.some((e) => !e.valid) ? '1 Failed' : 'All Valid'}
              size="sm"
            />
          }
        >
          <Box sx={{ overflowX: 'auto' }}>{timelineSvg}</Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${spacing.sm}px`, mt: 2 }}>
            {VERIFICATION_EVENTS.slice(0, 5).map((ev) => (
              <Box
                key={ev.block}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: `${spacing.sm}px`,
                  padding: `${spacing.xs}px ${spacing.sm}px`,
                  backgroundColor: colors.bg.tertiary + '44',
                  borderRadius: `${borderRadius.sm}px`,
                  borderLeft: `3px solid ${ev.valid ? colors.success.main : colors.error.main}`,
                }}
              >
                {ev.valid ? (
                  <CheckCircleIcon sx={{ fontSize: 14, color: colors.success.main }} />
                ) : (
                  <ErrorIcon sx={{ fontSize: 14, color: colors.error.main }} />
                )}
                <Typography
                  sx={{ fontSize: '0.75rem', color: colors.text.primary, fontFamily: 'monospace', flex: 1 }}
                >
                  #{ev.block}
                </Typography>
                <Typography
                  sx={{ fontSize: '0.6875rem', color: colors.text.muted, fontFamily: 'monospace' }}
                >
                  {ev.hash}
                </Typography>
                <Typography
                  sx={{ fontSize: '0.6875rem', color: colors.text.secondary }}
                >
                  {ev.duration}ms
                </Typography>
              </Box>
            ))}
          </Box>
        </WrfCard>

        {/* Merkle proof tree */}
        <WrfCard
          title="Merkle Proof Structure"
          subtitle="Visual representation of the current block's Merkle tree"
          action={<AccountTreeIcon sx={{ fontSize: 20, color: colors.brand.primary }} />}
        >
          <Box sx={{ overflowX: 'auto' }}>{merkleTreeSvg}</Box>
          <Box
            sx={{
              display: 'flex',
              gap: `${spacing.md}px`,
              mt: 2,
              flexWrap: 'wrap',
            }}
          >
            {[
              { label: 'Root', color: colors.brand.primary },
              { label: 'Internal Nodes', color: colors.success.main },
              { label: 'Leaf Transactions', color: colors.warning.main },
            ].map((item) => (
              <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: 2,
                    border: `1px solid ${item.color}`,
                    backgroundColor: `${item.color}22`,
                  }}
                />
                <Typography sx={{ fontSize: '0.6875rem', color: colors.text.secondary }}>
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </WrfCard>
      </Box>

      {/* Bottom row */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: `${spacing.lg}px`,
        }}
      >
        {/* Health indicators */}
        <WrfCard title="Health Indicators" subtitle="Light client subsystem status">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${spacing.sm}px` }}>
            {HEALTH_INDICATORS.map((indicator) => (
              <Box
                key={indicator.label}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: `${spacing.sm}px`,
                  padding: `${spacing.sm}px`,
                  backgroundColor: colors.bg.tertiary + '44',
                  borderRadius: `${borderRadius.sm}px`,
                }}
              >
                <StatusIcon status={indicator.status} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: colors.text.primary }}>
                    {indicator.label}
                  </Typography>
                  <Typography sx={{ fontSize: '0.6875rem', color: colors.text.muted }}>
                    {indicator.detail}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: statusToColor(indicator.status),
                  }}
                />
              </Box>
            ))}
          </Box>
        </WrfCard>

        {/* Configuration panel */}
        <WrfCard
          title="Light Client Configuration"
          subtitle="Toggle client behavior settings"
          action={<SettingsIcon sx={{ fontSize: 20, color: colors.text.muted }} />}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${spacing.xs}px` }}>
            {CONFIG_OPTIONS.map((opt) => (
              <Box
                key={opt.key}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: `${spacing.sm}px`,
                  backgroundColor: colors.bg.tertiary + '44',
                  borderRadius: `${borderRadius.sm}px`,
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0, mr: 2 }}>
                  <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: colors.text.primary }}>
                    {opt.label}
                  </Typography>
                  <Typography sx={{ fontSize: '0.6875rem', color: colors.text.muted }}>
                    {opt.description}
                  </Typography>
                </Box>
                <Switch
                  checked={configState[opt.key]}
                  onChange={() => toggleConfig(opt.key)}
                  size="small"
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
              </Box>
            ))}
          </Box>

          <Box sx={{ mt: 2, display: 'flex', gap: `${spacing.sm}px` }}>
            <WrfButton variant="primary" size="sm">
              Apply Changes
            </WrfButton>
            <WrfButton variant="ghost" size="sm">
              Reset Defaults
            </WrfButton>
          </Box>
        </WrfCard>
      </Box>
    </Box>
  );
};

const LightClientPanel: React.FC<React.ComponentProps<typeof LightClientPanelSample>> = (props) => (
  <DemoSurfaceGate
    testId="light-clients"
    title="Light client telemetry is not live on this testnet"
    description="This preview contains illustrative data or simulated actions, not verified testnet results."
  >
    <LightClientPanelSample {...props} />
  </DemoSurfaceGate>
);

export default LightClientPanel;
