import type { Meta, StoryObj } from '@storybook/react';
import TatauCloudDashboard from '../../components/TatauCloud/TatauCloudDashboard.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof TatauCloudDashboard> = {
  title: 'TatauCloud/TatauCloudDashboard',
  component: TatauCloudDashboard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for TatauCloudDashboard component from TatauCloud.',
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
    devLog('TatauCloudDashboard rendered successfully');
  },
};
