/**
 * WRFCoin Smart Contract Graph Visualization Component
 *
 * Features:
 * - Interactive D3.js force-directed graph with 96 nodes and 153 edges
 * - Hub-and-spoke layout with WRFToken as central hub
 * - 10-category color coding system for contract types
 * - Node sizing based on importance/connections (15-45px)
 * - Multiple edge types with different visual styles
 * - Performance optimizations for enterprise-scale datasets
 * - Real-time filtering and search capabilities
 * - Responsive design with accessibility features
 */

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import * as d3 from 'd3';
import {
  SmartContractNode,
  SmartContractEdge,
  SmartContractGraphData,
  ContractCategory,
  EdgeType,
  GraphLayout,
  FilterOptions,
  GraphInteraction,
  ViewportBounds,
  RenderConfig,
  CategoryColors,
  getNodeSize,
  getEdgeWidth,
} from '../types/smartContract';
import '../styles/smart-contract-graph.css';

interface SmartContractGraphProps {
  data?: SmartContractGraphData;
  layout?: GraphLayout;
  filters?: Partial<FilterOptions>;
  width?: number;
  height?: number;
  onNodeClick?: (node: SmartContractNode) => void;
  onNodeHover?: (node: SmartContractNode | null) => void;
  onEdgeClick?: (edge: SmartContractEdge) => void;
  className?: string;
  renderConfig?: Partial<RenderConfig>;
}

const DEFAULT_FILTERS: FilterOptions = {
  categories: Object.keys(CategoryColors) as ContractCategory[],
  types: ['contract', 'interface', 'library'],
  auditStatus: ['audited', 'pending', 'unaudited'],
  minImportance: 1,
  maxImportance: 10,
  searchTerm: '',
  showOnlyConnected: false,
};

const DEFAULT_RENDER_CONFIG: RenderConfig = {
  enableLevelOfDetail: true,
  viewportCulling: true,
  maxVisibleNodes: 100,
  animationSpeed: 0.3,
  enablePhysics: true,
};

