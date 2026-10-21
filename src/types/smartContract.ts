// @cohesion: hand-written; smart-contract graph visualization domain is not in
// @wrfcoin/generated-types. Canonical on-chain types come from Solidity ABI in
// smart-contracts repo. Revisit if ABI types are auto-generated (e.g. typechain).
// reviewed 2026-06-18: no overlap with generated-types (weather/sensor/physics domain).

/**
 * TypeScript interfaces for WRFCoin Smart Contract Graph Visualization
 * Supports 96 contracts with 153 edges and 10-category classification system
 */

export interface SmartContractNode {
  id: string;
  name: string;
  category: ContractCategory;
  type: ContractType;
  importance: number; // 1-10, affects node size (15-45px)
  description: string;
  functions?: string[];
  events?: string[];
  modifiers?: string[];
  dependencies?: string[];
  bytecodeSize?: number;
  gasUsage?: {
    deployment: number;
    average: number;
  };
  auditStatus?: 'audited' | 'pending' | 'unaudited';
  audited?: boolean; // Simplified audit flag for fallback data
  version?: string;
  x?: number; // D3 positioning
  y?: number; // D3 positioning
  fx?: number; // Fixed positioning
  fy?: number; // Fixed positioning
}

export interface SmartContractEdge {
  id?: string;
  source: string;
  target: string;
  type: EdgeType;
  weight: number; // 1-10, affects line thickness
  description?: string;
  gasUsage?: number;
  frequency?: number; // For function calls
}

export type ContractCategory =
  | 'core' // WRFToken and primary contracts - Blue (#4361ee)
  | 'defi' // DeFi protocols (AMM, yield farming) - Green (#2ecc71)
  | 'nft' // NFT and marketplace contracts - Purple (#9b59b6)
  | 'governance' // DAO and voting contracts - Orange (#e67e22)
  | 'oracle' // Price feeds and external data - Teal (#1abc9c)
  | 'bridge' // Cross-chain bridge contracts - Red (#e74c3c)
  | 'carbon' // Carbon credit trading - Forest Green (#27ae60)
  | 'weather' // Weather data and IoT - Sky Blue (#3498db)
  | 'staking' // Staking and rewards - Gold (#f39c12)
  | 'security' // Multi-sig and security contracts - Dark Red (#c0392b)
  | 'environmental' // Environmental tracking contracts
  | 'utility'; // General-purpose utility contracts

export type ContractType =
  | 'contract'
  | 'interface'
  | 'library'
  | 'token'
  | 'governance'
  | 'defi'
  | 'nft'
  | 'oracle'
  | 'bridge'
  | 'utility'
  | 'treasury';

export type EdgeType =
  | 'inheritance' // Solid lines
  | 'import' // Dashed lines
  | 'call' // Dotted lines
  | 'event' // Dash-dot lines
  | 'modifier' // Double lines
  | 'ownership' // Ownership relationships
  | 'dependency' // Dependency relationships
  | 'integration' // Integration connections
  | 'data_feed'; // Data feed connections

export interface GraphLayout {
  type: 'force' | 'hierarchical' | 'clustered' | 'hub-spoke';
  centerNode?: string; // For hub-spoke layout
  levels?: number; // For hierarchical layout
}

export interface FilterOptions {
  categories: ContractCategory[];
  types: ContractType[];
  auditStatus: ('audited' | 'pending' | 'unaudited')[];
  minImportance: number;
  maxImportance: number;
  searchTerm: string;
  showOnlyConnected: boolean;
}

export interface GraphInteraction {
  selectedNodes: Set<string>;
  hoveredNode: string | null;
  highlightedEdges: Set<string>;
  zoom: {
    k: number; // Scale factor
    x: number; // Translation X
    y: number; // Translation Y
  };
}

export interface SmartContractGraphData {
  nodes: SmartContractNode[];
  edges: SmartContractEdge[];
  metadata?: {
    totalContracts?: number;
    totalConnections?: number;
    categories?: Partial<Record<ContractCategory, number>>;
    lastUpdated?: string;
    networkStats?: {
      diameter: number;
      density: number;
      avgClusteringCoefficient: number;
    };
  };
}

// Performance optimization types
export interface ViewportBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface RenderConfig {
  enableLevelOfDetail: boolean;
  viewportCulling: boolean;
  maxVisibleNodes: number;
  animationSpeed: number;
  enablePhysics: boolean;
}

// Color scheme for the 10 categories
export const CategoryColors: Record<ContractCategory, string> = {
  core: '#4361ee', // Primary blue
  defi: '#2ecc71', // Green
  nft: '#9b59b6', // Purple
  governance: '#e67e22', // Orange
  oracle: '#1abc9c', // Teal
  bridge: '#e74c3c', // Red
  carbon: '#27ae60', // Forest green
  weather: '#3498db', // Sky blue
  staking: '#f39c12', // Gold
  security: '#c0392b', // Dark red
  environmental: '#2d6a4f', // Dark green
  utility: '#6c757d', // Gray
};

// Node size mapping based on importance
export const getNodeSize = (importance: number): number => {
  return 15 + (importance - 1) * 3.33; // Maps 1-10 to 15-45px
};

// Edge stroke width based on weight
export const getEdgeWidth = (weight: number): number => {
  return 1 + (weight - 1) * 0.5; // Maps 1-10 to 1-5.5px
};
