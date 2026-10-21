import DemoSurfaceGate from '../common/DemoSurfaceGate';
import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import HubIcon from '@mui/icons-material/Hub';
import PublicIcon from '@mui/icons-material/Public';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { colors, borderRadius, spacing, shadows } from '../ui/tokens';
import { apiClient } from '../../services/apiClient';
import WrfCard from '../ui/WrfCard';
import WrfBadge from '../ui/WrfBadge';
import WrfButton from '../ui/WrfButton';
import WrfStatCard from '../ui/WrfStatCard';
import { WrfCapabilityReadinessBadge } from '../DesignSystem';

ChartJS.register(ArcElement, ChartTooltip, Legend);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NetworkNode {
  id: string;
  label: string;
  type: 'validator' | 'full' | 'light';
  region: string;
  latency: number; // ms
  peers: number;
  uptime: number; // percent
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface NetworkLink {
  source: string;
  target: string;
  latency: number;
}

interface HoverState {
  node: NetworkNode;
  x: number;
  y: number;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const REGIONS = ['North America', 'Europe', 'Asia Pacific', 'South America', 'Africa'];

// (MOCK_NODES removed — nodes fetched from API)

const generateLinks = (nodes: NetworkNode[]): NetworkLink[] => {
  const links: NetworkLink[] = [];
  const validators = nodes.filter((n) => n.type === 'validator');
  const fullNodes = nodes.filter((n) => n.type === 'full');
  const lightNodes = nodes.filter((n) => n.type === 'light');

  // Validators connect to each other (mesh)
  for (let i = 0; i < validators.length; i++) {
    for (let j = i + 1; j < validators.length; j++) {
      links.push({
        source: validators[i].id,
        target: validators[j].id,
        latency: 0,
      });
    }
  }

  // Full nodes connect to 2 validators
  fullNodes.forEach((fn, idx) => {
    const count = Math.min(2, validators.length);
    for (let i = 0; i < count; i++) {
      links.push({
        source: fn.id,
        target: validators[(idx + i) % validators.length].id,
        latency: 0,
      });
    }
  });

  // Light nodes connect to 1 full node
  lightNodes.forEach((ln, idx) => {
    if (fullNodes.length > 0) {
      links.push({
        source: ln.id,
        target: fullNodes[idx % fullNodes.length].id,
        latency: 0,
      });
    }
  });

  return links;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NODE_COLORS: Record<string, string> = {
  validator: '#3B82F6',
  full: '#10B981',
  light: '#F59E0B',
};

const NODE_RADII: Record<string, number> = {
  validator: 14,
  full: 10,
  light: 7,
};

const getLatencyColor = (latency: number): string => {
  if (latency < 30) return colors.success.main;
  if (latency < 60) return colors.warning.main;
  return colors.error.main;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const NetworkTopologyMapSample: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const nodesRef = useRef<NetworkNode[]>([]);
  const linksRef = useRef<NetworkLink[]>([]);
  const [hoveredNode, setHoveredNode] = useState<HoverState | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [nodes, setNodes] = useState<NetworkNode[]>([]);

  // Fetch network nodes from API
  useEffect(() => {
    apiClient.get<NetworkNode[]>('/network/nodes')
      .then((data) => { if (data) setNodes(data); })
      .catch(() => { /* keep empty */ });
  }, []);

  // Initialize nodes with positions (re-runs when nodes or dimensions change)
  useEffect(() => {
    const positioned = nodes.map((n, i) => ({
      ...n,
      x: dimensions.width / 2 + (((i % 5) / 4) - 0.5) * dimensions.width * 0.7,
      y: dimensions.height / 2 + (((Math.floor(i / 5)) % 4) / 3 - 0.5) * dimensions.height * 0.7,
      vx: 0,
      vy: 0,
    }));
    nodesRef.current = positioned;
    linksRef.current = generateLinks(positioned);
  }, [nodes, dimensions]);

  // Observe container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width } = entry.contentRect;
        setDimensions({ width, height: Math.min(500, Math.max(360, width * 0.55)) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // D3-style force simulation in canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    const nodes = nodesRef.current;
    const links = linksRef.current;

    const nodeMap = new Map<string, NetworkNode>();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    let running = true;
    let alpha = 1;

    const tick = () => {
      if (!running) return;
      alpha *= 0.995;
      if (alpha < 0.001) alpha = 0.001;

      // Centering force
      const cx = dimensions.width / 2;
      const cy = dimensions.height / 2;
      nodes.forEach((n) => {
        n.vx! += (cx - n.x!) * 0.001;
        n.vy! += (cy - n.y!) * 0.001;
      });

      // Link force (spring)
      links.forEach((link) => {
        const s = nodeMap.get(link.source);
        const t = nodeMap.get(link.target);
        if (!s || !t) return;
        const dx = t.x! - s.x!;
        const dy = t.y! - s.y!;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const targetDist = 120;
        const force = (dist - targetDist) * 0.003 * alpha;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        s.vx! += fx;
        s.vy! += fy;
        t.vx! -= fx;
        t.vy! -= fy;
      });

      // Repulsion between nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = b.x! - a.x!;
          const dy = b.y! - a.y!;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 200) {
            const force = (200 - dist) * 0.02 * alpha;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            a.vx! -= fx;
            a.vy! -= fy;
            b.vx! += fx;
            b.vy! += fy;
          }
        }
      }

      // Apply velocities and damping
      nodes.forEach((n) => {
        n.vx! *= 0.85;
        n.vy! *= 0.85;
        n.x! += n.vx!;
        n.y! += n.vy!;
        // Keep within bounds
        const r = NODE_RADII[n.type] || 8;
        n.x = Math.max(r, Math.min(dimensions.width - r, n.x!));
        n.y = Math.max(r, Math.min(dimensions.height - r, n.y!));
      });

      // Draw
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Draw links
      links.forEach((link) => {
        const s = nodeMap.get(link.source);
        const t = nodeMap.get(link.target);
        if (!s || !t) return;
        if (selectedType && s.type !== selectedType && t.type !== selectedType) return;
        ctx.beginPath();
        ctx.moveTo(s.x!, s.y!);
        ctx.lineTo(t.x!, t.y!);
        ctx.strokeStyle = `${getLatencyColor(link.latency)}44`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Draw nodes
      nodes.forEach((n) => {
        if (selectedType && n.type !== selectedType) {
          // Dim unselected
          ctx.beginPath();
          ctx.arc(n.x!, n.y!, NODE_RADII[n.type], 0, Math.PI * 2);
          ctx.fillStyle = `${NODE_COLORS[n.type]}33`;
          ctx.fill();
          return;
        }
        const r = NODE_RADII[n.type];
        // Glow
        ctx.beginPath();
        ctx.arc(n.x!, n.y!, r + 4, 0, Math.PI * 2);
        ctx.fillStyle = `${NODE_COLORS[n.type]}22`;
        ctx.fill();
        // Node circle
        ctx.beginPath();
        ctx.arc(n.x!, n.y!, r, 0, Math.PI * 2);
        ctx.fillStyle = NODE_COLORS[n.type];
        ctx.fill();
        ctx.strokeStyle = `${NODE_COLORS[n.type]}88`;
        ctx.lineWidth = 2;
        ctx.stroke();
        // Label for validators
        if (n.type === 'validator') {
          ctx.fillStyle = colors.text.primary;
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(n.id.toUpperCase(), n.x!, n.y! - r - 6);
        }
      });

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [dimensions, selectedType]);

  // Mouse events for hover tooltip
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      let found: HoverState | null = null;
      for (const n of nodesRef.current) {
        const dx = n.x! - mx;
        const dy = n.y! - my;
        const r = NODE_RADII[n.type] + 4;
        if (dx * dx + dy * dy < r * r) {
          found = { node: n, x: mx, y: my };
          break;
        }
      }
      setHoveredNode(found);
    },
    [],
  );

  const handleMouseLeave = useCallback(() => setHoveredNode(null), []);

  // Region distribution data
  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    REGIONS.forEach((r) => (counts[r] = 0));
    nodes.forEach((n) => {
      counts[n.region] = (counts[n.region] || 0) + 1;
    });
    return counts;
  }, [nodes]);

  const regionChartData = useMemo(
    () => ({
      labels: REGIONS,
      datasets: [
        {
          data: REGIONS.map((r) => regionCounts[r]),
          backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
          borderColor: colors.bg.secondary,
          borderWidth: 2,
        },
      ],
    }),
    [regionCounts],
  );

  const regionChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right' as const,
          labels: {
            color: colors.text.secondary,
            font: { size: 11 },
            padding: 8,
            usePointStyle: true,
            pointStyleWidth: 8,
          },
        },
        tooltip: {
          backgroundColor: colors.bg.primary,
          titleColor: colors.text.primary,
          bodyColor: colors.text.secondary,
          borderColor: colors.border.default,
          borderWidth: 1,
        },
      },
      cutout: '55%',
    }),
    [],
  );

  const totalNodes = nodes.length;
  const avgLatency = totalNodes > 0
    ? Math.round(nodes.reduce((s, n) => s + n.latency, 0) / totalNodes)
    : 0;
  const avgUptime = totalNodes > 0
    ? (nodes.reduce((s, n) => s + n.uptime, 0) / totalNodes).toFixed(2)
    : '0.00';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: colors.bg.primary,
        padding: `${spacing.lg}px`,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: `${spacing.lg}px`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px` }}>
          <HubIcon sx={{ fontSize: 28, color: colors.brand.primary }} />
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px`, flexWrap: 'wrap' }}>
              <Typography
                sx={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text.primary }}
              >
                Network Topology Map
              </Typography>
              <WrfCapabilityReadinessBadge featureName="networkInsights" compact />
              <WrfBadge status="online" label={`${totalNodes} Nodes`} size="sm" />
            </Box>

          </Box>
        </Box>
        <WrfButton
          variant="secondary"
          size="sm"
          startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
          onClick={() => {
            const positioned = nodes.map((n, i) => ({
              ...n,
              x: dimensions.width / 2 + (((i % 5) / 4) - 0.5) * dimensions.width * 0.7,
              y: dimensions.height / 2 + (((Math.floor(i / 5)) % 4) / 3 - 0.5) * dimensions.height * 0.7,
              vx: 0,
              vy: 0,
            }));
            nodesRef.current = positioned;
            linksRef.current = generateLinks(positioned);
          }}
        >
          Refresh Layout
        </WrfButton>
      </Box>

      {/* Stat Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: `${spacing.md}px`,
          marginBottom: `${spacing.lg}px`,
        }}
      >
        <WrfStatCard
          label="Total Nodes"
          value={totalNodes}
          trend={4.2}
          trendLabel="vs last week"
          color={colors.brand.primary}
          icon={HubIcon}
          sparklineData={[18, 19, 20, 21, 22, 23, 24, 25]}
        />
        <WrfStatCard
          label="Avg Latency"
          value={`${avgLatency}ms`}
          trend={-3.1}
          trendLabel="improving"
          color={colors.success.main}
          icon={PublicIcon}
          sparklineData={[50, 48, 45, 42, 40, 38, 36, avgLatency]}
        />
        <WrfStatCard
          label="Validators"
          value={nodes.filter((n) => n.type === 'validator').length}
          trend={0}
          trendLabel="stable"
          color="#3B82F6"
        />
        <WrfStatCard
          label="Avg Uptime"
          value={`${avgUptime}%`}
          trend={0.12}
          trendLabel="vs last month"
          color={colors.success.main}
        />
      </Box>

      {/* Main content grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
          gap: `${spacing.lg}px`,
        }}
      >
        {/* Force graph */}
        <WrfCard
          title="Network Graph"
          subtitle="Force-directed topology visualization with latency coloring"
          action={
            <Box sx={{ display: 'flex', gap: `${spacing.xs}px` }}>
              {(['validator', 'full', 'light'] as const).map((t) => (
                <WrfButton
                  key={t}
                  variant={selectedType === t ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedType(selectedType === t ? null : t)}
                  sx={{ textTransform: 'capitalize' }}
                >
                  {t}
                </WrfButton>
              ))}
            </Box>
          }
        >
          <Box
            ref={containerRef}
            sx={{ position: 'relative', width: '100%', minHeight: 360 }}
          >
            <canvas
              ref={canvasRef}
              style={{
                width: dimensions.width,
                height: dimensions.height,
                display: 'block',
                cursor: hoveredNode ? 'pointer' : 'default',
              }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
            {/* Hover tooltip */}
            {hoveredNode && (
              <Box
                sx={{
                  position: 'absolute',
                  left: Math.min(hoveredNode.x + 16, dimensions.width - 220),
                  top: Math.max(hoveredNode.y - 8, 4),
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  border: `1px solid ${NODE_COLORS[hoveredNode.node.type]}`,
                  borderRadius: `${borderRadius.md}px`,
                  padding: `${spacing.sm}px ${spacing.md}px`,
                  pointerEvents: 'none',
                  zIndex: 20,
                  minWidth: 180,
                  boxShadow: shadows.lg,
                }}
              >
                <Typography
                  sx={{ fontSize: '0.8125rem', fontWeight: 600, color: colors.text.primary, mb: 0.5 }}
                >
                  {hoveredNode.node.label}
                </Typography>
                <Typography sx={{ fontSize: '0.6875rem', color: colors.text.muted, mb: 1 }}>
                  {hoveredNode.node.region}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '0.6875rem', color: colors.text.secondary }}>
                      Type
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.6875rem',
                        color: NODE_COLORS[hoveredNode.node.type],
                        fontWeight: 600,
                        textTransform: 'capitalize',
                      }}
                    >
                      {hoveredNode.node.type}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '0.6875rem', color: colors.text.secondary }}>
                      Latency
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.6875rem',
                        color: getLatencyColor(hoveredNode.node.latency),
                        fontWeight: 600,
                      }}
                    >
                      {hoveredNode.node.latency}ms
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '0.6875rem', color: colors.text.secondary }}>
                      Peers
                    </Typography>
                    <Typography
                      sx={{ fontSize: '0.6875rem', color: colors.text.primary, fontWeight: 600 }}
                    >
                      {hoveredNode.node.peers}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '0.6875rem', color: colors.text.secondary }}>
                      Uptime
                    </Typography>
                    <Typography
                      sx={{ fontSize: '0.6875rem', color: colors.success.main, fontWeight: 600 }}
                    >
                      {hoveredNode.node.uptime}%
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}

            {/* Legend */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 8,
                left: 8,
                display: 'flex',
                gap: `${spacing.md}px`,
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                borderRadius: `${borderRadius.sm}px`,
                padding: '6px 12px',
              }}
            >
              {Object.entries(NODE_COLORS).map(([type, color]) => (
                <Box key={type} sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Box
                    sx={{
                      width: NODE_RADII[type] * 1.2,
                      height: NODE_RADII[type] * 1.2,
                      borderRadius: '50%',
                      backgroundColor: color,
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: '0.6875rem',
                      color: colors.text.secondary,
                      textTransform: 'capitalize',
                    }}
                  >
                    {type}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </WrfCard>

        {/* Region pie chart */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${spacing.lg}px` }}>
          <WrfCard title="Region Distribution" subtitle="Node count by geographic region">
            <Box sx={{ height: 220, position: 'relative' }}>
              <Doughnut data={regionChartData} options={regionChartOptions} />
            </Box>
          </WrfCard>

          <WrfCard title="Latency Health">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${spacing.sm}px` }}>
              {[
                { label: 'Excellent (<30ms)', color: colors.success.main, count: nodes.filter((n) => n.latency < 30).length },
                { label: 'Good (30-60ms)', color: colors.warning.main, count: nodes.filter((n) => n.latency >= 30 && n.latency < 60).length },
                { label: 'High (>60ms)', color: colors.error.main, count: nodes.filter((n) => n.latency >= 60).length },
              ].map((tier) => (
                <Box key={tier.label} sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px` }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: tier.color,
                      flexShrink: 0,
                    }}
                  />
                  <Typography sx={{ fontSize: '0.8125rem', color: colors.text.secondary, flex: 1 }}>
                    {tier.label}
                  </Typography>
                  <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: colors.text.primary }}>
                    {tier.count}
                  </Typography>
                  <Box
                    sx={{
                      width: 60,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: colors.bg.tertiary,
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        width: `${(tier.count / totalNodes) * 100}%`,
                        height: '100%',
                        backgroundColor: tier.color,
                        borderRadius: 2,
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          </WrfCard>
        </Box>
      </Box>
    </Box>
  );
};

const NetworkTopologyMap: React.FC<React.ComponentProps<typeof NetworkTopologyMapSample>> = (props) => (
  <DemoSurfaceGate
    testId="network-topology"
    title="Network topology is not live on this testnet"
    description="This preview contains illustrative data or simulated actions, not verified testnet results."
  >
    <NetworkTopologyMapSample {...props} />
  </DemoSurfaceGate>
);

export default NetworkTopologyMap;
