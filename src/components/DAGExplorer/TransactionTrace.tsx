import React, { useState, useMemo, useCallback } from 'react';
import DemoSurfaceGate from '../common/DemoSurfaceGate';
import { Button as GateButton } from '@mui/material';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
  Collapse,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandIcon,
  ChevronRight as CollapseIcon,
  ContentCopy as CopyIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip, Legend);

// --- Types ---

interface TraceStep {
  id: string;
  depth: number;
  opcode: string;
  gasCost: number;
  gasRemaining: number;
  stackDepth: number;
  description: string;
  category: 'call' | 'storage' | 'event' | 'arithmetic' | 'control' | 'error';
  children?: TraceStep[];
}

interface StateChange {
  address: string;
  slot: string;
  before: string;
  after: string;
}

interface EventLog {
  address: string;
  name: string;
  topics: string[];
  data: string;
}

export interface TransactionSummary {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasUsed: number;
  gasLimit: number;
  status: 'success' | 'failed';
  type: string;
}

interface TransactionTraceProps {
  transaction: TransactionSummary | null;
  onBack: () => void;
}

// --- Constants ---

const palette = {
  bg: '#0F172A',
  card: '#1E293B',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  primary: '#3B82F6',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  border: '#334155',
};

const CATEGORY_COLORS: Record<TraceStep['category'], string> = {
  call: palette.primary,
  storage: palette.warning,
  event: palette.success,
  arithmetic: palette.textSecondary,
  control: '#A78BFA',
  error: palette.error,
};

// --- Mock Data ---

function generateMockTrace(): TraceStep[] {
  return [
    {
      id: '0', depth: 0, opcode: 'CALL', gasCost: 700, gasRemaining: 200000, stackDepth: 1,
      description: 'External call to WeatherOracle contract', category: 'call',
      children: [
        { id: '0.0', depth: 1, opcode: 'CALLDATALOAD', gasCost: 3, gasRemaining: 199297, stackDepth: 2, description: 'Load function selector', category: 'control' },
        { id: '0.1', depth: 1, opcode: 'SLOAD', gasCost: 2100, gasRemaining: 199294, stackDepth: 2, description: 'Load latestPrice from slot 0x03', category: 'storage' },
        { id: '0.2', depth: 1, opcode: 'PUSH32', gasCost: 3, gasRemaining: 197194, stackDepth: 3, description: 'Push price threshold constant', category: 'arithmetic' },
        { id: '0.3', depth: 1, opcode: 'GT', gasCost: 3, gasRemaining: 197191, stackDepth: 2, description: 'Compare price > threshold', category: 'arithmetic' },
        { id: '0.4', depth: 1, opcode: 'JUMPI', gasCost: 10, gasRemaining: 197188, stackDepth: 1, description: 'Conditional jump: price check passed', category: 'control' },
        {
          id: '0.5', depth: 1, opcode: 'CALL', gasCost: 700, gasRemaining: 197178, stackDepth: 2,
          description: 'Internal call to StakingRewards.distribute()', category: 'call',
          children: [
            { id: '0.5.0', depth: 2, opcode: 'SLOAD', gasCost: 2100, gasRemaining: 196478, stackDepth: 3, description: 'Load totalStaked from slot 0x01', category: 'storage' },
            { id: '0.5.1', depth: 2, opcode: 'MUL', gasCost: 5, gasRemaining: 194378, stackDepth: 3, description: 'Calculate reward per token', category: 'arithmetic' },
            { id: '0.5.2', depth: 2, opcode: 'SSTORE', gasCost: 5000, gasRemaining: 194373, stackDepth: 2, description: 'Update rewardPerTokenStored (slot 0x02)', category: 'storage' },
            { id: '0.5.3', depth: 2, opcode: 'LOG2', gasCost: 1125, gasRemaining: 189373, stackDepth: 1, description: 'Emit RewardDistributed(amount, timestamp)', category: 'event' },
          ],
        },
        { id: '0.6', depth: 1, opcode: 'SSTORE', gasCost: 5000, gasRemaining: 188248, stackDepth: 1, description: 'Update lastDistributionTime (slot 0x04)', category: 'storage' },
        { id: '0.7', depth: 1, opcode: 'LOG3', gasCost: 1500, gasRemaining: 183248, stackDepth: 0, description: 'Emit WeatherUpdate(stationId, price, quality)', category: 'event' },
      ],
    },
    {
      id: '1', depth: 0, opcode: 'SSTORE', gasCost: 5000, gasRemaining: 181748, stackDepth: 0,
      description: 'Update caller nonce (slot 0x00)', category: 'storage',
    },
    {
      id: '2', depth: 0, opcode: 'CALL', gasCost: 700, gasRemaining: 176748, stackDepth: 1,
      description: 'Transfer 2.5 WRF to beneficiary', category: 'call',
      children: [
        { id: '2.0', depth: 1, opcode: 'SLOAD', gasCost: 2100, gasRemaining: 176048, stackDepth: 2, description: 'Load sender balance', category: 'storage' },
        { id: '2.1', depth: 1, opcode: 'SUB', gasCost: 3, gasRemaining: 173948, stackDepth: 2, description: 'Deduct transfer amount', category: 'arithmetic' },
        { id: '2.2', depth: 1, opcode: 'SSTORE', gasCost: 5000, gasRemaining: 173945, stackDepth: 1, description: 'Write new sender balance', category: 'storage' },
        { id: '2.3', depth: 1, opcode: 'SLOAD', gasCost: 2100, gasRemaining: 168945, stackDepth: 2, description: 'Load recipient balance', category: 'storage' },
        { id: '2.4', depth: 1, opcode: 'ADD', gasCost: 3, gasRemaining: 166845, stackDepth: 2, description: 'Add transfer amount', category: 'arithmetic' },
        { id: '2.5', depth: 1, opcode: 'SSTORE', gasCost: 5000, gasRemaining: 166842, stackDepth: 1, description: 'Write new recipient balance', category: 'storage' },
        { id: '2.6', depth: 1, opcode: 'LOG3', gasCost: 1500, gasRemaining: 161842, stackDepth: 0, description: 'Emit Transfer(from, to, amount)', category: 'event' },
      ],
    },
    {
      id: '3', depth: 0, opcode: 'RETURN', gasCost: 0, gasRemaining: 160342, stackDepth: 0,
      description: 'Return execution result', category: 'control',
    },
  ];
}

