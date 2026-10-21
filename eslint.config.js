// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";
import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

// ---------------------------------------------------------------------------
// Custom ESLint plugin: no-bootstrap-classes
// Warns when Bootstrap CSS classes are used in JSX className attributes.
// This guards against growing Bootstrap usage while the codebase migrates
// to MUI and the WRFCoin DesignSystem wrappers (Wrf* components).
// ---------------------------------------------------------------------------
const bootstrapPatterns = [
  { pattern: /\bbtn\b/, suggestion: 'Use <WrfButton> or MUI <Button> instead of Bootstrap "btn" classes.' },
  { pattern: /\bbtn-primary\b/, suggestion: 'Use <WrfButton variant="contained" color="primary"> instead of "btn-primary".' },
  { pattern: /\bbtn-secondary\b/, suggestion: 'Use <WrfButton variant="contained" color="secondary"> instead of "btn-secondary".' },
  { pattern: /\bcard\b/, suggestion: 'Use <WrfCard> or MUI <Card> instead of Bootstrap "card" classes.' },
  { pattern: /\bmodal\b/, suggestion: 'Use <WrfModal> or MUI <Dialog> instead of Bootstrap "modal" classes.' },
  { pattern: /\bform-control\b/, suggestion: 'Use <WrfInput> or MUI <TextField> instead of Bootstrap "form-control".' },
  { pattern: /\bcontainer\b/, suggestion: 'Use MUI <Container> or Box with sx prop instead of Bootstrap "container".' },
  { pattern: /\brow\b/, suggestion: 'Use MUI <Grid> or <Stack> instead of Bootstrap "row".' },
  { pattern: /\bcol-/, suggestion: 'Use MUI <Grid> with size props instead of Bootstrap "col-*" classes.' },
  { pattern: /\balert\b/, suggestion: 'Use <WrfAlert> or MUI <Alert> instead of Bootstrap "alert" classes.' },
  { pattern: /\bbadge\b/, suggestion: 'Use <WrfBadge> or MUI <Badge>/<Chip> instead of Bootstrap "badge" classes.' },
  { pattern: /\bnavbar\b/, suggestion: 'Use MUI <AppBar>/<Toolbar> instead of Bootstrap "navbar".' },
  { pattern: /\bnav-/, suggestion: 'Use MUI <Tabs>/<Tab> or <List> instead of Bootstrap "nav-*" classes.' },
  { pattern: /\bdropdown\b/, suggestion: 'Use MUI <Menu>/<Select> instead of Bootstrap "dropdown" classes.' },
];

const noBootstrapClassesPlugin = {
  rules: {
    'no-bootstrap-classes': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Warn when Bootstrap CSS classes are used in JSX className attributes. Prefer MUI / WRFCoin DesignSystem (Wrf*) components.',
        },
        schema: [],
        messages: {
          bootstrapClass: '{{ suggestion }} (no-new-bootstrap: Migrate to MUI/DesignSystem wrappers)',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            // Only inspect className attributes
            if (node.name.name !== 'className') return;

            // Handle className="..." (string literal)
            if (node.value && node.value.type === 'Literal' && typeof node.value.value === 'string') {
              checkValue(context, node.value, node.value.value);
              return;
            }

            // Handle className={`...`} (template literal)
            if (
              node.value &&
              node.value.type === 'JSXExpressionContainer' &&
              node.value.expression.type === 'TemplateLiteral'
            ) {
              for (const quasi of node.value.expression.quasis) {
                checkValue(context, quasi, quasi.value.raw);
              }
              return;
            }

            // Handle className={"..."} (string in expression container)
            if (
              node.value &&
              node.value.type === 'JSXExpressionContainer' &&
              node.value.expression.type === 'Literal' &&
              typeof node.value.expression.value === 'string'
            ) {
              checkValue(context, node.value.expression, node.value.expression.value);
            }
          },
        };

        function checkValue(context, reportNode, str) {
          for (const { pattern, suggestion } of bootstrapPatterns) {
            if (pattern.test(str)) {
              context.report({
                node: reportNode,
                messageId: 'bootstrapClass',
                data: { suggestion },
              });
              // Report only the first matching pattern per node to avoid noise
              return;
            }
          }
        }
      },
    },
  },
};

