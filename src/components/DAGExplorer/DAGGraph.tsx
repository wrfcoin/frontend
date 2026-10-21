import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Box, Typography } from '@mui/material';

// --- Types ---

export interface DAGBlock {
  id: string;
  height: number;
  hash: string;
  parentHashes: string[];
  proposer: string;
  txCount: number;
  timestamp: number;
  status: 'finalized' | 'confirmed' | 'pending' | 'orphaned';
  gasUsed: number;
  gasLimit: number;
  size: number;
  reward: number;
  attestationCount: number;
  stateRoot: string;
  receiptRoot: string;
}

export interface DAGEdge {
  source: string;
  target: string;
}

interface DAGGraphProps {
  blocks: DAGBlock[];
  edges: DAGEdge[];
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string | null) => void;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
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

const STATUS_COLORS: Record<DAGBlock['status'], string> = {
  finalized: palette.success,
  confirmed: palette.primary,
  pending: palette.warning,
  orphaned: '#64748B',
};

// Increased dimensions for vertical layout
const BLOCK_WIDTH = 220;
const BLOCK_HEIGHT = 100;
const HORIZONTAL_GAP = 80;
const VERTICAL_GAP = 80;

// (MOCK_DAG_DATA removed — data fetched via API by parent component)

// --- Component ---

