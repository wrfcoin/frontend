#!/usr/bin/env node

/**
 * Report Generator Module
 * Generates JSON and Markdown reports from component lifecycle analysis.
 * Part of the Component Lifecycle Intelligence System.
 */

const fs = require('fs');
const path = require('path');

class ReportGenerator {
  constructor(options = {}) {
    this.reportsPath = options.reportsPath || path.join(__dirname, '../../reports');
  }

  /**
   * Ensure reports directory exists
   */
  ensureReportsDir() {
    if (!fs.existsSync(this.reportsPath)) {
      fs.mkdirSync(this.reportsPath, { recursive: true });
    }
  }

  /**
   * Generate the component usage graph JSON
   * @param {Object} analysisData - Complete analysis data
   * @returns {string} Path to generated file
   */
  generateUsageGraph(analysisData) {
    this.ensureReportsDir();

    const {
      components,
      summary,
      metadata,
      routeMapping,
      storyMapping,
      testMapping
    } = analysisData;

    const graph = {
      metadata: {
        generatedAt: new Date().toISOString(),
        totalComponents: metadata.totalComponents,
        analyzer: 'Component Lifecycle Intelligence System v1.0',
        projectPath: metadata.projectPath || process.cwd()
      },
      components: {},
      summary: {
        active: 0,
        internal: 0,
        forgottenUI: 0,
        testOnly: 0,
        dead: 0
      }
    };

    // Map classification to summary keys (handle hyphens to camelCase)
    const classToKey = {
      'active': 'active',
      'internal': 'internal',
      'forgotten-ui': 'forgottenUI',
      'test-only': 'testOnly',
      'dead': 'dead'
    };

    // Build component entries
    for (const [name, component] of Object.entries(components)) {
      const entry = {
        filePath: component.filePath,
        importedBy: component.importedBy || [],
        importedByCount: (component.importedBy || []).length,
        stories: component.stories || [],
        tests: component.tests || [],
        routes: component.routes || [],
        classification: component.classification,
        complexity: component.complexity || 'unknown',
        lastModified: component.lastModified
      };

      graph.components[name] = entry;

      // Update summary counts
      const summaryKey = classToKey[component.classification];
      if (summaryKey && graph.summary[summaryKey] !== undefined) {
        graph.summary[summaryKey]++;
      }
    }

    const outputPath = path.join(this.reportsPath, 'component-usage-graph.json');
    fs.writeFileSync(outputPath, JSON.stringify(graph, null, 2));

    return outputPath;
  }