const browserGlobals = {
  // Browser environment globals
  window: 'readonly',
  document: 'readonly',
  navigator: 'readonly',
  console: 'readonly',
  localStorage: 'readonly',
  sessionStorage: 'readonly',
  FormData: 'readonly',
  File: 'readonly',
  Blob: 'readonly',
  // Web APIs
  fetch: 'readonly',
  Request: 'readonly',
  Response: 'readonly',
  Headers: 'readonly',
  URL: 'readonly',
  URLSearchParams: 'readonly',
  WebSocket: 'readonly',
  XMLHttpRequest: 'readonly',
  TextEncoder: 'readonly',
  TextDecoder: 'readonly',
  performance: 'readonly',
  HTMLElement: 'readonly',
  HTMLButtonElement: 'readonly',
  HTMLDivElement: 'readonly',
  HTMLInputElement: 'readonly',
  HTMLTextAreaElement: 'readonly',
  HTMLFormElement: 'readonly',
  HTMLAnchorElement: 'readonly',
  HTMLImageElement: 'readonly',
  HTMLSpanElement: 'readonly',
  HTMLCanvasElement: 'readonly',
  SVGElement: 'readonly',
  ServiceWorkerRegistration: 'readonly',
  NotificationPermission: 'readonly',
  PushSubscription: 'readonly',
  BufferSource: 'readonly',
  NotificationOptions: 'readonly',
  MessageChannel: 'readonly',
  WakeLockSentinel: 'readonly',
  ShareData: 'readonly',
  Storage: 'readonly',
  location: 'readonly',
  crypto: 'readonly',
  // Missing globals that were causing errors
  indexedDB: 'readonly',
  IDBKeyRange: 'readonly',
  DOMParser: 'readonly',
  // Browser dialog/notification APIs
  alert: 'readonly',
  confirm: 'readonly',
  prompt: 'readonly',
  Notification: 'readonly',
  // Browser observer/callback APIs
  ResizeObserver: 'readonly',
  MutationObserver: 'readonly',
  IntersectionObserver: 'readonly',
  requestIdleCallback: 'readonly',
  // Server-sent events
  EventSource: 'readonly',
  // Encoding APIs
  btoa: 'readonly',
  atob: 'readonly',
  // Node.js globals (used in node_os/ and test files)
  global: 'readonly',
  Buffer: 'readonly',
  setImmediate: 'readonly',
  // Timer functions
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  requestAnimationFrame: 'readonly',
  cancelAnimationFrame: 'readonly',
  // Events
  Event: 'readonly',
  CustomEvent: 'readonly',
  EventTarget: 'readonly',
  // Test globals
  describe: 'readonly',
  it: 'readonly',
  expect: 'readonly',
  test: 'readonly',
  beforeEach: 'readonly',
  afterEach: 'readonly',
  beforeAll: 'readonly',
  afterAll: 'readonly',
  jest: 'readonly',
  // React globals
  React: 'readonly',
  ReactDOM: 'readonly',
  // Node.js globals (for build scripts)
  process: 'readonly',
  module: 'readonly',
  require: 'readonly',
  __dirname: 'readonly',
  __filename: 'readonly',
  // Vite globals
  import: 'readonly',
};

const commonRules = {
  'no-unused-vars': 'off', // Handle via TS specifically or disable for now
  'no-console': 'warn',
  'prefer-const': 'error',
  'no-var': 'error',
  semi: ['error', 'always'],
  quotes: ['error', 'single'],
  indent: ['error', 2],
  'comma-dangle': ['error', 'always-multiline'],
  'no-trailing-spaces': 'error',
  'eol-last': 'error',
};

export default [
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: browserGlobals,
    },
    rules: {
      ...commonRules,
      'no-unused-vars': 'warn',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: browserGlobals,
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...commonRules,
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  // ---------------------------------------------------------------------------
  // Bootstrap class usage guard.
  // ---------------------------------------------------------------------------
  {
    files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
    plugins: {
      'wrfcoin-design': noBootstrapClassesPlugin,
    },
    rules: {
      'wrfcoin-design/no-bootstrap-classes': 'warn',
    },
  },
  // ---------------------------------------------------------------------------
  // Design system import guardrails - warn on deprecated import paths in new TS files.
  // ---------------------------------------------------------------------------
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'no-restricted-imports': ['warn', {
        patterns: [
          {
            group: ['*/components/ui/*', '*/components/ui'],
            message: 'Deprecated: import from @/components/DesignSystem instead.',
          },
          {
            group: ['*/components/common/Button', '*/components/common/Card'],
            message: 'Deprecated: use WrfButton/WrfCard from @/components/DesignSystem.',
          },
          {
            group: [
              '@mui/material/Button',
              '@mui/material/Card',
              '@mui/material/Chip',
              '@mui/material/TextField',
              '@mui/material/Tooltip',
              '@mui/material/Alert',
              '@mui/material/Skeleton',
              '@mui/material/Dialog',
              '@mui/material/Tabs',
            ],
            message: 'Use Wrf* wrappers from @/components/DesignSystem for consistent theming.',
          },
        ],
      }],
    },
  },
  {
    files: ['**/*.stories.*', '**/*.story.*'],
    rules: {
      'no-console': 'off',
      'no-unused-vars': 'off',
    },
  },
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'storybook-static/**',
      '*.min.js',
      'coverage/**',
      'docs/**',
      'test-results/**',
      'playwright-report/**',
      '**/*.d.ts',
    ],
  },
  ...storybook.configs["flat/recommended"]
];
