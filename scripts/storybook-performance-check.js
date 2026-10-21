#!/usr/bin/env node

/**
 * Storybook Performance Check Script
 *
 * Monitors Storybook build performance and story generation metrics for large component libraries.
 * Designed to work with 328+ components and provide optimization recommendations.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class StorybookPerformanceChecker {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.storybookDir = path.join(this.projectRoot, '.storybook');
    this.reportsDir = path.join(this.projectRoot, 'reports');
    this.performanceThresholds = {
      storyGeneration: {
        maxTime: 60000, // 60 seconds
        warnTime: 30000, // 30 seconds
      },
      storybookBuild: {
        maxTime: 180000, // 3 minutes
        warnTime: 120000, // 2 minutes
      },
      totalStories: {
        expected: 300,
        minimum: 250,
      },
      buildSize: {
        maxSizeMB: 100,
        warnSizeMB: 75,
      },
    };
  }

  async run() {
    try {
      console.log('⚡ Running Storybook Performance Check...');

      // Ensure reports directory exists
      if (!fs.existsSync(this.reportsDir)) {
        fs.mkdirSync(this.reportsDir, { recursive: true });
      }

      const performanceMetrics = {
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      };

      // Check story generation performance
      const storyGenMetrics = await this.checkStoryGeneration();
      Object.assign(performanceMetrics, { storyGeneration: storyGenMetrics });

      // Check Storybook build performance
      const buildMetrics = await this.checkStorybookBuild();
      Object.assign(performanceMetrics, { storybookBuild: buildMetrics });

      // Analyze build output
      const outputMetrics = this.analyzeBuildOutput();
      Object.assign(performanceMetrics, { buildOutput: outputMetrics });

      // Calculate performance score
      const performanceScore =
        this.calculatePerformanceScore(performanceMetrics);
      performanceMetrics.performanceScore = performanceScore;

      // Generate recommendations
      const recommendations = this.generateRecommendations(performanceMetrics);
      performanceMetrics.recommendations = recommendations;

      // Save performance report
      this.savePerformanceReport(performanceMetrics);

      // Output results
      this.outputResults(performanceMetrics);

      // Determine exit code based on performance
      const exitCode = this.determineExitCode(performanceMetrics);
      process.exit(exitCode);
    } catch (error) {
      console.error('❌ Storybook performance check failed:', error.message);
      process.exit(1);
    }
  }

  async checkStoryGeneration() {
    console.log('🔄 Measuring story generation performance...');

    const startTime = Date.now();
    let generatedStories = 0;
    let errors = [];

    try {
      // Clean up previous generated stories
      const generatedDir = path.join(this.storybookDir, 'generated');
      if (fs.existsSync(generatedDir)) {
        const cleanupStart = Date.now();
        execSync(`rm -rf ${generatedDir}`, { cwd: this.projectRoot });
        console.log(
          `🧹 Cleaned up previous stories in ${Date.now() - cleanupStart}ms`
        );
      }

      // Run story generation
      const output = execSync('npm run storybook:generate', {
        cwd: this.projectRoot,
        encoding: 'utf8',
        timeout: this.performanceThresholds.storyGeneration.maxTime,
      });

      // Count generated stories
      if (fs.existsSync(generatedDir)) {
        const storyFiles = this.findStoryFiles(generatedDir);
        generatedStories = storyFiles.length;
      }
    } catch (error) {
      errors.push(error.message);
      console.error('⚠️ Story generation encountered errors:', error.message);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    return {
      duration,
      generatedStories,
      storiesPerSecond:
        generatedStories > 0
          ? Math.round((generatedStories / duration) * 1000)
          : 0,
      success: errors.length === 0,
      errors,
      performance: this.evaluatePerformance(
        duration,
        this.performanceThresholds.storyGeneration
      ),
    };
  }

  async checkStorybookBuild() {
    console.log('🏗️ Measuring Storybook build performance...');

    const startTime = Date.now();
    let success = false;
    let errors = [];
    let buildOutput = '';

    try {
      // Clean previous build
      const staticDir = path.join(this.projectRoot, 'storybook-static');
      if (fs.existsSync(staticDir)) {
        execSync(`rm -rf ${staticDir}`, { cwd: this.projectRoot });
      }

      // Run Storybook build
      buildOutput = execSync('npm run ci:storybook-build', {
        cwd: this.projectRoot,
        encoding: 'utf8',
        timeout: this.performanceThresholds.storybookBuild.maxTime,
      });

      success = fs.existsSync(staticDir);
    } catch (error) {
      errors.push(error.message);
      console.error('⚠️ Storybook build encountered errors:', error.message);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    return {
      duration,
      success,
      errors,
      buildOutput: buildOutput.slice(-500), // Keep last 500 chars for debugging
      performance: this.evaluatePerformance(
        duration,
        this.performanceThresholds.storybookBuild
      ),
    };
  }

  analyzeBuildOutput() {
    console.log('📊 Analyzing build output...');

    const staticDir = path.join(this.projectRoot, 'storybook-static');

    if (!fs.existsSync(staticDir)) {
      return {
        buildExists: false,
        buildSizeMB: 0,
        fileCount: 0,
        storiesDetected: 0,
      };
    }

    // Calculate build size
    const buildSize = this.calculateDirectorySize(staticDir);
    const buildSizeMB = Math.round((buildSize / (1024 * 1024)) * 100) / 100;

    // Count files
    const fileCount = this.countFiles(staticDir);

    // Detect stories in the build
    const storiesDetected = this.detectStoriesInBuild(staticDir);

    return {
      buildExists: true,
      buildSizeMB,
      fileCount,
      storiesDetected,
      performance: this.evaluateBuildSize(buildSizeMB),
    };
  }

  findStoryFiles(directory) {
    const storyFiles = [];

    if (!fs.existsSync(directory)) {
      return storyFiles;
    }

    const files = fs.readdirSync(directory, { withFileTypes: true });

    for (const file of files) {
      const fullPath = path.join(directory, file.name);

      if (file.isDirectory()) {
        storyFiles.push(...this.findStoryFiles(fullPath));
      } else if (file.name.includes('.stories.')) {
        storyFiles.push(fullPath);
      }
    }

    return storyFiles;
  }

  calculateDirectorySize(directory) {
    let totalSize = 0;

    if (!fs.existsSync(directory)) {
      return totalSize;
    }

    const files = fs.readdirSync(directory, { withFileTypes: true });

    for (const file of files) {
      const fullPath = path.join(directory, file.name);

      if (file.isDirectory()) {
        totalSize += this.calculateDirectorySize(fullPath);
      } else {
        const stats = fs.statSync(fullPath);
        totalSize += stats.size;
      }
    }

    return totalSize;
  }

  countFiles(directory) {
    let fileCount = 0;

    if (!fs.existsSync(directory)) {
      return fileCount;
    }

    const files = fs.readdirSync(directory, { withFileTypes: true });

    for (const file of files) {
      const fullPath = path.join(directory, file.name);

      if (file.isDirectory()) {
        fileCount += this.countFiles(fullPath);
      } else {
        fileCount++;
      }
    }

    return fileCount;
  }

  detectStoriesInBuild(staticDir) {
    try {
      // Look for stories.json or similar files that indicate story count
      const storiesJsonPath = path.join(staticDir, 'stories.json');
      if (fs.existsSync(storiesJsonPath)) {
        const storiesData = JSON.parse(
          fs.readFileSync(storiesJsonPath, 'utf8')
        );
        return Object.keys(storiesData.stories || {}).length;
      }

      // Fallback: count story files in the build
      const storyFiles = this.findStoryFiles(staticDir);
      return storyFiles.length;
    } catch (error) {
      console.warn('⚠️ Could not detect stories in build:', error.message);
      return 0;
    }
  }

  evaluatePerformance(duration, thresholds) {
    if (duration <= thresholds.warnTime) {
      return 'excellent';
    } else if (duration <= thresholds.maxTime) {
      return 'acceptable';
    } else {
      return 'poor';
    }
  }

  evaluateBuildSize(sizeMB) {
    if (sizeMB <= this.performanceThresholds.buildSize.warnSizeMB) {
      return 'excellent';
    } else if (sizeMB <= this.performanceThresholds.buildSize.maxSizeMB) {
      return 'acceptable';
    } else {
      return 'poor';
    }
  }

  calculatePerformanceScore(metrics) {
    let score = 100;

    // Story generation performance (40% weight)
    if (metrics.storyGeneration.performance === 'poor') {
      score -= 20;
    } else if (metrics.storyGeneration.performance === 'acceptable') {
      score -= 10;
    }

    // Build performance (40% weight)
    if (metrics.storybookBuild.performance === 'poor') {
      score -= 20;
    } else if (metrics.storybookBuild.performance === 'acceptable') {
      score -= 10;
    }

    // Build output quality (20% weight)
    if (metrics.buildOutput.performance === 'poor') {
      score -= 10;
    } else if (metrics.buildOutput.performance === 'acceptable') {
      score -= 5;
    }

    // Story count penalty/bonus
    const expectedStories = this.performanceThresholds.totalStories.expected;
    const actualStories = metrics.storyGeneration.generatedStories;

    if (actualStories < this.performanceThresholds.totalStories.minimum) {
      score -= 15; // Major penalty for too few stories
    } else if (actualStories >= expectedStories) {
      score += 5; // Bonus for meeting expectations
    }

    // Errors penalty
    const totalErrors =
      metrics.storyGeneration.errors.length +
      metrics.storybookBuild.errors.length;
    score -= totalErrors * 5;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  generateRecommendations(metrics) {
    const recommendations = [];

    // Story generation recommendations
    if (metrics.storyGeneration.performance === 'poor') {
      recommendations.push({
        priority: 'high',
        category: 'story-generation',
        title: 'Optimize story generation performance',
        description: `Story generation took ${Math.round(metrics.storyGeneration.duration / 1000)}s, exceeding the ${Math.round(this.performanceThresholds.storyGeneration.maxTime / 1000)}s threshold`,
        suggestions: [
          'Implement incremental story generation',
          'Cache generated stories between runs',
          'Parallelize story generation for components',
          'Reduce component analysis complexity',
        ],
      });
    }

    // Build performance recommendations
    if (metrics.storybookBuild.performance === 'poor') {
      recommendations.push({
        priority: 'high',
        category: 'build-performance',
        title: 'Optimize Storybook build performance',
        description: `Build took ${Math.round(metrics.storybookBuild.duration / 1000)}s, exceeding the ${Math.round(this.performanceThresholds.storybookBuild.maxTime / 1000)}s threshold`,
        suggestions: [
          'Enable Webpack build caching',
          'Optimize Storybook configuration',
          'Reduce bundle size with code splitting',
          'Consider parallel builds for large component sets',
        ],
      });
    }

    // Build size recommendations
    if (metrics.buildOutput.performance === 'poor') {
      recommendations.push({
        priority: 'medium',
        category: 'build-size',
        title: 'Reduce build size',
        description: `Build size is ${metrics.buildOutput.buildSizeMB}MB, exceeding the ${this.performanceThresholds.buildSize.maxSizeMB}MB threshold`,
        suggestions: [
          'Enable asset compression',
          'Optimize images and static assets',
          'Remove unused dependencies',
          'Implement lazy loading for stories',
        ],
      });
    }

    // Story count recommendations
    if (
      metrics.storyGeneration.generatedStories <
      this.performanceThresholds.totalStories.minimum
    ) {
      recommendations.push({
        priority: 'medium',
        category: 'story-coverage',
        title: 'Improve story coverage',
        description: `Only ${metrics.storyGeneration.generatedStories} stories generated, below minimum of ${this.performanceThresholds.totalStories.minimum}`,
        suggestions: [
          'Ensure all components have auto-generated stories',
          'Check component discovery patterns',
          'Review component export conventions',
          'Fix story generation errors',
        ],
      });
    }

    // Error handling recommendations
    if (
      metrics.storyGeneration.errors.length > 0 ||
      metrics.storybookBuild.errors.length > 0
    ) {
      recommendations.push({
        priority: 'high',
        category: 'error-handling',
        title: 'Fix build errors',
        description: 'Errors detected during story generation or build process',
        suggestions: [
          'Review error logs for specific issues',
          'Check component dependencies and imports',
          'Validate TypeScript configurations',
          'Ensure all required dependencies are installed',
        ],
      });
    }

    return recommendations;
  }

  savePerformanceReport(metrics) {
    const reportFile = path.join(this.reportsDir, 'storybook-performance.json');
    const markdownFile = path.join(this.reportsDir, 'storybook-performance.md');

    // Save JSON report
    fs.writeFileSync(reportFile, JSON.stringify(metrics, null, 2));

    // Generate Markdown report
    const markdown = this.generateMarkdownReport(metrics);
    fs.writeFileSync(markdownFile, markdown);

    console.log(`📊 Performance report saved to: ${reportFile}`);
    console.log(`📝 Markdown report saved to: ${markdownFile}`);
  }

  generateMarkdownReport(metrics) {
    const performanceEmoji = {
      excellent: '🟢',
      acceptable: '🟡',
      poor: '🔴',
    };

    let markdown = `# ⚡ Storybook Performance Report

## Overall Performance Score: ${metrics.performanceScore}/100

Generated: ${new Date(metrics.timestamp).toLocaleString()}

## 📊 Performance Metrics

### Story Generation
- **Duration:** ${Math.round(metrics.storyGeneration.duration / 1000)}s ${performanceEmoji[metrics.storyGeneration.performance]}
- **Stories Generated:** ${metrics.storyGeneration.generatedStories}
- **Generation Rate:** ${metrics.storyGeneration.storiesPerSecond} stories/second
- **Success:** ${metrics.storyGeneration.success ? '✅' : '❌'}

### Storybook Build
- **Duration:** ${Math.round(metrics.storybookBuild.duration / 1000)}s ${performanceEmoji[metrics.storybookBuild.performance]}
- **Success:** ${metrics.storybookBuild.success ? '✅' : '❌'}

### Build Output
- **Build Size:** ${metrics.buildOutput.buildSizeMB}MB ${performanceEmoji[metrics.buildOutput.performance]}
- **File Count:** ${metrics.buildOutput.fileCount}
- **Stories in Build:** ${metrics.buildOutput.storiesDetected}

## 🎯 Performance Thresholds

| Metric | Excellent | Acceptable | Poor | Current |
|--------|-----------|------------|------|---------|
| Story Generation | <${Math.round(this.performanceThresholds.storyGeneration.warnTime / 1000)}s | <${Math.round(this.performanceThresholds.storyGeneration.maxTime / 1000)}s | >${Math.round(this.performanceThresholds.storyGeneration.maxTime / 1000)}s | ${Math.round(metrics.storyGeneration.duration / 1000)}s |
| Build Time | <${Math.round(this.performanceThresholds.storybookBuild.warnTime / 1000)}s | <${Math.round(this.performanceThresholds.storybookBuild.maxTime / 1000)}s | >${Math.round(this.performanceThresholds.storybookBuild.maxTime / 1000)}s | ${Math.round(metrics.storybookBuild.duration / 1000)}s |
| Build Size | <${this.performanceThresholds.buildSize.warnSizeMB}MB | <${this.performanceThresholds.buildSize.maxSizeMB}MB | >${this.performanceThresholds.buildSize.maxSizeMB}MB | ${metrics.buildOutput.buildSizeMB}MB |

`;

    if (metrics.recommendations && metrics.recommendations.length > 0) {
      markdown += `## 💡 Recommendations

`;
      metrics.recommendations.forEach(rec => {
        const priorityEmoji =
          rec.priority === 'high'
            ? '🚨'
            : rec.priority === 'medium'
              ? '⚠️'
              : '💡';
        markdown += `### ${priorityEmoji} ${rec.title}

**Priority:** ${rec.priority}  
**Category:** ${rec.category}

${rec.description}

**Suggestions:**
${rec.suggestions.map(s => `- ${s}`).join('\n')}

`;
      });
    }

    markdown += `## 🔧 System Information

- **Node Version:** ${metrics.nodeVersion}
- **Platform:** ${metrics.platform}
- **Architecture:** ${metrics.arch}
- **Timestamp:** ${metrics.timestamp}

---
*Generated by Storybook Performance Checker v1.0*`;

    return markdown;
  }

  outputResults(metrics) {
    console.log('\n⚡ Storybook Performance Summary:');
    console.log(`Overall Score: ${metrics.performanceScore}/100`);
    console.log(
      `Story Generation: ${Math.round(metrics.storyGeneration.duration / 1000)}s (${metrics.storyGeneration.performance})`
    );
    console.log(
      `Storybook Build: ${Math.round(metrics.storybookBuild.duration / 1000)}s (${metrics.storybookBuild.performance})`
    );
    console.log(
      `Generated Stories: ${metrics.storyGeneration.generatedStories}`
    );
    console.log(
      `Build Size: ${metrics.buildOutput.buildSizeMB}MB (${metrics.buildOutput.performance})`
    );

    if (metrics.recommendations.length > 0) {
      console.log(
        `\n💡 ${metrics.recommendations.length} optimization recommendations available`
      );
      metrics.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec.title} (${rec.priority} priority)`);
      });
    }
  }

  determineExitCode(metrics) {
    // Fail if performance score is critically low
    if (metrics.performanceScore < 50) {
      console.log('❌ Performance score too low for CI/CD pipeline');
      return 1;
    }

    // Fail if there are critical errors
    if (!metrics.storyGeneration.success || !metrics.storybookBuild.success) {
      console.log('❌ Critical build failures detected');
      return 1;
    }

    // Warn but don't fail for performance issues
    if (metrics.performanceScore < 70) {
      console.log('⚠️ Performance could be improved but build is acceptable');
      return 0;
    }

    console.log('✅ Storybook performance is optimal');
    return 0;
  }
}

// Run the performance check
if (require.main === module) {
  const checker = new StorybookPerformanceChecker();
  checker.run().catch(error => {
    console.error('❌ Performance check failed:', error);
    process.exit(1);
  });
}

module.exports = StorybookPerformanceChecker;
