#!/usr/bin/env node

/**
 * Enhanced WRFCoin Component Story Generation Script
 *
 * This enhanced script uses component templates and follows naming conventions
 * to generate high-quality Storybook stories for all React components.
 */

const fs = require('fs');
const path = require('path');

// Import template system
const {
  selectTemplate,
  COMPONENT_TEMPLATES,
} = require('./component-story-templates.js');

const COMPONENTS_DIR = path.join(__dirname, '../src/components');
const STORIES_OUTPUT_DIR = path.join(
  __dirname,
  '../src/stories/auto-generated'
);
const COMPONENT_ANALYSIS_PATH = path.join(
  __dirname,
  '../reports/component-analysis.json'
);

// Ensure output directory exists
if (!fs.existsSync(STORIES_OUTPUT_DIR)) {
  fs.mkdirSync(STORIES_OUTPUT_DIR, { recursive: true });
}

/**
 * Load component analysis data for enhanced template selection
 */
function loadComponentAnalysis() {
  try {
    if (fs.existsSync(COMPONENT_ANALYSIS_PATH)) {
      const analysisData = JSON.parse(
        fs.readFileSync(COMPONENT_ANALYSIS_PATH, 'utf8')
      );
      console.log('📊 Loaded component analysis data');
      return analysisData;
    }
  } catch (error) {
    console.warn('⚠️  Could not load component analysis data:', error.message);
  }
  return null;
}

/**
 * Recursively find all component files in the directory tree
 */
function findComponentFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules and test directories
      if (!['node_modules', '__tests__', 'test', '.git'].includes(file)) {
        findComponentFiles(filePath, fileList);
      }
    } else if (stat.isFile()) {
      // Look for React component files
      if (
        /\.(jsx|tsx)$/.test(file) &&
        !file.includes('.test.') &&
        !file.includes('.spec.')
      ) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

/**
 * Extract component name from file content
 */
function extractComponentName(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Look for export default ComponentName or export default function ComponentName
    const defaultExportMatch = content.match(
      /export\s+default\s+(?:function\s+)?(\w+)/
    );
    if (defaultExportMatch) {
      return defaultExportMatch[1];
    }

    // Look for const ComponentName = () => or function ComponentName
    const componentMatch = content.match(/(?:const|function)\s+(\w+)\s*[=\(]/);
    if (componentMatch) {
      return componentMatch[1];
    }

    // Fallback to filename
    return path.basename(filePath, path.extname(filePath));
  } catch (error) {
    console.warn(`Could not read file ${filePath}:`, error.message);
    return path.basename(filePath, path.extname(filePath));
  }
}

/**
 * Enhanced component analysis using both static analysis and existing data
 */
function analyzeComponent(filePath, componentName, analysisData) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Basic analysis
  const analysis = {
    name: componentName,
    filePath,
    type: 'functional', // default
    complexity: 1,
    exported: true,
    defaultExport: true,
    hooks: [],
    props: extractComponentProps(filePath),
    imports: extractImports(content),
    hasState: false,
    hasEffects: false,
    category: determineCategory(filePath),
  };

  // Enhanced analysis from existing data
  if (analysisData) {
    const existingAnalysis = findComponentInAnalysis(
      componentName,
      filePath,
      analysisData
    );
    if (existingAnalysis) {
      analysis.type = existingAnalysis.type;
      analysis.complexity = existingAnalysis.complexity;
      analysis.riskScore = existingAnalysis.riskScore;
      analysis.usageCount = existingAnalysis.usageCount;
    }
  }

  // Analyze code patterns
  analysis.hasState = /useState|useReducer|this\.state/.test(content);
  analysis.hasEffects = /useEffect|componentDidMount|componentDidUpdate/.test(
    content
  );
  analysis.hooks = extractHooks(content);

  // Determine component type based on patterns
  if (analysis.hasState || analysis.hasEffects || analysis.hooks.length > 0) {
    analysis.type = 'hooks';
    analysis.complexity = Math.max(analysis.complexity, 3);
  }

  return analysis;
}

/**
 * Extract component props from PropTypes or TypeScript interfaces
 */
