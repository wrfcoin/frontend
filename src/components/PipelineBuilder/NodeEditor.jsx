import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Divider,
  Chip,
} from '@mui/material';
import {
  Sensors as SensorsIcon,
  Transform as TransformIcon,
  Psychology as PsychologyIcon,
  Output as OutputIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  ContentCopy as DuplicateIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import PipelineCanvas from './PipelineCanvas';
import NodeConfig from './NodeConfig';

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
};

const NODE_TYPE_META = {
  source: { label: 'Data Source', description: 'Ingest from sensor / station', color: '#3B82F6', Icon: SensorsIcon },
  transform: { label: 'Transform', description: 'Filter, aggregate, math ops', color: '#F59E0B', Icon: TransformIcon },
  ml: { label: 'ML Model', description: 'AI inference / prediction', color: '#8B5CF6', Icon: PsychologyIcon },
  output: { label: 'Output', description: 'Alert, export, dashboard', color: '#10B981', Icon: OutputIcon },
};

const nextNodeId = 100;
const nextConnId = 500;

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ---------------------------------------------------------------------------
// Default pipeline (pre-built demo)
// ---------------------------------------------------------------------------

const DEFAULT_NODES = [
  {
    id: 'n1',
    type: 'source',
    label: 'NYC Station',
    x: 60,
    y: 100,
    config: { stationId: 'WS-001', parameters: ['temperature', 'humidity'], realtime: true },
  },
  {
    id: 'n2',
    type: 'transform',
    label: 'Moving Average',
    x: 320,
    y: 60,
    config: { operation: 'average', windowSize: 12 },
  },
  {
    id: 'n3',
    type: 'ml',
    label: 'Anomaly Detector',
    x: 580,
    y: 120,
    config: { modelId: 'anomaly-autoencoder', confidenceThreshold: 0.85 },
  },
  {
    id: 'n4',
    type: 'output',
    label: 'Email Alert',
    x: 840,
    y: 80,
    config: { destination: 'email', emailAddress: 'ops@wrfcoin.io' },
  },
];

const DEFAULT_CONNECTIONS = [
  { id: 'c1', sourceId: 'n1', targetId: 'n2' },
  { id: 'c2', sourceId: 'n2', targetId: 'n3' },
  { id: 'c3', sourceId: 'n3', targetId: 'n4' },
];

// ---------------------------------------------------------------------------
// Node Palette Item
// ---------------------------------------------------------------------------

