#!/usr/bin/env node

/**
 * Component Health Check Script
 *
 * Analyzes component health metrics and generates actionable reports for CI/CD pipeline.
 * This script is designed to work with the component analysis data and provide
 * smart failure thresholds for automated deployment decisions.
 */

const fs = require('fs');
const path = require('path');

class ComponentHealthChecker {
  constructor() {
    this.reportsDir = path.join(__dirname, '..', 'reports');
    this.analysisFile = path.join(this.reportsDir, 'component-analysis.json');
    this.healthConfig = {
      // Failure thresholds
      maxHighRiskComponents: 5,
      maxDeadComponents: 25,
      maxOrphanedComponents: 20,
      maxSuspiciousComponents: 20,

      // Warning thresholds
      warnHighRiskComponents: 3,
      warnDeadComponents: 15,
      warnOrphanedComponents: 10,
      warnSuspiciousComponents: 10,

      // Health score weights
      weights: {
        deadComponent: -2,
        orphanedComponent: -1.5,
        suspiciousComponent: -1,
        highRiskComponent: -5,
        storybookCoverage: 0.5,
      },
    };
  }

  async run() {
    try {
      console.log('🏥 Running Component Health Check...');

      // Ensure reports directory exists
      if (!fs.existsSync(this.reportsDir)) {
        fs.mkdirSync(this.reportsDir, { recursive: true });
      }

      // Load component analysis data
      const analysisData = this.loadAnalysisData();
      if (!analysisData) {
        console.error(
          '❌ No component analysis data found. Run component analysis first.'
        );
        process.exit(1);
      }

      // Calculate health metrics
      const healthMetrics = this.calculateHealthMetrics(analysisData);

      // Generate health report
      const healthReport = this.generateHealthReport(
        healthMetrics,
        analysisData
      );

      // Save health report
      this.saveHealthReport(healthReport);

      // Determine CI/CD action based on health
      const ciAction = this.determineCIAction(healthMetrics);

      // Output results
      this.outputResults(healthMetrics, ciAction);

      // Exit with appropriate code
      process.exit(ciAction.exitCode);
    } catch (error) {
      console.error('❌ Component health check failed:', error.message);
      process.exit(1);
    }
  }

  loadAnalysisData() {
    try {
      if (!fs.existsSync(this.analysisFile)) {
        return null;
      }

      const data = fs.readFileSync(this.analysisFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load analysis data:', error.message);
      return null;
    }
  }

  calculateHealthMetrics(analysisData) {
    const summary = analysisData.summary || {};
    const classifications = analysisData.classifications || {};

    // Count high-risk components (risk score >= 9)
    const highRiskComponents = [
      ...(classifications.dead || []).filter(c => c.riskScore >= 9),
      ...(classifications.orphaned || []).filter(c => c.riskScore >= 9),
      ...(classifications.suspicious || []).filter(c => c.riskScore >= 9),
    ];

    // Calculate health score (0-100)
    const totalComponents = summary.totalComponents || 0;
    const deadCount = summary.deadComponents || 0;
    const orphanedCount = summary.orphanedComponents || 0;
    const suspiciousCount = summary.suspiciousComponents || 0;
    const storybookCount = summary.componentsInStorybook || 0;
    const highRiskCount = highRiskComponents.length;

    let healthScore = 100;
    healthScore += deadCount * this.healthConfig.weights.deadComponent;
    healthScore += orphanedCount * this.healthConfig.weights.orphanedComponent;
    healthScore +=
      suspiciousCount * this.healthConfig.weights.suspiciousComponent;
    healthScore += highRiskCount * this.healthConfig.weights.highRiskComponent;

    // Bonus for Storybook coverage
    if (totalComponents > 0) {
      const storybookCoverage = (storybookCount / totalComponents) * 100;
      healthScore +=
        storybookCoverage * this.healthConfig.weights.storybookCoverage;
    }

    // Ensure score is between 0-100
    healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));

