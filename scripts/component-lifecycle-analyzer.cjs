#!/usr/bin/env node

/**
 * Component Lifecycle Analyzer
 * Main orchestrator for the Component Lifecycle Intelligence System.
 *
 * Answers three questions about WRFCoin frontend components:
 * 1. What is used? - Components actively rendered in routes
 * 2. What is dead? - Components with zero imports, no stories, no tests
 * 3. What exists but never surfaces? - Components with stories but never shipped
 *
 * Usage:
 *   node component-lifecycle-analyzer.js              # Full analysis
 *   node component-lifecycle-analyzer.js --filter dead         # Show only dead
 *   node component-lifecycle-analyzer.js --filter forgotten-ui # Show forgotten UI
 *   node component-lifecycle-analyzer.js --json                 # JSON output only
 */

const fs = require('fs');
const path = require('path');
const RouteParser = require('./lib/route-parser.cjs');
const StoryScanner = require('./lib/story-scanner.cjs');
const E2EScanner = require('./lib/e2e-scanner.cjs');
const ReportGenerator = require('./lib/report-generator.cjs');

class ComponentLifecycleAnalyzer {
  constructor(options = {}) {
    this.srcPath = options.srcPath || path.join(__dirname, '../src');
    this.componentsPath = options.componentsPath || path.join(this.srcPath, 'components');
    this.pagesPath = options.pagesPath || path.join(this.srcPath, 'pages');

    // Initialize sub-analyzers
    this.routeParser = new RouteParser(options.appJsxPath);
    this.storyScanner = new StoryScanner({ srcPath: this.srcPath });
    this.e2eScanner = new E2EScanner({ testsPath: options.testsPath });
    this.reportGenerator = new ReportGenerator({ reportsPath: options.reportsPath });

    // Analysis results
    this.components = {};
    this.importGraph = {};
  }

  /**
   * Run full analysis pipeline
   * @returns {Object} Complete analysis results
   */
  async analyze() {
    console.log('🔍 Starting Component Lifecycle Analysis...\n');

    // Phase 1: Scan all component files
    console.log('📁 Phase 1: Scanning component files...');
    this.scanComponentFiles();
    console.log(`   Found ${Object.keys(this.components).length} components\n`);

    // Phase 2: Parse routes from App.jsx
    console.log('🛤️  Phase 2: Parsing routes from App.jsx...');
    const routeData = this.routeParser.parse();
    console.log(`   Found ${routeData.routes.length} routes\n`);

    // Phase 3: Scan stories
    console.log('📖 Phase 3: Scanning Storybook stories...');
    const storyData = this.storyScanner.scan();
    console.log(`   Found ${storyData.totalStories} story files\n`);

    // Phase 4: Scan E2E tests
    console.log('🧪 Phase 4: Scanning E2E tests...');
    const testData = this.e2eScanner.scan();
    console.log(`   Found ${testData.totalTests} test files\n`);

    // Phase 5: Build import graph
    console.log('🕸️  Phase 5: Building import graph...');
    this.buildImportGraph();
    console.log(`   Analyzed ${Object.keys(this.importGraph).length} import relationships\n`);

    // Phase 6: Cross-reference and classify
    console.log('🏷️  Phase 6: Classifying components...');
    this.crossReferenceData(routeData, storyData, testData);
    this.classifyComponents();

    // Phase 7: Generate reports
    console.log('📊 Phase 7: Generating reports...');
    const analysisData = this.buildAnalysisData(routeData, storyData, testData);
    const reportPaths = this.reportGenerator.generateAll(analysisData);

    console.log('\n✅ Analysis complete!\n');
    console.log('Generated reports:');
    for (const [name, reportPath] of Object.entries(reportPaths)) {
      console.log(`   ${name}: ${reportPath}`);
    }

    return analysisData;
  }

