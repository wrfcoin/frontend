// This file has been automatically migrated to valid ESM format by Storybook.
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';
import path, { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config: StorybookConfig = {
  stories: [
    '../src/stories/**/*.mdx',
    '../src/stories/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    getAbsolutePath("@storybook/addon-onboarding"),
    getAbsolutePath("@storybook/addon-links"),
    getAbsolutePath("@storybook/addon-a11y"),
    // Additional enterprise addons for comprehensive documentation
    {
      name: getAbsolutePath("@storybook/addon-docs"),
      options: {
        configureJSX: true,
        babelOptions: {},
        sourceLoaderOptions: null,
        transcludeMarkdown: true,
      },
    }
  ],
  framework: {
    name: getAbsolutePath("@storybook/react-vite"),
    options: {},
  },
  async viteFinal(config, { configType }) {
    // Merge custom configuration with default Storybook Vite config
    return mergeConfig(config, {
      // Set up path aliases for clean imports
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '../src'),
          '@components': path.resolve(__dirname, '../src/components'),
          '@styles': path.resolve(__dirname, '../src/styles'),
          '@utils': path.resolve(__dirname, '../src/utils'),
          '@assets': path.resolve(__dirname, '../src/assets'),
          '@services': path.resolve(__dirname, '../src/services'),
          '@hooks': path.resolve(__dirname, '../src/hooks'),
          '@contexts': path.resolve(__dirname, '../src/contexts'),
        },
      },
      // Optimize dependency pre-bundling
      optimizeDeps: {
        include: [
          'react',
          'react-dom',
          'react-router',
          '@mui/material',
          '@mui/icons-material',
          '@emotion/react',
          '@emotion/styled',
          'chart.js',
          'react-chartjs-2',
          'd3',
          'axios',
          'bootstrap',
        ],
      },
      // Enable CSS preprocessing
      css: {
        preprocessorOptions: {
          scss: {
            additionalData: `@import "../src/styles/theme.css";`,
          },
        },
      },
    });
  },
  // Configure TypeScript for better component prop detection
  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      propFilter: prop =>
        prop.parent ? !/node_modules/.test(prop.parent.fileName) : true,
      compilerOptions: {
        allowSyntheticDefaultImports: false,
        esModuleInterop: false,
      },
    },
  },
  // Enhanced documentation configuration
  docs: {
    defaultName: 'Documentation'
  },
  // Feature flags for enhanced documentation
  features: {
    argTypeTargetsV7: true,
    buildStoriesJson: true,
  },
};

export default config;

function getAbsolutePath(value: string): any {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}
