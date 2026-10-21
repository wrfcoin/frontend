import type { Meta, StoryObj } from '@storybook/react';
import NetworkVisualization3D from '../../components/Analytics/NetworkVisualization3D.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof NetworkVisualization3D> = {
  title: 'Analytics/NetworkVisualization3D',
  component: NetworkVisualization3D,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for NetworkVisualization3D component from Analytics.',
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
    devLog('NetworkVisualization3D rendered successfully');
  },
};
