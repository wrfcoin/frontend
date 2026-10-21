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
  LinearProgress,
} from '@mui/material';
import {
  ExpandMore as ExpandIcon,
  ChevronRight as CollapseIcon,
  ContentCopy as CopyIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';

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

export interface ExecutionTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasUsed: number;
  gasLimit: number;
  status: 'success' | 'failed';
  type: string;
}

interface ExecutionTraceViewerProps {
  transaction: ExecutionTransaction | null;
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
      id: '0',
      depth: 0,
      opcode: 'CALL',
      gasCost: 700,
      gasRemaining: 200000,
      stackDepth: 1,
      description: 'External call to WeatherOracle contract',
      category: 'call',
      children: [
        { id: '0.0', depth: 1, opcode: 'CALLDATALOAD', gasCost: 3, gasRemaining: 199297, stackDepth: 2, description: 'Load function selector', category: 'control' },
        { id: '0.1', depth: 1, opcode: 'SLOAD', gasCost: 2100, gasRemaining: 199294, stackDepth: 2, description: 'Load latestPrice from slot 0x03', category: 'storage' },
        { id: '0.2', depth: 1, opcode: 'PUSH32', gasCost: 3, gasRemaining: 197194, stackDepth: 3, description: 'Push price threshold constant', category: 'arithmetic' },
        { id: '0.3', depth: 1, opcode: 'GT', gasCost: 3, gasRemaining: 197191, stackDepth: 2, description: 'Compare price > threshold', category: 'arithmetic' },
        { id: '0.4', depth: 1, opcode: 'JUMPI', gasCost: 10, gasRemaining: 197188, stackDepth: 1, description: 'Conditional jump: price check passed', category: 'control' },
        {
          id: '0.5',
          depth: 1,
          opcode: 'CALL',
          gasCost: 700,
          gasRemaining: 197178,
          stackDepth: 2,
          description: 'Internal call to StakingRewards.distribute()',
          category: 'call',
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
      id: '1',
      depth: 0,
      opcode: 'SSTORE',
      gasCost: 5000,
      gasRemaining: 181748,
      stackDepth: 0,
      description: 'Update caller nonce (slot 0x00)',
      category: 'storage',
    },
    {
      id: '2',
      depth: 0,
      opcode: 'CALL',
      gasCost: 700,
      gasRemaining: 176748,
      stackDepth: 1,
      description: 'Transfer 2.5 WRF to beneficiary',
      category: 'call',
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
      id: '3',
      depth: 0,
      opcode: 'RETURN',
      gasCost: 0,
      gasRemaining: 160342,
      stackDepth: 0,
      description: 'Return execution result',
      category: 'control',
    },
  ];
}

function generateMockStateChanges(): StateChange[] {
  return [
    { address: '0x7a3b...e4f1', slot: '0x03', before: '0x00...0000 (0)', after: '0x00...1a2b (6699)' },
    { address: '0x7a3b...e4f1', slot: '0x04', before: '0x00...3f8a (16266)', after: '0x00...4012 (16402)' },
    { address: '0x9c1d...b8a2', slot: '0x02', before: '0x00...0fa0 (4000)', after: '0x00...1068 (4200)' },
    { address: '0x4e2f...c3d7', slot: '0x00', before: '0x8ac7...2300 (650.0 WRF)', after: '0x8697...d800 (647.5 WRF)' },
    { address: '0x1b5a...f9e6', slot: '0x00', before: '0x1bc1...6800 (32.0 WRF)', after: '0x1f7a...a000 (34.5 WRF)' },
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
        <Box sx={{ width: 20, flexShrink: 0 }}>
          {hasChildren &&
            (isExpanded ? (
              <ExpandIcon sx={{ fontSize: 16, color: palette.textSecondary }} />
            ) : (
              <CollapseIcon
                sx={{ fontSize: 16, color: palette.textSecondary }}
              />
            ))}
        </Box>

        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: catColor,
            mr: 1,
            flexShrink: 0,
          }}
        />

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

        <Typography
          variant="caption"
          sx={{
            color: palette.textSecondary,
            width: 60,
            flexShrink: 0,
            fontSize: 10,
            textAlign: 'right',
          }}
        >
          {step.gasCost.toLocaleString()} gas
        </Typography>

        <Typography
          variant="caption"
          sx={{
            color: palette.textSecondary,
            width: 30,
            flexShrink: 0,
            fontSize: 10,
            textAlign: 'center',
            mx: 1,
          }}
        >
          [{step.stackDepth}]
        </Typography>

        <Typography
          variant="caption"
          sx={{
            color: palette.text,
            fontSize: 10,
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {step.description}
        </Typography>
      </Box>

      {hasChildren &&
        isExpanded &&
        step.children!.map(child => (
          <TraceStepRow
            key={child.id}
            step={child}
            expandedIds={expandedIds}
            onToggle={onToggle}
          />
        ))}
    </>
  );
};

// --- Gas bar helper ---

