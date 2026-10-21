#!/usr/bin/env node

/**
 * Route Parser Module
 * Parses App.jsx to extract lazy import declarations and route-to-component mappings.
 * Part of the Component Lifecycle Intelligence System.
 */

const fs = require('fs');
const path = require('path');

class RouteParser {
  constructor(appJsxPath) {
    if (appJsxPath && typeof appJsxPath === 'object') {
      this.appJsxPath = appJsxPath.appJsxPath || path.join(__dirname, '../../src/App.jsx');
      this.routesDir = appJsxPath.routesDir || path.join(__dirname, '../../src/routes');
    } else {
      this.appJsxPath = appJsxPath || path.join(__dirname, '../../src/App.jsx');
      this.routesDir = path.join(__dirname, '../../src/routes');
    }
    this.srcPath = path.join(__dirname, '../../src');
  }

  /**
   * Parse the App.jsx file and extract all route-component mappings
   * @returns {Object} { lazyImports, directImports, routes, routeToComponent }
   */
  parse() {
    if (!fs.existsSync(this.appJsxPath)) {
      throw new Error(`App.jsx not found at: ${this.appJsxPath}`);
    }

    const routeFiles = this.getRouteFiles();
    const lazyImports = {};
    const directImports = {};
    const routes = [];

    for (const filePath of routeFiles) {
      const content = fs.readFileSync(filePath, 'utf8');
      const fileDir = path.dirname(filePath);

      const fileLazyImports = this.extractLazyImports(content, fileDir);
      const fileDirectImports = this.extractDirectImports(content, fileDir);

      Object.assign(lazyImports, fileLazyImports);
      Object.assign(directImports, fileDirectImports);
      routes.push(...this.extractRoutes(content, new Set([
        ...Object.keys(fileLazyImports),
        ...Object.keys(fileDirectImports),
      ])));
    }

    // Build route-to-component mapping
    const routeToComponent = this.buildRouteMapping(routes, { ...lazyImports, ...directImports });

    return {
      lazyImports,
      directImports,
      routes,
      routeToComponent,
      allImports: { ...lazyImports, ...directImports }
    };
  }

  /**
   * Get App.jsx plus split route modules.
   * @returns {Array<string>} Files to scan for route declarations
   */
  getRouteFiles() {
    const files = [this.appJsxPath];

    if (fs.existsSync(this.routesDir)) {
      for (const entry of fs.readdirSync(this.routesDir)) {
        if (/Routes\.(jsx?|tsx?)$/.test(entry)) {
          files.push(path.join(this.routesDir, entry));
        }
      }
    }

    return [...new Set(files)];
  }

  /**
   * Extract lazy import declarations
   * Pattern: const ComponentName = lazy(() => import('./path/to/Component'))
   * @param {string} content - File content
   * @returns {Object} Map of component name to import path
   */
  extractLazyImports(content, fromDir = path.dirname(this.appJsxPath)) {
    const imports = {};

    // Match lazy imports - handles multi-line patterns
    const lazyImportRegex = /const\s+(\w+)\s*=\s*lazy\s*\(\s*\(\)\s*=>\s*import\s*\(\s*['"]([^'"]+)['"]\s*\)\s*\)/g;

    let match;
    while ((match = lazyImportRegex.exec(content)) !== null) {
      const [, componentName, importPath] = match;
      imports[componentName] = {
        path: this.normalizePath(importPath, fromDir),
        type: 'lazy'
      };
    }

    return imports;
  }

  /**
   * Extract direct (non-lazy) import declarations for components
   * Pattern: import ComponentName from './path/to/Component'
   * @param {string} content - File content
   * @returns {Object} Map of component name to import path
   */
  extractDirectImports(content, fromDir = path.dirname(this.appJsxPath)) {
    const imports = {};

    // Match direct default imports (for components, not utilities)
    const directImportRegex = /import\s+(\w+)\s+from\s+['"](\.[^'"]+)['"]/g;

    let match;
    while ((match = directImportRegex.exec(content)) !== null) {
      const [, componentName, importPath] = match;

      // Filter to component imports (PascalCase names, from components/ or pages/)
      if (/^[A-Z]/.test(componentName) &&
          (importPath.includes('/components/') || importPath.includes('/pages/'))) {
        imports[componentName] = {
          path: this.normalizePath(importPath, fromDir),
          type: 'direct'
        };
      }
    }

    return imports;
  }

