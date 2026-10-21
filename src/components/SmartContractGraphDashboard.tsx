/**
 * Smart Contract Graph Dashboard
 *
 * Main component that combines the interactive D3.js graph visualization
 * with the comprehensive control panel for the WRFCoin smart contract ecosystem.
 *
 * Features:
 * - Responsive layout with resizable panels
 * - Real-time filtering and search
 * - Export functionality (PNG, SVG, JSON)
 * - Performance monitoring
 * - Accessibility compliance
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import SmartContractGraph from './SmartContractGraph';
import SmartContractGraphControls from './SmartContractGraphControls';
import {
  SmartContractGraphData,
  FilterOptions,
  GraphLayout,
  RenderConfig,
  ContractCategory,
  CategoryColors,
} from '../types/smartContract';
import '../styles/graph-dashboard.css';
import { devLog } from '../utils/logger';

interface SmartContractGraphDashboardProps {
  className?: string;
  initialData?: SmartContractGraphData;
  showControls?: boolean;
  controlsPosition?: 'left' | 'right' | 'top' | 'bottom';
  onNodeSelect?: (nodeId: string | null) => void;
  onDataExport?: (data: any, format: string) => void;
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

const DEFAULT_LAYOUT: GraphLayout = {
  type: 'hub-spoke',
  centerNode: 'WRFToken',
};

const DEFAULT_RENDER_CONFIG: RenderConfig = {
  enableLevelOfDetail: true,
  viewportCulling: true,
  maxVisibleNodes: 100,
  animationSpeed: 0.1,
  enablePhysics: true,
};

export const SmartContractGraphDashboard: React.FC<
  SmartContractGraphDashboardProps
> = ({
  className = '',
  initialData,
  showControls = true,
  controlsPosition = 'left',
  onNodeSelect,
  onDataExport,
}) => {
  // State management
  const [graphData, setGraphData] = useState<SmartContractGraphData | null>(
    initialData || null,
  );
  const [stableGraphData, setStableGraphData] =
    useState<SmartContractGraphData | null>(initialData || null);
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);
  const [layout, setLayout] = useState<GraphLayout>(DEFAULT_LAYOUT);
  const [renderConfig, setRenderConfig] = useState<RenderConfig>(
    DEFAULT_RENDER_CONFIG,
  );
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  // Responsive state
  const [controlsCollapsed, setControlsCollapsed] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Refs for export functionality
  const graphRef = useRef<SVGSVGElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Performance monitoring
  const [performanceStats, setPerformanceStats] = useState({
    visibleNodes: 0,
    totalNodes: 0,
    renderTime: 0,
    fps: 60,
  });

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });

      // Auto-collapse controls on small screens
      if (window.innerWidth < 1024 && !controlsCollapsed) {
        setControlsCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [controlsCollapsed]);

  // Calculate responsive dimensions
  const getDimensions = useCallback(() => {
    const headerHeight = 60;
    const padding = 32;
    const controlsWidth = showControls && !controlsCollapsed ? 350 : 0;

    let availableWidth = windowSize.width - padding;
    let availableHeight = windowSize.height - headerHeight - padding;

    if (showControls && !controlsCollapsed) {
      if (controlsPosition === 'left' || controlsPosition === 'right') {
        availableWidth -= controlsWidth;
      } else {
        availableHeight -= 300; // Height for top/bottom controls
      }
    }

    return {
      width: Math.max(600, availableWidth),
      height: Math.max(400, availableHeight),
      controlsWidth,
    };
  }, [windowSize, showControls, controlsCollapsed, controlsPosition]);

  // Event handlers
  const handleNodeClick = useCallback(
    (node: any) => {
      setSelectedNode(node.id);
      onNodeSelect?.(node.id);
    },
    [onNodeSelect],
  );

  const handleNodeHover = useCallback((node: any) => {
    // Handle node hover effects
  }, []);

  const handleEdgeClick = useCallback((edge: any) => {
    // Handle edge click events
    devLog('Edge clicked:', edge);
  }, []);

  const handleFiltersChange = useCallback(
    (newFilters: Partial<FilterOptions>) => {
      setFilters(prev => ({ ...prev, ...newFilters }));
    },
    [],
  );

  const handleLayoutChange = useCallback((newLayout: GraphLayout) => {
    setLayout(newLayout);
  }, []);

  const handleRenderConfigChange = useCallback(
    (newConfig: Partial<RenderConfig>) => {
      setRenderConfig(prev => ({ ...prev, ...newConfig }));
    },
    [],
  );

  const handleResetView = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setLayout(DEFAULT_LAYOUT);
    setSelectedNode(null);
  }, []);

  // Export functionality
  const handleExport = useCallback(
    async (format: 'png' | 'svg' | 'json') => {
      if (!graphRef.current) return;

      try {
        let exportData: any;
        let filename: string = '';

        switch (format) {
        case 'png':
          // Convert SVG to PNG
          const svgData = new XMLSerializer().serializeToString(
            graphRef.current,
          );
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();

          img.onload = () => {
            const { width, height } = getDimensions();
            canvas.width = width;
            canvas.height = height;
            ctx?.drawImage(img, 0, 0);

            canvas.toBlob(blob => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `wrfcoin-contract-graph-${Date.now()}.png`;
                link.click();
                URL.revokeObjectURL(url);
              }
            });
          };

          img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
          break;

        case 'svg':
          // Export SVG directly
          const svgBlob = new Blob(
            [new XMLSerializer().serializeToString(graphRef.current)],
            {
              type: 'image/svg+xml',
            },
          );
          exportData = svgBlob;
          filename = `wrfcoin-contract-graph-${Date.now()}.svg`;
          break;

        case 'json':
          // Export graph data
          exportData = new Blob([JSON.stringify(graphData, null, 2)], {
            type: 'application/json',
          });
          filename = `wrfcoin-contract-data-${Date.now()}.json`;
          break;
        }

        if (exportData && filename) {
          const url = URL.createObjectURL(exportData);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.click();
          URL.revokeObjectURL(url);
        }

        onDataExport?.(exportData, format);
      } catch (err) {
        console.error(`Export failed (${format}):`, err);
        setError(`Failed to export ${format.toUpperCase()} file`);
      }
    },
    [graphData, getDimensions, onDataExport],
  );

  // Performance monitoring
  useEffect(() => {
    const updatePerformanceStats = () => {
      if (
        stableGraphData &&
        stableGraphData.nodes &&
        Array.isArray(stableGraphData.nodes)
      ) {
        setPerformanceStats(prev => ({
          ...prev,
          totalNodes: stableGraphData.nodes.length,
          visibleNodes: stableGraphData.nodes.filter(node => {
            // Apply current filters to count visible nodes
            return (
              filters.categories.includes(node.category) &&
              filters.types.includes(node.type) &&
              (node.auditStatus !== undefined && filters.auditStatus.includes(node.auditStatus)) &&
              node.importance >= filters.minImportance &&
              node.importance <= filters.maxImportance &&
              (!filters.searchTerm ||
                node.name
                  .toLowerCase()
                  .includes(filters.searchTerm.toLowerCase()) ||
                node.description
                  .toLowerCase()
                  .includes(filters.searchTerm.toLowerCase()))
            );
          }).length,
        }));
      } else {
        // Set default values when data is not available
        setPerformanceStats(prev => ({
          ...prev,
          totalNodes: 0,
          visibleNodes: 0,
        }));
      }
    };

    updatePerformanceStats();
  }, [stableGraphData, filters]);

  // Stable data update effect - only update when data actually changes
  useEffect(() => {
    if (
      initialData &&
      (!stableGraphData ||
        JSON.stringify(initialData) !== JSON.stringify(stableGraphData))
    ) {
      setStableGraphData(initialData);
    }
  }, [initialData, stableGraphData]);

  const dimensions = getDimensions();

  return (
    <div
      ref={dashboardRef}
      className={`smart-contract-dashboard ${className} ${controlsPosition} ${controlsCollapsed ? 'controls-collapsed' : ''}`}
      data-testid="smart-contract-dashboard"
    >
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-title">
            <h1>WRFCoin Smart Contract Architecture</h1>
            <p>
              {performanceStats.visibleNodes} of {performanceStats.totalNodes}{' '}
              contracts
            </p>
          </div>

          {showControls && (
            <button
              className="controls-toggle"
              onClick={() => setControlsCollapsed(!controlsCollapsed)}
              aria-label={controlsCollapsed ? 'Show controls' : 'Hide controls'}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                {controlsCollapsed ? (
                  <path d="M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z" />
                ) : (
                  <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                )}
              </svg>
            </button>
          )}
        </div>

        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Controls Panel */}
        {showControls && !controlsCollapsed && (
          <div className="controls-panel">
            <SmartContractGraphControls
              filters={filters}
              layout={layout}
              renderConfig={renderConfig}
              onFiltersChange={handleFiltersChange}
              onLayoutChange={handleLayoutChange}
              onRenderConfigChange={handleRenderConfigChange}
              totalNodes={performanceStats.totalNodes}
              visibleNodes={performanceStats.visibleNodes}
              onResetView={handleResetView}
              onExport={handleExport}
            />
          </div>
        )}

        {/* Graph Visualization */}
        <div className="graph-panel">
          <SmartContractGraph
            data={stableGraphData ?? undefined}
            layout={layout}
            filters={filters}
            renderConfig={renderConfig}
            width={dimensions.width}
            height={dimensions.height}
            onNodeClick={handleNodeClick}
            onNodeHover={handleNodeHover}
            onEdgeClick={handleEdgeClick}
            className="main-graph"
          />

          {/* Floating Controls (for mobile) */}
          {showControls && controlsCollapsed && (
            <div className="floating-controls">
              <button
                className="floating-button filter"
                onClick={() => setControlsCollapsed(false)}
                title="Show filters"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M6,13H18V11H6M3,6V8H21V6M10,18H14V16H10V18Z" />
                </svg>
              </button>

              <button
                className="floating-button reset"
                onClick={handleResetView}
                title="Reset view"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12,4V1L8,5L12,9V6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12H4A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4Z" />
                </svg>
              </button>
            </div>
          )}

          {/* Selection Info Panel */}
          {selectedNode && (
            <div className="selection-info">
              <div className="selection-header">
                <h3>Selected Contract</h3>
                <button onClick={() => setSelectedNode(null)}>×</button>
              </div>
              <div className="selection-content">
                <p>
                  <strong>ID:</strong> {selectedNode}
                </p>
                {/* Add more contract details here */}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Performance Monitor (Development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="performance-monitor">
          <div className="perf-stat">
            <span className="perf-label">Nodes:</span>
            <span className="perf-value">
              {performanceStats.visibleNodes}/{performanceStats.totalNodes}
            </span>
          </div>
          <div className="perf-stat">
            <span className="perf-label">FPS:</span>
            <span className="perf-value">{performanceStats.fps}</span>
          </div>
          <div className="perf-stat">
            <span className="perf-label">Render:</span>
            <span className="perf-value">{performanceStats.renderTime}ms</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartContractGraphDashboard;
