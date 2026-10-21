import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusWeak as FitIcon,
  GridOn as GridIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GRID_SIZE = 20;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.1;
const PORT_RADIUS = 6;
const NODE_WIDTH = 180;
const NODE_HEIGHT = 60;
const MINIMAP_W = 160;
const MINIMAP_H = 100;

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
  grid: 'rgba(51,65,85,0.35)',
};

const NODE_COLORS = {
  source: '#3B82F6',
  transform: '#F59E0B',
  ml: '#8B5CF6',
  output: '#10B981',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function snapToGrid(val) {
  return Math.round(val / GRID_SIZE) * GRID_SIZE;
}

function bezierPath(x1, y1, x2, y2) {
  const dx = Math.abs(x2 - x1) * 0.5;
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

function getOutputPortPos(node) {
  return { x: node.x + NODE_WIDTH, y: node.y + NODE_HEIGHT / 2 };
}

function getInputPortPos(node) {
  return { x: node.x, y: node.y + NODE_HEIGHT / 2 };
}

// ---------------------------------------------------------------------------
// Dot Grid Pattern
// ---------------------------------------------------------------------------

function GridDots({ zoom }) {
  const spacing = GRID_SIZE;
  return (
    <pattern
      id="pipeline-grid-dots"
      x="0"
      y="0"
      width={spacing}
      height={spacing}
      patternUnits="userSpaceOnUse"
    >
      <circle cx={spacing / 2} cy={spacing / 2} r={1} fill={colors.grid} />
    </pattern>
  );
}

// ---------------------------------------------------------------------------
// Single Node SVG
// ---------------------------------------------------------------------------

function CanvasNode({ node, isSelected, onMouseDown, onPortMouseDown }) {
  const color = NODE_COLORS[node.type] || colors.primary;
  const icons = { source: 'S', transform: 'T', ml: 'M', output: 'O' };
  const typeLabel = icons[node.type] || '?';

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      style={{ cursor: 'grab' }}
      onMouseDown={(e) => onMouseDown(e, node.id)}
    >
      {/* Shadow */}
      <rect
        x={2}
        y={2}
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        rx={8}
        fill="rgba(0,0,0,0.3)"
      />
      {/* Body */}
      <rect
        x={0}
        y={0}
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        rx={8}
        fill={colors.card}
        stroke={isSelected ? color : colors.border}
        strokeWidth={isSelected ? 2 : 1}
      />
      {/* Color bar */}
      <rect x={0} y={0} width={6} height={NODE_HEIGHT} rx={3} fill={color} />
      {/* Type icon circle */}
      <circle cx={24} cy={NODE_HEIGHT / 2} r={12} fill={`${color}33`} />
      <text
        x={24}
        y={NODE_HEIGHT / 2 + 4}
        textAnchor="middle"
        fontSize={11}
        fontWeight={700}
        fill={color}
      >
        {typeLabel}
      </text>
      {/* Label */}
      <text
        x={44}
        y={NODE_HEIGHT / 2 - 4}
        fontSize={11}
        fontWeight={600}
        fill={colors.text}
      >
        {(node.label || '').length > 16 ? node.label.slice(0, 15) + '...' : node.label}
      </text>
      <text
        x={44}
        y={NODE_HEIGHT / 2 + 12}
        fontSize={9}
        fill={colors.textSecondary}
      >
        {node.type.charAt(0).toUpperCase() + node.type.slice(1)} Node
      </text>

      {/* Input port */}
      {node.type !== 'source' && (
        <circle
          cx={0}
          cy={NODE_HEIGHT / 2}
          r={PORT_RADIUS}
          fill={colors.bg}
          stroke={color}
          strokeWidth={2}
          style={{ cursor: 'crosshair' }}
        />
      )}
      {/* Output port */}
      {node.type !== 'output' && (
        <circle
          cx={NODE_WIDTH}
          cy={NODE_HEIGHT / 2}
          r={PORT_RADIUS}
          fill={colors.bg}
          stroke={color}
          strokeWidth={2}
          style={{ cursor: 'crosshair' }}
          onMouseDown={(e) => {
            e.stopPropagation();
            onPortMouseDown(e, node.id);
          }}
        />
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Connection SVG
// ---------------------------------------------------------------------------

function Connection({ conn, nodes, isSelected, onClick }) {
  const sourceNode = nodes.find((n) => n.id === conn.sourceId);
  const targetNode = nodes.find((n) => n.id === conn.targetId);
  if (!sourceNode || !targetNode) return null;

  const from = getOutputPortPos(sourceNode);
  const to = getInputPortPos(targetNode);
  const path = bezierPath(from.x, from.y, to.x, to.y);
  const sourceColor = NODE_COLORS[sourceNode.type] || colors.primary;

  return (
    <g onClick={(e) => { e.stopPropagation(); onClick(conn.id); }} style={{ cursor: 'pointer' }}>
      {/* Hit area */}
      <path d={path} fill="none" stroke="transparent" strokeWidth={12} />
      {/* Visible line */}
      <path
        d={path}
        fill="none"
        stroke={isSelected ? colors.primary : sourceColor}
        strokeWidth={isSelected ? 3 : 2}
        strokeOpacity={isSelected ? 1 : 0.6}
      />
      {/* Flow arrow at midpoint */}
      {(() => {
        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2;
        const angle = Math.atan2(to.y - from.y, to.x - from.x) * (180 / Math.PI);
        return (
          <polygon
            points="-4,-3 4,0 -4,3"
            fill={isSelected ? colors.primary : sourceColor}
            opacity={isSelected ? 1 : 0.6}
            transform={`translate(${mx}, ${my}) rotate(${angle})`}
          />
        );
      })()}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Drag-in-progress line
// ---------------------------------------------------------------------------

function DraftConnection({ fromPos, toPos, sourceType }) {
  if (!fromPos || !toPos) return null;
  const path = bezierPath(fromPos.x, fromPos.y, toPos.x, toPos.y);
  const color = NODE_COLORS[sourceType] || colors.primary;
  return (
    <path
      d={path}
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeDasharray="6 4"
      opacity={0.7}
    />
  );
}

// ---------------------------------------------------------------------------
// MiniMap
// ---------------------------------------------------------------------------

function MiniMap({ nodes, connections, viewBox, canvasW, canvasH, zoom, panX, panY }) {
  if (nodes.length === 0) return null;

  const allX = nodes.map((n) => n.x);
  const allY = nodes.map((n) => n.y);
  const minX = Math.min(...allX) - 40;
  const minY = Math.min(...allY) - 40;
  const maxX = Math.max(...allX) + NODE_WIDTH + 40;
  const maxY = Math.max(...allY) + NODE_HEIGHT + 40;
  const worldW = maxX - minX || 400;
  const worldH = maxY - minY || 300;
  const scale = Math.min(MINIMAP_W / worldW, MINIMAP_H / worldH);

  const viewW = canvasW / zoom;
  const viewH = canvasH / zoom;
  const viewRectX = (-panX / zoom - minX) * scale;
  const viewRectY = (-panY / zoom - minY) * scale;
  const viewRectW = viewW * scale;
  const viewRectH = viewH * scale;

  return (
    <Paper
      sx={{
        position: 'absolute',
        bottom: 12,
        right: 12,
        width: MINIMAP_W + 8,
        height: MINIMAP_H + 8,
        bgcolor: 'rgba(15,23,42,0.9)',
        border: `1px solid ${colors.border}`,
        borderRadius: 1,
        overflow: 'hidden',
        p: '4px',
        pointerEvents: 'none',
      }}
    >
      <svg width={MINIMAP_W} height={MINIMAP_H}>
        {nodes.map((node) => {
          const nx = (node.x - minX) * scale;
          const ny = (node.y - minY) * scale;
          const nw = NODE_WIDTH * scale;
          const nh = NODE_HEIGHT * scale;
          return (
            <rect
              key={node.id}
              x={nx}
              y={ny}
              width={nw}
              height={nh}
              rx={2}
              fill={NODE_COLORS[node.type] || colors.primary}
              opacity={0.7}
            />
          );
        })}
        {connections.map((conn) => {
          const src = nodes.find((n) => n.id === conn.sourceId);
          const tgt = nodes.find((n) => n.id === conn.targetId);
          if (!src || !tgt) return null;
          const x1 = (src.x + NODE_WIDTH - minX) * scale;
          const y1 = (src.y + NODE_HEIGHT / 2 - minY) * scale;
          const x2 = (tgt.x - minX) * scale;
          const y2 = (tgt.y + NODE_HEIGHT / 2 - minY) * scale;
          return (
            <line
              key={conn.id}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={colors.textSecondary}
              strokeWidth={1}
              opacity={0.5}
            />
          );
        })}
        {/* Viewport rect */}
        <rect
          x={viewRectX}
          y={viewRectY}
          width={viewRectW}
          height={viewRectH}
          fill="none"
          stroke={colors.primary}
          strokeWidth={1.5}
          rx={1}
          opacity={0.8}
        />
      </svg>
    </Paper>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const PipelineCanvas = ({
  nodes,
  connections,
  selectedNodeId,
  selectedConnectionId,
  onSelectNode,
  onSelectConnection,
  onMoveNode,
  onDeleteConnection,
  onAddConnection,
  onDropNewNode,
}) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [dragNodeId, setDragNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [draftConn, setDraftConn] = useState(null); // { sourceId, fromPos, toPos }
  const [containerSize, setContainerSize] = useState({ w: 800, h: 600 });

  // Track container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Convert screen coords to canvas coords
  const screenToCanvas = useCallback((clientX, clientY) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - panX) / zoom,
      y: (clientY - rect.top - panY) / zoom,
    };
  }, [panX, panY, zoom]);

  // ---------------------------------------------------------------------------
  // Zoom
  // ---------------------------------------------------------------------------

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    setZoom((prev) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta)));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(MAX_ZOOM, prev + ZOOM_STEP));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(MIN_ZOOM, prev - ZOOM_STEP));
  }, []);

  const handleFitView = useCallback(() => {
    if (nodes.length === 0) {
      setZoom(1);
      setPanX(0);
      setPanY(0);
      return;
    }
    const allX = nodes.map((n) => n.x);
    const allY = nodes.map((n) => n.y);
    const minX = Math.min(...allX) - 60;
    const minY = Math.min(...allY) - 60;
    const maxX = Math.max(...allX) + NODE_WIDTH + 60;
    const maxY = Math.max(...allY) + NODE_HEIGHT + 60;
    const worldW = maxX - minX;
    const worldH = maxY - minY;
    const fitZoom = Math.min(containerSize.w / worldW, containerSize.h / worldH, 1.5);
    setZoom(fitZoom);
    setPanX(-minX * fitZoom + (containerSize.w - worldW * fitZoom) / 2);
    setPanY(-minY * fitZoom + (containerSize.h - worldH * fitZoom) / 2);
  }, [nodes, containerSize]);

  // ---------------------------------------------------------------------------
  // Pan
  // ---------------------------------------------------------------------------

  const handleCanvasMouseDown = useCallback((e) => {
    // Only pan when clicking on empty canvas area
    if (e.target === svgRef.current || e.target.tagName === 'rect' && e.target.getAttribute('data-bg') === 'true') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panX, y: e.clientY - panY });
      onSelectNode(null);
      onSelectConnection(null);
    }
  }, [panX, panY, onSelectNode, onSelectConnection]);

  // ---------------------------------------------------------------------------
  // Node drag
  // ---------------------------------------------------------------------------

  const handleNodeMouseDown = useCallback((e, nodeId) => {
    e.stopPropagation();
    const pos = screenToCanvas(e.clientX, e.clientY);
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    setDragNodeId(nodeId);
    setDragOffset({ x: pos.x - node.x, y: pos.y - node.y });
    onSelectNode(nodeId);
    onSelectConnection(null);
  }, [nodes, screenToCanvas, onSelectNode, onSelectConnection]);

  // ---------------------------------------------------------------------------
  // Port drag (connection creation)
  // ---------------------------------------------------------------------------

  const handlePortMouseDown = useCallback((e, sourceId) => {
    e.stopPropagation();
    const sourceNode = nodes.find((n) => n.id === sourceId);
    if (!sourceNode) return;
    const fromPos = getOutputPortPos(sourceNode);
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    setDraftConn({ sourceId, sourceType: sourceNode.type, fromPos, toPos: canvasPos });
  }, [nodes, screenToCanvas]);

  // ---------------------------------------------------------------------------
  // Global mouse move / up
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isPanning) {
        setPanX(e.clientX - panStart.x);
        setPanY(e.clientY - panStart.y);
        return;
      }
      if (dragNodeId) {
        const pos = screenToCanvas(e.clientX, e.clientY);
        const newX = snapToGrid(pos.x - dragOffset.x);
        const newY = snapToGrid(pos.y - dragOffset.y);
        onMoveNode(dragNodeId, newX, newY);
        return;
      }
      if (draftConn) {
        const canvasPos = screenToCanvas(e.clientX, e.clientY);
        setDraftConn((prev) => ({ ...prev, toPos: canvasPos }));
        return;
      }
    };

    const handleMouseUp = (e) => {
      if (isPanning) {
        setIsPanning(false);
        return;
      }
      if (dragNodeId) {
        setDragNodeId(null);
        return;
      }
      if (draftConn) {
        // Check if we landed on an input port
        const canvasPos = screenToCanvas(e.clientX, e.clientY);
        const targetNode = nodes.find((n) => {
          if (n.id === draftConn.sourceId) return false;
          if (n.type === 'source') return false; // Sources have no input port
          const inputPos = getInputPortPos(n);
          const dist = Math.sqrt((canvasPos.x - inputPos.x) ** 2 + (canvasPos.y - inputPos.y) ** 2);
          return dist < PORT_RADIUS * 3;
        });

        if (targetNode) {
          // Check no duplicate connection
          const exists = connections.some(
            (c) => c.sourceId === draftConn.sourceId && c.targetId === targetNode.id,
          );
          if (!exists) {
            onAddConnection(draftConn.sourceId, targetNode.id);
          }
        }
        setDraftConn(null);
        return;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning, panStart, dragNodeId, dragOffset, draftConn, nodes, connections, screenToCanvas, onMoveNode, onAddConnection]);

  // ---------------------------------------------------------------------------
  // Drop handler for new nodes from palette
  // ---------------------------------------------------------------------------

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const nodeType = e.dataTransfer.getData('application/pipeline-node-type');
    if (!nodeType) return;
    const pos = screenToCanvas(e.clientX, e.clientY);
    onDropNewNode(nodeType, snapToGrid(pos.x), snapToGrid(pos.y));
  }, [screenToCanvas, onDropNewNode]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  // ---------------------------------------------------------------------------
  // Delete selected connection
  // ---------------------------------------------------------------------------

  const handleKeyDown = useCallback((e) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedConnectionId) {
      onDeleteConnection(selectedConnectionId);
    }
  }, [selectedConnectionId, onDeleteConnection]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        bgcolor: colors.bg,
        borderRadius: 2,
        overflow: 'hidden',
        border: `1px solid ${colors.border}`,
        cursor: isPanning ? 'grabbing' : draftConn ? 'crosshair' : 'default',
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        onMouseDown={handleCanvasMouseDown}
        style={{ display: 'block' }}
      >
        <defs>
          <GridDots zoom={zoom} />
        </defs>

        {/* Grid background */}
        <rect
          data-bg="true"
          width="100%"
          height="100%"
          fill="url(#pipeline-grid-dots)"
          transform={`translate(${panX % (GRID_SIZE * zoom)}, ${panY % (GRID_SIZE * zoom)}) scale(${zoom})`}
        />

        {/* Transformed content */}
        <g transform={`translate(${panX}, ${panY}) scale(${zoom})`}>
          {/* Connections */}
          {connections.map((conn) => (
            <Connection
              key={conn.id}
              conn={conn}
              nodes={nodes}
              isSelected={selectedConnectionId === conn.id}
              onClick={onSelectConnection}
            />
          ))}

          {/* Draft connection in progress */}
          {draftConn && (
            <DraftConnection
              fromPos={draftConn.fromPos}
              toPos={draftConn.toPos}
              sourceType={draftConn.sourceType}
            />
          )}

          {/* Nodes */}
          {nodes.map((node) => (
            <CanvasNode
              key={node.id}
              node={node}
              isSelected={selectedNodeId === node.id}
              onMouseDown={handleNodeMouseDown}
              onPortMouseDown={handlePortMouseDown}
            />
          ))}
        </g>
      </svg>

      {/* Zoom controls */}
      <Paper
        sx={{
          position: 'absolute',
          top: 12,
          right: 12,
          bgcolor: 'rgba(30,41,59,0.95)',
          border: `1px solid ${colors.border}`,
          borderRadius: 1,
          display: 'flex',
          flexDirection: 'column',
          p: '2px',
        }}
      >
        <Tooltip title="Zoom In" placement="left">
          <IconButton size="small" onClick={handleZoomIn} sx={{ color: colors.textSecondary }}>
            <ZoomInIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Typography
          variant="caption"
          sx={{
            color: colors.textSecondary,
            textAlign: 'center',
            fontSize: '0.65rem',
            py: 0.25,
          }}
        >
          {(zoom * 100).toFixed(0)}%
        </Typography>
        <Tooltip title="Zoom Out" placement="left">
          <IconButton size="small" onClick={handleZoomOut} sx={{ color: colors.textSecondary }}>
            <ZoomOutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Fit View" placement="left">
          <IconButton size="small" onClick={handleFitView} sx={{ color: colors.textSecondary }}>
            <FitIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Paper>

      {/* Delete connection hint */}
      {selectedConnectionId && (
        <Paper
          sx={{
            position: 'absolute',
            bottom: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: 'rgba(30,41,59,0.95)',
            border: `1px solid ${colors.border}`,
            borderRadius: 1,
            px: 2,
            py: 0.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <DeleteIcon sx={{ fontSize: 14, color: colors.error }} />
          <Typography variant="caption" sx={{ color: colors.textSecondary }}>
            Press Delete to remove selected connection
          </Typography>
        </Paper>
      )}

      {/* Empty state */}
      {nodes.length === 0 && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <GridIcon sx={{ fontSize: 48, color: colors.border, mb: 1 }} />
          <Typography variant="body1" sx={{ color: colors.textSecondary }}>
            Drag nodes from the palette to start building
          </Typography>
          <Typography variant="caption" sx={{ color: colors.border }}>
            Connect output ports to input ports to create data flows
          </Typography>
        </Box>
      )}

      {/* MiniMap */}
      <MiniMap
        nodes={nodes}
        connections={connections}
        canvasW={containerSize.w}
        canvasH={containerSize.h}
        zoom={zoom}
        panX={panX}
        panY={panY}
      />
    </Box>
  );
};

export default PipelineCanvas;
