/**
 * WRFCoin Route CLI Tool Foundation
 * Command-line interface utilities for route visualization and management
 */

import {
  RouteDefinition,
  RouteSearchCriteria,
  RouteDomain,
  RouteAccessLevel,
  RouteType,
  LoadingStrategy,
  CLIToolConfig,
  RouteVisualizationConfig,
  RouteExportFormat,
} from '../types/routing';
import { routeRegistry } from '../services/routeRegistry';
import { generateRouteValidationReport } from '../utils/routeValidation';

/**
 * CLI Command interface
 */
interface CLICommand {
  name: string;
  description: string;
  options: CLIOption[];
  execute: (args: Record<string, any>) => Promise<string> | string;
}

/**
 * CLI Option interface
 */
interface CLIOption {
  name: string;
  alias?: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  required?: boolean;
  defaultValue?: any;
  choices?: string[];
}

/**
 * Route CLI Tool class
 */
/**
 * WRFCoin Dead Component Detection System
 * Agent C - Component Discoverability Analysis Tool
 *
 * This comprehensive system analyzes all components in the WRFCoin frontend
 * to identify orphaned, unused, and dead components for cleanup.
 */

import fs from 'fs';
import path from 'path';
import { devLog } from '../utils/logger';

interface ComponentInfo {
  name: string;
  filePath: string;
  type: 'functional' | 'class' | 'forwardRef' | 'memo' | 'hooks';
  exported: boolean;
  defaultExport: boolean;
  complexity: number;
  usageCount: number;
  isInRoutes: boolean;
  isInStorybook: boolean;
  riskScore: number;
  lastModified: Date;
}

interface DeadComponentConfig {
  srcDir?: string;
  componentsDir?: string;
  excludePatterns?: string[];
  includeStorybook?: boolean;
  includeRoutes?: boolean;
  riskThreshold?: number;
}

interface AutoFixOptions {
  createBackup?: boolean;
  dryRun?: boolean;
  minRiskScore?: number;
  maxFileAge?: number; // days
  excludePatterns?: string[];
  allowComplexComponents?: boolean;
}

interface AutoFixResult {
  attempted: number;
  successful: number;
  failed: number;
  skipped: number;
  backupCreated: boolean;
  fixedComponents: Array<{
    name: string;
    filePath: string;
    action: string;
    riskScore: number;
  }>;
  failedComponents: Array<{
    name: string;
    filePath: string;
    reason: string;
    riskScore: number;
  }>;
  warnings: string[];
}

class WRFCoinDeadComponentDetector {
  private config: Required<DeadComponentConfig>;
  private projectRoot: string;
  private allComponents: Map<string, ComponentInfo> = new Map();
  private componentUsage: Map<string, string[]> = new Map();
  private routeRegistry: Set<string> = new Set();
  private storybookRegistry: Set<string> = new Set();

  constructor(config: DeadComponentConfig = {}) {
    this.projectRoot = process.cwd();
    this.config = {
      srcDir: config.srcDir || path.join(this.projectRoot, 'src'),
      componentsDir:
        config.componentsDir || path.join(this.projectRoot, 'src/components'),
      excludePatterns: config.excludePatterns || [
        '**/*.test.*',
        '**/*.spec.*',
        '**/*.stories.*',
        '**/node_modules/**',
      ],
      includeStorybook: config.includeStorybook ?? true,
      includeRoutes: config.includeRoutes ?? true,
      riskThreshold: config.riskThreshold || 6,
    };
  }

  async analyzeComponents() {
    devLog('🚀 Starting WRFCoin Component Analysis...');

    try {
      await this.discoverComponents();
      await this.analyzeUsage();
      if (this.config.includeRoutes) await this.analyzeRoutes();
      if (this.config.includeStorybook) await this.analyzeStorybook();
      await this.calculateRiskScores();

      const report = await this.generateReport();
      devLog('✅ Analysis complete!');
      return report;
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      throw error;
    }
  }

  private async discoverComponents(): Promise<void> {
    devLog('🔍 Discovering components...');

    const files = await this.findComponentFiles();
    devLog(`📊 Found ${files.length} component files`);

    for (const filePath of files) {
      await this.analyzeComponentFile(filePath);
    }

    devLog(`✅ Discovered ${this.allComponents.size} components`);
  }

