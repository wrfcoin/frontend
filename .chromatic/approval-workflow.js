// Chromatic Visual Approval Workflow Configuration
// Automates visual change approval process for large component libraries

module.exports = {
  // Approval rules configuration
  approvalRules: {
    // Auto-approve changes for specific component types
    autoApprove: {
      // Documentation and example components
      patterns: ['stories/examples/**', 'stories/documentation/**', '**/*.mdx'],

      // Minor visual changes (pixel threshold)
      threshold: {
        pixel: 0.1, // Auto-approve changes affecting <0.1% of pixels
        component: 5, // Auto-approve if <5 components changed
      },

      // Specific change types
      changeTypes: [
        'text-content', // Text changes without layout impact
        'color-adjustment', // Minor color tweaks
        'spacing-micro', // Micro spacing adjustments (<2px)
      ],
    },

    // Require design team approval
    requireDesignApproval: {
      patterns: [
        'common/**', // Core design system components
        'Dashboard/**', // Main user interfaces
        'wallet/**', // Financial interfaces
        'NFT/**', // Customer-facing components
      ],

      changeTypes: [
        'layout-change', // Any layout modifications
        'color-major', // Significant color changes
        'typography', // Font or text styling changes
        'component-structure', // Component hierarchy changes
      ],
    },

    // Require security team approval
    requireSecurityApproval: {
      patterns: [
        'wallet/**', // Financial components
        'Security/**', // Security-related components
        'CrossChain/**', // Bridge interfaces
        'Governance/**', // Voting interfaces
      ],

      changeTypes: [
        'input-field', // Form input changes
        'button-action', // Action button modifications
        'validation-ui', // Validation interface changes
      ],
    },
  },

  // Notification configuration
  notifications: {
    // Slack integration
    slack: {
      channels: {
        design: '#design-review',
        frontend: '#frontend-team',
        security: '#security-review',
      },

      // Message templates
      templates: {
        visualChanges: {
          title: '🎨 Visual Changes Detected',
          fields: [
            'Component(s): {{components}}',
            'Change Type: {{changeType}}',
            'Author: {{author}}',
            'PR: {{pullRequest}}',
          ],
        },

        approvalRequired: {
          title: '👀 Visual Approval Required',
          fields: [
            'Components: {{components}}',
            'Reviewer: {{reviewer}}',
            'Deadline: {{deadline}}',
            'Chromatic Link: {{chromaticUrl}}',
          ],
        },
      },
    },

    // Email notifications
    email: {
      // Design team notifications
      design: {
        recipients: ['design-team@wrfcoin.io'],
        template: 'design-review-required',
      },

      // Security team notifications
      security: {
        recipients: ['security-team@wrfcoin.io'],
        template: 'security-review-required',
      },
    },
  },

  // Approval workflow stages
  workflowStages: [
    {
      name: 'automatic-analysis',
      description: 'AI-powered change analysis',
      actions: [
        'categorize-changes',
        'assess-impact',
        'apply-auto-approval-rules',
      ],
    },

    {
      name: 'team-notification',
      description: 'Notify relevant teams',
      conditions: {
        requiresApproval: true,
      },
      actions: [
        'send-slack-notification',
        'assign-reviewers',
        'set-review-deadline',
      ],
    },

    {
      name: 'review-process',
      description: 'Human review and approval',
      actions: [
        'collect-approvals',
        'track-review-progress',
        'escalate-if-overdue',
      ],
    },

    {
      name: 'finalization',
      description: 'Apply approved changes',
      conditions: {
        allApprovalsReceived: true,
      },
      actions: ['update-baselines', 'merge-pull-request', 'notify-completion'],
    },
  ],

  // Team definitions and responsibilities
  teams: {
    design: {
      members: [
        'design-lead@wrfcoin.io',
        'ui-designer@wrfcoin.io',
        'ux-designer@wrfcoin.io',
      ],
      responsibilities: [
        'visual-consistency',
        'brand-compliance',
        'user-experience',
      ],
      approvalWeight: 2, // Design approval counts as 2 votes
    },

    frontend: {
      members: ['frontend-lead@wrfcoin.io', 'senior-developer@wrfcoin.io'],
      responsibilities: [
        'technical-implementation',
        'component-architecture',
        'performance-impact',
      ],
      approvalWeight: 1,
    },

    security: {
      members: ['security-lead@wrfcoin.io', 'security-engineer@wrfcoin.io'],
      responsibilities: [
        'security-implications',
        'user-data-protection',
        'financial-interfaces',
      ],
      approvalWeight: 3, // Security approval is critical
    },
  },

  // SLA and deadlines
  sla: {
    // Review deadlines by priority
    reviewDeadlines: {
      critical: '4 hours', // Security-related changes
      high: '24 hours', // User-facing components
      medium: '3 days', // Internal components
      low: '1 week', // Documentation/examples
    },

    // Escalation rules
    escalation: {
      // Auto-escalate if no response
      noResponse: {
        after: '2 days',
        action: 'escalate-to-manager',
      },

      // Auto-approve minor changes if overdue
      autoApproveOverdue: {
        after: '1 week',
        conditions: ['low-priority', 'minor-changes'],
      },
    },
  },

  // Integration with GitHub
  github: {
    // Status checks configuration
    statusChecks: {
      required: [
        'chromatic/visual-review',
        'design/approval',
        'security/approval',
      ],

      // Branch protection rules
      branchProtection: {
        main: {
          requiredApprovals: 2,
          includeAdmins: true,
        },
      },
    },

    // PR comment templates
    prComments: {
      visualChangesDetected: `
## 🎨 Visual Changes Detected

Chromatic has detected visual changes in this PR. Please review the changes in the [Chromatic dashboard]({{chromaticUrl}}).

### Components Affected:
{{#each components}}
- {{name}} ({{changeType}})
{{/each}}

### Required Approvals:
{{#each requiredApprovals}}
- [ ] {{team}} team approval
{{/each}}

### Review Guidelines:
- Ensure changes align with design system
- Verify accessibility standards
- Check responsive behavior
- Validate security implications (if applicable)
      `,

      approvalComplete: `
## ✅ Visual Review Complete

All required approvals have been received. Visual changes have been approved and baselines updated.

### Approved By:
{{#each approvals}}
- {{reviewer}} ({{team}}) - {{timestamp}}
{{/each}}
      `,
    },
  },

  // Metrics and reporting
  metrics: {
    // Track approval workflow performance
    tracking: [
      'time-to-approval',
      'approval-rates',
      'escalation-frequency',
      'auto-approval-accuracy',
    ],

    // Weekly reporting
    reports: {
      weekly: {
        recipients: ['team-leads@wrfcoin.io'],
        metrics: [
          'components-changed',
          'approval-time-average',
          'blocked-prs',
          'team-response-times',
        ],
      },
    },
  },

  // Advanced features
  advancedFeatures: {
    // AI-powered change analysis
    aiAnalysis: {
      enabled: true,
      capabilities: [
        'change-categorization',
        'impact-assessment',
        'approval-recommendation',
      ],
    },

    // Component dependency tracking
    dependencyTracking: {
      enabled: true,
      trackDependents: true, // Track components that depend on changed ones
      notifyDependentOwners: true,
    },

    // A/B testing integration
    abTesting: {
      enabled: false, // Can be enabled for gradual rollouts
      platforms: ['optimizely', 'launchdarkly'],
    },
  },
};
