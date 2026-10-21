import React, { useState, useMemo, useCallback } from 'react';
import { Box, Typography, Paper, Tooltip as MuiTooltip, Chip } from '@mui/material';
import Co2 from '@mui/icons-material/Co2';
import TrendingDown from '@mui/icons-material/TrendingDown';

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const EMISSION_SOURCES = [
  { id: 'scope1', label: 'Scope 1: Direct', value: 3420, color: '#EF4444', scope: 1 },
  { id: 'scope2', label: 'Scope 2: Electricity', value: 5180, color: '#F59E0B', scope: 2 },
  { id: 'scope3_supply', label: 'Scope 3: Supply Chain', value: 2890, color: '#8B5CF6', scope: 3 },
  { id: 'scope3_travel', label: 'Scope 3: Travel', value: 1357, color: '#A78BFA', scope: 3 },
];

const OFFSET_METHODS = [
  { id: 'renewable', label: 'Renewable Energy Credits', value: 3200, color: '#10B981' },
  { id: 'forest', label: 'Forest Carbon', value: 2850, color: '#059669' },
  { id: 'blue_carbon', label: 'Blue Carbon / Ocean', value: 1640, color: '#0EA5E9' },
  { id: 'dac', label: 'Direct Air Capture', value: 2420, color: '#6366F1' },
  { id: 'wrfcoin', label: 'WRFCoin Weather Data', value: 2737, color: '#3B82F6' },
];

const TOTAL_EMISSIONS = EMISSION_SOURCES.reduce((s, e) => s + e.value, 0);
const TOTAL_OFFSETS = OFFSET_METHODS.reduce((s, o) => s + o.value, 0);

// Flow connections: source -> offset with tonnage
const FLOWS = [
  { source: 'scope1', target: 'renewable', value: 1200 },
  { source: 'scope1', target: 'dac', value: 1100 },
  { source: 'scope1', target: 'wrfcoin', value: 1120 },
  { source: 'scope2', target: 'renewable', value: 2000 },
  { source: 'scope2', target: 'forest', value: 1580 },
  { source: 'scope2', target: 'blue_carbon', value: 1600 },
  { source: 'scope3_supply', target: 'forest', value: 1270 },
  { source: 'scope3_supply', target: 'wrfcoin', value: 1620 },
  { source: 'scope3_travel', target: 'dac', value: 1320 },
  { source: 'scope3_travel', target: 'blue_carbon', value: 37 },
];

// ---------------------------------------------------------------------------
// Layout calculations
// ---------------------------------------------------------------------------

const SVG_WIDTH = 900;
const SVG_HEIGHT = 480;
const NODE_WIDTH = 22;
const COL_LEFT = 40;
const COL_CENTER = SVG_WIDTH / 2 - NODE_WIDTH / 2;
const COL_RIGHT = SVG_WIDTH - 40 - NODE_WIDTH;
const VERTICAL_PADDING = 30;

function computeNodePositions(items, totalValue, colX, startY, availableHeight) {
  const gap = 12;
  const totalGap = gap * (items.length - 1);
  const scale = (availableHeight - totalGap) / totalValue;
  const positions = {};
  let y = startY;

  items.forEach((item) => {
    const height = Math.max(item.value * scale, 8);
    positions[item.id] = { x: colX, y, height, item };
    y += height + gap;
  });

  return positions;
}

