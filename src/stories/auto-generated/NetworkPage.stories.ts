import type { Meta, StoryObj } from '@storybook/react';
import NetworkPage from '../../Settings/NetworkPage.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof NetworkPage> = {
  title: 'Components/Settings/NetworkPage',
  component: NetworkPage,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# NetworkPage

A high-complexity component from the Settings category.

## Features
- **Props**: 0 documented properties
- **Complexity**: High
- **Dependencies**: react
- **Lines of Code**: 336

## Usage Guidelines
This component uses React hooks and manages internal state.
It does not require any props.

## Accessibility
- Keyboard navigation: ❓ To be verified
- Screen reader support: ❓ To be verified
- Focus management: ❓ To be verified
        `,
      },
    },
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'focus-order', enabled: true },
          { id: 'keyboard', enabled: true },
        ],
      },
    },
  },
  tags: ['autodocs', 'a11y'],
  argTypes: {
    // No props detected
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story showing the component in its standard state
export const Default: Story = {
  args: {
    // No props detected
  },
};

// Interactive story with user interactions
export const Interactive: Story = {
  args: {
    // No props detected
  },
  play: async ({ canvasElement, args }) => {
    const canvas = canvasElement;
    const component = canvas.querySelector(
      '[role], [aria-label], button, input, a',
    );
    if (component) {
      devLog(`${component.tagName} rendered successfully with props:`, args);
      devLog('Accessibility features detected:', {
        role: component.getAttribute('role'),
        ariaLabel: component.getAttribute('aria-label'),
        tabIndex: component.getAttribute('tabindex'),
      });
    }
  },
};

// Accessibility testing story
export const AccessibilityTest: Story = {
  args: {
    // No props detected
  },
  parameters: {
    a11y: {
      element: '#storybook-root',
      manual: false,
    },
  },
};

// Responsive testing story
export const ResponsiveTest: Story = {
  args: {
    // No props detected
  },
  parameters: {
    viewport: {
      viewports: {
        mobile: { name: 'Mobile', styles: { width: '375px', height: '667px' } },
        tablet: {
          name: 'Tablet',
          styles: { width: '768px', height: '1024px' },
        },
        desktop: {
          name: 'Desktop',
          styles: { width: '1200px', height: '800px' },
        },
      },
    },
    chromatic: {
      modes: {
        mobile: { viewport: 'mobile' },
        tablet: { viewport: 'tablet' },
        desktop: { viewport: 'desktop' },
      },
    },
  },
};
