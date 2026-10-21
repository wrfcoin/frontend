import type { Meta, StoryObj } from '@storybook/react';
import NetworkHealthMonitor from '../../Analytics/NetworkHealthMonitor.jsx';

const meta: Meta<typeof NetworkHealthMonitor> = {
  title: 'Components/Analytics/NetworkHealthMonitor',
  component: NetworkHealthMonitor,
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