function collectGasSteps(
  steps: TraceStep[],
): { label: string; gas: number; color: string }[] {
  const result: { label: string; gas: number; color: string }[] = [];

  function walk(step: TraceStep) {
    if (step.gasCost > 0) {
      result.push({
        label: step.opcode,
        gas: step.gasCost,
        color: CATEGORY_COLORS[step.category],
      });
    }
    step.children?.forEach(walk);
  }

  steps.forEach(walk);
  result.sort((a, b) => b.gas - a.gas);
  return result.slice(0, 8);
}

// --- Component ---

const ExecutionTraceViewerSample: React.FC<ExecutionTraceViewerProps> = ({
  transaction,
  onBack,
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(['0', '0.5', '2']),
  );
  const traceSteps = useMemo(() => generateMockTrace(), []);
  const stateChanges = useMemo(() => generateMockStateChanges(), []);
  const gasSteps = useMemo(() => collectGasSteps(traceSteps), [traceSteps]);

  const handleToggle = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  if (!transaction) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          p: 4,
        }}
      >
        <Typography variant="body2" sx={{ color: palette.textSecondary }}>
          Select a transaction to view its execution trace
        </Typography>
      </Box>
    );
  }

  const totalGas = traceSteps.reduce(function sumGas(
    acc: number,
    step: TraceStep,
  ): number {
    return acc + step.gasCost + (step.children?.reduce(sumGas, 0) || 0);
  }, 0);

  const maxGas = gasSteps.length > 0 ? gasSteps[0].gas : 1;

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 2 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton
          size="small"
          onClick={onBack}
          sx={{ color: palette.textSecondary }}
        >
          <BackIcon fontSize="small" />
        </IconButton>
        <Typography
          variant="h6"
          sx={{ color: palette.text, fontWeight: 700, fontSize: 16 }}
        >
          Execution Trace
        </Typography>
        <Chip
          label={transaction.status.toUpperCase()}
          size="small"
          sx={{
            bgcolor:
              transaction.status === 'success'
                ? palette.success + '22'
                : palette.error + '22',
            color:
              transaction.status === 'success'
                ? palette.success
                : palette.error,
            fontWeight: 600,
            fontSize: 10,
          }}
        />
      </Stack>

      {/* Transaction summary */}
      <Paper sx={{ bgcolor: palette.card, p: 1.5, mb: 2, borderRadius: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
          <Box>
            <Typography
              variant="caption"
              sx={{ color: palette.textSecondary }}
            >
              Hash
            </Typography>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography
                variant="body2"
                sx={{
                  color: palette.text,
                  fontFamily: 'monospace',
                  fontSize: 10,
                }}
              >
                {transaction.hash.slice(0, 18)}...
              </Typography>
              <IconButton
                size="small"
                onClick={() =>
                  navigator.clipboard.writeText(transaction.hash)
                }
                sx={{ color: palette.textSecondary, p: 0.25 }}
              >
                <CopyIcon sx={{ fontSize: 12 }} />
              </IconButton>
            </Stack>
          </Box>
          <Box>
            <Typography
              variant="caption"
              sx={{ color: palette.textSecondary }}
            >
              Value
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: palette.success, fontSize: 12, fontWeight: 600 }}
            >
              {transaction.value}
            </Typography>
          </Box>
          <Box>
            <Typography
              variant="caption"
              sx={{ color: palette.textSecondary }}
            >
              From
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: palette.primary,
                fontFamily: 'monospace',
                fontSize: 10,
              }}
            >
              {transaction.from}
            </Typography>
          </Box>
          <Box>
            <Typography
              variant="caption"
              sx={{ color: palette.textSecondary }}
            >
              To
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: palette.primary,
                fontFamily: 'monospace',
                fontSize: 10,
              }}
            >
              {transaction.to}
            </Typography>
          </Box>
          <Box>
            <Typography
              variant="caption"
              sx={{ color: palette.textSecondary }}
            >
              Gas Used
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: palette.text, fontSize: 12 }}
            >
              {transaction.gasUsed.toLocaleString()} /{' '}
              {transaction.gasLimit.toLocaleString()}
            </Typography>
          </Box>
          <Box>
            <Typography
              variant="caption"
              sx={{ color: palette.textSecondary }}
            >
              Type
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: palette.text, fontSize: 12 }}
            >
              {transaction.type}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Execution trace tree */}
      <Paper
        sx={{
          bgcolor: palette.card,
          borderRadius: 2,
          mb: 2,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ px: 1.5, py: 1 }}>
          <Typography
            variant="caption"
            sx={{ color: palette.textSecondary, fontWeight: 600 }}
          >
            Execution Trace ({totalGas.toLocaleString()} gas)
          </Typography>
        </Box>
        <Divider sx={{ borderColor: palette.border }} />

        {/* Column headers */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 1,
            py: 0.5,
            borderBottom: `1px solid ${palette.border}`,
          }}
        >
          <Box sx={{ width: 20 }} />
          <Box sx={{ width: 8, mr: 1 }} />
          <Typography
            variant="caption"
            sx={{
              color: palette.textSecondary,
              width: 80,
              fontSize: 9,
              fontWeight: 600,
            }}
          >
            OPCODE
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: palette.textSecondary,
              width: 60,
              fontSize: 9,
              fontWeight: 600,
              textAlign: 'right',
            }}
          >
            GAS
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: palette.textSecondary,
              width: 30,
              fontSize: 9,
              fontWeight: 600,
              textAlign: 'center',
              mx: 1,
            }}
          >
            STK
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: palette.textSecondary,
              fontSize: 9,
              fontWeight: 600,
              flex: 1,
            }}
          >
            DESCRIPTION
          </Typography>
        </Box>

        {traceSteps.map(step => (
          <TraceStepRow
            key={step.id}
            step={step}
            expandedIds={expandedIds}
            onToggle={handleToggle}
          />
        ))}
      </Paper>

      {/* Gas usage per step (bar visualization) */}
      <Paper sx={{ bgcolor: palette.card, p: 1.5, mb: 2, borderRadius: 2 }}>
        <Typography
          variant="caption"
          sx={{
            color: palette.textSecondary,
            fontWeight: 600,
            display: 'block',
            mb: 1,
          }}
        >
          Gas Usage by Operation
        </Typography>
        <Stack spacing={0.75}>
          {gasSteps.map((step, i) => (
            <Box key={i}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 0.25 }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: step.color,
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    fontSize: 10,
                  }}
                >
                  {step.label}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: palette.textSecondary, fontSize: 10 }}
                >
                  {step.gas.toLocaleString()} gas
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={(step.gas / maxGas) * 100}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: palette.border,
                  '& .MuiLinearProgress-bar': {
                    bgcolor: step.color,
                    borderRadius: 3,
                  },
                }}
              />
            </Box>
          ))}
        </Stack>
      </Paper>

      {/* State changes */}
      <Paper
        sx={{
          bgcolor: palette.card,
          borderRadius: 2,
          mb: 2,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ px: 1.5, py: 1 }}>
          <Typography
            variant="caption"
            sx={{ color: palette.textSecondary, fontWeight: 600 }}
          >
            State Changes ({stateChanges.length})
          </Typography>
        </Box>
        <Divider sx={{ borderColor: palette.border }} />
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  color: palette.textSecondary,
                  fontSize: 9,
                  borderBottom: `1px solid ${palette.border}`,
                  py: 0.5,
                }}
              >
                Address
              </TableCell>
              <TableCell
                sx={{
                  color: palette.textSecondary,
                  fontSize: 9,
                  borderBottom: `1px solid ${palette.border}`,
                  py: 0.5,
                }}
              >
                Slot
              </TableCell>
              <TableCell
                sx={{
                  color: palette.textSecondary,
                  fontSize: 9,
                  borderBottom: `1px solid ${palette.border}`,
                  py: 0.5,
                }}
              >
                Before
              </TableCell>
              <TableCell
                sx={{
                  color: palette.textSecondary,
                  fontSize: 9,
                  borderBottom: `1px solid ${palette.border}`,
                  py: 0.5,
                }}
              >
                After
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stateChanges.map((sc, i) => (
              <TableRow key={i}>
                <TableCell
                  sx={{
                    color: palette.primary,
                    fontFamily: 'monospace',
                    fontSize: 10,
                    borderBottom: `1px solid ${palette.border}`,
                    py: 0.5,
                  }}
                >
                  {sc.address}
                </TableCell>
                <TableCell
                  sx={{
                    color: palette.warning,
                    fontFamily: 'monospace',
                    fontSize: 10,
                    borderBottom: `1px solid ${palette.border}`,
                    py: 0.5,
                  }}
                >
                  {sc.slot}
                </TableCell>
                <TableCell
                  sx={{
                    color: palette.error,
                    fontFamily: 'monospace',
                    fontSize: 9,
                    borderBottom: `1px solid ${palette.border}`,
                    py: 0.5,
                  }}
                >
                  {sc.before}
                </TableCell>
                <TableCell
                  sx={{
                    color: palette.success,
                    fontFamily: 'monospace',
                    fontSize: 9,
                    borderBottom: `1px solid ${palette.border}`,
                    py: 0.5,
                  }}
                >
                  {sc.after}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

// frontend#324: every figure in ExecutionTraceViewerSample is generated in-component; nothing
// on the testnet API backs it. The default build renders the honest not-live
// state and never mounts the sample.
const ExecutionTraceViewer: React.FC<ExecutionTraceViewerProps> = (props) => (
  <DemoSurfaceGate
    title="Execution traces are not live on the testnet yet"
    description="No trace or debug route is mounted on the testnet API."
    testId="execution-trace"
    action={props.onBack ? <GateButton size="small" variant="outlined" onClick={props.onBack}>Back</GateButton> : undefined}
  >
    <ExecutionTraceViewerSample {...props} />
  </DemoSurfaceGate>
);

export default ExecutionTraceViewer;
