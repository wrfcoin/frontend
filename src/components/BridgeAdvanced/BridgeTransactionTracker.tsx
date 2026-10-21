import DemoSurfaceGate from '../common/DemoSurfaceGate';
import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  Tabs,
  Tab,
  Tooltip,
  Button,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SpeedIcon from '@mui/icons-material/Speed';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ScienceIcon from '@mui/icons-material/Science';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import BlockIcon from '@mui/icons-material/Block';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import WrfCard from '../ui/WrfCard';
import WrfStatCard from '../ui/WrfStatCard';
import WrfBadge from '../ui/WrfBadge';
import WrfDataTable from '../ui/WrfDataTable';
import { colors, borderRadius, spacing } from '../ui/tokens';
import { useBridgeTrustMode, type BridgeTrustMode } from '../../hooks/useBridgeTrustMode';
import { useCapabilities, type FeatureStatus, type FeatureStatusEntry } from '../../hooks/useCapabilities';
import { StoreConsistencyBanner } from '../StoreConsistencyBanner';
import { useBridgeFinalityStatus } from '../../hooks/useBridgeFinalityStatus';
import { capabilityReasonLabel } from '../../lib/capabilityReasons';

// ---------------------------------------------------------------------------
// Trust Mode UI Configuration
// ---------------------------------------------------------------------------

const TRUST_MODE_CONFIG: Record<BridgeTrustMode, {
  badgeStatus: 'online' | 'pending' | 'degraded' | 'offline';
  label: string;
  icon: React.ReactNode;
  borderColor: string;
  bgColor: string;
  textColor: string;
  bannerMessage: string;
}> = {
  'production-verified': {
    badgeStatus: 'online',
    label: 'Production Verified',
    icon: <VerifiedUserIcon sx={{ fontSize: 14 }} />,
    borderColor: colors.success.main,
    bgColor: `${colors.success.main}12`,
    textColor: colors.success.main,
    bannerMessage: 'Bridge transfers are production-verified with active validator attestation.',
  },
  'local-manager': {
    badgeStatus: 'pending',
    label: 'Local Manager',
    icon: <WarningAmberIcon sx={{ fontSize: 14 }} />,
    borderColor: colors.brand.primary,
    bgColor: `${colors.brand.primary}12`,
    textColor: colors.brand.primary,
    bannerMessage: 'Bridge is operational but running in local manager mode without validator attestation. Transfers are not independently verified.',
  },
  simulated: {
    badgeStatus: 'degraded',
    label: 'Simulated',
    icon: <ScienceIcon sx={{ fontSize: 14 }} />,
    borderColor: colors.warning.main,
    bgColor: `${colors.warning.main}12`,
    textColor: colors.warning.main,
    bannerMessage: 'Bridge is operating in simulated mode. Transfers shown here are NOT production-verified and may not reflect real on-chain state.',
  },
  unavailable: {
    badgeStatus: 'offline',
    label: 'Unavailable',
    icon: <BlockIcon sx={{ fontSize: 14 }} />,
    borderColor: colors.error.main,
    bgColor: `${colors.error.main}12`,
    textColor: colors.error.main,
    bannerMessage: 'Bridge operations are currently halted. No new transfers can be processed.',
  },
};

const L2_READINESS_SIGNALS: Array<{ key: 'l2Prover' | 'l2Verifier' | 'l1Finality'; label: string }> = [
  { key: 'l2Prover', label: 'L2 Prover' },
  { key: 'l2Verifier', label: 'L2 Verifier' },
  { key: 'l1Finality', label: 'L1 Finality' },
];

