import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Stack,
  Chip,
  Slider,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Search as SearchIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  FitScreen as FitIcon,
  Refresh as RefreshIcon,
  AccountTree as DAGIcon,
  Hub as BridgeIcon,
  People as ValidatorIcon,
  Speed as SpeedIcon,
  Schedule as TimeIcon,
  Layers as BlocksIcon,
  SwapVert as TxIcon,
  LocalGasStation as FeeIcon,
} from '@mui/icons-material';
import DAGGraph from './DAGGraph';
import type { DAGBlock } from './DAGGraph';
import { apiClient } from '../../services/apiClient';
import ExecutionTraceViewer from './ExecutionTraceViewer';
import type { ExecutionTransaction } from './ExecutionTraceViewer';
import ValidatorGrid from './ValidatorGrid';
import BridgeHealthGraph from './BridgeHealthGraph';
import FeeMarketChart from './FeeMarketChart';
import PublicViewerNotice from '../common/PublicViewerNotice';
import DemoSurfaceGate from '../common/DemoSurfaceGate';

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

// --- Block transaction type for detail panel ---

interface BlockTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasUsed: number;
  status: 'success' | 'failed';
  type: string;
}

// (generateMockTransactions removed — transactions fetched via API)

type LeftTab = 'dag' | 'bridges' | 'validators' | 'fees';
type RightView = 'block' | 'trace';

// --- Component ---

interface DAGData { blocks: DAGBlock[]; edges: import('./DAGGraph').DAGEdge[]; }

