/**
 * WRFCoin Route Validation Utilities
 * Advanced validation logic for route definitions and component relationships
 */

import {
  RouteDefinition,
  RouteValidationResult,
  RouteValidationError,
  RouteValidationWarning,
  RouteConflict,
  RouteParameter,
  RouteParameterType,
  ComponentDiscoveryResult,
} from '../types/routing';

/**
 * Parameter validation patterns by type
 */
const PARAMETER_PATTERNS: Record<RouteParameterType, RegExp> = {
  string: /^[a-zA-Z0-9_-]+$/,
  number: /^[0-9]+$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  address: /^0x[a-fA-F0-9]{40}$/,
  hash: /^0x[a-fA-F0-9]{64}$/,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
};

/**
 * Validate route parameter against its type definition
 */
export function validateRouteParameter(
  value: string,
  parameter: RouteParameter,
): { isValid: boolean; error?: string } {
  // Check required parameter
  if (parameter.required && (!value || value.trim() === '')) {
    return {
      isValid: false,
      error: `Parameter '${parameter.name}' is required`,
    };
  }

  // Skip validation for optional empty parameters
  if (!parameter.required && (!value || value.trim() === '')) {
    return { isValid: true };
  }

  // Check custom pattern first
  if (parameter.pattern) {
    const customPattern = new RegExp(parameter.pattern);
    if (!customPattern.test(value)) {
      return {
        isValid: false,
        error: `Parameter '${parameter.name}' does not match required pattern: ${parameter.pattern}`,
      };
    }
  }

  // Check type-based pattern
  const typePattern = PARAMETER_PATTERNS[parameter.type];
  if (typePattern && !typePattern.test(value)) {
    return {
      isValid: false,
      error: `Parameter '${parameter.name}' is not a valid ${parameter.type}`,
    };
  }

  return { isValid: true };
}

/**
 * Validate all parameters in a route path
 */