  /**
   * Scan component directories for all component files
   */
  scanComponentFiles() {
    const scanDir = (dir, basePath = '') => {
      try {
        const items = fs.readdirSync(dir);

        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            scanDir(fullPath, path.join(basePath, item));
          } else if (item.match(/\.(jsx|tsx)$/) && !item.includes('.stories.') && !item.includes('.test.')) {
            this.analyzeComponentFile(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };

    // Scan components directory
    if (fs.existsSync(this.componentsPath)) {
      scanDir(this.componentsPath);
    }

    // Scan pages directory
    if (fs.existsSync(this.pagesPath)) {
      scanDir(this.pagesPath);
    }
  }

  /**
   * Analyze a single component file
   * @param {string} filePath - Path to component file
   */
  analyzeComponentFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const stat = fs.statSync(filePath);
      const relativePath = path.relative(this.srcPath, filePath);

      // Extract component name from file or exports
      const componentName = this.extractComponentName(filePath, content);

      // Extract imports from this file
      const imports = this.extractImports(content);

      // Determine complexity
      const complexity = this.calculateComplexity(content);

      this.components[componentName] = {
        name: componentName,
        filePath: 'src/' + relativePath,
        fullPath: filePath,
        imports,
        importedBy: [], // Will be populated in buildImportGraph
        routes: [],
        stories: [],
        tests: [],
        complexity,
        lines: content.split('\n').length,
        lastModified: stat.mtime.toISOString(),
        hasDefaultExport: /export\s+default/.test(content),
        hasNamedExports: /export\s+(?:const|function|class)\s+\w+/.test(content),
        classification: null // Will be set in classifyComponents
      };
    } catch (error) {
      // console.warn(`Failed to analyze: ${filePath}`, error.message);
    }
  }