export const SmartContractGraph: React.FC<SmartContractGraphProps> = ({
  data,
  layout = { type: 'hub-spoke', centerNode: 'WRFToken' },
  filters = {},
  width = 1200,
  height = 800,
  onNodeClick,
  onNodeHover,
  onEdgeClick,
  className = '',
  renderConfig = {},
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<
    SmartContractNode,
    SmartContractEdge
  > | null>(null);

  // State management
  const [graphData, setGraphData] = useState<SmartContractGraphData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({
    ...DEFAULT_FILTERS,
    ...filters,
  });
  const [interaction, setInteraction] = useState<GraphInteraction>({
    selectedNodes: new Set(),
    hoveredNode: null,
    highlightedEdges: new Set(),
    zoom: { k: 1, x: 0, y: 0 },
  });
  const [viewportBounds, setViewportBounds] = useState<ViewportBounds>({
    left: 0,
    right: width,
    top: 0,
    bottom: height,
  });

  const config = useMemo(
    () => ({ ...DEFAULT_RENDER_CONFIG, ...renderConfig }),
    [renderConfig],
  );

  // Fetch graph data from API
  useEffect(() => {
    const fetchGraphData = async () => {
      if (data) {
        setGraphData(data);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch('/api/smart-contracts/graph');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const apiData = await response.json();
        setGraphData(apiData);
      } catch (err) {
        console.error('Failed to fetch smart contract graph data:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load graph data',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchGraphData();
  }, [data]);

  // Filter nodes and edges based on active filters
  const filteredData = useMemo(() => {
    if (!graphData) return null;

    let filteredNodes = graphData.nodes.filter(node => {
      // Category filter
      if (!activeFilters.categories.includes(node.category)) return false;

      // Type filter
      if (!activeFilters.types.includes(node.type)) return false;

      // Audit status filter
      if (node.auditStatus && !activeFilters.auditStatus.includes(node.auditStatus)) return false;

      // Importance range filter
      if (
        node.importance < activeFilters.minImportance ||
        node.importance > activeFilters.maxImportance
      )
        return false;

      // Search term filter
      if (activeFilters.searchTerm) {
        const searchLower = activeFilters.searchTerm.toLowerCase();
        const matchesSearch =
          node.name.toLowerCase().includes(searchLower) ||
          node.description.toLowerCase().includes(searchLower) ||
          (node.functions || []).some(fn => fn.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      return true;
    });

    // Get node IDs for filtering edges
    const nodeIds = new Set(filteredNodes.map(node => node.id));

    let filteredEdges = graphData.edges.filter(
      edge => nodeIds.has(edge.source) && nodeIds.has(edge.target),
    );

    // Show only connected nodes if filter is active
    if (activeFilters.showOnlyConnected) {
      const connectedNodeIds = new Set<string>();
      filteredEdges.forEach(edge => {
        connectedNodeIds.add(edge.source);
        connectedNodeIds.add(edge.target);
      });
      filteredNodes = filteredNodes.filter(node =>
        connectedNodeIds.has(node.id),
      );
    }

    return {
      ...graphData,
      nodes: filteredNodes,
      edges: filteredEdges,
    };
  }, [graphData, activeFilters]);

  // Create D3 simulation
  const createSimulation = useCallback(
    (nodes: SmartContractNode[], edges: SmartContractEdge[]) => {
      const simulation = d3
        .forceSimulation<SmartContractNode>(nodes)
        .force(
          'link',
          d3
            .forceLink<SmartContractNode, SmartContractEdge>(edges)
            .id((d: SmartContractNode) => d.id)
            .distance((d: SmartContractEdge) => 50 + (10 - d.weight) * 10) // Closer for stronger connections
            .strength(0.1),
        )
        .force(
          'charge',
          d3.forceManyBody().strength((d: any) => -100 - d.importance * 20), // Stronger repulsion for more important nodes
        )
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force(
          'collision',
          d3
            .forceCollide()
            .radius((d: any) => getNodeSize(d.importance) / 2 + 5)
            .strength(0.7),
        );

      // Apply layout-specific forces
      if (layout.type === 'hub-spoke' && layout.centerNode) {
        const centerNode = nodes.find(node => node.id === layout.centerNode);
        if (centerNode) {
          // Pin center node
          centerNode.fx = width / 2;
          centerNode.fy = height / 2;

          // Add radial force around center
          simulation.force(
            'radial',
            d3
              .forceRadial(
                (d: SmartContractNode) => (d.id === layout.centerNode ? 0 : 150 + d.importance * 20),
                width / 2,
                height / 2,
              )
              .strength(0.3),
          );
        }
      }

      return simulation;
    },
    [width, height, layout],
  );

  // Render the graph
  const renderGraph = useCallback(() => {
    if (!filteredData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    // Create container groups
    const container = svg.append('g').attr('class', 'graph-container');
    const edgesGroup = container.append('g').attr('class', 'edges');
    const nodesGroup = container.append('g').attr('class', 'nodes');

    // Set up zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 10])
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        const { transform } = event;
        container.attr('transform', transform.toString());

        setInteraction(prev => ({
          ...prev,
          zoom: { k: transform.k, x: transform.x, y: transform.y },
        }));

        // Update viewport bounds for culling
        setViewportBounds({
          left: -transform.x / transform.k,
          right: (width - transform.x) / transform.k,
          top: -transform.y / transform.k,
          bottom: (height - transform.y) / transform.k,
        });
      });

    svg.call(zoom);

    // Create tooltip
    const tooltip = d3
      .select(containerRef.current)
      .append('div')
      .attr('class', 'graph-tooltip')
      .style('opacity', 0);

    // Render edges
    const edges = edgesGroup
      .selectAll('.edge')
      .data(filteredData.edges)
      .enter()
      .append('line')
      .attr('class', (d: SmartContractEdge) => `edge edge-${d.type}`)
      .attr('stroke', (d: SmartContractEdge) => {
        // Color edges based on type
        switch (d.type) {
        case 'inheritance':
          return '#2c3e50';
        case 'import':
          return '#7f8c8d';
        case 'call':
          return '#e74c3c';
        case 'event':
          return '#3498db';
        case 'modifier':
          return '#9b59b6';
        default:
          return '#bdc3c7';
        }
      })
      .attr('stroke-width', (d: SmartContractEdge) => getEdgeWidth(d.weight))
      .attr('stroke-dasharray', (d: SmartContractEdge) => {
        switch (d.type) {
        case 'import':
          return '5,5';
        case 'call':
          return '2,3';
        case 'event':
          return '8,3,2,3';
        default:
          return 'none';
        }
      })
      .on('click', (event: MouseEvent, d: SmartContractEdge) => {
        event.stopPropagation();
        onEdgeClick?.(d);
      });

    // Render nodes
    const nodeGroups = nodesGroup
      .selectAll('.node')
      .data(filteredData.nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer');

    // Node shapes based on type
    nodeGroups.each(function (d: SmartContractNode) {
      const group = d3.select(this);
      const size = getNodeSize(d.importance);

      if (d.type === 'interface') {
        // Diamond shape for interfaces
        group
          .append('path')
          .attr(
            'd',
            `M 0,-${size / 2} L ${size / 2},0 L 0,${size / 2} L -${size / 2},0 Z`,
          )
          .attr('fill', CategoryColors[d.category])
          .attr('stroke', '#2c3e50')
          .attr('stroke-width', 2);
      } else {
        // Circle for contracts and libraries
        group
          .append('circle')
          .attr('r', size / 2)
          .attr('fill', CategoryColors[d.category])
          .attr('stroke', d.type === 'library' ? '#34495e' : '#2c3e50')
          .attr('stroke-width', d.type === 'library' ? 3 : 2)
          .attr('stroke-dasharray', d.type === 'library' ? '3,2' : 'none');
      }

      // Node label
      group
        .append('text')
        .attr('dy', size / 2 + 15)
        .attr('text-anchor', 'middle')
        .style('font-size', `${Math.max(10, size / 4)}px`)
        .style('font-weight', d.id === layout.centerNode ? 'bold' : 'normal')
        .style('fill', 'var(--text-color)')
        .text(d.name);

      // Importance indicator (ring around important nodes)
      if (d.importance >= 8) {
        group
          .append('circle')
          .attr('r', size / 2 + 5)
          .attr('fill', 'none')
          .attr('stroke', '#f39c12')
          .attr('stroke-width', 2)
          .style('opacity', 0.7);
      }
    });

    // Add interaction behaviors
    nodeGroups
      .on('mouseover', (event: MouseEvent, d: SmartContractNode) => {
        // Highlight connected nodes and edges
        const connectedEdges = filteredData.edges.filter(
          edge => edge.source === d.id || edge.target === d.id,
        );
        const connectedNodeIds = new Set<string>();
        connectedEdges.forEach(edge => {
          connectedNodeIds.add(edge.source);
          connectedNodeIds.add(edge.target);
        });

        // Dim non-connected elements
        nodeGroups.style('opacity', (node: SmartContractNode) =>
          connectedNodeIds.has(node.id) ? 1 : 0.3,
        );
        edges.style('opacity', (edge: SmartContractEdge) =>
          connectedEdges.some(ce => ce.id === edge.id) ? 1 : 0.1,
        );

        // Show tooltip
        tooltip
          .style('opacity', 1)
          .html(
            `
            <div class="tooltip-header">
              <strong>${d.name}</strong>
              <span class="badge badge-${d.category}">${d.category}</span>
            </div>
            <div class="tooltip-content">
              <p><strong>Type:</strong> ${d.type}</p>
              <p><strong>Importance:</strong> ${d.importance}/10</p>
              <p><strong>Functions:</strong> ${(d.functions || []).length}</p>
              <p><strong>Gas Usage:</strong> ${d.gasUsage?.average?.toLocaleString() ?? 'N/A'}</p>
              <p><strong>Audit Status:</strong> ${d.auditStatus ?? 'unknown'}</p>
              <p class="description">${d.description}</p>
            </div>
          `,
          )
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY - 10 + 'px');

        setInteraction(prev => ({
          ...prev,
          hoveredNode: d.id as string | null,
          highlightedEdges: new Set(connectedEdges.map(e => e.id).filter((id): id is string => id !== undefined)),
        }));

        onNodeHover?.(d);
      })
      .on('mouseout', () => {
        // Reset opacity
        nodeGroups.style('opacity', 1);
        edges.style('opacity', 1);

        // Hide tooltip
        tooltip.style('opacity', 0);

        setInteraction(prev => ({
          ...prev,
          hoveredNode: null,
          highlightedEdges: new Set(),
        }));

        onNodeHover?.(null);
      })
      .on('click', (event: MouseEvent, d: SmartContractNode) => {
        event.stopPropagation();

        setInteraction(prev => ({
          ...prev,
          selectedNodes: new Set([d.id]),
        }));

        onNodeClick?.(d);
      })
      .call(
        d3
          .drag<any, SmartContractNode>()
          .on('start', (event: d3.D3DragEvent<any, SmartContractNode, SmartContractNode>, d: SmartContractNode) => {
            if (!event.active)
              simulationRef.current?.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event: d3.D3DragEvent<any, SmartContractNode, SmartContractNode>, d: SmartContractNode) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event: d3.D3DragEvent<any, SmartContractNode, SmartContractNode>, d: SmartContractNode) => {
            if (!event.active) simulationRef.current?.alphaTarget(0);
            // Unpin node after drag unless it's the center node
            if (d.id !== layout.centerNode) {
              d.fx = undefined;
              d.fy = undefined;
            }
          }),
      );

    // Start simulation
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    simulationRef.current = createSimulation(
      filteredData.nodes,
      filteredData.edges,
    );

    simulationRef.current.on('tick', () => {
      // Update positions with viewport culling
      if (config.viewportCulling) {
        edges
          .filter((d: any) => {
            const source = d.source;
            const target = d.target;
            return (
              (source.x >= viewportBounds.left &&
                source.x <= viewportBounds.right &&
                source.y >= viewportBounds.top &&
                source.y <= viewportBounds.bottom) ||
              (target.x >= viewportBounds.left &&
                target.x <= viewportBounds.right &&
                target.y >= viewportBounds.top &&
                target.y <= viewportBounds.bottom)
            );
          })
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x)
          .attr('y2', (d: any) => d.target.y);
      } else {
        edges
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x)
          .attr('y2', (d: any) => d.target.y);
      }

      nodeGroups.attr('transform', (d: SmartContractNode) => `translate(${d.x},${d.y})`);
    });

    // Cleanup function
    return () => {
      tooltip.remove();
      simulationRef.current?.stop();
    };
  }, [
    filteredData,
    width,
    height,
    layout,
    config,
    viewportBounds,
    onNodeClick,
    onNodeHover,
    onEdgeClick,
    createSimulation,
  ]);

  // Render effect
  useEffect(() => {
    const cleanup = renderGraph();
    return cleanup;
  }, [renderGraph]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<FilterOptions>) => {
    setActiveFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className={`smart-contract-graph ${className}`}>
        <div className="loading-indicator">
          <div className="spinner"></div>
          Loading smart contract graph...
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`smart-contract-graph ${className}`}>
        <div className="error-indicator">
          <h3>Error Loading Graph</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  // No data state
  if (!filteredData || filteredData.nodes.length === 0) {
    return (
      <div className={`smart-contract-graph ${className}`}>
        <div className="no-data-indicator">
          <h3>No Contract Data</h3>
          <p>No smart contracts match the current filter criteria.</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`smart-contract-graph ${className}`}>
      {/* Graph Statistics */}
      <div className="graph-stats">
        <div className="stat-item">
          <span className="stat-value">{filteredData.nodes.length}</span>
          <span className="stat-label">Contracts</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{filteredData.edges.length}</span>
          <span className="stat-label">Connections</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">
            {Object.keys(filteredData.metadata?.categories || {}).length}
          </span>
          <span className="stat-label">Categories</span>
        </div>
      </div>

      {/* Main SVG Canvas */}
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="graph-svg"
        role="img"
        aria-label="Smart Contract Dependency Graph"
      >
        {/* Background pattern for better visual context */}
        <defs>
          <pattern
            id="grid"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="var(--border-light)"
              strokeWidth="0.5"
              opacity="0.3"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Legend */}
      <div className="graph-legend">
        <h4>Contract Categories</h4>
        <div className="legend-items">
          {Object.entries(CategoryColors).map(([category, color]) => (
            <div
              key={category}
              className={`legend-item ${activeFilters.categories.includes(category as ContractCategory) ? 'active' : 'inactive'}`}
              onClick={() => {
                const newCategories = activeFilters.categories.includes(
                  category as ContractCategory,
                )
                  ? activeFilters.categories.filter(c => c !== category)
                  : [...activeFilters.categories, category as ContractCategory];
                updateFilters({ categories: newCategories });
              }}
            >
              <div
                className="legend-color"
                style={{ backgroundColor: color }}
              ></div>
              <span className="legend-label">{category}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Performance indicator */}
      {config.enableLevelOfDetail && (
        <div className="performance-indicator">
          <span>
            LOD:{' '}
            {interaction.zoom.k < 0.5
              ? 'Low'
              : interaction.zoom.k > 2
                ? 'High'
                : 'Medium'}
          </span>
        </div>
      )}
    </div>
  );
};

export default SmartContractGraph;
