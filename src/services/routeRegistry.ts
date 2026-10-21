/**
 * WRFCoin Frontend Centralized Route Registry
 * Comprehensive route management system with validation and introspection
 */

import {
  RouteDefinition,
  RouteValidationResult,
  RouteConflict,
  RouteRegistryConfig,
  RouteRegistryStats,
  RouteSearchCriteria,
  RouteRegistryEvent,
  RouteRegistryEventType,
  RouteDomain,
  RouteAccessLevel,
  LoadingStrategy,
  RouteType,
  RouteValidationError,
  RouteValidationWarning,
} from '../types/routing';

/**
 * Centralized Route Registry Class
 * Manages all application routes with validation, introspection, and management capabilities
 */
export class RouteRegistry {
  private routes: Map<string, RouteDefinition> = new Map();
  private config: RouteRegistryConfig;
  private eventListeners: Map<RouteRegistryEventType, Function[]> = new Map();
  private pathIndex: Map<string, string> = new Map(); // path -> routeId
  private domainIndex: Map<RouteDomain, string[]> = new Map(); // domain -> routeIds

  constructor(config: Partial<RouteRegistryConfig> = {}) {
    this.config = {
      enableValidation: true,
      enablePerformanceMonitoring: true,
      enableAnalytics: true,
      defaultLoadingStrategy: LoadingStrategy.STATIC,
      defaultAccessLevel: RouteAccessLevel.PUBLIC,
      autoGenerateIds: true,
      componentDiscoveryPatterns: ['src/components/**/*.{tsx,jsx}'],
      ...config,
    };

    this.initializeEventSystem();
  }

  /**
   * Register a new route in the registry
   */
  public registerRoute(route: RouteDefinition): void {
    // Validate route before registration
    if (this.config.enableValidation) {
      const validationResult = this.validateRoute(route);
      if (!validationResult.isValid) {
        throw new Error(
          `Route validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`,
        );
      }
    }

    // Generate ID if not provided and auto-generation is enabled
    if (!route.id && this.config.autoGenerateIds) {
      route.id = this.generateRouteId(route.path);
    }

    // Set timestamps
    const now = new Date();
    if (!route.createdAt) route.createdAt = now;
    route.updatedAt = now;

    // Register route
    this.routes.set(route.id, route);
    this.updateIndexes(route);

    // Emit event
    this.emitEvent(RouteRegistryEventType.ROUTE_ADDED, route.id, route);
  }

  /**
   * Update an existing route
   */
  public updateRoute(routeId: string, updates: Partial<RouteDefinition>): void {
    const existingRoute = this.routes.get(routeId);
    if (!existingRoute) {
      throw new Error(`Route with ID '${routeId}' not found`);
    }

    const updatedRoute = {
      ...existingRoute,
      ...updates,
      id: routeId, // Preserve original ID
      createdAt: existingRoute.createdAt, // Preserve creation date
      updatedAt: new Date(),
    };

    // Validate updated route
    if (this.config.enableValidation) {
      const validationResult = this.validateRoute(updatedRoute);
      if (!validationResult.isValid) {
        throw new Error(
          `Route validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`,
        );
      }
    }

    this.routes.set(routeId, updatedRoute);
    this.updateIndexes(updatedRoute);

    this.emitEvent(RouteRegistryEventType.ROUTE_UPDATED, routeId, updatedRoute);
  }

  /**
   * Remove a route from the registry
   */
  public removeRoute(routeId: string): void {
    const route = this.routes.get(routeId);
    if (!route) {
      throw new Error(`Route with ID '${routeId}' not found`);
    }

    this.routes.delete(routeId);
    this.removeFromIndexes(route);

    this.emitEvent(RouteRegistryEventType.ROUTE_REMOVED, routeId, route);
  }

  /**
   * Get a route by ID
   */
  public getRoute(routeId: string): RouteDefinition | undefined {
    return this.routes.get(routeId);
  }

  /**
   * Get a route by path
   */
  public getRouteByPath(path: string): RouteDefinition | undefined {
    const routeId = this.pathIndex.get(path);
    return routeId ? this.routes.get(routeId) : undefined;
  }

  /**
   * Get all routes
   */
  public getAllRoutes(): RouteDefinition[] {
    return Array.from(this.routes.values());
  }

