// ExecutionTraceViewer - Step-through execution trace viewer for blockchain transactions
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import DemoSurfaceGate from '../common/DemoSurfaceGate';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import InputBase from '@mui/material/InputBase';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { colors, spacing, borderRadius, shadows } from '../ui/tokens';
import WrfCard from '../ui/WrfCard';
import WrfStatCard from '../ui/WrfStatCard';
import WrfButton from '../ui/WrfButton';
import WrfBadge from '../ui/WrfBadge';

ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTitle, ChartTooltip, Legend);

// --- SVG Icons for step controls ---
const PlayIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);

const StepForwardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
  </svg>
);

const StepBackIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
  </svg>
);

const JumpStartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
    <rect x="4" y="6" width="2" height="12" />
  </svg>
);

const JumpEndIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
    <rect x="18" y="6" width="2" height="12" />
  </svg>
);

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

// --- Opcode color coding ---
type OpcodeCategory = 'arithmetic' | 'memory' | 'control' | 'error' | 'stack' | 'storage' | 'system';

const opcodeCategories: Record<string, OpcodeCategory> = {
  ADD: 'arithmetic', MUL: 'arithmetic', SUB: 'arithmetic', DIV: 'arithmetic',
  MOD: 'arithmetic', ADDMOD: 'arithmetic', MULMOD: 'arithmetic', EXP: 'arithmetic',
  SIGNEXTEND: 'arithmetic', LT: 'arithmetic', GT: 'arithmetic', SLT: 'arithmetic',
  SGT: 'arithmetic', EQ: 'arithmetic', ISZERO: 'arithmetic', AND: 'arithmetic',
  OR: 'arithmetic', XOR: 'arithmetic', NOT: 'arithmetic', SHL: 'arithmetic',
  SHR: 'arithmetic', SAR: 'arithmetic',
  MLOAD: 'memory', MSTORE: 'memory', MSTORE8: 'memory', MSIZE: 'memory',
  CALLDATALOAD: 'memory', CALLDATACOPY: 'memory', CODECOPY: 'memory',
  RETURNDATACOPY: 'memory', EXTCODECOPY: 'memory',
  JUMP: 'control', JUMPI: 'control', JUMPDEST: 'control',
  CALL: 'control', STATICCALL: 'control', DELEGATECALL: 'control',
  CREATE: 'control', CREATE2: 'control', RETURN: 'control',
  REVERT: 'error', INVALID: 'error', SELFDESTRUCT: 'error',
  PUSH1: 'stack', PUSH2: 'stack', PUSH4: 'stack', PUSH32: 'stack',
  POP: 'stack', DUP1: 'stack', DUP2: 'stack', SWAP1: 'stack', SWAP2: 'stack',
  SLOAD: 'storage', SSTORE: 'storage',
  GAS: 'system', GASPRICE: 'system', ORIGIN: 'system', CALLER: 'system',
  CALLVALUE: 'system', ADDRESS: 'system', BALANCE: 'system', TIMESTAMP: 'system',
  NUMBER: 'system', BLOCKHASH: 'system', COINBASE: 'system', DIFFICULTY: 'system',
  CHAINID: 'system', SELFBALANCE: 'system', BASEFEE: 'system', LOG0: 'system',
  LOG1: 'system', LOG2: 'system', LOG3: 'system', LOG4: 'system',
  SHA3: 'system', KECCAK256: 'system',
};

const categoryColors: Record<OpcodeCategory, string> = {
  arithmetic: colors.success.main,
  memory: colors.brand.primary,
  control: colors.warning.main,
  error: colors.error.main,
  stack: '#A78BFA',
  storage: '#F472B6',
  system: colors.text.secondary,
};

const getOpcodeColor = (opcode: string): string => {
  const cat = opcodeCategories[opcode];
  return cat ? categoryColors[cat] : colors.text.muted;
};

const getOpcodeCategory = (opcode: string): OpcodeCategory => {
  return opcodeCategories[opcode] || 'system';
};

