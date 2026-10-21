import React, { useRef, useEffect, useState, useMemo } from 'react';
import DemoSurfaceGate from '../common/DemoSurfaceGate';
import * as d3 from 'd3';
import { Box, Typography, Paper, Stack, Chip } from '@mui/material';

// --- Types ---

interface BridgeNode {
  id: string;
  label: string;
  chain: string;
  health: 'healthy' | 'degraded' | 'down';
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface BridgeLink {
  source: string | BridgeNode;
  target: string | BridgeNode;
  volume24h: number;
  latencyMs: number;
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

const HEALTH_COLORS: Record<BridgeNode['health'], string> = {
  healthy: palette.success,
  degraded: palette.warning,
  down: palette.error,
};

// --- Mock Data ---

function generateMockBridgeData(): {
  nodes: BridgeNode[];
  links: BridgeLink[];
  } {
  const nodes: BridgeNode[] = [
    { id: 'wrf', label: 'WRFCoin', chain: 'WRF', health: 'healthy' },
    { id: 'eth', label: 'Ethereum', chain: 'ETH', health: 'healthy' },
    { id: 'polygon', label: 'Polygon', chain: 'MATIC', health: 'healthy' },
    { id: 'bsc', label: 'BSC', chain: 'BNB', health: 'healthy' },
    { id: 'avax', label: 'Avalanche', chain: 'AVAX', health: 'degraded' },
    { id: 'arb', label: 'Arbitrum', chain: 'ARB', health: 'healthy' },
    { id: 'op', label: 'Optimism', chain: 'OP', health: 'healthy' },
    { id: 'cosmos', label: 'Cosmos', chain: 'ATOM', health: 'healthy' },
    { id: 'sol', label: 'Solana', chain: 'SOL', health: 'down' },
  ];

  const links: BridgeLink[] = [
    { source: 'wrf', target: 'eth', volume24h: 2450000, latencyMs: 320 },
    { source: 'wrf', target: 'polygon', volume24h: 1820000, latencyMs: 180 },
    { source: 'wrf', target: 'bsc', volume24h: 980000, latencyMs: 250 },
    { source: 'wrf', target: 'avax', volume24h: 420000, latencyMs: 1200 },
    { source: 'wrf', target: 'arb', volume24h: 1560000, latencyMs: 200 },
    { source: 'wrf', target: 'op', volume24h: 1120000, latencyMs: 220 },
    { source: 'wrf', target: 'cosmos', volume24h: 780000, latencyMs: 450 },
    { source: 'wrf', target: 'sol', volume24h: 0, latencyMs: 0 },
    { source: 'eth', target: 'polygon', volume24h: 3200000, latencyMs: 150 },
    { source: 'eth', target: 'arb', volume24h: 2800000, latencyMs: 120 },
    { source: 'eth', target: 'op', volume24h: 2100000, latencyMs: 130 },
    { source: 'polygon', target: 'bsc', volume24h: 650000, latencyMs: 280 },
    { source: 'cosmos', target: 'avax', volume24h: 310000, latencyMs: 800 },
  ];

  return { nodes, links };
}

// --- Component ---

const BridgeHealthGraphSample: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<BridgeNode | null>(null);
  const [hoveredLink, setHoveredLink] = useState<BridgeLink | null>(null);
  const bridgeData = useMemo(() => generateMockBridgeData(), []);

  const stats = useMemo(() => {
    const healthy = bridgeData.nodes.filter(
      n => n.health === 'healthy',
    ).length;
    const degraded = bridgeData.nodes.filter(
      n => n.health === 'degraded',
    ).length;
    const down = bridgeData.nodes.filter(n => n.health === 'down').length;
    const totalVolume = bridgeData.links.reduce(
      (s, l) => s + l.volume24h,
      0,
    );
    const activeLinks = bridgeData.links.filter(
      l => l.volume24h > 0,
    ).length;
    return { healthy, degraded, down, totalVolume, activeLinks };
  }, [bridgeData]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    svg.attr('width', width).attr('height', height);

    const g = svg.append('g');

    // Zoom
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event: any) => {
        g.attr('transform', event.transform.toString());
      });
    svg.call(zoom);

    // Force simulation
    const nodes: BridgeNode[] = bridgeData.nodes.map(n => ({ ...n }));
    const links: BridgeLink[] = bridgeData.links.map(l => ({ ...l }));

