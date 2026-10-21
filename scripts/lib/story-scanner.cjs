#!/usr/bin/env node

/**
 * Story Scanner Module
 * Scans Storybook story files and maps them back to their source components.
 * Part of the Component Lifecycle Intelligence System.
 */

const fs = require('fs');
const path = require('path');

class StoryScanner {
  constructor(options = {}) {
    this.srcPath = options.srcPath || path.join(__dirname, '../../src');
    this.storyPatterns = options.storyPatterns || [
      'stories/**/*.stories.ts',
      'stories/**/*.stories.tsx',
      'components/**/*.stories.ts',
      'components/**/*.stories.tsx'
    ];
  }

  /**
   * Find all story files in the project
   * @returns {Array} Array of story file paths
   */
  findStoryFiles() {
    const storyFiles = [];

    const scanDir = (dir) => {
      try {
        const items = fs.readdirSync(dir);

        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            scanDir(fullPath);
          } else if (item.match(/\.stories\.(ts|tsx)$/)) {
            storyFiles.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };

    scanDir(this.srcPath);
    return storyFiles;
  }

  /**
   * Parse a story file to extract component import information
   * @param {string} storyFilePath - Path to story file
   * @returns {Object|null} Component mapping info or null
   */
  parseStoryFile(storyFilePath) {
    try {
      const content = fs.readFileSync(storyFilePath, 'utf8');
      const relativePath = path.relative(this.srcPath, storyFilePath);

      // Extract component import
      // Pattern 1: import Component from '../../path/to/Component'
      const defaultImportMatch = content.match(
        /import\s+(\w+)\s+from\s+['"]([^'"]+\.jsx?)['"]/
      );

      // Pattern 2: import { Component } from '../../path/to/Component'
      const namedImportMatch = content.match(
        /import\s+\{\s*(\w+)\s*\}\s+from\s+['"]([^'"]+\.jsx?)['"]/
      );

      // Pattern 3: Extract from story title
      // title: 'Components/Category/ComponentName'
      const titleMatch = content.match(
        /title:\s*['"]([^'"]+)['"]/
      );

      let componentName = null;
      let componentPath = null;

      if (defaultImportMatch) {
        componentName = defaultImportMatch[1];
        componentPath = this.resolveImportPath(storyFilePath, defaultImportMatch[2]);
      } else if (namedImportMatch) {
        componentName = namedImportMatch[1];
        componentPath = this.resolveImportPath(storyFilePath, namedImportMatch[2]);
      }

      // Extract component name from title if not found via import
      if (!componentName && titleMatch) {
        const titleParts = titleMatch[1].split('/');
        componentName = titleParts[titleParts.length - 1];
      }

      if (!componentName) {
        // Fallback: derive from filename
        componentName = path.basename(storyFilePath, '.stories.ts')
          .replace('.stories', '');
      }

      return {
        storyFile: relativePath,
        storyFilePath: storyFilePath,
        componentName,
        componentPath,
        title: titleMatch ? titleMatch[1] : null,
        hasDefaultExport: content.includes('export default'),
        storyCount: (content.match(/export const \w+: Story/g) || []).length
      };
    } catch (error) {
      console.warn(`Failed to parse story: ${storyFilePath}`, error.message);
      return null;
    }
  }

  /**
   * Resolve relative import path to absolute
   * @param {string} fromFile - File containing the import
   * @param {string} importPath - Relative import path
   * @returns {string} Resolved path relative to src/
   */
  resolveImportPath(fromFile, importPath) {
    const fromDir = path.dirname(fromFile);
    const resolved = path.resolve(fromDir, importPath);

    // Return path relative to src/
    const relativeToSrc = path.relative(this.srcPath, resolved);
    return 'src/' + relativeToSrc;
  }

  /**
   * Scan all stories and build component-to-story mapping
   * @returns {Object} { storyToComponent, componentToStories, storyFiles }
   */
  scan() {
    const storyFiles = this.findStoryFiles();
    const storyToComponent = {};
    const componentToStories = {};
    const parsedStories = [];

    for (const storyFile of storyFiles) {
      const parsed = this.parseStoryFile(storyFile);

      if (parsed) {
        parsedStories.push(parsed);
        storyToComponent[parsed.storyFile] = parsed;

        // Build reverse mapping (component -> stories)
        if (parsed.componentPath) {
          if (!componentToStories[parsed.componentPath]) {
            componentToStories[parsed.componentPath] = [];
          }
          componentToStories[parsed.componentPath].push(parsed.storyFile);
        }

        // Also map by component name for looser matching
        if (parsed.componentName) {
          const key = `name:${parsed.componentName}`;
          if (!componentToStories[key]) {
            componentToStories[key] = [];
          }
          componentToStories[key].push(parsed.storyFile);
        }
      }
    }

    return {
      storyToComponent,
      componentToStories,
      storyFiles: parsedStories,
      totalStories: storyFiles.length
    };
  }

  /**
   * Get stories for a specific component
   * @param {string} componentPathOrName - Component path or name
   * @returns {Array} Story files for this component
   */
  getStoriesFor(componentPathOrName) {
    const { componentToStories } = this.scan();

    // Try exact path match first
    if (componentToStories[componentPathOrName]) {
      return componentToStories[componentPathOrName];
    }

    // Try by name
    const byName = componentToStories[`name:${componentPathOrName}`];
    if (byName) {
      return byName;
    }

    // Try partial path match
    for (const [key, stories] of Object.entries(componentToStories)) {
      if (key.includes(componentPathOrName)) {
        return stories;
      }
    }

    return [];
  }

  /**
   * Get all components that have stories
   * @returns {Array} Component paths with stories
   */
  getComponentsWithStories() {
    const { componentToStories } = this.scan();

    return Object.entries(componentToStories)
      .filter(([key]) => !key.startsWith('name:'))
      .map(([componentPath, stories]) => ({
        componentPath,
        storyCount: stories.length,
        stories
      }));
  }

  /**
   * Get components referenced in stories but file not found
   * @returns {Array} Orphaned story references
   */
  getOrphanedStories() {
    const { storyFiles } = this.scan();
    const orphaned = [];

    for (const story of storyFiles) {
      if (story.componentPath) {
        const fullPath = path.join(this.srcPath, '..', story.componentPath);
        if (!fs.existsSync(fullPath)) {
          orphaned.push(story);
        }
      }
    }

    return orphaned;
  }
}

module.exports = StoryScanner;

// CLI usage
if (require.main === module) {
  const scanner = new StoryScanner();
  const result = scanner.scan();

  console.log('=== Story Scanner Results ===\n');
  console.log(`Total story files: ${result.totalStories}`);
  console.log(`Components with stories: ${scanner.getComponentsWithStories().length}`);

  console.log('\n--- Sample Story Mappings (first 10) ---');
  result.storyFiles.slice(0, 10).forEach(s => {
    console.log(`  ${s.componentName || 'Unknown'}`);
    console.log(`    Story: ${s.storyFile}`);
    console.log(`    Component: ${s.componentPath || 'Not found'}`);
  });

  const orphaned = scanner.getOrphanedStories();
  if (orphaned.length > 0) {
    console.log(`\n--- Orphaned Stories (${orphaned.length}) ---`);
    orphaned.slice(0, 5).forEach(s => console.log(`  ${s.storyFile}`));
  }
}
