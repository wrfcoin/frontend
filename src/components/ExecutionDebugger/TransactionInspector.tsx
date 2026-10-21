// TransactionInspector - Decode and inspect transaction internals
import React, { useState, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import { colors, spacing, borderRadius, shadows } from '../ui/tokens';
import WrfCard from '../ui/WrfCard';
import WrfStatCard from '../ui/WrfStatCard';
import WrfButton from '../ui/WrfButton';
import WrfBadge from '../ui/WrfBadge';
import WrfDataTable from '../ui/WrfDataTable';
import DemoSurfaceGate from '../common/DemoSurfaceGate';

// frontend#352: in the demo build this sample's controls are disabled; none of
// them reach a backend.
const SAMPLE_ACTION = 'Sample only: no transaction is inspected.';

const monoFont = '"JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas", monospace';

// --- Helper to generate deterministic hex ---
const hexChars = '0123456789abcdef';
const generateHex = (length: number, seed: number = 0): string => {
  let result = '';
  let s = seed;
  for (let i = 0; i < length; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    result += hexChars[s % 16];
  }
  return result;
};

const generateAddress = (seed: number): string => '0x' + generateHex(40, seed);
const generateHash = (seed: number): string => '0x' + generateHex(64, seed);

// --- Mock recent transactions ---
const recentTransactions = [
  { hash: '0x7a3b9c1d8e2f4a5b6c0d9e8f7a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b', label: 'Token Transfer' },
  { hash: '0xf1e2d3c4b5a6978869504132e4d5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3', label: 'Swap (WRF/ETH)' },
  { hash: '0xa9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8', label: 'Governance Vote' },
  { hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', label: 'NFT Mint' },
  { hash: '0xdeadbeefcafebabe1122334455667788aabbccddeeff00112233445566778899', label: 'Stake Deposit' },
];

// --- Segment colors for raw hex display ---
const segmentColors = [
  colors.brand.primary,   // function selector
  '#A78BFA',              // param 1
  '#F472B6',              // param 2
  colors.success.main,    // param 3
  colors.warning.main,    // param 4
  '#67E8F9',              // param 5
];

// --- Mock decoded transaction ---
interface DecodedParam {
  name: string;
  type: string;
  value: string;
}

interface EventLog {
  name: string;
  topics: string[];
  params: DecodedParam[];
  logIndex: number;
}

interface InternalCall {
  id: number;
  from: string;
  to: string;
  value: string;
  gas: number;
  method: string;
  children: InternalCall[];
}

interface StateDiff {
  id: number;
  address: string;
  slot: string;
  oldValue: string;
  newValue: string;
  changeType: 'Created' | 'Modified' | 'Deleted';
}

// Generate raw calldata
const mockFunctionSelector = 'a9059cbb';
const mockRawParams = [
  generateHex(64, 100),  // address param (padded)
  generateHex(64, 200),  // uint256 param
  generateHex(64, 300),  // bytes32 param
  generateHex(64, 400),  // additional data
];
const mockRawCalldata = '0x' + mockFunctionSelector + mockRawParams.join('');

const mockDecodedParams: DecodedParam[] = [
  { name: 'recipient', type: 'address', value: generateAddress(100) },
  { name: 'amount', type: 'uint256', value: '1,500,000.00 WRF (1500000000000000000000000)' },
  { name: 'deadline', type: 'uint256', value: '1707955200 (2026-02-15 00:00:00 UTC)' },
  { name: 'nonce', type: 'uint256', value: '42' },
];

const mockEventLogs: EventLog[] = [
  {
    name: 'Transfer',
    logIndex: 0,
    topics: [
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      '0x000000000000000000000000' + generateHex(40, 10),
      '0x000000000000000000000000' + generateHex(40, 20),
    ],
    params: [
      { name: 'from', type: 'address', value: generateAddress(10) },
      { name: 'to', type: 'address', value: generateAddress(20) },
      { name: 'value', type: 'uint256', value: '1,500,000 WRF' },
    ],
  },
  {
    name: 'Approval',
    logIndex: 1,
    topics: [
      '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925',
      '0x000000000000000000000000' + generateHex(40, 10),
      '0x000000000000000000000000' + generateHex(40, 30),
    ],
    params: [
      { name: 'owner', type: 'address', value: generateAddress(10) },
      { name: 'spender', type: 'address', value: generateAddress(30) },
      { name: 'value', type: 'uint256', value: '115792089237316195423570985008687907853269984665640564039457584007913129639935' },
    ],
  },
  {
    name: 'Swap',
    logIndex: 2,
    topics: [
      '0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822',
      '0x000000000000000000000000' + generateHex(40, 40),
    ],
    params: [
      { name: 'sender', type: 'address', value: generateAddress(40) },
      { name: 'amount0In', type: 'uint256', value: '0' },
      { name: 'amount1In', type: 'uint256', value: '500,000 WRF' },
      { name: 'amount0Out', type: 'uint256', value: '0.85 ETH' },
      { name: 'amount1Out', type: 'uint256', value: '0' },
    ],
  },
];

const mockInternalCalls: InternalCall[] = [
  {
    id: 1,
    from: generateAddress(1),
    to: generateAddress(2),
    value: '0 ETH',
    gas: 150000,
    method: 'transfer(address,uint256)',
    children: [
      {
        id: 2,
        from: generateAddress(2),
        to: generateAddress(3),
        value: '0 ETH',
        gas: 80000,
        method: '_beforeTokenTransfer(address,address,uint256)',
        children: [],
      },
      {
        id: 3,
        from: generateAddress(2),
        to: generateAddress(4),
        value: '0 ETH',
        gas: 45000,
        method: 'balanceOf(address)',
        children: [],
      },
      {
        id: 4,
        from: generateAddress(2),
        to: generateAddress(5),
        value: '0.85 ETH',
        gas: 21000,
        method: 'receive()',
        children: [
          {
            id: 5,
            from: generateAddress(5),
            to: generateAddress(6),
            value: '0 ETH',
            gas: 12000,
            method: 'onTokenReceived(address,uint256,bytes)',
            children: [],
          },
        ],
      },
    ],
  },
];

const mockStateDiffs: StateDiff[] = [
  {
    id: 1,
    address: generateAddress(2),
    slot: '0x' + generateHex(64, 500),
    oldValue: '0x' + generateHex(64, 501),
    newValue: '0x' + generateHex(64, 502),
    changeType: 'Modified',
  },
  {
    id: 2,
    address: generateAddress(2),
    slot: '0x' + generateHex(64, 510),
    oldValue: '0x' + generateHex(64, 511),
    newValue: '0x' + generateHex(64, 512),
    changeType: 'Modified',
  },
  {
    id: 3,
    address: generateAddress(4),
    slot: '0x' + generateHex(64, 520),
    oldValue: '0x0000000000000000000000000000000000000000000000000000000000000000',
    newValue: '0x' + generateHex(64, 522),
    changeType: 'Created',
  },
  {
    id: 4,
    address: generateAddress(5),
    slot: '0x' + generateHex(64, 530),
    oldValue: '0x' + generateHex(64, 531),
    newValue: '0x0000000000000000000000000000000000000000000000000000000000000000',
    changeType: 'Deleted',
  },
  {
    id: 5,
    address: generateAddress(2),
    slot: '0x' + generateHex(64, 540),
    oldValue: '0x' + generateHex(64, 541),
    newValue: '0x' + generateHex(64, 542),
    changeType: 'Modified',
  },
  {
    id: 6,
    address: generateAddress(6),
    slot: '0x' + generateHex(64, 550),
    oldValue: '0x0000000000000000000000000000000000000000000000000000000000000000',
    newValue: '0x' + generateHex(64, 552),
    changeType: 'Created',
  },
];

// --- Expand icon ---
const ExpandIcon = ({ expanded }: { expanded: boolean }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{
      transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
      transition: 'transform 0.15s ease',
    }}
  >
    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
  </svg>
);

// --- State diff table columns ---
const stateDiffColumns = [
  {
    key: 'address',
    label: 'Address',
    sortable: true,
    render: (val: string) => (
      <Typography sx={{ fontFamily: monoFont, fontSize: '0.75rem', color: colors.brand.primary }}>
        {val.slice(0, 10)}...{val.slice(-6)}
      </Typography>
    ),
  },
  {
    key: 'slot',
    label: 'Storage Slot',
    sortable: false,
    render: (val: string) => (
      <Typography sx={{ fontFamily: monoFont, fontSize: '0.7rem', color: colors.text.secondary }}>
        {val.slice(0, 14)}...{val.slice(-6)}
      </Typography>
    ),
  },
  {
    key: 'oldValue',
    label: 'Old Value',
    sortable: false,
    render: (val: string) => (
      <Typography sx={{ fontFamily: monoFont, fontSize: '0.7rem', color: colors.text.muted }}>
        {val.slice(0, 14)}...{val.slice(-6)}
      </Typography>
    ),
  },
  {
    key: 'newValue',
    label: 'New Value',
    sortable: false,
    render: (val: string) => (
      <Typography sx={{ fontFamily: monoFont, fontSize: '0.7rem', color: colors.text.primary }}>
        {val.slice(0, 14)}...{val.slice(-6)}
      </Typography>
    ),
  },
  {
    key: 'changeType',
    label: 'Type',
    sortable: true,
    render: (val: string) => {
      const statusMap: Record<string, 'online' | 'offline' | 'degraded' | 'pending' | 'syncing'> = {
        Created: 'online',
        Modified: 'degraded',
        Deleted: 'offline',
      };
      return <WrfBadge status={statusMap[val] || 'pending'} label={val} size="sm" />;
    },
  },
];

const TransactionInspectorSample: React.FC = () => {
  const [txHash, setTxHash] = useState(recentTransactions[0].hash);
  const [selectedRecent, setSelectedRecent] = useState(0);
  const [expandedCalls, setExpandedCalls] = useState<Set<number>>(new Set([1, 4]));

  const toggleCall = useCallback((callId: number) => {
    setExpandedCalls((prev) => {
      const next = new Set(prev);
      if (next.has(callId)) {
        next.delete(callId);
      } else {
        next.add(callId);
      }
      return next;
    });
  }, []);

  const handleRecentSelect = useCallback((index: number) => {
    setSelectedRecent(index);
    setTxHash(recentTransactions[index].hash);
  }, []);

  // Calculate stats
  const totalInternalCalls = useMemo(() => {
    let count = 0;
    const countCalls = (calls: InternalCall[]) => {
      for (const c of calls) {
        count++;
        countCalls(c.children);
      }
    };
    countCalls(mockInternalCalls);
    return count;
  }, []);

  // Render raw calldata with color-coded segments
  const renderRawCalldata = () => {
    const selector = mockFunctionSelector;
    const segments = mockRawParams;

    return (
      <Box
        sx={{
          fontFamily: monoFont,
          fontSize: '0.75rem',
          wordBreak: 'break-all',
          lineHeight: 1.8,
          backgroundColor: colors.bg.primary,
          borderRadius: `${borderRadius.sm}px`,
          p: `${spacing.md}px`,
          border: `1px solid ${colors.border.default}`,
        }}
      >
        <Typography component="span" sx={{ fontFamily: monoFont, fontSize: '0.75rem', color: colors.text.muted }}>
          0x
        </Typography>
        <Typography
          component="span"
          sx={{
            fontFamily: monoFont,
            fontSize: '0.75rem',
            color: segmentColors[0],
            fontWeight: 700,
            backgroundColor: `${segmentColors[0]}15`,
            borderRadius: '2px',
            px: '2px',
          }}
        >
          {selector}
        </Typography>
        {segments.map((seg, i) => (
          <Typography
            key={i}
            component="span"
            sx={{
              fontFamily: monoFont,
              fontSize: '0.75rem',
              color: segmentColors[(i + 1) % segmentColors.length],
              backgroundColor: `${segmentColors[(i + 1) % segmentColors.length]}08`,
            }}
          >
            {seg}
          </Typography>
        ))}
      </Box>
    );
  };

  // Render internal call tree
  const renderCallTree = (calls: InternalCall[], depth: number = 0) => {
    return calls.map((call) => {
      const hasChildren = call.children.length > 0;
      const isExpanded = expandedCalls.has(call.id);

      return (
        <React.Fragment key={call.id}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              pl: `${depth * 24 + spacing.sm}px`,
              pr: `${spacing.sm}px`,
              py: '6px',
              borderBottom: `1px solid ${colors.border.default}`,
              '&:hover': { backgroundColor: 'rgba(59, 130, 246, 0.04)' },
            }}
          >
            {hasChildren ? (
              <IconButton
                size="small"
                onClick={() => toggleCall(call.id)}
                sx={{ color: colors.text.muted, p: 0, width: 18, height: 18 }}
              >
                <ExpandIcon expanded={isExpanded} />
              </IconButton>
            ) : (
              <Box sx={{ width: 18 }} />
            )}

            {/* Method name */}
            <Typography
              sx={{
                fontFamily: monoFont,
                fontSize: '0.8rem',
                color: colors.brand.primary,
                fontWeight: 600,
                minWidth: 200,
              }}
            >
              {call.method}
            </Typography>

            {/* From/To addresses */}
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
              <Typography
                sx={{ fontFamily: monoFont, fontSize: '0.7rem', color: colors.text.muted, flexShrink: 0 }}
              >
                {call.from.slice(0, 8)}...
              </Typography>
              <svg width="14" height="14" viewBox="0 0 24 24" fill={colors.text.muted}>
                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
              </svg>
              <Typography
                sx={{ fontFamily: monoFont, fontSize: '0.7rem', color: colors.text.secondary, flexShrink: 0 }}
              >
                {call.to.slice(0, 8)}...
              </Typography>
            </Box>

            {/* Value */}
            <Typography
              sx={{
                fontFamily: monoFont,
                fontSize: '0.7rem',
                color: call.value !== '0 ETH' ? colors.success.main : colors.text.muted,
                flexShrink: 0,
                width: 70,
                textAlign: 'right',
              }}
            >
              {call.value}
            </Typography>

            {/* Gas */}
            <Typography
              sx={{
                fontFamily: monoFont,
                fontSize: '0.7rem',
                color: colors.warning.main,
                flexShrink: 0,
                width: 60,
                textAlign: 'right',
              }}
            >
              {call.gas.toLocaleString()}
            </Typography>
          </Box>

          {hasChildren && (
            <Collapse in={isExpanded}>
              {renderCallTree(call.children, depth + 1)}
            </Collapse>
          )}
        </React.Fragment>
      );
    });
  };

  return (
    <Box sx={{ bgcolor: colors.bg.primary, color: colors.text.primary, minHeight: '100vh', p: 3 }}>
      {/* Page header */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: colors.text.primary, mb: 0.5 }}>
          Transaction Inspector
        </Typography>
        <Typography sx={{ fontSize: '0.875rem', color: colors.text.secondary }}>
          Decode and inspect blockchain transaction internals, events, and state changes
        </Typography>
      </Box>

      {/* Transaction input with recent dropdown */}
      <WrfCard sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.md}px`, mb: `${spacing.md}px` }}>
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              backgroundColor: colors.bg.primary,
              border: `1px solid ${colors.border.default}`,
              borderRadius: `${borderRadius.md}px`,
              px: `${spacing.md}px`,
              py: `${spacing.sm}px`,
            }}
          >
            <Typography
              component="span"
              sx={{ fontFamily: monoFont, fontSize: '0.75rem', color: colors.text.muted, mr: 1, flexShrink: 0 }}
            >
              TX:
            </Typography>
            <InputBase
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="Enter transaction hash (0x...)"
              sx={{
                flex: 1,
                fontFamily: monoFont,
                fontSize: '0.85rem',
                color: colors.text.primary,
                '& input::placeholder': { color: colors.text.muted, opacity: 1 },
              }}
            />
          </Box>
          <WrfButton disabled title={SAMPLE_ACTION} variant="primary" size="md">
            Inspect
          </WrfButton>
        </Box>

        {/* Recent transactions */}
        <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted, mb: '6px' }}>
          Recent Transactions
        </Typography>
        <Box sx={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {recentTransactions.map((tx, i) => (
            <Box
              key={i}
              onClick={() => handleRecentSelect(i)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: selectedRecent === i ? 'rgba(59, 130, 246, 0.12)' : colors.bg.primary,
                border: `1px solid ${selectedRecent === i ? colors.brand.primary : colors.border.default}`,
                borderRadius: `${borderRadius.md}px`,
                px: `${spacing.sm}px`,
                py: '4px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                '&:hover': { borderColor: colors.border.light },
              }}
            >
              <Typography sx={{ fontFamily: monoFont, fontSize: '0.7rem', color: colors.text.muted }}>
                {tx.hash.slice(0, 10)}...
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: colors.text.secondary, fontWeight: 500 }}>
                {tx.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </WrfCard>

      {/* Stat cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Internal Calls"
            value={totalInternalCalls.toString()}
            color={colors.brand.primary}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Events Emitted"
            value={mockEventLogs.length.toString()}
            color={colors.success.main}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="State Changes"
            value={mockStateDiffs.length.toString()}
            trend={3.1}
            trendLabel="vs avg"
            color={colors.warning.main}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Gas Efficiency"
            value="94.2%"
            trend={1.8}
            trendLabel="vs median"
            color="#A78BFA"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {/* Left column */}
        <Grid size={{ xs: 12, lg: 6 }}>
          {/* Raw Transaction calldata */}
          <WrfCard title="Raw Transaction Data" subtitle="Color-coded calldata segments" sx={{ mb: 2 }}>
            {renderRawCalldata()}
            <Box sx={{ display: 'flex', gap: `${spacing.sm}px`, mt: `${spacing.sm}px`, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '2px', backgroundColor: segmentColors[0] }} />
                <Typography sx={{ fontSize: '0.65rem', color: colors.text.muted }}>Selector</Typography>
              </Box>
              {['Param 1', 'Param 2', 'Param 3', 'Param 4'].map((name, i) => (
                <Box key={name} sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '2px', backgroundColor: segmentColors[i + 1] }} />
                  <Typography sx={{ fontSize: '0.65rem', color: colors.text.muted }}>{name}</Typography>
                </Box>
              ))}
            </Box>
          </WrfCard>

          {/* Decoded transaction */}
          <WrfCard
            title="Decoded Transaction"
            subtitle="transfer(address recipient, uint256 amount, uint256 deadline, uint256 nonce)"
            sx={{ mb: 2 }}
          >
            <Box
              sx={{
                backgroundColor: colors.bg.primary,
                borderRadius: `${borderRadius.sm}px`,
                p: `${spacing.sm}px`,
                mb: `${spacing.sm}px`,
                border: `1px solid ${colors.border.default}`,
              }}
            >
              <Typography sx={{ fontFamily: monoFont, fontSize: '0.85rem', color: colors.brand.primary, fontWeight: 700, mb: '4px' }}>
                transfer(address,uint256,uint256,uint256)
              </Typography>
              <Typography sx={{ fontFamily: monoFont, fontSize: '0.7rem', color: colors.text.muted }}>
                Selector: 0x{mockFunctionSelector}
              </Typography>
            </Box>

            {/* Parameters table */}
            <Box sx={{ border: `1px solid ${colors.border.default}`, borderRadius: `${borderRadius.sm}px`, overflow: 'hidden' }}>
              {/* Header */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '100px 80px 1fr',
                  gap: '8px',
                  px: `${spacing.sm}px`,
                  py: '6px',
                  backgroundColor: colors.bg.primary,
                  borderBottom: `1px solid ${colors.border.default}`,
                }}
              >
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Name
                </Typography>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Type
                </Typography>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Value
                </Typography>
              </Box>
              {/* Rows */}
              {mockDecodedParams.map((param, i) => (
                <Box
                  key={i}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '100px 80px 1fr',
                    gap: '8px',
                    px: `${spacing.sm}px`,
                    py: '6px',
                    borderBottom: i < mockDecodedParams.length - 1 ? `1px solid ${colors.border.default}` : 'none',
                    '&:hover': { backgroundColor: 'rgba(59, 130, 246, 0.04)' },
                  }}
                >
                  <Typography sx={{ fontFamily: monoFont, fontSize: '0.8rem', color: segmentColors[(i + 1) % segmentColors.length], fontWeight: 600 }}>
                    {param.name}
                  </Typography>
                  <Typography sx={{ fontFamily: monoFont, fontSize: '0.75rem', color: colors.text.muted }}>
                    {param.type}
                  </Typography>
                  <Typography sx={{ fontFamily: monoFont, fontSize: '0.75rem', color: colors.text.primary, wordBreak: 'break-all' }}>
                    {param.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </WrfCard>
        </Grid>

        {/* Right column */}
        <Grid size={{ xs: 12, lg: 6 }}>
          {/* Event logs */}
          <WrfCard title="Event Logs" subtitle={`${mockEventLogs.length} events emitted`} sx={{ mb: 2 }}>
            {mockEventLogs.map((event, eventIdx) => (
              <Box
                key={eventIdx}
                sx={{
                  backgroundColor: colors.bg.primary,
                  borderRadius: `${borderRadius.sm}px`,
                  p: `${spacing.sm}px`,
                  mb: eventIdx < mockEventLogs.length - 1 ? `${spacing.sm}px` : 0,
                  border: `1px solid ${colors.border.default}`,
                }}
              >
                {/* Event header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', mb: '6px' }}>
                  <Typography sx={{ fontFamily: monoFont, fontSize: '0.85rem', fontWeight: 700, color: colors.success.main }}>
                    {event.name}
                  </Typography>
                  <WrfBadge status="online" label={`Log #${event.logIndex}`} size="sm" />
                </Box>

                {/* Topics */}
                <Typography sx={{ fontSize: '0.65rem', color: colors.text.muted, mb: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Topics
                </Typography>
                {event.topics.map((topic, tIdx) => (
                  <Typography
                    key={tIdx}
                    sx={{
                      fontFamily: monoFont,
                      fontSize: '0.65rem',
                      color: tIdx === 0 ? colors.text.muted : colors.text.secondary,
                      wordBreak: 'break-all',
                      lineHeight: 1.6,
                    }}
                  >
                    [{tIdx}] {topic}
                  </Typography>
                ))}

                {/* Decoded params */}
                <Typography sx={{ fontSize: '0.65rem', color: colors.text.muted, mt: '6px', mb: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Decoded Parameters
                </Typography>
                {event.params.map((param, pIdx) => (
                  <Box
                    key={pIdx}
                    sx={{ display: 'flex', gap: '8px', py: '2px', alignItems: 'baseline' }}
                  >
                    <Typography sx={{ fontFamily: monoFont, fontSize: '0.75rem', color: '#A78BFA', fontWeight: 600, minWidth: 80 }}>
                      {param.name}
                    </Typography>
                    <Typography sx={{ fontFamily: monoFont, fontSize: '0.65rem', color: colors.text.muted, minWidth: 60 }}>
                      {param.type}
                    </Typography>
                    <Typography sx={{ fontFamily: monoFont, fontSize: '0.7rem', color: colors.text.primary, wordBreak: 'break-all' }}>
                      {param.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ))}
          </WrfCard>

          {/* Internal calls tree */}
          <WrfCard title="Internal Calls" subtitle="Nested call structure" sx={{ mb: 2 }}>
            {/* Column headers */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                px: `${spacing.sm}px`,
                py: '4px',
                borderBottom: `1px solid ${colors.border.default}`,
                mb: '2px',
              }}
            >
              <Box sx={{ width: 18 }} />
              <Typography sx={{ fontFamily: monoFont, fontSize: '0.65rem', color: colors.text.muted, minWidth: 200 }}>
                METHOD
              </Typography>
              <Typography sx={{ fontFamily: monoFont, fontSize: '0.65rem', color: colors.text.muted, flex: 1 }}>
                FROM / TO
              </Typography>
              <Typography sx={{ fontFamily: monoFont, fontSize: '0.65rem', color: colors.text.muted, width: 70, textAlign: 'right' }}>
                VALUE
              </Typography>
              <Typography sx={{ fontFamily: monoFont, fontSize: '0.65rem', color: colors.text.muted, width: 60, textAlign: 'right' }}>
                GAS
              </Typography>
            </Box>
            {renderCallTree(mockInternalCalls)}
          </WrfCard>
        </Grid>
      </Grid>

      {/* State diff table - full width */}
      <WrfCard title="State Diff" subtitle="Storage slot changes resulting from this transaction" sx={{ mt: 2 }}>
        <WrfDataTable
          columns={stateDiffColumns}
          data={mockStateDiffs}
          searchable
          exportable
          pagination={false}
        />
      </WrfCard>
    </Box>
  );
};

// frontend#352: display-only fabricated surface. The default build shows an
// honest not-live state and never mounts the sample.
const TransactionInspector = () => (
  <DemoSurfaceGate
    title="The transaction inspector is not live on the testnet"
    description="No testnet endpoint serves decoded calldata, event logs, internal calls or state diffs yet."
    testId="transaction-inspector"
  >
    <TransactionInspectorSample />
  </DemoSurfaceGate>
);

export default TransactionInspector;
