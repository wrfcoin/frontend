import type { Meta, StoryObj } from '@storybook/react';
import BridgeMonitorDashboard from '../../Bridge/BridgeMonitorDashboard.jsx';

const meta: Meta<typeof BridgeMonitorDashboard> = {
  title: 'Components/Bridge/BridgeMonitorDashboard',
  component: BridgeMonitorDashboard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // No props detected
  },
};
