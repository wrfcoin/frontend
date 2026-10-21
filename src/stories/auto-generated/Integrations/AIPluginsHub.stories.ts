import type { Meta, StoryObj } from '@storybook/react';
import AIPluginsHub from '../../components/Integrations/AIPluginsHub.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof AIPluginsHub> = {
  title: 'Integrations/AIPluginsHub',
  component: AIPluginsHub,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for AIPluginsHub component from Integrations.',
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
    devLog('AIPluginsHub rendered successfully');
  },
};