function generateMockStateChanges(): StateChange[] {
  return [
    { address: '0x7a3b...e4f1', slot: '0x03', before: '0x00...0000 (0)', after: '0x00...1a2b (6699)' },
    { address: '0x7a3b...e4f1', slot: '0x04', before: '0x00...3f8a (16266)', after: '0x00...4012 (16402)' },
    { address: '0x9c1d...b8a2', slot: '0x01', before: '0x00...2710 (10000)', after: '0x00...2710 (10000)' },
    { address: '0x9c1d...b8a2', slot: '0x02', before: '0x00...0fa0 (4000)', after: '0x00...1068 (4200)' },
    { address: '0x4e2f...c3d7', slot: '0x00', before: '0x8ac7...2300 (650.0 WRF)', after: '0x8697...d800 (647.5 WRF)' },
    { address: '0x1b5a...f9e6', slot: '0x00', before: '0x1bc1...6800 (32.0 WRF)', after: '0x1f7a...a000 (34.5 WRF)' },
  ];
}

function generateMockEvents(): EventLog[] {
  return [
    {
      address: '0x9c1d...b8a2',
      name: 'RewardDistributed',
      topics: ['0xddf2...5678', '0x0000...00c8'],
      data: '0x00000000000000000000000000000000000000000000000000000000000000c8',
    },
    {
      address: '0x7a3b...e4f1',
      name: 'WeatherUpdate',
      topics: ['0xa1b2...3456', '0x0000...0001', '0x0000...1a2b'],
      data: '0x0000000000000000000000000000000000000000000000000000000000000060',
    },
    {
      address: '0x4e2f...c3d7',
      name: 'Transfer',
      topics: ['0xddf2...5678', '0x4e2f...c3d7', '0x1b5a...f9e6'],
      data: '0x00000000000000000000000000000000000000000000000022b1c8c1227a0000',
    },
  ];
}

// --- Sub-components ---

