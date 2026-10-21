import type { Preview } from '@storybook/react-vite';
import '../src/index.css';

const preview: Preview = {
  parameters: {
    // Enhanced controls configuration
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
      expanded: true,
      sort: 'requiredFirst',
    },

    // Documentation configuration
    docs: {
      page: null, // Use custom documentation page
      extractComponentDescription: (component, { notes }) => {
        if (notes) {
          return typeof notes === 'string'
            ? notes
            : notes.markdown || notes.text;
        }
        return null;
      },
      source: {
        state: 'open',
        type: 'dynamic',
      },
    },

    // Chromatic viewport configuration for cross-device testing
    viewport: {
      options: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1200px',
            height: '800px',
          },
        },
        large: {
          name: 'Large Desktop',
          styles: {
            width: '1440px',
            height: '900px',
          },
        },
      }
    },

    // Background variations for visual testing
    backgrounds: {
      options: {
        light: {
          name: 'light',
          value: '#ffffff',
        },

        dark: {
          name: 'dark',
          value: '#1a1a1a',
        },

        gray: {
          name: 'gray',
          value: '#f5f5f5',
        },

        blue: {
          name: 'blue',
          value: '#e3f2fd',
        }
      }
    },

    // Accessibility testing configuration
    a11y: {
      context: '#storybook-root',
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
          {
            id: 'focus-order',
            enabled: true,
          },
          {
            id: 'keyboard',
            enabled: true,
          },
        ],
      },
      options: {
        checks: { 'color-contrast': { options: { noScroll: true } } },
        restoreScroll: true,
      },
    },

    // Chromatic-specific parameters
    chromatic: {
      // Ensure consistent rendering across environments
      modes: {
        // Test on different viewports
        mobile: { viewport: 'mobile' },
        tablet: { viewport: 'tablet' },
        desktop: { viewport: 'desktop' },

        // Test with different backgrounds
        lightTheme: { backgrounds: { value: '#ffffff' } },
        darkTheme: { backgrounds: { value: '#1a1a1a' } },
      },

      // Performance optimization for large component libraries
      delay: 300, // Wait 300ms after story loads before screenshot

      // Disable animations for consistent screenshots
      disableSnapshot: false,
      pauseAnimationAtEnd: true,
    },

    // Layout configuration for better visual testing
    layout: 'centered',

    // Actions configuration for interaction testing
    actions: {
      argTypesRegex: '^on[A-Z].*',
    },
  },

  // Global types for consistent prop controls
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },

  initialGlobals: {
    viewport: {
      value: 'desktop',
      isRotated: false
    },

    backgrounds: {
      value: 'light'
    }
  }
};

export default preview;
