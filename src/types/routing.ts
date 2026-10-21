// @cohesion: hand-written; frontend-only routing concern, no generated equivalent.
// Route registry types are purely a React/Vite concern with no Rust/backend analog.
// reviewed 2026-06-18: no overlap with generated-types.

/**
 * WRFCoin Frontend Route Registry Types
 * Comprehensive TypeScript definitions for centralized route management
 */

import { ComponentType, LazyExoticComponent } from 'react';

/**
 * Supported parameter types for route validation
 */
export type RouteParameterType =
  | 'string'
  | 'number'
  | 'uuid'
  | 'address'
  | 'hash'
  | 'slug';

/**
 * Route parameter definition with validation rules
 */
export interface RouteParameter {
  /** Parameter name (e.g., 'blockId', 'address') */
  name: string;
  /** Expected data type */
  type: RouteParameterType;
  /** Human-readable description */
  description: string;
  /** Optional regex pattern for validation */
  pattern?: string;
  /** Whether parameter is required */
  required?: boolean;
  /** Default value if parameter is optional */
  defaultValue?: string;
}

/**
 * Access levels for route protection
 */
export enum RouteAccessLevel {
  PUBLIC = 'public',
  AUTHENTICATED = 'authenticated',
  ADMIN = 'admin',
  DEVELOPER = 'developer',
  MINER = 'miner',
  VALIDATOR = 'validator',
}

/**
 * Route domains for logical grouping
 */
export enum RouteDomain {
  DASHBOARD = 'dashboard',
  EXPLORER = 'explorer',
  MINING = 'mining',
  WALLET = 'wallet',
  NFT = 'nft',
  ENVIRONMENTAL = 'environmental',
  RESOURCES = 'resources',
  SETTINGS = 'settings',
  ORACLE = 'oracle',
  CROSS_CHAIN = 'cross_chain',
  DEVELOPER = 'developer',
  COMPUTE = 'compute',
  SYSTEM = 'system',
}

/**
 * Component loading strategy
 */
export enum LoadingStrategy {
  STATIC = 'static',
  LAZY = 'lazy',
  PRELOAD = 'preload',
}

/**
 * Route types for categorization
 */
export enum RouteType {
  PAGE = 'page',
  MODAL = 'modal',
  REDIRECT = 'redirect',
  API = 'api',
  EXTERNAL = 'external',
}

/**
 * Component reference - supports both static and lazy components
 */
export type ComponentReference =
  | ComponentType<any>
  | LazyExoticComponent<ComponentType<any>>
  | string; // Component path for lazy loading

/**
 * Route dependency information
 */
export interface RouteDependency {
  /** Component file path */
  componentPath: string;
  /** Required props for the component */
  requiredProps?: string[];
  /** Optional props for the component */
  optionalProps?: string[];
  /** Services or hooks the component depends on */
  dependencies?: string[];
  /** Estimated bundle size impact */
  bundleSize?: number;
}

/**
 * Route metadata for enhanced functionality
 */
export interface RouteMetadata {
  /** Human-readable route title */
  title: string;
  /** Route description */
  description: string;
  /** Route tags for searching/filtering */
  tags?: string[];
  /** Route version for tracking changes */
  version?: string;
  /** Route author/maintainer */
  maintainer?: string;
  /** Estimated complexity score (1-10) */
  complexity?: number;
  /** Usage analytics data */
  analytics?: {
    avgSessionTime?: number;
    bounceRate?: number;
    userRating?: number;
  };
}

/**
 * Complete route definition
 */
export interface RouteDefinition {
  /** Unique route identifier */
  id: string;
  /** URL path pattern */
  path: string;
  /** Component to render */
  component: ComponentReference;
  /** Route domain classification */
  domain: RouteDomain;
  /** Route type */
  type: RouteType;
  /** Access level required */
  accessLevel: RouteAccessLevel;
  /** Loading strategy */
  loadingStrategy: LoadingStrategy;
  /** Route metadata */
  metadata: RouteMetadata;
  /** Route parameters */
  parameters?: RouteParameter[];
  /** Component dependency information */
  dependency: RouteDependency;
  /** Parent route ID for nested routes */
  parentId?: string;
  /** Child route IDs */
  childRouteIds?: string[];
  /** Redirect target (for redirect routes) */
  redirectTo?: string;
  /** Whether route is exact match */
  exact?: boolean;
  /** Whether route is currently active/enabled */
  enabled: boolean;
  /** Route creation timestamp */
  createdAt: Date;
  /** Last modification timestamp */
  updatedAt: Date;
}

/**
 * Route validation result
 */
export interface RouteValidationResult {
  /** Whether route is valid */
  isValid: boolean;
  /** Validation errors */
  errors: RouteValidationError[];
  /** Validation warnings */
  warnings: RouteValidationWarning[];
  /** Performance recommendations */
  recommendations?: string[];
}

/**
 * Route validation error
 */