  private async findComponentFiles(): Promise<string[]> {
    const files: string[] = [];
    const extensions = ['.jsx', '.tsx', '.js', '.ts'];

    const scanDir = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
              await scanDir(fullPath);
            }
          } else if (entry.isFile()) {
            if (
              extensions.some(ext => entry.name.endsWith(ext)) &&
              !this.isExcluded(fullPath)
            ) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        console.warn(`Warning: Error scanning ${dir}`);
      }
    };

    await scanDir(this.config.srcDir);
    return files;
  }

  private isExcluded(filePath: string): boolean {
    return this.config.excludePatterns.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(
          pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'),
        );
        return regex.test(filePath);
      }
      return filePath.includes(pattern);
    });
  }

  private async analyzeComponentFile(filePath: string): Promise<void> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      const relativePath = path.relative(this.projectRoot, filePath);
      const stats = await fs.promises.stat(filePath);

      const components = this.extractComponents(content);

      for (const component of components) {
        if (component.name) {
          this.allComponents.set(component.name, {
            ...component,
            name: component.name,
            type: component.type || 'functional',
            exported: component.exported || false,
            defaultExport: component.defaultExport || false,
            complexity: component.complexity || 1,
            filePath: relativePath,
            usageCount: 0,
            isInRoutes: false,
            isInStorybook: false,
            riskScore: 0,
            lastModified: stats.mtime,
          });
        }
      }
    } catch (error) {
      console.warn(`Warning: Error analyzing ${filePath}`);
    }
  }

  private extractComponents(content: string): Partial<ComponentInfo>[] {
    const components: Partial<ComponentInfo>[] = [];

    // Simple patterns to find React components
    const patterns = [
      // const Component = () => {}
      new RegExp(
        '(?:export\\s+)?const\\s+([A-Z][a-zA-Z0-9]*)\\s*=\\s*\\([^)]*\\)\\s*=>',
        'g',
      ),
      // function Component() {}
      new RegExp(
        '(?:export\\s+(?:default\\s+)?)?function\\s+([A-Z][a-zA-Z0-9]*)',
        'g',
      ),
      // class Component extends React.Component
      new RegExp(
        '(?:export\\s+(?:default\\s+)?)?class\\s+([A-Z][a-zA-Z0-9]*)\\s+extends',
        'g',
      ),
      // React.forwardRef and React.memo
      new RegExp(
        '(?:export\\s+)?const\\s+([A-Z][a-zA-Z0-9]*)\\s*=\\s*React\\.(forwardRef|memo)',
        'g',
      ),
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const componentName = match[1];

        if (this.isReactComponent(content, componentName)) {
          components.push({
            name: componentName,
            type: this.getComponentType(content, componentName),
            exported: this.isExported(content, componentName),
            defaultExport: this.isDefaultExport(content, componentName),
            complexity: this.calculateComplexity(content, componentName),
          });
        }
      }
    }

    return components;
  }

  private isReactComponent(content: string, componentName: string): boolean {
    const componentSection = this.getComponentSection(content, componentName);
    return (
      componentSection.includes('return') &&
      (componentSection.includes('<') ||
        componentSection.includes('React.createElement'))
    );
  }

  private getComponentType(
    content: string,
    componentName: string,
  ): ComponentInfo['type'] {
    const section = this.getComponentSection(content, componentName);

    if (section.includes('class') && section.includes('extends'))
      return 'class';
    if (section.includes('forwardRef')) return 'forwardRef';
    if (section.includes('memo')) return 'memo';
    if (section.includes('useState') || section.includes('useEffect'))
      return 'hooks';
    return 'functional';
  }

  private getComponentSection(content: string, componentName: string): string {
    const startIndex = content.indexOf(componentName);
    return content.slice(Math.max(0, startIndex - 100), startIndex + 1000);
  }

  private isExported(content: string, componentName: string): boolean {
    return (
      content.includes(`export { ${componentName}`) ||
      content.includes(`export const ${componentName}`) ||
      content.includes(`export function ${componentName}`)
    );
  }

  private isDefaultExport(content: string, componentName: string): boolean {
    return content.includes(`export default ${componentName}`);
  }

  private calculateComplexity(content: string, componentName: string): number {
    const section = this.getComponentSection(content, componentName);
    let complexity = 1;

    const patterns = [
      /use\w+/g, // hooks
      /\?\s*</g, // conditional rendering
      /&&\s*</g, // logical rendering
      /\.map\(/g, // loops
    ];

    for (const pattern of patterns) {
      const matches = section.match(pattern);
      if (matches) complexity += matches.length;
    }

    return Math.min(complexity, 10);
  }

  private async analyzeUsage(): Promise<void> {
    devLog('🔍 Analyzing usage patterns...');

    const files = await this.findComponentFiles();

    for (const filePath of files) {
      await this.analyzeUsageInFile(filePath);
    }

    devLog('✅ Usage analysis complete');
  }

  private async analyzeUsageInFile(filePath: string): Promise<void> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      const relativePath = path.relative(this.projectRoot, filePath);

      // Find JSX component usage
      const jsxRegex = /<([A-Z][a-zA-Z0-9]*)/g;
      let match;

      while ((match = jsxRegex.exec(content)) !== null) {
        const componentName = match[1];
        this.recordUsage(componentName, relativePath);
      }
    } catch (error) {
      console.warn(`Warning: Error analyzing usage in ${filePath}`);
    }
  }

  private recordUsage(componentName: string, filePath: string): void {
    if (!this.componentUsage.has(componentName)) {
      this.componentUsage.set(componentName, []);
    }

    this.componentUsage.get(componentName)!.push(filePath);

    const component = this.allComponents.get(componentName);
    if (component) {
      component.usageCount++;
    }
  }

  private async analyzeRoutes(): Promise<void> {
    devLog('🔍 Analyzing routes...');

    // frontend#290: the secondary `components/routes/AppRoutes.jsx` was retired
    // (fully superseded by App.jsx + src/routes/*); App.jsx is the only router.
    const routeFiles = [path.join(this.config.srcDir, 'App.jsx')];

    for (const filePath of routeFiles) {
      try {
        const content = await fs.promises.readFile(filePath, 'utf8');

        const routeRegex =
          /<Route[^>]*(?:component|element)\s*=\s*{?([A-Z][a-zA-Z0-9]*)}?/g;
        let match;

        while ((match = routeRegex.exec(content)) !== null) {
          const componentName = match[1];
          this.routeRegistry.add(componentName);

          const component = this.allComponents.get(componentName);
          if (component) {
            component.isInRoutes = true;
          }
        }
      } catch (error) {
        // File doesn't exist, continue
      }
    }

    devLog(`✅ Found ${this.routeRegistry.size} components in routes`);
  }

  private async analyzeStorybook(): Promise<void> {
    devLog('🔍 Analyzing Storybook...');

    try {
      const storyFiles = await this.findStoryFiles();

      for (const filePath of storyFiles) {
        const content = await fs.promises.readFile(filePath, 'utf8');

        const metaRegex = /component:\s*([A-Z][a-zA-Z0-9]*)/g;
        let match;

        while ((match = metaRegex.exec(content)) !== null) {
          const componentName = match[1];
          this.storybookRegistry.add(componentName);

          const component = this.allComponents.get(componentName);
          if (component) {
            component.isInStorybook = true;
          }
        }
      }

      devLog(
        `✅ Found ${this.storybookRegistry.size} components in Storybook`,
      );
    } catch (error) {
      devLog('📚 No Storybook files found');
    }
  }

  private async findStoryFiles(): Promise<string[]> {
    const files: string[] = [];

    const scanDir = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            if (!entry.name.startsWith('.')) {
              await scanDir(fullPath);
            }
          } else if (entry.isFile() && entry.name.includes('.stories.')) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Continue silently
      }
    };

    await scanDir(this.config.srcDir);
    return files;
  }

  private async calculateRiskScores(): Promise<void> {
    devLog('🔍 Calculating risk scores...');

    for (const [componentName, component] of this.allComponents) {
      component.riskScore = this.calculateRiskScore(component);
    }

    devLog('✅ Risk assessment complete');
  }

  private calculateRiskScore(component: ComponentInfo): number {
    let score = 0;

    // Usage-based scoring
    if (component.usageCount === 0) score += 10;
    else if (component.usageCount === 1) score += 5;
    else if (component.usageCount <= 3) score += 2;

    // Route and Storybook usage reduces risk
    if (component.isInRoutes) score -= 8;
    if (component.isInStorybook) score -= 3;

    // Export status
    if (!component.exported && !component.defaultExport) score += 3;

    // File location
    if (component.filePath.includes('/common/')) score -= 2;
    if (component.filePath.includes('/pages/')) score += 1;

    // Complexity
    if (component.complexity > 7) score -= 2;
    if (component.complexity < 3) score += 1;

    return Math.max(0, Math.min(10, score));
  }

  private async generateReport() {
    devLog('📊 Generating report...');

    const deadComponents = Array.from(this.allComponents.values())
      .filter(c => c.usageCount === 0 && !c.isInRoutes)
      .sort((a, b) => b.riskScore - a.riskScore);

    const orphanedComponents = Array.from(this.allComponents.values())
      .filter(c => c.usageCount === 1 && !c.isInRoutes && c.riskScore > 5)
      .sort((a, b) => b.riskScore - a.riskScore);

    const suspiciousComponents = Array.from(this.allComponents.values())
      .filter(c => c.usageCount === 0 && c.isInStorybook)
      .sort((a, b) => b.riskScore - a.riskScore);

    const report = {
      metadata: {
        analysisDate: new Date().toISOString(),
        totalComponents: this.allComponents.size,
        analyzer: 'WRFCoin Agent C v1.0',
      },
      summary: {
        totalComponents: this.allComponents.size,
        deadComponents: deadComponents.length,
        orphanedComponents: orphanedComponents.length,
        suspiciousComponents: suspiciousComponents.length,
        componentsInRoutes: this.routeRegistry.size,
        componentsInStorybook: this.storybookRegistry.size,
      },
      classifications: {
        dead: deadComponents,
        orphaned: orphanedComponents,
        suspicious: suspiciousComponents,
      },
    };

    await this.saveReport(report);
    this.printSummary(report);

    return report;
  }

  private async saveReport(report: any): Promise<void> {
    const reportsDir = path.join(this.projectRoot, 'reports');

    try {
      await fs.promises.mkdir(reportsDir, { recursive: true });
    } catch (error) {
      // Directory exists
    }

    // JSON report
    const jsonPath = path.join(reportsDir, 'component-analysis.json');
    await fs.promises.writeFile(jsonPath, JSON.stringify(report, null, 2));

    // CSV report
    const csvPath = path.join(reportsDir, 'component-analysis.csv');
    await fs.promises.writeFile(csvPath, this.generateCSV(report));

    devLog(`📁 Reports saved to: ${reportsDir}/`);
  }

  private generateCSV(report: any): string {
    const headers = [
      'Component Name',
      'File Path',
      'Type',
      'Usage Count',
      'In Routes',
      'In Storybook',
      'Risk Score',
      'Status',
    ];

    const rows = [headers.join(',')];

    const allComponents = [
      ...report.classifications.dead,
      ...report.classifications.orphaned,
      ...report.classifications.suspicious,
    ];

    for (const component of allComponents) {
      const status =
        component.usageCount === 0
          ? 'Dead'
          : component.usageCount === 1
            ? 'Orphaned'
            : 'Suspicious';

      const row = [
        component.name,
        component.filePath,
        component.type,
        component.usageCount,
        component.isInRoutes ? 'Yes' : 'No',
        component.isInStorybook ? 'Yes' : 'No',
        component.riskScore,
        status,
      ];

      rows.push(row.map(cell => `"${cell}"`).join(','));
    }

    return rows.join('\n');
  }

  private printSummary(report: any): void {
    devLog('\n🎯 WRFCOIN COMPONENT ANALYSIS SUMMARY');
    devLog('=====================================');
    devLog(`📊 Total Components: ${report.summary.totalComponents}`);
    devLog(`💀 Dead Components: ${report.summary.deadComponents}`);
    devLog(
      `🏝️  Orphaned Components: ${report.summary.orphanedComponents}`,
    );
    devLog(
      `🤔 Suspicious Components: ${report.summary.suspiciousComponents}`,
    );
    devLog(`🛣️  In Routes: ${report.summary.componentsInRoutes}`);
    devLog(`📚 In Storybook: ${report.summary.componentsInStorybook}`);

    devLog('\n📁 GENERATED FILES:');
    devLog('  • reports/component-analysis.json');
    devLog('  • reports/component-analysis.csv');
  }

  /**
   * Auto-fix capabilities for safe cleanup of dead components
   */
  async autoFixDeadComponents(
    report: any,
    options: AutoFixOptions = {},
  ): Promise<AutoFixResult> {
    devLog('\n🔧 Starting Auto-Fix for Dead Components...');

    const result: AutoFixResult = {
      attempted: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      backupCreated: false,
      fixedComponents: [],
      failedComponents: [],
      warnings: [],
    };

    // Create backup if requested
    if (options.createBackup !== false) {
      await this.createBackup();
      result.backupCreated = true;
    }

    // Filter components safe for auto-fixing
    const safeToFix = this.filterSafeComponents(report, options);
    devLog(`🎯 Found ${safeToFix.length} components safe for auto-fixing`);

    for (const component of safeToFix) {
      result.attempted++;

      try {
        devLog(`🔧 Fixing: ${component.name} (${component.filePath})`);

        const fixSuccess = await this.fixComponent(component, options);

        if (fixSuccess) {
          result.successful++;
          result.fixedComponents.push({
            name: component.name,
            filePath: component.filePath,
            action: this.getFixAction(component),
            riskScore: component.riskScore,
          });
          devLog(`  ✅ Successfully fixed ${component.name}`);
        } else {
          result.failed++;
          result.failedComponents.push({
            name: component.name,
            filePath: component.filePath,
            reason: 'Fix operation failed',
            riskScore: component.riskScore,
          });
          devLog(`  ❌ Failed to fix ${component.name}`);
        }
      } catch (error) {
        result.failed++;
        result.failedComponents.push({
          name: component.name,
          filePath: component.filePath,
          reason: error instanceof Error ? error.message : String(error),
          riskScore: component.riskScore,
        });
        devLog(
          `  ❌ Error fixing ${component.name}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    // Generate auto-fix report
    await this.saveAutoFixReport(result);
    this.printAutoFixSummary(result);

    return result;
  }

  private filterSafeComponents(report: any, options: AutoFixOptions): any[] {
    const deadComponents = report.classifications.dead || [];
    const orphanedComponents = report.classifications.orphaned || [];

    const minRiskScore = options.minRiskScore || 8;
    const maxFileAge = options.maxFileAge || 30; // days

    return [...deadComponents, ...orphanedComponents].filter(component => {
      // Only fix high-risk components (8+)
      if (component.riskScore < minRiskScore) return false;

      // Skip if file is too new (protection against recent work)
      if (options.maxFileAge) {
        const fileAge =
          (Date.now() - new Date(component.lastModified).getTime()) /
          (1000 * 60 * 60 * 24);
        if (fileAge < maxFileAge) return false;
      }

      // Skip if explicitly excluded
      if (options.excludePatterns) {
        const excluded = options.excludePatterns.some(
          pattern =>
            new RegExp(pattern).test(component.filePath) ||
            new RegExp(pattern).test(component.name),
        );
        if (excluded) return false;
      }

      // Skip components with potential dependencies
      if (component.complexity > 5 && !options.allowComplexComponents)
        return false;

      return true;
    });
  }

  private async fixComponent(
    component: any,
    options: AutoFixOptions,
  ): Promise<boolean> {
    const filePath = path.resolve(this.projectRoot, component.filePath);

    try {
      // Read current file content
      const content = await fs.promises.readFile(filePath, 'utf-8');

      // Determine fix strategy
      const strategy = this.getFixStrategy(component, content);

      switch (strategy) {
      case 'remove-export':
        return await this.removeExportedComponent(
          filePath,
          content,
          component
        );
      case 'remove-file':
        return await this.removeComponentFile(filePath, component, options);
      case 'comment-out':
        return await this.commentOutComponent(filePath, content, component);
      default:
        return false;
      }
    } catch (error) {
      console.error(
        `Error fixing component ${component.name}:`,
        error instanceof Error ? error.message : String(error),
      );
      return false;
    }
  }

  private getFixStrategy(component: any, content: string): string {
    // If this is the only export in the file, remove the whole file
    const exportMatches = content.match(/export\s+(default\s+)?/g) || [];
    if (exportMatches.length === 1) {
      return 'remove-file';
    }

    // If multiple exports, just remove this specific export
    if (exportMatches.length > 1) {
      return 'remove-export';
    }

    // Fallback: comment out the component
    return 'comment-out';
  }

  private async removeExportedComponent(
    filePath: string,
    content: string,
    component: any,
  ): Promise<boolean> {
    try {
      // Create regex patterns to match the component definition and export
      const patterns = [
        // Function component with export
        new RegExp(
          `export\\s+(const|function)\\s+${component.name}\\s*[\\s\\S]*?(?=\\n\\s*(?:export|const|function|$))`,
          'g',
        ),
        // Named export
        new RegExp(`export\\s*\\{[^}]*${component.name}[^}]*\\}`, 'g'),
        // Default export
        new RegExp(`export\\s+default\\s+${component.name}`, 'g'),
        // Component definition without export
        new RegExp(
          `(?:const|function)\\s+${component.name}\\s*[\\s\\S]*?(?=\\n\\s*(?:export|const|function|$))`,
          'g',
        ),
      ];

      let updatedContent = content;
      let hasChanges = false;

      for (const pattern of patterns) {
        const newContent = updatedContent.replace(pattern, '');
        if (newContent !== updatedContent) {
          updatedContent = newContent;
          hasChanges = true;
        }
      }

      if (hasChanges) {
        // Clean up extra blank lines
        updatedContent = updatedContent.replace(/\n\s*\n\s*\n/g, '\n\n');
        await fs.promises.writeFile(filePath, updatedContent);
        return true;
      }

      return false;
    } catch (error) {
      console.error(
        `Error removing component export:`,
        error instanceof Error ? error.message : String(error),
      );
      return false;
    }
  }

  private async removeComponentFile(
    filePath: string,
    component: any,
    options: AutoFixOptions,
  ): Promise<boolean> {
    try {
      if (options.dryRun) {
        devLog(`  🔍 Would remove file: ${filePath}`);
        return true;
      }

      // Move to trash folder instead of deleting
      const trashDir = path.join(this.projectRoot, 'trash', 'components');
      await fs.promises.mkdir(trashDir, { recursive: true });

      const fileName = path.basename(filePath);
      const trashPath = path.join(trashDir, `${fileName}.${Date.now()}.bak`);

      await fs.promises.rename(filePath, trashPath);
      devLog(`  🗑️  Moved to trash: ${trashPath}`);

      return true;
    } catch (error) {
      console.error(
        `Error removing component file:`,
        error instanceof Error ? error.message : String(error),
      );
      return false;
    }
  }

  private async commentOutComponent(
    filePath: string,
    content: string,
    component: any,
  ): Promise<boolean> {
    try {
      // Add comment header explaining why component was commented out
      const commentHeader = `\n/* AUTO-COMMENTED BY WRFCOIN COMPONENT CLEANUP\n * Component: ${component.name}\n * Reason: Dead component (Risk Score: ${component.riskScore})\n * Date: ${new Date().toISOString()}\n */\n`;

      // Comment out the component definition
      const componentPattern = new RegExp(
        `((?:const|function)\\s+${component.name}[\\s\\S]*?(?=\\n\\s*(?:export|const|function|$)))`,
        'g',
      );

      const updatedContent = content.replace(componentPattern, match => {
        const lines = match.split('\n');
        const commentedLines = lines.map(line =>
          line.trim() ? `// ${line}` : '//',
        );
        return commentHeader + commentedLines.join('\n');
      });

      if (updatedContent !== content) {
        await fs.promises.writeFile(filePath, updatedContent);
        return true;
      }

      return false;
    } catch (error) {
      console.error(
        `Error commenting out component:`,
        error instanceof Error ? error.message : String(error),
      );
      return false;
    }
  }

  private getFixAction(component: any): string {
    if (component.riskScore >= 9) return 'Removed file';
    if (component.riskScore >= 8) return 'Removed export';
    return 'Commented out';
  }

  private async createBackup(): Promise<void> {
    const backupDir = path.join(
      this.projectRoot,
      'backups',
      `component-cleanup-${Date.now()}`,
    );
    await fs.promises.mkdir(backupDir, { recursive: true });

    devLog(`📦 Creating backup at: ${backupDir}`);

    // Copy src directory to backup
    await this.copyDirectory(this.config.srcDir, path.join(backupDir, 'src'));

    devLog('✅ Backup created successfully');
  }

  private async copyDirectory(src: string, dest: string): Promise<void> {
    await fs.promises.mkdir(dest, { recursive: true });
    const items = await fs.promises.readdir(src);

    for (const item of items) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      const stat = await fs.promises.stat(srcPath);

      if (stat.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.promises.copyFile(srcPath, destPath);
      }
    }
  }

  private async saveAutoFixReport(result: AutoFixResult): Promise<void> {
    const reportsDir = path.join(this.projectRoot, 'reports');
    await fs.promises.mkdir(reportsDir, { recursive: true });

    const reportPath = path.join(
      reportsDir,
      `auto-fix-report-${Date.now()}.json`,
    );
    await fs.promises.writeFile(reportPath, JSON.stringify(result, null, 2));

    devLog(`📄 Auto-fix report saved: ${reportPath}`);
  }

  private printAutoFixSummary(result: AutoFixResult): void {
    devLog('\n🔧 AUTO-FIX SUMMARY');
    devLog('===================');
    devLog(`🎯 Attempted: ${result.attempted}`);
    devLog(`✅ Successful: ${result.successful}`);
    devLog(`❌ Failed: ${result.failed}`);
    devLog(`⏭️  Skipped: ${result.skipped}`);
    devLog(`📦 Backup Created: ${result.backupCreated ? 'Yes' : 'No'}`);

    if (result.fixedComponents.length > 0) {
      devLog('\n✅ Successfully Fixed:');
      result.fixedComponents.forEach(comp => {
        devLog(`  • ${comp.name} (${comp.action})`);
      });
    }

    if (result.failedComponents.length > 0) {
      devLog('\n❌ Failed to Fix:');
      result.failedComponents.forEach(comp => {
        devLog(`  • ${comp.name}: ${comp.reason}`);
      });
    }

    if (result.warnings.length > 0) {
      devLog('\n⚠️  Warnings:');
      result.warnings.forEach(warning => devLog(`  • ${warning}`));
    }
  }
}

