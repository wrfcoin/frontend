import type { Meta, StoryObj } from '@storybook/react';
import ShardingDashboard from '../../components/ShardingDashboard/ShardingDashboard.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof ShardingDashboard> = {
  title: 'ShardingDashboard/ShardingDashboard',
  component: ShardingDashboard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for ShardingDashboard component from ShardingDashboard.',
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
    devLog('ShardingDashboard rendered successfully');
  },
};
