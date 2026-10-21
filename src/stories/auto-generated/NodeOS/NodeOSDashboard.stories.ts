import type { Meta, StoryObj } from '@storybook/react';
import NodeOSDashboard from '../../components/NodeOS/NodeOSDashboard.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof NodeOSDashboard> = {
  title: 'NodeOS/NodeOSDashboard',
  component: NodeOSDashboard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for NodeOSDashboard component from NodeOS.',
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
    devLog('NodeOSDashboard rendered successfully');
  },
};