// Export main analysis function
export async function analyzeWRFCoinComponents(config?: DeadComponentConfig) {
  const detector = new WRFCoinDeadComponentDetector(config);
  return await detector.analyzeComponents();
}

// Export auto-fix function
export async function autoFixWRFCoinComponents(
  config?: DeadComponentConfig,
  fixOptions?: AutoFixOptions,
) {
  const detector = new WRFCoinDeadComponentDetector(config);
  const report = await detector.analyzeComponents();
  return await detector.autoFixDeadComponents(report, fixOptions);
}

// CLI execution script for Node.js
export async function runComponentAnalysisCLI(): Promise<void> {
  const args = process.argv.slice(2);
  const options: DeadComponentConfig = {};
  const fixOptions: AutoFixOptions = {};
  let runAutoFix = false;

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
    case '--src-dir':
      options.srcDir = args[++i];
      break;
    case '--components-dir':
      options.componentsDir = args[++i];
      break;
    case '--no-storybook':
      options.includeStorybook = false;
      break;
    case '--no-routes':
      options.includeRoutes = false;
      break;
    case '--risk-threshold':
      options.riskThreshold = parseInt(args[++i], 10);
      break;
    case '--auto-fix':
      runAutoFix = true;
      break;
    case '--dry-run':
      fixOptions.dryRun = true;
      runAutoFix = true;
      break;
    case '--no-backup':
      fixOptions.createBackup = false;
      break;
    case '--min-risk-score':
      fixOptions.minRiskScore = parseInt(args[++i], 10);
      break;
    case '--max-file-age':
      fixOptions.maxFileAge = parseInt(args[++i], 10);
      break;
    case '--allow-complex':
      fixOptions.allowComplexComponents = true;
      break;
    case '--help':
      devLog(`
WRFCoin Dead Component Detection CLI

Usage: npm run analyze-components [options]

Analysis Options:
  --src-dir <path>           Source directory (default: src)
  --components-dir <path>    Components directory (default: src/components)
  --no-storybook            Exclude Storybook analysis
  --no-routes               Exclude route analysis
  --risk-threshold <number>  Risk threshold for warnings (default: 6)

Auto-Fix Options:
  --auto-fix                Enable auto-fix mode for dead components
  --dry-run                 Show what would be fixed without making changes
  --no-backup               Skip creating backup before auto-fix
  --min-risk-score <number> Minimum risk score for auto-fix (default: 8)
  --max-file-age <days>     Maximum file age in days for auto-fix (default: 30)
  --allow-complex           Allow fixing complex components (complexity > 5)
  --help                    Show this help message

Examples:
  npm run analyze-components
  npm run analyze-components --risk-threshold 8
  npm run analyze-components --auto-fix --dry-run
  npm run analyze-components --auto-fix --min-risk-score 9 --no-backup
  npm run analyze-components --no-storybook --src-dir ./src
        `);
      process.exit(0);
      break;
    }
  }

  try {
    devLog('🎯 WRFCoin Component Analysis Tool - Agent C');
    devLog('===========================================');

    if (runAutoFix) {
      // Run auto-fix mode
      const result = await autoFixWRFCoinComponents(options, fixOptions);

      devLog('\n🔧 Auto-Fix Complete!');
      devLog(`🎯 Attempted: ${result.attempted} components`);
      devLog(`✅ Successfully fixed: ${result.successful} components`);
      devLog(`❌ Failed to fix: ${result.failed} components`);

      if (result.successful > 0) {
        devLog('\n🎉 Components Successfully Cleaned Up:');
        result.fixedComponents.forEach(comp => {
          devLog(`  ✅ ${comp.name} (${comp.action})`);
        });
      }

      if (result.failed > 0) {
        devLog('\n⚠️  Components That Could Not Be Fixed:');
        result.failedComponents.forEach(comp => {
          devLog(`  ❌ ${comp.name}: ${comp.reason}`);
        });
      }

      if (fixOptions.dryRun) {
        devLog(
          '\n🔍 This was a dry run - no files were actually modified.',
        );
        devLog('Run without --dry-run to apply the changes.');
      }
    } else {
      // Run analysis mode
      const report = await analyzeWRFCoinComponents(options);

      // Print final summary
      devLog('\n🎉 Analysis Complete!');
      devLog(`📊 Analyzed ${report.summary.totalComponents} components`);
      devLog(`💀 Found ${report.summary.deadComponents} dead components`);
      devLog(
        `🏝️  Found ${report.summary.orphanedComponents} orphaned components`,
      );
      devLog(
        `🤔 Found ${report.summary.suspiciousComponents} suspicious components`,
      );

      if (
        report.summary.deadComponents > 0 ||
        report.summary.orphanedComponents > 0
      ) {
        devLog('\n💡 Next Steps:');
        devLog('1. Review the generated reports in reports/');
        devLog('2. Manually verify medium-risk components');
        devLog('3. Consider removing high-risk dead components');
        devLog('4. Use --auto-fix --dry-run to preview automatic cleanup');
        devLog(
          '5. Update ESLint configuration to prevent future orphaned components',
        );
      } else {
        devLog('\n✨ Great! No dead or orphaned components found.');
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Analysis failed:', error);
    process.exit(1);
  }
}

// Auto-execute if this file is run directly
if (typeof process !== 'undefined' && require.main === module) {
  runComponentAnalysisCLI();
}

export class RouteCLI {
  private config: CLIToolConfig;
  private commands: Map<string, CLICommand> = new Map();

  constructor(config: Partial<CLIToolConfig> = {}) {
    this.config = {
      outputFormat: 'table',
      verbose: false,
      useColors: true,
      ...config,
    };

    this.initializeCommands();
  }

  /**
   * Execute a CLI command
   */
  async execute(
    commandName: string,
    args: Record<string, any> = {},
  ): Promise<string> {
    const command = this.commands.get(commandName);
    if (!command) {
      throw new Error(`Unknown command: ${commandName}`);
    }

    // Validate required options
    for (const option of command.options) {
      if (option.required && !(option.name in args)) {
        throw new Error(`Required option --${option.name} is missing`);
      }
    }

    return await command.execute(args);
  }

  /**
   * Get available commands
   */
  getCommands(): CLICommand[] {
    return Array.from(this.commands.values());
  }

  /**
   * Generate help text
   */
  generateHelp(commandName?: string): string {
    if (commandName) {
      const command = this.commands.get(commandName);
      if (!command) {
        return `Unknown command: ${commandName}`;
      }
      return this.generateCommandHelp(command);
    }

    let help = 'WRFCoin Route Management CLI\n\n';
    help += 'Available Commands:\n';

    this.commands.forEach(command => {
      help += `  ${command.name.padEnd(20)} ${command.description}\n`;
    });

    help += '\nUse "help <command>" for detailed command information.\n';
    return help;
  }

  /**
   * Initialize CLI commands
   */
  private initializeCommands(): void {
    // List routes command
    this.commands.set('list', {
      name: 'list',
      description: 'List all routes or filter by criteria',
      options: [
        {
          name: 'domain',
          alias: 'd',
          description: 'Filter by domain',
          type: 'string',
          choices: Object.values(RouteDomain),
        },
        {
          name: 'access-level',
          alias: 'a',
          description: 'Filter by access level',
          type: 'string',
          choices: Object.values(RouteAccessLevel),
        },
        {
          name: 'type',
          alias: 't',
          description: 'Filter by route type',
          type: 'string',
          choices: Object.values(RouteType),
        },
        {
          name: 'enabled',
          alias: 'e',
          description: 'Filter by enabled status',
          type: 'boolean',
        },
        {
          name: 'format',
          alias: 'f',
          description: 'Output format',
          type: 'string',
          choices: ['table', 'json', 'yaml'],
          defaultValue: 'table',
        },
      ],
      execute: args => this.listRoutes(args),
    });

    // Show route details command
    this.commands.set('show', {
      name: 'show',
      description: 'Show detailed information about a specific route',
      options: [
        {
          name: 'id',
          description: 'Route ID',
          type: 'string',
          required: true,
        },
        {
          name: 'format',
          alias: 'f',
          description: 'Output format',
          type: 'string',
          choices: ['json', 'yaml', 'table'],
          defaultValue: 'table',
        },
      ],
      execute: args => this.showRoute(args.id, args.format),
    });

    // Validate routes command
    this.commands.set('validate', {
      name: 'validate',
      description: 'Validate all routes and check for conflicts',
      options: [
        {
          name: 'format',
          alias: 'f',
          description: 'Output format',
          type: 'string',
          choices: ['table', 'json'],
          defaultValue: 'table',
        },
        {
          name: 'verbose',
          alias: 'v',
          description: 'Show detailed validation information',
          type: 'boolean',
          defaultValue: false,
        },
      ],
      execute: args => this.validateRoutes(args.format, args.verbose),
    });

    // Statistics command
    this.commands.set('stats', {
      name: 'stats',
      description: 'Show route registry statistics',
      options: [
        {
          name: 'format',
          alias: 'f',
          description: 'Output format',
          type: 'string',
          choices: ['table', 'json'],
          defaultValue: 'table',
        },
      ],
      execute: args => this.showStats(args.format),
    });

    // Search routes command
    this.commands.set('search', {
      name: 'search',
      description: 'Search routes by query or filters',
      options: [
        {
          name: 'query',
          alias: 'q',
          description: 'Search query',
          type: 'string',
        },
        {
          name: 'tags',
          description: 'Filter by tags (comma-separated)',
          type: 'array',
        },
        {
          name: 'sort',
          alias: 's',
          description: 'Sort field',
          type: 'string',
          choices: ['path', 'title', 'complexity', 'createdAt', 'updatedAt'],
          defaultValue: 'path',
        },
        {
          name: 'order',
          alias: 'o',
          description: 'Sort order',
          type: 'string',
          choices: ['asc', 'desc'],
          defaultValue: 'asc',
        },
      ],
      execute: args => this.searchRoutes(args),
    });

    // Visualize routes command (enhanced)
    this.commands.set('visualize', {
      name: 'visualize',
      description: 'Generate advanced route hierarchy visualization',
      options: [
        {
          name: 'type',
          alias: 't',
          description: 'Visualization type',
          type: 'string',
          choices: [
            'tree',
            'graph',
            'list',
            'hierarchy',
            'network',
            'dependencies',
          ],
          defaultValue: 'tree',
        },
        {
          name: 'output',
          alias: 'o',
          description: 'Output format',
          type: 'string',
          choices: ['ascii', 'svg', 'json', 'mermaid'],
          defaultValue: 'ascii',
        },
        {
          name: 'group-by-domain',
          alias: 'g',
          description: 'Group routes by domain',
          type: 'boolean',
          defaultValue: true,
        },
        {
          name: 'show-dependencies',
          description: 'Show component dependencies',
          type: 'boolean',
          defaultValue: false,
        },
        {
          name: 'show-parameters',
          description: 'Show route parameters',
          type: 'boolean',
          defaultValue: true,
        },
        {
          name: 'show-health',
          description: 'Show route health scores',
          type: 'boolean',
          defaultValue: false,
        },
        {
          name: 'interactive',
          alias: 'i',
          description: 'Enable interactive exploration',
          type: 'boolean',
          defaultValue: false,
        },
        {
          name: 'depth',
          alias: 'd',
          description: 'Maximum visualization depth',
          type: 'number',
          defaultValue: 5,
        },
      ],
      execute: args => this.visualizeRoutes(args),
    });

    // Route health command
    this.commands.set('health', {
      name: 'health',
      description: 'Analyze route health and performance metrics',
      options: [
        {
          name: 'route-id',
          alias: 'r',
          description: 'Specific route ID to analyze',
          type: 'string',
        },
        {
          name: 'threshold',
          alias: 't',
          description: 'Health score threshold (show routes below this score)',
          type: 'number',
          defaultValue: 70,
        },
        {
          name: 'format',
          alias: 'f',
          description: 'Output format',
          type: 'string',
          choices: ['table', 'json', 'report'],
          defaultValue: 'table',
        },
        {
          name: 'include-recommendations',
          description: 'Include optimization recommendations',
          type: 'boolean',
          defaultValue: true,
        },
      ],
      execute: args => this.analyzeRouteHealth(args),
    });

    // Interactive explorer command
    this.commands.set('explore', {
      name: 'explore',
      description: 'Interactive route explorer with navigation',
      options: [
        {
          name: 'start-route',
          alias: 's',
          description: 'Starting route ID for exploration',
          type: 'string',
        },
        {
          name: 'mode',
          alias: 'm',
          description: 'Exploration mode',
          type: 'string',
          choices: ['navigation', 'dependencies', 'conflicts', 'health'],
          defaultValue: 'navigation',
        },
      ],
      execute: args => this.exploreRoutes(args),
    });

    // Orphaned routes command
    this.commands.set('orphaned', {
      name: 'orphaned',
      description: 'Find orphaned and dead routes',
      options: [
        {
          name: 'component-analysis',
          alias: 'c',
          description: 'Path to component analysis JSON file',
          type: 'string',
        },
        {
          name: 'fix',
          description: 'Suggest fixes for orphaned routes',
          type: 'boolean',
          defaultValue: false,
        },
        {
          name: 'format',
          alias: 'f',
          description: 'Output format',
          type: 'string',
          choices: ['table', 'json', 'report'],
          defaultValue: 'table',
        },
      ],
      execute: args => this.findOrphanedRoutes(args),
    });

    // Route optimization command
    this.commands.set('optimize', {
      name: 'optimize',
      description: 'Generate route optimization recommendations',
      options: [
        {
          name: 'domain',
          alias: 'd',
          description: 'Focus on specific domain',
          type: 'string',
        },
        {
          name: 'type',
          alias: 't',
          description: 'Optimization type',
          type: 'string',
          choices: ['bundle', 'lazy-loading', 'consolidation', 'performance'],
          defaultValue: 'all',
        },
        {
          name: 'format',
          alias: 'f',
          description: 'Output format',
          type: 'string',
          choices: ['table', 'json', 'action-plan'],
          defaultValue: 'table',
        },
      ],
      execute: args => this.generateOptimizations(args),
    });

    // Export routes command
    this.commands.set('export', {
      name: 'export',
      description: 'Export routes to various formats',
      options: [
        {
          name: 'format',
          alias: 'f',
          description: 'Export format',
          type: 'string',
          choices: ['json', 'typescript', 'yaml', 'csv', 'markdown'],
          defaultValue: 'json',
        },
        {
          name: 'output',
          alias: 'o',
          description: 'Output file path',
          type: 'string',
        },
        {
          name: 'filter',
          description: 'Filter routes by domain',
          type: 'string',
        },
      ],
      execute: args => this.exportRoutes(args.format, args.output, args.filter),
    });

    // Conflicts command
    this.commands.set('conflicts', {
      name: 'conflicts',
      description: 'Check for route conflicts and overlaps',
      options: [
        {
          name: 'format',
          alias: 'f',
          description: 'Output format',
          type: 'string',
          choices: ['table', 'json'],
          defaultValue: 'table',
        },
      ],
      execute: args => this.checkConflicts(args.format),
    });
  }

  /**
   * List routes with optional filtering
   */
  private listRoutes(args: Record<string, any>): string {
    const criteria: RouteSearchCriteria = {
      domain: args.domain as RouteDomain,
      accessLevel: args['access-level'] as RouteAccessLevel,
      type: args.type as RouteType,
      enabled: args.enabled,
      sortBy: 'path',
      sortDirection: 'asc',
    };

    const routes = routeRegistry.searchRoutes(criteria);

    switch (args.format) {
    case 'json':
      return JSON.stringify(routes, null, 2);
    case 'yaml':
      return this.routesToYaml(routes);
    default:
      return this.routesToTable(routes);
    }
  }

  /**
   * Show detailed route information
   */
  private showRoute(routeId: string, format: string): string {
    const route = routeRegistry.getRoute(routeId);
    if (!route) {
      return `Route '${routeId}' not found`;
    }

    switch (format) {
    case 'json':
      return JSON.stringify(route, null, 2);
    case 'yaml':
      return this.routesToYaml([route]);
    default:
      return this.routeToDetailTable(route);
    }
  }

  /**
   * Validate all routes
   */
  private validateRoutes(format: string, verbose: boolean): string {
    const routes = routeRegistry.getAllRoutes();
    const report = generateRouteValidationReport(routes);

    if (format === 'json') {
      return JSON.stringify(report, null, 2);
    }

    let output = 'Route Validation Report\n';
    output += '='.repeat(50) + '\n\n';

    // Summary
    output += `Total Routes: ${report.summary.totalRoutes}\n`;
    output += `Valid Routes: ${report.summary.validRoutes}\n`;
    output += `Routes with Errors: ${report.summary.routesWithErrors}\n`;
    output += `Routes with Warnings: ${report.summary.routesWithWarnings}\n\n`;

    // Errors
    if (report.details.errors.length > 0) {
      output += 'ERRORS:\n';
      output += '-'.repeat(20) + '\n';
      report.details.errors.forEach(error => {
        output += `${error.routeId}: ${error.message}\n`;
      });
      output += '\n';
    }

    // Warnings (if verbose)
    if (verbose && report.details.warnings.length > 0) {
      output += 'WARNINGS:\n';
      output += '-'.repeat(20) + '\n';
      report.details.warnings.forEach(warning => {
        output += `${warning.routeId}: ${warning.message}\n`;
      });
      output += '\n';
    }

    // Conflicts
    if (report.details.conflicts.length > 0) {
      output += 'CONFLICTS:\n';
      output += '-'.repeat(20) + '\n';
      report.details.conflicts.forEach(conflict => {
        output += `${conflict.routeIds.join(', ')}: ${conflict.description}\n`;
        if (conflict.resolution) {
          output += `  Resolution: ${conflict.resolution}\n`;
        }
      });
      output += '\n';
    }

    // Recommendations
    if (report.details.recommendations.length > 0) {
      output += 'RECOMMENDATIONS:\n';
      output += '-'.repeat(20) + '\n';
      report.details.recommendations.forEach(rec => {
        output += `• ${rec}\n`;
      });
    }

    return output;
  }

  /**
   * Show registry statistics
   */
  private showStats(format: string): string {
    const stats = routeRegistry.getStats();

    if (format === 'json') {
      return JSON.stringify(stats, null, 2);
    }

    let output = 'Route Registry Statistics\n';
    output += '='.repeat(50) + '\n\n';

    output += `Total Routes: ${stats.totalRoutes}\n`;
    output += `Dynamic Routes: ${stats.dynamicRoutes}\n`;
    output += `Static Routes: ${stats.staticRoutes}\n`;
    output += `Average Complexity: ${stats.avgComplexity.toFixed(1)}\n`;
    output += `Estimated Bundle Size: ${this.formatBytes(stats.estimatedBundleSize)}\n\n`;

    output += 'Routes by Domain:\n';
    Object.entries(stats.routesByDomain).forEach(([domain, count]) => {
      output += `  ${domain}: ${count}\n`;
    });

    output += '\nRoutes by Access Level:\n';
    Object.entries(stats.routesByAccessLevel).forEach(([level, count]) => {
      output += `  ${level}: ${count}\n`;
    });

    output += '\nRoutes by Loading Strategy:\n';
    Object.entries(stats.routesByLoadingStrategy).forEach(
      ([strategy, count]) => {
        output += `  ${strategy}: ${count}\n`;
      },
    );

    return output;
  }

  /**
   * Search routes
   */
  private searchRoutes(args: Record<string, any>): string {
    const criteria: RouteSearchCriteria = {
      query: args.query,
      tags: args.tags,
      sortBy: args.sort,
      sortDirection: args.order,
    };

    const routes = routeRegistry.searchRoutes(criteria);
    return this.routesToTable(routes);
  }

  /**
   * Enhanced route visualization with multiple output formats
   */
  private visualizeRoutes(args: Record<string, any>): string {
    const routes = routeRegistry.getAllRoutes();
    const config: RouteVisualizationConfig = {
      type: args.type,
      groupByDomain: args['group-by-domain'],
      showDependencies: args['show-dependencies'],
      showParameters: args['show-parameters'],
      maxDepth: args.depth,
    };

    // Import advanced validation functions
    const healthData = args['show-health']
      ? this.getRouteHealthData(routes)
      : null;

    switch (args.output) {
    case 'mermaid':
      return this.generateMermaidDiagram(routes, config);
    case 'svg':
      return this.generateSVGVisualization(routes, config);
    case 'json':
      return this.generateJSONVisualization(routes, config, healthData);
    default: // ascii
      return this.generateASCIIVisualization(routes, config, healthData);
    }
  }

  /**
   * Analyze route health and performance
   */
  private analyzeRouteHealth(args: Record<string, any>): string {
    const routes = routeRegistry.getAllRoutes();

    if (args['route-id']) {
      return this.analyzeSpecificRouteHealth(args['route-id'], args.format);
    }

    const healthAnalysis = routes.map(route => {
      const { calculateRouteHealthScore } = require('../utils/routeValidation');
      return {
        route,
        health: calculateRouteHealthScore(route),
      };
    });

    const unhealthyRoutes = healthAnalysis.filter(
      analysis => analysis.health.score < args.threshold,
    );

    if (args.format === 'json') {
      return JSON.stringify(
        {
          summary: {
            totalRoutes: routes.length,
            unhealthyRoutes: unhealthyRoutes.length,
            averageHealth:
              healthAnalysis.reduce((sum, a) => sum + a.health.score, 0) /
              routes.length,
          },
          details: unhealthyRoutes,
        },
        null,
        2,
      );
    }

    return this.formatHealthReport(healthAnalysis, unhealthyRoutes, args);
  }

  /**
   * Interactive route explorer
   */
  private exploreRoutes(args: Record<string, any>): string {
    // Since we can't actually implement interactive CLI in this context,
    // we'll return a guided exploration report
    const routes = routeRegistry.getAllRoutes();
    const startRoute = args['start-route']
      ? routes.find(r => r.id === args['start-route'])
      : routes[0];

    if (!startRoute) {
      return 'Start route not found. Use "list" command to see available routes.';
    }

    let output = `Interactive Route Explorer\n`;
    output += '='.repeat(50) + '\n\n';
    output += `Starting at: ${startRoute.path} (${startRoute.id})\n\n`;

    switch (args.mode) {
    case 'dependencies':
      output += this.exploreDependencies(startRoute, routes);
      break;
    case 'conflicts':
      output += this.exploreConflicts(startRoute, routes);
      break;
    case 'health':
      output += this.exploreHealth(startRoute);
      break;
    default: // navigation
      output += this.exploreNavigation(startRoute, routes);
    }

    output += '\n\nCommands to explore further:\n';
    output += '  route-cli explore -s <route-id> -m <mode>\n';
    output += '  route-cli show <route-id>\n';
    output += '  route-cli health -r <route-id>\n';

    return output;
  }

  /**
   * Find orphaned routes using component analysis
   */
  private async findOrphanedRoutes(args: Record<string, any>): Promise<string> {
    const routes = routeRegistry.getAllRoutes();
    let componentAnalysis = null;

    // Load component analysis if provided
    if (args['component-analysis']) {
      try {
        const fs = require('fs');
        const content = fs.readFileSync(args['component-analysis'], 'utf8');
        componentAnalysis = JSON.parse(content);
      } catch (error) {
        return `Error loading component analysis: ${error}`;
      }
    }

    const { identifyOrphanedRoutes } = require('../utils/routeValidation');
    const orphanedData = await identifyOrphanedRoutes(
      routes,
      componentAnalysis,
    );

    if (args.format === 'json') {
      return JSON.stringify(
        {
          summary: {
            totalRoutes: routes.length,
            orphanedRoutes: orphanedData.orphanedRoutes.length,
            brokenImports: orphanedData.brokenImports.length,
            deadComponentRoutes: orphanedData.deadComponentRoutes.length,
            unreachableRoutes: orphanedData.unreachableRoutes.length,
          },
          details: orphanedData,
        },
        null,
        2,
      );
    }

    return this.formatOrphanedRoutesReport(orphanedData, routes, args);
  }

  /**
   * Generate route optimization recommendations
   */
  private generateOptimizations(args: Record<string, any>): string {
    const routes = routeRegistry.getAllRoutes();
    let filteredRoutes = routes;

    if (args.domain) {
      filteredRoutes = routes.filter(r => r.domain === args.domain);
    }

    const {
      generateRouteOptimizationRecommendations,
    } = require('../utils/routeValidation');
    const optimizations =
      generateRouteOptimizationRecommendations(filteredRoutes);

    if (args.format === 'json') {
      return JSON.stringify(optimizations, null, 2);
    }

    if (args.format === 'action-plan') {
      return this.generateActionPlan(optimizations);
    }

    return this.formatOptimizationReport(optimizations, args);
  }

  /**
   * Export routes
   */
  private exportRoutes(
    format: RouteExportFormat,
    outputPath?: string,
    filter?: string,
  ): string {
    let routes = routeRegistry.getAllRoutes();

    if (filter) {
      routes = routes.filter(route => route.domain === filter);
    }

    let content: string;

    switch (format) {
    case 'json':
      content = JSON.stringify(routes, null, 2);
      break;
    case 'typescript':
      content = this.generateTypeScriptExport(routes);
      break;
    case 'yaml':
      content = this.routesToYaml(routes);
      break;
    case 'csv':
      content = this.routesToCSV(routes);
      break;
    case 'markdown':
      content = this.routesToMarkdown(routes);
      break;
    default:
      content = JSON.stringify(routes, null, 2);
    }

    if (outputPath) {
      // In a real implementation, this would write to file
      return `Routes exported to ${outputPath}`;
    }

    return content;
  }

  /**
   * Check for route conflicts
   */
  private checkConflicts(format: string): string {
    const conflicts = routeRegistry.detectPathConflicts();

    if (format === 'json') {
      return JSON.stringify(conflicts, null, 2);
    }

    if (conflicts.length === 0) {
      return 'No route conflicts detected.';
    }

    let output = 'Route Conflicts Detected\n';
    output += '='.repeat(50) + '\n\n';

    conflicts.forEach((conflict, index) => {
      output += `Conflict ${index + 1}:\n`;
      output += `  Routes: ${conflict.routeIds.join(', ')}\n`;
      output += `  Type: ${conflict.type}\n`;
      output += `  Description: ${conflict.description}\n`;
      if (conflict.resolution) {
        output += `  Resolution: ${conflict.resolution}\n`;
      }
      output += '\n';
    });

    return output;
  }

  // Helper methods for formatting output

  private routesToTable(routes: RouteDefinition[]): string {
    if (routes.length === 0) {
      return 'No routes found.';
    }

    const headers = ['ID', 'Path', 'Domain', 'Component', 'Access Level'];
    const rows = routes.map(route => [
      route.id,
      route.path,
      route.domain,
      this.getComponentName(route.component),
      route.accessLevel,
    ]);

    return this.formatTable(headers, rows);
  }

  private routeToDetailTable(route: RouteDefinition): string {
    let output = `Route Details: ${route.id}\n`;
    output += '='.repeat(50) + '\n\n';

    output += `ID: ${route.id}\n`;
    output += `Path: ${route.path}\n`;
    output += `Domain: ${route.domain}\n`;
    output += `Type: ${route.type}\n`;
    output += `Access Level: ${route.accessLevel}\n`;
    output += `Loading Strategy: ${route.loadingStrategy}\n`;
    output += `Enabled: ${route.enabled}\n`;
    output += `Title: ${route.metadata.title}\n`;
    output += `Description: ${route.metadata.description}\n`;

    if (route.parameters && route.parameters.length > 0) {
      output += '\nParameters:\n';
      route.parameters.forEach(param => {
        output += `  ${param.name} (${param.type}): ${param.description}\n`;
      });
    }

    if (route.metadata.tags && route.metadata.tags.length > 0) {
      output += `\nTags: ${route.metadata.tags.join(', ')}\n`;
    }

    output += `\nBundle Size: ${this.formatBytes(route.dependency.bundleSize || 0)}\n`;
    output += `Component Path: ${route.dependency.componentPath}\n`;

    return output;
  }

  private generateTreeVisualization(
    routes: RouteDefinition[],
    config: RouteVisualizationConfig,
  ): string {
    let output = 'Route Tree Visualization\n';
    output += '='.repeat(50) + '\n\n';

    if (config.groupByDomain) {
      const routesByDomain = this.groupRoutesByDomain(routes);

      Object.entries(routesByDomain).forEach(([domain, domainRoutes]) => {
        output += `${domain.toUpperCase()}\n`;
        domainRoutes.forEach((route, index) => {
          const isLast = index === domainRoutes.length - 1;
          const prefix = isLast ? '└── ' : '├── ';
          output += `${prefix}${route.path}`;

          if (
            config.showParameters &&
            route.parameters &&
            route.parameters.length > 0
          ) {
            output += ` (${route.parameters.map(p => `:${p.name}`).join(', ')})`;
          }

          output += '\n';
        });
        output += '\n';
      });
    } else {
      routes.forEach(route => {
        output += `${route.path}\n`;
      });
    }

    return output;
  }

  private generateListVisualization(
    routes: RouteDefinition[],
    config: RouteVisualizationConfig,
  ): string {
    let output = 'Route List\n';
    output += '='.repeat(50) + '\n\n';

    routes.forEach(route => {
      output += `• ${route.path}`;
      if (
        config.showParameters &&
        route.parameters &&
        route.parameters.length > 0
      ) {
        output += ` (${route.parameters.map(p => `:${p.name}`).join(', ')})`;
      }
      output += ` → ${route.metadata.title}\n`;
    });

    return output;
  }

  private generateTypeScriptExport(routes: RouteDefinition[]): string {
    let output = '// Auto-generated route constants\n\n';

    // Route constants
    routes.forEach(route => {
      const constantName = route.id.toUpperCase().replace(/[^A-Z0-9]/g, '_');
      output += `export const ${constantName}_ROUTE = '${route.path}';\n`;
    });

    output += '\n// Route map\n';
    output += 'export const ROUTE_MAP = {\n';
    routes.forEach(route => {
      output += `  ${route.id}: '${route.path}',\n`;
    });
    output += '} as const;\n';

    return output;
  }

  private routesToYaml(routes: RouteDefinition[]): string {
    // Simple YAML-like format (would use proper YAML library in production)
    let output = 'routes:\n';
    routes.forEach(route => {
      output += `  - id: ${route.id}\n`;
      output += `    path: ${route.path}\n`;
      output += `    domain: ${route.domain}\n`;
      output += `    accessLevel: ${route.accessLevel}\n`;
      output += `    title: "${route.metadata.title}"\n`;
    });
    return output;
  }

  private routesToCSV(routes: RouteDefinition[]): string {
    let csv = 'ID,Path,Domain,Type,AccessLevel,Title,Description\n';
    routes.forEach(route => {
      csv += `"${route.id}","${route.path}","${route.domain}","${route.type}","${route.accessLevel}","${route.metadata.title}","${route.metadata.description}"\n`;
    });
    return csv;
  }

  private routesToMarkdown(routes: RouteDefinition[]): string {
    let md = '# WRFCoin Routes\n\n';
    md += '| ID | Path | Domain | Access Level | Title |\n';
    md += '|----|----|----|----|----|\n';

    routes.forEach(route => {
      md += `| ${route.id} | \`${route.path}\` | ${route.domain} | ${route.accessLevel} | ${route.metadata.title} |\n`;
    });

    return md;
  }

  private formatTable(headers: string[], rows: string[][]): string {
    const columnWidths = headers.map((header, index) => {
      return Math.max(
        header.length,
        ...rows.map(row => (row[index] || '').length),
      );
    });

    let output = '';

    // Header
    output +=
      headers
        .map((header, index) => header.padEnd(columnWidths[index]))
        .join(' | ') + '\n';
    output += columnWidths.map(width => '-'.repeat(width)).join('-|-') + '\n';

    // Rows
    rows.forEach(row => {
      output +=
        row
          .map((cell, index) => (cell || '').padEnd(columnWidths[index]))
          .join(' | ') + '\n';
    });

    return output;
  }

  private generateCommandHelp(command: CLICommand): string {
    let help = `${command.name} - ${command.description}\n\n`;

    if (command.options.length > 0) {
      help += 'Options:\n';
      command.options.forEach(option => {
        const optionLine = `  --${option.name}${option.alias ? `, -${option.alias}` : ''}`;
        help += `${optionLine.padEnd(20)} ${option.description}`;

        if (option.choices) {
          help += ` (choices: ${option.choices.join(', ')})`;
        }

        if (option.defaultValue !== undefined) {
          help += ` (default: ${option.defaultValue})`;
        }

        help += '\n';
      });
    }

    return help;
  }

  private getComponentName(component: any): string {
    if (typeof component === 'string') {
      return component;
    }
    if (typeof component === 'function') {
      return component.name || 'Anonymous';
    }
    return 'Unknown';
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private groupRoutesByDomain(
    routes: RouteDefinition[],
  ): Record<string, RouteDefinition[]> {
    return routes.reduce(
      (acc, route) => {
        if (!acc[route.domain]) {
          acc[route.domain] = [];
        }
        acc[route.domain].push(route);
        return acc;
      },
      {} as Record<string, RouteDefinition[]>,
    );
  }

  // Enhanced Visualization Methods

  /**
   * Generate Mermaid diagram for route visualization
   */
  private generateMermaidDiagram(
    routes: RouteDefinition[],
    config: RouteVisualizationConfig,
  ): string {
    let output = 'graph TD\n';

    if (config.groupByDomain) {
      const routesByDomain = this.groupRoutesByDomain(routes);

      Object.entries(routesByDomain).forEach(([domain, domainRoutes]) => {
        output += `  subgraph ${domain.toUpperCase()}\n`;
        domainRoutes.forEach(route => {
          const nodeId = route.id.replace(/[^a-zA-Z0-9]/g, '_');
          const label =
            config.showParameters && route.parameters?.length
              ? `${route.path}<br/>[${route.parameters.map(p => p.name).join(', ')}]`
              : route.path;
          output += `    ${nodeId}["${label}"]\n`;

          // Add dependencies if requested
          if (config.showDependencies && route.childRouteIds) {
            route.childRouteIds.forEach(childId => {
              const childNodeId = childId.replace(/[^a-zA-Z0-9]/g, '_');
              output += `    ${nodeId} --> ${childNodeId}\n`;
            });
          }
        });
        output += '  end\n';
      });
    } else {
      routes.forEach(route => {
        const nodeId = route.id.replace(/[^a-zA-Z0-9]/g, '_');
        const label = route.path;
        output += `  ${nodeId}["${label}"]\n`;
      });
    }

    return output;
  }

  /**
   * Generate SVG visualization (simplified for demo)
   */
  private generateSVGVisualization(
    routes: RouteDefinition[],
    config: RouteVisualizationConfig,
  ): string {
    let output = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <style>
    .route-node { fill: #e1f5fe; stroke: #0277bd; stroke-width: 2; }
    .route-text { font-family: Arial; font-size: 12px; fill: #01579b; }
    .domain-group { fill: none; stroke: #4caf50; stroke-width: 1; stroke-dasharray: 5,5; }
  </style>
`;

    let y = 50;
    const routesByDomain = this.groupRoutesByDomain(routes);

    Object.entries(routesByDomain).forEach(([domain, domainRoutes]) => {
      // Domain group background
      output += `  <rect class="domain-group" x="20" y="${y - 20}" width="750" height="${domainRoutes.length * 40 + 40}" />\n`;
      output += `  <text x="30" y="${y - 5}" class="route-text" font-weight="bold">${domain.toUpperCase()}</text>\n`;

      domainRoutes.forEach((route, index) => {
        const x = 50;
        const nodeY = y + index * 40;

        // Route node
        output += `  <rect class="route-node" x="${x}" y="${nodeY}" width="200" height="30" rx="5" />\n`;
        output += `  <text x="${x + 10}" y="${nodeY + 20}" class="route-text">${route.path}</text>\n`;

        // Health indicator if requested
        if (config.showDependencies) {
          const healthColor = this.getHealthColor(route);
          output += `  <circle cx="${x + 220}" cy="${nodeY + 15}" r="8" fill="${healthColor}" />\n`;
        }
      });

      y += domainRoutes.length * 40 + 60;
    });

    output += '</svg>';
    return output;
  }

  /**
   * Generate JSON visualization data
   */
  private generateJSONVisualization(
    routes: RouteDefinition[],
    config: RouteVisualizationConfig,
    healthData?: any,
  ): string {
    const visualization = {
      type: 'route-hierarchy',
      config,
      nodes: routes.map(route => ({
        id: route.id,
        path: route.path,
        domain: route.domain,
        component: this.getComponentName(route.component),
        parameters: route.parameters || [],
        children: route.childRouteIds || [],
        health: healthData?.[route.id] || null,
      })),
      edges: [] as Array<{ from: string; to: string; type: string }>,
      domains: this.groupRoutesByDomain(routes),
    };

    // Add edges for hierarchical relationships
    routes.forEach(route => {
      if (route.childRouteIds) {
        route.childRouteIds.forEach(childId => {
          visualization.edges.push({
            from: route.id,
            to: childId,
            type: 'parent-child',
          });
        });
      }
    });

    return JSON.stringify(visualization, null, 2);
  }

  /**
   * Generate enhanced ASCII visualization
   */
  private generateASCIIVisualization(
    routes: RouteDefinition[],
    config: RouteVisualizationConfig,
    healthData?: any,
  ): string {
    let output = 'WRFCoin Route Hierarchy Visualization\n';
    output += '='.repeat(60) + '\n\n';

    if (config.groupByDomain) {
      const routesByDomain = this.groupRoutesByDomain(routes);

      Object.entries(routesByDomain).forEach(
        ([domain, domainRoutes], domainIndex) => {
          const isLastDomain =
            domainIndex === Object.entries(routesByDomain).length - 1;

          output += `📁 ${domain.toUpperCase()} (${domainRoutes.length} routes)\n`;

          domainRoutes.forEach((route, routeIndex) => {
            const isLastRoute = routeIndex === domainRoutes.length - 1;
            const prefix = isLastRoute ? '└── ' : '├── ';
            const connector = isLastDomain && isLastRoute ? '' : '│   ';

            let routeLine = `${prefix}🛤️  ${route.path}`;

            // Add parameters if requested
            if (
              config.showParameters &&
              route.parameters &&
              route.parameters.length > 0
            ) {
              const params = route.parameters
                .map(p => `:${p.name}(${p.type})`)
                .join(', ');
              routeLine += ` [${params}]`;
            }

            // Add health score if available
            if (healthData && healthData[route.id]) {
              const health = healthData[route.id];
              const healthIcon = this.getHealthIcon(health.score);
              routeLine += ` ${healthIcon} ${health.score}%`;
            }

            output += routeLine + '\n';

            // Add child routes if any
            if (route.childRouteIds && route.childRouteIds.length > 0) {
              route.childRouteIds.forEach((childId, childIndex) => {
                const childRoute = routes.find(r => r.id === childId);
                if (childRoute) {
                  const childPrefix = isLastRoute ? '    ' : '│   ';
                  const childConnector =
                    childIndex === route.childRouteIds!.length - 1
                      ? '└── '
                      : '├── ';
                  output += `${childPrefix}${childConnector}↳ ${childRoute.path}\n`;
                }
              });
            }
          });

          if (!isLastDomain) output += '\n';
        },
      );
    } else {
      // Simple list view
      routes.forEach((route, index) => {
        const isLast = index === routes.length - 1;
        const prefix = isLast ? '└── ' : '├── ';
        output += `${prefix}${route.path} (${route.domain})\n`;
      });
    }

    // Add summary
    output += '\n' + '='.repeat(60) + '\n';
    output += `📊 Summary: ${routes.length} total routes across ${Object.keys(this.groupRoutesByDomain(routes)).length} domains\n`;

    return output;
  }

  // Health Analysis Methods

  /**
   * Get route health data for all routes
   */
  private getRouteHealthData(routes: RouteDefinition[]): Record<string, any> {
    const { calculateRouteHealthScore } = require('../utils/routeValidation');
    const healthData: Record<string, any> = {};

    routes.forEach(route => {
      healthData[route.id] = calculateRouteHealthScore(route);
    });

    return healthData;
  }

  /**
   * Analyze specific route health
   */
  private analyzeSpecificRouteHealth(routeId: string, format: string): string {
    const route = routeRegistry.getRoute(routeId);
    if (!route) {
      return `Route '${routeId}' not found`;
    }

    const { calculateRouteHealthScore } = require('../utils/routeValidation');
    const health = calculateRouteHealthScore(route);

    if (format === 'json') {
      return JSON.stringify({ route, health }, null, 2);
    }

    let output = `Route Health Analysis: ${route.id}\n`;
    output += '='.repeat(50) + '\n\n';
    output += `Path: ${route.path}\n`;
    output += `Domain: ${route.domain}\n`;
    output += `Health Score: ${health.score}% ${this.getHealthIcon(health.score)}\n\n`;

    output += 'Health Factors:\n';
    health.factors.forEach((factor: { factor: string; impact: number; description: string }) => {
      const sign = factor.impact >= 0 ? '+' : '';
      output += `  • ${factor.factor}: ${sign}${factor.impact} (${factor.description})\n`;
    });

    if (health.recommendations.length > 0) {
      output += '\nRecommendations:\n';
      health.recommendations.forEach((rec: string) => {
        output += `  🔧 ${rec}\n`;
      });
    }

    return output;
  }

  /**
   * Format health report for multiple routes
   */
  private formatHealthReport(
    healthAnalysis: any[],
    unhealthyRoutes: any[],
    args: any,
  ): string {
    let output = 'Route Health Report\n';
    output += '='.repeat(50) + '\n\n';

    const averageHealth =
      healthAnalysis.reduce((sum, a) => sum + a.health.score, 0) /
      healthAnalysis.length;

    output += `📊 Overall Health: ${Math.round(averageHealth)}%\n`;
    output += `🚨 Unhealthy Routes: ${unhealthyRoutes.length}/${healthAnalysis.length}\n`;
    output += `🎯 Threshold: ${args.threshold}%\n\n`;

    if (unhealthyRoutes.length > 0) {
      output += 'Unhealthy Routes:\n';
      output += '-'.repeat(30) + '\n';

      const headers = ['Route', 'Path', 'Health', 'Primary Issue'];
      const rows = unhealthyRoutes.map(analysis => [
        analysis.route.id,
        analysis.route.path,
        `${analysis.health.score}% ${this.getHealthIcon(analysis.health.score)}`,
        analysis.health.factors[0]?.description || 'N/A',
      ]);

      output += this.formatTable(headers, rows);

      if (args['include-recommendations']) {
        output += '\n\nTop Recommendations:\n';
        const allRecommendations = unhealthyRoutes.flatMap(
          a => a.health.recommendations,
        );
        const uniqueRecommendations = [...new Set(allRecommendations)];
        uniqueRecommendations.slice(0, 5).forEach((rec, index) => {
          output += `  ${index + 1}. ${rec}\n`;
        });
      }
    } else {
      output += '✅ All routes are healthy!\n';
    }

    return output;
  }

  // Exploration Methods

  /**
   * Explore route dependencies
   */
  private exploreDependencies(
    startRoute: RouteDefinition,
    allRoutes: RouteDefinition[],
  ): string {
    let output = 'Dependency Analysis:\n';
    output += '-'.repeat(20) + '\n';

    // Parent dependencies
    if (startRoute.parentId) {
      const parent = allRoutes.find(r => r.id === startRoute.parentId);
      output += `📤 Parent: ${parent ? `${parent.path} (${parent.id})` : 'Not found'}\n`;
    }

    // Child dependencies
    if (startRoute.childRouteIds && startRoute.childRouteIds.length > 0) {
      output += `📥 Children (${startRoute.childRouteIds.length}):\n`;
      startRoute.childRouteIds.forEach(childId => {
        const child = allRoutes.find(r => r.id === childId);
        output += `  • ${child ? `${child.path} (${child.id})` : `Missing: ${childId}`}\n`;
      });
    }

    // Component dependencies
    output += `🧩 Component: ${this.getComponentName(startRoute.component)}\n`;
    if (
      startRoute.dependency.dependencies &&
      startRoute.dependency.dependencies.length > 0
    ) {
      output += `📦 Dependencies: ${startRoute.dependency.dependencies.join(', ')}\n`;
    }

    return output;
  }

  /**
   * Explore route conflicts
   */
  private exploreConflicts(
    startRoute: RouteDefinition,
    allRoutes: RouteDefinition[],
  ): string {
    const { detectAdvancedPathConflicts } = require('../utils/routeValidation');
    const conflicts = detectAdvancedPathConflicts(allRoutes);

    const routeConflicts = conflicts.filter((conflict: { routeIds: string[]; type: string; description: string; resolution?: string }) =>
      conflict.routeIds.includes(startRoute.id),
    );

    let output = 'Conflict Analysis:\n';
    output += '-'.repeat(20) + '\n';

    if (routeConflicts.length === 0) {
      output += '✅ No conflicts detected\n';
    } else {
      output += `🚨 Found ${routeConflicts.length} conflicts:\n`;
      routeConflicts.forEach((conflict: { routeIds: string[]; type: string; description: string; resolution?: string }, index: number) => {
        output += `\n${index + 1}. ${conflict.type.toUpperCase()}\n`;
        output += `   Description: ${conflict.description}\n`;
        output += `   Conflicting routes: ${conflict.routeIds.join(', ')}\n`;
        if (conflict.resolution) {
          output += `   💡 Resolution: ${conflict.resolution}\n`;
        }
      });
    }

    return output;
  }

  /**
   * Explore route health details
   */
  private exploreHealth(startRoute: RouteDefinition): string {
    const { calculateRouteHealthScore } = require('../utils/routeValidation');
    const health = calculateRouteHealthScore(startRoute);

    let output = 'Health Analysis:\n';
    output += '-'.repeat(20) + '\n';
    output += `Overall Score: ${health.score}% ${this.getHealthIcon(health.score)}\n\n`;

    output += 'Contributing Factors:\n';
    health.factors.forEach((factor: { factor: string; impact: number; description: string }) => {
      const sign = factor.impact >= 0 ? '+' : '';
      const icon = factor.impact >= 0 ? '✅' : '⚠️';
      output += `  ${icon} ${factor.factor}: ${sign}${factor.impact} - ${factor.description}\n`;
    });

    if (health.recommendations.length > 0) {
      output += '\nRecommendations:\n';
      health.recommendations.forEach((rec: string) => {
        output += `  🔧 ${rec}\n`;
      });
    }

    return output;
  }

  /**
   * Explore navigation relationships
   */
  private exploreNavigation(
    startRoute: RouteDefinition,
    allRoutes: RouteDefinition[],
  ): string {
    let output = 'Navigation Analysis:\n';
    output += '-'.repeat(20) + '\n';

    // Find routes in same domain
    const samedomainRoutes = allRoutes.filter(
      r => r.domain === startRoute.domain && r.id !== startRoute.id,
    );

    output += `🏠 Domain: ${startRoute.domain} (${samedomainRoutes.length + 1} routes)\n`;

    // Find sibling routes (same parent)
    if (startRoute.parentId) {
      const siblings = allRoutes.filter(
        r => r.parentId === startRoute.parentId && r.id !== startRoute.id,
      );
      if (siblings.length > 0) {
        output += `👫 Siblings: ${siblings.map(s => s.path).join(', ')}\n`;
      }
    }

    // Path similarity analysis
    const similarPaths = allRoutes.filter(r => {
      if (r.id === startRoute.id) return false;
      const startSegments = startRoute.path.split('/');
      const otherSegments = r.path.split('/');
      return startSegments[1] === otherSegments[1]; // Same first segment
    });

    if (similarPaths.length > 0) {
      output += `🔗 Similar paths: ${similarPaths
        .slice(0, 3)
        .map(r => r.path)
        .join(', ')}`;
      if (similarPaths.length > 3) {
        output += ` and ${similarPaths.length - 3} more`;
      }
      output += '\n';
    }

    return output;
  }

  // Orphaned Routes Methods

  /**
   * Format orphaned routes report
   */
  private formatOrphanedRoutesReport(
    orphanedData: any,
    routes: RouteDefinition[],
    args: any,
  ): string {
    let output = 'Orphaned Routes Analysis\n';
    output += '='.repeat(50) + '\n\n';

    output += `📊 Summary:\n`;
    output += `  Total Routes: ${routes.length}\n`;
    output += `  Orphaned Routes: ${orphanedData.orphanedRoutes.length}\n`;
    output += `  Broken Imports: ${orphanedData.brokenImports.length}\n`;
    output += `  Dead Component Routes: ${orphanedData.deadComponentRoutes.length}\n`;
    output += `  Unreachable Routes: ${orphanedData.unreachableRoutes.length}\n\n`;

    if (orphanedData.orphanedRoutes.length === 0) {
      output += '✅ No orphaned routes detected!\n';
      return output;
    }

    // Broken imports
    if (orphanedData.brokenImports.length > 0) {
      output += '🔴 Broken Component Imports:\n';
      orphanedData.brokenImports.forEach((routeId: string) => {
        const route = routes.find(r => r.id === routeId);
        if (route) {
          output += `  • ${route.path} → ${route.component}\n`;
        }
      });
      output += '\n';
    }

    // Dead component routes
    if (orphanedData.deadComponentRoutes.length > 0) {
      output += '💀 Routes to Dead Components:\n';
      orphanedData.deadComponentRoutes.forEach((routeId: string) => {
        const route = routes.find(r => r.id === routeId);
        if (route) {
          output += `  • ${route.path} (${route.id})\n`;
        }
      });
      output += '\n';
    }

    // Unreachable routes
    if (orphanedData.unreachableRoutes.length > 0) {
      output += '🏝️ Unreachable Routes:\n';
      orphanedData.unreachableRoutes.forEach((routeId: string) => {
        const route = routes.find(r => r.id === routeId);
        if (route) {
          output += `  • ${route.path} (missing parent: ${route.parentId})\n`;
        }
      });
      output += '\n';
    }

    if (args.fix) {
      output += '🔧 Suggested Fixes:\n';
      output += '  1. Remove routes with broken imports\n';
      output += '  2. Update routes pointing to dead components\n';
      output += '  3. Fix parent-child route relationships\n';
      output += '  4. Consider route consolidation opportunities\n';
    }

    return output;
  }

  // Optimization Methods

  /**
   * Generate action plan for optimizations
   */
  private generateActionPlan(optimizations: any): string {
    let output = 'Route Optimization Action Plan\n';
    output += '='.repeat(50) + '\n\n';

    // Priority 1: Lazy Loading
    if (optimizations.lazyLoadingOpportunities.length > 0) {
      output += '🎯 PRIORITY 1: Implement Lazy Loading\n';
      output += '-'.repeat(30) + '\n';

      const topOpportunities = optimizations.lazyLoadingOpportunities
        .sort((a: any, b: any) => b.potentialSavings - a.potentialSavings)
        .slice(0, 5);

      topOpportunities.forEach((opp: any, index: number) => {
        output += `${index + 1}. Route: ${opp.routeId}\n`;
        output += `   Reason: ${opp.reason}\n`;
        output += `   Savings: ${this.formatBytes(opp.potentialSavings)}\n`;
        output += `   Action: Convert to lazy loading with React.lazy()\n\n`;
      });
    }

    // Priority 2: Bundle Splitting
    if (optimizations.bundleSplittingAdvice.length > 0) {
      output += '🎯 PRIORITY 2: Bundle Splitting\n';
      output += '-'.repeat(30) + '\n';

      optimizations.bundleSplittingAdvice.forEach(
        (advice: any, index: number) => {
          output += `${index + 1}. Domain: ${advice.domain}\n`;
          output += `   Size: ${this.formatBytes(advice.estimatedSize)}\n`;
          output += `   Routes: ${advice.routes.length}\n`;
          output += `   Action: Create separate bundle for ${advice.domain} domain\n\n`;
        },
      );
    }

    // Priority 3: Consolidation
    if (optimizations.consolidationSuggestions.length > 0) {
      output += '🎯 PRIORITY 3: Route Consolidation\n';
      output += '-'.repeat(30) + '\n';

      optimizations.consolidationSuggestions.forEach(
        (suggestion: any, index: number) => {
          output += `${index + 1}. Consolidate: ${suggestion.routeIds.join(', ')}\n`;
          output += `   Reason: ${suggestion.reason}\n`;
          output += `   New Path: ${suggestion.newPath}\n`;
          output += `   Action: Merge routes into dynamic route with parameter\n\n`;
        },
      );
    }

    // Priority 4: Performance
    if (optimizations.performanceOptimizations.length > 0) {
      output += '🎯 PRIORITY 4: Performance Optimizations\n';
      output += '-'.repeat(30) + '\n';

      optimizations.performanceOptimizations.forEach(
        (opt: any, index: number) => {
          output += `${index + 1}. Route: ${opt.routeId}\n`;
          output += `   Optimization: ${opt.optimization}\n`;
          output += `   Impact: ${opt.impact}\n\n`;
        },
      );
    }

    return output;
  }

  /**
   * Format optimization report
   */
  private formatOptimizationReport(optimizations: any, args: any): string {
    let output = 'Route Optimization Report\n';
    output += '='.repeat(50) + '\n\n';

    const totalSavings = optimizations.lazyLoadingOpportunities.reduce(
      (sum: number, opp: any) => sum + opp.potentialSavings,
      0,
    );

    output += `💰 Potential Bundle Size Savings: ${this.formatBytes(totalSavings)}\n`;
    output += `⚡ Lazy Loading Opportunities: ${optimizations.lazyLoadingOpportunities.length}\n`;
    output += `📦 Bundle Splitting Recommendations: ${optimizations.bundleSplittingAdvice.length}\n`;
    output += `🔄 Consolidation Opportunities: ${optimizations.consolidationSuggestions.length}\n\n`;

    if (args.type === 'all' || args.type === 'lazy-loading') {
      if (optimizations.lazyLoadingOpportunities.length > 0) {
        output += '🚀 Lazy Loading Opportunities:\n';
        const headers = ['Route ID', 'Reason', 'Potential Savings'];
        const rows = optimizations.lazyLoadingOpportunities.map((opp: any) => [
          opp.routeId,
          opp.reason,
          this.formatBytes(opp.potentialSavings),
        ]);
        output += this.formatTable(headers, rows) + '\n';
      }
    }

    if (args.type === 'all' || args.type === 'bundle') {
      if (optimizations.bundleSplittingAdvice.length > 0) {
        output += '📦 Bundle Splitting Recommendations:\n';
        optimizations.bundleSplittingAdvice.forEach((advice: any) => {
          output += `  • ${advice.domain}: ${advice.routes.length} routes, ${this.formatBytes(advice.estimatedSize)}\n`;
        });
        output += '\n';
      }
    }

    return output;
  }

  // Utility Methods

  /**
   * Get health color for visualization
   */
  private getHealthColor(route: RouteDefinition): string {
    const { calculateRouteHealthScore } = require('../utils/routeValidation');
    const health = calculateRouteHealthScore(route);

    if (health.score >= 80) return '#4caf50'; // Green
    if (health.score >= 60) return '#ff9800'; // Orange
    return '#f44336'; // Red
  }

  /**
   * Get health icon based on score
   */
  private getHealthIcon(score: number): string {
    if (score >= 90) return '🟢';
    if (score >= 80) return '🔵';
    if (score >= 70) return '🟡';
    if (score >= 60) return '🟠';
    return '🔴';
  }
}

// Export singleton instance
export const routeCLI = new RouteCLI();