function extractComponentProps(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const props = [];

    // Extract function parameters (simple heuristic)
    const functionParamMatch = content.match(
      /(?:function\s+\w+|const\s+\w+\s*=\s*)\s*\(\s*\{\s*([^}]+)\s*\}/
    );
    if (functionParamMatch) {
      const params = functionParamMatch[1].split(',').map(p => p.trim());
      params.forEach(param => {
        const [name, defaultValue] = param.split('=').map(p => p.trim());
        if (name && !name.includes('...')) {
          props.push({
            name: name.replace(/['"]/g, ''),
            type: inferTypeFromDefault(defaultValue),
            required: !defaultValue,
          });
        }
      });
    }

    // Extract PropTypes
    const propTypesMatch = content.match(/(\w+)\.propTypes\s*=\s*\{([^}]+)\}/s);
    if (propTypesMatch) {
      const propTypesContent = propTypesMatch[2];
      const propMatches = propTypesContent.match(/(\w+):\s*PropTypes\.(\w+)/g);
      if (propMatches) {
        propMatches.forEach(match => {
          const [, propName, propType] = match.match(
            /(\w+):\s*PropTypes\.(\w+)/
          );
          const existing = props.find(p => p.name === propName);
          if (existing) {
            existing.type = propType;
          } else {
            props.push({
              name: propName,
              type: propType,
              required: !match.includes('.isRequired'),
            });
          }
        });
      }
    }

    // Extract TypeScript interface props
    const interfaceMatch = content.match(/interface\s+\w*Props\s*\{([^}]+)\}/s);
    if (interfaceMatch) {
      const interfaceContent = interfaceMatch[1];
      const propMatches = interfaceContent.match(
        /(\w+)(\?)?\s*:\s*([^;,\n]+)/g
      );
      if (propMatches) {
        propMatches.forEach(match => {
          const [, propName, optional, propType] = match.match(
            /(\w+)(\?)?\s*:\s*([^;,\n]+)/
          );
          const existing = props.find(p => p.name === propName);
          if (existing) {
            existing.type = propType.trim();
          } else {
            props.push({
              name: propName,
              type: propType.trim(),
              required: !optional,
            });
          }
        });
      }
    }

    return props;
  } catch (error) {
    console.warn(`Could not analyze props for ${filePath}:`, error.message);
    return [];
  }
}

/**
 * Extract imports to understand component dependencies
 */
function extractImports(content) {
  const imports = [];
  const importMatches = content.match(/import\s+.*?\s+from\s+['"][^'"]+['"]/g);
  if (importMatches) {
    importMatches.forEach(match => {
      const fromMatch = match.match(/from\s+['"]([^'"]+)['"]/);
      if (fromMatch) {
        imports.push(fromMatch[1]);
      }
    });
  }
  return imports;
}

/**
 * Extract React hooks usage
 */
function extractHooks(content) {
  const hooks = [];
  const hookMatches = content.match(/use[A-Z]\w*/g);
  if (hookMatches) {
    hooks.push(...new Set(hookMatches));
  }
  return hooks;
}

/**
 * Determine component category from file path
 */
function determineCategory(filePath) {
  const relativePath = path.relative(COMPONENTS_DIR, filePath);
  const pathParts = relativePath.split(path.sep);

  // Use first directory as category
  if (pathParts.length > 1) {
    return pathParts[0];
  }

  return 'Components';
}

/**
 * Find component in existing analysis data
 */
function findComponentInAnalysis(componentName, filePath, analysisData) {
  if (!analysisData || !analysisData.classifications) return null;

  const allComponents = [
    ...(analysisData.classifications.dead || []),
    ...(analysisData.classifications.orphaned || []),
    ...(analysisData.classifications.suspicious || []),
  ];

  return allComponents.find(
    comp => comp.name === componentName || comp.filePath === filePath
  );
}

/**
 * Infer prop type from default value
 */
function inferTypeFromDefault(defaultValue) {
  if (!defaultValue) return 'string';

  if (defaultValue === 'true' || defaultValue === 'false') return 'boolean';
  if (/^\d+$/.test(defaultValue)) return 'number';
  if (defaultValue.startsWith("'") || defaultValue.startsWith('"'))
    return 'string';
  if (defaultValue.startsWith('[')) return 'array';
  if (defaultValue.startsWith('{')) return 'object';
  if (defaultValue.includes('=>') || defaultValue.includes('function'))
    return 'function';

  return 'string';
}

/**
 * Generate story content using templates
 */
function generateStoryContent(componentAnalysis) {
  const { name: componentName, filePath, props, category } = componentAnalysis;

  // Select appropriate template
  const template = selectTemplate(componentAnalysis);

  // Calculate relative import path
  const relativePath = path.relative(STORIES_OUTPUT_DIR, filePath);
  const importPath = relativePath.replace(/\\/g, '/');

  // Generate template-specific content
  return template.template(importPath, componentName, props, category);
}

/**
 * Generate story file path following naming conventions
 */
