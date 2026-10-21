import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Chip,
  Tabs,
  Tab,
  Tooltip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  AccountTree as PipelineIcon,
  PlayArrow as PlayIcon,
  Save as SaveIcon,
  Share as ShareIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ContentCopy as DuplicateIcon,
  MoreVert as MoreIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  HourglassEmpty as IdleIcon,
  Schedule as ScheduleIcon,
  Search as SearchIcon,
  Storefront as MarketplaceIcon,
  Monitor as MonitorIcon,
  Close as CloseIcon,
  FolderOpen as OpenIcon,
  CloudUpload as PublishIcon,
  Loop as RunningIcon,
} from '@mui/icons-material';
import NodeEditor from './NodeEditor';
import RecipeMarketplace from './RecipeMarketplace';
import PipelineMonitor from './PipelineMonitor';
import FEATURES from '../../config/features';
import PublicViewerNotice from '../common/PublicViewerNotice';

// frontend#294 — the saved-pipeline list shipped with three fabricated
// pipelines carrying invented run history (147 runs / avg 45s, "last run"
// timestamps) and the execution monitor draws random throughput. No pipeline
// backend is mounted (capability `pipelines` = unavailable, backend#1130:
// data-flow-routes.js is not mounted). The builder itself is a real
// client-side editor, so it stays usable: the default build starts with an
// empty list, says so, and replaces the monitor with the honest not-live
// state. The sample pipelines and the monitor render only when
// FEATURES.demoSurfaces is explicitly on, under a "Sample data" badge.
const SAMPLE_BADGE_SX = { bgcolor: 'rgba(245, 158, 11, 0.16)', color: '#F59E0B', fontWeight: 600, height: 22 };

const SampleBadge = ({ testId }) => (
  <Chip label="Sample data" size="small" data-testid={testId} sx={SAMPLE_BADGE_SX} />
);

const NOT_LIVE_TITLE = 'Pipeline execution is not live on the testnet yet';
const NOT_LIVE_DESCRIPTION =
  'No pipeline backend is mounted on the testnet API. Pipelines you build here stay in this browser session, cannot be run, and have no run history.';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const colors = {
  bg: '#0F172A',
  card: '#1E293B',
  border: '#334155',
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  purple: '#8B5CF6',
};

const TAB_NAMES = {
  EDITOR: 0,
  PIPELINES: 1,
  MARKETPLACE: 2,
};

const STATUS_META = {
  idle: { color: colors.textSecondary, label: 'Idle', Icon: IdleIcon },
  running: { color: colors.primary, label: 'Running', Icon: RunningIcon },
  completed: { color: colors.success, label: 'Completed', Icon: SuccessIcon },
  error: { color: colors.error, label: 'Error', Icon: ErrorIcon },
};

// ---------------------------------------------------------------------------
// Mock Data - Saved Pipelines
// ---------------------------------------------------------------------------

