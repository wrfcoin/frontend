#!/usr/bin/env node

/**
 * WRFCoin Component Auto-Discovery and Story Generation Script
 *
 * This script automatically scans the /src/components directory tree and generates
 * Storybook story files for all React components (.jsx and .tsx files).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMPONENTS_DIR = path.join(__dirname, '../src/components');
const STORIES_DIR = path.join(__dirname, '../src/stories');
const STORIES_OUTPUT_DIR = path.join(
  __dirname,
  '../src/stories/auto-generated'
);

// Ensure output directory exists
if (!fs.existsSync(STORIES_OUTPUT_DIR)) {
  fs.mkdirSync(STORIES_OUTPUT_DIR, { recursive: true });
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
 * Analyze component props from PropTypes or TypeScript interfaces
 */
function extractComponentProps(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const props = [];

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
          props.push({
            name: propName,
            type: propType,
            required: !match.includes('.isRequired'),
          });
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
          props.push({
            name: propName,
            type: propType.trim(),
            required: !optional,
          });
        });
      }
    }

    return props;
  } catch (error) {
    console.warn(`Could not analyze props for ${filePath}:`, error.message);
    return [];
  }
}

function getStoryCategory(componentPath) {
  const relativeToComponents = path.relative(COMPONENTS_DIR, componentPath);
  const dirParts = path
    .dirname(relativeToComponents)
    .split(path.sep)
    .filter(part => part !== '.');
  return dirParts.length > 0 ? dirParts.join('/') : 'Components';
}

function collectManualStoryTitles() {
  const titles = new Set();

  function walk(dir) {
    if (!fs.existsSync(dir)) {
      return;
    }

    for (const entry of fs.readdirSync(dir)) {
      const entryPath = path.join(dir, entry);
      const stat = fs.statSync(entryPath);

      if (stat.isDirectory()) {
        walk(entryPath);
        continue;
      }

      if (!/\.stories\.(js|jsx|ts|tsx|mjs)$/.test(entryPath)) {
        continue;
      }

      if (entryPath.includes(`${path.sep}auto-generated${path.sep}`)) {
        continue;
      }

      const content = fs.readFileSync(entryPath, 'utf8');
      const titleMatch = content.match(/title:\s*['"`]([^'"`]+)['"`]/);
      if (titleMatch && titleMatch[1]) {
        titles.add(titleMatch[1].toLowerCase());
      }
    }
  }

  walk(STORIES_DIR);
  return titles;
}

/**
 * Generate story content for a component
 */
function generateStoryContent(
  componentPath,
  storyFilePath,
  componentName,
  props,
  category
) {
  const relativePath = path.relative(path.dirname(storyFilePath), componentPath);
  const normalizedPath = relativePath.replace(/\\/g, '/');
  const importPath = normalizedPath.startsWith('.')
    ? normalizedPath
    : `./${normalizedPath}`;

  // Generate args based on detected props
  const args =
    props.length > 0
      ? props
          .map(prop => {
            let defaultValue;
            switch (prop.type.toLowerCase()) {
              case 'string':
                defaultValue = `'Sample ${prop.name}'`;
                break;
              case 'number':
                defaultValue = '42';
                break;
              case 'bool':
              case 'boolean':
                defaultValue = 'false';
                break;
              case 'func':
              case 'function':
                defaultValue = '() => {}';
                break;
              case 'array':
                defaultValue = '[]';
                break;
              case 'object':
                defaultValue = '{}';
                break;
              default:
                defaultValue = `'${prop.name}'`;
            }
            return `  ${prop.name}: ${defaultValue}`;
          })
          .join(',\n')
      : '  // No props detected';

  return `import type { Meta, StoryObj } from '@storybook/react-vite';
import ${componentName} from '${importPath}';

const meta: Meta<typeof ${componentName}> = {
  title: '${category}/${componentName}',
  component: ${componentName},
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Auto-generated story for ${componentName} component from ${category}.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    // Auto-generated argTypes - customize as needed
    ${props
      .map(
        prop =>
          `${prop.name}: { 
      control: '${getControlType(prop.type)}',
      description: '${prop.name} prop${prop.required ? ' (required)' : ' (optional)'}'
    }`
      )
      .join(',\n    ')}
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
${args}
  },
};

export const Interactive: Story = {
  args: {
${args}
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    // Add interaction tests here
    console.log('${componentName} rendered successfully');
  },
};
`;
}

/**
 * Get appropriate Storybook control type for prop type
 */
function getControlType(propType) {
  switch (propType.toLowerCase()) {
    case 'string':
      return 'text';
    case 'number':
      return 'number';
    case 'bool':
    case 'boolean':
      return 'boolean';
    case 'array':
      return 'object';
    case 'object':
      return 'object';
    case 'func':
    case 'function':
      return 'action';
    default:
      return 'text';
  }
}

/**
 * Main execution function
 */
function generateAllStories() {
  console.log('🔍 Scanning for React components...');

  const componentFiles = findComponentFiles(COMPONENTS_DIR).sort();
  console.log(`📦 Found ${componentFiles.length} component files`);

  // Reset generated stories to avoid stale files from older path/category logic.
  fs.rmSync(STORIES_OUTPUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(STORIES_OUTPUT_DIR, { recursive: true });

  const seenTitles = collectManualStoryTitles();
  let generatedCount = 0;
  let skippedCount = 0;

  componentFiles.forEach(filePath => {
    try {
      const componentName = extractComponentName(filePath);
      const props = extractComponentProps(filePath);

      // Skip files that don't look like components
      if (!componentName || componentName.toLowerCase() === 'index') {
        console.log(`⏭️  Skipping ${filePath} (not a component)`);
        return;
      }

      const relativeToComponents = path.relative(COMPONENTS_DIR, filePath);
      const category = getStoryCategory(filePath);
      const title = `${category}/${componentName}`;
      const normalizedTitle = title.toLowerCase();
      const storyFileName = `${componentName}.stories.ts`;
      const storyFilePath = path.join(
        STORIES_OUTPUT_DIR,
        path.dirname(relativeToComponents),
        storyFileName
      );

      if (seenTitles.has(normalizedTitle)) {
        if (fs.existsSync(storyFilePath)) {
          fs.unlinkSync(storyFilePath);
        }
        console.log(
          `⏭️  Skipping duplicate story title '${title}' (${path.relative(process.cwd(), storyFilePath)})`
        );
        skippedCount++;
        return;
      }

      seenTitles.add(normalizedTitle);
      const storyContent = generateStoryContent(
        filePath,
        storyFilePath,
        componentName,
        props,
        category
      );

      // Ensure directory exists
      fs.mkdirSync(path.dirname(storyFilePath), { recursive: true });

      // Write story file
      fs.writeFileSync(storyFilePath, storyContent);

      console.log(
        `✅ Generated story: ${path.relative(process.cwd(), storyFilePath)}`
      );
      generatedCount++;
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  });

  console.log(`\n🎉 Successfully generated ${generatedCount} stories!`);
  console.log(`⏭️  Skipped ${skippedCount} duplicate stories`);
  console.log(
    `📁 Stories location: ${path.relative(process.cwd(), STORIES_OUTPUT_DIR)}`
  );
  console.log(`\n🚀 Run 'npm run storybook' to view your components!`);
}

// Execute if run directly
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  generateAllStories();
}

export {
  generateAllStories,
  findComponentFiles,
  extractComponentName,
};
