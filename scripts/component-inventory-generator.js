#!/usr/bin/env node

/**
 * Component Inventory Generator for WRFCoin Frontend
 * Analyzes React/TypeScript components and generates comprehensive documentation inventory
 * Part of Task 45.9 - Component Library Documentation
 */

const fs = require('fs');
const path = require('path');

class ComponentInventoryGenerator {
  constructor() {
    this.components = [];
    this.srcPath = path.join(__dirname, '../src/components');
    this.outputPath = path.join(__dirname, '../docs/component-inventory.json');
  }

  /**
   * Scan directory recursively for React components
   */
  scanComponents(dir = this.srcPath, category = '') {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        const subCategory = category ? `${category}/${item}` : item;
        this.scanComponents(fullPath, subCategory);
      } else if (item.match(/\.(jsx|tsx)$/)) {
        this.analyzeComponent(fullPath, category, item);
      }
    }
  }

  /**
   * Analyze individual component file
   */
  analyzeComponent(filePath, category, fileName) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(this.srcPath, filePath);

      const component = {
        name: path.basename(fileName, path.extname(fileName)),
        fileName: fileName,
        path: relativePath,
        fullPath: path.relative(path.join(this.srcPath, '../..'), filePath),
        category: category || 'Root',
        type: fileName.endsWith('.tsx') ? 'TypeScript' : 'JavaScript',
        size: content.length,
        lines: content.split('\n').length,
        ...this.extractComponentInfo(content),
      };

      this.components.push(component);
    } catch (error) {
      console.warn(`Failed to analyze ${filePath}:`, error.message);
    }
  }

  /**
   * Extract component information from source code
   */
  extractComponentInfo(content) {
    const info = {
      hasProps: false,
      propTypes: [],
      hasState: false,
      hasHooks: false,
      imports: [],
      exports: [],
      hasTests: false,
      hasStories: false,
      documentation: {
        hasJSDoc: false,
        description: '',
        examples: [],
      },
      complexity: 'low',
      dependencies: [],
    };

    // Extract imports
    const importMatches = content.match(/import\s+.*?from\s+['"]([^'"]+)['"]/g);
    if (importMatches) {
      info.imports = importMatches
        .map(imp => {
          const match = imp.match(/from\s+['"]([^'"]+)['"]/);
          return match ? match[1] : '';
        })
        .filter(Boolean);
    }

    // Check for props
    if (content.includes('props') || content.match(/\{\s*[^}]*\s*\}/)) {
      info.hasProps = true;
      // Extract prop patterns
      const propMatches = content.match(/(\w+)\s*[:=]\s*props\.(\w+)/g);
      if (propMatches) {
        info.propTypes = [
          ...new Set(
            propMatches.map(match => {
              const propMatch = match.match(/props\.(\w+)/);
              return propMatch ? propMatch[1] : '';
            })
          ),
        ];
      }
    }

    // Check for hooks
    const hookPatterns = [
      'useState',
      'useEffect',
      'useContext',
      'useReducer',
      'useCallback',
      'useMemo',
    ];
    info.hasHooks = hookPatterns.some(hook => content.includes(hook));

    // Check for state
    info.hasState =
      content.includes('useState') || content.includes('this.state');

    // Extract JSDoc comments
    const jsDocMatches = content.match(/\/\*\*[\s\S]*?\*\//g);
    if (jsDocMatches) {
      info.documentation.hasJSDoc = true;
      info.documentation.description = jsDocMatches[0]
        .replace(/\/\*\*|\*\//g, '')
        .replace(/\s*\*\s?/g, ' ')
        .trim();
    }

    // Determine complexity based on various factors
    const complexityScore =
      info.imports.length * 2 +
      info.propTypes.length * 3 +
      (info.hasState ? 10 : 0) +
      (info.hasHooks ? 5 : 0) +
      content.split('\n').length / 10;

    if (complexityScore > 50) info.complexity = 'high';
    else if (complexityScore > 20) info.complexity = 'medium';

    // Extract dependencies (React, MUI, etc.)
    info.dependencies = info.imports.filter(
      imp =>
        imp.includes('react') ||
        imp.includes('@mui') ||
        imp.includes('antd') ||
        imp.includes('chart') ||
        imp.includes('d3')
    );

    return info;
  }

  /**
   * Generate component categories summary
   */
  generateCategorySummary() {
    const categories = {};

    this.components.forEach(comp => {
      if (!categories[comp.category]) {
        categories[comp.category] = {
          count: 0,
          types: { TypeScript: 0, JavaScript: 0 },
          complexity: { low: 0, medium: 0, high: 0 },
          totalLines: 0,
          components: [],
        };
      }

      categories[comp.category].count++;
      categories[comp.category].types[comp.type]++;
      categories[comp.category].complexity[comp.complexity]++;
      categories[comp.category].totalLines += comp.lines;
      categories[comp.category].components.push(comp.name);
    });

    return categories;
  }

  /**
   * Generate documentation priorities
   */
  generateDocumentationPriorities() {
    const priorities = {
      high: [],
      medium: [],
      low: [],
    };

    this.components.forEach(comp => {
      // High priority: Complex components without documentation
      if (comp.complexity === 'high' && !comp.documentation.hasJSDoc) {
        priorities.high.push(comp);
      }
      // Medium priority: Components with props but no documentation
      else if (comp.hasProps && !comp.documentation.hasJSDoc) {
        priorities.medium.push(comp);
      }
      // Low priority: Simple components
      else {
        priorities.low.push(comp);
      }
    });

    return priorities;
  }

  /**
   * Generate the complete inventory
   */
  generate() {
    console.log('🔍 Scanning components...');
    this.scanComponents();

    console.log(`📊 Found ${this.components.length} components`);

    const categories = this.generateCategorySummary();
    const priorities = this.generateDocumentationPriorities();

    const inventory = {
      metadata: {
        generatedAt: new Date().toISOString(),
        totalComponents: this.components.length,
        totalCategories: Object.keys(categories).length,
        scanPath: path.relative(path.join(this.srcPath, '../..'), this.srcPath),
      },
      summary: {
        byType: {
          TypeScript: this.components.filter(c => c.type === 'TypeScript')
            .length,
          JavaScript: this.components.filter(c => c.type === 'JavaScript')
            .length,
        },
        byComplexity: {
          high: this.components.filter(c => c.complexity === 'high').length,
          medium: this.components.filter(c => c.complexity === 'medium').length,
          low: this.components.filter(c => c.complexity === 'low').length,
        },
        documentation: {
          withJSDoc: this.components.filter(c => c.documentation.hasJSDoc)
            .length,
          withoutJSDoc: this.components.filter(c => !c.documentation.hasJSDoc)
            .length,
        },
      },
      categories,
      priorities,
      components: this.components.sort(
        (a, b) =>
          a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
      ),
    };

    // Write inventory to file
    const docsDir = path.dirname(this.outputPath);
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    fs.writeFileSync(this.outputPath, JSON.stringify(inventory, null, 2));

    // Generate human-readable report
    this.generateReport(inventory);

    console.log(`✅ Component inventory generated: ${this.outputPath}`);
    return inventory;
  }

  /**
   * Generate human-readable report
   */
  generateReport(inventory) {
    const reportPath = path.join(
      __dirname,
      '../docs/component-inventory-report.md'
    );

    const report = `# WRFCoin Frontend Component Inventory Report

*Generated on ${new Date().toLocaleDateString()}*

## Summary

- **Total Components**: ${inventory.metadata.totalComponents}
- **Categories**: ${inventory.metadata.totalCategories}
- **TypeScript Components**: ${inventory.summary.byType.TypeScript}
- **JavaScript Components**: ${inventory.summary.byType.JavaScript}

## Complexity Distribution

- **High Complexity**: ${inventory.summary.byComplexity.high} components
- **Medium Complexity**: ${inventory.summary.byComplexity.medium} components  
- **Low Complexity**: ${inventory.summary.byComplexity.low} components

## Documentation Status

- **With JSDoc**: ${inventory.summary.documentation.withJSDoc} components
- **Without JSDoc**: ${inventory.summary.documentation.withoutJSDoc} components
- **Documentation Coverage**: ${Math.round((inventory.summary.documentation.withJSDoc / inventory.metadata.totalComponents) * 100)}%

## Categories Overview

${Object.entries(inventory.categories)
  .map(
    ([name, data]) => `
### ${name}
- Components: ${data.count}
- TypeScript: ${data.types.TypeScript}, JavaScript: ${data.types.JavaScript}
- Total Lines: ${data.totalLines}
- Complexity: High(${data.complexity.high}), Medium(${data.complexity.medium}), Low(${data.complexity.low})
`
  )
  .join('')}

## Documentation Priorities

### High Priority (${inventory.priorities.high.length} components)
Complex components requiring immediate documentation:
${inventory.priorities.high.map(c => `- **${c.name}** (${c.category}) - ${c.lines} lines, ${c.propTypes.length} props`).join('\n')}

### Medium Priority (${inventory.priorities.medium.length} components)  
Components with props needing documentation:
${inventory.priorities.medium
  .slice(0, 20)
  .map(c => `- **${c.name}** (${c.category})`)
  .join('\n')}
${inventory.priorities.medium.length > 20 ? `\n... and ${inventory.priorities.medium.length - 20} more` : ''}

### Low Priority (${inventory.priorities.low.length} components)
Simple components for basic documentation.

## Recommended Actions

1. **Immediate**: Document the ${inventory.priorities.high.length} high-priority components
2. **Short-term**: Add JSDoc to components with props (${inventory.priorities.medium.length} components)
3. **Long-term**: Complete documentation for all ${inventory.priorities.low.length} remaining components
4. **Setup**: Configure automated story generation for components without stories

---
*This report was automatically generated by the Component Inventory Generator*
`;

    fs.writeFileSync(reportPath, report);
    console.log(`📋 Component report generated: ${reportPath}`);
  }
}

// Run the generator if called directly
if (require.main === module) {
  const generator = new ComponentInventoryGenerator();
  generator.generate();
}

module.exports = ComponentInventoryGenerator;