  /**
   * Search and filter routes
   */
  public searchRoutes(criteria: RouteSearchCriteria): RouteDefinition[] {
    let results = this.getAllRoutes();

    // Apply filters
    if (criteria.domain) {
      results = results.filter(route => route.domain === criteria.domain);
    }

    if (criteria.accessLevel) {
      results = results.filter(
        route => route.accessLevel === criteria.accessLevel,
      );
    }

    if (criteria.type) {
      results = results.filter(route => route.type === criteria.type);
    }

    if (criteria.enabled !== undefined) {
      results = results.filter(route => route.enabled === criteria.enabled);
    }

    if (criteria.tags && criteria.tags.length > 0) {
      results = results.filter(route =>
        route.metadata.tags?.some(tag => criteria.tags!.includes(tag)),
      );
    }

    // Apply text search
    if (criteria.query) {
      const query = criteria.query.toLowerCase();
      results = results.filter(
        route =>
          route.path.toLowerCase().includes(query) ||
          route.metadata.title.toLowerCase().includes(query) ||
          route.metadata.description.toLowerCase().includes(query),
      );
    }

    // Apply sorting
    if (criteria.sortBy) {
      results.sort((a, b) => {
        let aValue: any, bValue: any;

        switch (criteria.sortBy) {
        case 'path':
          aValue = a.path;
          bValue = b.path;
          break;
        case 'title':
          aValue = a.metadata.title;
          bValue = b.metadata.title;
          break;
        case 'complexity':
          aValue = a.metadata.complexity || 0;
          bValue = b.metadata.complexity || 0;
          break;
        case 'createdAt':
          aValue = a.createdAt;
          bValue = b.createdAt;
          break;
        case 'updatedAt':
          aValue = a.updatedAt;
          bValue = b.updatedAt;
          break;
        default:
          return 0;
        }

        if (criteria.sortDirection === 'desc') {
          return bValue > aValue ? 1 : -1;
        } else {
          return aValue > bValue ? 1 : -1;
        }
      });
    }

    return results;
  }

