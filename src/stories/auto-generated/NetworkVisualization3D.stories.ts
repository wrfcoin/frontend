import type { Meta, StoryObj } from '@storybook/react';
import NetworkVisualization3D from '../../Analytics/NetworkVisualization3D.jsx';

const meta: Meta<typeof NetworkVisualization3D> = {
  title: 'Components/Analytics/NetworkVisualization3D',
  component: NetworkVisualization3D,
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