const TraceStepRow: React.FC<{
  step: TraceStep;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
}> = ({ step, expandedIds, onToggle }) => {
  const hasChildren = step.children && step.children.length > 0;
  const isExpanded = expandedIds.has(step.id);
  const catColor = CATEGORY_COLORS[step.category];

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          pl: step.depth * 3,
          py: 0.5,
          px: 1,
          borderBottom: `1px solid ${palette.border}`,
          '&:hover': { bgcolor: 'rgba(59,130,246,0.06)' },
          cursor: hasChildren ? 'pointer' : 'default',
        }}
        onClick={() => hasChildren && onToggle(step.id)}
      >
        {/* Expand/collapse icon */}
        <Box sx={{ width: 20, flexShrink: 0 }}>
          {hasChildren && (
            isExpanded
              ? <ExpandIcon sx={{ fontSize: 16, color: palette.textSecondary }} />
              : <CollapseIcon sx={{ fontSize: 16, color: palette.textSecondary }} />
          )}
        </Box>

        {/* Category dot */}
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: catColor, mr: 1, flexShrink: 0 }} />

        {/* Opcode */}
        <Typography
          variant="caption"
          sx={{
            color: catColor,
            fontFamily: 'monospace',
            fontWeight: 700,
            width: 80,
            flexShrink: 0,
            fontSize: 11,
          }}
        >
          {step.opcode}
        </Typography>

        {/* Gas cost */}
        <Typography variant="caption" sx={{ color: palette.textSecondary, width: 60, flexShrink: 0, fontSize: 10, textAlign: 'right' }}>
          {step.gasCost.toLocaleString()} gas
        </Typography>

        {/* Stack depth */}
        <Typography variant="caption" sx={{ color: palette.textSecondary, width: 30, flexShrink: 0, fontSize: 10, textAlign: 'center', mx: 1 }}>
          [{step.stackDepth}]
        </Typography>

        {/* Description */}
        <Typography variant="caption" sx={{ color: palette.text, fontSize: 10, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {step.description}
        </Typography>
      </Box>

      {/* Recursive children */}
      {hasChildren && isExpanded && step.children!.map(child => (
        <TraceStepRow key={child.id} step={child} expandedIds={expandedIds} onToggle={onToggle} />
      ))}
    </>
  );
};

// --- Gas Waterfall Chart ---

function collectGasData(steps: TraceStep[]): { labels: string[]; values: number[]; colors: string[] } {
  const labels: string[] = [];
  const values: number[] = [];
  const colors: string[] = [];

  function walk(step: TraceStep) {
    if (step.gasCost > 0) {
      labels.push(step.opcode);
      values.push(step.gasCost);
      colors.push(CATEGORY_COLORS[step.category]);
    }
    step.children?.forEach(walk);
  }

  steps.forEach(walk);

  // Sort descending
  const indices = values.map((_, i) => i).sort((a, b) => values[b] - values[a]);
  return {
    labels: indices.map(i => labels[i]),
    values: indices.map(i => values[i]),
    colors: indices.map(i => colors[i]),
  };
}

// --- Component ---