const DAGBlockExplorerSample: React.FC = () => {
  // State
  const [blocks, setBlocks] = useState<DAGBlock[]>([]);
  const [edges, setEdges] = useState<import('./DAGGraph').DAGEdge[]>([]);
  const [hasFetchedBlocks, setHasFetchedBlocks] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [heightRange, setHeightRange] = useState<number[]>([100, 118]);
  const [leftTab, setLeftTab] = useState<LeftTab>('dag');
  const [rightView, setRightView] = useState<RightView>('block');
  const [selectedTransaction, setSelectedTransaction] =
    useState<ExecutionTransaction | null>(null);
  const [blockTransactions, setBlockTransactions] = useState<BlockTransaction[]>([]);
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Derived
  const selectedBlock = useMemo(
    () => blocks.find(b => b.id === selectedBlockId) || null,
    [blocks, selectedBlockId],
  );

  const filteredBlocks = useMemo(
    () =>
      blocks.filter(
        b => b.height >= heightRange[0] && b.height <= heightRange[1],
      ),
    [blocks, heightRange],
  );

  const filteredEdges = useMemo(() => {
    const blockIds = new Set(filteredBlocks.map(b => b.id));
    return edges.filter(
      e => blockIds.has(e.source) && blockIds.has(e.target),
    );
  }, [filteredBlocks, edges]);

  // Stats
  const stats = useMemo(() => {
    const totalBlocks = filteredBlocks.length;
    const totalTxs = filteredBlocks.reduce((s, b) => s + b.txCount, 0);
    const confirmedCount = filteredBlocks.filter(
      b => b.status === 'confirmed',
    ).length;
    const avgBlockTime = 12.0;
    const consensusCount = filteredBlocks.filter(
      b => b.inConsensusSet,
    ).length;
    return {
      totalBlocks,
      totalTxs,
      avgBlockTime,
      confirmedCount,
      consensusCount,
    };
  }, [filteredBlocks]);

  // Search handler
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) return;
    const q = searchQuery.trim().toLowerCase();

    const heightNum = parseInt(q.replace('#', ''), 10);
    if (!isNaN(heightNum)) {
      const block = blocks.find(b => b.height === heightNum);
      if (block) {
        setSelectedBlockId(block.id);
        return;
      }
    }

    const block = blocks.find(b => b.hash.toLowerCase().includes(q));
    if (block) {
      setSelectedBlockId(block.id);
    }
  }, [searchQuery, blocks]);

  // Initial DAG data fetch
  useEffect(() => {
    apiClient.get<DAGData>('/dag/blocks')
      .then((data) => {
        if (data) {
          setBlocks(data.blocks ?? []);
          setEdges(data.edges ?? []);
        }
      })
      .catch(() => { /* keep empty lists */ })
      .finally(() => setHasFetchedBlocks(true));
  }, []);

  // Fetch transactions when selected block changes
  useEffect(() => {
    if (!selectedBlockId) {
      setBlockTransactions([]);
      return;
    }
    apiClient.get<BlockTransaction[]>(`/dag/blocks/${selectedBlockId}/transactions`)
      .then((data) => { if (data) setBlockTransactions(data); })
      .catch(() => { setBlockTransactions([]); });
  }, [selectedBlockId]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      autoRefreshRef.current = setInterval(() => {
        apiClient.get<DAGData>('/dag/blocks')
          .then((data) => {
            if (data) {
              setBlocks(data.blocks ?? []);
              setEdges(data.edges ?? []);
            }
          })
          .catch(() => { /* keep existing data */ });
      }, 5000);
    } else if (autoRefreshRef.current) {
      clearInterval(autoRefreshRef.current);
      autoRefreshRef.current = null;
    }
    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    };
  }, [autoRefresh]);

  // Block navigation
  const handleNavigateBlock = useCallback(
    (direction: 'prev' | 'next') => {
      if (!selectedBlock) return;
      const sorted = [...blocks].sort(
        (a, b) => a.height - b.height || a.id.localeCompare(b.id),
      );
      const idx = sorted.findIndex(b => b.id === selectedBlock.id);
      const nextIdx = direction === 'next' ? idx + 1 : idx - 1;
      if (nextIdx >= 0 && nextIdx < sorted.length) {
        setSelectedBlockId(sorted[nextIdx].id);
        setRightView('block');
        setSelectedTransaction(null);
      }
    },
    [selectedBlock, blocks],
  );

  const handleSelectTransaction = useCallback((tx: BlockTransaction) => {
    setSelectedTransaction({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      gasUsed: tx.gasUsed,
      gasLimit: 500000,
      status: tx.status,
      type: tx.type,
    });
    setRightView('trace');
  }, []);

  const handleBackFromTrace = useCallback(() => {
    setRightView('block');
    setSelectedTransaction(null);
  }, []);

  const minHeight = blocks.length > 0 ? Math.min(...blocks.map(b => b.height)) : 0;
  const maxHeight = blocks.length > 0 ? Math.max(...blocks.map(b => b.height)) : 200;

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: palette.bg,
        color: palette.text,
        overflow: 'hidden',
      }}
    >
      {/* Top Toolbar */}
      <Paper
        sx={{
          bgcolor: palette.card,
          borderRadius: 0,
          borderBottom: `1px solid ${palette.border}`,
          px: 2,
          py: 1,
          flexShrink: 0,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          sx={{ flexWrap: 'wrap', gap: 1 }}
        >
          {/* Title */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <DAGIcon sx={{ color: palette.primary, fontSize: 22 }} />
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}
            >
              Block Explorer (DAG)
            </Typography>
          </Stack>

          {/* Search */}
          <TextField
            size="small"
            placeholder="Search block hash, height, or tx hash..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            sx={{
              flex: 1,
              minWidth: 200,
              maxWidth: 400,
              '& .MuiOutlinedInput-root': {
                bgcolor: palette.bg,
                color: palette.text,
                fontSize: 13,
                '& fieldset': { borderColor: palette.border },
                '&:hover fieldset': { borderColor: palette.primary },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon
                    sx={{ color: palette.textSecondary, fontSize: 18 }}
                  />
                </InputAdornment>
              ),
            }}
          />

          {/* Zoom controls */}
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <IconButton
              size="small"
              onClick={() => setZoomLevel(z => Math.max(0.2, z - 0.2))}
              sx={{ color: palette.textSecondary }}
            >
              <ZoomOutIcon fontSize="small" />
            </IconButton>
            <Typography
              variant="caption"
              sx={{
                color: palette.textSecondary,
                minWidth: 36,
                textAlign: 'center',
              }}
            >
              {Math.round(zoomLevel * 100)}%
            </Typography>
            <IconButton
              size="small"
              onClick={() => setZoomLevel(z => Math.min(3, z + 0.2))}
              sx={{ color: palette.textSecondary }}
            >
              <ZoomInIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setZoomLevel(1)}
              sx={{ color: palette.textSecondary }}
            >
              <FitIcon fontSize="small" />
            </IconButton>
          </Stack>

          {/* Height range */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ minWidth: 180 }}
          >
            <Typography
              variant="caption"
              sx={{
                color: palette.textSecondary,
                whiteSpace: 'nowrap',
              }}
            >
              Heights:
            </Typography>
            <Slider
              value={heightRange}
              onChange={(_, val) => setHeightRange(val as number[])}
              min={minHeight}
              max={maxHeight}
              valueLabelDisplay="auto"
              size="small"
              sx={{
                color: palette.primary,
                '& .MuiSlider-thumb': { width: 14, height: 14 },
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: palette.text,
                whiteSpace: 'nowrap',
                fontSize: 11,
              }}
            >
              {heightRange[0]}-{heightRange[1]}
            </Typography>
          </Stack>

          {/* Auto-refresh */}
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(_, checked) => setAutoRefresh(checked)}
                size="small"
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: palette.success,
                  },
                }}
              />
            }
            label={
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <RefreshIcon
                  sx={{
                    color: autoRefresh
                      ? palette.success
                      : palette.textSecondary,
                    fontSize: 14,
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{ color: palette.textSecondary }}
                >
                  Live
                </Typography>
              </Stack>
            }
          />
        </Stack>
      </Paper>

      {/* Stats bar */}
      <Stack
        direction="row"
        spacing={2}
        sx={{
          px: 2,
          py: 0.75,
          borderBottom: `1px solid ${palette.border}`,
          flexShrink: 0,
          bgcolor: 'rgba(30,41,59,0.5)',
          flexWrap: 'wrap',
          gap: 0.5,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <BlocksIcon sx={{ color: palette.primary, fontSize: 14 }} />
          <Typography
            variant="caption"
            sx={{ color: palette.textSecondary }}
          >
            Blocks:{' '}
            <span style={{ color: palette.text, fontWeight: 600 }}>
              {stats.totalBlocks}
            </span>
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <TxIcon sx={{ color: palette.primary, fontSize: 14 }} />
          <Typography
            variant="caption"
            sx={{ color: palette.textSecondary }}
          >
            Transactions:{' '}
            <span style={{ color: palette.text, fontWeight: 600 }}>
              {stats.totalTxs.toLocaleString()}
            </span>
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <SpeedIcon sx={{ color: palette.primary, fontSize: 14 }} />
          <Typography
            variant="caption"
            sx={{ color: palette.textSecondary }}
          >
            Avg Block Time:{' '}
            <span style={{ color: palette.text, fontWeight: 600 }}>
              {stats.avgBlockTime.toFixed(1)}s
            </span>
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Typography
            variant="caption"
            sx={{ color: palette.textSecondary }}
          >
            Confirmed:{' '}
            <span style={{ color: palette.success, fontWeight: 600 }}>
              {stats.confirmedCount}/{stats.totalBlocks}
            </span>
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Typography
            variant="caption"
            sx={{ color: palette.textSecondary }}
          >
            Consensus Set:{' '}
            <span style={{ color: palette.primary, fontWeight: 600 }}>
              {stats.consensusCount}
            </span>
          </Typography>
        </Stack>
      </Stack>

      {/* Main content area: split view */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left panel */}
        <Box
          sx={{
            width: '60%',
            display: 'flex',
            flexDirection: 'column',
            borderRight: `1px solid ${palette.border}`,
          }}
        >
          {/* Tab selector */}
          <Tabs
            value={leftTab}
            onChange={(_, v) => setLeftTab(v)}
            sx={{
              minHeight: 36,
              borderBottom: `1px solid ${palette.border}`,
              '& .MuiTab-root': {
                color: palette.textSecondary,
                fontSize: 12,
                minHeight: 36,
                py: 0,
                textTransform: 'none',
              },
              '& .Mui-selected': { color: palette.primary },
              '& .MuiTabs-indicator': {
                backgroundColor: palette.primary,
              },
            }}
          >
            <Tab
              icon={<DAGIcon sx={{ fontSize: 16 }} />}
              iconPosition="start"
              label="DAG Graph"
              value="dag"
            />
            <Tab
              icon={<BridgeIcon sx={{ fontSize: 16 }} />}
              iconPosition="start"
              label="Bridges"
              value="bridges"
            />
            <Tab
              icon={<ValidatorIcon sx={{ fontSize: 16 }} />}
              iconPosition="start"
              label="Validators"
              value="validators"
            />
            <Tab
              icon={<FeeIcon sx={{ fontSize: 16 }} />}
              iconPosition="start"
              label="Fee Market"
              value="fees"
            />
          </Tabs>

          {/* Tab content */}
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            {leftTab === 'dag' && hasFetchedBlocks && blocks.length === 0 && (
              <PublicViewerNotice reason="not-live" sx={{ height: '100%' }} />
            )}
            {leftTab === 'dag' && (blocks.length > 0 || !hasFetchedBlocks) && (
              <DAGGraph
                blocks={filteredBlocks}
                edges={filteredEdges}
                selectedBlockId={selectedBlockId}
                onSelectBlock={setSelectedBlockId}
                zoomLevel={zoomLevel}
                onZoomChange={setZoomLevel}
              />
            )}
            {leftTab === 'bridges' && <BridgeHealthGraph />}
            {leftTab === 'validators' && <ValidatorGrid />}
            {leftTab === 'fees' && <FeeMarketChart />}
          </Box>
        </Box>

        {/* Right panel: Block detail or Transaction trace */}
        <Box
          sx={{
            width: '40%',
            bgcolor: palette.card,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Right panel header */}
          <Box
            sx={{
              px: 2,
              py: 0.75,
              borderBottom: `1px solid ${palette.border}`,
              flexShrink: 0,
            }}
          >
            <Stack direction="row" spacing={1}>
              <Chip
                label="Block Detail"
                size="small"
                onClick={() => {
                  setRightView('block');
                  setSelectedTransaction(null);
                }}
                sx={{
                  bgcolor:
                    rightView === 'block'
                      ? palette.primary + '22'
                      : 'transparent',
                  color:
                    rightView === 'block'
                      ? palette.primary
                      : palette.textSecondary,
                  fontWeight: rightView === 'block' ? 600 : 400,
                  fontSize: 11,
                  cursor: 'pointer',
                  border: `1px solid ${rightView === 'block' ? palette.primary + '44' : palette.border}`,
                }}
              />
              <Chip
                label="Tx Trace"
                size="small"
                onClick={() => setRightView('trace')}
                sx={{
                  bgcolor:
                    rightView === 'trace'
                      ? palette.primary + '22'
                      : 'transparent',
                  color:
                    rightView === 'trace'
                      ? palette.primary
                      : palette.textSecondary,
                  fontWeight: rightView === 'trace' ? 600 : 400,
                  fontSize: 11,
                  cursor: 'pointer',
                  border: `1px solid ${rightView === 'trace' ? palette.primary + '44' : palette.border}`,
                }}
              />
            </Stack>
          </Box>

          {/* Right panel content */}
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            {rightView === 'block' ? (
              <BlockDetailPanel
                block={selectedBlock}
                transactions={blockTransactions}
                onNavigateBlock={handleNavigateBlock}
                onSelectParent={hash => {
                  const parent = blocks.find(b => b.hash === hash);
                  if (parent) setSelectedBlockId(parent.id);
                }}
                onSelectTransaction={handleSelectTransaction}
              />
            ) : (
              <ExecutionTraceViewer
                transaction={selectedTransaction}
                onBack={handleBackFromTrace}
              />
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

// --- Block Detail Panel (inline sub-component) ---

interface BlockDetailPanelProps {
  block: DAGBlock | null;
  transactions: BlockTransaction[];
  onNavigateBlock: (direction: 'prev' | 'next') => void;
  onSelectParent: (hash: string) => void;
  onSelectTransaction: (tx: BlockTransaction) => void;
}

const BlockDetailPanel: React.FC<BlockDetailPanelProps> = ({
  block,
  transactions,
  onNavigateBlock,
  onSelectParent,
  onSelectTransaction,
}) => {
  if (!block) {
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
          Select a block in the DAG to view details
        </Typography>
      </Box>
    );
  }

  const statusColors: Record<string, string> = {
    confirmed: palette.success,
    pending: palette.warning,
    orphaned: palette.error,
  };
  const statusColor = statusColors[block.status] || palette.textSecondary;

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 2 }}>
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton
            size="small"
            onClick={() => onNavigateBlock('prev')}
            sx={{ color: palette.textSecondary }}
          >
            <Typography variant="caption">&lt;</Typography>
          </IconButton>
          <Typography
            variant="h6"
            sx={{ color: palette.text, fontWeight: 700 }}
          >
            Block #{block.height}
          </Typography>
          <IconButton
            size="small"
            onClick={() => onNavigateBlock('next')}
            sx={{ color: palette.textSecondary }}
          >
            <Typography variant="caption">&gt;</Typography>
          </IconButton>
        </Stack>
        <Stack direction="row" spacing={0.5}>
          <Chip
            label={block.status.toUpperCase()}
            size="small"
            sx={{
              bgcolor: statusColor + '22',
              color: statusColor,
              fontWeight: 600,
              fontSize: 11,
            }}
          />
          {block.inConsensusSet && (
            <Chip
              label="CONSENSUS"
              size="small"
              sx={{
                bgcolor: palette.primary + '22',
                color: palette.primary,
                fontWeight: 600,
                fontSize: 11,
              }}
            />
          )}
        </Stack>
      </Stack>

      {/* Block hash */}
      <Paper sx={{ bgcolor: palette.bg, p: 1.5, mb: 2, borderRadius: 2 }}>
        <Typography
          variant="caption"
          sx={{
            color: palette.textSecondary,
            display: 'block',
            mb: 0.5,
          }}
        >
          Block Hash
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: palette.text,
            fontFamily: 'monospace',
            fontSize: 12,
          }}
        >
          {block.hash}
        </Typography>
      </Paper>

      {/* Key details grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 1.5,
          mb: 2,
        }}
      >
        <Paper sx={{ bgcolor: palette.bg, p: 1.5, borderRadius: 2 }}>
          <Typography
            variant="caption"
            sx={{ color: palette.textSecondary }}
          >
            Timestamp
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: palette.text, fontSize: 12 }}
          >
            {new Date(block.timestamp).toLocaleString()}
          </Typography>
        </Paper>
        <Paper sx={{ bgcolor: palette.bg, p: 1.5, borderRadius: 2 }}>
          <Typography
            variant="caption"
            sx={{ color: palette.textSecondary }}
          >
            Proposer
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: palette.primary,
              fontSize: 12,
              fontFamily: 'monospace',
            }}
          >
            {block.proposer}
          </Typography>
        </Paper>
        <Paper sx={{ bgcolor: palette.bg, p: 1.5, borderRadius: 2 }}>
          <Typography
            variant="caption"
            sx={{ color: palette.textSecondary }}
          >
            Gas Used / Limit
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: palette.text, fontSize: 12 }}
          >
            {(block.gasUsed / 1_000_000).toFixed(1)}M /{' '}
            {(block.gasLimit / 1_000_000).toFixed(0)}M
            <Typography
              component="span"
              variant="caption"
              sx={{ color: palette.textSecondary, ml: 0.5 }}
            >
              ({((block.gasUsed / block.gasLimit) * 100).toFixed(1)}%)
            </Typography>
          </Typography>
        </Paper>
        <Paper sx={{ bgcolor: palette.bg, p: 1.5, borderRadius: 2 }}>
          <Typography
            variant="caption"
            sx={{ color: palette.textSecondary }}
          >
            Block Reward
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: palette.success,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {block.reward} WRF
          </Typography>
        </Paper>
      </Box>

      {/* Parent blocks */}
      <Paper sx={{ bgcolor: palette.bg, p: 1.5, mb: 2, borderRadius: 2 }}>
        <Typography
          variant="caption"
          sx={{
            color: palette.textSecondary,
            display: 'block',
            mb: 1,
          }}
        >
          Parent Blocks ({block.parentHashes.length})
        </Typography>
        <Stack spacing={0.5}>
          {block.parentHashes.map((hash, i) => (
            <Stack key={i} direction="row" alignItems="center" spacing={1}>
              <Typography
                variant="body2"
                sx={{
                  color: palette.primary,
                  fontFamily: 'monospace',
                  fontSize: 11,
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' },
                }}
                onClick={() => onSelectParent(hash)}
              >
                {hash}
              </Typography>
              {i === 0 && (
                <Chip
                  label="primary"
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: 9,
                    bgcolor: palette.primary + '22',
                    color: palette.primary,
                  }}
                />
              )}
            </Stack>
          ))}
        </Stack>
      </Paper>

      {/* Transactions */}
      <Paper
        sx={{
          bgcolor: palette.bg,
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ px: 1.5, py: 1 }}
        >
          <TxIcon sx={{ color: palette.primary, fontSize: 16 }} />
          <Typography
            variant="caption"
            sx={{ color: palette.textSecondary }}
          >
            Transactions ({block.txCount})
          </Typography>
        </Stack>
        <Box sx={{ borderTop: `1px solid ${palette.border}` }}>
          {transactions.slice(0, 8).map(tx => (
            <Box
              key={tx.hash}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 1.5,
                py: 0.75,
                borderBottom: `1px solid ${palette.border}`,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'rgba(59,130,246,0.06)' },
              }}
              onClick={() => onSelectTransaction(tx)}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor:
                      tx.status === 'success'
                        ? palette.success
                        : palette.error,
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: palette.primary,
                    fontFamily: 'monospace',
                    fontSize: 10,
                  }}
                >
                  {tx.hash.slice(0, 14)}...
                </Typography>
              </Stack>
              <Typography
                variant="caption"
                sx={{
                  color: palette.textSecondary,
                  fontSize: 10,
                }}
              >
                {tx.type}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: palette.text, fontSize: 10 }}
              >
                {tx.value}
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default function DAGBlockExplorer() {
  return <DemoSurfaceGate testId="dag-block-explorer" title="DAG data is unavailable"
    description="The DAG API is not served by the testnet. This block graph preview is illustrative only.">
    <DAGBlockExplorerSample />
  </DemoSurfaceGate>;
}