  /**
   * Generate the health report Markdown
   * @param {Object} analysisData - Complete analysis data
   * @returns {string} Path to generated file
   */
  generateHealthReport(analysisData) {
    this.ensureReportsDir();

    const { components, summary, metadata } = analysisData;

    // Categorize components
    const active = [];
    const internal = [];
    const forgottenUI = [];
    const testOnly = [];
    const dead = [];

    for (const [name, component] of Object.entries(components)) {
      const entry = { name, ...component };
      switch (component.classification) {
        case 'active': active.push(entry); break;
        case 'internal': internal.push(entry); break;
        case 'forgotten-ui': forgottenUI.push(entry); break;
        case 'test-only': testOnly.push(entry); break;
        case 'dead': dead.push(entry); break;
      }
    }

    const report = `# Component Lifecycle Health Report

*Generated: ${new Date().toISOString()}*
*Analyzer: Component Lifecycle Intelligence System v1.0*

---

## Executive Summary

| Classification | Count | Percentage |
|----------------|-------|------------|
| **Active** (in routes) | ${active.length} | ${this.percentage(active.length, metadata.totalComponents)} |
| **Internal** (imported by others) | ${internal.length} | ${this.percentage(internal.length, metadata.totalComponents)} |
| **Forgotten UI** (stories but no route) | ${forgottenUI.length} | ${this.percentage(forgottenUI.length, metadata.totalComponents)} |
| **Test Only** (tests but no usage) | ${testOnly.length} | ${this.percentage(testOnly.length, metadata.totalComponents)} |
| **Dead** (no imports, stories, or tests) | ${dead.length} | ${this.percentage(dead.length, metadata.totalComponents)} |
| **Total** | ${metadata.totalComponents} | 100% |

---

## Health Score

${this.generateHealthScore(active.length, dead.length, metadata.totalComponents)}

---

## Active Components (${active.length})

Components actively rendered in application routes.

${this.generateComponentTable(active.slice(0, 50), ['name', 'routes', 'stories'])}

${active.length > 50 ? `*...and ${active.length - 50} more active components*` : ''}

---

## Internal Components (${internal.length})

Components imported by others but not directly routed. These are building blocks.

${this.generateComponentTable(internal.slice(0, 30), ['name', 'importedByCount', 'stories'])}

${internal.length > 30 ? `*...and ${internal.length - 30} more internal components*` : ''}

---

## Forgotten UI (${forgottenUI.length})

⚠️ **Action Required**: These components have Storybook stories but are never shipped to users.

**Options:**
1. Ship them by adding routes
2. Delete them if no longer needed
3. Keep as internal components if used by others

${this.generateComponentTable(forgottenUI, ['name', 'filePath', 'stories'])}

---

## Test-Only Components (${testOnly.length})

Components that only appear in tests. May be test utilities or orphaned.

${this.generateComponentTable(testOnly, ['name', 'filePath', 'tests'])}

---

## Dead Components (${dead.length})

🗑️ **Safe to Delete**: These components have zero imports, no stories, and no tests.

${this.generateComponentTable(dead, ['name', 'filePath', 'lastModified'])}

---

## Cross-Reference Matrix

### Routes Without E2E Tests

${this.generateUncoveredRoutes(analysisData)}

### Stories Without Components

${this.generateOrphanedStories(analysisData)}

---

## Recommended Actions

### Immediate (High Priority)

1. **Review ${dead.length} dead components** for deletion
   - Run \`npm run analyze:dead\` to see the full list
   - Verify no dynamic imports before deleting

2. **Decide fate of ${forgottenUI.length} forgotten UI components**
   - Either ship them or remove them
   - Run \`npm run analyze:forgotten\` to see details

### Short-term (Medium Priority)

3. **Add E2E test coverage** for uncovered active routes
4. **Document internal components** heavily used by others

### Long-term (Low Priority)

5. **Set up CI integration** to track health metrics over time
6. **Create component governance policy** for new components

---

## Methodology

### Classification Rules

| Classification | importedBy | stories | tests | routes |
|----------------|------------|---------|-------|--------|
| **Active** | any | any | any | > 0 |
| **Internal** | > 0 | any | any | 0 |
| **Forgotten UI** | 0 | > 0 | any | 0 |
| **Test Only** | 0 | 0 | > 0 | 0 |
| **Dead** | 0 | 0 | 0 | 0 |

### Data Sources

- **Routes**: Extracted from \`App.jsx\` lazy imports and Route elements
- **Stories**: Scanned from \`src/stories/**/*.stories.ts\`
- **Tests**: Scanned from \`tests/e2e/**/*.spec.ts\`
- **Imports**: Analyzed via static analysis of component files

---

*Report generated by WRFCoin Component Lifecycle Intelligence System*
`;

    const outputPath = path.join(this.reportsPath, 'component-health-report.md');
    fs.writeFileSync(outputPath, report);

    return outputPath;
  }

  /**
   * Generate cross-reference matrix JSON
   * @param {Object} analysisData - Complete analysis data
   * @returns {string} Path to generated file
   */
  generateCrossReferenceMatrix(analysisData) {
    this.ensureReportsDir();

    const { components, routeMapping, storyMapping, testMapping } = analysisData;

    const matrix = {
      metadata: {
        generatedAt: new Date().toISOString()
      },
      componentToRoutes: {},
      componentToStories: {},
      componentToTests: {},
      routeToComponent: routeMapping || {},
      routeToTests: testMapping?.routeToTests || {},
      storyToComponent: storyMapping?.storyToComponent || {}
    };

    // Build component-centric views
    for (const [name, component] of Object.entries(components)) {
      matrix.componentToRoutes[name] = component.routes || [];
      matrix.componentToStories[name] = component.stories || [];
      matrix.componentToTests[name] = component.tests || [];
    }

    const outputPath = path.join(this.reportsPath, 'cross-reference-matrix.json');
    fs.writeFileSync(outputPath, JSON.stringify(matrix, null, 2));

    return outputPath;
  }

  /**
   * Calculate percentage string
   */
  percentage(count, total) {
    if (total === 0) return '0%';
    return `${Math.round((count / total) * 100)}%`;
  }

