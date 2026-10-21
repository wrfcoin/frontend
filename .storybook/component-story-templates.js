/**
 * WRFCoin Component Story Templates
 *
 * Standardized templates for different component types with proper naming conventions
 * and best practices for Storybook stories.
 */

/**
 * Component Type Templates
 * Each template includes proper naming, organization, and story variants
 */

/**
 * Functional Component Template - Basic components without state
 */
export const FUNCTIONAL_COMPONENT_TEMPLATE = {
  name: 'Functional',
  description: 'Simple presentational components without internal state',
  template: (
    componentPath,
    componentName,
    props,
    category
  ) => `import type { Meta, StoryObj } from '@storybook/react-vite';
import { action } from '@storybook/addon-actions';
import ${componentName} from '${componentPath}';

const meta: Meta<typeof ${componentName}> = {
  title: '${category}/${componentName}',
  component: ${componentName},
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '${componentName} is a functional component that ${generateDescription(componentName, category)}.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
${generateArgTypes(props)}
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story - standard component state
export const Default: Story = {
  args: {
${generateDefaultArgs(props)}
  },
};

// With all props populated
export const Complete: Story = {
  args: {
${generateCompleteArgs(props)}
  },
};

// Interactive variant for testing user interactions
export const Interactive: Story = {
  args: {
${generateInteractiveArgs(props)}
  },
  play: async ({ canvasElement, args }) => {
    // Test component functionality
    console.log('${componentName} rendered with args:', args);
  },
};
`,
};

/**
 * Hook-based Component Template - Components using React hooks
 */
export const HOOKS_COMPONENT_TEMPLATE = {
  name: 'Hooks',
  description: 'Components with internal state and lifecycle hooks',
  template: (
    componentPath,
    componentName,
    props,
    category
  ) => `import type { Meta, StoryObj } from '@storybook/react-vite';
import { action } from '@storybook/addon-actions';
import { expect, userEvent, within } from 'storybook/test';
import ${componentName} from '${componentPath}';

const meta: Meta<typeof ${componentName}> = {
  title: '${category}/${componentName}',
  component: ${componentName},
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: '${componentName} is a stateful component that ${generateDescription(componentName, category)}. It manages internal state using React hooks.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
${generateArgTypes(props)}
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story with initial state
export const Default: Story = {
  args: {
${generateDefaultArgs(props)}
  },
};

// Loading state
export const Loading: Story = {
  args: {
${generateLoadingArgs(props)}
  },
};

// Error state
export const Error: Story = {
  args: {
${generateErrorArgs(props)}
  },
};

// Interactive testing with user events
export const UserInteraction: Story = {
  args: {
${generateInteractiveArgs(props)}
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    
    // Test component interactions
    const component = canvasElement.querySelector('[data-testid="${componentName.toLowerCase()}"]');
    if (component) {
      console.log('${componentName} interaction test passed');
    }
    
    // Add specific interaction tests based on component type
    ${generateInteractionTests(componentName, category)}
  },
};
`,
};

/**
 * Page Component Template - Route-level components
 */
export const PAGE_COMPONENT_TEMPLATE = {
  name: 'Page',
  description: 'Full page components for routing',
  template: (
    componentPath,
    componentName,
    props,
    category
  ) => `import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router';
import { action } from '@storybook/addon-actions';
import ${componentName} from '${componentPath}';

const meta: Meta<typeof ${componentName}> = {
  title: 'Pages/${componentName}',
  component: ${componentName},
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'responsive'
    },
    docs: {
      description: {
        component: '${componentName} is a page component that ${generateDescription(componentName, category)}. It represents a full application view.'
      }
    }
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/${componentName.toLowerCase()}']}>
        <Story />
      </MemoryRouter>
    ),
  ],
  argTypes: {
${generateArgTypes(props)}
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default page view
export const Default: Story = {
  args: {
${generateDefaultArgs(props)}
  },
};

// Mobile view
export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    }
  },
  args: {
${generateDefaultArgs(props)}
  },
};

// Tablet view
export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet'
    }
  },
  args: {
${generateDefaultArgs(props)}
  },
};

// Desktop view with expanded content
export const Desktop: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop'
    }
  },
  args: {
${generateCompleteArgs(props)}
  },
};
`,
};

/**
 * Dashboard Component Template - Complex dashboard widgets
 */