// --- Mock trace data ---
interface CallFrame {
  id: number;
  depth: number;
  pc: number;
  opcode: string;
  gasCost: number;
  gasRemaining: number;
  stack: string[];
  memoryChange: string | null;
  storageRead: { slot: string; value: string } | null;
  storageWrite: { slot: string; oldValue: string; newValue: string } | null;
  description: string;
  children: CallFrame[];
}

const generateMockFrames = (): CallFrame[] => {
  const opcodeList: { opcode: string; gasCost: number; description: string }[] = [
    { opcode: 'PUSH1', gasCost: 3, description: 'Push 1-byte value onto stack' },
    { opcode: 'PUSH4', gasCost: 3, description: 'Push 4-byte value (function selector) onto stack' },
    { opcode: 'EQ', gasCost: 3, description: 'Compare top two stack values for equality' },
    { opcode: 'JUMPI', gasCost: 10, description: 'Conditional jump to destination' },
    { opcode: 'JUMPDEST', gasCost: 1, description: 'Mark valid jump destination' },
    { opcode: 'CALLDATALOAD', gasCost: 3, description: 'Load 32 bytes of input data from offset' },
    { opcode: 'SLOAD', gasCost: 2100, description: 'Load value from contract storage slot' },
    { opcode: 'ADD', gasCost: 3, description: 'Add top two stack values' },
    { opcode: 'MUL', gasCost: 5, description: 'Multiply top two stack values' },
    { opcode: 'DUP1', gasCost: 3, description: 'Duplicate top stack value' },
    { opcode: 'SWAP1', gasCost: 3, description: 'Swap top two stack values' },
    { opcode: 'MSTORE', gasCost: 3, description: 'Store 32-byte value in memory at offset' },
    { opcode: 'SSTORE', gasCost: 5000, description: 'Store value to contract storage slot' },
    { opcode: 'PUSH32', gasCost: 3, description: 'Push 32-byte value onto stack' },
    { opcode: 'SHA3', gasCost: 36, description: 'Compute Keccak-256 hash of memory region' },
    { opcode: 'AND', gasCost: 3, description: 'Bitwise AND of top two stack values' },
    { opcode: 'ISZERO', gasCost: 3, description: 'Check if top stack value is zero' },
    { opcode: 'CALL', gasCost: 700, description: 'Call external contract with value transfer' },
    { opcode: 'MLOAD', gasCost: 3, description: 'Load 32 bytes from memory at offset' },
    { opcode: 'GAS', gasCost: 2, description: 'Get remaining gas for current execution' },
    { opcode: 'CALLER', gasCost: 2, description: 'Get address of direct caller' },
    { opcode: 'CALLVALUE', gasCost: 2, description: 'Get value of current call in wei' },
    { opcode: 'TIMESTAMP', gasCost: 2, description: 'Get current block timestamp' },
    { opcode: 'GT', gasCost: 3, description: 'Greater-than comparison of top two stack values' },
    { opcode: 'REVERT', gasCost: 0, description: 'Revert execution with return data' },
    { opcode: 'LOG2', gasCost: 375, description: 'Emit log with 2 indexed topics' },
    { opcode: 'STATICCALL', gasCost: 700, description: 'Static call (no state modification allowed)' },
    { opcode: 'DELEGATECALL', gasCost: 700, description: 'Delegate call preserving caller context' },
    { opcode: 'RETURN', gasCost: 0, description: 'Return execution with data' },
  ];

  const frames: CallFrame[] = [];
  let gasRemaining = 3000000;
  let id = 0;

  const generateHex = (bytes: number) => {
    const chars = '0123456789abcdef';
    let result = '0x';
    for (let i = 0; i < bytes * 2; i++) {
      result += chars[Math.floor(Math.random() * 16)];
    }
    return result;
  };

  // Generate a flat list of 48 frames across 3 depth levels
  for (let i = 0; i < 48; i++) {
    const opcEntry = opcodeList[i % opcodeList.length];
    const depth = i < 12 ? 0 : i < 30 ? 1 : i < 42 ? 2 : 1;
    gasRemaining -= opcEntry.gasCost;

    const stackSize = 3 + Math.floor(Math.random() * 6);
    const stack: string[] = [];
    for (let s = 0; s < stackSize; s++) {
      stack.push(generateHex(32));
    }

    const frame: CallFrame = {
      id: id++,
      depth,
      pc: 100 + i * 3,
      opcode: opcEntry.opcode,
      gasCost: opcEntry.gasCost,
      gasRemaining,
      stack,
      memoryChange: opcEntry.opcode === 'MSTORE' || opcEntry.opcode === 'MLOAD'
        ? `[0x${(i * 32).toString(16).padStart(4, '0')}] = ${generateHex(32)}`
        : null,
      storageRead: opcEntry.opcode === 'SLOAD'
        ? { slot: generateHex(32), value: generateHex(32) }
        : null,
      storageWrite: opcEntry.opcode === 'SSTORE'
        ? { slot: generateHex(32), oldValue: generateHex(32), newValue: generateHex(32) }
        : null,
      description: opcEntry.description,
      children: [],
    };
    frames.push(frame);
  }

  // Build a nested tree structure from the flat list
  const root: CallFrame[] = [];
  const depthStack: CallFrame[][] = [root];

  for (const frame of frames) {
    while (depthStack.length > frame.depth + 1) {
      depthStack.pop();
    }
    if (frame.depth >= depthStack.length) {
      // Need to nest under the last frame at previous depth
      const parentList = depthStack[depthStack.length - 1];
      if (parentList.length > 0) {
        const parent = parentList[parentList.length - 1];
        depthStack.push(parent.children);
      }
    }
    const currentList = depthStack[depthStack.length - 1];
    currentList.push(frame);
  }

  return root;
};