function PaletteItem({ type, meta }) {
  const handleDragStart = useCallback((e) => {
    e.dataTransfer.setData('application/pipeline-node-type', type);
    e.dataTransfer.effectAllowed = 'copy';
  }, [type]);

  const { Icon, label, description, color } = meta;

  return (
    <Paper
      draggable
      onDragStart={handleDragStart}
      sx={{
        bgcolor: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 1.5,
        p: 1.5,
        cursor: 'grab',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        transition: 'border-color 0.15s, transform 0.1s',
        '&:hover': { borderColor: color, transform: 'translateY(-1px)' },
        '&:active': { cursor: 'grabbing', transform: 'scale(0.97)' },
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          bgcolor: `${color}22`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon sx={{ fontSize: 16, color }} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ color: colors.text, fontWeight: 600, fontSize: '0.75rem', lineHeight: 1.3 }}>
          {label}
        </Typography>
        <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: '0.65rem', lineHeight: 1.2 }}>
          {description}
        </Typography>
      </Box>
    </Paper>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const NodeEditor = ({ initialNodes, initialConnections, onChange }) => {
  const [nodes, setNodes] = useState(initialNodes || DEFAULT_NODES);
  const [connections, setConnections] = useState(initialConnections || DEFAULT_CONNECTIONS);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId), [nodes, selectedNodeId]);

  // ---------------------------------------------------------------------------
  // Notify parent on changes
  // ---------------------------------------------------------------------------

  const notifyChange = useCallback((newNodes, newConns) => {
    if (onChange) {
      onChange({ nodes: newNodes, connections: newConns });
    }
  }, [onChange]);

  // ---------------------------------------------------------------------------
  // History (simple undo support)
  // ---------------------------------------------------------------------------

  const pushHistory = useCallback(() => {
    setHistory((prev) => {
      const next = [...prev.slice(0, historyIndex + 1), { nodes: [...nodes], connections: [...connections] }];
      return next.slice(-30); // Keep last 30 states
    });
    setHistoryIndex((prev) => prev + 1);
  }, [nodes, connections, historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex < 0) return;
    const state = history[historyIndex];
    if (state) {
      setNodes(state.nodes);
      setConnections(state.connections);
      setHistoryIndex((prev) => prev - 1);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const nextIndex = historyIndex + 1;
    const state = history[nextIndex];
    if (state) {
      setNodes(state.nodes);
      setConnections(state.connections);
      setHistoryIndex(nextIndex);
    }
  }, [history, historyIndex]);

  // ---------------------------------------------------------------------------
  // Node operations
  // ---------------------------------------------------------------------------

  const handleMoveNode = useCallback((nodeId, x, y) => {
    setNodes((prev) => {
      const updated = prev.map((n) => (n.id === nodeId ? { ...n, x, y } : n));
      notifyChange(updated, connections);
      return updated;
    });
  }, [connections, notifyChange]);

  const handleDropNewNode = useCallback((nodeType, x, y) => {
    pushHistory();
    const defaultLabels = {
      source: 'New Source',
      transform: 'New Transform',
      ml: 'New ML Model',
      output: 'New Output',
    };
    const newNode = {
      id: makeId('node'),
      type: nodeType,
      label: defaultLabels[nodeType] || 'New Node',
      x,
      y,
      config: {},
    };
    setNodes((prev) => {
      const updated = [...prev, newNode];
      notifyChange(updated, connections);
      return updated;
    });
    setSelectedNodeId(newNode.id);
  }, [pushHistory, connections, notifyChange]);

  const handleDeleteNode = useCallback(() => {
    if (!selectedNodeId) return;
    pushHistory();
    setNodes((prev) => {
      const updated = prev.filter((n) => n.id !== selectedNodeId);
      const updatedConns = connections.filter(
        (c) => c.sourceId !== selectedNodeId && c.targetId !== selectedNodeId,
      );
      setConnections(updatedConns);
      notifyChange(updated, updatedConns);
      return updated;
    });
    setSelectedNodeId(null);
  }, [selectedNodeId, pushHistory, connections, notifyChange]);

  const handleDuplicateNode = useCallback(() => {
    if (!selectedNode) return;
    pushHistory();
    const newNode = {
      ...selectedNode,
      id: makeId('node'),
      label: `${selectedNode.label} (copy)`,
      x: selectedNode.x + 40,
      y: selectedNode.y + 40,
      config: { ...selectedNode.config },
    };
    setNodes((prev) => {
      const updated = [...prev, newNode];
      notifyChange(updated, connections);
      return updated;
    });
    setSelectedNodeId(newNode.id);
  }, [selectedNode, pushHistory, connections, notifyChange]);

  // ---------------------------------------------------------------------------
  // Connection operations
  // ---------------------------------------------------------------------------

  const handleAddConnection = useCallback((sourceId, targetId) => {
    pushHistory();
    const newConn = { id: makeId('conn'), sourceId, targetId };
    setConnections((prev) => {
      const updated = [...prev, newConn];
      notifyChange(nodes, updated);
      return updated;
    });
  }, [pushHistory, nodes, notifyChange]);

  const handleDeleteConnection = useCallback((connId) => {
    pushHistory();
    setConnections((prev) => {
      const updated = prev.filter((c) => c.id !== connId);
      notifyChange(nodes, updated);
      return updated;
    });
    setSelectedConnectionId(null);
  }, [pushHistory, nodes, notifyChange]);

  // ---------------------------------------------------------------------------
  // Node config update
  // ---------------------------------------------------------------------------

  const handleNodeConfigUpdate = useCallback((nodeId, newConfig) => {
    pushHistory();
    setNodes((prev) => {
      const updated = prev.map((n) => {
        if (n.id !== nodeId) return n;
        return {
          ...n,
          config: newConfig,
          label: newConfig.label || n.label,
        };
      });
      notifyChange(updated, connections);
      return updated;
    });
  }, [pushHistory, connections, notifyChange]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Box sx={{ display: 'flex', height: '100%', gap: 0 }}>
      {/* Left: Node Palette */}
      <Paper
        sx={{
          width: 180,
          bgcolor: colors.card,
          borderRight: `1px solid ${colors.border}`,
          borderRadius: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <Box sx={{ p: 1.5, borderBottom: `1px solid ${colors.border}` }}>
          <Typography variant="subtitle2" sx={{ color: colors.text, fontWeight: 600, fontSize: '0.8rem' }}>
            Node Palette
          </Typography>
          <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: '0.65rem' }}>
            Drag to canvas to add
          </Typography>
        </Box>
        <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 0.75, overflowY: 'auto', flex: 1 }}>
          {Object.entries(NODE_TYPE_META).map(([type, meta]) => (
            <PaletteItem key={type} type={type} meta={meta} />
          ))}
        </Box>

        {/* Toolbar */}
        <Divider sx={{ borderColor: colors.border }} />
        <Box sx={{ p: 1, display: 'flex', justifyContent: 'center', gap: 0.5 }}>
          <Tooltip title="Undo">
            <span>
              <IconButton
                size="small"
                onClick={handleUndo}
                disabled={historyIndex < 0}
                sx={{ color: colors.textSecondary, '&.Mui-disabled': { color: colors.border } }}
              >
                <UndoIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Redo">
            <span>
              <IconButton
                size="small"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                sx={{ color: colors.textSecondary, '&.Mui-disabled': { color: colors.border } }}
              >
                <RedoIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Duplicate Node">
            <span>
              <IconButton
                size="small"
                onClick={handleDuplicateNode}
                disabled={!selectedNodeId}
                sx={{ color: colors.textSecondary, '&.Mui-disabled': { color: colors.border } }}
              >
                <DuplicateIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Delete Node">
            <span>
              <IconButton
                size="small"
                onClick={handleDeleteNode}
                disabled={!selectedNodeId}
                sx={{ color: selectedNodeId ? colors.error : colors.border, '&.Mui-disabled': { color: colors.border } }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        {/* Stats */}
        <Divider sx={{ borderColor: colors.border }} />
        <Box sx={{ p: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: '0.65rem' }}>Nodes</Typography>
            <Typography variant="caption" sx={{ color: colors.text, fontWeight: 600, fontSize: '0.65rem' }}>{nodes.length}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: '0.65rem' }}>Connections</Typography>
            <Typography variant="caption" sx={{ color: colors.text, fontWeight: 600, fontSize: '0.65rem' }}>{connections.length}</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Center: Canvas */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        <PipelineCanvas
          nodes={nodes}
          connections={connections}
          selectedNodeId={selectedNodeId}
          selectedConnectionId={selectedConnectionId}
          onSelectNode={setSelectedNodeId}
          onSelectConnection={setSelectedConnectionId}
          onMoveNode={handleMoveNode}
          onDeleteConnection={handleDeleteConnection}
          onAddConnection={handleAddConnection}
          onDropNewNode={handleDropNewNode}
        />
      </Box>

      {/* Right: Config Panel */}
      <Box sx={{ width: 280, flexShrink: 0 }}>
        <NodeConfig
          node={selectedNode}
          onUpdate={handleNodeConfigUpdate}
          onClose={() => setSelectedNodeId(null)}
        />
      </Box>
    </Box>
  );
};

export default NodeEditor;
