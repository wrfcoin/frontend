// StateDebugger - Blockchain state inspection and comparison tool
import React, { useState, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
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
const SAMPLE_ACTION = 'Sample only: no contract state is loaded.';

const monoFont = '"JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas", monospace';

// --- Hex generation helpers ---
const generateHex = (length: number, seed: number = 0): string => {
  const chars = '0123456789abcdef';
  let result = '';
  let s = seed;
  for (let i = 0; i < length; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    result += chars[s % 16];
  }
  return result;
};

const generateAddress = (seed: number): string => '0x' + generateHex(40, seed);

// --- Mock data ---
interface StorageSlot {
  id: number;
  slotIndex: string;
  key: string;
  value: string;
  decodedValue: string;
  lastModifiedBlock: number;
}

interface StateDiffEntry {
  id: number;
  slot: string;
  key: string;
  oldValue: string;
  newValue: string;
  changeType: 'new' | 'removed' | 'changed';
}

interface StateChange {
  blockNumber: number;
  timestamp: string;
  description: string;
  slot: string;
  oldValue: string;
  newValue: string;
}

const contractAddress = generateAddress(42);

const mockStorageSlots: StorageSlot[] = [
  {
    id: 1,
    slotIndex: '0x0000',
    key: 'totalSupply',
    value: '0x' + generateHex(64, 1000),
    decodedValue: '100,000,000 WRF',
    lastModifiedBlock: 18942567,
  },
  {
    id: 2,
    slotIndex: '0x0001',
    key: 'name',
    value: '0x' + generateHex(64, 1001),
    decodedValue: '"WRFCoin"',
    lastModifiedBlock: 18500000,
  },
  {
    id: 3,
    slotIndex: '0x0002',
    key: 'symbol',
    value: '0x' + generateHex(64, 1002),
    decodedValue: '"WRF"',
    lastModifiedBlock: 18500000,
  },
  {
    id: 4,
    slotIndex: '0x0003',
    key: 'decimals',
    value: '0x0000000000000000000000000000000000000000000000000000000000000012',
    decodedValue: '18',
    lastModifiedBlock: 18500000,
  },
  {
    id: 5,
    slotIndex: '0x0004',
    key: 'owner',
    value: '0x000000000000000000000000' + generateHex(40, 99),
    decodedValue: generateAddress(99),
    lastModifiedBlock: 18500000,
  },
  {
    id: 6,
    slotIndex: '0x0005',
    key: 'paused',
    value: '0x0000000000000000000000000000000000000000000000000000000000000000',
    decodedValue: 'false',
    lastModifiedBlock: 18801234,
  },
  {
    id: 7,
    slotIndex: '0x0006',
    key: 'balances[mapping]',
    value: '0x' + generateHex(64, 1006),
    decodedValue: 'Mapping root hash',
    lastModifiedBlock: 18942567,
  },
  {
    id: 8,
    slotIndex: '0x0007',
    key: 'allowances[mapping]',
    value: '0x' + generateHex(64, 1007),
    decodedValue: 'Mapping root hash',
    lastModifiedBlock: 18942500,
  },
  {
    id: 9,
    slotIndex: '0x0008',
    key: 'governanceThreshold',
    value: '0x0000000000000000000000000000000000000000000000000000000000002710',
    decodedValue: '10,000 WRF',
    lastModifiedBlock: 18920100,
  },
  {
    id: 10,
    slotIndex: '0x0009',
    key: 'rewardRate',
    value: '0x0000000000000000000000000000000000000000000000000000000000000064',
    decodedValue: '100 (basis points)',
    lastModifiedBlock: 18935000,
  },
  {
    id: 11,
    slotIndex: '0x000a',
    key: 'lastRewardBlock',
    value: '0x0000000000000000000000000000000000000000000000000000000001214747',
    decodedValue: '18,957,127',
    lastModifiedBlock: 18957127,
  },
  {
    id: 12,
    slotIndex: '0x000b',
    key: 'stakingPool',
    value: '0x' + generateHex(64, 1011),
    decodedValue: '25,400,000 WRF',
    lastModifiedBlock: 18942567,
  },
];

const mockStateDiffs: StateDiffEntry[] = [
  {
    id: 1,
    slot: '0x0000',
    key: 'totalSupply',
    oldValue: '99,500,000 WRF',
    newValue: '100,000,000 WRF',
    changeType: 'changed',
  },
  {
    id: 2,
    slot: '0x0006',
    key: 'balances[0x7a3b...9c1d]',
    oldValue: '1,200,000 WRF',
    newValue: '1,700,000 WRF',
    changeType: 'changed',
  },
  {
    id: 3,
    slot: '0x0006',
    key: 'balances[0xf1e2...d3c4]',
    oldValue: '800,000 WRF',
    newValue: '300,000 WRF',
    changeType: 'changed',
  },
  {
    id: 4,
    slot: '0x000c',
    key: 'vestingSchedule[3]',
    oldValue: '--',
    newValue: '{start: 18942567, cliff: 100, duration: 1000}',
    changeType: 'new',
  },
  {
    id: 5,
    slot: '0x000b',
    key: 'stakingPool',
    oldValue: '25,400,000 WRF',
    newValue: '25,900,000 WRF',
    changeType: 'changed',
  },
  {
    id: 6,
    slot: '0x0010',
    key: 'deprecatedMapping',
    oldValue: '0x' + generateHex(64, 2000),
    newValue: '--',
    changeType: 'removed',
  },
];

const mockStateChanges: StateChange[] = [
  {
    blockNumber: 18957127,
    timestamp: '2 min ago',
    description: 'Reward distribution triggered',
    slot: '0x000a',
    oldValue: '18,957,100',
    newValue: '18,957,127',
  },
  {
    blockNumber: 18942567,
    timestamp: '35 min ago',
    description: 'Token transfer (WRF)',
    slot: '0x0006',
    oldValue: '1,200,000 WRF',
    newValue: '1,700,000 WRF',
  },
  {
    blockNumber: 18942500,
    timestamp: '38 min ago',
    description: 'Allowance approval update',
    slot: '0x0007',
    oldValue: '0',
    newValue: 'MAX_UINT256',
  },
  {
    blockNumber: 18935000,
    timestamp: '2 hrs ago',
    description: 'Governance: reward rate adjusted',
    slot: '0x0009',
    oldValue: '80 bp',
    newValue: '100 bp',
  },
  {
    blockNumber: 18920100,
    timestamp: '5 hrs ago',
    description: 'Governance: threshold lowered',
    slot: '0x0008',
    oldValue: '50,000 WRF',
    newValue: '10,000 WRF',
  },
  {
    blockNumber: 18901000,
    timestamp: '12 hrs ago',
    description: 'Staking deposit',
    slot: '0x000b',
    oldValue: '24,900,000 WRF',
    newValue: '25,400,000 WRF',
  },
  {
    blockNumber: 18880000,
    timestamp: '18 hrs ago',
    description: 'Token mint (weather rewards)',
    slot: '0x0000',
    oldValue: '99,500,000 WRF',
    newValue: '100,000,000 WRF',
  },
];

// --- Storage table columns ---
const storageColumns = [
  {
    key: 'slotIndex',
    label: 'Slot',
    sortable: true,
    render: (val: string) => (
      <Typography sx={{ fontFamily: monoFont, fontSize: '0.75rem', color: colors.brand.primary, fontWeight: 600 }}>
        {val}
      </Typography>
    ),
  },
  {
    key: 'key',
    label: 'Key',
    sortable: true,
    render: (val: string) => (
      <Typography sx={{ fontFamily: monoFont, fontSize: '0.75rem', color: '#A78BFA' }}>
        {val}
      </Typography>
    ),
  },
  {
    key: 'value',
    label: 'Value (hex)',
    sortable: false,
    render: (val: string) => (
      <Typography sx={{ fontFamily: monoFont, fontSize: '0.7rem', color: colors.text.secondary }}>
        {val.slice(0, 18)}...{val.slice(-6)}
      </Typography>
    ),
  },
  {
    key: 'decodedValue',
    label: 'Decoded',
    sortable: false,
    render: (val: string) => (
      <Typography sx={{ fontFamily: monoFont, fontSize: '0.75rem', color: colors.text.primary }}>
        {val}
      </Typography>
    ),
  },
  {
    key: 'lastModifiedBlock',
    label: 'Last Modified',
    sortable: true,
    render: (val: number) => (
      <Typography sx={{ fontFamily: monoFont, fontSize: '0.75rem', color: colors.text.muted }}>
        #{val.toLocaleString()}
      </Typography>
    ),
  },
];

// --- SVG: Simplified Patricia Trie ---
const PatriciaTrieSVG: React.FC = () => {
  const nodeRadius = 18;
  const branchColors = [colors.brand.primary, colors.success.main, colors.warning.main, '#A78BFA'];
  const leafCounts = [42, 38, 55, 31];

  return (
    <svg width="100%" height="260" viewBox="0 0 500 260">
      {/* Root node */}
      <circle cx="250" cy="35" r={nodeRadius} fill={colors.bg.tertiary} stroke={colors.text.muted} strokeWidth="2" />
      <text x="250" y="39" textAnchor="middle" fill={colors.text.primary} fontSize="10" fontFamily={monoFont}>
        Root
      </text>

      {/* Branch lines */}
      {[0, 1, 2, 3].map((i) => {
        const x = 80 + i * 115;
        return (
          <React.Fragment key={i}>
            <line
              x1="250"
              y1={35 + nodeRadius}
              x2={x}
              y2={110 - nodeRadius}
              stroke={branchColors[i]}
              strokeWidth="2"
              strokeOpacity="0.6"
            />
            {/* Branch node */}
            <circle cx={x} cy="110" r={nodeRadius} fill={colors.bg.tertiary} stroke={branchColors[i]} strokeWidth="2" />
            <text x={x} y="107" textAnchor="middle" fill={branchColors[i]} fontSize="9" fontFamily={monoFont}>
              0x{i.toString(16)}...
            </text>
            <text x={x} y="118" textAnchor="middle" fill={colors.text.muted} fontSize="8" fontFamily={monoFont}>
              branch
            </text>

            {/* Leaf cluster lines */}
            {[-1, 0, 1].map((offset) => {
              const leafX = x + offset * 28;
              const leafY = 190;
              return (
                <React.Fragment key={`${i}-${offset}`}>
                  <line
                    x1={x}
                    y1={110 + nodeRadius}
                    x2={leafX}
                    y2={leafY - 12}
                    stroke={branchColors[i]}
                    strokeWidth="1.5"
                    strokeOpacity="0.4"
                    strokeDasharray="3 3"
                  />
                  <rect
                    x={leafX - 12}
                    y={leafY - 12}
                    width={24}
                    height={24}
                    rx="4"
                    fill={`${branchColors[i]}15`}
                    stroke={branchColors[i]}
                    strokeWidth="1"
                    strokeOpacity="0.5"
                  />
                  <text x={leafX} y={leafY + 3} textAnchor="middle" fill={branchColors[i]} fontSize="8" fontFamily={monoFont}>
                    {Math.floor(leafCounts[i] / 3 + offset * 3)}
                  </text>
                </React.Fragment>
              );
            })}

            {/* Leaf count label */}
            <text x={x} y="230" textAnchor="middle" fill={colors.text.muted} fontSize="9" fontFamily={monoFont}>
              {leafCounts[i]} leaves
            </text>
          </React.Fragment>
        );
      })}

      {/* Total label */}
      <text x="250" y="254" textAnchor="middle" fill={colors.text.secondary} fontSize="10" fontFamily={monoFont}>
        Total: {leafCounts.reduce((a, b) => a + b, 0)} storage slots
      </text>
    </svg>
  );
};

const StateDebuggerSample: React.FC = () => {
  const [address, setAddress] = useState(contractAddress);
  const [blockA, setBlockA] = useState('18940000');
  const [blockB, setBlockB] = useState('18957127');
  const [compareMode, setCompareMode] = useState(false);

  // Account overview data
  const accountOverview = useMemo(
    () => ({
      balanceWRF: '2,450,000.00 WRF',
      balanceETH: '15.824 ETH',
      nonce: 1247,
      codeHash: '0x' + generateHex(64, 9999),
      storageRoot: '0x' + generateHex(64, 8888),
    }),
    [],
  );

  return (
    <Box sx={{ bgcolor: colors.bg.primary, color: colors.text.primary, minHeight: '100vh', p: 3 }}>
      {/* Page header */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: colors.text.primary, mb: 0.5 }}>
          State Debugger
        </Typography>
        <Typography sx={{ fontSize: '0.875rem', color: colors.text.secondary }}>
          Inspect and compare blockchain state across blocks for any contract address
        </Typography>
      </Box>

      {/* Address input */}
      <WrfCard sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: `${spacing.md}px` }}>
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
            Address:
          </Typography>
          <InputBase
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter contract or account address (0x...)"
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
          Load State
        </WrfButton>
      </WrfCard>

      {/* Stat cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Storage Slots Used"
            value={mockStorageSlots.length.toString()}
            trend={2}
            trendLabel="this week"
            color={colors.brand.primary}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Total State Size"
            value="4.2 KB"
            trend={0.8}
            trendLabel="growth"
            color={colors.success.main}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Changes (24h)"
            value={mockStateChanges.length.toString()}
            trend={12.5}
            trendLabel="vs yesterday"
            color={colors.warning.main}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Last Modified Block"
            value="#18,957,127"
            color="#A78BFA"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {/* Left column */}
        <Grid size={{ xs: 12, lg: 7 }}>
          {/* Account overview */}
          <WrfCard title="Account Overview" sx={{ mb: 2 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <Box
                  sx={{
                    backgroundColor: colors.bg.primary,
                    borderRadius: `${borderRadius.sm}px`,
                    p: `${spacing.sm}px`,
                    border: `1px solid ${colors.border.default}`,
                  }}
                >
                  <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em', mb: '4px' }}>
                    Balance (WRF)
                  </Typography>
                  <Typography sx={{ fontFamily: monoFont, fontSize: '1rem', fontWeight: 700, color: colors.brand.primary }}>
                    {accountOverview.balanceWRF}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Box
                  sx={{
                    backgroundColor: colors.bg.primary,
                    borderRadius: `${borderRadius.sm}px`,
                    p: `${spacing.sm}px`,
                    border: `1px solid ${colors.border.default}`,
                  }}
                >
                  <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em', mb: '4px' }}>
                    Balance (ETH)
                  </Typography>
                  <Typography sx={{ fontFamily: monoFont, fontSize: '1rem', fontWeight: 700, color: colors.success.main }}>
                    {accountOverview.balanceETH}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 4 }}>
                <Box
                  sx={{
                    backgroundColor: colors.bg.primary,
                    borderRadius: `${borderRadius.sm}px`,
                    p: `${spacing.sm}px`,
                    border: `1px solid ${colors.border.default}`,
                  }}
                >
                  <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em', mb: '4px' }}>
                    Nonce
                  </Typography>
                  <Typography sx={{ fontFamily: monoFont, fontSize: '0.9rem', fontWeight: 600, color: colors.text.primary }}>
                    {accountOverview.nonce.toLocaleString()}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 8 }}>
                <Box
                  sx={{
                    backgroundColor: colors.bg.primary,
                    borderRadius: `${borderRadius.sm}px`,
                    p: `${spacing.sm}px`,
                    border: `1px solid ${colors.border.default}`,
                  }}
                >
                  <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em', mb: '4px' }}>
                    Code Hash
                  </Typography>
                  <Typography sx={{ fontFamily: monoFont, fontSize: '0.7rem', color: colors.text.secondary, wordBreak: 'break-all' }}>
                    {accountOverview.codeHash}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Box
                  sx={{
                    backgroundColor: colors.bg.primary,
                    borderRadius: `${borderRadius.sm}px`,
                    p: `${spacing.sm}px`,
                    border: `1px solid ${colors.border.default}`,
                  }}
                >
                  <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em', mb: '4px' }}>
                    Storage Root
                  </Typography>
                  <Typography sx={{ fontFamily: monoFont, fontSize: '0.7rem', color: colors.text.secondary, wordBreak: 'break-all' }}>
                    {accountOverview.storageRoot}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </WrfCard>

          {/* Storage slots table */}
          <WrfCard title="Storage Slots" subtitle={`${mockStorageSlots.length} slots in use`} sx={{ mb: 2 }}>
            <WrfDataTable
              columns={storageColumns}
              data={mockStorageSlots}
              searchable
              exportable
              pageSize={8}
            />
          </WrfCard>
        </Grid>

        {/* Right column */}
        <Grid size={{ xs: 12, lg: 5 }}>
          {/* State comparison mode */}
          <WrfCard
            title="State Comparison"
            subtitle="Compare storage state between two blocks"
            action={
              <WrfButton
                variant={compareMode ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setCompareMode((prev) => !prev)}
              >
                {compareMode ? 'Comparing' : 'Compare'}
              </WrfButton>
            }
            sx={{ mb: 2 }}
          >
            {/* Block selection inputs */}
            <Box sx={{ display: 'flex', gap: `${spacing.sm}px`, mb: `${spacing.md}px` }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted, mb: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Block A
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: colors.bg.primary,
                    border: `1px solid ${colors.border.default}`,
                    borderRadius: `${borderRadius.sm}px`,
                    px: `${spacing.sm}px`,
                    py: '4px',
                  }}
                >
                  <Typography component="span" sx={{ fontFamily: monoFont, fontSize: '0.7rem', color: colors.text.muted, mr: '4px' }}>
                    #
                  </Typography>
                  <InputBase
                    value={blockA}
                    onChange={(e) => setBlockA(e.target.value)}
                    sx={{
                      flex: 1,
                      fontFamily: monoFont,
                      fontSize: '0.8rem',
                      color: colors.text.primary,
                      '& input': { padding: 0 },
                    }}
                  />
                </Box>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted, mb: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Block B
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: colors.bg.primary,
                    border: `1px solid ${colors.border.default}`,
                    borderRadius: `${borderRadius.sm}px`,
                    px: `${spacing.sm}px`,
                    py: '4px',
                  }}
                >
                  <Typography component="span" sx={{ fontFamily: monoFont, fontSize: '0.7rem', color: colors.text.muted, mr: '4px' }}>
                    #
                  </Typography>
                  <InputBase
                    value={blockB}
                    onChange={(e) => setBlockB(e.target.value)}
                    sx={{
                      flex: 1,
                      fontFamily: monoFont,
                      fontSize: '0.8rem',
                      color: colors.text.primary,
                      '& input': { padding: 0 },
                    }}
                  />
                </Box>
              </Box>
            </Box>

            {/* Diff list */}
            {compareMode && (
              <Box>
                <Box sx={{ display: 'flex', gap: `${spacing.sm}px`, mb: `${spacing.sm}px` }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '2px', backgroundColor: colors.success.main }} />
                    <Typography sx={{ fontSize: '0.65rem', color: colors.text.muted }}>New</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '2px', backgroundColor: colors.error.main }} />
                    <Typography sx={{ fontSize: '0.65rem', color: colors.text.muted }}>Removed</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '2px', backgroundColor: colors.warning.main }} />
                    <Typography sx={{ fontSize: '0.65rem', color: colors.text.muted }}>Changed</Typography>
                  </Box>
                </Box>

                {mockStateDiffs.map((diff) => {
                  const diffColor =
                    diff.changeType === 'new'
                      ? colors.success.main
                      : diff.changeType === 'removed'
                        ? colors.error.main
                        : colors.warning.main;
                  const diffBg =
                    diff.changeType === 'new'
                      ? 'rgba(16, 185, 129, 0.08)'
                      : diff.changeType === 'removed'
                        ? 'rgba(239, 68, 68, 0.08)'
                        : 'rgba(245, 158, 11, 0.08)';

                  return (
                    <Box
                      key={diff.id}
                      sx={{
                        backgroundColor: diffBg,
                        borderRadius: `${borderRadius.sm}px`,
                        p: `${spacing.sm}px`,
                        mb: '6px',
                        borderLeft: `3px solid ${diffColor}`,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '4px' }}>
                        <Typography sx={{ fontFamily: monoFont, fontSize: '0.75rem', color: '#A78BFA', fontWeight: 600 }}>
                          {diff.key}
                        </Typography>
                        <WrfBadge
                          status={
                            diff.changeType === 'new'
                              ? 'online'
                              : diff.changeType === 'removed'
                                ? 'offline'
                                : 'degraded'
                          }
                          label={diff.changeType === 'new' ? 'New' : diff.changeType === 'removed' ? 'Removed' : 'Changed'}
                          size="sm"
                        />
                      </Box>
                      <Typography sx={{ fontFamily: monoFont, fontSize: '0.65rem', color: colors.text.muted, mb: '2px' }}>
                        Slot: {diff.slot}
                      </Typography>
                      {diff.changeType !== 'new' && (
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                          <Typography sx={{ fontSize: '0.65rem', color: colors.text.muted, flexShrink: 0 }}>Old:</Typography>
                          <Typography sx={{ fontFamily: monoFont, fontSize: '0.7rem', color: colors.error.light, textDecoration: 'line-through', wordBreak: 'break-all' }}>
                            {diff.oldValue}
                          </Typography>
                        </Box>
                      )}
                      {diff.changeType !== 'removed' && (
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                          <Typography sx={{ fontSize: '0.65rem', color: colors.text.muted, flexShrink: 0 }}>New:</Typography>
                          <Typography sx={{ fontFamily: monoFont, fontSize: '0.7rem', color: colors.success.light, wordBreak: 'break-all' }}>
                            {diff.newValue}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>
            )}
          </WrfCard>

          {/* State tree SVG visualization */}
          <WrfCard title="State Tree" subtitle="Simplified Patricia trie structure" sx={{ mb: 2 }}>
            <Box
              sx={{
                backgroundColor: colors.bg.primary,
                borderRadius: `${borderRadius.sm}px`,
                border: `1px solid ${colors.border.default}`,
                p: `${spacing.sm}px`,
                overflow: 'hidden',
              }}
            >
              <PatriciaTrieSVG />
            </Box>
          </WrfCard>

          {/* Recent state changes timeline */}
          <WrfCard title="Recent State Changes" subtitle="Latest modifications to contract storage" sx={{ mb: 2 }}>
            <Box sx={{ position: 'relative' }}>
              {/* Vertical timeline line */}
              <Box
                sx={{
                  position: 'absolute',
                  left: 14,
                  top: 0,
                  bottom: 0,
                  width: 2,
                  backgroundColor: colors.border.default,
                }}
              />

              {mockStateChanges.map((change, i) => (
                <Box
                  key={i}
                  sx={{
                    display: 'flex',
                    gap: `${spacing.md}px`,
                    mb: i < mockStateChanges.length - 1 ? `${spacing.md}px` : 0,
                    position: 'relative',
                  }}
                >
                  {/* Timeline dot */}
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: i === 0 ? colors.brand.primary : colors.bg.tertiary,
                      border: `2px solid ${i === 0 ? colors.brand.primary : colors.text.muted}`,
                      flexShrink: 0,
                      mt: '4px',
                      ml: '10px',
                      zIndex: 1,
                    }}
                  />

                  {/* Content */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '2px' }}>
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: colors.text.primary }}>
                        {change.description}
                      </Typography>
                      <Typography sx={{ fontFamily: monoFont, fontSize: '0.65rem', color: colors.text.muted, flexShrink: 0, ml: `${spacing.sm}px` }}>
                        {change.timestamp}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', mb: '2px' }}>
                      <Typography sx={{ fontFamily: monoFont, fontSize: '0.65rem', color: colors.text.muted }}>
                        Block #{change.blockNumber.toLocaleString()}
                      </Typography>
                      <Typography sx={{ fontFamily: monoFont, fontSize: '0.65rem', color: '#A78BFA' }}>
                        Slot: {change.slot}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Typography sx={{ fontFamily: monoFont, fontSize: '0.7rem', color: colors.error.light, textDecoration: 'line-through' }}>
                        {change.oldValue}
                      </Typography>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill={colors.text.muted}>
                        <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
                      </svg>
                      <Typography sx={{ fontFamily: monoFont, fontSize: '0.7rem', color: colors.success.light }}>
                        {change.newValue}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </WrfCard>
        </Grid>
      </Grid>
    </Box>
  );
};

// frontend#352: display-only fabricated surface. The default build shows an
// honest not-live state and never mounts the sample.
const StateDebugger = () => (
  <DemoSurfaceGate
    title="The state debugger is not live on the testnet"
    description="No testnet endpoint serves contract storage slots, state diffs or state changes yet."
    testId="state-debugger"
  >
    <StateDebuggerSample />
  </DemoSurfaceGate>
);

export default StateDebugger;