// Flatten the tree for indexed stepping
const flattenFrames = (frames: CallFrame[]): CallFrame[] => {
  const result: CallFrame[] = [];
  const recurse = (list: CallFrame[]) => {
    for (const frame of list) {
      result.push(frame);
      if (frame.children.length > 0) {
        recurse(frame.children);
      }
    }
  };
  recurse(frames);
  return result;
};

// --- Monospace styling constants ---
const monoFont = '"JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas", monospace';

const ExecutionTraceViewerSample: React.FC = () => {
  const [txHash, setTxHash] = useState('0x7a3b9c1d8e2f4a5b6c0d9e8f7a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b');
  const [traceLoaded, setTraceLoaded] = useState(true);
  const [traceFrames] = useState<CallFrame[]>(() => generateMockFrames());
  const flatFrames = useMemo(() => flattenFrames(traceFrames), [traceFrames]);
  const [currentStep, setCurrentStep] = useState(0);
  const [expandedFrames, setExpandedFrames] = useState<Set<number>>(new Set([0, 1, 2, 3, 4, 5]));
  const [isPlaying, setIsPlaying] = useState(false);
  const playTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentFrame = flatFrames[currentStep] || flatFrames[0];

  // Auto-play logic
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= flatFrames.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 300);
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, flatFrames.length]);

  const handleLoadTrace = useCallback(() => {
    setTraceLoaded(true);
    setCurrentStep(0);
  }, []);

  const toggleFrame = useCallback((frameId: number) => {
    setExpandedFrames((prev) => {
      const next = new Set(prev);
      if (next.has(frameId)) {
        next.delete(frameId);
      } else {
        next.add(frameId);
      }
      return next;
    });
  }, []);

  const handleStepForward = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, flatFrames.length - 1));
  }, [flatFrames.length]);

  const handleStepBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleJumpStart = useCallback(() => {
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  const handleJumpEnd = useCallback(() => {
    setCurrentStep(flatFrames.length - 1);
    setIsPlaying(false);
  }, [flatFrames.length]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  // Stats computations
  const totalGasUsed = useMemo(
    () => flatFrames.reduce((sum, f) => sum + f.gasCost, 0),
    [flatFrames],
  );
  const maxCallDepth = useMemo(
    () => Math.max(...flatFrames.map((f) => f.depth)),
    [flatFrames],
  );
  const storageWrites = useMemo(
    () => flatFrames.filter((f) => f.storageWrite !== null).length,
    [flatFrames],
  );

  // Gas chart data - gas cost by groups of frames
  const gasChartData = useMemo(() => {
    const groupSize = 6;
    const labels: string[] = [];
    const data: number[] = [];
    const bgColors: string[] = [];

    for (let i = 0; i < flatFrames.length; i += groupSize) {
      const group = flatFrames.slice(i, i + groupSize);
      const totalGas = group.reduce((s, f) => s + f.gasCost, 0);
      const dominantOpcode = group.reduce((a, b) => (a.gasCost > b.gasCost ? a : b)).opcode;
      labels.push(`${i}-${Math.min(i + groupSize - 1, flatFrames.length - 1)}`);
      data.push(totalGas);
      bgColors.push(getOpcodeColor(dominantOpcode) + 'CC');
    }

    return {
      labels,
      datasets: [
        {
          label: 'Gas Cost',
          data,
          backgroundColor: bgColors,
          borderColor: bgColors.map((c) => c.replace('CC', 'FF')),
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  }, [flatFrames]);

  const gasChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
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
          ticks: { color: colors.text.muted, font: { size: 10 } },
          grid: { color: 'rgba(51, 65, 85, 0.3)' },
        },
        y: {
          ticks: { color: colors.text.muted, font: { size: 10 } },
          grid: { color: 'rgba(51, 65, 85, 0.3)' },
        },
      },
    }),
    [],
  );

  // Render a single call frame row in the trace tree
  const renderFrame = (frame: CallFrame, flatIndex: number) => {
    const isActive = currentStep === flatIndex;
    const hasChildren = frame.children.length > 0;
    const isExpanded = expandedFrames.has(frame.id);
    const opcodeColor = getOpcodeColor(frame.opcode);

    return (
      <React.Fragment key={frame.id}>
        <Box
          onClick={() => setCurrentStep(flatIndex)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            px: `${spacing.sm}px`,
            py: '3px',
            cursor: 'pointer',
            fontFamily: monoFont,
            fontSize: '0.8rem',
            backgroundColor: isActive ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
            borderLeft: isActive
              ? `3px solid ${colors.brand.primary}`
              : '3px solid transparent',
            '&:hover': {
              backgroundColor: isActive
                ? 'rgba(59, 130, 246, 0.16)'
                : 'rgba(148, 163, 184, 0.06)',
            },
            transition: 'background-color 0.1s ease',
          }}
        >
          {/* Line number */}
          <Typography
            component="span"
            sx={{
              fontFamily: monoFont,
              fontSize: '0.7rem',
              color: colors.text.muted,
              width: 36,
              textAlign: 'right',
              flexShrink: 0,
              mr: '6px',
              userSelect: 'none',
            }}
          >
            {flatIndex + 1}
          </Typography>

          {/* Depth indent */}
          <Box sx={{ width: frame.depth * 20, flexShrink: 0 }} />

          {/* Expand/Collapse toggle */}
          {hasChildren ? (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                toggleFrame(frame.id);
              }}
              sx={{
                color: colors.text.muted,
                width: 18,
                height: 18,
                p: 0,
                '&:hover': { color: colors.text.primary },
              }}
            >
              <ExpandIcon expanded={isExpanded} />
            </IconButton>
          ) : (
            <Box sx={{ width: 18, flexShrink: 0 }} />
          )}

          {/* PC */}
          <Typography
            component="span"
            sx={{
              fontFamily: monoFont,
              fontSize: '0.7rem',
              color: colors.text.muted,
              width: 42,
              textAlign: 'right',
              flexShrink: 0,
            }}
          >
            {frame.pc}
          </Typography>

          {/* Opcode */}
          <Typography
            component="span"
            sx={{
              fontFamily: monoFont,
              fontSize: '0.8rem',
              color: opcodeColor,
              fontWeight: 600,
              width: 120,
              flexShrink: 0,
              ml: '8px',
            }}
          >
            {frame.opcode}
          </Typography>

          {/* Gas cost */}
          <Typography
            component="span"
            sx={{
              fontFamily: monoFont,
              fontSize: '0.7rem',
              color: frame.gasCost >= 1000
                ? colors.warning.main
                : frame.gasCost >= 100
                  ? colors.warning.light
                  : colors.text.muted,
              width: 56,
              textAlign: 'right',
              flexShrink: 0,
            }}
          >
            {frame.gasCost.toLocaleString()}
          </Typography>

          {/* Stack top value */}
          <Typography
            component="span"
            sx={{
              fontFamily: monoFont,
              fontSize: '0.7rem',
              color: colors.text.secondary,
              ml: `${spacing.sm}px`,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              minWidth: 0,
            }}
          >
            {frame.stack.length > 0 ? frame.stack[0].slice(0, 22) + '...' : '--'}
          </Typography>

          {/* Memory/Storage indicator */}
          {frame.memoryChange && (
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: colors.brand.primary,
                flexShrink: 0,
                ml: '4px',
              }}
            />
          )}
          {frame.storageWrite && (
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: colors.warning.main,
                flexShrink: 0,
                ml: '4px',
              }}
            />
          )}
        </Box>

        {/* Render children if expanded */}
        {hasChildren && (
          <Collapse in={isExpanded}>
            {frame.children.map((child) => {
              const childFlatIndex = flatFrames.indexOf(child);
              return renderFrame(child, childFlatIndex);
            })}
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  // Hex memory viewer for the detail panel
  const renderHexView = (data: string) => {
    // Create a mock 64-byte memory slice display
    const rows: string[][] = [];
    const cleanHex = data.replace(/0x/gi, '').replace(/[^0-9a-fA-F]/g, '');
    for (let i = 0; i < 4; i++) {
      const offset = `0x${(i * 16).toString(16).padStart(4, '0')}`;
      const hexBytes: string[] = [];
      const asciiChars: string[] = [];
      for (let j = 0; j < 16; j++) {
        const idx = (i * 16 + j) * 2;
        if (idx + 1 < cleanHex.length) {
          const byte = cleanHex.slice(idx, idx + 2);
          hexBytes.push(byte);
          const charCode = parseInt(byte, 16);
          asciiChars.push(charCode >= 32 && charCode <= 126 ? String.fromCharCode(charCode) : '.');
        } else {
          hexBytes.push('00');
          asciiChars.push('.');
        }
      }
      rows.push([offset, hexBytes.join(' '), asciiChars.join('')]);
    }

    return (
      <Box
        sx={{
          fontFamily: monoFont,
          fontSize: '0.7rem',
          color: colors.text.secondary,
          backgroundColor: colors.bg.primary,
          borderRadius: `${borderRadius.sm}px`,
          p: `${spacing.sm}px`,
          border: `1px solid ${colors.border.default}`,
          overflowX: 'auto',
        }}
      >
        {rows.map((row, i) => (
          <Box key={i} sx={{ display: 'flex', gap: '12px', lineHeight: 1.8 }}>
            <Typography
              component="span"
              sx={{ fontFamily: monoFont, fontSize: '0.7rem', color: colors.text.muted, width: 50 }}
            >
              {row[0]}
            </Typography>
            <Typography
              component="span"
              sx={{ fontFamily: monoFont, fontSize: '0.7rem', color: colors.brand.primary, flex: 1 }}
            >
              {row[1]}
            </Typography>
            <Typography
              component="span"
              sx={{ fontFamily: monoFont, fontSize: '0.7rem', color: colors.text.muted }}
            >
              {row[2]}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  // Opcode legend
  const legendItems: { label: string; color: string }[] = [
    { label: 'Arithmetic', color: categoryColors.arithmetic },
    { label: 'Memory', color: categoryColors.memory },
    { label: 'Control Flow', color: categoryColors.control },
    { label: 'Error', color: categoryColors.error },
    { label: 'Stack', color: categoryColors.stack },
    { label: 'Storage', color: categoryColors.storage },
    { label: 'System', color: categoryColors.system },
  ];

  return (
    <Box sx={{ bgcolor: colors.bg.primary, color: colors.text.primary, minHeight: '100vh', p: 3 }}>
      {/* Page header */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: colors.text.primary, mb: 0.5 }}>
          Execution Trace Viewer
        </Typography>
        <Typography sx={{ fontSize: '0.875rem', color: colors.text.secondary }}>
          Step-through EVM execution debugger for blockchain transactions
        </Typography>
      </Box>

      {/* Transaction hash input */}
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
        <WrfButton variant="primary" size="md" onClick={handleLoadTrace}>
          Load Trace
        </WrfButton>
      </WrfCard>

      {/* Stat cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Total Steps"
            value={flatFrames.length.toLocaleString()}
            trend={0}
            color={colors.brand.primary}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Gas Used"
            value={totalGasUsed.toLocaleString()}
            trend={-2.4}
            trendLabel="vs avg"
            color={colors.success.main}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Call Depth"
            value={maxCallDepth.toString()}
            color={colors.warning.main}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Storage Writes"
            value={storageWrites.toString()}
            trend={1.2}
            trendLabel="this tx"
            color="#F472B6"
          />
        </Grid>
      </Grid>

      {/* Step controls */}
      <WrfCard sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Tooltip title="Jump to Start">
              <IconButton
                onClick={handleJumpStart}
                size="small"
                sx={{ color: colors.text.secondary, '&:hover': { color: colors.text.primary } }}
              >
                <JumpStartIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Step Back">
              <IconButton
                onClick={handleStepBack}
                disabled={currentStep <= 0}
                size="small"
                sx={{
                  color: colors.text.secondary,
                  '&:hover': { color: colors.text.primary },
                  '&.Mui-disabled': { color: colors.text.muted, opacity: 0.3 },
                }}
              >
                <StepBackIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={isPlaying ? 'Pause' : 'Play'}>
              <IconButton
                onClick={handlePlayPause}
                size="small"
                sx={{
                  color: isPlaying ? colors.warning.main : colors.success.main,
                  backgroundColor: isPlaying ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                  '&:hover': {
                    backgroundColor: isPlaying ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  },
                  mx: '4px',
                }}
              >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Step Forward">
              <IconButton
                onClick={handleStepForward}
                disabled={currentStep >= flatFrames.length - 1}
                size="small"
                sx={{
                  color: colors.text.secondary,
                  '&:hover': { color: colors.text.primary },
                  '&.Mui-disabled': { color: colors.text.muted, opacity: 0.3 },
                }}
              >
                <StepForwardIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Jump to End">
              <IconButton
                onClick={handleJumpEnd}
                size="small"
                sx={{ color: colors.text.secondary, '&:hover': { color: colors.text.primary } }}
              >
                <JumpEndIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.md}px` }}>
            <Typography sx={{ fontSize: '0.8rem', fontFamily: monoFont, color: colors.text.secondary }}>
              Step {currentStep + 1} / {flatFrames.length}
            </Typography>
            <WrfBadge
              status={isPlaying ? 'syncing' : 'online'}
              label={isPlaying ? 'Running' : 'Paused'}
              size="sm"
            />
          </Box>

          {/* Opcode legend */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px`, flexWrap: 'wrap' }}>
            {legendItems.map((item) => (
              <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: item.color,
                  }}
                />
                <Typography sx={{ fontSize: '0.65rem', color: colors.text.muted }}>
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </WrfCard>

      {traceLoaded && (
        <Grid container spacing={2}>
          {/* Left: Execution trace tree */}
          <Grid size={{ xs: 12, lg: 7 }}>
            <WrfCard title="Execution Trace" sx={{ mb: 2 }}>
              {/* Column headers */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  px: `${spacing.sm}px`,
                  py: '4px',
                  borderBottom: `1px solid ${colors.border.default}`,
                  mb: '4px',
                }}
              >
                <Typography sx={{ fontFamily: monoFont, fontSize: '0.65rem', color: colors.text.muted, width: 36, textAlign: 'right', mr: '6px' }}>
                  #
                </Typography>
                <Box sx={{ width: 18, flexShrink: 0 }} />
                <Typography sx={{ fontFamily: monoFont, fontSize: '0.65rem', color: colors.text.muted, width: 42, textAlign: 'right' }}>
                  PC
                </Typography>
                <Typography sx={{ fontFamily: monoFont, fontSize: '0.65rem', color: colors.text.muted, width: 120, ml: '8px' }}>
                  OPCODE
                </Typography>
                <Typography sx={{ fontFamily: monoFont, fontSize: '0.65rem', color: colors.text.muted, width: 56, textAlign: 'right' }}>
                  GAS
                </Typography>
                <Typography sx={{ fontFamily: monoFont, fontSize: '0.65rem', color: colors.text.muted, ml: `${spacing.sm}px`, flex: 1 }}>
                  STACK[0]
                </Typography>
              </Box>

              {/* Scrollable trace area */}
              <Box
                sx={{
                  maxHeight: 500,
                  overflowY: 'auto',
                  '&::-webkit-scrollbar': { width: 6 },
                  '&::-webkit-scrollbar-track': { backgroundColor: colors.bg.primary },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: colors.border.default,
                    borderRadius: 3,
                  },
                }}
              >
                {traceFrames.map((frame) => {
                  const flatIndex = flatFrames.indexOf(frame);
                  return renderFrame(frame, flatIndex);
                })}
              </Box>
            </WrfCard>
          </Grid>

          {/* Right: Frame detail panel */}
          <Grid size={{ xs: 12, lg: 5 }}>
            <WrfCard title="Frame Detail" subtitle={`Step ${currentStep + 1}: ${currentFrame.opcode}`} sx={{ mb: 2 }}>
              {/* Opcode description */}
              <Box
                sx={{
                  backgroundColor: colors.bg.primary,
                  borderRadius: `${borderRadius.sm}px`,
                  p: `${spacing.sm}px`,
                  mb: `${spacing.md}px`,
                  border: `1px solid ${colors.border.default}`,
                }}
              >
                <Typography
                  sx={{
                    fontFamily: monoFont,
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: getOpcodeColor(currentFrame.opcode),
                    mb: '4px',
                  }}
                >
                  {currentFrame.opcode}
                </Typography>
                <Typography sx={{ fontSize: '0.8rem', color: colors.text.secondary }}>
                  {currentFrame.description}
                </Typography>
                <Box sx={{ display: 'flex', gap: `${spacing.md}px`, mt: `${spacing.sm}px` }}>
                  <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted }}>
                    PC: <span style={{ color: colors.text.primary }}>{currentFrame.pc}</span>
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted }}>
                    Gas Cost: <span style={{ color: colors.warning.main }}>{currentFrame.gasCost.toLocaleString()}</span>
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted }}>
                    Gas Remaining: <span style={{ color: colors.success.main }}>{currentFrame.gasRemaining.toLocaleString()}</span>
                  </Typography>
                </Box>
              </Box>

              {/* Stack (top 8 values) */}
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: colors.text.secondary, mb: '4px' }}>
                Stack (top {Math.min(8, currentFrame.stack.length)} of {currentFrame.stack.length})
              </Typography>
              <Box
                sx={{
                  backgroundColor: colors.bg.primary,
                  borderRadius: `${borderRadius.sm}px`,
                  p: `${spacing.sm}px`,
                  mb: `${spacing.md}px`,
                  border: `1px solid ${colors.border.default}`,
                  maxHeight: 160,
                  overflowY: 'auto',
                }}
              >
                {currentFrame.stack.slice(0, 8).map((val, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: '8px', py: '2px' }}>
                    <Typography
                      component="span"
                      sx={{
                        fontFamily: monoFont,
                        fontSize: '0.7rem',
                        color: colors.text.muted,
                        width: 20,
                        textAlign: 'right',
                      }}
                    >
                      {i}
                    </Typography>
                    <Typography
                      component="span"
                      sx={{
                        fontFamily: monoFont,
                        fontSize: '0.7rem',
                        color: i === 0 ? colors.brand.primary : colors.text.secondary,
                        wordBreak: 'break-all',
                      }}
                    >
                      {val}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Memory slice hex view */}
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: colors.text.secondary, mb: '4px' }}>
                Memory Slice
              </Typography>
              {renderHexView(currentFrame.stack[0] || '0x00')}

              {/* Storage read/write */}
              {currentFrame.storageRead && (
                <Box sx={{ mt: `${spacing.md}px` }}>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: colors.text.secondary, mb: '4px' }}>
                    Storage Read
                  </Typography>
                  <Box
                    sx={{
                      backgroundColor: colors.bg.primary,
                      borderRadius: `${borderRadius.sm}px`,
                      p: `${spacing.sm}px`,
                      border: `1px solid ${colors.border.default}`,
                    }}
                  >
                    <Typography sx={{ fontFamily: monoFont, fontSize: '0.7rem', color: colors.text.muted, mb: '2px' }}>
                      Slot: <span style={{ color: colors.brand.primary }}>{currentFrame.storageRead.slot}</span>
                    </Typography>
                    <Typography sx={{ fontFamily: monoFont, fontSize: '0.7rem', color: colors.text.muted }}>
                      Value: <span style={{ color: colors.text.primary }}>{currentFrame.storageRead.value}</span>
                    </Typography>
                  </Box>
                </Box>
              )}

              {currentFrame.storageWrite && (
                <Box sx={{ mt: `${spacing.md}px` }}>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: colors.text.secondary, mb: '4px' }}>
                    Storage Write
                  </Typography>
                  <Box
                    sx={{
                      backgroundColor: colors.bg.primary,
                      borderRadius: `${borderRadius.sm}px`,
                      p: `${spacing.sm}px`,
                      border: `1px solid rgba(244, 114, 182, 0.3)`,
                    }}
                  >
                    <Typography sx={{ fontFamily: monoFont, fontSize: '0.7rem', color: colors.text.muted, mb: '2px' }}>
                      Slot: <span style={{ color: '#F472B6' }}>{currentFrame.storageWrite.slot}</span>
                    </Typography>
                    <Typography sx={{ fontFamily: monoFont, fontSize: '0.7rem', color: colors.text.muted, mb: '2px' }}>
                      Old: <span style={{ color: colors.error.light }}>{currentFrame.storageWrite.oldValue}</span>
                    </Typography>
                    <Typography sx={{ fontFamily: monoFont, fontSize: '0.7rem', color: colors.text.muted }}>
                      New: <span style={{ color: colors.success.light }}>{currentFrame.storageWrite.newValue}</span>
                    </Typography>
                  </Box>
                </Box>
              )}
            </WrfCard>

            {/* Gas usage bar chart */}
            <WrfCard title="Gas Usage per Frame Group" sx={{ mb: 2 }}>
              <Box sx={{ height: 220 }}>
                <Bar data={gasChartData} options={gasChartOptions} />
              </Box>
            </WrfCard>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

// frontend#324: every figure in ExecutionTraceViewerSample is generated in-component; nothing
// on the testnet API backs it. The default build renders the honest not-live
// state and never mounts the sample.
const ExecutionTraceViewer: React.FC = (props) => (
  <DemoSurfaceGate
    title="Execution traces are not live on the testnet yet"
    description="No trace or debug route is mounted on the testnet API."
    testId="debug-trace"
  >
    <ExecutionTraceViewerSample {...props} />
  </DemoSurfaceGate>
);

export default ExecutionTraceViewer;
