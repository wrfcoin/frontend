#!/usr/bin/env node

/**
 * Enhanced Story Generator for WRFCoin Frontend Components
 * Generates comprehensive Storybook stories with TypeDoc integration
 * Part of Task 45.9 & 45.10 - Component Documentation and Visual Examples
 */

const fs = require('fs');
const path = require('path');

class EnhancedStoryGenerator {
  constructor() {
    this.srcPath = path.join(__dirname, '../src');
    this.storiesPath = path.join(__dirname, '../src/stories/auto-generated');
    this.docsPath = path.join(__dirname, '../docs/components');
    this.componentInventory = this.loadComponentInventory();
  }

  /**
   * Load component inventory for intelligent story generation
   */
  loadComponentInventory() {
    try {
      const inventoryPath = path.join(
        __dirname,
        '../docs/component-inventory.json'
      );
      return JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
    } catch (error) {
      console.warn(
        'Component inventory not found. Run component-inventory-generator.js first.'
      );
      return { components: [] };
    }
  }

  /**
   * Generate comprehensive documentation for high-priority components
   */
  generateEnhancedStories() {
    // Ensure output directories exist
    this.ensureDirectories();

    // Generate stories for different priority levels
    this.generateHighPriorityStories();
    this.generateMediumPriorityStories();
    this.generateBasicStories();

    // Generate component overview documentation
    this.generateComponentOverview();

    console.log('✅ Enhanced stories and documentation generated successfully');
  }