    const maxVolume = Math.max(...links.map(l => l.volume24h), 1);

    const simulation = d3
      .forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force(
        'link',
        d3
          .forceLink(
            links as d3.SimulationLinkDatum<d3.SimulationNodeDatum>[],
          )
          .id((d: any) => d.id)
          .distance(120),
      )
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    // Draw links
    const linkG = g.append('g').attr('class', 'links');
    const linkElements = linkG
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', (d: BridgeLink) => {
        if (d.volume24h === 0) return palette.error;
        if (d.latencyMs > 800) return palette.warning;
        return palette.border;
      })
      .attr('stroke-width', (d: BridgeLink) =>
        Math.max(1, (d.volume24h / maxVolume) * 6),
      )
      .attr('opacity', (d: BridgeLink) => (d.volume24h === 0 ? 0.2 : 0.5))
      .attr('stroke-dasharray', (d: BridgeLink) =>
        d.volume24h === 0 ? '4,4' : 'none',
      )
      .on('mouseenter', (_event: any, d: BridgeLink) =>
        setHoveredLink(d),
      )
      .on('mouseleave', () => setHoveredLink(null));

    // Draw nodes
    const nodeG = g.append('g').attr('class', 'nodes');
    const nodeElements = nodeG
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('cursor', 'pointer')
      .call(
        d3
          .drag<SVGGElement, BridgeNode>()
          .on('start', (event: any, d: any) => {
            if (!event.active)
              simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event: any, d: any) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event: any, d: any) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }),
      );

    // Node circles
    nodeElements
      .append('circle')
      .attr('r', (d: BridgeNode) => (d.id === 'wrf' ? 20 : 14))
      .attr('fill', (d: BridgeNode) => HEALTH_COLORS[d.health])
      .attr('stroke', (d: BridgeNode) => HEALTH_COLORS[d.health])
      .attr('stroke-width', 2)
      .attr('fill-opacity', 0.25);

    // Node labels
    nodeElements
      .append('text')
      .attr('dy', (d: BridgeNode) => -(d.id === 'wrf' ? 26 : 20))
      .attr('text-anchor', 'middle')
      .attr('fill', palette.text)
      .attr('font-size', (d: BridgeNode) => (d.id === 'wrf' ? 11 : 10))
      .attr('font-weight', (d: BridgeNode) =>
        d.id === 'wrf' ? 700 : 500,
      )
      .text((d: BridgeNode) => d.label);

    // Chain ticker inside node
    nodeElements
      .append('text')
      .attr('dy', 4)
      .attr('text-anchor', 'middle')
      .attr('fill', palette.text)
      .attr('font-size', 8)
      .attr('font-weight', 600)
      .text((d: BridgeNode) => d.chain);

    // Hover events
    nodeElements
      .on('mouseenter', (_event: any, d: BridgeNode) =>
        setHoveredNode(d),
      )
      .on('mouseleave', () => setHoveredNode(null));

    // Simulation tick
    simulation.on('tick', () => {
      linkElements
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      nodeElements.attr(
        'transform',
        (d: any) => `translate(${d.x},${d.y})`,
      );
    });

    return () => {
      simulation.stop();
    };
  }, [bridgeData]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Stats bar */}
      <Stack
        direction="row"
        spacing={1.5}
        sx={{ p: 1.5, flexWrap: 'wrap', gap: 1 }}
      >
        <Paper
          sx={{
            bgcolor: palette.card,
            px: 1.5,
            py: 0.75,
            borderRadius: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: palette.success,
            }}
          />
          <Typography
            variant="caption"
            sx={{ color: palette.textSecondary }}
          >
            Healthy:{' '}
            <span style={{ color: palette.text, fontWeight: 600 }}>
              {stats.healthy}
            </span>
          </Typography>
        </Paper>
        <Paper
          sx={{
            bgcolor: palette.card,
            px: 1.5,
            py: 0.75,
            borderRadius: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: palette.warning,
            }}
          />
          <Typography
            variant="caption"
            sx={{ color: palette.textSecondary }}
          >
            Degraded:{' '}
            <span style={{ color: palette.warning, fontWeight: 600 }}>
              {stats.degraded}
            </span>
          </Typography>
        </Paper>
        <Paper
          sx={{
            bgcolor: palette.card,
            px: 1.5,
            py: 0.75,
            borderRadius: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: palette.error,
            }}
          />
          <Typography
            variant="caption"
            sx={{ color: palette.textSecondary }}
          >
            Down:{' '}
            <span style={{ color: palette.error, fontWeight: 600 }}>
              {stats.down}
            </span>
          </Typography>
        </Paper>
        <Paper
          sx={{
            bgcolor: palette.card,
            px: 1.5,
            py: 0.75,
            borderRadius: 1.5,
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: palette.textSecondary }}
          >
            24h Volume:{' '}
            <span style={{ color: palette.text, fontWeight: 600 }}>
              ${(stats.totalVolume / 1_000_000).toFixed(1)}M
            </span>
          </Typography>
        </Paper>
        <Paper
          sx={{
            bgcolor: palette.card,
            px: 1.5,
            py: 0.75,
            borderRadius: 1.5,
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: palette.textSecondary }}
          >
            Active Bridges:{' '}
            <span style={{ color: palette.success, fontWeight: 600 }}>
              {stats.activeLinks}
            </span>
          </Typography>
        </Paper>
      </Stack>

      {/* Graph container */}
      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          position: 'relative',
          bgcolor: palette.bg,
          borderRadius: 2,
          overflow: 'hidden',
          mx: 1.5,
          mb: 1.5,
        }}
      >
        <svg
          ref={svgRef}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />

        {/* Hovered node tooltip */}
        {hoveredNode && (
          <Paper
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              bgcolor: palette.card,
              border: `1px solid ${palette.border}`,
              borderRadius: 1.5,
              p: 1.5,
              minWidth: 160,
              zIndex: 10,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: palette.text,
                fontWeight: 600,
                display: 'block',
              }}
            >
              {hoveredNode.label}
            </Typography>
            <Chip
              label={hoveredNode.health.toUpperCase()}
              size="small"
              sx={{
                bgcolor: HEALTH_COLORS[hoveredNode.health] + '22',
                color: HEALTH_COLORS[hoveredNode.health],
                fontSize: 9,
                height: 18,
                mt: 0.5,
              }}
            />
          </Paper>
        )}

        {/* Hovered link tooltip */}
        {hoveredLink && !hoveredNode && (
          <Paper
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              bgcolor: palette.card,
              border: `1px solid ${palette.border}`,
              borderRadius: 1.5,
              p: 1.5,
              minWidth: 160,
              zIndex: 10,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: palette.text,
                fontWeight: 600,
                display: 'block',
              }}
            >
              {typeof hoveredLink.source === 'string'
                ? hoveredLink.source
                : hoveredLink.source.label}{' '}
              &rarr;{' '}
              {typeof hoveredLink.target === 'string'
                ? hoveredLink.target
                : hoveredLink.target.label}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: palette.textSecondary,
                display: 'block',
                mt: 0.25,
              }}
            >
              Volume: $
              {hoveredLink.volume24h > 0
                ? (hoveredLink.volume24h / 1_000_000).toFixed(2) + 'M'
                : '0'}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color:
                  hoveredLink.latencyMs > 800
                    ? palette.warning
                    : palette.success,
                display: 'block',
                mt: 0.25,
              }}
            >
              Latency:{' '}
              {hoveredLink.latencyMs > 0
                ? hoveredLink.latencyMs + 'ms'
                : 'N/A'}
            </Typography>
          </Paper>
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
            ['healthy', 'degraded', 'down'] as const
          ).map(health => (
            <Box
              key={health}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: HEALTH_COLORS[health],
                }}
              />
              <Typography
                variant="caption"
                sx={{ color: palette.textSecondary, fontSize: 10 }}
              >
                {health.charAt(0).toUpperCase() + health.slice(1)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

// frontend#324: every figure in BridgeHealthGraphSample is generated in-component; nothing
// on the testnet API backs it. The default build renders the honest not-live
// state and never mounts the sample.
const BridgeHealthGraph: React.FC = (props) => (
  <DemoSurfaceGate
    title="Bridge health is not live on the testnet yet"
    description="No bridge-health feed is served by the testnet API; the Bridge page readiness panel shows what is real."
    testId="bridge-health"
  >
    <BridgeHealthGraphSample {...props} />
  </DemoSurfaceGate>
);

export default BridgeHealthGraph;
