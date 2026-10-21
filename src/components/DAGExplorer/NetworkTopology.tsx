import React, { useRef, useEffect, useState, useMemo } from 'react';
import DemoSurfaceGate from '../common/DemoSurfaceGate';
import * as d3 from 'd3';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Switch,
  FormControlLabel,
  Chip,
} from '@mui/material';

// --- Types ---

interface NetworkNode {
  id: string;
  label: string;
  type: 'validator' | 'full_node' | 'light_client';
  stake: number;
  role?: 'proposer' | 'builder' | 'none';
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface NetworkLink {
  source: string | NetworkNode;
  target: string | NetworkNode;
  messageFrequency: number;
}

interface PulseAnimation {
  id: string;
  source: string;
  target: string;
  progress: number;
}

interface NetworkTopologyProps {
  className?: string;
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

const NODE_TYPE_COLORS: Record<NetworkNode['type'], string> = {
  validator: palette.primary,
  full_node: palette.success,
  light_client: '#64748B',
};

const ROLE_COLORS: Record<string, string> = {
  proposer: palette.warning,
  builder: '#A78BFA',
  none: 'transparent',
};

// --- Mock Data ---

function generateMockTopology(): { nodes: NetworkNode[]; links: NetworkLink[] } {
  const nodes: NetworkNode[] = [
    { id: 'v1', label: 'WRF Validator Alpha', type: 'validator', stake: 250000, role: 'proposer' },
    { id: 'v2', label: 'StormNode Capital', type: 'validator', stake: 180000, role: 'builder' },
    { id: 'v3', label: 'Climate Stakers', type: 'validator', stake: 150000, role: 'proposer' },
    { id: 'v4', label: 'WeatherDAO', type: 'validator', stake: 120000, role: 'builder' },
    { id: 'v5', label: 'TempGuard Labs', type: 'validator', stake: 95000, role: 'proposer' },
    { id: 'v6', label: 'Barometric Pool', type: 'validator', stake: 85000, role: 'none' },
    { id: 'v7', label: 'Anemometer DAO', type: 'validator', stake: 72000, role: 'none' },
    { id: 'v8', label: 'FrostByte Systems', type: 'validator', stake: 60000, role: 'builder' },
    { id: 'f1', label: 'full-node-us-east', type: 'full_node', stake: 0 },
    { id: 'f2', label: 'full-node-eu-west', type: 'full_node', stake: 0 },
    { id: 'f3', label: 'full-node-ap-south', type: 'full_node', stake: 0 },
    { id: 'f4', label: 'full-node-us-west', type: 'full_node', stake: 0 },
    { id: 'f5', label: 'full-node-eu-central', type: 'full_node', stake: 0 },
    { id: 'l1', label: 'light-client-001', type: 'light_client', stake: 0 },
    { id: 'l2', label: 'light-client-002', type: 'light_client', stake: 0 },
    { id: 'l3', label: 'light-client-003', type: 'light_client', stake: 0 },
    { id: 'l4', label: 'light-client-004', type: 'light_client', stake: 0 },
    { id: 'l5', label: 'light-client-005', type: 'light_client', stake: 0 },
    { id: 'l6', label: 'light-client-006', type: 'light_client', stake: 0 },
  ];

  const links: NetworkLink[] = [
    // Validators interconnected
    { source: 'v1', target: 'v2', messageFrequency: 95 },
    { source: 'v1', target: 'v3', messageFrequency: 88 },
    { source: 'v2', target: 'v4', messageFrequency: 80 },
    { source: 'v3', target: 'v5', messageFrequency: 75 },
    { source: 'v4', target: 'v6', messageFrequency: 70 },
    { source: 'v5', target: 'v7', messageFrequency: 65 },
    { source: 'v6', target: 'v8', messageFrequency: 60 },
    { source: 'v7', target: 'v1', messageFrequency: 82 },
    { source: 'v8', target: 'v2', messageFrequency: 55 },
    { source: 'v3', target: 'v6', messageFrequency: 50 },
    { source: 'v1', target: 'v5', messageFrequency: 72 },
    // Full nodes connected to validators
    { source: 'v1', target: 'f1', messageFrequency: 90 },
    { source: 'v2', target: 'f2', messageFrequency: 85 },
    { source: 'v3', target: 'f3', messageFrequency: 80 },
    { source: 'v4', target: 'f4', messageFrequency: 78 },
    { source: 'v5', target: 'f5', messageFrequency: 75 },
    { source: 'f1', target: 'f2', messageFrequency: 60 },
    { source: 'f2', target: 'f3', messageFrequency: 55 },
    { source: 'f3', target: 'f4', messageFrequency: 50 },
    { source: 'f4', target: 'f5', messageFrequency: 48 },
    // Light clients
    { source: 'f1', target: 'l1', messageFrequency: 30 },
    { source: 'f1', target: 'l2', messageFrequency: 28 },
    { source: 'f2', target: 'l3', messageFrequency: 25 },
    { source: 'f3', target: 'l4', messageFrequency: 22 },
    { source: 'f4', target: 'l5', messageFrequency: 20 },
    { source: 'f5', target: 'l6', messageFrequency: 18 },
  ];

  return { nodes, links };
}

// --- Component ---

const NetworkTopologySample: React.FC<NetworkTopologyProps> = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showPBS, setShowPBS] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<NetworkNode | null>(null);
  const topologyData = useMemo(() => generateMockTopology(), []);
  const animationRef = useRef<number>(0);