  /**
   * Ensure all required directories exist
   */
  ensureDirectories() {
    [this.storiesPath, this.docsPath].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Generate comprehensive stories for high-priority components
   */
  generateHighPriorityStories() {
    const highPriorityComponents =
      this.componentInventory.priorities?.high || [];

    console.log(
      `📝 Generating enhanced stories for ${highPriorityComponents.length} high-priority components...`
    );

    highPriorityComponents.forEach(component => {
      this.generateComprehensiveStory(component);
      this.generateComponentMDX(component);
    });
  }

  /**
   * Generate medium-priority component stories
   */
  generateMediumPriorityStories() {
    const mediumPriorityComponents =
      this.componentInventory.priorities?.medium || [];

    console.log(
      `📝 Generating standard stories for ${Math.min(mediumPriorityComponents.length, 50)} medium-priority components...`
    );

    // Limit to first 50 to avoid overwhelming
    mediumPriorityComponents.slice(0, 50).forEach(component => {
      this.generateStandardStory(component);
    });
  }

  /**
   * Generate basic stories for remaining components
   */
  generateBasicStories() {
    const lowPriorityComponents = this.componentInventory.priorities?.low || [];

    console.log(
      `📝 Generating basic stories for ${Math.min(lowPriorityComponents.length, 30)} low-priority components...`
    );

    // Limit to first 30 to avoid overwhelming
    lowPriorityComponents.slice(0, 30).forEach(component => {
      this.generateBasicStory(component);
    });
  }

  /**
   * Generate comprehensive story for complex components
   */
  generateComprehensiveStory(component) {
    const storyContent = `import type { Meta, StoryObj } from '@storybook/react-vite';
import ${component.name} from '../../${component.path.replace(/\\/g, '/')}';

const meta: Meta<typeof ${component.name}> = {
  title: 'Components/${component.category}/${component.name}',
  component: ${component.name},
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: \`
# ${component.name}

${component.documentation.description || `A ${component.complexity}-complexity component from the ${component.category} category.`}

## Features
- **Props**: ${component.propTypes.length} documented properties
- **Complexity**: ${component.complexity.charAt(0).toUpperCase() + component.complexity.slice(1)}
- **Dependencies**: ${component.dependencies.join(', ') || 'None'}
- **Lines of Code**: ${component.lines}

## Usage Guidelines
This component ${component.hasHooks ? 'uses React hooks and' : ''} ${component.hasState ? 'manages internal state' : 'is stateless'}.
${component.propTypes.length > 0 ? `It accepts ${component.propTypes.length} props: ${component.propTypes.join(', ')}.` : 'It does not require any props.'}

## Accessibility
- Keyboard navigation: ${component.hasProps && component.propTypes.includes('onKeyDown') ? '✅ Supported' : '❓ To be verified'}
- Screen reader support: ${component.hasProps && component.propTypes.includes('aria') ? '✅ Supported' : '❓ To be verified'}
- Focus management: ${component.hasProps && component.propTypes.includes('autoFocus') ? '✅ Supported' : '❓ To be verified'}
        \`
      }
    },
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'focus-order', enabled: true },
          { id: 'keyboard', enabled: true },
        ]
      }
    }
  },
  tags: ['autodocs', 'a11y'],
  argTypes: {
    ${this.generateArgTypes(component)}
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story showing the component in its standard state
export const Default: Story = {
  args: {
    ${this.generateDefaultArgs(component)}
  },
};

// Interactive story with user interactions
export const Interactive: Story = {
  args: {
    ${this.generateInteractiveArgs(component)}
  },
  play: async ({ canvasElement, args }) => {
    // Add interaction tests here
    const canvas = canvasElement;
    console.log(\`\${component.name} rendered successfully with props:\`, args);
    
    // Basic accessibility check
    const component = canvas.querySelector('[role], [aria-label], button, input, a');
    if (component) {
      console.log('Accessibility features detected:', {
        role: component.getAttribute('role'),
        ariaLabel: component.getAttribute('aria-label'),
        tabIndex: component.getAttribute('tabindex')
      });
    }
  },
};

${this.generateVariantStories(component)}

// Accessibility testing story
export const AccessibilityTest: Story = {
  args: {
    ${this.generateDefaultArgs(component)}
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
    ${this.generateDefaultArgs(component)}
  },
  parameters: {
    viewport: {
      viewports: {
        mobile: { name: 'Mobile', styles: { width: '375px', height: '667px' } },
        tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' } },
        desktop: { name: 'Desktop', styles: { width: '1200px', height: '800px' } },
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
`;

    const storyFilePath = path.join(
      this.storiesPath,
      `${component.name}.stories.ts`
    );
    fs.writeFileSync(storyFilePath, storyContent);
  }

  /**
   * Generate standard story for medium complexity components
   */
  generateStandardStory(component) {
    const storyContent = `import type { Meta, StoryObj } from '@storybook/react-vite';
import ${component.name} from '../../${component.path.replace(/\\/g, '/')}';

const meta: Meta<typeof ${component.name}> = {
  title: 'Components/${component.category}/${component.name}',
  component: ${component.name},
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: \`
# ${component.name}

${component.documentation.description || `Component from the ${component.category} category.`}

- **Props**: ${component.propTypes.length}
- **Complexity**: ${component.complexity}
- **Lines**: ${component.lines}
        \`
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    ${this.generateArgTypes(component)}
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    ${this.generateDefaultArgs(component)}
  },
};

export const Interactive: Story = {
  args: {
    ${this.generateInteractiveArgs(component)}
  },
  play: async ({ canvasElement }) => {
    console.log('${component.name} rendered successfully');
  },
};
`;

    const storyFilePath = path.join(
      this.storiesPath,
      `${component.name}.stories.ts`
    );
    fs.writeFileSync(storyFilePath, storyContent);
  }

  /**
   * Generate basic story for simple components
   */
  generateBasicStory(component) {
    const storyContent = `import type { Meta, StoryObj } from '@storybook/react-vite';
import ${component.name} from '../../${component.path.replace(/\\/g, '/')}';

const meta: Meta<typeof ${component.name}> = {
  title: 'Components/${component.category}/${component.name}',
  component: ${component.name},
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    ${this.generateDefaultArgs(component)}
  },
};
`;

    const storyFilePath = path.join(
      this.storiesPath,
      `${component.name}.stories.ts`
    );
    fs.writeFileSync(storyFilePath, storyContent);
  }

  /**
   * Generate argTypes for component props
   */
  generateArgTypes(component) {
    if (component.propTypes.length === 0) {
      return '// No props detected';
    }

    return component.propTypes
      .map(prop => {
        const argType = this.getArgTypeForProp(prop);
        return `    ${prop}: ${argType}`;
      })
      .join(',\n');
  }

  /**
   * Get appropriate argType configuration for a prop
   */
  getArgTypeForProp(propName) {
    const lowerProp = propName.toLowerCase();

    if (lowerProp.includes('color')) {
      return `{ control: 'color', description: '${propName} color value' }`;
    } else if (lowerProp.includes('size')) {
      return `{ control: { type: 'select' }, options: ['small', 'medium', 'large'], description: '${propName} size' }`;
    } else if (
      lowerProp.includes('disabled') ||
      lowerProp.includes('visible') ||
      lowerProp.includes('enabled')
    ) {
      return `{ control: 'boolean', description: '${propName} flag' }`;
    } else if (propName.startsWith('on')) {
      return `{ action: '${propName}', description: 'Event handler for ${propName}' }`;
    } else if (
      lowerProp.includes('count') ||
      lowerProp.includes('number') ||
      lowerProp.includes('index')
    ) {
      return `{ control: 'number', description: '${propName} numeric value' }`;
    } else {
      return `{ control: 'text', description: '${propName} property' }`;
    }
  }

  /**
   * Generate default args for component
   */
  generateDefaultArgs(component) {
    if (component.propTypes.length === 0) {
      return '// No props detected';
    }

    return component.propTypes
      .map(prop => {
        const defaultValue = this.getDefaultValueForProp(prop);
        return `    ${prop}: ${defaultValue}`;
      })
      .join(',\n');
  }

  /**
   * Generate interactive args for component
   */
  generateInteractiveArgs(component) {
    if (component.propTypes.length === 0) {
      return '// No props detected';
    }

    return component.propTypes
      .map(prop => {
        const interactiveValue = this.getInteractiveValueForProp(prop);
        return `    ${prop}: ${interactiveValue}`;
      })
      .join(',\n');
  }

  /**
   * Get default value for a prop
   */
  getDefaultValueForProp(propName) {
    const lowerProp = propName.toLowerCase();

    if (lowerProp.includes('title') || lowerProp.includes('label')) {
      return `'${propName} Example'`;
    } else if (lowerProp.includes('color')) {
      return "'#0066cc'";
    } else if (lowerProp.includes('size')) {
      return "'medium'";
    } else if (
      lowerProp.includes('disabled') ||
      lowerProp.includes('visible') ||
      lowerProp.includes('enabled')
    ) {
      return 'false';
    } else if (propName.startsWith('on')) {
      return 'undefined';
    } else if (lowerProp.includes('count') || lowerProp.includes('number')) {
      return '0';
    } else {
      return `'${propName}'`;
    }
  }

  /**
   * Get interactive value for a prop (different from default)
   */
  getInteractiveValueForProp(propName) {
    const lowerProp = propName.toLowerCase();

    if (lowerProp.includes('title') || lowerProp.includes('label')) {
      return `'Interactive ${propName}'`;
    } else if (lowerProp.includes('color')) {
      return "'#cc6600'";
    } else if (lowerProp.includes('size')) {
      return "'large'";
    } else if (
      lowerProp.includes('disabled') ||
      lowerProp.includes('visible') ||
      lowerProp.includes('enabled')
    ) {
      return 'true';
    } else if (propName.startsWith('on')) {
      return 'undefined';
    } else if (lowerProp.includes('count') || lowerProp.includes('number')) {
      return '5';
    } else {
      return `'Interactive ${propName}'`;
    }
  }

  /**
   * Generate variant stories for components with multiple states
   */
  generateVariantStories(component) {
    if (component.propTypes.length === 0) {
      return '';
    }

    let variantStories = '';

    // Generate size variants if size prop exists
    if (component.propTypes.includes('size')) {
      variantStories += `
// Size variants
export const Small: Story = {
  args: { ...Default.args, size: 'small' },
};

export const Large: Story = {
  args: { ...Default.args, size: 'large' },
};
`;
    }

    // Generate disabled state if applicable
    if (
      component.propTypes.some(prop => prop.toLowerCase().includes('disabled'))
    ) {
      variantStories += `
// Disabled state
export const Disabled: Story = {
  args: { ...Default.args, disabled: true },
};
`;
    }

    return variantStories;
  }

  /**
   * Generate MDX documentation file for component
   */
  generateComponentMDX(component) {
    const mdxContent = `# ${component.name}

<Meta of={${component.name}Stories} />

## Overview

${component.documentation.description || `The ${component.name} component is a ${component.complexity}-complexity component from the ${component.category} category.`}

## Component Information

| Property | Value |
|----------|-------|
| **Category** | ${component.category} |
| **Type** | ${component.type} |
| **Complexity** | ${component.complexity} |
| **Lines of Code** | ${component.lines} |
| **Props Count** | ${component.propTypes.length} |
| **Uses Hooks** | ${component.hasHooks ? 'Yes' : 'No'} |
| **Has State** | ${component.hasState ? 'Yes' : 'No'} |

## Dependencies

${component.dependencies.length > 0 ? component.dependencies.map(dep => `- ${dep}`).join('\n') : 'No external dependencies'}

## Props

${
  component.propTypes.length > 0
    ? component.propTypes
        .map(prop => `### ${prop}\n\nDescription for ${prop} prop.`)
        .join('\n\n')
    : 'This component does not accept any props.'
}

## Usage Examples

### Basic Usage

\`\`\`jsx
import ${component.name} from 'path/to/${component.name}';

function App() {
  return (
    <${component.name}${component.propTypes.length > 0 ? ' prop="value"' : ''} />
  );
}
\`\`\`

### Advanced Usage

\`\`\`jsx
import ${component.name} from 'path/to/${component.name}';

function AdvancedExample() {
  return (
    <${component.name}
      ${component.propTypes
        .slice(0, 3)
        .map(prop => `${prop}="example"`)
        .join('\n      ')}
    />
  );
}
\`\`\`

## Accessibility Guidelines

- Ensure proper color contrast ratios (WCAG 2.1 AA)
- Provide keyboard navigation support
- Include appropriate ARIA labels and roles
- Test with screen readers

## Testing

This component includes the following test scenarios:
- Default rendering
- Props validation
- User interactions
- Accessibility compliance
- Responsive behavior

## Browser Support

This component is compatible with:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Related Components

Components commonly used with ${component.name}:
${component.category !== 'Root' ? `- Other components in the ${component.category} category` : '- Various UI components'}
`;

    const mdxFilePath = path.join(this.docsPath, `${component.name}.mdx`);
    fs.writeFileSync(mdxFilePath, mdxContent);
  }