export function validateRouteParameters(
  path: string,
  parameters: RouteParameter[],
): RouteValidationResult {
  const errors: RouteValidationError[] = [];
  const warnings: RouteValidationWarning[] = [];

  // Extract parameter names from path
  const pathParams = extractParametersFromPath(path);
  const definedParams = parameters.map(p => p.name);

  // Check for parameters in path but not defined
  pathParams.forEach(paramName => {
    if (!definedParams.includes(paramName)) {
      errors.push({
        type: 'invalid_parameter',
        message: `Parameter '${paramName}' found in path but not defined in parameters array`,
        routeId: 'unknown',
        severity: 'error',
      });
    }
  });

  // Check for defined parameters not in path
  definedParams.forEach(paramName => {
    if (!pathParams.includes(paramName)) {
      warnings.push({
        type: 'missing_metadata',
        message: `Parameter '${paramName}' defined but not used in path`,
        routeId: 'unknown',
      });
    }
  });

  // Validate parameter definitions
  parameters.forEach(param => {
    if (!param.name || param.name.trim() === '') {
      errors.push({
        type: 'invalid_parameter',
        message: 'Parameter name is required',
        routeId: 'unknown',
        severity: 'error',
      });
    }

    if (!param.type) {
      errors.push({
        type: 'invalid_parameter',
        message: `Parameter '${param.name}' is missing type definition`,
        routeId: 'unknown',
        severity: 'error',
      });
    }

    if (!param.description || param.description.trim() === '') {
      warnings.push({
        type: 'missing_metadata',
        message: `Parameter '${param.name}' is missing description`,
        routeId: 'unknown',
      });
    }

    // Validate custom patterns
    if (param.pattern) {
      try {
        new RegExp(param.pattern);
      } catch (error) {
        errors.push({
          type: 'invalid_parameter',
          message: `Parameter '${param.name}' has invalid regex pattern: ${param.pattern}`,
          routeId: 'unknown',
          severity: 'error',
        });
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Extract parameter names from a route path
 */
export function extractParametersFromPath(path: string): string[] {
  const paramRegex = /:([a-zA-Z0-9_]+)/g;
  const matches = [];
  let match;

  while ((match = paramRegex.exec(path)) !== null) {
    matches.push(match[1]);
  }

  return matches;
}

/**
 * Advanced route path conflict detection with parameter type analysis
 */
export function detectRoutePathConflict(
  path1: string,
  path2: string,
  params1?: RouteParameter[],
  params2?: RouteParameter[],
): boolean {
  // Normalize paths for comparison
  const normalized1 = normalizePath(path1);
  const normalized2 = normalizePath(path2);

  // Exact match
  if (normalized1 === normalized2) {
    return true;
  }

  // Check if one path is a subset of another
  const segments1 = normalized1.split('/').filter(s => s);
  const segments2 = normalized2.split('/').filter(s => s);

  if (segments1.length !== segments2.length) {
    return false;
  }

  // Compare segments with parameter type awareness
  for (let i = 0; i < segments1.length; i++) {
    const seg1 = segments1[i];
    const seg2 = segments2[i];

    // Both are parameters - check for type conflicts
    if (seg1 === ':param' && seg2 === ':param') {
      const param1Name = extractParametersFromPath(path1)[i];
      const param2Name = extractParametersFromPath(path2)[i];

      if (params1 && params2 && param1Name && param2Name) {
        const param1Type = params1.find(p => p.name === param1Name)?.type;
        const param2Type = params2.find(p => p.name === param2Name)?.type;

        // Different parameter types can potentially conflict
        if (param1Type && param2Type && param1Type !== param2Type) {
          return hasParameterTypeConflict(param1Type, param2Type);
        }
      }
      continue;
    }

    // One is parameter, one is static - no conflict
    if ((seg1 === ':param') !== (seg2 === ':param')) {
      return false;
    }

    // Both static but different - no conflict
    if (seg1 !== seg2) {
      return false;
    }
  }

  return true;
}

/**
 * Check if parameter types could conflict in URL resolution
 */
function hasParameterTypeConflict(
  type1: RouteParameterType,
  type2: RouteParameterType,
): boolean {
  // Define type compatibility matrix
  const conflictMatrix: Record<RouteParameterType, RouteParameterType[]> = {
    string: ['number', 'uuid', 'address', 'hash'], // string can match anything
    number: ['string', 'uuid', 'address', 'hash'],
    uuid: ['string', 'number', 'address', 'hash'],
    address: ['string', 'number', 'uuid', 'hash'],
    hash: ['string', 'number', 'uuid', 'address'],
    slug: ['string'], // slug conflicts only with generic string
  };

  return conflictMatrix[type1]?.includes(type2) || false;
}

/**
 * Advanced pattern-based conflict detection
 */
export function detectAdvancedPathConflicts(
  routes: RouteDefinition[],
): RouteConflict[] {
  const conflicts: RouteConflict[] = [];
  const routeGroups = new Map<string, RouteDefinition[]>();

  // Group routes by base path pattern
  routes.forEach(route => {
    const basePattern = getBasePathPattern(route.path);
    if (!routeGroups.has(basePattern)) {
      routeGroups.set(basePattern, []);
    }
    routeGroups.get(basePattern)!.push(route);
  });

  // Check each group for conflicts
  routeGroups.forEach((groupRoutes, pattern) => {
    if (groupRoutes.length > 1) {
      // Check for priority conflicts
      const priorityConflicts = detectPriorityConflicts(groupRoutes);
      conflicts.push(...priorityConflicts);

      // Check for parameter type conflicts
      const paramConflicts = detectParameterConflicts(groupRoutes);
      conflicts.push(...paramConflicts);

      // Check for nested route conflicts
      const nestedConflicts = detectNestedRouteConflicts(groupRoutes);
      conflicts.push(...nestedConflicts);
    }
  });

  return conflicts;
}

/**
 * Extract base path pattern for grouping
 */
function getBasePathPattern(path: string): string {
  const segments = path.split('/').filter(s => s);
  // Use first two segments for base pattern
  return (
    '/' +
    segments
      .slice(0, 2)
      .map(seg => (seg.startsWith(':') ? ':param' : seg))
      .join('/')
  );
}

/**
 * Detect priority-based conflicts in route ordering
 */
function detectPriorityConflicts(routes: RouteDefinition[]): RouteConflict[] {
  const conflicts: RouteConflict[] = [];

  for (let i = 0; i < routes.length; i++) {
    for (let j = i + 1; j < routes.length; j++) {
      const route1 = routes[i];
      const route2 = routes[j];

      // Check if more specific route comes after less specific
      if (isMoreSpecific(route2.path, route1.path)) {
        conflicts.push({
          routeIds: [route1.id, route2.id],
          type: 'path_overlap',
          description: `Route order conflict: more specific route '${route2.path}' should come before '${route1.path}'`,
          resolution: 'Reorder routes to place more specific patterns first',
        });
      }
    }
  }

  return conflicts;
}

/**
 * Detect parameter type conflicts between routes
 */
function detectParameterConflicts(routes: RouteDefinition[]): RouteConflict[] {
  const conflicts: RouteConflict[] = [];

  for (let i = 0; i < routes.length; i++) {
    for (let j = i + 1; j < routes.length; j++) {
      const route1 = routes[i];
      const route2 = routes[j];

      if (
        detectRoutePathConflict(
          route1.path,
          route2.path,
          route1.parameters,
          route2.parameters,
        )
      ) {
        conflicts.push({
          routeIds: [route1.id, route2.id],
          type: 'parameter_mismatch',
          description: `Parameter type conflict between '${route1.path}' and '${route2.path}'`,
          resolution:
            'Use different parameter types or more specific path patterns',
        });
      }
    }
  }

  return conflicts;
}

/**
 * Check if one path is more specific than another
 */
function isMoreSpecific(path1: string, path2: string): boolean {
  const segments1 = path1.split('/').filter(s => s);
  const segments2 = path2.split('/').filter(s => s);

  if (segments1.length !== segments2.length) {
    return segments1.length > segments2.length;
  }

  let specificity1 = 0;
  let specificity2 = 0;

  for (let i = 0; i < segments1.length; i++) {
    if (!segments1[i].startsWith(':')) specificity1++;
    if (!segments2[i].startsWith(':')) specificity2++;
  }

  return specificity1 > specificity2;
}

/**
 * Detect conflicts in nested route hierarchies
 */
function detectNestedRouteConflicts(
  routes: RouteDefinition[],
): RouteConflict[] {
  const conflicts: RouteConflict[] = [];

  routes.forEach(route => {
    if (route.childRouteIds && route.childRouteIds.length > 0) {
      const childRoutes = routes.filter(r =>
        route.childRouteIds!.includes(r.id),
      );

      childRoutes.forEach(child => {
        if (!child.path.startsWith(route.path)) {
          conflicts.push({
            routeIds: [route.id, child.id],
            type: 'path_overlap',
            description: `Child route '${child.path}' does not start with parent path '${route.path}'`,
            resolution:
              'Ensure child routes have paths that extend their parent paths',
          });
        }
      });
    }
  });

  return conflicts;
}

/**
 * Normalize path for conflict detection
 */
function normalizePath(path: string): string {
  return path.replace(/:[a-zA-Z0-9_]+/g, ':param');
}

/**
 * Validate route component accessibility
 */
export async function validateComponentAccessibility(
  component: any,
): Promise<{ isValid: boolean; error?: string }> {
  try {
    // Check if component is a string (lazy loading path)
    if (typeof component === 'string') {
      // In a real implementation, this would check if the file exists
      // For now, we'll assume string components are valid paths
      return { isValid: true };
    }

    // Check if component is a React component
    if (typeof component === 'function') {
      // Try to create an instance to validate
      // This is a basic check - in production you'd want more sophisticated validation
      return { isValid: true };
    }

    // Check if component is a lazy component
    if (component && typeof component === 'object' && component.$$typeof) {
      return { isValid: true };
    }

    return {
      isValid: false,
      error: 'Component is not a valid React component or component path',
    };
  } catch (error) {
    return {
      isValid: false,
      error: `Component validation failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Detect circular dependencies in route hierarchy
 */
export function detectCircularDependencies(
  routes: RouteDefinition[],
): RouteConflict[] {
  const conflicts: RouteConflict[] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCircularDependency(
    routeId: string,
    routeMap: Map<string, RouteDefinition>,
  ): boolean {
    if (recursionStack.has(routeId)) {
      return true; // Circular dependency detected
    }

    if (visited.has(routeId)) {
      return false; // Already processed
    }

    visited.add(routeId);
    recursionStack.add(routeId);

    const route = routeMap.get(routeId);
    if (route && route.childRouteIds) {
      for (const childId of route.childRouteIds) {
        if (hasCircularDependency(childId, routeMap)) {
          return true;
        }
      }
    }

    recursionStack.delete(routeId);
    return false;
  }

  const routeMap = new Map(routes.map(r => [r.id, r]));

  routes.forEach(route => {
    if (!visited.has(route.id) && hasCircularDependency(route.id, routeMap)) {
      conflicts.push({
        routeIds: [route.id],
        type: 'parameter_mismatch',
        description: `Circular dependency detected in route hierarchy starting from '${route.id}'`,
        resolution:
          'Review parent-child relationships and remove circular references',
      });
    }
  });

  return conflicts;
}

/**
 * Validate bundle size optimization
 */
export function validateBundleOptimization(
  routes: RouteDefinition[],
): RouteValidationWarning[] {
  const warnings: RouteValidationWarning[] = [];
  const LARGE_BUNDLE_THRESHOLD = 50000; // 50KB
  const TOTAL_STATIC_THRESHOLD = 300000; // 300KB

  let totalStaticSize = 0;
  let largeComponentCount = 0;

  routes.forEach(route => {
    const bundleSize = route.dependency.bundleSize || 0;

    // Check for large individual components
    if (bundleSize > LARGE_BUNDLE_THRESHOLD) {
      warnings.push({
        type: 'performance_concern',
        message: `Route '${route.id}' has a large bundle size (${bundleSize} bytes). Consider code splitting.`,
        routeId: route.id,
      });
      largeComponentCount++;
    }

    // Sum static bundle sizes
    if (route.loadingStrategy === 'static') {
      totalStaticSize += bundleSize;
    }
  });

  // Check total static bundle size
  if (totalStaticSize > TOTAL_STATIC_THRESHOLD) {
    warnings.push({
      type: 'performance_concern',
      message: `Total static bundle size is ${totalStaticSize} bytes. Consider implementing lazy loading for some routes.`,
      routeId: 'bundle_optimization',
    });
  }

  // Check for too many large components
  if (largeComponentCount > 5) {
    warnings.push({
      type: 'performance_concern',
      message: `${largeComponentCount} routes have large bundle sizes. Consider optimization strategies.`,
      routeId: 'bundle_optimization',
    });
  }

  return warnings;
}

/**
 * Validate accessibility compliance
 */
export function validateAccessibilityCompliance(
  routes: RouteDefinition[],
): RouteValidationWarning[] {
  const warnings: RouteValidationWarning[] = [];

  routes.forEach(route => {
    // Check for missing titles
    if (!route.metadata.title || route.metadata.title.trim() === '') {
      warnings.push({
        type: 'accessibility_issue',
        message: `Route '${route.id}' is missing a title for accessibility`,
        routeId: route.id,
      });
    }

    // Check for missing descriptions
    if (
      !route.metadata.description ||
      route.metadata.description.trim() === ''
    ) {
      warnings.push({
        type: 'accessibility_issue',
        message: `Route '${route.id}' is missing a description for accessibility`,
        routeId: route.id,
      });
    }

    // Check for proper parameter descriptions
    if (route.parameters) {
      route.parameters.forEach(param => {
        if (!param.description || param.description.trim() === '') {
          warnings.push({
            type: 'accessibility_issue',
            message: `Parameter '${param.name}' in route '${route.id}' lacks description`,
            routeId: route.id,
          });
        }
      });
    }
  });

  return warnings;
}

/**
 * Identify orphaned routes that point to non-existent or dead components
 */
export async function identifyOrphanedRoutes(
  routes: RouteDefinition[],
  componentAnalysis?: any,
): Promise<{
  orphanedRoutes: string[];
  brokenImports: string[];
  deadComponentRoutes: string[];
  unreachableRoutes: string[];
}> {
  const orphanedRoutes: string[] = [];
  const brokenImports: string[] = [];
  const deadComponentRoutes: string[] = [];
  const unreachableRoutes: string[] = [];

  for (const route of routes) {
    // Check for broken component imports
    if (typeof route.component === 'string') {
      const componentExists = await checkComponentExists(route.component);
      if (!componentExists) {
        orphanedRoutes.push(route.id);
        brokenImports.push(route.id);
      }
    }

    // Check against component analysis data
    if (componentAnalysis) {
      const componentName = getComponentNameFromRoute(route);
      if (componentName) {
        const deadComponents = [
          ...(componentAnalysis.classifications?.dead || []),
          ...(componentAnalysis.classifications?.orphaned || []),
        ];

        const isDeadComponent = deadComponents.some(
          (comp: any) => comp.name === componentName && comp.riskScore >= 8,
        );

        if (isDeadComponent) {
          deadComponentRoutes.push(route.id);
          orphanedRoutes.push(route.id);
        }
      }
    }

    // Check for unreachable routes (no parent routes leading to them)
    if (route.parentId && !routes.find(r => r.id === route.parentId)) {
      unreachableRoutes.push(route.id);
      orphanedRoutes.push(route.id);
    }
  }

  return {
    orphanedRoutes: [...new Set(orphanedRoutes)],
    brokenImports,
    deadComponentRoutes,
    unreachableRoutes,
  };
}

/**
 * Check if component file exists
 */
async function checkComponentExists(componentPath: string): Promise<boolean> {
  try {
    // In a real implementation, this would check the filesystem
    // For now, we'll use a simple heuristic
    return (
      componentPath.includes('/components/') &&
      !componentPath.includes('LazyLoader')
    );
  } catch {
    return false;
  }
}

/**
 * Extract component name from route definition
 */
function getComponentNameFromRoute(route: RouteDefinition): string | null {
  if (typeof route.component === 'string') {
    const parts = route.component.split('/');
    const filename = parts[parts.length - 1];
    return filename.replace(/\.(jsx?|tsx?)$/, '');
  }

  if (typeof route.component === 'function') {
    return route.component.name || null;
  }

  return null;
}

/**
 * Enhanced route health scoring system
 */
export function calculateRouteHealthScore(
  route: RouteDefinition,
  metrics?: {
    usageCount?: number;
    errorRate?: number;
    loadTime?: number;
    bundleSize?: number;
    lastAccessed?: Date;
  },
): {
  score: number;
  factors: Array<{ factor: string; impact: number; description: string }>;
  recommendations: string[];
} {
  let score = 100;
  const factors: Array<{
    factor: string;
    impact: number;
    description: string;
  }> = [];
  const recommendations: string[] = [];

  // Component accessibility (-20 to -5 points)
  if (
    typeof route.component === 'string' &&
    route.component.includes('LazyLoader')
  ) {
    const impact = -15;
    score += impact;
    factors.push({
      factor: 'Component Import',
      impact,
      description: 'Route points to potentially broken lazy component',
    });
    recommendations.push(
      'Verify component import path and ensure component exists',
    );
  }

  // Bundle size impact (-15 to -5 points)
  const bundleSize = metrics?.bundleSize || route.dependency.bundleSize || 0;
  if (bundleSize > 100000) {
    // > 100KB
    const impact = -15;
    score += impact;
    factors.push({
      factor: 'Bundle Size',
      impact,
      description: `Large bundle size: ${formatBytes(bundleSize)}`,
    });
    recommendations.push('Consider code splitting and lazy loading');
  } else if (bundleSize > 50000) {
    // > 50KB
    const impact = -8;
    score += impact;
    factors.push({
      factor: 'Bundle Size',
      impact,
      description: `Moderate bundle size: ${formatBytes(bundleSize)}`,
    });
  }

  // Usage metrics (-20 to +10 points)
  const usageCount = metrics?.usageCount || 0;
  if (usageCount === 0) {
    const impact = -20;
    score += impact;
    factors.push({
      factor: 'Usage',
      impact,
      description: 'Route has no recorded usage',
    });
    recommendations.push(
      'Consider removing unused route or improving discoverability',
    );
  } else if (usageCount < 10) {
    const impact = -10;
    score += impact;
    factors.push({
      factor: 'Usage',
      impact,
      description: 'Low usage frequency',
    });
  } else if (usageCount > 1000) {
    const impact = 10;
    score += impact;
    factors.push({
      factor: 'Usage',
      impact,
      description: 'High usage frequency',
    });
  }

  // Error rate (-25 to 0 points)
  const errorRate = metrics?.errorRate || 0;
  if (errorRate > 0.1) {
    // > 10% error rate
    const impact = -25;
    score += impact;
    factors.push({
      factor: 'Error Rate',
      impact,
      description: `High error rate: ${(errorRate * 100).toFixed(1)}%`,
    });
    recommendations.push('Investigate and fix route errors');
  } else if (errorRate > 0.05) {
    // > 5% error rate
    const impact = -10;
    score += impact;
    factors.push({
      factor: 'Error Rate',
      impact,
      description: `Moderate error rate: ${(errorRate * 100).toFixed(1)}%`,
    });
    recommendations.push('Monitor and reduce error rate');
  }

  // Load time (-15 to +5 points)
  const loadTime = metrics?.loadTime || 0;
  if (loadTime > 3000) {
    // > 3 seconds
    const impact = -15;
    score += impact;
    factors.push({
      factor: 'Load Time',
      impact,
      description: `Slow load time: ${loadTime}ms`,
    });
    recommendations.push('Optimize component loading and dependencies');
  } else if (loadTime < 500) {
    // < 500ms
    const impact = 5;
    score += impact;
    factors.push({
      factor: 'Load Time',
      impact,
      description: `Fast load time: ${loadTime}ms`,
    });
  }

  // Metadata completeness (-10 to +5 points)
  let metadataScore = 0;
  if (!route.metadata.title) metadataScore -= 3;
  if (!route.metadata.description) metadataScore -= 3;
  if (!route.metadata.tags || route.metadata.tags.length === 0)
    metadataScore -= 2;
  if (route.metadata.complexity === undefined) metadataScore -= 2;

  if (metadataScore < 0) {
    score += metadataScore;
    factors.push({
      factor: 'Metadata',
      impact: metadataScore,
      description: 'Incomplete route metadata',
    });
    recommendations.push('Complete route metadata for better discoverability');
  } else if (metadataScore === 0) {
    score += 5;
    factors.push({
      factor: 'Metadata',
      impact: 5,
      description: 'Complete route metadata',
    });
  }

  // Accessibility (-10 to 0 points)
  if (route.accessLevel === 'public' && !route.metadata.title) {
    const impact = -10;
    score += impact;
    factors.push({
      factor: 'Accessibility',
      impact,
      description: 'Public route missing accessibility title',
    });
    recommendations.push('Add title for screen reader accessibility');
  }

  // Freshness (-5 to 0 points)
  const lastAccessed = metrics?.lastAccessed;
  if (lastAccessed) {
    const daysSinceAccess =
      (Date.now() - lastAccessed.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceAccess > 90) {
      // > 3 months
      const impact = -5;
      score += impact;
      factors.push({
        factor: 'Freshness',
        impact,
        description: `Not accessed in ${Math.round(daysSinceAccess)} days`,
      });
      recommendations.push('Consider route deprecation or promotion');
    }
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    factors,
    recommendations: [...new Set(recommendations)],
  };
}

/**
 * Generate route optimization recommendations
 */
export function generateRouteOptimizationRecommendations(
  routes: RouteDefinition[],
): {
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
  const lazyLoadingOpportunities: Array<{
    routeId: string;
    reason: string;
    potentialSavings: number;
  }> = [];
  const consolidationSuggestions: Array<{
    routeIds: string[];
    reason: string;
    newPath: string;
  }> = [];
  const performanceOptimizations: Array<{
    routeId: string;
    optimization: string;
    impact: string;
  }> = [];
  const bundleSplittingAdvice: Array<{
    domain: string;
    routes: string[];
    estimatedSize: number;
  }> = [];

  // Analyze lazy loading opportunities
  routes.forEach(route => {
    if (route.loadingStrategy === 'static') {
      const bundleSize = route.dependency.bundleSize || 0;
      if (bundleSize > 50000) {
        // > 50KB
        lazyLoadingOpportunities.push({
          routeId: route.id,
          reason: `Large bundle size (${formatBytes(bundleSize)}) suitable for lazy loading`,
          potentialSavings: bundleSize,
        });
      }

      if (route.accessLevel !== 'public') {
        lazyLoadingOpportunities.push({
          routeId: route.id,
          reason: 'Protected route suitable for lazy loading',
          potentialSavings: bundleSize || 25000,
        });
      }
    }
  });

  // Analyze bundle splitting by domain
  const routesByDomain = routes.reduce(
    (acc, route) => {
      if (!acc[route.domain]) {
        acc[route.domain] = [];
      }
      acc[route.domain].push(route);
      return acc;
    },
    {} as Record<string, RouteDefinition[]>,
  );

  Object.entries(routesByDomain).forEach(([domain, domainRoutes]) => {
    const totalSize = domainRoutes.reduce(
      (sum, route) => sum + (route.dependency.bundleSize || 0),
      0,
    );

    if (totalSize > 100000 && domainRoutes.length > 3) {
      // > 100KB and multiple routes
      bundleSplittingAdvice.push({
        domain,
        routes: domainRoutes.map(r => r.id),
        estimatedSize: totalSize,
      });
    }
  });

  // Analyze consolidation opportunities
  const pathGroups = new Map<string, RouteDefinition[]>();
  routes.forEach(route => {
    const basePath = route.path.split('/').slice(0, 3).join('/');
    if (!pathGroups.has(basePath)) {
      pathGroups.set(basePath, []);
    }
    pathGroups.get(basePath)!.push(route);
  });

  pathGroups.forEach((groupRoutes, basePath) => {
    if (
      groupRoutes.length > 1 &&
      groupRoutes.every(r => !r.parameters?.length)
    ) {
      const totalBundleSize = groupRoutes.reduce(
        (sum, r) => sum + (r.dependency.bundleSize || 0),
        0,
      );
      if (totalBundleSize < 30000) {
        // Small enough to consolidate
        consolidationSuggestions.push({
          routeIds: groupRoutes.map(r => r.id),
          reason: 'Similar small routes that could be consolidated',
          newPath: `${basePath}/:section`,
        });
      }
    }
  });

  // Performance optimizations
  routes.forEach(route => {
    const bundleSize = route.dependency.bundleSize || 0;

    if (bundleSize > 200000) {
      // > 200KB
      performanceOptimizations.push({
        routeId: route.id,
        optimization: 'Implement aggressive code splitting and lazy loading',
        impact: 'High - Significant initial load time reduction',
      });
    }

    if (route.parameters && route.parameters.length > 3) {
      performanceOptimizations.push({
        routeId: route.id,
        optimization: 'Consider route parameter optimization',
        impact: 'Medium - Reduce parameter parsing overhead',
      });
    }

    if (route.childRouteIds && route.childRouteIds.length > 10) {
      performanceOptimizations.push({
        routeId: route.id,
        optimization: 'Implement route virtualization for large child sets',
        impact: 'Medium - Improve nested route performance',
      });
    }
  });

  return {
    lazyLoadingOpportunities,
    consolidationSuggestions,
    performanceOptimizations,
    bundleSplittingAdvice,
  };
}

/**
 * Format bytes for human readable output
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Generate comprehensive route validation report with new features
 */
export function generateRouteValidationReport(routes: RouteDefinition[]): {
  summary: {
    totalRoutes: number;
    validRoutes: number;
    routesWithErrors: number;
    routesWithWarnings: number;
    orphanedRoutes: number;
    averageHealthScore: number;
  };
  details: {
    errors: RouteValidationError[];
    warnings: RouteValidationWarning[];
    conflicts: RouteConflict[];
    recommendations: string[];
    optimizations: ReturnType<typeof generateRouteOptimizationRecommendations>;
  };
} {
  let validRoutes = 0;
  let routesWithErrors = 0;
  let routesWithWarnings = 0;
  const allErrors: RouteValidationError[] = [];
  const allWarnings: RouteValidationWarning[] = [];
  const recommendations: string[] = [];

  // Validate individual routes
  routes.forEach(route => {
    const paramValidation = validateRouteParameters(
      route.path,
      route.parameters || [],
    );

    if (paramValidation.errors.length > 0) {
      routesWithErrors++;
      allErrors.push(
        ...paramValidation.errors.map(e => ({ ...e, routeId: route.id })),
      );
    } else {
      validRoutes++;
    }

    if (paramValidation.warnings.length > 0) {
      routesWithWarnings++;
      allWarnings.push(
        ...paramValidation.warnings.map(w => ({ ...w, routeId: route.id })),
      );
    }
  });

  // Use advanced conflict detection
  const advancedConflicts = detectAdvancedPathConflicts(routes);

  // Check for circular dependencies
  const circularDeps = detectCircularDependencies(routes);

  // Performance and accessibility checks
  const bundleWarnings = validateBundleOptimization(routes);
  const a11yWarnings = validateAccessibilityCompliance(routes);

  allWarnings.push(...bundleWarnings, ...a11yWarnings);

  // Calculate average health score
  const healthScores = routes.map(
    route => calculateRouteHealthScore(route).score,
  );
  const averageHealthScore =
    healthScores.length > 0
      ? healthScores.reduce((sum, score) => sum + score, 0) /
        healthScores.length
      : 0;

  // Generate optimization recommendations
  const optimizations = generateRouteOptimizationRecommendations(routes);

  // Generate recommendations
  if (advancedConflicts.length > 0) {
    recommendations.push(
      'Review conflicting route paths and ensure proper specificity',
    );
  }
  if (bundleWarnings.length > 0) {
    recommendations.push(
      'Consider implementing lazy loading and code splitting for better performance',
    );
  }
  if (a11yWarnings.length > 0) {
    recommendations.push(
      'Improve accessibility by adding missing titles and descriptions',
    );
  }
  if (optimizations.lazyLoadingOpportunities.length > 0) {
    recommendations.push(
      `${optimizations.lazyLoadingOpportunities.length} routes could benefit from lazy loading`,
    );
  }

  return {
    summary: {
      totalRoutes: routes.length,
      validRoutes,
      routesWithErrors,
      routesWithWarnings,
      orphanedRoutes: 0, // Will be populated by async orphaned route detection
      averageHealthScore: Math.round(averageHealthScore),
    },
    details: {
      errors: allErrors,
      warnings: allWarnings,
      conflicts: [...advancedConflicts, ...circularDeps],
      recommendations,
      optimizations,
    },
  };
}