function mapCapabilityStatusToBadge(
  status: FeatureStatus | undefined,
): 'online' | 'degraded' | 'offline' {
  if (status === 'operational') {
    return 'online';
  }
  if (status === 'degraded') {
    return 'degraded';
  }
  return 'offline';
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHAINS: Record<string, { name: string; color: string }> = {
  ethereum: { name: 'Ethereum', color: '#627EEA' },
  polygon: { name: 'Polygon', color: '#8247E5' },
  bsc: { name: 'BSC', color: '#F3BA2F' },
  avalanche: { name: 'Avalanche', color: '#E84142' },
  cosmos: { name: 'Cosmos', color: '#2E3148' },
  polkadot: { name: 'Polkadot', color: '#E6007A' },
  solana: { name: 'Solana', color: '#14F195' },
};

const BRIDGE_STEPS = ['Source Confirmed', 'Relay Processing', 'Destination Pending', 'Complete'];

type TransferStatus = 'in-progress' | 'completed' | 'failed';

interface ActiveTransfer {
  id: string;
  sourceChain: string;
  destChain: string;
  token: string;
  amount: number;
  protocol: string;
  activeStep: number;
  status: TransferStatus;
  startedAt: string;
  estimatedCompletion: string;
  sourceTxHash: string;
  destTxHash: string | null;
  fee: number;
}

const ACTIVE_TRANSFERS: ActiveTransfer[] = [
  {
    id: 'BR-10482',
    sourceChain: 'ethereum',
    destChain: 'polygon',
    token: 'WRF',
    amount: 25000,
    protocol: 'Axelar',
    activeStep: 2,
    status: 'in-progress',
    startedAt: '2026-02-14 10:23:15',
    estimatedCompletion: '2026-02-14 10:26:15',
    sourceTxHash: '0xa3f1...8e2d',
    destTxHash: null,
    fee: 4.80,
  },
  {
    id: 'BR-10481',
    sourceChain: 'polygon',
    destChain: 'bsc',
    token: 'USDC',
    amount: 50000,
    protocol: 'Stargate',
    activeStep: 1,
    status: 'in-progress',
    startedAt: '2026-02-14 10:20:42',
    estimatedCompletion: '2026-02-14 10:24:42',
    sourceTxHash: '0x7b2e...f1a4',
    destTxHash: null,
    fee: 3.20,
  },
  {
    id: 'BR-10480',
    sourceChain: 'ethereum',
    destChain: 'avalanche',
    token: 'ETH',
    amount: 5.2,
    protocol: 'LayerZero',
    activeStep: 3,
    status: 'in-progress',
    startedAt: '2026-02-14 10:18:05',
    estimatedCompletion: '2026-02-14 10:20:05',
    sourceTxHash: '0x4c9d...b3e7',
    destTxHash: '0x8f2a...d6c1',
    fee: 7.50,
  },
];

interface HistoryEntry {
  id: string;
  sourceChain: string;
  destChain: string;
  token: string;
  amount: number;
  protocol: string;
  status: TransferStatus;
  completedAt: string;
  duration: string;
  fee: number;
  sourceTxHash: string;
  destTxHash: string;
}

const HISTORY: HistoryEntry[] = [
  { id: 'BR-10479', sourceChain: 'ethereum', destChain: 'polygon', token: 'WRF', amount: 10000, protocol: 'Wormhole', status: 'completed', completedAt: '2026-02-14 09:55:12', duration: '4m 32s', fee: 5.80, sourceTxHash: '0x1a3b...c5d7', destTxHash: '0x9e4f...a2b8' },
  { id: 'BR-10478', sourceChain: 'bsc', destChain: 'ethereum', token: 'USDT', amount: 75000, protocol: 'Synapse', status: 'completed', completedAt: '2026-02-14 09:42:08', duration: '2m 48s', fee: 8.40, sourceTxHash: '0x5c7d...e1f2', destTxHash: '0x3b6a...d4c9' },
  { id: 'BR-10477', sourceChain: 'avalanche', destChain: 'polygon', token: 'AVAX', amount: 320, protocol: 'Hop', status: 'completed', completedAt: '2026-02-14 09:28:55', duration: '9m 15s', fee: 5.20, sourceTxHash: '0x8e2f...b7a3', destTxHash: '0x6d1c...f8e5' },
  { id: 'BR-10476', sourceChain: 'ethereum', destChain: 'solana', token: 'WBTC', amount: 0.85, protocol: 'Wormhole', status: 'failed', completedAt: '2026-02-14 09:15:22', duration: '--', fee: 0, sourceTxHash: '0x2f4a...c9d1', destTxHash: '' },
  { id: 'BR-10475', sourceChain: 'polygon', destChain: 'ethereum', token: 'DAI', amount: 42000, protocol: 'Stargate', status: 'completed', completedAt: '2026-02-14 08:58:40', duration: '3m 52s', fee: 3.80, sourceTxHash: '0x7a3c...e5f8', destTxHash: '0x1d9b...a4c2' },
  { id: 'BR-10474', sourceChain: 'ethereum', destChain: 'cosmos', token: 'ATOM', amount: 1500, protocol: 'Axelar', status: 'completed', completedAt: '2026-02-14 08:45:18', duration: '3m 10s', fee: 4.60, sourceTxHash: '0x9e1d...b8f3', destTxHash: '0x4c7a...d2e6' },
  { id: 'BR-10473', sourceChain: 'bsc', destChain: 'polygon', token: 'BNB', amount: 28, protocol: 'LayerZero', status: 'completed', completedAt: '2026-02-14 08:32:05', duration: '1m 55s', fee: 6.90, sourceTxHash: '0x3f5b...a1c8', destTxHash: '0x8d2e...f7b4' },
  { id: 'BR-10472', sourceChain: 'ethereum', destChain: 'polkadot', token: 'DOT', amount: 850, protocol: 'Wormhole', status: 'completed', completedAt: '2026-02-14 08:18:33', duration: '5m 22s', fee: 6.20, sourceTxHash: '0x6b4c...d3e9', destTxHash: '0x2a7f...c1b5' },
];

// ---------------------------------------------------------------------------
// Custom Stepper Connector
// ---------------------------------------------------------------------------

const BridgeConnector = styled(StepConnector)(() => ({
  '& .MuiStepConnector-line': {
    borderColor: colors.border.default,
    borderTopWidth: 2,
  },
  '&.Mui-active .MuiStepConnector-line': {
    borderColor: colors.brand.primary,
  },
  '&.Mui-completed .MuiStepConnector-line': {
    borderColor: colors.success.main,
  },
}));

// ---------------------------------------------------------------------------
// Step Icon
// ---------------------------------------------------------------------------

const StepIcon: React.FC<{ active: boolean; completed: boolean; failed?: boolean }> = ({
  active,
  completed,
  failed,
}) => {
  if (failed) {
    return (
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          bgcolor: `${colors.error.main}22`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ErrorOutlineIcon sx={{ fontSize: 16, color: colors.error.main }} />
      </Box>
    );
  }
  if (completed) {
    return (
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          bgcolor: `${colors.success.main}22`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CheckCircleIcon sx={{ fontSize: 16, color: colors.success.main }} />
      </Box>
    );
  }
  if (active) {
    return (
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          bgcolor: `${colors.brand.primary}22`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'pulse 2s ease-in-out infinite',
          '@keyframes pulse': {
            '0%': { boxShadow: `0 0 0 0 ${colors.brand.primary}44` },
            '70%': { boxShadow: `0 0 0 8px transparent` },
            '100%': { boxShadow: `0 0 0 0 transparent` },
          },
        }}
      >
        <HourglassEmptyIcon sx={{ fontSize: 16, color: colors.brand.primary }} />
      </Box>
    );
  }
  return (
    <Box
      sx={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        bgcolor: colors.bg.tertiary,
        border: `2px solid ${colors.border.default}`,
      }}
    />
  );
};