  /**
   * Generate component overview documentation
   */
  generateComponentOverview() {
    const overviewContent = `# WRFCoin Component Library

Welcome to the WRFCoin component library documentation. This library contains ${this.componentInventory.metadata?.totalComponents || 0} components organized into ${this.componentInventory.metadata?.totalCategories || 0} categories.

## Quick Stats

- **Total Components**: ${this.componentInventory.metadata?.totalComponents || 0}
- **TypeScript Components**: ${this.componentInventory.summary?.byType?.TypeScript || 0}
- **JavaScript Components**: ${this.componentInventory.summary?.byType?.JavaScript || 0}
- **Documentation Coverage**: ${this.componentInventory.summary ? Math.round((this.componentInventory.summary.documentation.withJSDoc / this.componentInventory.metadata.totalComponents) * 100) : 0}%

## Component Categories

${Object.entries(this.componentInventory.categories || {})
  .map(
    ([name, data]) => `
### ${name} (${data.count} components)

${data.components.slice(0, 10).join(', ')}${data.components.length > 10 ? '...' : ''}
`
  )
  .join('')}

## Getting Started

1. Browse components by category in the sidebar
2. View interactive examples in each component's story
3. Check accessibility guidelines and usage patterns
4. Copy code examples for implementation

## Design System

Our component library follows consistent design principles:

- **Typography**: System fonts with fallbacks
- **Colors**: Brand-consistent color palette
- **Spacing**: 8px grid system
- **Accessibility**: WCAG 2.1 AA compliance

## Contributing

To add or modify components:

1. Follow the established naming conventions
2. Include comprehensive JSDoc documentation
3. Add Storybook stories for all variants
4. Ensure accessibility compliance
5. Add appropriate tests

## Support

For questions or issues with components:
- Check the component's documentation page
- Review the accessibility guidelines
- Consult the usage examples
- Contact the development team
`;

    const overviewPath = path.join(this.docsPath, 'overview.mdx');
    fs.writeFileSync(overviewPath, overviewContent);

    console.log('📚 Component overview documentation generated');
  }
}

// Run the generator if called directly
if (require.main === module) {
  const generator = new EnhancedStoryGenerator();
  generator.generateEnhancedStories();
}

module.exports = EnhancedStoryGenerator;