export interface RouteValidationError {
  /** Error type */
  type:
    | 'component_missing'
    | 'path_conflict'
    | 'invalid_parameter'
    | 'circular_dependency'
    | 'access_conflict';
  /** Error message */
  message: string;
  /** Route ID where error occurred */
  routeId: string;
  /** Severity level */
  severity: 'error' | 'warning' | 'info';
}

/**
 * Route validation warning
 */
export interface RouteValidationWarning {
  /** Warning type */
  type:
    | 'redundant_route'
    | 'missing_metadata'
    | 'performance_concern'
    | 'accessibility_issue';
  /** Warning message */
  message: string;
  /** Route ID where warning occurred */
  routeId: string;
}

/**
 * Route conflict information
 */
export interface RouteConflict {
  /** Conflicting route IDs */
  routeIds: string[];
  /** Conflict type */
  type: 'path_overlap' | 'parameter_mismatch' | 'component_duplicate';
  /** Conflict description */
  description: string;
  /** Suggested resolution */
  resolution?: string;
}

/**
 * Route registry configuration
 */
export interface RouteRegistryConfig {
  /** Whether to enable route validation */
  enableValidation: boolean;
  /** Whether to enable performance monitoring */
  enablePerformanceMonitoring: boolean;
  /** Whether to enable route analytics */
  enableAnalytics: boolean;
  /** Default loading strategy */
  defaultLoadingStrategy: LoadingStrategy;
  /** Default access level */
  defaultAccessLevel: RouteAccessLevel;
  /** Whether to auto-generate route IDs */
  autoGenerateIds: boolean;
  /** Component discovery patterns */
  componentDiscoveryPatterns?: string[];
}

/**
 * Route registry statistics
 */
export interface RouteRegistryStats {
  /** Total number of routes */
  totalRoutes: number;
  /** Routes by domain */
  routesByDomain: Record<RouteDomain, number>;
  /** Routes by access level */
  routesByAccessLevel: Record<RouteAccessLevel, number>;
  /** Routes by loading strategy */
  routesByLoadingStrategy: Record<LoadingStrategy, number>;
  /** Number of dynamic routes */
  dynamicRoutes: number;
  /** Number of static routes */
  staticRoutes: number;
  /** Average complexity score */
  avgComplexity: number;
  /** Total bundle size estimate */
  estimatedBundleSize: number;
}

/**
 * Route search/filter criteria
 */
export interface RouteSearchCriteria {
  /** Search query */
  query?: string;
  /** Filter by domain */
  domain?: RouteDomain;
  /** Filter by access level */
  accessLevel?: RouteAccessLevel;
  /** Filter by tags */
  tags?: string[];
  /** Filter by route type */
  type?: RouteType;
  /** Filter by enabled status */
  enabled?: boolean;
  /** Sort by field */
  sortBy?: 'path' | 'title' | 'complexity' | 'createdAt' | 'updatedAt';
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
}

/**
 * Route registry event types
 */
export enum RouteRegistryEventType {
  ROUTE_ADDED = 'route_added',
  ROUTE_UPDATED = 'route_updated',
  ROUTE_REMOVED = 'route_removed',
  ROUTE_ACCESSED = 'route_accessed',
  VALIDATION_COMPLETED = 'validation_completed',
  CONFLICT_DETECTED = 'conflict_detected',
}

/**
 * Route registry event
 */
export interface RouteRegistryEvent {
  /** Event type */
  type: RouteRegistryEventType;
  /** Event timestamp */
  timestamp: Date;
  /** Affected route ID */
  routeId?: string;
  /** Event data */
  data?: any;
  /** User ID (if applicable) */
  userId?: string;
}

/**
 * CLI tool configuration
 */
export interface CLIToolConfig {
  /** Output format */
  outputFormat: 'json' | 'table' | 'yaml' | 'markdown';
  /** Whether to show detailed information */
  verbose: boolean;
  /** Whether to use colors in output */
  useColors: boolean;
  /** Export file path */
  exportPath?: string;
}

/**
 * Route visualization configuration
 */
export interface RouteVisualizationConfig {
  /** Visualization type */
  type: 'tree' | 'graph' | 'list' | 'hierarchy';
  /** Whether to show component dependencies */
  showDependencies: boolean;
  /** Whether to show route parameters */
  showParameters: boolean;
  /** Whether to group by domain */
  groupByDomain: boolean;
  /** Maximum depth for nested routes */
  maxDepth?: number;
}

/**
 * Export formats for route data
 */
export type RouteExportFormat =
  | 'json'
  | 'typescript'
  | 'yaml'
  | 'csv'
  | 'markdown';

/**
 * Component discovery result
 */
export interface ComponentDiscoveryResult {
  /** Discovered component path */
  componentPath: string;
  /** Component name */
  componentName: string;
  /** Estimated bundle size */
  bundleSize?: number;
  /** Component dependencies */
  dependencies: string[];
  /** Props interface (if available) */
  propsInterface?: string;
  /** Component complexity score */
  complexity?: number;
}