const DAGGraph: React.FC<DAGGraphProps> = ({
  blocks,
  edges,
  selectedBlockId,
  onSelectBlock,
  zoomLevel,
  // onZoomChange is omitted since we use native scrolling + toolbar zoom
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltipBlock, setTooltipBlock] = useState<DAGBlock | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Kept current via assignment (not useEffect) so event handlers always read the latest value
  // without stale closures and without adding these to the structure-rebuild effect deps.
  const zoomLevelRef = useRef(zoomLevel);
  const selectedBlockIdRef = useRef(selectedBlockId);
  zoomLevelRef.current = zoomLevel;
  selectedBlockIdRef.current = selectedBlockId;

  // Compute layout positions for a vertical layout
  const { layout, graphWidth, graphHeight, minX, minY } = useMemo(() => {
    const heightGroups = new Map<number, DAGBlock[]>();
    blocks.forEach(b => {
      if (!heightGroups.has(b.height)) heightGroups.set(b.height, []);
      heightGroups.get(b.height)!.push(b);
    });

    // Sort descending so the highest height (latest block) is at the top (rowIndex = 0)
    const heights = Array.from(heightGroups.keys()).sort((a, b) => b - a);
    const positions = new Map<string, { x: number; y: number }>();

    heights.forEach((h, rowIndex) => {
      const blocksAtHeight = heightGroups.get(h)!;
      const totalWidth = blocksAtHeight.length * BLOCK_WIDTH + (blocksAtHeight.length - 1) * HORIZONTAL_GAP;
      const startX = -totalWidth / 2;

      blocksAtHeight.forEach((block, colIndex) => {
        positions.set(block.id, {
          x: startX + colIndex * (BLOCK_WIDTH + HORIZONTAL_GAP),
          y: rowIndex * (BLOCK_HEIGHT + VERTICAL_GAP),
        });
      });
    });

    const allPositions = Array.from(positions.values());
    const xCoords = allPositions.map(p => p.x);
    const yCoords = allPositions.map(p => p.y);
    const minX = allPositions.length ? Math.min(...xCoords) : 0;
    const maxX = allPositions.length ? Math.max(...xCoords) + BLOCK_WIDTH : 0;
    const minY = allPositions.length ? Math.min(...yCoords) : 0;
    const maxY = allPositions.length ? Math.max(...yCoords) + BLOCK_HEIGHT : 0;

    return {
      layout: positions,
      graphWidth: maxX - minX + 160, // Add padding
      graphHeight: maxY - minY + 160,
      minX: minX - 80,
      minY: minY - 80,
    };
  }, [blocks]);

  // Effect 1 — rebuild SVG structure only when blocks/edges/layout change.
  // zoomLevel and selectedBlockId are intentionally excluded: Effect 2 handles
  // those incrementally without tearing down the DOM.
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || layout.size === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Size based on current zoom (read from ref so we don't add it to deps)
    const currentZoom = zoomLevelRef.current;
    const width = graphWidth * currentZoom;
    const height = graphHeight * currentZoom;

    svg.attr('width', Math.max(width, containerRef.current.clientWidth))
      .attr('height', Math.max(height, containerRef.current.clientHeight));

    // Create the main group — give it a stable class so Effect 2 can find it
    const g = svg.append('g')
      .attr('class', 'main-group')
      .attr('transform', `scale(${currentZoom}) translate(${-minX}, ${-minY})`);

    // Draw edges
    const defs = g.append('defs');
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4')
      .attr('fill', palette.border);

    const edgeGroup = g.append('g').attr('class', 'edges');

    edges.forEach(edge => {
      const sourcePos = layout.get(edge.source);
      const targetPos = layout.get(edge.target);
      if (!sourcePos || !targetPos) return;

      // Source is the parent (lower height, thus higher Y in descending order, meaning it's visually lower)
      // Target is the child (higher height, meaning it's visually higher)
      // Wait, source is parent (e.g. height 100), target is child (height 101).
      // Since we sorted descending, height 101 is at rowIndex 0, height 100 is at rowIndex 1.
      // So target (child, h=101) is visually HIGHER (lower Y coordinate).
      // Source (parent, h=100) is visually LOWER (higher Y coordinate).
      // We want the arrow to go from parent to child (from bottom to top).

      const sx = sourcePos.x + BLOCK_WIDTH / 2;
      const sy = sourcePos.y; // Top of the parent block
      const tx = targetPos.x + BLOCK_WIDTH / 2;
      const ty = targetPos.y + BLOCK_HEIGHT; // Bottom of the child block

      const midY = (sy + ty) / 2;

      edgeGroup.append('path')
        .attr('d', `M ${sx} ${sy} C ${sx} ${midY}, ${tx} ${midY}, ${tx} ${ty}`)
        .attr('fill', 'none')
        .attr('stroke', palette.border)
        .attr('stroke-width', 2)
        .attr('marker-end', 'url(#arrowhead)')
        .attr('opacity', 0.8);
    });

    // Draw blocks
    const blockGroup = g.append('g').attr('class', 'blocks');

    blocks.forEach(block => {
      const pos = layout.get(block.id);
      if (!pos) return;

      const color = STATUS_COLORS[block.status];

      const blockG = blockGroup.append('g')
        .attr('transform', `translate(${pos.x}, ${pos.y})`)
        .attr('cursor', 'pointer')
        // data attributes let Effect 2 update selection/color without a full rebuild
        .attr('data-block-id', block.id)
        .attr('data-status-color', color)
        .on('click', () => onSelectBlock(block.id))
        .on('mouseenter', function (this: SVGGElement, event: MouseEvent) {
          d3.select(this).select('rect.bg').attr('stroke-width', 3);
          const rect = (event.target as SVGElement).closest('g')?.getBoundingClientRect();
          if (rect && containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            setTooltipBlock(block);
            setTooltipPos({
              x: rect.left - containerRect.left + rect.width / 2,
              y: rect.top - containerRect.top - 8,
            });
          }
        })
        .on('mouseleave', function (this: SVGGElement) {
          // Read from ref to avoid stale closure when selectedBlockId changes
          const sel = selectedBlockIdRef.current;
          d3.select(this).select('rect.bg').attr('stroke-width', sel === block.id ? 3 : 1.5);
          setTooltipBlock(null);
        });

      // Block background — rendered unselected; Effect 2 applies selection state
      blockG.append('rect')
        .attr('class', 'bg')
        .attr('width', BLOCK_WIDTH)
        .attr('height', BLOCK_HEIGHT)
        .attr('rx', 12)
        .attr('ry', 12)
        .attr('fill', palette.card)
        .attr('stroke', color)
        .attr('stroke-width', 1.5);

      // Status indicator bar at top
      blockG.append('rect')
        .attr('x', 2)
        .attr('y', 2)
        .attr('width', BLOCK_WIDTH - 4)
        .attr('height', 6)
        .attr('rx', 10)
        .attr('ry', 2)
        .attr('fill', color);

      // Height label
      blockG.append('text')
        .attr('x', 16)
        .attr('y', 32)
        .attr('fill', palette.text)
        .attr('font-size', 16)
        .attr('font-weight', 700)
        .text(`#${block.height}`);

      // Proposer ID
      blockG.append('text')
        .attr('x', 16)
        .attr('y', 56)
        .attr('fill', palette.textSecondary)
        .attr('font-size', 13)
        .text(block.proposer.slice(0, 16) + '...');

      // Tx count
      blockG.append('text')
        .attr('x', 16)
        .attr('y', 80)
        .attr('fill', palette.textSecondary)
        .attr('font-size', 13)
        .text(`${block.txCount} txs`);

      // Status badge
      blockG.append('rect')
        .attr('x', BLOCK_WIDTH - 84)
        .attr('y', 16)
        .attr('width', 72)
        .attr('height', 24)
        .attr('rx', 12)
        .attr('fill', color)
        .attr('opacity', 0.2);

      blockG.append('text')
        .attr('x', BLOCK_WIDTH - 48)
        .attr('y', 32)
        .attr('fill', color)
        .attr('font-size', 11)
        .attr('text-anchor', 'middle')
        .attr('font-weight', 600)
        .text(block.status.toUpperCase());
    });
  }, [blocks, edges, layout, onSelectBlock, graphWidth, graphHeight, minX, minY]);

  // Effect 2 — incremental update for zoom and selection changes.
  // Runs on every zoomLevel / selectedBlockId change without rebuilding the SVG.
  useEffect(() => {
    const svgEl = svgRef.current;
    const containerEl = containerRef.current;
    if (!svgEl || !containerEl || layout.size === 0) return;

    const svg = d3.select(svgEl);
    const width = graphWidth * zoomLevel;
    const height = graphHeight * zoomLevel;

    // Resize SVG viewport
    svg.attr('width', Math.max(width, containerEl.clientWidth))
      .attr('height', Math.max(height, containerEl.clientHeight));

    // Reposition the main group without recreating it
    svg.select('g.main-group')
      .attr('transform', `scale(${zoomLevel}) translate(${-minX}, ${-minY})`);

    // Apply selection styling to blocks
    svg.selectAll<SVGGElement, unknown>('g[data-block-id]').each(function () {
      const blockId = this.getAttribute('data-block-id');
      const isSelected = blockId === selectedBlockId;
      const statusColor = this.getAttribute('data-status-color') || palette.border;
      d3.select(this).select('rect.bg')
        .attr('fill', isSelected ? '#253352' : palette.card)
        .attr('stroke', isSelected ? palette.primary : statusColor)
        .attr('stroke-width', isSelected ? 3 : 1.5);
    });
  }, [zoomLevel, selectedBlockId, graphWidth, graphHeight, minX, minY, layout.size]);

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        bgcolor: palette.bg,
        borderRadius: 2,
        overflow: 'auto', // Add native scrollbars for vertical orientation
        // Custom scrollbar styling
        '&::-webkit-scrollbar': {
          width: 10,
          height: 10,
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: 5,
        },
        '&::-webkit-scrollbar-thumb': {
          background: palette.border,
          borderRadius: 5,
          '&:hover': {
            background: palette.textSecondary,
          },
        },
      }}
    >
      <svg ref={svgRef} style={{ display: 'block' }} />

      {/* Tooltip overlay */}
      {tooltipBlock && (
        <Box
          sx={{
            position: 'absolute',
            left: tooltipPos.x,
            top: tooltipPos.y,
            transform: 'translate(-50%, -100%)',
            bgcolor: '#1a2540',
            border: `1px solid ${palette.border}`,
            borderRadius: 1.5,
            px: 2,
            py: 1.5,
            pointerEvents: 'none',
            zIndex: 10,
            minWidth: 200,
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          }}
        >
          <Typography variant="caption" sx={{ color: palette.text, fontWeight: 700, display: 'block', fontSize: 13 }}>
            Block #{tooltipBlock.height} &mdash; {tooltipBlock.hash.slice(0, 12)}...
          </Typography>
          <Typography variant="caption" sx={{ color: palette.textSecondary, display: 'block', mt: 0.5, fontSize: 12 }}>
            {tooltipBlock.txCount} transactions &middot; {(tooltipBlock.gasUsed / 1_000_000).toFixed(1)}M gas
          </Typography>
          <Typography variant="caption" sx={{ color: STATUS_COLORS[tooltipBlock.status], display: 'block', mt: 0.5, fontSize: 12, fontWeight: 600 }}>
            {tooltipBlock.status.charAt(0).toUpperCase() + tooltipBlock.status.slice(1)}
          </Typography>
        </Box>
      )}

      {/* Legend */}
      <Box
        sx={{
          position: 'sticky', // Ensure it stays visible during scroll
          bottom: 16,
          left: 16,
          width: 'fit-content',
          display: 'flex',
          gap: 2,
          bgcolor: 'rgba(15,23,42,0.9)',
          borderRadius: 2,
          px: 2,
          py: 1,
          border: `1px solid ${palette.border}`,
          zIndex: 5,
        }}
      >
        {(['finalized', 'confirmed', 'pending', 'orphaned'] as const).map(status => (
          <Box key={status} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: STATUS_COLORS[status] }} />
            <Typography variant="caption" sx={{ color: palette.textSecondary, fontSize: 12, fontWeight: 500 }}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default DAGGraph;