  const stats = useMemo(() => {
    const validators = topologyData.nodes.filter(n => n.type === 'validator').length;
    const fullNodes = topologyData.nodes.filter(n => n.type === 'full_node').length;
    const lightClients = topologyData.nodes.filter(n => n.type === 'light_client').length;
    return { validators, fullNodes, lightClients, total: topologyData.nodes.length };
  }, [topologyData]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    svg.attr('width', width).attr('height', height);

    const g = svg.append('g');

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event: any) => {
        g.attr('transform', event.transform.toString());
      });
    svg.call(zoom);

    // Force simulation
    const nodes: NetworkNode[] = topologyData.nodes.map(n => ({ ...n }));
    const links: NetworkLink[] = topologyData.links.map(l => ({ ...l }));

    const simulation = d3.forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force('link', d3.forceLink(links as d3.SimulationLinkDatum<d3.SimulationNodeDatum>[])
        .id((d: any) => d.id)
        .distance(80))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // Draw links
    const linkG = g.append('g').attr('class', 'links');
    const linkElements = linkG.selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', palette.border)
      .attr('stroke-width', (d: any) => Math.max(1, d.messageFrequency / 30))
      .attr('opacity', 0.4);

    // Pulse circles for block propagation animation
    const pulseG = g.append('g').attr('class', 'pulses');

    // Draw nodes
    const nodeG = g.append('g').attr('class', 'nodes');
    const nodeElements = nodeG.selectAll('g')
      .data(nodes)
      .enter().append('g')
      .attr('cursor', 'pointer')
      .call(d3.drag<SVGGElement, NetworkNode>()
        .on('start', (event: any, d: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
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
    nodeElements.append('circle')
      .attr('r', (d: NetworkNode) => {
        if (d.type === 'validator') return 8 + Math.sqrt(d.stake / 10000);
        if (d.type === 'full_node') return 8;
        return 5;
      })
      .attr('fill', (d: NetworkNode) => {
        if (showPBS && d.role && d.role !== 'none') return ROLE_COLORS[d.role];
        return NODE_TYPE_COLORS[d.type];
      })
      .attr('stroke', (d: NetworkNode) => {
        if (showPBS && d.role && d.role !== 'none') return ROLE_COLORS[d.role];
        return NODE_TYPE_COLORS[d.type];
      })
      .attr('stroke-width', 2)
      .attr('fill-opacity', 0.3);

    // Node labels (validators only)
    nodeElements
      .filter((d: NetworkNode) => d.type === 'validator')
      .append('text')
      .attr('dy', (d: NetworkNode) => -(12 + Math.sqrt(d.stake / 10000)))
      .attr('text-anchor', 'middle')
      .attr('fill', palette.textSecondary)
      .attr('font-size', 9)
      .text((d: NetworkNode) => d.label.length > 18 ? d.label.slice(0, 18) + '...' : d.label);

    // Hover events
    nodeElements
      .on('mouseenter', (_event: any, d: NetworkNode) => setHoveredNode(d))
      .on('mouseleave', () => setHoveredNode(null));

    // Simulation tick
    simulation.on('tick', () => {
      linkElements
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      nodeElements
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Block propagation pulse animation
    let pulses: PulseAnimation[] = [];
    let frameCount = 0;

    function animate() {
      frameCount++;

      // Spawn new pulse every ~120 frames
      if (frameCount % 120 === 0 && links.length > 0) {
        const randomLink = links[Math.floor(Math.random() * links.length)];
        const srcId = typeof randomLink.source === 'string' ? randomLink.source : (randomLink.source as NetworkNode).id;
        const tgtId = typeof randomLink.target === 'string' ? randomLink.target : (randomLink.target as NetworkNode).id;
        pulses.push({
          id: `pulse-${frameCount}`,
          source: srcId,
          target: tgtId,
          progress: 0,
        });
      }

      // Update pulses
      pulses = pulses.filter(p => p.progress <= 1);
      pulses.forEach(p => { p.progress += 0.02; });

      // Render pulses
      const pulseSelection = pulseG.selectAll<SVGCircleElement, PulseAnimation>('circle')
        .data(pulses, (d: PulseAnimation) => d.id);

      pulseSelection.exit().remove();

      pulseSelection.enter()
        .append('circle')
        .attr('r', 4)
        .attr('fill', palette.primary)
        .attr('opacity', 0.8)
        .merge(pulseSelection)
        .attr('cx', (d: PulseAnimation) => {
          const src = nodes.find(n => n.id === d.source);
          const tgt = nodes.find(n => n.id === d.target);
          if (!src?.x || !tgt?.x) return 0;
          return src.x + (tgt.x - src.x) * d.progress;
        })
        .attr('cy', (d: PulseAnimation) => {
          const src = nodes.find(n => n.id === d.source);
          const tgt = nodes.find(n => n.id === d.target);
          if (!src?.y || !tgt?.y) return 0;
          return src.y + (tgt.y - src.y) * d.progress;
        })
        .attr('opacity', (d: PulseAnimation) => 0.8 * (1 - d.progress));

      animationRef.current = requestAnimationFrame(animate);
    }

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
      simulation.stop();
    };
  }, [topologyData, showPBS]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Stats bar */}
      <Stack direction="row" spacing={2} sx={{ p: 1.5, flexWrap: 'wrap', gap: 1 }}>
        <Paper sx={{ bgcolor: palette.card, px: 1.5, py: 0.75, borderRadius: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: palette.primary }} />
          <Typography variant="caption" sx={{ color: palette.textSecondary }}>
            Validators: <span style={{ color: palette.text, fontWeight: 600 }}>{stats.validators}</span>
          </Typography>
        </Paper>
        <Paper sx={{ bgcolor: palette.card, px: 1.5, py: 0.75, borderRadius: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: palette.success }} />
          <Typography variant="caption" sx={{ color: palette.textSecondary }}>
            Full Nodes: <span style={{ color: palette.text, fontWeight: 600 }}>{stats.fullNodes}</span>
          </Typography>
        </Paper>
        <Paper sx={{ bgcolor: palette.card, px: 1.5, py: 0.75, borderRadius: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#64748B' }} />
          <Typography variant="caption" sx={{ color: palette.textSecondary }}>
            Light Clients: <span style={{ color: palette.text, fontWeight: 600 }}>{stats.lightClients}</span>
          </Typography>
        </Paper>
        <FormControlLabel
          control={
            <Switch
              checked={showPBS}
              onChange={(_, checked) => setShowPBS(checked)}
              size="small"
              sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: palette.warning } }}
            />
          }
          label={<Typography variant="caption" sx={{ color: palette.textSecondary }}>PBS View</Typography>}
          sx={{ ml: 'auto' }}
        />
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
        <svg ref={svgRef} style={{ width: '100%', height: '100%', display: 'block' }} />

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
              minWidth: 180,
              zIndex: 10,
            }}
          >
            <Typography variant="caption" sx={{ color: palette.text, fontWeight: 600, display: 'block' }}>
              {hoveredNode.label}
            </Typography>
            <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, mb: 0.5 }}>
              <Chip
                label={hoveredNode.type.replace('_', ' ')}
                size="small"
                sx={{
                  bgcolor: NODE_TYPE_COLORS[hoveredNode.type] + '22',
                  color: NODE_TYPE_COLORS[hoveredNode.type],
                  fontSize: 9,
                  height: 18,
                }}
              />
              {hoveredNode.role && hoveredNode.role !== 'none' && (
                <Chip
                  label={hoveredNode.role}
                  size="small"
                  sx={{
                    bgcolor: ROLE_COLORS[hoveredNode.role] + '22',
                    color: ROLE_COLORS[hoveredNode.role],
                    fontSize: 9,
                    height: 18,
                  }}
                />
              )}
            </Stack>
            {hoveredNode.stake > 0 && (
              <Typography variant="caption" sx={{ color: palette.textSecondary, display: 'block' }}>
                Stake: <span style={{ color: palette.success }}>{hoveredNode.stake.toLocaleString()} WRF</span>
              </Typography>
            )}
          </Paper>
        )}

        {/* PBS legend */}
        {showPBS && (
          <Box sx={{ position: 'absolute', bottom: 12, left: 12, display: 'flex', gap: 1.5, bgcolor: 'rgba(15,23,42,0.85)', borderRadius: 1, px: 1.5, py: 0.75 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: palette.warning }} />
              <Typography variant="caption" sx={{ color: palette.textSecondary, fontSize: 10 }}>Proposer</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#A78BFA' }} />
              <Typography variant="caption" sx={{ color: palette.textSecondary, fontSize: 10 }}>Builder</Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

// frontend#324: every figure in NetworkTopologySample is generated in-component; nothing
// on the testnet API backs it. The default build renders the honest not-live
// state and never mounts the sample.
const NetworkTopology: React.FC<NetworkTopologyProps> = (props) => (
  <DemoSurfaceGate
    title="Network topology is not live on the testnet yet"
    description="No peer-topology route is mounted on the testnet API."
    testId="network-topology"
  >
    <NetworkTopologySample {...props} />
  </DemoSurfaceGate>
);

export default NetworkTopology;