function generateStoryFilePath(componentAnalysis) {
  const { name: componentName, filePath, category } = componentAnalysis;

  // Follow naming conventions: maintain directory structure
  const relativeToComponents = path.relative(COMPONENTS_DIR, filePath);
  const storyFileName = `${componentName}.stories.ts`;

  // Create nested directory structure for better organization
  const storyDir = path.join(
    STORIES_OUTPUT_DIR,
    path.dirname(relativeToComponents)
  );
  const storyFilePath = path.join(storyDir, storyFileName);

  return storyFilePath;
}

/**
 * Check if component should be skipped
 */
function shouldSkipComponent(componentAnalysis, analysisData) {
  const { name: componentName, filePath } = componentAnalysis;

  // Skip files that don't look like components
  if (!componentName || componentName.toLowerCase() === 'index') {
    return { skip: true, reason: 'not a component' };
  }

  // Skip test files
  if (filePath.includes('.test.') || filePath.includes('.spec.')) {
    return { skip: true, reason: 'test file' };
  }

  // Check if it's a dead component (optional skip)
  if (analysisData && analysisData.classifications.dead) {
    const isDead = analysisData.classifications.dead.some(
      comp => comp.name === componentName && comp.usageCount === 0
    );
    if (isDead) {
      console.log(`⚠️  Warning: ${componentName} appears to be unused`);
    }
  }

  return { skip: false };
}

/**
 * Main execution function
 */
function generateAllStories() {
  console.log('🔍 Enhanced Component Story Generation Starting...');

  // Load component analysis data
  const analysisData = loadComponentAnalysis();

  console.log('📦 Scanning for React components...');
  const componentFiles = findComponentFiles(COMPONENTS_DIR);
  console.log(`📦 Found ${componentFiles.length} component files`);

  let generatedCount = 0;
  let skippedCount = 0;
  const results = {
    generated: [],
    skipped: [],
    errors: [],
  };

  componentFiles.forEach(filePath => {
    try {
      const componentName = extractComponentName(filePath);
      const componentAnalysis = analyzeComponent(
        filePath,
        componentName,
        analysisData
      );

      // Check if component should be skipped
      const skipCheck = shouldSkipComponent(componentAnalysis, analysisData);
      if (skipCheck.skip) {
        console.log(`⏭️  Skipping ${filePath} (${skipCheck.reason})`);
        results.skipped.push({ filePath, reason: skipCheck.reason });
        skippedCount++;
        return;
      }

      // Generate story content using templates
      const storyContent = generateStoryContent(componentAnalysis);

      // Generate story file path
      const storyFilePath = generateStoryFilePath(componentAnalysis);

      // Ensure directory exists
      fs.mkdirSync(path.dirname(storyFilePath), { recursive: true });

      // Write story file
      fs.writeFileSync(storyFilePath, storyContent);

      const relativeStoryPath = path.relative(process.cwd(), storyFilePath);
      console.log(
        `✅ Generated ${componentAnalysis.type} story: ${relativeStoryPath}`
      );

      results.generated.push({
        component: componentName,
        type: componentAnalysis.type,
        complexity: componentAnalysis.complexity,
        category: componentAnalysis.category,
        storyPath: relativeStoryPath,
      });

      generatedCount++;
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
      results.errors.push({ filePath, error: error.message });
    }
  });

  // Generate summary report
  generateSummaryReport(results, analysisData);

  console.log(`\n🎉 Story Generation Complete!`);
  console.log(`📊 Generated: ${generatedCount} stories`);
  console.log(`⏭️  Skipped: ${skippedCount} files`);
  console.log(`❌ Errors: ${results.errors.length} files`);
  console.log(
    `📁 Stories location: ${path.relative(process.cwd(), STORIES_OUTPUT_DIR)}`
  );
  console.log(`\n🚀 Run 'npm run storybook' to view your components!`);
}

/**
 * Generate summary report
 */
function generateSummaryReport(results, analysisData) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalGenerated: results.generated.length,
      totalSkipped: results.skipped.length,
      totalErrors: results.errors.length,
    },
    byType: {},
    byCategory: {},
    byComplexity: {},
    results,
  };

  // Analyze results by type
  results.generated.forEach(item => {
    report.byType[item.type] = (report.byType[item.type] || 0) + 1;
    report.byCategory[item.category] =
      (report.byCategory[item.category] || 0) + 1;
    report.byComplexity[item.complexity] =
      (report.byComplexity[item.complexity] || 0) + 1;
  });

  // Save report
  const reportPath = path.join(
    __dirname,
    '../reports/story-generation-report.json'
  );
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`📋 Report saved: ${path.relative(process.cwd(), reportPath)}`);
}

// Execute if run directly
if (require.main === module) {
  generateAllStories();
}

module.exports = {
  generateAllStories,
  findComponentFiles,
  extractComponentName,
  analyzeComponent,
  generateStoryContent,
};