  /**
   * Generate health score visualization
   */
  generateHealthScore(active, dead, total) {
    const healthyPercent = total > 0 ? Math.round(((total - dead) / total) * 100) : 0;
    const activePercent = total > 0 ? Math.round((active / total) * 100) : 0;

    let grade, color, emoji;
    if (healthyPercent >= 90 && activePercent >= 30) {
      grade = 'A'; color = '🟢'; emoji = '🎉';
    } else if (healthyPercent >= 80 && activePercent >= 25) {
      grade = 'B'; color = '🟢'; emoji = '👍';
    } else if (healthyPercent >= 70 && activePercent >= 20) {
      grade = 'C'; color = '🟡'; emoji = '⚠️';
    } else if (healthyPercent >= 60) {
      grade = 'D'; color = '🟠'; emoji = '⚠️';
    } else {
      grade = 'F'; color = '🔴'; emoji = '🚨';
    }

    return `
${color} **Grade: ${grade}** ${emoji}

- **Health Score**: ${healthyPercent}% (components that are not dead)
- **Active Usage**: ${activePercent}% (components in routes)
- **Dead Weight**: ${100 - healthyPercent}% (unused components)

${healthyPercent < 80 ? `
> **Recommendation**: Consider cleaning up dead components to improve maintainability.
` : ''}
`;
  }

  /**
   * Generate markdown table for components
   */
  generateComponentTable(components, columns) {
    if (components.length === 0) {
      return '*No components in this category*\n';
    }

    const headers = {
      name: 'Component',
      filePath: 'Path',
      routes: 'Routes',
      stories: 'Stories',
      tests: 'Tests',
      importedByCount: 'Used By',
      lastModified: 'Last Modified'
    };

    const headerRow = columns.map(col => headers[col] || col).join(' | ');
    const separator = columns.map(() => '---').join(' | ');

    const rows = components.map(comp => {
      return columns.map(col => {
        const value = comp[col];
        if (Array.isArray(value)) {
          return value.length > 0 ? value.slice(0, 3).join(', ') + (value.length > 3 ? '...' : '') : '-';
        }
        if (col === 'lastModified' && value) {
          return new Date(value).toLocaleDateString();
        }
        return value || '-';
      }).join(' | ');
    });

    return `| ${headerRow} |\n| ${separator} |\n${rows.map(r => `| ${r} |`).join('\n')}\n`;
  }

  /**
   * Generate list of routes without E2E tests
   */
  generateUncoveredRoutes(analysisData) {
    const { routeMapping, testMapping } = analysisData;
    const testedRoutes = new Set(Object.keys(testMapping?.routeToTests || {}));

    const uncovered = Object.entries(routeMapping || {})
      .filter(([, info]) => info.routes && info.routes.length > 0)
      .flatMap(([, info]) => info.routes)
      .filter(route => !testedRoutes.has(route));

    if (uncovered.length === 0) {
      return '*All active routes have E2E test coverage* ✅\n';
    }

    return uncovered.slice(0, 20).map(r => `- \`${r}\``).join('\n') +
      (uncovered.length > 20 ? `\n*...and ${uncovered.length - 20} more*` : '');
  }

  /**
   * Generate list of orphaned stories
   */
  generateOrphanedStories(analysisData) {
    const { orphanedStories } = analysisData;

    if (!orphanedStories || orphanedStories.length === 0) {
      return '*No orphaned stories found* ✅\n';
    }

    return orphanedStories.slice(0, 10).map(s => `- \`${s.storyFile}\``).join('\n') +
      (orphanedStories.length > 10 ? `\n*...and ${orphanedStories.length - 10} more*` : '');
  }

  /**
   * Generate all reports
   * @param {Object} analysisData - Complete analysis data
   * @returns {Object} Paths to all generated files
   */
  generateAll(analysisData) {
    return {
      usageGraph: this.generateUsageGraph(analysisData),
      healthReport: this.generateHealthReport(analysisData),
      crossReference: this.generateCrossReferenceMatrix(analysisData)
    };
  }
}

module.exports = ReportGenerator;

// CLI usage
if (require.main === module) {
  console.log('Report Generator - requires analysis data input');
  console.log('Usage: const generator = new ReportGenerator(); generator.generateAll(data);');
}
