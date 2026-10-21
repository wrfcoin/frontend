import type { Meta, StoryObj } from '@storybook/react';
import BridgeMonitorDashboard from '../../components/Bridge/BridgeMonitorDashboard.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof BridgeMonitorDashboard> = {
  title: 'Bridge/BridgeMonitorDashboard',
  component: BridgeMonitorDashboard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for BridgeMonitorDashboard component from Bridge.',
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
    devLog('BridgeMonitorDashboard rendered successfully');
  },
};