const TransactionTraceSample: React.FC<TransactionTraceProps> = ({ transaction, onBack }) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(['0', '0.5', '2']));
  const traceSteps = useMemo(() => generateMockTrace(), []);
  const stateChanges = useMemo(() => generateMockStateChanges(), []);
  const events = useMemo(() => generateMockEvents(), []);
  const gasData = useMemo(() => collectGasData(traceSteps), [traceSteps]);

  const handleToggle = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  if (!transaction) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', p: 4 }}>
        <Typography variant="body2" sx={{ color: palette.textSecondary }}>
          Select a transaction to view its execution trace
        </Typography>
      </Box>
    );
  }

  const totalGas = traceSteps.reduce(function sumGas(acc: number, step: TraceStep): number {
    return acc + step.gasCost + (step.children?.reduce(sumGas, 0) || 0);
  }, 0);

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 2 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton size="small" onClick={onBack} sx={{ color: palette.textSecondary }}>
          <BackIcon fontSize="small" />
        </IconButton>
        <Typography variant="h6" sx={{ color: palette.text, fontWeight: 700, fontSize: 16 }}>
          Transaction Trace
        </Typography>
        <Chip
          label={transaction.status.toUpperCase()}
          size="small"
          sx={{
            bgcolor: transaction.status === 'success' ? palette.success + '22' : palette.error + '22',
            color: transaction.status === 'success' ? palette.success : palette.error,
            fontWeight: 600,
            fontSize: 10,
          }}
        />
      </Stack>

      {/* Transaction summary */}
      <Paper sx={{ bgcolor: palette.card, p: 1.5, mb: 2, borderRadius: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
          <Box>
            <Typography variant="caption" sx={{ color: palette.textSecondary }}>Hash</Typography>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography variant="body2" sx={{ color: palette.text, fontFamily: 'monospace', fontSize: 10 }}>
                {transaction.hash.slice(0, 18)}...
              </Typography>
              <IconButton size="small" onClick={() => navigator.clipboard.writeText(transaction.hash)} sx={{ color: palette.textSecondary, p: 0.25 }}>
                <CopyIcon sx={{ fontSize: 12 }} />
              </IconButton>
            </Stack>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: palette.textSecondary }}>Value</Typography>
            <Typography variant="body2" sx={{ color: palette.success, fontSize: 12, fontWeight: 600 }}>{transaction.value}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: palette.textSecondary }}>From</Typography>
            <Typography variant="body2" sx={{ color: palette.primary, fontFamily: 'monospace', fontSize: 10 }}>{transaction.from}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: palette.textSecondary }}>To</Typography>
            <Typography variant="body2" sx={{ color: palette.primary, fontFamily: 'monospace', fontSize: 10 }}>{transaction.to}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: palette.textSecondary }}>Gas Used</Typography>
            <Typography variant="body2" sx={{ color: palette.text, fontSize: 12 }}>{transaction.gasUsed.toLocaleString()}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: palette.textSecondary }}>Type</Typography>
            <Typography variant="body2" sx={{ color: palette.text, fontSize: 12 }}>{transaction.type}</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Execution trace tree */}
      <Paper sx={{ bgcolor: palette.card, borderRadius: 2, mb: 2, overflow: 'hidden' }}>
        <Box sx={{ px: 1.5, py: 1 }}>
          <Typography variant="caption" sx={{ color: palette.textSecondary, fontWeight: 600 }}>
            Execution Trace ({totalGas.toLocaleString()} gas)
          </Typography>
        </Box>
        <Divider sx={{ borderColor: palette.border }} />

        {/* Column headers */}
        <Box sx={{ display: 'flex', alignItems: 'center', px: 1, py: 0.5, borderBottom: `1px solid ${palette.border}` }}>
          <Box sx={{ width: 20 }} />
          <Box sx={{ width: 8, mr: 1 }} />
          <Typography variant="caption" sx={{ color: palette.textSecondary, width: 80, fontSize: 9, fontWeight: 600 }}>OPCODE</Typography>
          <Typography variant="caption" sx={{ color: palette.textSecondary, width: 60, fontSize: 9, fontWeight: 600, textAlign: 'right' }}>GAS</Typography>
          <Typography variant="caption" sx={{ color: palette.textSecondary, width: 30, fontSize: 9, fontWeight: 600, textAlign: 'center', mx: 1 }}>STK</Typography>
          <Typography variant="caption" sx={{ color: palette.textSecondary, fontSize: 9, fontWeight: 600, flex: 1 }}>DESCRIPTION</Typography>
        </Box>

        {traceSteps.map(step => (
          <TraceStepRow key={step.id} step={step} expandedIds={expandedIds} onToggle={handleToggle} />
        ))}
      </Paper>

      {/* Gas waterfall chart */}
      <Paper sx={{ bgcolor: palette.card, p: 1.5, mb: 2, borderRadius: 2 }}>
        <Typography variant="caption" sx={{ color: palette.textSecondary, fontWeight: 600, display: 'block', mb: 1 }}>
          Gas Usage by Operation
        </Typography>
        <Box sx={{ height: 200 }}>
          <Bar
            data={{
              labels: gasData.labels.slice(0, 10),
              datasets: [{
                label: 'Gas Cost',
                data: gasData.values.slice(0, 10),
                backgroundColor: gasData.colors.slice(0, 10).map(c => c + '99'),
                borderColor: gasData.colors.slice(0, 10),
                borderWidth: 1,
              }],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              indexAxis: 'y',
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (ctx) => `${(ctx.parsed.x ?? 0).toLocaleString()} gas`,
                  },
                },
              },
              scales: {
                x: {
                  ticks: { color: palette.textSecondary, font: { size: 9 } },
                  grid: { color: palette.border },
                },
                y: {
                  ticks: { color: palette.textSecondary, font: { size: 10, family: 'monospace' } },
                  grid: { display: false },
                },
              },
            }}
          />
        </Box>
      </Paper>

      {/* State changes */}
      <Paper sx={{ bgcolor: palette.card, borderRadius: 2, mb: 2, overflow: 'hidden' }}>
        <Box sx={{ px: 1.5, py: 1 }}>
          <Typography variant="caption" sx={{ color: palette.textSecondary, fontWeight: 600 }}>
            State Changes ({stateChanges.length})
          </Typography>
        </Box>
        <Divider sx={{ borderColor: palette.border }} />
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: palette.textSecondary, fontSize: 9, borderBottom: `1px solid ${palette.border}`, py: 0.5 }}>Address</TableCell>
              <TableCell sx={{ color: palette.textSecondary, fontSize: 9, borderBottom: `1px solid ${palette.border}`, py: 0.5 }}>Slot</TableCell>
              <TableCell sx={{ color: palette.textSecondary, fontSize: 9, borderBottom: `1px solid ${palette.border}`, py: 0.5 }}>Before</TableCell>
              <TableCell sx={{ color: palette.textSecondary, fontSize: 9, borderBottom: `1px solid ${palette.border}`, py: 0.5 }}>After</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stateChanges.map((sc, i) => (
              <TableRow key={i}>
                <TableCell sx={{ color: palette.primary, fontFamily: 'monospace', fontSize: 10, borderBottom: `1px solid ${palette.border}`, py: 0.5 }}>{sc.address}</TableCell>
                <TableCell sx={{ color: palette.warning, fontFamily: 'monospace', fontSize: 10, borderBottom: `1px solid ${palette.border}`, py: 0.5 }}>{sc.slot}</TableCell>
                <TableCell sx={{ color: palette.error, fontFamily: 'monospace', fontSize: 9, borderBottom: `1px solid ${palette.border}`, py: 0.5 }}>{sc.before}</TableCell>
                <TableCell sx={{ color: palette.success, fontFamily: 'monospace', fontSize: 9, borderBottom: `1px solid ${palette.border}`, py: 0.5 }}>{sc.after}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Events / Logs */}
      <Paper sx={{ bgcolor: palette.card, borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ px: 1.5, py: 1 }}>
          <Typography variant="caption" sx={{ color: palette.textSecondary, fontWeight: 600 }}>
            Events / Logs ({events.length})
          </Typography>
        </Box>
        <Divider sx={{ borderColor: palette.border }} />
        <Stack spacing={0} divider={<Divider sx={{ borderColor: palette.border }} />}>
          {events.map((evt, i) => (
            <Box key={i} sx={{ px: 1.5, py: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                <Chip
                  label={evt.name}
                  size="small"
                  sx={{ bgcolor: palette.success + '22', color: palette.success, fontSize: 10, height: 20, fontWeight: 600 }}
                />
                <Typography variant="caption" sx={{ color: palette.textSecondary, fontFamily: 'monospace', fontSize: 10 }}>
                  @ {evt.address}
                </Typography>
              </Stack>
              <Typography variant="caption" sx={{ color: palette.textSecondary, display: 'block', fontSize: 9 }}>
                Topics: {evt.topics.map(t => t.slice(0, 10) + '...').join(', ')}
              </Typography>
              <Typography variant="caption" sx={{ color: palette.textSecondary, display: 'block', fontSize: 9, mt: 0.25 }}>
                Data: {evt.data.slice(0, 30)}...
              </Typography>
            </Box>
          ))}
        </Stack>
      </Paper>
    </Box>
  );
};

// frontend#324: every figure in TransactionTraceSample is generated in-component; nothing
// on the testnet API backs it. The default build renders the honest not-live
// state and never mounts the sample.
const TransactionTrace: React.FC<TransactionTraceProps> = (props) => (
  <DemoSurfaceGate
    title="Execution traces are not live on the testnet yet"
    description="No trace or debug route is mounted on the testnet API."
    testId="transaction-trace"
    action={props.onBack ? <GateButton size="small" variant="outlined" onClick={props.onBack}>Back</GateButton> : undefined}
  >
    <TransactionTraceSample {...props} />
  </DemoSurfaceGate>
);

export default TransactionTrace;
