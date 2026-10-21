// Chromatic Performance Configuration for Large Component Libraries
// Optimized for 328+ auto-generated component stories

module.exports = {
  // Batch processing configuration
  batchSize: 50, // Process 50 components at a time

  // Parallel execution settings
  concurrency: 4, // Run 4 parallel browser instances

  // Viewport optimization for cross-device testing
  viewports: [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1200, height: 800 },
    { name: 'large', width: 1440, height: 900 },
  ],

  // Browser configuration for cross-browser testing
  browsers: ['chrome', 'firefox', 'safari', 'edge'],

  // Component categories for prioritized testing
  testPriorities: {
    // High priority: User-facing components
    high: [
      'common/StatusBadge',
      'common/Icons',
      'common/Tooltip',
      'wallet/WalletOverview',
      'wallet/TransactionHistory',
      'Dashboard/OptimizedDashboard',
      'NFT/UnifiedNFTDashboard',
      'Governance/GovernanceDashboard',
    ],

    // Medium priority: Feature-specific components
    medium: [
      'MinerDashboard/**',
      'CrossChain/**',
      'Analytics/**',
      'Explorer/**',
      'Security/**',
    ],

    // Low priority: Integration and settings components
    low: ['Integrations/**', 'Settings/**', 'Developer/**', 'Resources/**'],
  },

  // Smart change detection patterns
  changeDetection: {
    // File patterns that should trigger visual tests
    include: [
      'src/components/**/*.{jsx,tsx}',
      'src/stories/**/*.stories.{js,ts}',
      'src/styles/**/*.{css,scss}',
      '.storybook/**/*',
    ],

    // File patterns that should be ignored
    exclude: [
      'src/**/*.test.{js,ts}',
      'src/**/*.spec.{js,ts}',
      '**/*.md',
      '**/package.json',
      '**/README.md',
    ],
  },

  // Performance optimizations
  optimization: {
    // Only test changed components and their dependencies
    onlyChanged: true,

    // Skip stories with specific tags
    skipTags: ['experimental', 'deprecated', 'internal'],

    // Component interaction delays (ms)
    delays: {
      hover: 100,
      focus: 50,
      click: 200,
    },

    // Screenshot optimization
    screenshot: {
      quality: 90, // Balance between quality and file size
      format: 'webp', // Use WebP for better compression
      fullPage: false, // Only capture component area
      clip: true, // Clip to component bounds
    },

    // Network optimization
    network: {
      timeout: 30000, // 30 second timeout
      retries: 3,
      uploadConcurrency: 2,
    },
  },

  // Component-specific configurations
  componentConfigs: {
    // Dashboard components need more time to load
    'Dashboard/**': {
      waitFor: 'networkidle0',
      delay: 1000,
    },

    // Charts need animation completion
    'Dashboard/Charts/**': {
      waitFor: 'networkidle0',
      delay: 2000,
    },

    // Mining components have real-time updates
    'MinerDashboard/**': {
      waitFor: 'networkidle2',
      delay: 1500,
    },

    // Cross-chain components need network data
    'CrossChain/**': {
      waitFor: 'networkidle0',
      delay: 1000,
    },
  },

  // GitHub Actions specific optimizations
  ci: {
    // Use faster builds in CI
    parallel: true,

    // Reduced quality for faster CI runs
    screenshotQuality: 80,

    // Skip certain browsers in CI for speed
    skipBrowsers: ['safari'], // Safari can be tested weekly

    // Timeout configurations
    timeouts: {
      story: 30000,
      build: 1800000, // 30 minutes max
    },
  },

  // Error handling and resilience
  resilience: {
    // Retry failed screenshots
    retryFailedScreenshots: 3,

    // Continue on errors (don't fail entire suite)
    continueOnError: true,

    // Error reporting
    reportErrors: true,

    // Fallback strategies
    fallbacks: {
      // Use previous baseline if new one fails
      usePreviousBaseline: true,

      // Skip problematic components temporarily
      skipOnRepeatedFailure: true,
    },
  },
};