function bezierPath(x0, y0, x1, y1, thickness0, thickness1) {
  const midX = (x0 + x1) / 2;
  return [
    `M ${x0},${y0}`,
    `C ${midX},${y0} ${midX},${y1} ${x1},${y1}`,
    `L ${x1},${y1 + thickness1}`,
    `C ${midX},${y1 + thickness1} ${midX},${y0 + thickness0} ${x0},${y0 + thickness0}`,
    'Z',
  ].join(' ');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SankeyDiagram = () => {
  const [hoveredFlow, setHoveredFlow] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  const sourcePositions = useMemo(
    () => computeNodePositions(EMISSION_SOURCES, TOTAL_EMISSIONS, COL_LEFT, VERTICAL_PADDING, SVG_HEIGHT - 2 * VERTICAL_PADDING),
    [],
  );

  const centerHeight = SVG_HEIGHT - 2 * VERTICAL_PADDING - 20;
  const centerY = VERTICAL_PADDING + 10;

  const offsetPositions = useMemo(
    () => computeNodePositions(OFFSET_METHODS, TOTAL_OFFSETS, COL_RIGHT, VERTICAL_PADDING, SVG_HEIGHT - 2 * VERTICAL_PADDING),
    [],
  );

  // Compute flow paths with stacking on each node port
  const flowPaths = useMemo(() => {
    // Track cumulative offsets per source and target node
    const sourceOffsets = {};
    const targetOffsets = {};
    const centerLeftOffset = { value: 0 };
    const centerRightOffset = { value: 0 };

    const scale = centerHeight / TOTAL_EMISSIONS;
    const offsetScale = centerHeight / TOTAL_OFFSETS;

    return FLOWS.map((flow) => {
      const src = sourcePositions[flow.source];
      const tgt = offsetPositions[flow.target];
      if (!src || !tgt) return null;

      // Source side
      const srcUsed = sourceOffsets[flow.source] || 0;
      const srcThickness = (flow.value / src.item.value) * src.height;
      sourceOffsets[flow.source] = srcUsed + srcThickness;

      // Center left port
      const clUsed = centerLeftOffset.value;
      const clThickness = flow.value * scale;
      centerLeftOffset.value = clUsed + clThickness;

      // Center right port
      const crUsed = centerRightOffset.value;
      const crThickness = flow.value * offsetScale;
      centerRightOffset.value = crUsed + crThickness;

      // Target side
      const tgtUsed = targetOffsets[flow.target] || 0;
      const tgtThickness = (flow.value / tgt.item.value) * tgt.height;
      targetOffsets[flow.target] = tgtUsed + tgtThickness;

      // Left path: source -> center
      const leftPath = bezierPath(
        COL_LEFT + NODE_WIDTH,
        src.y + srcUsed,
        COL_CENTER,
        centerY + clUsed,
        srcThickness,
        clThickness,
      );

      // Right path: center -> target
      const rightPath = bezierPath(
        COL_CENTER + NODE_WIDTH,
        centerY + crUsed,
        COL_RIGHT,
        tgt.y + tgtUsed,
        crThickness,
        tgtThickness,
      );

      return {
        ...flow,
        leftPath,
        rightPath,
        sourceColor: src.item.color,
        targetColor: tgt.item.color,
        percentage: ((flow.value / TOTAL_EMISSIONS) * 100).toFixed(1),
      };
    }).filter(Boolean);
  }, [sourcePositions, offsetPositions, centerHeight, centerY]);

  const handleNodeClick = useCallback((nodeId) => {
    setSelectedNode((prev) => (prev === nodeId ? null : nodeId));
  }, []);

  const getNodeDetails = useCallback((nodeId) => {
    const source = EMISSION_SOURCES.find((s) => s.id === nodeId);
    if (source) {
      const relatedFlows = FLOWS.filter((f) => f.source === nodeId);
      return {
        type: 'source',
        item: source,
        flows: relatedFlows.map((f) => ({
          target: OFFSET_METHODS.find((o) => o.id === f.target)?.label,
          value: f.value,
        })),
      };
    }
    const offset = OFFSET_METHODS.find((o) => o.id === nodeId);
    if (offset) {
      const relatedFlows = FLOWS.filter((f) => f.target === nodeId);
      return {
        type: 'offset',
        item: offset,
        flows: relatedFlows.map((f) => ({
          source: EMISSION_SOURCES.find((s) => s.id === f.source)?.label,
          value: f.value,
        })),
      };
    }
    return null;
  }, []);

  const nodeDetails = selectedNode ? getNodeDetails(selectedNode) : null;

  return (
    <Paper
      sx={{
        bgcolor: '#1E293B',
        border: '1px solid #334155',
        borderRadius: 2,
        p: 3,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Co2 sx={{ color: '#10B981', fontSize: 28 }} />
          <Typography variant="h6" sx={{ color: '#F1F5F9', fontWeight: 600 }}>
            Carbon Flow Analysis
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip label={`${TOTAL_EMISSIONS.toLocaleString()} tCO\u2082e Emitted`} size="small" sx={{ bgcolor: '#EF44441A', color: '#EF4444', fontWeight: 600 }} />
          <Chip label={`${TOTAL_OFFSETS.toLocaleString()} tCO\u2082e Offset`} size="small" sx={{ bgcolor: '#10B9811A', color: '#10B981', fontWeight: 600 }} />
        </Box>
      </Box>

      {/* Legend */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        {[
          { label: 'Scope 1 (Direct)', color: '#EF4444' },
          { label: 'Scope 2 (Energy)', color: '#F59E0B' },
          { label: 'Scope 3 (Value Chain)', color: '#8B5CF6' },
          { label: 'Offsets', color: '#10B981' },
        ].map((l) => (
          <Box key={l.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: l.color }} />
            <Typography variant="caption" sx={{ color: '#94A3B8' }}>
              {l.label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* SVG Sankey */}
      <Box sx={{ overflowX: 'auto' }}>
        <svg width={SVG_WIDTH} height={SVG_HEIGHT} viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} style={{ display: 'block', margin: '0 auto' }}>
          {/* Flow paths */}
          {flowPaths.map((flow, idx) => {
            const isHovered = hoveredFlow === idx;
            const isRelated =
              selectedNode && (flow.source === selectedNode || flow.target === selectedNode);
            const dimmed = selectedNode && !isRelated;
            const opacity = dimmed ? 0.08 : isHovered ? 0.6 : 0.3;

            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredFlow(idx)}
                onMouseLeave={() => setHoveredFlow(null)}
                style={{ cursor: 'pointer' }}
              >
                <MuiTooltip
                  title={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {EMISSION_SOURCES.find((s) => s.id === flow.source)?.label} &rarr;{' '}
                        {OFFSET_METHODS.find((o) => o.id === flow.target)?.label}
                      </Typography>
                      <Typography variant="caption">
                        {flow.value.toLocaleString()} tCO&#8322;e ({flow.percentage}%)
                      </Typography>
                    </Box>
                  }
                  arrow
                  followCursor
                >
                  <g>
                    <path d={flow.leftPath} fill={flow.sourceColor} opacity={opacity} />
                    <path d={flow.rightPath} fill={flow.targetColor} opacity={opacity} />
                  </g>
                </MuiTooltip>
              </g>
            );
          })}

          {/* Source nodes (left) */}
          {Object.values(sourcePositions).map(({ x, y, height, item }) => (
            <g
              key={item.id}
              onClick={() => handleNodeClick(item.id)}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={x}
                y={y}
                width={NODE_WIDTH}
                height={height}
                rx={4}
                fill={item.color}
                opacity={selectedNode && selectedNode !== item.id ? 0.4 : 1}
              />
              <text
                x={x - 8}
                y={y + height / 2}
                textAnchor="end"
                dominantBaseline="central"
                fill="#CBD5E1"
                fontSize={11}
                fontFamily="Inter, sans-serif"
              >
                {item.label}
              </text>
              <text
                x={x - 8}
                y={y + height / 2 + 14}
                textAnchor="end"
                dominantBaseline="central"
                fill="#64748B"
                fontSize={10}
                fontFamily="Inter, sans-serif"
              >
                {item.value.toLocaleString()} tCO&#8322;e
              </text>
            </g>
          ))}

          {/* Center node */}
          <g>
            <rect
              x={COL_CENTER}
              y={centerY}
              width={NODE_WIDTH}
              height={centerHeight}
              rx={4}
              fill="#475569"
              opacity={0.9}
            />
            <text
              x={COL_CENTER + NODE_WIDTH / 2}
              y={centerY - 10}
              textAnchor="middle"
              fill="#E2E8F0"
              fontSize={12}
              fontWeight={600}
              fontFamily="Inter, sans-serif"
            >
              Total Emissions
            </text>
            <text
              x={COL_CENTER + NODE_WIDTH / 2}
              y={centerY + centerHeight + 16}
              textAnchor="middle"
              fill="#94A3B8"
              fontSize={11}
              fontFamily="Inter, sans-serif"
            >
              {TOTAL_EMISSIONS.toLocaleString()} tCO&#8322;e
            </text>
          </g>

          {/* Offset nodes (right) */}
          {Object.values(offsetPositions).map(({ x, y, height, item }) => (
            <g
              key={item.id}
              onClick={() => handleNodeClick(item.id)}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={x}
                y={y}
                width={NODE_WIDTH}
                height={height}
                rx={4}
                fill={item.color}
                opacity={selectedNode && selectedNode !== item.id ? 0.4 : 1}
              />
              <text
                x={x + NODE_WIDTH + 8}
                y={y + height / 2}
                textAnchor="start"
                dominantBaseline="central"
                fill="#CBD5E1"
                fontSize={11}
                fontFamily="Inter, sans-serif"
              >
                {item.label}
              </text>
              <text
                x={x + NODE_WIDTH + 8}
                y={y + height / 2 + 14}
                textAnchor="start"
                dominantBaseline="central"
                fill="#64748B"
                fontSize={10}
                fontFamily="Inter, sans-serif"
              >
                {item.value.toLocaleString()} tCO&#8322;e
              </text>
            </g>
          ))}
        </svg>
      </Box>

      {/* Drill-down detail panel */}
      {nodeDetails && (
        <Paper sx={{ bgcolor: '#0F172A', border: '1px solid #334155', borderRadius: 2, p: 2, mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  bgcolor: nodeDetails.item.color,
                }}
              />
              <Typography variant="subtitle1" sx={{ color: '#F1F5F9', fontWeight: 600 }}>
                {nodeDetails.item.label}
              </Typography>
            </Box>
            <Chip
              label={`${nodeDetails.item.value.toLocaleString()} tCO\u2082e`}
              size="small"
              sx={{
                bgcolor: `${nodeDetails.item.color}1A`,
                color: nodeDetails.item.color,
                fontWeight: 600,
              }}
            />
          </Box>
          <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 1.5 }}>
            {nodeDetails.type === 'source'
              ? 'Offset distribution for this emission source:'
              : 'Emission sources offset by this method:'}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {nodeDetails.flows.map((f, i) => (
              <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: '#CBD5E1' }}>
                  {nodeDetails.type === 'source' ? f.target : f.source}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: Math.max(40, (f.value / nodeDetails.item.value) * 120),
                      height: 6,
                      borderRadius: 3,
                      bgcolor: nodeDetails.item.color,
                      opacity: 0.5,
                    }}
                  />
                  <Typography variant="caption" sx={{ color: '#94A3B8', minWidth: 90, textAlign: 'right' }}>
                    {f.value.toLocaleString()} tCO&#8322;e ({((f.value / nodeDetails.item.value) * 100).toFixed(1)}%)
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <TrendingDown sx={{ color: '#10B981', fontSize: 18 }} />
        <Typography variant="caption" sx={{ color: '#64748B' }}>
          Net position: {(TOTAL_OFFSETS - TOTAL_EMISSIONS).toLocaleString()} tCO&#8322;e{' '}
          {TOTAL_OFFSETS >= TOTAL_EMISSIONS ? '(carbon negative)' : '(residual emissions)'}
        </Typography>
      </Box>
    </Paper>
  );
};

export default SankeyDiagram;