export const DASHBOARD_COMPONENT_TEMPLATE = {
  name: 'Dashboard',
  description: 'Data visualization and monitoring components',
  template: (
    componentPath,
    componentName,
    props,
    category
  ) => `import type { Meta, StoryObj } from '@storybook/react-vite';
import { action } from '@storybook/addon-actions';
import ${componentName} from '${componentPath}';

// Mock data generators for dashboard components
const generateMockData = () => ({
  // Add component-specific mock data
  ${generateMockDataForDashboard(componentName)}
});

const meta: Meta<typeof ${componentName}> = {
  title: 'Dashboard/${componentName}',
  component: ${componentName},
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#1a1a1a' },
        { name: 'light', value: '#ffffff' }
      ]
    },
    docs: {
      description: {
        component: '${componentName} is a dashboard component that ${generateDescription(componentName, category)}. It displays real-time data and metrics.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
${generateArgTypes(props)}
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default dashboard view
export const Default: Story = {
  args: {
    ...generateMockData(),
${generateDefaultArgs(props)}
  },
};

// With live data
export const LiveData: Story = {
  args: {
    ...generateMockData(),
    isLive: true,
${generateDefaultArgs(props)}
  },
};

// Loading state
export const Loading: Story = {
  args: {
    isLoading: true,
${generateDefaultArgs(props)}
  },
};

// Error state
export const Error: Story = {
  args: {
    error: 'Failed to load dashboard data',
${generateDefaultArgs(props)}
  },
};

// High contrast theme
export const HighContrast: Story = {
  parameters: {
    backgrounds: { default: 'light' }
  },
  args: {
    ...generateMockData(),
    theme: 'high-contrast',
${generateDefaultArgs(props)}
  },
};
`,
};

/**
 * Form Component Template - Input and form-related components
 */
export const FORM_COMPONENT_TEMPLATE = {
  name: 'Form',
  description: 'Form inputs and validation components',
  template: (
    componentPath,
    componentName,
    props,
    category
  ) => `import type { Meta, StoryObj } from '@storybook/react-vite';
import { action } from '@storybook/addon-actions';
import { expect, userEvent, within } from 'storybook/test';
import ${componentName} from '${componentPath}';

const meta: Meta<typeof ${componentName}> = {
  title: 'Forms/${componentName}',
  component: ${componentName},
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '${componentName} is a form component that ${generateDescription(componentName, category)}. It handles user input and validation.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
${generateArgTypes(props)}
    onChange: { action: 'changed' },
    onSubmit: { action: 'submitted' },
    onValidate: { action: 'validated' }
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default form state
export const Default: Story = {
  args: {
${generateDefaultArgs(props)}
    onChange: action('onChange'),
    onSubmit: action('onSubmit')
  },
};

// With validation errors
export const WithErrors: Story = {
  args: {
${generateDefaultArgs(props)}
    errors: {
      email: 'Please enter a valid email address',
      password: 'Password must be at least 8 characters'
    },
    onChange: action('onChange'),
    onSubmit: action('onSubmit')
  },
};

// Disabled state
export const Disabled: Story = {
  args: {
${generateDefaultArgs(props)}
    disabled: true,
    onChange: action('onChange'),
    onSubmit: action('onSubmit')
  },
};

// Form interaction test
export const FormInteraction: Story = {
  args: {
${generateDefaultArgs(props)}
    onChange: action('onChange'),
    onSubmit: action('onSubmit')
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    
    // Test form interactions
    ${generateFormInteractionTests(componentName)}
  },
};
`,
};

/**
 * Utility Functions for Template Generation
 */

function generateDescription(componentName, category) {
  const descriptions = {
    Dashboard: 'displays real-time metrics and analytics',
    Governance: 'manages governance and voting functionality',
    Wallet: 'handles wallet operations and transactions',
    Mining: 'provides mining operations and statistics',
    NFT: 'manages NFT creation and marketplace functionality',
    Bridge: 'facilitates cross-chain operations',
    Analytics: 'visualizes network and performance data',
    Security: 'implements security and authentication features',
    Integration: 'connects with external services and protocols',
  };

  return (
    descriptions[category] || `provides ${category.toLowerCase()} functionality`
  );
}

function generateArgTypes(props) {
  if (!props.length)
    return '    // Auto-generated argTypes - customize as needed';

  return props
    .map(prop => {
      const controlType = getControlType(prop.type);
      return `    ${prop.name}: { 
      control: '${controlType}',
      description: '${prop.name} prop${prop.required ? ' (required)' : ' (optional)'}',
      table: {
        type: { summary: '${prop.type}' },
        defaultValue: { summary: '${getDefaultValue(prop.type)}' }
      }
    }`;
    })
    .join(',\n');
}

function generateDefaultArgs(props) {
  if (!props.length) return '    // No props detected';

  return props
    .map(prop => {
      return `    ${prop.name}: ${getDefaultValue(prop.type)}`;
    })
    .join(',\n');
}

function generateCompleteArgs(props) {
  return props
    .map(prop => {
      return `    ${prop.name}: ${getCompleteValue(prop.type, prop.name)}`;
    })
    .join(',\n');
}

function generateInteractiveArgs(props) {
  return props
    .map(prop => {
      if (prop.type.includes('function') || prop.type.includes('func')) {
        return `    ${prop.name}: action('${prop.name}')`;
      }
      return `    ${prop.name}: ${getDefaultValue(prop.type)}`;
    })
    .join(',\n');
}