const INITIAL_PIPELINES = [
  {
    id: 'pipe-1',
    name: 'Temperature Anomaly Detector',
    description: 'Detects unusual temperature readings from NYC weather stations using autoencoder-based anomaly detection. Sends email alerts when confidence exceeds 85%.',
    nodeCount: 4,
    connectionCount: 3,
    status: 'completed',
    lastRun: '2026-02-14T09:32:00Z',
    createdAt: '2026-01-05T14:00:00Z',
    runCount: 147,
    avgDurationSec: 45,
    nodes: [
      { id: 'n1', type: 'source', label: 'NYC Station', x: 60, y: 100, config: { stationId: 'WS-001', parameters: ['temperature', 'humidity'], realtime: true } },
      { id: 'n2', type: 'transform', label: 'Moving Average', x: 320, y: 60, config: { operation: 'average', windowSize: 12 } },
      { id: 'n3', type: 'ml', label: 'Anomaly Detector', x: 580, y: 120, config: { modelId: 'anomaly-autoencoder', confidenceThreshold: 0.85 } },
      { id: 'n4', type: 'output', label: 'Email Alert', x: 840, y: 80, config: { destination: 'email', emailAddress: 'ops@wrfcoin.io' } },
    ],
    connections: [
      { id: 'c1', sourceId: 'n1', targetId: 'n2' },
      { id: 'c2', sourceId: 'n2', targetId: 'n3' },
      { id: 'c3', sourceId: 'n3', targetId: 'n4' },
    ],
  },
  {
    id: 'pipe-2',
    name: 'Multi-Station Averaging',
    description: 'Collects temperature readings from three weather stations across the eastern seaboard, computes a weighted spatial average, and publishes results to the dashboard.',
    nodeCount: 5,
    connectionCount: 4,
    status: 'running',
    lastRun: '2026-02-14T10:15:00Z',
    createdAt: '2025-12-18T10:30:00Z',
    runCount: 312,
    avgDurationSec: 28,
    nodes: [
      { id: 'ms1', type: 'source', label: 'Station Alpha', x: 60, y: 40, config: { stationId: 'WS-001', parameters: ['temperature'], realtime: false } },
      { id: 'ms2', type: 'source', label: 'Station Beta', x: 60, y: 160, config: { stationId: 'WS-002', parameters: ['temperature'], realtime: false } },
      { id: 'ms3', type: 'source', label: 'Station Gamma', x: 60, y: 280, config: { stationId: 'WS-004', parameters: ['temperature'], realtime: false } },
      { id: 'ms4', type: 'transform', label: 'Weighted Average', x: 380, y: 140, config: { operation: 'average', windowSize: 1 } },
      { id: 'ms5', type: 'output', label: 'Dashboard Widget', x: 640, y: 140, config: { destination: 'dashboard', widgetTitle: 'Regional Avg Temp' } },
    ],
    connections: [
      { id: 'mc1', sourceId: 'ms1', targetId: 'ms4' },
      { id: 'mc2', sourceId: 'ms2', targetId: 'ms4' },
      { id: 'mc3', sourceId: 'ms3', targetId: 'ms4' },
      { id: 'mc4', sourceId: 'ms4', targetId: 'ms5' },
    ],
  },
  {
    id: 'pipe-3',
    name: 'Severe Weather Alert',
    description: 'Monitors pressure drops, wind speed spikes, and humidity surges to detect approaching severe weather systems. Triggers webhook notifications and on-chain records for reward verification.',
    nodeCount: 6,
    connectionCount: 5,
    status: 'idle',
    lastRun: '2026-02-13T16:45:00Z',
    createdAt: '2025-11-02T08:15:00Z',
    runCount: 89,
    avgDurationSec: 62,
    nodes: [
      { id: 'sw1', type: 'source', label: 'Denver Sensor', x: 60, y: 60, config: { stationId: 'WS-003', parameters: ['pressure', 'windSpeed', 'humidity'], realtime: true } },
      { id: 'sw2', type: 'transform', label: 'Derivative', x: 300, y: 40, config: { operation: 'derivative' } },
      { id: 'sw3', type: 'transform', label: 'Threshold Filter', x: 300, y: 180, config: { operation: 'threshold', thresholdDirection: 'above', thresholdValue: 25 } },
      { id: 'sw4', type: 'ml', label: 'Severe Weather CNN', x: 560, y: 100, config: { modelId: 'severe-weather-cnn', confidenceThreshold: 0.9 } },
      { id: 'sw5', type: 'output', label: 'Webhook Alert', x: 820, y: 60, config: { destination: 'webhook', webhookUrl: 'https://alerts.wrfcoin.io/severe' } },
      { id: 'sw6', type: 'output', label: 'On-Chain Record', x: 820, y: 180, config: { destination: 'blockchain' } },
    ],
    connections: [
      { id: 'sc1', sourceId: 'sw1', targetId: 'sw2' },
      { id: 'sc2', sourceId: 'sw1', targetId: 'sw3' },
      { id: 'sc3', sourceId: 'sw2', targetId: 'sw4' },
      { id: 'sc4', sourceId: 'sw4', targetId: 'sw5' },
      { id: 'sc5', sourceId: 'sw4', targetId: 'sw6' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Pipeline List Item
// ---------------------------------------------------------------------------

function PipelineRow({ pipeline, onOpen, onDuplicate, onDelete, isActive }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const statusMeta = STATUS_META[pipeline.status] || STATUS_META.idle;
  const StatusIcon = statusMeta.Icon;

  return (
    <TableRow
      hover
      sx={{
        cursor: 'pointer',
        bgcolor: isActive ? `${colors.primary}11` : 'transparent',
        '&:hover': { bgcolor: `${colors.primary}08` },
      }}
      onClick={() => onOpen(pipeline)}
    >
      <TableCell sx={{ borderColor: colors.border, py: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1.5,
              bgcolor: `${colors.primary}22`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <PipelineIcon sx={{ fontSize: 18, color: colors.primary }} />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: colors.text, fontWeight: 600 }}>
              {pipeline.name}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: colors.textSecondary,
                fontSize: '0.7rem',
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                maxWidth: 350,
              }}
            >
              {pipeline.description}
            </Typography>
          </Box>
        </Box>
      </TableCell>
      <TableCell sx={{ color: colors.text, borderColor: colors.border, py: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{pipeline.nodeCount}</Typography>
          <Typography variant="caption" sx={{ color: colors.textSecondary }}>nodes</Typography>
        </Box>
      </TableCell>
      <TableCell sx={{ borderColor: colors.border, py: 1.5 }}>
        <Chip
          icon={<StatusIcon sx={{ fontSize: 12, color: `${statusMeta.color} !important` }} />}
          label={statusMeta.label}
          size="small"
          sx={{
            height: 22,
            fontSize: '0.65rem',
            bgcolor: `${statusMeta.color}22`,
            color: statusMeta.color,
            border: `1px solid ${statusMeta.color}44`,
            '& .MuiChip-icon': { ml: '4px' },
          }}
        />
      </TableCell>
      <TableCell sx={{ color: colors.textSecondary, borderColor: colors.border, py: 1.5, fontSize: '0.75rem' }}>
        {pipeline.lastRun ? new Date(pipeline.lastRun).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never'}
      </TableCell>
      <TableCell sx={{ color: colors.textSecondary, borderColor: colors.border, py: 1.5, fontSize: '0.75rem' }}>
        {pipeline.runCount} runs / avg {pipeline.avgDurationSec}s
      </TableCell>
      <TableCell sx={{ borderColor: colors.border, py: 1.5 }} onClick={(e) => e.stopPropagation()}>
        <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ color: colors.textSecondary }}>
          <MoreIcon fontSize="small" />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          PaperProps={{ sx: { bgcolor: colors.card, border: `1px solid ${colors.border}` } }}
        >
          <MenuItem onClick={() => { onOpen(pipeline); setAnchorEl(null); }}>
            <ListItemIcon><OpenIcon sx={{ color: colors.primary, fontSize: 18 }} /></ListItemIcon>
            <ListItemText><Typography variant="body2" sx={{ color: colors.text }}>Open</Typography></ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { onDuplicate(pipeline); setAnchorEl(null); }}>
            <ListItemIcon><DuplicateIcon sx={{ color: colors.textSecondary, fontSize: 18 }} /></ListItemIcon>
            <ListItemText><Typography variant="body2" sx={{ color: colors.text }}>Duplicate</Typography></ListItemText>
          </MenuItem>
          <Divider sx={{ borderColor: colors.border }} />
          <MenuItem onClick={() => { onDelete(pipeline.id); setAnchorEl(null); }}>
            <ListItemIcon><DeleteIcon sx={{ color: colors.error, fontSize: 18 }} /></ListItemIcon>
            <ListItemText><Typography variant="body2" sx={{ color: colors.error }}>Delete</Typography></ListItemText>
          </MenuItem>
        </Menu>
      </TableCell>
    </TableRow>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const PipelineBuilder = () => {
  const [activeTab, setActiveTab] = useState(TAB_NAMES.PIPELINES);
  const showSample = FEATURES.demoSurfaces;
  const [pipelines, setPipelines] = useState(() => (showSample ? INITIAL_PIPELINES : []));
  const [activePipeline, setActivePipeline] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showMonitor, setShowMonitor] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [newPipelineName, setNewPipelineName] = useState('');
  const [newPipelineDesc, setNewPipelineDesc] = useState('');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  // ---------------------------------------------------------------------------
  // Pipeline CRUD
  // ---------------------------------------------------------------------------

  const handleNewPipeline = useCallback(() => {
    setNewPipelineName('');
    setNewPipelineDesc('');
    setSaveDialogOpen(true);
  }, []);

  const handleCreatePipeline = useCallback(() => {
    const newPipeline = {
      id: `pipe-${Date.now()}`,
      name: newPipelineName || 'Untitled Pipeline',
      description: newPipelineDesc || 'A new data processing pipeline.',
      nodeCount: 0,
      connectionCount: 0,
      status: 'idle',
      lastRun: null,
      createdAt: new Date().toISOString(),
      runCount: 0,
      avgDurationSec: 0,
      nodes: [],
      connections: [],
    };
    setPipelines((prev) => [newPipeline, ...prev]);
    setActivePipeline(newPipeline);
    setIsEditing(true);
    setActiveTab(TAB_NAMES.EDITOR);
    setSaveDialogOpen(false);
  }, [newPipelineName, newPipelineDesc]);

  const handleOpenPipeline = useCallback((pipeline) => {
    setActivePipeline(pipeline);
    setIsEditing(true);
    setActiveTab(TAB_NAMES.EDITOR);
    setShowMonitor(false);
  }, []);

  const handleDuplicatePipeline = useCallback((pipeline) => {
    const dup = {
      ...pipeline,
      id: `pipe-${Date.now()}`,
      name: `${pipeline.name} (copy)`,
      status: 'idle',
      lastRun: null,
      runCount: 0,
      createdAt: new Date().toISOString(),
      nodes: pipeline.nodes.map((n) => ({ ...n, id: `${n.id}-dup-${Date.now()}` })),
      connections: pipeline.connections.map((c) => ({ ...c, id: `${c.id}-dup-${Date.now()}` })),
    };
    setPipelines((prev) => [dup, ...prev]);
  }, []);

  const handleDeletePipeline = useCallback((pipelineId) => {
    setPipelines((prev) => prev.filter((p) => p.id !== pipelineId));
    if (activePipeline?.id === pipelineId) {
      setActivePipeline(null);
      setIsEditing(false);
      setActiveTab(TAB_NAMES.PIPELINES);
    }
  }, [activePipeline]);

  const handleSavePipeline = useCallback(() => {
    if (!activePipeline) return;
    setPipelines((prev) =>
      prev.map((p) => (p.id === activePipeline.id ? activePipeline : p)),
    );
  }, [activePipeline]);

  const handleEditorChange = useCallback(({ nodes, connections }) => {
    if (!activePipeline) return;
    setActivePipeline((prev) => ({
      ...prev,
      nodes,
      connections,
      nodeCount: nodes.length,
      connectionCount: connections.length,
    }));
  }, [activePipeline]);

  const handleRunPipeline = useCallback(() => {
    if (!activePipeline) return;
    setActivePipeline((prev) => ({ ...prev, status: 'running', lastRun: new Date().toISOString() }));
    setShowMonitor(true);
  }, [activePipeline]);

  const handleStopPipeline = useCallback(() => {
    if (!activePipeline) return;
    setActivePipeline((prev) => ({ ...prev, status: 'idle' }));
  }, [activePipeline]);

  // ---------------------------------------------------------------------------
  // Marketplace template usage
  // ---------------------------------------------------------------------------

  const handleUseTemplate = useCallback((recipe) => {
    const templatePipeline = {
      id: `pipe-${Date.now()}`,
      name: recipe.name,
      description: recipe.description,
      nodeCount: recipe.nodeCount,
      connectionCount: recipe.nodeCount - 1,
      status: 'idle',
      lastRun: null,
      createdAt: new Date().toISOString(),
      runCount: 0,
      avgDurationSec: 0,
      nodes: recipe.nodes.map((n, i) => ({
        id: `tmpl-${i}-${Date.now()}`,
        type: n.type,
        label: n.label,
        x: 60 + i * 220,
        y: 80 + (i % 2 === 0 ? 0 : 60),
        config: {},
      })),
      connections: recipe.nodes.slice(0, -1).map((_, i) => ({
        id: `tmpl-c${i}-${Date.now()}`,
        sourceId: `tmpl-${i}-${Date.now()}`,
        targetId: `tmpl-${i + 1}-${Date.now()}`,
      })),
    };
    setPipelines((prev) => [templatePipeline, ...prev]);
    setActivePipeline(templatePipeline);
    setIsEditing(true);
    setActiveTab(TAB_NAMES.EDITOR);
  }, []);

  // ---------------------------------------------------------------------------
  // Filtered pipelines
  // ---------------------------------------------------------------------------

  const filteredPipelines = useMemo(() => {
    if (!searchQuery.trim()) return pipelines;
    const q = searchQuery.toLowerCase();
    return pipelines.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    );
  }, [pipelines, searchQuery]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: colors.bg,
        color: colors.text,
        overflow: 'hidden',
      }}
    >
      {/* Top Bar */}
      <Paper
        sx={{
          bgcolor: colors.card,
          borderBottom: `1px solid ${colors.border}`,
          borderRadius: 0,
          px: 3,
          py: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1.5 }}>
            <PipelineIcon sx={{ color: colors.primary, fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
              Data Pipeline Builder
            </Typography>
          </Box>

          <Tabs
            value={activeTab}
            onChange={(_, val) => { setActiveTab(val); setShowMonitor(false); }}
            sx={{
              minHeight: 48,
              '& .MuiTab-root': {
                color: colors.textSecondary,
                textTransform: 'none',
                fontWeight: 500,
                minHeight: 48,
                fontSize: '0.85rem',
              },
              '& .Mui-selected': { color: colors.primary },
              '& .MuiTabs-indicator': { bgcolor: colors.primary },
            }}
          >
            <Tab label="Editor" disabled={!isEditing} />
            <Tab label="My Pipelines" />
            <Tab label="Recipe Marketplace" />
          </Tabs>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isEditing && activePipeline && (
            <>
              <Chip
                label={activePipeline.name}
                size="small"
                onDelete={() => { setIsEditing(false); setActiveTab(TAB_NAMES.PIPELINES); setShowMonitor(false); }}
                deleteIcon={<CloseIcon sx={{ fontSize: 14 }} />}
                sx={{
                  bgcolor: `${colors.primary}22`,
                  color: colors.primary,
                  border: `1px solid ${colors.primary}44`,
                  mr: 1,
                  maxWidth: 200,
                }}
              />
              <Tooltip title="Monitor Execution">
                <IconButton
                  size="small"
                  onClick={() => setShowMonitor((prev) => !prev)}
                  sx={{
                    color: showMonitor ? colors.primary : colors.textSecondary,
                    bgcolor: showMonitor ? `${colors.primary}22` : 'transparent',
                  }}
                >
                  <MonitorIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Run Pipeline">
                <IconButton
                  size="small"
                  onClick={handleRunPipeline}
                  sx={{ color: colors.success }}
                >
                  <PlayIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Save Pipeline">
                <IconButton
                  size="small"
                  onClick={handleSavePipeline}
                  sx={{ color: colors.textSecondary }}
                >
                  <SaveIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Share to Marketplace">
                <IconButton
                  size="small"
                  onClick={() => setShareDialogOpen(true)}
                  sx={{ color: colors.textSecondary }}
                >
                  <ShareIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
          {activeTab === TAB_NAMES.PIPELINES && (
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={handleNewPipeline}
              sx={{
                bgcolor: colors.primary,
                '&:hover': { bgcolor: '#2563EB' },
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              New Pipeline
            </Button>
          )}
        </Box>
      </Paper>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {/* TAB: Editor */}
        {activeTab === TAB_NAMES.EDITOR && isEditing && activePipeline && (
          <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <NodeEditor
                key={activePipeline.id}
                initialNodes={activePipeline.nodes}
                initialConnections={activePipeline.connections}
                onChange={handleEditorChange}
              />
            </Box>

            {/* Monitor side panel */}
            {showMonitor && (
              <Box
                sx={{
                  width: 380,
                  borderLeft: `1px solid ${colors.border}`,
                  bgcolor: colors.bg,
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ color: colors.text, fontWeight: 700 }}>
                      Execution Monitor
                    </Typography>
                    <IconButton size="small" onClick={() => setShowMonitor(false)} sx={{ color: colors.textSecondary }}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  {showSample ? (
                    <>
                      <Box sx={{ mb: 1.5 }}>
                        <SampleBadge testId="pipeline-monitor-sample-badge" />
                      </Box>
                      <PipelineMonitor
                        pipeline={activePipeline}
                        nodes={activePipeline.nodes}
                        onRun={handleRunPipeline}
                        onStop={handleStopPipeline}
                      />
                    </>
                  ) : (
                    <Box data-testid="pipeline-monitor-not-live">
                      <PublicViewerNotice reason="not-live" title={NOT_LIVE_TITLE} description={NOT_LIVE_DESCRIPTION} />
                    </Box>
                  )}
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* TAB: Editor -- no active pipeline */}
        {activeTab === TAB_NAMES.EDITOR && !isEditing && (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PipelineIcon sx={{ fontSize: 64, color: colors.border, mb: 2 }} />
            <Typography variant="h6" sx={{ color: colors.textSecondary, mb: 1 }}>
              No Pipeline Open
            </Typography>
            <Typography variant="body2" sx={{ color: colors.border, mb: 3 }}>
              Create a new pipeline or open an existing one from My Pipelines
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleNewPipeline}
                sx={{ bgcolor: colors.primary, '&:hover': { bgcolor: '#2563EB' }, textTransform: 'none' }}
              >
                New Pipeline
              </Button>
              <Button
                variant="outlined"
                startIcon={<OpenIcon />}
                onClick={() => setActiveTab(TAB_NAMES.PIPELINES)}
                sx={{ color: colors.textSecondary, borderColor: colors.border, textTransform: 'none', '&:hover': { borderColor: colors.primary } }}
              >
                My Pipelines
              </Button>
            </Box>
          </Box>
        )}

        {/* TAB: My Pipelines */}
        {activeTab === TAB_NAMES.PIPELINES && (
          <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
            {showSample ? (
              <Paper
                data-testid="pipeline-sample-banner"
                sx={{ bgcolor: colors.card, border: `1px solid ${colors.warning}`, p: 2, mb: 3 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography variant="subtitle1" sx={{ color: colors.warning, fontWeight: 700 }}>
                    Simulated preview — the saved pipelines and their run history are illustrative sample data
                  </Typography>
                  <SampleBadge testId="pipeline-list-sample-badge" />
                </Box>
                <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                  Shown because VITE_ENABLE_DEMO_SURFACES is on. No pipeline backend is mounted on the testnet API.
                </Typography>
              </Paper>
            ) : (
              <Box sx={{ mb: 3 }} data-testid="pipeline-list-not-live">
                <PublicViewerNotice reason="not-live" title={NOT_LIVE_TITLE} description={NOT_LIVE_DESCRIPTION} />
              </Box>
            )}
            {/* Search */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <TextField
                placeholder="Search pipelines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                sx={{
                  maxWidth: 400,
                  '& input': { color: colors.text },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border },
                  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.primary },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: colors.textSecondary, fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
              />
              <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                {filteredPipelines.length} pipeline{filteredPipelines.length !== 1 ? 's' : ''}
              </Typography>
            </Box>

            {/* Summary cards */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              {[
                { label: 'Total Pipelines', value: pipelines.length, color: colors.primary },
                { label: 'Running', value: pipelines.filter((p) => p.status === 'running').length, color: colors.success },
                { label: 'Errors', value: pipelines.filter((p) => p.status === 'error').length, color: colors.error },
                { label: 'Total Runs', value: pipelines.reduce((s, p) => s + p.runCount, 0), color: colors.purple },
              ].map((stat) => (
                <Paper
                  key={stat.label}
                  sx={{
                    flex: 1,
                    bgcolor: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 2,
                    p: 2,
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="h5" sx={{ color: stat.color, fontWeight: 700 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                    {stat.label}
                  </Typography>
                </Paper>
              ))}
            </Box>

            {/* Pipeline Table */}
            {filteredPipelines.length > 0 ? (
              <Paper sx={{ bgcolor: colors.card, border: `1px solid ${colors.border}`, borderRadius: 2, overflow: 'hidden' }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: colors.textSecondary, borderColor: colors.border, fontWeight: 600, fontSize: '0.75rem' }}>Pipeline</TableCell>
                        <TableCell sx={{ color: colors.textSecondary, borderColor: colors.border, fontWeight: 600, fontSize: '0.75rem' }}>Nodes</TableCell>
                        <TableCell sx={{ color: colors.textSecondary, borderColor: colors.border, fontWeight: 600, fontSize: '0.75rem' }}>Status</TableCell>
                        <TableCell sx={{ color: colors.textSecondary, borderColor: colors.border, fontWeight: 600, fontSize: '0.75rem' }}>Last Run</TableCell>
                        <TableCell sx={{ color: colors.textSecondary, borderColor: colors.border, fontWeight: 600, fontSize: '0.75rem' }}>Stats</TableCell>
                        <TableCell sx={{ color: colors.textSecondary, borderColor: colors.border, fontWeight: 600, fontSize: '0.75rem', width: 48 }}></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredPipelines.map((pipeline) => (
                        <PipelineRow
                          key={pipeline.id}
                          pipeline={pipeline}
                          isActive={activePipeline?.id === pipeline.id}
                          onOpen={handleOpenPipeline}
                          onDuplicate={handleDuplicatePipeline}
                          onDelete={handleDeletePipeline}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <PipelineIcon sx={{ fontSize: 48, color: colors.border, mb: 2 }} />
                <Typography variant="body1" sx={{ color: colors.textSecondary }}>
                  {searchQuery ? 'No pipelines match your search' : 'No pipelines yet'}
                </Typography>
                {!searchQuery && (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={handleNewPipeline}
                    sx={{ mt: 2, bgcolor: colors.primary, '&:hover': { bgcolor: '#2563EB' }, textTransform: 'none' }}
                  >
                    Create your first pipeline
                  </Button>
                )}
              </Box>
            )}
          </Box>
        )}

        {/* TAB: Marketplace */}
        {activeTab === TAB_NAMES.MARKETPLACE && (
          <Box sx={{ flex: 1, p: 3, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <RecipeMarketplace onUseTemplate={handleUseTemplate} />
          </Box>
        )}
      </Box>

      {/* New Pipeline Dialog */}
      <Dialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ color: colors.text }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AddIcon sx={{ color: colors.primary }} />
            Create New Pipeline
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Pipeline Name"
            value={newPipelineName}
            onChange={(e) => setNewPipelineName(e.target.value)}
            sx={{
              mt: 1,
              mb: 2,
              '& input': { color: colors.text },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border },
              '& .MuiInputLabel-root': { color: colors.textSecondary },
            }}
            placeholder="e.g., Temperature Quality Pipeline"
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            value={newPipelineDesc}
            onChange={(e) => setNewPipelineDesc(e.target.value)}
            sx={{
              '& textarea': { color: colors.text },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border },
              '& .MuiInputLabel-root': { color: colors.textSecondary },
            }}
            placeholder="Describe what this pipeline does..."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSaveDialogOpen(false)} sx={{ color: colors.textSecondary, textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreatePipeline}
            sx={{ bgcolor: colors.primary, '&:hover': { bgcolor: '#2563EB' }, textTransform: 'none' }}
          >
            Create Pipeline
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog */}
      <Dialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ color: colors.text }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PublishIcon sx={{ color: colors.primary }} />
            Share to Recipe Marketplace
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 2 }}>
            Publishing "{activePipeline?.name}" to the community marketplace allows other WRFCoin users to discover and use your pipeline as a template.
          </Typography>
          <Paper sx={{ bgcolor: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 1, p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" sx={{ color: colors.textSecondary }}>Pipeline</Typography>
              <Typography variant="caption" sx={{ color: colors.text, fontWeight: 600 }}>{activePipeline?.name}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" sx={{ color: colors.textSecondary }}>Nodes</Typography>
              <Typography variant="caption" sx={{ color: colors.text }}>{activePipeline?.nodeCount}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ color: colors.textSecondary }}>Total Runs</Typography>
              <Typography variant="caption" sx={{ color: colors.text }}>{activePipeline?.runCount}</Typography>
            </Box>
          </Paper>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Tags (comma separated)"
            placeholder="e.g., anomaly, temperature, quality"
            sx={{
              '& textarea': { color: colors.text },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border },
              '& .MuiInputLabel-root': { color: colors.textSecondary },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setShareDialogOpen(false)} sx={{ color: colors.textSecondary, textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<PublishIcon />}
            onClick={() => setShareDialogOpen(false)}
            sx={{ bgcolor: colors.success, '&:hover': { bgcolor: '#059669' }, textTransform: 'none' }}
          >
            Publish Recipe
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PipelineBuilder;