// ---------------------------------------------------------------------------
// Active Transfer Card Subcomponent
// ---------------------------------------------------------------------------
const ActiveTransferCard: React.FC<{
  transfer: ActiveTransfer;
  trustState: any;
  trustConfig: any;
  l2Degraded: boolean;
}> = ({ transfer, trustState, trustConfig, l2Degraded }) => {
  const src = CHAINS[transfer.sourceChain];
  const dst = CHAINS[transfer.destChain];
  const { data: finalityData } = useBridgeFinalityStatus(transfer.sourceTxHash);

  const isL2 = ['optimism', 'arbitrum', 'base'].includes(transfer.sourceChain) ||
               ['optimism', 'arbitrum', 'base'].includes(transfer.destChain);

  const needsFinalize = transfer.activeStep >= 2;
  const disableFinalize = isL2 && l2Degraded;

  return (
    <Box
      sx={{
        bgcolor: colors.bg.primary,
        borderRadius: `${borderRadius.lg}px`,
        border: `1px solid ${colors.border.default}`,
        p: 2.5,
        '&:hover': { borderColor: colors.brand.primary },
        transition: 'border-color 0.2s ease',
      }}
    >
      {/* Transfer Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: 700, color: colors.brand.primary }}>
            {transfer.id}
          </Typography>
          <Chip
            size="small"
            label={transfer.protocol}
            sx={{
              height: 20,
              bgcolor: `${colors.brand.primary}22`,
              color: colors.brand.primary,
              fontSize: '0.65rem',
              fontWeight: 600,
            }}
          />
          {trustConfig && (
            <Tooltip
              title={
                trustState?.quorum ? (
                  <Box>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 0.5 }}>
                      {trustConfig.label}
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', mb: 0.5 }}>
                      {trustState.reason}
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)' }}>
                      Quorum: {trustState.quorum.collectedSignatures}/{trustState.quorum.requiredSignatures} signatures ({trustState.quorum.quorumPercentage}%)
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)' }}>
                      Active validators: {trustState.quorum.activeValidators}
                    </Typography>
                  </Box>
                ) : `Trust: ${trustConfig.label} — ${trustState?.reason ?? ''}`
              }
              arrow
            >
              <Chip
                size="small"
                icon={trustConfig.icon as React.ReactElement}
                label={trustState?.quorum ? `${trustConfig.label} (${trustState.quorum.quorumPercentage}%)` : trustConfig.label}
                sx={{
                  height: 20,
                  bgcolor: trustConfig.bgColor,
                  color: trustConfig.textColor,
                  border: `1px solid ${trustConfig.borderColor}`,
                  fontSize: '0.6rem',
                  fontWeight: 600,
                  '& .MuiChip-icon': {
                    color: trustConfig.textColor,
                    fontSize: 12,
                    ml: 0.5,
                  },
                }}
              />
            </Tooltip>
          )}
          
          {/* 1.1 Evidence Chips */}
          {finalityData?.validatorAttestation?.evidenceAvailable && (
            <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
              {Object.entries(finalityData.validatorAttestation.evidenceAvailable).map(([key, available]) => (
                <Tooltip key={key} title={`${key}: ${available ? 'Present' : 'Missing'}`}>
                  <Chip
                    size="small"
                    label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    sx={{
                      height: 18,
                      fontSize: '0.55rem',
                      fontWeight: 700,
                      bgcolor: available ? `${colors.success.main}22` : `${colors.text.muted}22`,
                      color: available ? colors.success.main : colors.text.muted,
                      border: `1px solid ${available ? colors.success.main : colors.border.default}`,
                    }}
                  />
                </Tooltip>
              ))}
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* 1.2 Real-time finality polling progress */}
          {finalityData?.progressPercent !== undefined && finalityData.trustState !== 'finalized' && (
            <Typography sx={{ fontSize: '0.75rem', color: colors.brand.primary, fontWeight: 600, mr: 1 }}>
              {finalityData.progressPercent}% Confirmed
            </Typography>
          )}
          <AccessTimeIcon sx={{ fontSize: 14, color: colors.text.muted }} />
          <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted }}>
            Est: {transfer.estimatedCompletion.split(' ')[1]}
          </Typography>
        </Box>
      </Box>

      {/* 1.5 L2 Challenge Window Countdown */}
      {finalityData?.trustState === 'challenge-window' && finalityData.estimatedSecondsRemaining !== null && (
        <Box sx={{ mb: 2, p: 1, bgcolor: `${colors.warning.main}12`, border: `1px solid ${colors.warning.main}`, borderRadius: 1 }}>
          <Typography sx={{ fontSize: '0.8rem', color: colors.warning.main, fontWeight: 600 }}>
            Challenge window: {Math.floor(finalityData.estimatedSecondsRemaining / 60)}m {finalityData.estimatedSecondsRemaining % 60}s remaining
          </Typography>
        </Box>
      )}

      {/* Route Info */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: src?.color }} />
          <Typography sx={{ fontSize: '0.8rem', color: colors.text.primary, fontWeight: 500 }}>
            {src?.name}
          </Typography>
        </Box>
        <SwapHorizIcon sx={{ fontSize: 18, color: colors.text.muted }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: dst?.color }} />
          <Typography sx={{ fontSize: '0.8rem', color: colors.text.primary, fontWeight: 500 }}>
            {dst?.name}
          </Typography>
        </Box>
        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: colors.text.primary, ml: 1 }}>
          {transfer.amount.toLocaleString()} {transfer.token}
        </Typography>
        <Typography sx={{ fontSize: '0.75rem', color: colors.warning.main, ml: 'auto' }}>
          Fee: ${transfer.fee.toFixed(2)}
        </Typography>
      </Box>

      {/* Stepper */}
      <Stepper
        activeStep={transfer.activeStep}
        alternativeLabel
        connector={<BridgeConnector />}
        sx={{
          '& .MuiStepLabel-label': { color: colors.text.muted, fontSize: '0.7rem', mt: 0.5 },
          '& .MuiStepLabel-label.Mui-active': { color: colors.brand.primary, fontWeight: 600 },
          '& .MuiStepLabel-label.Mui-completed': { color: colors.success.main },
        }}
      >
        {BRIDGE_STEPS.map((label, index) => (
          <Step key={label} completed={index < transfer.activeStep}>
            <StepLabel StepIconComponent={() => <StepIcon active={index === transfer.activeStep} completed={index < transfer.activeStep} failed={transfer.status === 'failed' && index === transfer.activeStep} />}>
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* TX Hashes & Finalize Action */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted }}>
            Source TX: <Typography component="span" sx={{ fontFamily: 'monospace', color: colors.brand.primary, fontSize: '0.7rem' }}>{transfer.sourceTxHash}</Typography>
          </Typography>
          {transfer.destTxHash && (
            <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted }}>
              Dest TX: <Typography component="span" sx={{ fontFamily: 'monospace', color: colors.brand.primary, fontSize: '0.7rem' }}>{transfer.destTxHash}</Typography>
            </Typography>
          )}
        </Box>
        {needsFinalize && (
          <Tooltip title={disableFinalize ? 'L2 subsystems (Prover/Verifier) are not ready.' : 'Finalize this transfer'} arrow>
            <span>
              <Button variant="contained" size="small" disabled={disableFinalize} sx={{ bgcolor: colors.brand.primary, '&:hover': { bgcolor: colors.brand.primary } }}>
                Finalize
              </Button>
            </span>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const BridgeTransactionTrackerSample: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState(0); // 0=All, 1=Active, 2=Completed, 3=Failed
  const { trustState, loading: trustLoading } = useBridgeTrustMode();
  const { capabilities, loading: capabilityLoading } = useCapabilities();
  const trustConfig = trustState ? TRUST_MODE_CONFIG[trustState.mode] : null;
  const readinessSignals = useMemo(
    () =>
      L2_READINESS_SIGNALS.map(signal => ({
        ...signal,
        entry: capabilities?.features?.[signal.key] as FeatureStatusEntry | undefined,
      })),
    [capabilities],
  );


  const l2Degraded = readinessSignals.some(s =>
    (s.key === 'l2Prover' || s.key === 'l2Verifier') &&
    (s.entry?.status === 'degraded' || s.entry?.status === 'unavailable' || !s.entry),
  );

  const allTransactions = useMemo(() => {
    const active = ACTIVE_TRANSFERS.map((t) => ({
      ...t,
      completedAt: '--',
      duration: 'In Progress',
    }));
    return [...active, ...HISTORY];
  }, []);

  const filteredHistory = useMemo(() => {
    if (statusFilter === 0) return HISTORY;
    if (statusFilter === 1) return HISTORY; // Active shown separately
    if (statusFilter === 2) return HISTORY.filter((h) => h.status === 'completed');
    return HISTORY.filter((h) => h.status === 'failed');
  }, [statusFilter]);

  const completedCount = HISTORY.filter((h) => h.status === 'completed').length;
  const failedCount = HISTORY.filter((h) => h.status === 'failed').length;
  const totalFees = HISTORY.reduce((sum, h) => sum + h.fee, 0) + ACTIVE_TRANSFERS.reduce((sum, t) => sum + t.fee, 0);

  const historyColumns = [
    {
      key: 'id',
      label: 'TX ID',
      sortable: true,
      render: (val: string) => (
        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: colors.brand.primary, fontWeight: 600 }}>
          {val}
        </Typography>
      ),
    },
    {
      key: 'sourceChain',
      label: 'Route',
      sortable: false,
      render: (_: string, row: HistoryEntry) => {
        const src = CHAINS[row.sourceChain];
        const dst = CHAINS[row.destChain];
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: src?.color }} />
            <Typography sx={{ fontSize: '0.75rem', color: colors.text.secondary }}>{src?.name}</Typography>
            <SwapHorizIcon sx={{ fontSize: 14, color: colors.text.muted }} />
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: dst?.color }} />
            <Typography sx={{ fontSize: '0.75rem', color: colors.text.secondary }}>{dst?.name}</Typography>
          </Box>
        );
      },
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (val: number, row: HistoryEntry) => (
        <Typography sx={{ fontSize: '0.8rem', color: colors.text.primary, fontWeight: 600 }}>
          {val.toLocaleString()} {row.token}
        </Typography>
      ),
    },
    {
      key: 'protocol',
      label: 'Protocol',
      sortable: true,
      render: (val: string) => (
        <Chip
          size="small"
          label={val}
          sx={{
            height: 22,
            bgcolor: `${colors.brand.primary}22`,
            color: colors.brand.primary,
            fontSize: '0.7rem',
            fontWeight: 600,
          }}
        />
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (val: TransferStatus) => {
        const statusMap: Record<TransferStatus, { status: string; label: string }> = {
          completed: { status: 'online', label: 'Completed' },
          'in-progress': { status: 'syncing', label: 'In Progress' },
          failed: { status: 'offline', label: 'Failed' },
        };
        const config = statusMap[val] || statusMap.completed;
        return <WrfBadge status={config.status as any} label={config.label} size="sm" />;
      },
    },
    {
      key: 'duration',
      label: 'Duration',
      sortable: true,
      render: (val: string) => (
        <Typography sx={{ fontSize: '0.8rem', color: colors.text.secondary }}>{val}</Typography>
      ),
    },
    {
      key: 'fee',
      label: 'Fee',
      sortable: true,
      render: (val: number) => (
        <Typography sx={{ fontSize: '0.8rem', color: val > 0 ? colors.warning.main : colors.text.muted, fontWeight: 500 }}>
          {val > 0 ? `$${val.toFixed(2)}` : '--'}
        </Typography>
      ),
    },
    {
      key: 'completedAt',
      label: 'Time',
      sortable: true,
      render: (val: string) => (
        <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted }}>{val}</Typography>
      ),
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.bg.primary, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <ReceiptLongIcon sx={{ color: colors.brand.primary, fontSize: 32 }} />
        <Box>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text.primary }}>
            Bridge Transaction Tracker
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: colors.text.secondary }}>
            Monitor active cross-chain transfers and review transaction history
          </Typography>
        </Box>
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {trustLoading ? (
            <WrfBadge status="syncing" label="Checking trust mode..." size="sm" />
          ) : trustConfig ? (
            <Tooltip title={trustConfig.bannerMessage} arrow>
              <Box sx={{ display: 'inline-flex' }}>
                <WrfBadge status={trustConfig.badgeStatus as any} label={trustConfig.label} size="sm" />
              </Box>
            </Tooltip>
          ) : (
            <WrfBadge status="offline" label="Trust unknown" size="sm" />
          )}
          {readinessSignals.map(signal => {
            if (capabilityLoading && !signal.entry) {
              return (
                <WrfBadge
                  key={signal.key}
                  status="syncing"
                  label={`${signal.label}: checking`}
                  size="sm"
                />
              );
            }

            const badgeStatus = mapCapabilityStatusToBadge(signal.entry?.status);
            const statusLabel = signal.entry?.status ?? 'unavailable';
            const tooltipTitle = `${signal.label}: ${statusLabel} — ${capabilityReasonLabel(signal.entry?.reasonCode)}`;

            return (
              <Tooltip key={signal.key} title={tooltipTitle} arrow>
                <Box sx={{ display: 'inline-flex' }}>
                  <WrfBadge
                    status={badgeStatus as any}
                    label={`${signal.label}: ${statusLabel}`}
                    size="sm"
                  />
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      </Box>

      {/* Trust Mode Banner */}
      {!trustLoading && trustConfig && trustState && trustState.mode !== 'production-verified' && (
        <Box
          sx={{
            mb: 3,
            p: 2,
            borderRadius: `${borderRadius.md}px`,
            border: `1px solid ${trustConfig.borderColor}`,
            bgcolor: trustConfig.bgColor,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1.5,
          }}
        >
          <Box sx={{ color: trustConfig.textColor, mt: 0.25 }}>{trustConfig.icon}</Box>
          <Box>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: trustConfig.textColor, mb: 0.25 }}>
              {trustState.mode === 'simulated' && 'Simulated Mode'}
              {trustState.mode === 'local-manager' && 'Local Manager Mode'}
              {trustState.mode === 'unavailable' && 'Bridge Halted'}
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: colors.text.secondary }}>
              {trustConfig.bannerMessage}
            </Typography>
            {trustState.reasonCode && trustState.reasonCode !== 'LEGACY_DETERMINATION' && (
              <Typography sx={{ fontSize: '0.65rem', color: colors.text.muted, mt: 0.25, fontFamily: 'monospace' }}>
                [{trustState.reasonCode}]
              </Typography>
            )}
            {trustState.haltReason && (
              <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted, mt: 0.5, fontStyle: 'italic' }}>
                Reason: {trustState.haltReason}
              </Typography>
            )}
          </Box>
        </Box>
      )}

      {/* Store Consistency Banner */}
      {!trustLoading && trustState?.storeConsistency && trustState.storeConsistency.health !== 'healthy' && (
        <StoreConsistencyBanner
          health={trustState.storeConsistency.health}
          readMode={trustState.storeConsistency.readMode}
          issues={[]}
        />
      )}

      {/* Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 3 }}>
        <Box>
          <WrfStatCard
            label="Active Transfers"
            trendLabel=""
            value={ACTIVE_TRANSFERS.length.toString()}
            trend={0}
            icon={SwapHorizIcon}
            color={colors.brand.primary}
            sparklineData={[2, 3, 1, 4, 2, 3, 5, 3, 2, 4, 3, 3]}
          />
        </Box>
        <Box>
          <WrfStatCard
            label="Completed (24h)"
            value={completedCount.toString()}
            trend={15.2}
            trendLabel="vs yesterday"
            icon={CheckCircleIcon}
            color={colors.success.main as any}
            sparklineData={[5, 6, 4, 7, 8, 6, 5, 7, 9, 8, 7, 7]}
          />
        </Box>
        <Box>
          <WrfStatCard
            label="Avg Duration"
            value="3m 42s"
            trend={-8.5}
            trendLabel="faster"
            icon={SpeedIcon}
            color={'#8B5CF6' as any}
            sparklineData={[5.2, 4.8, 4.5, 4.9, 4.2, 3.8, 4.1, 3.9, 3.7, 3.5, 3.8, 3.7]}
          />
        </Box>
        <Box>
          <WrfStatCard
            label="Total Fees (24h)"
            value={`$${totalFees.toFixed(2)}`}
            trend={4.3}
            trendLabel="24h"
            icon={LocalGasStationIcon}
            color={colors.warning.main as any}
            sparklineData={[42, 45, 48, 44, 50, 52, 49, 55, 53, 51, 54, 56]}
          />
        </Box>
      </Box>

      {/* Active Transfers with Steppers */}
      <WrfCard title="Active Transfers" subtitle={`${ACTIVE_TRANSFERS.length} transfers in progress`} action={<Box/>} sx={{ mb: 3 }}>
        {ACTIVE_TRANSFERS.length === 0 ? (
          <Typography sx={{ color: colors.text.muted, textAlign: 'center', py: 4 }}>
            No active transfers at this time
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {ACTIVE_TRANSFERS.map((transfer) => (
              <ActiveTransferCard
                key={transfer.id}
                transfer={transfer}
                trustState={trustState}
                trustConfig={trustConfig}
                l2Degraded={l2Degraded}
              />
            ))}
          </Box>
        )}
      </WrfCard>

      {/* History */}
      <WrfCard
        title="Transaction History"
        subtitle="All bridge transactions"
        action={
          <Tabs
            value={statusFilter}
            onChange={(_, v) => setStatusFilter(v)}
            sx={{
              minHeight: 32,
              '& .MuiTab-root': {
                minHeight: 32,
                py: 0.5,
                px: 1.5,
                fontSize: '0.75rem',
                fontWeight: 600,
                color: colors.text.muted,
                textTransform: 'none',
                '&.Mui-selected': { color: colors.brand.primary },
              },
              '& .MuiTabs-indicator': { backgroundColor: colors.brand.primary, height: 2 },
            }}
          >
            <Tab label={`All (${HISTORY.length})`} />
            <Tab label={`Completed (${completedCount})`} />
            <Tab label={`Failed (${failedCount})`} />
          </Tabs>
        }
      >
        <WrfDataTable
          onRowClick={() => {}}
          columns={historyColumns as any}
          data={filteredHistory as any}
          searchable
          exportable
          pagination
          pageSize={8}
          sx={{ border: 'none' }}
        />
      </WrfCard>
    </Box>
  );
};

const BridgeTransactionTracker: React.FC = () => (
  <DemoSurfaceGate
    title="Bridge transfers are not live on the testnet yet"
    description="No verified bridge transfer history is available."
    testId="bridge-transfers"
  >
    <BridgeTransactionTrackerSample />
  </DemoSurfaceGate>
);

export default BridgeTransactionTracker;