  /**
   * Extract Route elements with their path and element mappings
   * Pattern: <Route path="/some/path" element={<ComponentName />} />
   * @param {string} content - File content
   * @returns {Array} Array of route objects
   */
  extractRoutes(content, importedComponentNames = new Set()) {
    const routes = [];

    const routeRegex = /<Route\b([\s\S]*?)\/>/g;
    let match;
    while ((match = routeRegex.exec(content)) !== null) {
      const routeMarkup = match[1];
      const pathMatch = routeMarkup.match(/\bpath\s*=\s*["']([^"']+)["']/);
      if (!pathMatch) continue;

      const componentName = this.extractElementComponent(routeMarkup, importedComponentNames);
      if (!componentName) continue;

      routes.push({
        path: pathMatch[1],
        component: componentName
      });
    }

    // Deduplicate by path
    const seen = new Set();
    return routes.filter(route => {
      const key = `${route.path}:${route.component}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Extract the rendered component from a Route element.
   * Handles wrappers like element={<PageWrapper><Component /></PageWrapper>}.
   * @param {string} routeMarkup - Raw Route attributes
   * @param {Set<string>} importedComponentNames - Route-local component imports
   * @returns {string|null} Component variable name
   */
  extractElementComponent(routeMarkup, importedComponentNames = new Set()) {
    const ignored = new Set(['Navigate', 'PageWrapper', 'React', 'Fragment']);
    const jsxTags = [...routeMarkup.matchAll(/<([A-Za-z]\w*)\b/g)].map(match => match[1]);
    const importedCandidates = jsxTags.filter(name => importedComponentNames.has(name));

    if (importedCandidates.length > 0) {
      return importedCandidates[importedCandidates.length - 1];
    }

    const candidates = jsxTags.filter(name => /^[A-Z]/.test(name) && !ignored.has(name));
    return candidates[candidates.length - 1] || null;
  }

  /**
   * Build comprehensive route-to-component mapping
   * @param {Array} routes - Extracted routes
   * @param {Object} imports - All imports (lazy + direct)
   * @returns {Object} Map of component name to its routes and file path
   */
  buildRouteMapping(routes, imports) {
    const mapping = {};

    // Initialize with all imported components
    for (const [name, info] of Object.entries(imports)) {
      mapping[name] = {
        componentName: name,
        filePath: info.path,
        importType: info.type,
        routes: []
      };
    }

    // Add route information
    for (const route of routes) {
      if (mapping[route.component]) {
        mapping[route.component].routes.push(route.path);
      } else {
        // Component referenced in route but not found in imports
        mapping[route.component] = {
          componentName: route.component,
          filePath: null, // Unknown
          importType: 'unknown',
          routes: [route.path]
        };
      }
    }

    return mapping;
  }

  /**
   * Normalize import path to a consistent format
   * @param {string} importPath - Raw import path
   * @returns {string} Normalized path
   */
  normalizePath(importPath, fromDir = path.dirname(this.appJsxPath)) {
    let resolved = importPath.startsWith('.')
      ? path.resolve(fromDir, importPath)
      : path.resolve(this.srcPath, importPath);

    if (!fs.existsSync(resolved)) {
      for (const ext of ['.jsx', '.tsx', '.js', '.ts', '/index.jsx', '/index.tsx', '/index.js', '/index.ts']) {
        if (fs.existsSync(resolved + ext)) {
          resolved += ext;
          break;
        }
      }
    }

    return 'src/' + path.relative(this.srcPath, resolved).replace(/\\/g, '/');
  }

  /**
   * Get components that are actively used in routes
   * @returns {Array} Component names with routes
   */
  getActiveComponents() {
    const { routeToComponent } = this.parse();
    return Object.entries(routeToComponent)
      .filter(([, info]) => info.routes.length > 0)
      .map(([name, info]) => ({
        name,
        ...info
      }));
  }

  /**
   * Get components imported but not used in any route
   * @returns {Array} Component names without routes
   */
  getUnroutedComponents() {
    const { routeToComponent } = this.parse();
    return Object.entries(routeToComponent)
      .filter(([, info]) => info.routes.length === 0)
      .map(([name, info]) => ({
        name,
        ...info
      }));
  }
}

module.exports = RouteParser;

// CLI usage
if (require.main === module) {
  const parser = new RouteParser();
  const result = parser.parse();

  console.log('=== Route Parser Results ===\n');
  console.log(`Total lazy imports: ${Object.keys(result.lazyImports).length}`);
  console.log(`Total direct imports: ${Object.keys(result.directImports).length}`);
  console.log(`Total routes: ${result.routes.length}`);

  console.log('\n--- Active Components (with routes) ---');
  const active = parser.getActiveComponents();
  active.forEach(c => console.log(`  ${c.name}: ${c.routes.join(', ')}`));

  console.log(`\n--- Unrouted Components (${parser.getUnroutedComponents().length}) ---`);
  parser.getUnroutedComponents().slice(0, 10).forEach(c => console.log(`  ${c.name}`));
  if (parser.getUnroutedComponents().length > 10) {
    console.log(`  ... and ${parser.getUnroutedComponents().length - 10} more`);
  }
}