    return {
      healthScore,
      totalComponents,
      deadCount,
      orphanedCount,
      suspiciousCount,
      highRiskCount,
      storybookCount,
      storybookCoverage:
        totalComponents > 0
          ? Math.round((storybookCount / totalComponents) * 100)
          : 0,
      highRiskComponents: highRiskComponents.map(c => ({
        name: c.name,
        type: c.type,
        riskScore: c.riskScore,
        filePath: c.filePath,
        reason: this.getHighRiskReason(c),
      })),
    };
  }

  getHighRiskReason(component) {
    const reasons = [];

    if (component.usageCount === 0) {
      reasons.push('Never used');
    }

    if (component.riskScore === 10) {
      reasons.push('Maximum risk score');
    }

    if (component.complexity > 5) {
      reasons.push('High complexity');
    }

    if (!component.isInStorybook && !component.isInRoutes) {
      reasons.push('No documentation or routing');
    }

    return reasons.join(', ') || 'High risk score';
  }

  generateHealthReport(metrics, analysisData) {
    const timestamp = new Date().toISOString();

    const report = {
      timestamp,
      healthScore: metrics.healthScore,
      status: this.getHealthStatus(metrics.healthScore),
      metrics: {
        totalComponents: metrics.totalComponents,
        deadComponents: metrics.deadCount,
        orphanedComponents: metrics.orphanedCount,
        suspiciousComponents: metrics.suspiciousCount,
        highRiskComponents: metrics.highRiskCount,
        storybookCoverage: metrics.storybookCoverage,
      },
      thresholds: {
        failure: {
          highRiskComponents: this.healthConfig.maxHighRiskComponents,
          deadComponents: this.healthConfig.maxDeadComponents,
          orphanedComponents: this.healthConfig.maxOrphanedComponents,
          suspiciousComponents: this.healthConfig.maxSuspiciousComponents,
        },
        warning: {
          highRiskComponents: this.healthConfig.warnHighRiskComponents,
          deadComponents: this.healthConfig.warnDeadComponents,
          orphanedComponents: this.healthConfig.warnOrphanedComponents,
          suspiciousComponents: this.healthConfig.warnSuspiciousComponents,
        },
      },
      highRiskComponents: metrics.highRiskComponents,
      recommendations: this.generateRecommendations(metrics),
      analysisMetadata: analysisData.metadata,
    };

    return report;
  }

  getHealthStatus(score) {
    if (score >= 80) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 60) return 'fair';
    if (score >= 50) return 'poor';
    return 'critical';
  }

  generateRecommendations(metrics) {
    const recommendations = [];

    if (metrics.highRiskCount > this.healthConfig.maxHighRiskComponents) {
      recommendations.push({
        priority: 'critical',
        action: 'immediate_cleanup',
        description: `Remove ${metrics.highRiskCount} high-risk components immediately`,
        components: metrics.highRiskComponents.slice(0, 5).map(c => c.name),
      });
    } else if (
      metrics.highRiskCount > this.healthConfig.warnHighRiskComponents
    ) {
      recommendations.push({
        priority: 'high',
        action: 'scheduled_cleanup',
        description: `Consider removing ${metrics.highRiskCount} high-risk components in next sprint`,
        components: metrics.highRiskComponents.map(c => c.name),
      });
    }

    if (metrics.deadCount > this.healthConfig.maxDeadComponents) {
      recommendations.push({
        priority: 'medium',
        action: 'bulk_cleanup',
        description: `Run automated cleanup for ${metrics.deadCount} dead components`,
        suggestion: 'Use: npm run ci:cleanup-safe',
      });
    }

    if (metrics.storybookCoverage < 80) {
      recommendations.push({
        priority: 'low',
        action: 'improve_documentation',
        description: `Improve Storybook coverage from ${metrics.storybookCoverage}% to 80%+`,
        suggestion: 'Auto-generated stories help with discoverability',
      });
    }

    if (metrics.orphanedCount > this.healthConfig.maxOrphanedComponents) {
      recommendations.push({
        priority: 'medium',
        action: 'fix_imports',
        description: `Fix or remove ${metrics.orphanedCount} orphaned component imports`,
        suggestion: 'Use: npm run fix:dead-components',
      });
    }

    return recommendations;
  }

  determineCIAction(metrics) {
    let action = {
      decision: 'pass',
      exitCode: 0,
      message: 'Component health check passed',
      blockDeployment: false,
    };

    // Critical failures that should block deployment
    if (metrics.highRiskCount > this.healthConfig.maxHighRiskComponents) {
      action = {
        decision: 'fail',
        exitCode: 1,
        message: `Critical: ${metrics.highRiskCount} high-risk components exceed threshold of ${this.healthConfig.maxHighRiskComponents}`,
        blockDeployment: true,
      };
    } else if (metrics.deadCount > this.healthConfig.maxDeadComponents) {
      action = {
        decision: 'fail',
        exitCode: 1,
        message: `Critical: ${metrics.deadCount} dead components exceed threshold of ${this.healthConfig.maxDeadComponents}`,
        blockDeployment: true,
      };
    } else if (metrics.healthScore < 50) {
      action = {
        decision: 'fail',
        exitCode: 1,
        message: `Critical: Health score ${metrics.healthScore} is below minimum threshold of 50`,
        blockDeployment: true,
      };
    }

    // Warnings that don't block deployment but notify
    else if (
      metrics.highRiskCount > this.healthConfig.warnHighRiskComponents ||
      metrics.deadCount > this.healthConfig.warnDeadComponents ||
      metrics.healthScore < 70
    ) {
      action = {
        decision: 'warn',
        exitCode: 0,
        message: `Warning: Component health needs attention (score: ${metrics.healthScore})`,
        blockDeployment: false,
      };
    }

    return action;
  }

  saveHealthReport(report) {
    const reportFile = path.join(
      this.reportsDir,
      'component-health-report.json'
    );
    const markdownFile = path.join(
      this.reportsDir,
      'component-health-report.md'
    );

    // Save JSON report
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    // Generate Markdown report for GitHub
    const markdown = this.generateMarkdownReport(report);
    fs.writeFileSync(markdownFile, markdown);

    console.log(`📊 Health report saved to: ${reportFile}`);
    console.log(`📝 Markdown report saved to: ${markdownFile}`);
  }

  generateMarkdownReport(report) {
    const statusEmoji = {
      excellent: '🟢',
      good: '🟡',
      fair: '🟠',
      poor: '🔴',
      critical: '⚫',
    };

    const priorityEmoji = {
      critical: '🚨',
      high: '⚠️',
      medium: '🔧',
      low: '💡',
    };

    let markdown = `# 📊 Component Health Report

## Overall Health: ${statusEmoji[report.status]} ${report.healthScore}/100 (${report.status})

Generated: ${new Date(report.timestamp).toLocaleString()}

## 📈 Metrics

| Metric | Count | Status |
|--------|-------|--------|
| Total Components | ${report.metrics.totalComponents} | - |
| Dead Components | ${report.metrics.deadComponents} | ${report.metrics.deadComponents > report.thresholds.failure.deadComponents ? '🔴 Critical' : report.metrics.deadComponents > report.thresholds.warning.deadComponents ? '🟡 Warning' : '🟢 Good'} |
| Orphaned Components | ${report.metrics.orphanedComponents} | ${report.metrics.orphanedComponents > report.thresholds.failure.orphanedComponents ? '🔴 Critical' : report.metrics.orphanedComponents > report.thresholds.warning.orphanedComponents ? '🟡 Warning' : '🟢 Good'} |
| Suspicious Components | ${report.metrics.suspiciousComponents} | ${report.metrics.suspiciousComponents > report.thresholds.failure.suspiciousComponents ? '🔴 Critical' : report.metrics.suspiciousComponents > report.thresholds.warning.suspiciousComponents ? '🟡 Warning' : '🟢 Good'} |
| High-Risk Components | ${report.metrics.highRiskComponents} | ${report.metrics.highRiskComponents > report.thresholds.failure.highRiskComponents ? '🔴 Critical' : report.metrics.highRiskComponents > report.thresholds.warning.highRiskComponents ? '🟡 Warning' : '🟢 Good'} |
| Storybook Coverage | ${report.metrics.storybookCoverage}% | ${report.metrics.storybookCoverage >= 80 ? '🟢 Excellent' : report.metrics.storybookCoverage >= 60 ? '🟡 Good' : '🔴 Needs Improvement'} |

`;

    if (report.highRiskComponents && report.highRiskComponents.length > 0) {
      markdown += `## 🚨 High-Risk Components

| Component | Risk Score | Reason | File |
|-----------|------------|--------|------|
`;
      report.highRiskComponents.slice(0, 10).forEach(component => {
        markdown += `| ${component.name} | ${component.riskScore}/10 | ${component.reason} | \`${component.filePath}\` |\n`;
      });

      if (report.highRiskComponents.length > 10) {
        markdown += `\n*... and ${report.highRiskComponents.length - 10} more*\n`;
      }
      markdown += '\n';
    }

    if (report.recommendations && report.recommendations.length > 0) {
      markdown += `## 💡 Recommendations

`;
      report.recommendations.forEach(rec => {
        markdown += `### ${priorityEmoji[rec.priority]} ${rec.description}

- **Priority:** ${rec.priority}
- **Action:** ${rec.action}
`;
        if (rec.suggestion) {
          markdown += `- **Suggestion:** ${rec.suggestion}
`;
        }
        if (rec.components && rec.components.length > 0) {
          markdown += `- **Components:** ${rec.components.slice(0, 5).join(', ')}${rec.components.length > 5 ? ` (and ${rec.components.length - 5} more)` : ''}
`;
        }
        markdown += '\n';
      });
    }

    markdown += `## 🎯 Thresholds

### Failure Thresholds (Block Deployment)
- High-Risk Components: ${report.thresholds.failure.highRiskComponents}
- Dead Components: ${report.thresholds.failure.deadComponents}
- Orphaned Components: ${report.thresholds.failure.orphanedComponents}
- Suspicious Components: ${report.thresholds.failure.suspiciousComponents}

### Warning Thresholds
- High-Risk Components: ${report.thresholds.warning.highRiskComponents}
- Dead Components: ${report.thresholds.warning.deadComponents}
- Orphaned Components: ${report.thresholds.warning.orphanedComponents}
- Suspicious Components: ${report.thresholds.warning.suspiciousComponents}

---
*Generated by Component Health Checker v1.0*`;

    return markdown;
  }

  outputResults(metrics, ciAction) {
    console.log('\n📊 Component Health Summary:');
    console.log(
      `Health Score: ${metrics.healthScore}/100 (${this.getHealthStatus(metrics.healthScore)})`
    );
    console.log(`Total Components: ${metrics.totalComponents}`);
    console.log(`Dead Components: ${metrics.deadCount}`);
    console.log(`Orphaned Components: ${metrics.orphanedCount}`);
    console.log(`Suspicious Components: ${metrics.suspiciousCount}`);
    console.log(`High-Risk Components: ${metrics.highRiskCount}`);
    console.log(`Storybook Coverage: ${metrics.storybookCoverage}%`);

    console.log(`\n🎯 CI/CD Decision: ${ciAction.decision.toUpperCase()}`);
    console.log(`Message: ${ciAction.message}`);

    if (ciAction.blockDeployment) {
      console.log(
        '🚫 Deployment will be blocked due to critical component health issues'
      );
    }

    if (metrics.highRiskComponents.length > 0) {
      console.log(`\n🚨 High-Risk Components (showing first 5):`);
      metrics.highRiskComponents.slice(0, 5).forEach(component => {
        console.log(
          `  - ${component.name} (${component.riskScore}/10): ${component.reason}`
        );
      });
    }
  }
}

// Run the health check
if (require.main === module) {
  const checker = new ComponentHealthChecker();
  checker.run().catch(error => {
    console.error('❌ Health check failed:', error);
    process.exit(1);
  });
}

module.exports = ComponentHealthChecker;
