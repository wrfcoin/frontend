import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import DemoSurfaceGate from '../common/DemoSurfaceGate';
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Stack,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  Slider,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  FitScreen as FitIcon,
  Refresh as RefreshIcon,
  AccountTree as DAGIcon,
  Hub as NetworkIcon,
  People as ValidatorIcon,
  Speed as SpeedIcon,
  Schedule as TimeIcon,
  Layers as BlocksIcon,
  SwapVert as TxIcon,
} from '@mui/icons-material';
import DAGGraph from './DAGGraph';
import type { DAGBlock, DAGEdge } from './DAGGraph';
import type { BlockTransaction } from './BlockDetail';
import BlockDetail from './BlockDetail';
import { apiClient } from '../../services/apiClient';
import TransactionTrace from './TransactionTrace';
import type { TransactionSummary } from './TransactionTrace';
import NetworkTopology from './NetworkTopology';
import ValidatorPanel from './ValidatorPanel';

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

type RightPanelView = 'block' | 'trace';
type BottomTab = 'dag' | 'network' | 'validators';

// --- Component ---

const DAGExplorerSample: React.FC = () => {
  // State
  const [blocks, setBlocks] = useState<DAGBlock[]>([]);
  const [edges, setEdges] = useState<DAGEdge[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [heightRange, setHeightRange] = useState<number[]>([100, 115]);
  const [rightPanel, setRightPanel] = useState<RightPanelView>('block');
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionSummary | null>(null);
  const [bottomTab, setBottomTab] = useState<BottomTab>('dag');
  const [blockTransactions, setBlockTransactions] = useState<BlockTransaction[]>([]);
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Derived
  const selectedBlock = useMemo(
    () => blocks.find(b => b.id === selectedBlockId) || null,
    [blocks, selectedBlockId],
  );

  const filteredBlocks = useMemo(
    () => blocks.filter(b => b.height >= heightRange[0] && b.height <= heightRange[1]),
    [blocks, heightRange],
  );

  const filteredEdges = useMemo(() => {
    const blockIds = new Set(filteredBlocks.map(b => b.id));
    return edges.filter(e => blockIds.has(e.source) && blockIds.has(e.target));
  }, [filteredBlocks, edges]);

  // Stats
  const stats = useMemo(() => {
    const totalBlocks = filteredBlocks.length;
    const totalTxs = filteredBlocks.reduce((s, b) => s + b.txCount, 0);
    const heights = [...new Set(filteredBlocks.map(b => b.height))].sort();
    const avgBlockTime = heights.length > 1 ? 12.0 : 0;
    const finalizedCount = filteredBlocks.filter(b => b.status === 'finalized').length;
    const latestHeight = filteredBlocks.length > 0 ? Math.max(...filteredBlocks.map(b => b.height)) : 0;
    const latestFinalized = Math.max(
      ...filteredBlocks.filter(b => b.status === 'finalized').map(b => b.height),
      0,
    );
    const finalityTime = (latestHeight - latestFinalized) * avgBlockTime;
    return { totalBlocks, totalTxs, avgBlockTime, finalityTime, finalizedCount };
  }, [filteredBlocks]);

  // Search handler
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) return;
    const q = searchQuery.trim().toLowerCase();

    // Search by height
    const heightNum = parseInt(q.replace('#', ''), 10);
    if (!isNaN(heightNum)) {
      const block = blocks.find(b => b.height === heightNum);
      if (block) { setSelectedBlockId(block.id); return; }
    }

    // Search by hash prefix
    const block = blocks.find(b => b.hash.toLowerCase().includes(q));
    if (block) { setSelectedBlockId(block.id); return; }
  }, [searchQuery, blocks]);

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

  // Initial DAG data fetch
  useEffect(() => {
    apiClient.get<{ blocks: DAGBlock[]; edges: DAGEdge[] }>('/dag/blocks')
      .then((data) => {
        if (data) {
          setBlocks(data.blocks ?? []);
          setEdges(data.edges ?? []);
        }
      })
      .catch(() => { /* keep empty lists */ });
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      autoRefreshRef.current = setInterval(() => {
        apiClient.get<{ blocks: DAGBlock[]; edges: DAGEdge[] }>('/dag/blocks')
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
  const handleNavigateBlock = useCallback((direction: 'prev' | 'next') => {
    if (!selectedBlock) return;
    const sorted = [...blocks].sort((a, b) => a.height - b.height || a.id.localeCompare(b.id));
    const idx = sorted.findIndex(b => b.id === selectedBlock.id);
    const nextIdx = direction === 'next' ? idx + 1 : idx - 1;
    if (nextIdx >= 0 && nextIdx < sorted.length) {
      setSelectedBlockId(sorted[nextIdx].id);
      setRightPanel('block');
      setSelectedTransaction(null);
    }
  }, [selectedBlock, blocks]);

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
    setRightPanel('trace');
  }, []);

  const handleBackFromTrace = useCallback(() => {
    setRightPanel('block');
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
        <Stack direction="row" alignItems="center" spacing={2} sx={{ flexWrap: 'wrap', gap: 1 }}>
          {/* Title */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <DAGIcon sx={{ color: palette.primary, fontSize: 22 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
              DAG Explorer
            </Typography>
          </Stack>

          {/* Search */}
          <TextField
            size="small"
            placeholder="Search block hash, height, or tx hash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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
                  <SearchIcon sx={{ color: palette.textSecondary, fontSize: 18 }} />
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
            <Typography variant="caption" sx={{ color: palette.textSecondary, minWidth: 36, textAlign: 'center' }}>
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
          <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 180 }}>
            <Typography variant="caption" sx={{ color: palette.textSecondary, whiteSpace: 'nowrap' }}>
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
            <Typography variant="caption" sx={{ color: palette.text, whiteSpace: 'nowrap', fontSize: 11 }}>
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
                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: palette.success } }}
              />
            }
            label={
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <RefreshIcon sx={{ color: autoRefresh ? palette.success : palette.textSecondary, fontSize: 14 }} />
                <Typography variant="caption" sx={{ color: palette.textSecondary }}>Live</Typography>
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
          <Typography variant="caption" sx={{ color: palette.textSecondary }}>
            Blocks: <span style={{ color: palette.text, fontWeight: 600 }}>{stats.totalBlocks}</span>
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <TxIcon sx={{ color: palette.primary, fontSize: 14 }} />
          <Typography variant="caption" sx={{ color: palette.textSecondary }}>
            Transactions: <span style={{ color: palette.text, fontWeight: 600 }}>{stats.totalTxs.toLocaleString()}</span>
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <SpeedIcon sx={{ color: palette.primary, fontSize: 14 }} />
          <Typography variant="caption" sx={{ color: palette.textSecondary }}>
            Avg Block Time: <span style={{ color: palette.text, fontWeight: 600 }}>{stats.avgBlockTime.toFixed(1)}s</span>
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <TimeIcon sx={{ color: palette.primary, fontSize: 14 }} />
          <Typography variant="caption" sx={{ color: palette.textSecondary }}>
            Finality: <span style={{ color: palette.warning, fontWeight: 600 }}>{stats.finalityTime.toFixed(0)}s</span>
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Typography variant="caption" sx={{ color: palette.textSecondary }}>
            Finalized: <span style={{ color: palette.success, fontWeight: 600 }}>{stats.finalizedCount}/{stats.totalBlocks}</span>
          </Typography>
        </Stack>
      </Stack>

      {/* Main content area: split view */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left panel: DAG Graph / Network / Validators */}
        <Box
          sx={{
            width: '60%',
            display: 'flex',
            flexDirection: 'column',
            borderRight: `1px solid ${palette.border}`,
          }}
        >
          {/* Bottom tab selector */}
          <Tabs
            value={bottomTab}
            onChange={(_, v) => setBottomTab(v)}
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
              '& .MuiTabs-indicator': { backgroundColor: palette.primary },
            }}
          >
            <Tab icon={<DAGIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="DAG Graph" value="dag" />
            <Tab icon={<NetworkIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Network" value="network" />
            <Tab icon={<ValidatorIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Validators" value="validators" />
          </Tabs>

          {/* Tab content */}
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            {bottomTab === 'dag' && (
              <DAGGraph
                blocks={filteredBlocks}
                edges={filteredEdges}
                selectedBlockId={selectedBlockId}
                onSelectBlock={setSelectedBlockId}
                zoomLevel={zoomLevel}
                onZoomChange={setZoomLevel}
              />
            )}
            {bottomTab === 'network' && <NetworkTopology />}
            {bottomTab === 'validators' && <ValidatorPanel />}
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
          <Box sx={{ px: 2, py: 0.75, borderBottom: `1px solid ${palette.border}`, flexShrink: 0 }}>
            <Stack direction="row" spacing={1}>
              <Chip
                label="Block Detail"
                size="small"
                onClick={() => { setRightPanel('block'); setSelectedTransaction(null); }}
                sx={{
                  bgcolor: rightPanel === 'block' ? palette.primary + '22' : 'transparent',
                  color: rightPanel === 'block' ? palette.primary : palette.textSecondary,
                  fontWeight: rightPanel === 'block' ? 600 : 400,
                  fontSize: 11,
                  cursor: 'pointer',
                  border: `1px solid ${rightPanel === 'block' ? palette.primary + '44' : palette.border}`,
                }}
              />
              <Chip
                label="Tx Trace"
                size="small"
                onClick={() => setRightPanel('trace')}
                sx={{
                  bgcolor: rightPanel === 'trace' ? palette.primary + '22' : 'transparent',
                  color: rightPanel === 'trace' ? palette.primary : palette.textSecondary,
                  fontWeight: rightPanel === 'trace' ? 600 : 400,
                  fontSize: 11,
                  cursor: 'pointer',
                  border: `1px solid ${rightPanel === 'trace' ? palette.primary + '44' : palette.border}`,
                }}
              />
            </Stack>
          </Box>

          {/* Right panel content */}
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            {rightPanel === 'block' ? (
              <BlockDetail
                block={selectedBlock}
                transactions={blockTransactions}
                onNavigateBlock={handleNavigateBlock}
                onSelectParent={(hash) => {
                  const parent = blocks.find(b => b.hash === hash);
                  if (parent) setSelectedBlockId(parent.id);
                }}
                onSelectTransaction={handleSelectTransaction}
              />
            ) : (
              <TransactionTrace
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

export default function DAGExplorer() {
  return <DemoSurfaceGate testId="dag-explorer" title="DAG data is unavailable"
    description="The DAG API is not served by the testnet. This graph preview is illustrative only.">
    <DAGExplorerSample />
  </DemoSurfaceGate>;
}
