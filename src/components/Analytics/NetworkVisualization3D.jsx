import React, { useEffect, useRef, useState } from 'react';
import DemoSurfaceGate from '../common/DemoSurfaceGate';
import useWebSocket from '../../hooks/useWebSocket';
import './NetworkVisualization3D.css';

/**
 * Network Visualization Component
 * Displays a 2D network visualization of the Wrfcoin blockchain
 */
const NetworkVisualization3DSample = () => {
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [particles, setParticles] = useState([]);
  const animationFrameRef = useRef(null);

  const [stats, setStats] = useState({
    activeNodes: 0,
    connections: 0,
    dataFlow: 0,
    computations: 0,
  });

  const { status, data } = useWebSocket({
    channels: ['blocks'],
    onMessage: (event, eventData) => {
      if (event === 'NETWORK_UPDATE') {
        updateNetworkVisualization(eventData);
      } else if (event === 'COMPUTATION_UPDATE') {
        updateComputationVisualization(eventData);
      }
    },
  });

  // Initialize network data and start animation
  useEffect(() => {
    // Generate initial network data
    generateNetworkData();

    // Start animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      if (canvasRef.current) {
        renderCanvas();
        updateParticles();
      }
    };

    animate();

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Generate network data
  const generateNetworkData = () => {
    // Create nodes
    const nodeCount = 30;
    const newNodes = [];

    for (let i = 0; i < nodeCount; i++) {
      // Node types: normal, miner, validator
      const nodeType =
        Math.random() > 0.7
          ? Math.random() > 0.5
            ? 'miner'
            : 'validator'
          : 'normal';

      // Set color based on node type
      let color;
      switch (nodeType) {
      case 'miner':
        color = '#00ff00'; // Green for miners
        break;
      case 'validator':
        color = '#0088ff'; // Blue for validators
        break;
      default:
        color = '#ffaa00'; // Orange for normal nodes
      }

      // Position nodes in a circle layout initially
      const angle = (i / nodeCount) * Math.PI * 2;
      const radius = 150;

      newNodes.push({
        id: `node-${i}`,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        radius: nodeType === 'normal' ? 5 : 8,
        color,
        type: nodeType,
        activity: Math.random(), // Activity level 0-1
      });
    }

    setNodes(newNodes);

    // Create connections
    const newLinks = [];

    // Create connections between nodes
    for (let i = 0; i < nodeCount; i++) {
      const connectionCount = 2 + Math.floor(Math.random() * 3); // 2-4 connections per node

      for (let j = 0; j < connectionCount; j++) {
        // Find a random node to connect to
        const targetIndex = Math.floor(Math.random() * nodeCount);
        if (targetIndex !== i) {
          newLinks.push({
            source: i,
            target: targetIndex,
            active: Math.random() > 0.5,
            color: '#444444',
            opacity: 0.5,
          });
        }
      }
    }

    setLinks(newLinks);

    // Create particles for data flow
    const particleCount = 100;
    const newParticles = [];

    for (let i = 0; i < particleCount; i++) {
      // Randomly position particles along connections
      if (newLinks.length > 0) {
        const randomLink =
          newLinks[Math.floor(Math.random() * newLinks.length)];
        const sourceNode = newNodes[randomLink.source];
        const targetNode = newNodes[randomLink.target];

        // Position along the link
        const t = Math.random();
        const x = sourceNode.x * (1 - t) + targetNode.x * t;
        const y = sourceNode.y * (1 - t) + targetNode.y * t;

        // Particle type
        let color, size;
        if (Math.random() > 0.7) {
          // Data packets
          color = '#00ffff';
          size = 3;
        } else if (Math.random() > 0.5) {
          // Computational NFT data
          color = '#ff00ff';
          size = 2.5;
        } else {
          // Regular transactions
          color = '#ffffff';
          size = 2;
        }

        newParticles.push({
          x,
          y,
          linkIndex: newLinks.indexOf(randomLink),
          progress: t,
          direction: Math.random() > 0.5 ? 1 : -1,
          speed: 0.002 + Math.random() * 0.003,
          color,
          size,
        });
      }
    }

    setParticles(newParticles);

    // Generate stats — dataFlow/computations populated from live WebSocket data only
    setStats({
      activeNodes: nodeCount,
      connections: newLinks.length,
      dataFlow: 0,
      computations: 0,
    });

    setIsLoading(false);
  };

  // Update particles positions
  const updateParticles = () => {
    setParticles(prevParticles => {
      return prevParticles.map(particle => {
        // Update particle position along its link
        const link = links[particle.linkIndex];
        if (!link) return particle;

        const sourceNode = nodes[link.source];
        const targetNode = nodes[link.target];

        if (!sourceNode || !targetNode) return particle;

        // Update progress along the link
        let newProgress =
          particle.progress + particle.speed * particle.direction;

        // Reverse direction or restart when reaching the end
        if (newProgress > 1 || newProgress < 0) {
          if (Math.random() > 0.5) {
            // Reverse direction
            particle.direction *= -1;
            newProgress = particle.direction > 0 ? 0 : 1;
          } else {
            // Jump to a new link
            const newLinkIndex = Math.floor(Math.random() * links.length);
            particle.linkIndex = newLinkIndex;
            newProgress = Math.random();
          }
        }

        // Calculate new position
        return {
          ...particle,
          progress: newProgress,
          x: sourceNode.x * (1 - newProgress) + targetNode.x * newProgress,
          y: sourceNode.y * (1 - newProgress) + targetNode.y * newProgress,
        };
      });
    });
  };

  // Render the canvas
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear the canvas
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 0.5;

    const gridSize = 20 * zoom;
    const offsetX = offset.x % gridSize;
    const offsetY = offset.y % gridSize;

    ctx.beginPath();
    for (let x = offsetX; x < width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = offsetY; y < height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Apply transformations for panning and zooming
    ctx.save();
    ctx.translate(width / 2 + offset.x, height / 2 + offset.y);
    ctx.scale(zoom, zoom);

    // Draw links
    links.forEach(link => {
      const source = nodes[link.source];
      const target = nodes[link.target];

      if (!source || !target) return;

      ctx.strokeStyle = link.color;
      ctx.globalAlpha = link.active ? 0.7 : 0.2;
      ctx.lineWidth = link.active ? 1.5 : 0.5;

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();
    });

    // Draw particles
    ctx.globalAlpha = 0.8;
    particles.forEach(particle => {
      const { x, y, color, size } = particle;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();

      // Add glow effect
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, size * 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw nodes
    nodes.forEach(node => {
      const { x, y, radius, color, type, activity } = node;

      // Draw node
      ctx.globalAlpha = 1;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Add highlight based on node activity
      if (type !== 'normal') {
        const glowColor = type === 'miner' ? '#00ff00' : '#0088ff';
        const glowSize = radius * (1 + activity);

        const gradient = ctx.createRadialGradient(x, y, radius, x, y, glowSize);
        gradient.addColorStop(0, glowColor);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.globalAlpha = 0.5 * activity;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, glowSize, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Restore original transform
    ctx.restore();

    // Draw labels for node types
    ctx.globalAlpha = 1;
    ctx.font = '12px Arial';
    ctx.fillStyle = '#e2e8f0';

    // The labels are drawn directly on canvas coordinates, not transformed
    ctx.fillText('Regular Nodes', 20, 30);
    ctx.fillText('Miner Nodes', 20, 50);
    ctx.fillText('Validator Nodes', 20, 70);

    // Draw color samples next to labels
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath();
    ctx.arc(10, 26, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#00ff00';
    ctx.beginPath();
    ctx.arc(10, 46, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0088ff';
    ctx.beginPath();
    ctx.arc(10, 66, 5, 0, Math.PI * 2);
    ctx.fill();
  };

  // Event handlers for zoom and pan
  const handleMouseDown = e => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = e => {
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;

      setOffset(prev => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }));

      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = e => {
    e.preventDefault();

    // Adjust zoom level based on wheel direction
    const delta = -Math.sign(e.deltaY) * 0.1;
    const newZoom = Math.max(0.5, Math.min(3, zoom + delta));

    setZoom(newZoom);
  };

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const container = canvasRef.current.parentElement;
        canvasRef.current.width = container.clientWidth;
        canvasRef.current.height = container.clientHeight;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Update network visualization based on WebSocket data
  const updateNetworkVisualization = data => {
    if (data && data.nodes) {
      setStats(prevStats => ({
        ...prevStats,
        activeNodes: data.nodes.length,
        connections: data.connections || prevStats.connections,
      }));

      // Update node activity based on data
      setNodes(prevNodes =>
        prevNodes.map(node => {
          if (node.type === 'validator') {
            return {
              ...node,
              activity: 0.3 + Math.random() * 0.7,
            };
          }
          return node;
        }),
      );

      // Update link activity
      setLinks(prevLinks =>
        prevLinks.map(link => ({
          ...link,
          active: Math.random() > 0.3,
        })),
      );
    }
  };

  // Update computation visualization based on WebSocket data
  const updateComputationVisualization = data => {
    if (data) {
      setStats(prevStats => ({
        ...prevStats,
        dataFlow: data.dataFlow || prevStats.dataFlow,
        computations: data.computations || prevStats.computations,
      }));

      // Update miner nodes based on computation activity
      setNodes(prevNodes =>
        prevNodes.map(node => {
          if (node.type === 'miner') {
            return {
              ...node,
              activity: 0.3 + Math.random() * 0.7,
            };
          }
          return node;
        }),
      );
    }
  };

  // Render component
  return (
    <div className="network-visualization-container">
      <div className="network-visualization-header">
        <h2>Real-Time Network Visualization</h2>
        <div
          className={`connection-status ${status === 'connected' ? 'connected' : 'disconnected'}`}
        >
          {status === 'connected' ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      <div className="network-stats">
        <div className="stat-item">
          <span className="stat-label">Active Nodes</span>
          <span className="stat-value">{stats.activeNodes}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Connections</span>
          <span className="stat-value">{stats.connections}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Data Flow</span>
          <span className="stat-value">{stats.dataFlow} kb/s</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Computations</span>
          <span className="stat-value">{stats.computations}</span>
        </div>
      </div>

      <div className="network-visualization-3d">
        {isLoading && (
          <div className="loading-overlay">
            <span>Loading network data...</span>
          </div>
        )}
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        />
      </div>

      <div className="network-visualization-legend">
        <div className="legend-item">
          <div
            className="legend-color"
            style={{ backgroundColor: '#ffaa00' }}
          ></div>
          <span>Regular Nodes</span>
        </div>
        <div className="legend-item">
          <div
            className="legend-color"
            style={{ backgroundColor: '#00ff00' }}
          ></div>
          <span>Miner Nodes</span>
        </div>
        <div className="legend-item">
          <div
            className="legend-color"
            style={{ backgroundColor: '#0088ff' }}
          ></div>
          <span>Validator Nodes</span>
        </div>
        <div className="legend-item">
          <div
            className="legend-color"
            style={{ backgroundColor: '#00ffff' }}
          ></div>
          <span>Data Packets</span>
        </div>
        <div className="legend-item">
          <div
            className="legend-color"
            style={{ backgroundColor: '#ff00ff' }}
          ></div>
          <span>Computational Data</span>
        </div>
      </div>

      <div className="control-instructions">
        <p>Drag to pan | Scroll to zoom | Click node for details</p>
      </div>
    </div>
  );
};

// frontend#328: every figure in NetworkVisualization3DSample is hard-coded or random; nothing
// on the testnet API backs it. Default build: honest not-live, sample never
// mounted. Demo surfaces: sample under a "Sample data" chip.
const NetworkVisualization3D = (props) => (
  <DemoSurfaceGate
    title="Network visualization is not live on the testnet yet"
    description="No node-topology feed reaches this view; the nodes, links and activity in the preview are invented."
    testId="network-3d"
  >
    <NetworkVisualization3DSample {...props} />
  </DemoSurfaceGate>
);

export default NetworkVisualization3D;
