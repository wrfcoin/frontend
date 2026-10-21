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
  status: 'confirmed' | 'pending' | 'orphaned';
  gasUsed: number;
  gasLimit: number;
  size: number;
  reward: number;
  inConsensusSet: boolean;
}

export interface DAGEdge {
  source: string;
  target: string;
}

interface DAGGraphProps {
  blocks: DAGBlock[];
  edges: DAGEdge[];
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string) => void;
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
  consensus: '#3B82F6',
};

const STATUS_COLORS: Record<DAGBlock['status'], string> = {
  confirmed: palette.success,
  pending: palette.warning,
  orphaned: palette.error,
};

const BLOCK_WIDTH = 150;
const BLOCK_HEIGHT = 68;
const HORIZONTAL_GAP = 56;
const VERTICAL_GAP = 24;

// (mock data removed — DAG data fetched via apiClient in DAGBlockExplorer)

// --- Component ---

const DAGGraph: React.FC<DAGGraphProps> = ({
  blocks,
  edges,
  selectedBlockId,
  onSelectBlock,
  zoomLevel,
  onZoomChange,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltipBlock, setTooltipBlock] = useState<DAGBlock | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Compute layout positions
  const layout = useMemo(() => {
    const heightGroups = new Map<number, DAGBlock[]>();
    blocks.forEach(b => {
      if (!heightGroups.has(b.height)) heightGroups.set(b.height, []);
      heightGroups.get(b.height)!.push(b);
    });

    const heights = Array.from(heightGroups.keys()).sort((a, b) => a - b);
    const positions = new Map<string, { x: number; y: number }>();

    heights.forEach((h, colIndex) => {
      const blocksAtHeight = heightGroups.get(h)!;
      const totalHeight =
        blocksAtHeight.length * BLOCK_HEIGHT +
        (blocksAtHeight.length - 1) * VERTICAL_GAP;
      const startY = -totalHeight / 2;

      blocksAtHeight.forEach((block, rowIndex) => {
        positions.set(block.id, {
          x: colIndex * (BLOCK_WIDTH + HORIZONTAL_GAP),
          y: startY + rowIndex * (BLOCK_HEIGHT + VERTICAL_GAP),
        });
      });
    });

    return positions;
  }, [blocks]);

  // Render the SVG
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    svg.attr('width', width).attr('height', height);

    const g = svg.append('g');

    // Setup zoom
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3])
      .on('zoom', (event: any) => {
        g.attr('transform', event.transform.toString());
        onZoomChange(event.transform.k);
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    // Initial transform to center the graph
    const allPositions = Array.from(layout.values());
    if (allPositions.length > 0) {
      const minX = Math.min(...allPositions.map(p => p.x));
      const maxX = Math.max(...allPositions.map(p => p.x)) + BLOCK_WIDTH;
      const minY = Math.min(...allPositions.map(p => p.y));
      const maxY = Math.max(...allPositions.map(p => p.y)) + BLOCK_HEIGHT;
      const graphWidth = maxX - minX;
      const graphHeight = maxY - minY;
      const scale = Math.min(
        width / (graphWidth + 120),
        height / (graphHeight + 120),
        1,
      );
      const tx = (width - graphWidth * scale) / 2 - minX * scale;
      const ty = (height - graphHeight * scale) / 2 - minY * scale;

      svg.call(
        zoom.transform,
        d3.zoomIdentity.translate(tx, ty).scale(scale),
      );
    }

    // Arrowhead marker
    const defs = g.append('defs');
    defs
      .append('marker')
      .attr('id', 'dag-arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4')
      .attr('fill', palette.border);

    // Draw edges
    const edgeGroup = g.append('g').attr('class', 'edges');

    edges.forEach(edge => {
      const sourcePos = layout.get(edge.source);
      const targetPos = layout.get(edge.target);
      if (!sourcePos || !targetPos) return;

      const sx = sourcePos.x + BLOCK_WIDTH;
      const sy = sourcePos.y + BLOCK_HEIGHT / 2;
      const tx = targetPos.x;
      const ty = targetPos.y + BLOCK_HEIGHT / 2;
      const midX = (sx + tx) / 2;

      edgeGroup
        .append('path')
        .attr(
          'd',
          `M ${sx} ${sy} C ${midX} ${sy}, ${midX} ${ty}, ${tx} ${ty}`,
        )
        .attr('fill', 'none')
        .attr('stroke', palette.border)
        .attr('stroke-width', 1.5)
        .attr('marker-end', 'url(#dag-arrowhead)')
        .attr('opacity', 0.7);
    });

    // Draw consensus set highlighting behind blocks
    const consensusBlocks = blocks.filter(b => b.inConsensusSet);
    if (consensusBlocks.length > 0) {
      const consensusGroup = g
        .append('g')
        .attr('class', 'consensus-highlight');

      consensusBlocks.forEach(block => {
        const pos = layout.get(block.id);
        if (!pos) return;

        consensusGroup
          .append('rect')
          .attr('x', pos.x - 6)
          .attr('y', pos.y - 6)
          .attr('width', BLOCK_WIDTH + 12)
          .attr('height', BLOCK_HEIGHT + 12)
          .attr('rx', 14)
          .attr('ry', 14)
          .attr('fill', 'none')
          .attr('stroke', palette.consensus)
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '6,3')
          .attr('opacity', 0.5);
      });
    }

    // Draw block nodes
    const blockGroup = g.append('g').attr('class', 'blocks');

    blocks.forEach(block => {
      const pos = layout.get(block.id);
      if (!pos) return;

      const isSelected = selectedBlockId === block.id;
      const color = STATUS_COLORS[block.status];

      const blockG = blockGroup
        .append('g')
        .attr('transform', `translate(${pos.x}, ${pos.y})`)
        .attr('cursor', 'pointer')
        .on('click', () => onSelectBlock(block.id))
        .on(
          'mouseenter',
          function (this: SVGGElement, event: MouseEvent) {
            d3.select(this).select('rect').attr('stroke-width', 2.5);
            const rect = (
              event.target as SVGElement
            )
              .closest('g')
              ?.getBoundingClientRect();
            if (rect && containerRef.current) {
              const containerRect =
                containerRef.current.getBoundingClientRect();
              setTooltipBlock(block);
              setTooltipPos({
                x: rect.left - containerRect.left + rect.width / 2,
                y: rect.top - containerRect.top - 8,
              });
            }
          },
        )
        .on('mouseleave', function (this: SVGGElement) {
          if (!isSelected) {
            d3.select(this)
              .select('rect')
              .attr('stroke-width', isSelected ? 2.5 : 1.5);
          }
          setTooltipBlock(null);
        });

      // Block background
      blockG
        .append('rect')
        .attr('width', BLOCK_WIDTH)
        .attr('height', BLOCK_HEIGHT)
        .attr('rx', 10)
        .attr('ry', 10)
        .attr('fill', isSelected ? '#253352' : palette.card)
        .attr('stroke', isSelected ? palette.primary : color)
        .attr('stroke-width', isSelected ? 2.5 : 1.5);

      // Status indicator bar at top
      blockG
        .append('rect')
        .attr('x', 1)
        .attr('y', 1)
        .attr('width', BLOCK_WIDTH - 2)
        .attr('height', 4)
        .attr('rx', 10)
        .attr('ry', 2)
        .attr('fill', color);

      // Height label
      blockG
        .append('text')
        .attr('x', 12)
        .attr('y', 24)
        .attr('fill', palette.text)
        .attr('font-size', 13)
        .attr('font-weight', 600)
        .text(`#${block.height}`);

      // Tx count
      blockG
        .append('text')
        .attr('x', 12)
        .attr('y', 40)
        .attr('fill', palette.textSecondary)
        .attr('font-size', 10)
        .text(`${block.txCount} txs`);

      // Proposer
      blockG
        .append('text')
        .attr('x', 12)
        .attr('y', 56)
        .attr('fill', palette.textSecondary)
        .attr('font-size', 9)
        .text(block.proposer.slice(0, 14) + '...');

      // Status badge
      blockG
        .append('rect')
        .attr('x', BLOCK_WIDTH - 56)
        .attr('y', 14)
        .attr('width', 44)
        .attr('height', 18)
        .attr('rx', 9)
        .attr('fill', color)
        .attr('opacity', 0.2);

      blockG
        .append('text')
        .attr('x', BLOCK_WIDTH - 34)
        .attr('y', 27)
        .attr('fill', color)
        .attr('font-size', 9)
        .attr('text-anchor', 'middle')
        .attr('font-weight', 600)
        .text(block.status.slice(0, 5).toUpperCase());

      // Consensus set marker
      if (block.inConsensusSet) {
        blockG
          .append('circle')
          .attr('cx', BLOCK_WIDTH - 12)
          .attr('cy', BLOCK_HEIGHT - 12)
          .attr('r', 5)
          .attr('fill', palette.consensus)
          .attr('opacity', 0.8);
      }
    });
  }, [blocks, edges, layout, selectedBlockId, onSelectBlock, onZoomChange]);

  // Sync external zoom level changes
  useEffect(() => {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    const currentTransform = d3.zoomTransform(svgRef.current);
    if (Math.abs(currentTransform.k - zoomLevel) > 0.01) {
      svg
        .transition()
        .duration(300)
        .call(zoomRef.current.scaleTo, zoomLevel);
    }
  }, [zoomLevel]);

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        bgcolor: palette.bg,
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <svg
        ref={svgRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />

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
            px: 1.5,
            py: 1,
            pointerEvents: 'none',
            zIndex: 10,
            minWidth: 180,
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: palette.text, fontWeight: 600, display: 'block' }}
          >
            Block #{tooltipBlock.height} &mdash;{' '}
            {tooltipBlock.hash.slice(0, 12)}...
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: palette.textSecondary,
              display: 'block',
              mt: 0.25,
            }}
          >
            {tooltipBlock.txCount} transactions &middot;{' '}
            {(tooltipBlock.gasUsed / 1_000_000).toFixed(1)}M gas
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: STATUS_COLORS[tooltipBlock.status],
              display: 'block',
              mt: 0.25,
            }}
          >
            {tooltipBlock.status.charAt(0).toUpperCase() +
              tooltipBlock.status.slice(1)}
            {tooltipBlock.inConsensusSet && ' (consensus)'}
          </Typography>
        </Box>
      )}

      {/* Legend */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          display: 'flex',
          gap: 1.5,
          bgcolor: 'rgba(15,23,42,0.85)',
          borderRadius: 1,
          px: 1.5,
          py: 0.75,
        }}
      >
        {(
          ['confirmed', 'pending', 'orphaned'] as const
        ).map(status => (
          <Box
            key={status}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: STATUS_COLORS[status],
              }}
            />
            <Typography
              variant="caption"
              sx={{ color: palette.textSecondary, fontSize: 10 }}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Typography>
          </Box>
        ))}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              border: `2px dashed ${palette.consensus}`,
            }}
          />
          <Typography
            variant="caption"
            sx={{ color: palette.textSecondary, fontSize: 10 }}
          >
            Consensus
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default DAGGraph;