function generateLoadingArgs(props) {
  const loadingProps = props
    .map(prop => {
      if (prop.name.includes('loading') || prop.name.includes('Loading')) {
        return `    ${prop.name}: true`;
      }
      return `    ${prop.name}: ${getDefaultValue(prop.type)}`;
    })
    .join(',\n');

  return loadingProps || '    isLoading: true';
}

function generateErrorArgs(props) {
  const errorProps = props
    .map(prop => {
      if (prop.name.includes('error') || prop.name.includes('Error')) {
        return `    ${prop.name}: 'Sample error message'`;
      }
      return `    ${prop.name}: ${getDefaultValue(prop.type)}`;
    })
    .join(',\n');

  return errorProps || '    error: "Sample error message"';
}

function generateMockDataForDashboard(componentName) {
  const dashboardMocks = {
    metrics: '42',
    data: '[1, 2, 3, 4, 5]',
    timestamp: 'new Date().toISOString()',
    isConnected: 'true',
    status: '"active"',
  };

  return Object.entries(dashboardMocks)
    .map(([key, value]) => `${key}: ${value}`)
    .join(',\n  ');
}

function generateInteractionTests(componentName, category) {
  const testsByCategory = {
    Dashboard: 'await expect(component).toBeInTheDocument();',
    Form: `
    const submitButton = canvas.getByRole('button', { name: /submit/i });
    if (submitButton) {
      await userEvent.click(submitButton);
    }`,
    Button: `
    const button = canvas.getByRole('button');
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalled();`,
    Modal: `
    const closeButton = canvas.queryByRole('button', { name: /close/i });
    if (closeButton) {
      await userEvent.click(closeButton);
    }`,
  };

  return (
    testsByCategory[category] || 'await expect(component).toBeInTheDocument();'
  );
}

function generateFormInteractionTests(componentName) {
  return `
    // Test form field interactions
    const inputs = canvas.getAllByRole('textbox');
    if (inputs.length > 0) {
      await userEvent.type(inputs[0], 'test input');
    }
    
    const submitButton = canvas.queryByRole('button', { name: /submit/i });
    if (submitButton) {
      await userEvent.click(submitButton);
      await expect(args.onSubmit).toHaveBeenCalled();
    }`;
}

function getControlType(propType) {
  const typeMap = {
    string: 'text',
    number: 'number',
    boolean: 'boolean',
    bool: 'boolean',
    array: 'object',
    object: 'object',
    function: 'action',
    func: 'action',
    node: 'text',
    element: 'text',
  };

  return typeMap[propType.toLowerCase()] || 'text';
}

function getDefaultValue(propType) {
  const defaultValues = {
    string: "'Sample text'",
    number: '42',
    boolean: 'false',
    bool: 'false',
    array: '[]',
    object: '{}',
    function: '() => {}',
    func: '() => {}',
    node: "'Sample content'",
    element: "'<div>Sample element</div>'",
  };

  return defaultValues[propType.toLowerCase()] || "'default value'";
}

function getCompleteValue(propType, propName) {
  const completeValues = {
    string: `'Complete ${propName} value'`,
    number: '100',
    boolean: 'true',
    bool: 'true',
    array: '[1, 2, 3, 4, 5]',
    object: '{ key: "value", nested: { data: true } }',
    function: `action('${propName}')`,
    func: `action('${propName}')`,
    node: `'<div>Complete ${propName} content</div>'`,
    element: `'<div>Complete ${propName} element</div>'`,
  };

  return completeValues[propType.toLowerCase()] || `'complete ${propName}'`;
}

/**
 * Template Selection Logic
 */
export function selectTemplate(componentData) {
  const { name, type, complexity, filePath } = componentData;

  // Page components
  if (filePath.includes('/pages/') || name.endsWith('Page')) {
    return PAGE_COMPONENT_TEMPLATE;
  }

  // Dashboard components
  if (filePath.includes('/Dashboard/') || name.includes('Dashboard')) {
    return DASHBOARD_COMPONENT_TEMPLATE;
  }

  // Form components
  if (
    filePath.includes('/Form/') ||
    name.includes('Form') ||
    filePath.includes('Input') ||
    filePath.includes('Field')
  ) {
    return FORM_COMPONENT_TEMPLATE;
  }

  // Hook-based components (complex state management)
  if (type === 'hooks' || complexity >= 5) {
    return HOOKS_COMPONENT_TEMPLATE;
  }

  // Default to functional component template
  return FUNCTIONAL_COMPONENT_TEMPLATE;
}

export const COMPONENT_TEMPLATES = {
  FUNCTIONAL_COMPONENT_TEMPLATE,
  HOOKS_COMPONENT_TEMPLATE,
  PAGE_COMPONENT_TEMPLATE,
  DASHBOARD_COMPONENT_TEMPLATE,
  FORM_COMPONENT_TEMPLATE,
};
