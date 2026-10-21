import type { Meta, StoryObj } from '@storybook/react';
import N8nConfig from '../../components/Integrations/N8nConfig.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof N8nConfig> = {
  title: 'Integrations/N8nConfig',
  component: N8nConfig,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for N8nConfig component from Integrations.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    // Auto-generated argTypes - customize as needed
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // No props detected
  },
};

export const Interactive: Story = {
  args: {
    // No props detected
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    // Add interaction tests here
    devLog('N8nConfig rendered successfully');
  },
};