  /**
   * Validate all routes and return comprehensive results
   */
  public validateAllRoutes(): RouteValidationResult {
    const errors: RouteValidationError[] = [];
    const warnings: RouteValidationWarning[] = [];
    const recommendations: string[] = [];

    // Check for path conflicts
    const pathConflicts = this.detectPathConflicts();
    pathConflicts.forEach(conflict => {
      errors.push({
        type: 'path_conflict',
        message: `Path conflict detected: ${conflict.description}`,
        routeId: conflict.routeIds[0],
        severity: 'error',
      });
    });

    // Validate individual routes
    this.routes.forEach((route, routeId) => {
      const routeValidation = this.validateRoute(route);
      errors.push(...routeValidation.errors);
      warnings.push(...routeValidation.warnings);
    });

    // Check for orphaned routes (routes without valid components)
    this.detectOrphanedRoutes().forEach(routeId => {
      errors.push({
        type: 'component_missing',
        message: `Route ${routeId} references a missing or invalid component`,
        routeId,
        severity: 'error',
      });
    });

    // Performance recommendations
    const staticRoutes = this.getAllRoutes().filter(
      r => r.loadingStrategy === LoadingStrategy.STATIC,
    );
    if (staticRoutes.length > 10) {
      recommendations.push(
        'Consider implementing lazy loading for some routes to improve initial bundle size',
      );
    }

    // Accessibility warnings
    this.routes.forEach((route, routeId) => {
      if (!route.metadata.title || route.metadata.title.trim() === '') {
        warnings.push({
          type: 'accessibility_issue',
          message: `Route ${routeId} is missing a title, which affects accessibility`,
          routeId,
        });
      }
    });

    this.emitEvent(RouteRegistryEventType.VALIDATION_COMPLETED, undefined, {
      errors: errors.length,
      warnings: warnings.length,
      recommendations: recommendations.length,
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      recommendations,
    };
  }

  /**
   * Detect route conflicts using advanced validation
   */
  public detectPathConflicts(): RouteConflict[] {
    const routes = this.getAllRoutes();
    const { detectAdvancedPathConflicts } = require('../utils/routeValidation');
    return detectAdvancedPathConflicts(routes);
  }

  /**
   * Detect orphaned routes with advanced analysis
   */
  public async detectOrphanedRoutesAdvanced(componentAnalysis?: any): Promise<{
    orphanedRoutes: string[];
    brokenImports: string[];
    deadComponentRoutes: string[];
    unreachableRoutes: string[];
  }> {
    const routes = this.getAllRoutes();
    const { identifyOrphanedRoutes } = require('../utils/routeValidation');
    return await identifyOrphanedRoutes(routes, componentAnalysis);
  }

  /**
   * Calculate route health scores
   */
  public calculateRouteHealthScores(): Record<
    string,
    { score: number; factors: any[]; recommendations: string[] }
    > {
    const routes = this.getAllRoutes();
    const { calculateRouteHealthScore } = require('../utils/routeValidation');
    const healthScores: Record<string, any> = {};

    routes.forEach(route => {
      healthScores[route.id] = calculateRouteHealthScore(route);
    });

    return healthScores;
  }

  /**
   * Generate route optimization recommendations
   */
  public generateOptimizationRecommendations(): {
    lazyLoadingOpportunities: Array<{
      routeId: string;
      reason: string;
      potentialSavings: number;
    }>;
    consolidationSuggestions: Array<{
      routeIds: string[];
      reason: string;
      newPath: string;
    }>;
    performanceOptimizations: Array<{
      routeId: string;
      optimization: string;
      impact: string;
    }>;
    bundleSplittingAdvice: Array<{
      domain: string;
      routes: string[];
      estimatedSize: number;
    }>;
    } {
    const routes = this.getAllRoutes();
    const {
      generateRouteOptimizationRecommendations,
    } = require('../utils/routeValidation');
    return generateRouteOptimizationRecommendations(routes);
  }

  /**
   * Detect orphaned routes (routes without valid components)
   */
  public detectOrphanedRoutes(): string[] {
    const orphanedRoutes: string[] = [];

    this.routes.forEach((route, routeId) => {
      if (typeof route.component === 'string') {
        // Component is a string path - check if it exists
        // This would require filesystem access in a real implementation
        // For now, we'll mark it as potentially orphaned
        orphanedRoutes.push(routeId);
      }
      // For actual component references, we could use React.isValidElement
      // or other runtime checks
    });

    return orphanedRoutes;
  }

  /**
   * Get registry statistics
   */
  public getStats(): RouteRegistryStats {
    const routes = this.getAllRoutes();

    const routesByDomain = {} as Record<RouteDomain, number>;
    const routesByAccessLevel = {} as Record<RouteAccessLevel, number>;
    const routesByLoadingStrategy = {} as Record<LoadingStrategy, number>;

    let dynamicRoutes = 0;
    let totalComplexity = 0;
    let estimatedBundleSize = 0;

    routes.forEach(route => {
      // Count by domain
      routesByDomain[route.domain] = (routesByDomain[route.domain] || 0) + 1;

      // Count by access level
      routesByAccessLevel[route.accessLevel] =
        (routesByAccessLevel[route.accessLevel] || 0) + 1;

      // Count by loading strategy
      routesByLoadingStrategy[route.loadingStrategy] =
        (routesByLoadingStrategy[route.loadingStrategy] || 0) + 1;

      // Count dynamic routes
      if (route.parameters && route.parameters.length > 0) {
        dynamicRoutes++;
      }

      // Sum complexity
      if (route.metadata.complexity) {
        totalComplexity += route.metadata.complexity;
      }

      // Sum bundle size estimates
      if (route.dependency.bundleSize) {
        estimatedBundleSize += route.dependency.bundleSize;
      }
    });

    return {
      totalRoutes: routes.length,
      routesByDomain,
      routesByAccessLevel,
      routesByLoadingStrategy,
      dynamicRoutes,
      staticRoutes: routes.length - dynamicRoutes,
      avgComplexity: routes.length > 0 ? totalComplexity / routes.length : 0,
      estimatedBundleSize,
    };
  }

  /**
   * Export routes in various formats
   */
  public exportRoutes(format: 'json' | 'typescript' | 'yaml' = 'json'): string {
    const routes = this.getAllRoutes();

    switch (format) {
    case 'json':
      return JSON.stringify(routes, null, 2);

    case 'typescript':
      return this.generateTypeScriptExport(routes);

    case 'yaml':
      // YAML export would require a YAML library
      return JSON.stringify(routes, null, 2); // Fallback to JSON

    default:
      return JSON.stringify(routes, null, 2);
    }
  }

  /**
   * Add event listener
   */
  public addEventListener(
    event: RouteRegistryEventType,
    listener: Function,
  ): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(
    event: RouteRegistryEventType,
    listener: Function,
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Private helper methods

  private validateRoute(route: RouteDefinition): RouteValidationResult {
    const errors: RouteValidationError[] = [];
    const warnings: RouteValidationWarning[] = [];

    // Validate required fields
    if (!route.id) {
      errors.push({
        type: 'invalid_parameter',
        message: 'Route ID is required',
        routeId: route.id || 'unknown',
        severity: 'error',
      });
    }

    if (!route.path) {
      errors.push({
        type: 'invalid_parameter',
        message: 'Route path is required',
        routeId: route.id,
        severity: 'error',
      });
    }

    if (!route.component) {
      errors.push({
        type: 'component_missing',
        message: 'Route component is required',
        routeId: route.id,
        severity: 'error',
      });
    }

    // Validate path format
    if (route.path && !route.path.startsWith('/')) {
      errors.push({
        type: 'invalid_parameter',
        message: 'Route path must start with "/"',
        routeId: route.id,
        severity: 'error',
      });
    }

    // Check for missing metadata
    if (!route.metadata.title) {
      warnings.push({
        type: 'missing_metadata',
        message: 'Route is missing a title',
        routeId: route.id,
      });
    }

    if (!route.metadata.description) {
      warnings.push({
        type: 'missing_metadata',
        message: 'Route is missing a description',
        routeId: route.id,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private generateRouteId(path: string): string {
    // Generate a route ID from the path
    return (
      path
        .replace(/^\//, '') // Remove leading slash
        .replace(/\/:/g, '_') // Replace parameter indicators
        .replace(/\//g, '_') // Replace slashes with underscores
        .replace(/[^a-zA-Z0-9_]/g, '') // Remove special characters
        .toLowerCase() || 'root'
    );
  }

  private updateIndexes(route: RouteDefinition): void {
    // Update path index
    this.pathIndex.set(route.path, route.id);

    // Update domain index
    if (!this.domainIndex.has(route.domain)) {
      this.domainIndex.set(route.domain, []);
    }
    const domainRoutes = this.domainIndex.get(route.domain)!;
    if (!domainRoutes.includes(route.id)) {
      domainRoutes.push(route.id);
    }
  }

  private removeFromIndexes(route: RouteDefinition): void {
    // Remove from path index
    this.pathIndex.delete(route.path);

    // Remove from domain index
    const domainRoutes = this.domainIndex.get(route.domain);
    if (domainRoutes) {
      const index = domainRoutes.indexOf(route.id);
      if (index > -1) {
        domainRoutes.splice(index, 1);
      }
    }
  }

  private normalizePath(path: string): string {
    // Normalize path for conflict detection
    return path.replace(/:[a-zA-Z0-9_]+/g, ':param');
  }

  private emitEvent(
    type: RouteRegistryEventType,
    routeId?: string,
    data?: any,
  ): void {
    const event: RouteRegistryEvent = {
      type,
      timestamp: new Date(),
      routeId,
      data,
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in route registry event listener:', error);
        }
      });
    }
  }

  private initializeEventSystem(): void {
    // Initialize event listener maps for all event types
    Object.values(RouteRegistryEventType).forEach(eventType => {
      this.eventListeners.set(eventType, []);
    });
  }

  private generateTypeScriptExport(routes: RouteDefinition[]): string {
    // Generate TypeScript code for routes
    const routeConstants = routes
      .map(
        route =>
          `export const ${route.id.toUpperCase()}_ROUTE = '${route.path}';`,
      )
      .join('\n');

    const routeMap = `export const ROUTE_MAP = {\n${routes
      .map(route => `  ${route.id}: '${route.path}'`)
      .join(',\n')}\n} as const;`;

    return `// Auto-generated route constants\n${routeConstants}\n\n${routeMap}`;
  }
}

// Singleton instance
export const routeRegistry = new RouteRegistry();
