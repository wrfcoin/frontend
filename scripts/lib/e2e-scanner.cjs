#!/usr/bin/env node

/**
 * E2E Test Scanner Module
 * Scans Playwright E2E tests to extract route references and map them to components.
 * Part of the Component Lifecycle Intelligence System.
 */

const fs = require('fs');
const path = require('path');

class E2EScanner {
  constructor(options = {}) {
    this.testsPath = options.testsPath || path.join(__dirname, '../../../tests/e2e');
    this.testPatterns = options.testPatterns || ['**/*.spec.ts', '**/*.test.ts'];
  }

  /**
   * Find all E2E test files
   * @returns {Array} Array of test file paths
   */
  findTestFiles() {
    const testFiles = [];

    const scanDir = (dir) => {
      try {
        const items = fs.readdirSync(dir);

        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            scanDir(fullPath);
          } else if (item.match(/\.(spec|test)\.(ts|js)$/)) {
            testFiles.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };

    if (fs.existsSync(this.testsPath)) {
      scanDir(this.testsPath);
    }

    return testFiles;
  }

  /**
   * Parse an E2E test file to extract route references
   * @param {string} testFilePath - Path to test file
   * @returns {Object} Test file info with routes
   */
  parseTestFile(testFilePath) {
    try {
      const content = fs.readFileSync(testFilePath, 'utf8');
      const relativePath = path.relative(this.testsPath, testFilePath);

      // Extract routes from page.goto() calls
      const gotoRoutes = this.extractGotoRoutes(content);

      // Extract routes from navigation patterns
      const navRoutes = this.extractNavigationRoutes(content);

      // Extract test describe/it blocks for context
      const testBlocks = this.extractTestBlocks(content);

      // Combine all routes
      const allRoutes = [...new Set([...gotoRoutes, ...navRoutes])];

      return {
        testFile: relativePath,
        testFilePath: testFilePath,
        routes: allRoutes,
        gotoRoutes,
        navigationRoutes: navRoutes,
        testBlocks,
        testCount: testBlocks.length
      };
    } catch (error) {
      console.warn(`Failed to parse test: ${testFilePath}`, error.message);
      return null;
    }
  }

  /**
   * Extract routes from page.goto() calls
   * @param {string} content - File content
   * @returns {Array} Routes found
   */
  extractGotoRoutes(content) {
    const routes = [];

    // Pattern: page.goto('/route')
    const gotoRegex = /page\.goto\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;

    let match;
    while ((match = gotoRegex.exec(content)) !== null) {
      const route = match[1];
      // Filter out external URLs
      if (route.startsWith('/') && !route.includes('://')) {
        routes.push(route);
      }
    }

    return [...new Set(routes)];
  }

  /**
   * Extract routes from navigation-related patterns
   * @param {string} content - File content
   * @returns {Array} Routes found
   */
  extractNavigationRoutes(content) {
    const routes = [];

    // Pattern: .click() on links with href
    const clickHrefRegex = /href\s*[:=]\s*['"`]([^'"`]+)['"`]/g;

    // Pattern: navigate('/route') or router.push('/route')
    const navigateRegex = /(?:navigate|push)\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;

    // Pattern: data-testid containing route-like patterns
    const testIdRouteRegex = /data-testid\s*[:=]\s*['"`][^'"`]*-link-([^'"`]+)['"`]/g;

    let match;

    while ((match = clickHrefRegex.exec(content)) !== null) {
      const route = match[1];
      if (route.startsWith('/') && !route.includes('://')) {
        routes.push(route);
      }
    }

    while ((match = navigateRegex.exec(content)) !== null) {
      const route = match[1];
      if (route.startsWith('/') && !route.includes('://')) {
        routes.push(route);
      }
    }

    return [...new Set(routes)];
  }

  /**
   * Extract test describe/it block names
   * @param {string} content - File content
   * @returns {Array} Test block descriptions
   */
  extractTestBlocks(content) {
    const blocks = [];

    // Pattern: test('name', ...) or it('name', ...)
    const testRegex = /(?:test|it)\s*\(\s*['"`]([^'"`]+)['"`]/g;

    // Pattern: describe('name', ...)
    const describeRegex = /describe\s*\(\s*['"`]([^'"`]+)['"`]/g;

    let match;

    while ((match = describeRegex.exec(content)) !== null) {
      blocks.push({ type: 'describe', name: match[1] });
    }

    while ((match = testRegex.exec(content)) !== null) {
      blocks.push({ type: 'test', name: match[1] });
    }

    return blocks;
  }

  /**
   * Scan all E2E tests and build route-to-test mapping
   * @returns {Object} { testToRoutes, routeToTests, testFiles }
   */
  scan() {
    const testFiles = this.findTestFiles();
    const testToRoutes = {};
    const routeToTests = {};
    const parsedTests = [];

    for (const testFile of testFiles) {
      const parsed = this.parseTestFile(testFile);

      if (parsed) {
        parsedTests.push(parsed);
        testToRoutes[parsed.testFile] = parsed;

        // Build reverse mapping (route -> tests)
        for (const route of parsed.routes) {
          if (!routeToTests[route]) {
            routeToTests[route] = [];
          }
          routeToTests[route].push(parsed.testFile);
        }
      }
    }

    return {
      testToRoutes,
      routeToTests,
      testFiles: parsedTests,
      totalTests: testFiles.length
    };
  }

  /**
   * Get tests for a specific route
   * @param {string} route - Route path
   * @returns {Array} Test files covering this route
   */
  getTestsForRoute(route) {
    const { routeToTests } = this.scan();

    // Try exact match first
    if (routeToTests[route]) {
      return routeToTests[route];
    }

    // Try partial match (e.g., /governance matches /governance/proposals)
    const matches = [];
    for (const [r, tests] of Object.entries(routeToTests)) {
      if (r.startsWith(route) || route.startsWith(r)) {
        matches.push(...tests);
      }
    }

    return [...new Set(matches)];
  }

  /**
   * Get all routes that have E2E test coverage
   * @returns {Array} Routes with test coverage
   */
  getCoveredRoutes() {
    const { routeToTests } = this.scan();

    return Object.entries(routeToTests).map(([route, tests]) => ({
      route,
      testCount: tests.length,
      tests
    }));
  }

  /**
   * Get routes that are tested but may not exist in App.jsx
   * @param {Array} knownRoutes - Routes from route-parser
   * @returns {Array} Potentially invalid test routes
   */
  getOrphanedTestRoutes(knownRoutes) {
    const { routeToTests } = this.scan();
    const knownSet = new Set(knownRoutes);
    const orphaned = [];

    for (const [route] of Object.entries(routeToTests)) {
      // Check if route or a parent route is known
      let found = false;
      for (const known of knownSet) {
        if (route === known || route.startsWith(known + '/')) {
          found = true;
          break;
        }
      }

      if (!found) {
        orphaned.push(route);
      }
    }

    return orphaned;
  }
}

module.exports = E2EScanner;

// CLI usage
if (require.main === module) {
  const scanner = new E2EScanner();
  const result = scanner.scan();

  console.log('=== E2E Scanner Results ===\n');
  console.log(`Total test files: ${result.totalTests}`);
  console.log(`Covered routes: ${scanner.getCoveredRoutes().length}`);

  console.log('\n--- Routes with E2E Coverage ---');
  scanner.getCoveredRoutes().forEach(r => {
    console.log(`  ${r.route}: ${r.testCount} test(s)`);
  });

  console.log('\n--- Test Files Summary ---');
  result.testFiles.forEach(t => {
    console.log(`  ${t.testFile}`);
    console.log(`    Routes: ${t.routes.join(', ') || 'None'}`);
    console.log(`    Tests: ${t.testCount}`);
  });
}