  /**
   * Extract component name from file path or content
   * @param {string} filePath - File path
   * @param {string} content - File content
   * @returns {string} Component name
   */
  extractComponentName(filePath, content) {
    // Try to find exported component name
    const defaultExportMatch = content.match(
      /export\s+default\s+(?:function\s+)?(\w+)/
    );
    if (defaultExportMatch) {
      return defaultExportMatch[1];
    }

    // Try to find component declaration
    const componentMatch = content.match(
      /(?:const|function)\s+(\w+)\s*[=:]\s*(?:\([^)]*\)|[^=])*=>\s*\{?|(?:const|function)\s+(\w+)\s*\(/
    );
    if (componentMatch) {
      return componentMatch[1] || componentMatch[2];
    }

    // Fall back to filename
    return path.basename(filePath, path.extname(filePath));
  }

  /**
   * Extract imports from file content (both static and dynamic/lazy imports)
   * @param {string} content - File content
   * @returns {Array} Array of import paths
   */
  extractImports(content) {
    const imports = [];

    // Match ES6 static imports: import X from './path'
    const staticImportRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;

    // Match dynamic/lazy imports: lazy(() => import('./path'))
    const lazyImportRegex = /lazy\s*\(\s*\(\)\s*=>\s*import\s*\(\s*['"]([^'"]+)['"]\s*\)\s*\)/g;

    // Match direct dynamic imports: import('./path')
    const dynamicImportRegex = /(?<!lazy\s*\(\s*\(\)\s*=>\s*)import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

    let match;

    // Extract static imports
    while ((match = staticImportRegex.exec(content)) !== null) {
      const importPath = match[1];
      if (importPath.startsWith('.')) {
        imports.push(importPath);
      }
    }

    // Extract lazy imports
    while ((match = lazyImportRegex.exec(content)) !== null) {
      const importPath = match[1];
      if (importPath.startsWith('.')) {
        imports.push(importPath);
      }
    }

    // Extract dynamic imports (without lazy wrapper)
    while ((match = dynamicImportRegex.exec(content)) !== null) {
      const importPath = match[1];
      if (importPath.startsWith('.')) {
        imports.push(importPath);
      }
    }

    // Deduplicate
    return [...new Set(imports)];
  }

  /**
   * Calculate component complexity score
   * @param {string} content - File content
   * @returns {string} Complexity level: low, medium, high
   */
  calculateComplexity(content) {
    let score = 0;

    // Lines of code
    const lines = content.split('\n').length;
    if (lines > 300) score += 3;
    else if (lines > 150) score += 2;
    else if (lines > 50) score += 1;

    // Hooks usage
    const hooks = ['useState', 'useEffect', 'useCallback', 'useMemo', 'useReducer', 'useContext'];
    hooks.forEach(hook => {
      if (content.includes(hook)) score += 1;
    });

    // JSX complexity (estimated by counting JSX elements)
    const jsxElements = (content.match(/<[A-Z][a-zA-Z]*\s/g) || []).length;
    if (jsxElements > 20) score += 2;
    else if (jsxElements > 10) score += 1;

    if (score >= 6) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }

  /**
   * Build import graph showing which components import which
   */
  buildImportGraph() {
    // For each component, resolve its imports and mark what it imports
    for (const [name, component] of Object.entries(this.components)) {
      for (const importPath of component.imports) {
        const resolvedPath = this.resolveImportPath(component.fullPath, importPath);

        // Find the component that this import refers to
        for (const [otherName, otherComponent] of Object.entries(this.components)) {
          if (this.pathsMatch(resolvedPath, otherComponent.fullPath)) {
            // otherComponent is imported by component
            if (!otherComponent.importedBy.includes(name)) {
              otherComponent.importedBy.push(name);
            }
          }
        }
      }
    }

    // Build the graph representation
    for (const [name, component] of Object.entries(this.components)) {
      this.importGraph[name] = {
        imports: component.imports,
        importedBy: component.importedBy
      };
    }
  }

  /**
   * Resolve a relative import path to absolute
   * @param {string} fromFile - File containing the import
   * @param {string} importPath - Relative import path
   * @returns {string} Resolved absolute path
   */
  resolveImportPath(fromFile, importPath) {
    const fromDir = path.dirname(fromFile);
    let resolved = path.resolve(fromDir, importPath);

    // Try different extensions if not specified
    if (!fs.existsSync(resolved)) {
      for (const ext of ['.jsx', '.tsx', '.js', '.ts', '/index.jsx', '/index.tsx', '/index.js', '/index.ts']) {
        if (fs.existsSync(resolved + ext)) {
          resolved = resolved + ext;
          break;
        }
      }
    }

    return resolved;
  }

  /**
   * Check if two paths refer to the same file
   * @param {string} path1 - First path
   * @param {string} path2 - Second path
   * @returns {boolean} True if paths match
   */
  pathsMatch(path1, path2) {
    // Normalize and compare
    const normalize = p => {
      let n = p.replace(/\\/g, '/');
      // Remove extensions for comparison
      n = n.replace(/\.(jsx?|tsx?)$/, '');
      // Remove /index suffix
      n = n.replace(/\/index$/, '');
      return n;
    };

    return normalize(path1) === normalize(path2);
  }

  /**
   * Cross-reference route, story, and test data with components
   * @param {Object} routeData - From RouteParser
   * @param {Object} storyData - From StoryScanner
   * @param {Object} testData - From E2EScanner
   */
  crossReferenceData(routeData, storyData, testData) {
    // Map routes to components
    for (const [componentName, info] of Object.entries(routeData.routeToComponent)) {
      if (this.components[componentName]) {
        this.components[componentName].routes = info.routes || [];
      } else {
        // Component in routes but not found by variable name. Split route modules
        // often alias imports, so fall back to the imported file path.
        for (const [name, component] of Object.entries(this.components)) {
          if ((info.filePath && this.pathsMatch(component.filePath, info.filePath)) ||
              name.toLowerCase() === componentName.toLowerCase() ||
              component.filePath.toLowerCase().includes(componentName.toLowerCase())) {
            component.routes = info.routes || [];
            break;
          }
        }
      }
    }

    // Map stories to components
    for (const [storyPath, storyInfo] of Object.entries(storyData.storyToComponent)) {
      const componentName = storyInfo.componentName;

      // Try exact match first
      if (this.components[componentName]) {
        this.components[componentName].stories.push(storyPath);
      } else {
        // Try case-insensitive match
        for (const [name, component] of Object.entries(this.components)) {
          if (name.toLowerCase() === componentName?.toLowerCase()) {
            component.stories.push(storyPath);
            break;
          }
        }
      }
    }

    // Map tests to components via routes
    for (const [route, tests] of Object.entries(testData.routeToTests)) {
      // Find components that have this route
      for (const [name, component] of Object.entries(this.components)) {
        if (component.routes.some(r => r === route || route.startsWith(r + '/'))) {
          component.tests = [...new Set([...component.tests, ...tests])];
        }
      }
    }
  }

  /**
   * Classify each component based on usage
   */
  classifyComponents() {
    for (const [name, component] of Object.entries(this.components)) {
      component.classification = this.classifyComponent(component);
    }
  }

  /**
   * Classify a single component
   * @param {Object} component - Component data
   * @returns {string} Classification
   */
  classifyComponent(component) {
    const hasRoutes = component.routes.length > 0;
    const hasStories = component.stories.length > 0;
    const hasTests = component.tests.length > 0;
    const isImported = component.importedBy.length > 0;

    // Classification logic (order matters)
    if (hasRoutes) {
      return 'active';
    }

    if (isImported) {
      return 'internal';
    }

    if (hasStories) {
      return 'forgotten-ui';
    }

    if (hasTests) {
      return 'test-only';
    }

    return 'dead';
  }

  /**
   * Build complete analysis data object for reports
   * @param {Object} routeData - Route parser results
   * @param {Object} storyData - Story scanner results
   * @param {Object} testData - E2E scanner results
   * @returns {Object} Complete analysis data
   */
  buildAnalysisData(routeData, storyData, testData) {
    // Calculate summary
    const summary = {
      active: 0,
      internal: 0,
      'forgotten-ui': 0,
      'test-only': 0,
      dead: 0
    };

    for (const component of Object.values(this.components)) {
      summary[component.classification]++;
    }

    return {
      metadata: {
        generatedAt: new Date().toISOString(),
        totalComponents: Object.keys(this.components).length,
        projectPath: this.srcPath
      },
      components: this.components,
      summary,
      routeMapping: routeData.routeToComponent,
      storyMapping: storyData,
      testMapping: testData,
      importGraph: this.importGraph,
      orphanedStories: storyData.storyFiles?.filter(s => {
        const componentPath = s.componentPath;
        if (!componentPath) return false;
        const fullPath = path.join(this.srcPath, '..', componentPath);
        return !fs.existsSync(fullPath);
      }) || []
    };
  }

  /**
   * Get components by classification
   * @param {string} classification - Classification to filter by
   * @returns {Array} Filtered components
   */
  getByClassification(classification) {
    return Object.entries(this.components)
      .filter(([, c]) => c.classification === classification)
      .map(([name, c]) => ({ name, ...c }));
  }

  /**
   * Print summary to console
   * @param {Object} analysisData - Analysis results
   */
  printSummary(analysisData) {
    const { summary, metadata } = analysisData;

    console.log('\n📈 Summary');
    console.log('═'.repeat(50));
    console.log(`Total components analyzed: ${metadata.totalComponents}`);
    console.log('');
    console.log('Classification breakdown:');
    console.log(`  🟢 Active (in routes):     ${summary.active}`);
    console.log(`  🔵 Internal (used by others): ${summary.internal}`);
    console.log(`  🟡 Forgotten UI (stories only): ${summary['forgotten-ui']}`);
    console.log(`  🟠 Test Only:              ${summary['test-only']}`);
    console.log(`  🔴 Dead (safe to delete):  ${summary.dead}`);
    console.log('═'.repeat(50));
  }
}

// CLI handling
async function main() {
  const args = process.argv.slice(2);
  const filter = args.includes('--filter') ? args[args.indexOf('--filter') + 1] : null;
  const jsonOnly = args.includes('--json');
  const help = args.includes('--help') || args.includes('-h');

  if (help) {
    console.log(`
Component Lifecycle Analyzer
============================

Usage:
  node component-lifecycle-analyzer.js [options]

Options:
  --filter <type>  Filter output by classification:
                   active, internal, forgotten-ui, test-only, dead
  --json           Output JSON only (no console summary)
  --help, -h       Show this help message

Examples:
  node component-lifecycle-analyzer.js                  # Full analysis
  node component-lifecycle-analyzer.js --filter dead    # Show dead components
  node component-lifecycle-analyzer.js --json           # JSON output only
`);
    process.exit(0);
  }

  const analyzer = new ComponentLifecycleAnalyzer();

  try {
    const results = await analyzer.analyze();

    if (filter) {
      const filtered = analyzer.getByClassification(filter);
      console.log(`\n${filter.toUpperCase()} Components (${filtered.length}):`);
      console.log('─'.repeat(50));
      filtered.forEach(c => {
        console.log(`  ${c.name}`);
        console.log(`    Path: ${c.filePath}`);
        if (c.routes.length > 0) console.log(`    Routes: ${c.routes.join(', ')}`);
        if (c.stories.length > 0) console.log(`    Stories: ${c.stories.length}`);
        if (c.importedBy.length > 0) console.log(`    Used by: ${c.importedBy.join(', ')}`);
        console.log('');
      });
    } else if (!jsonOnly) {
      analyzer.printSummary(results);
    }

    if (jsonOnly) {
      console.log(JSON.stringify(results.summary, null, 2));
    }
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = ComponentLifecycleAnalyzer;
