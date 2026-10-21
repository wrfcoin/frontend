import type { Meta, StoryObj } from '@storybook/react';
import ExecutionMonitor from '../../components/ComputationalNFT/ExecutionMonitor.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof ExecutionMonitor> = {
  title: 'ComputationalNFT/ExecutionMonitor',
  component: ExecutionMonitor,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for ExecutionMonitor component from ComputationalNFT.',
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
    devLog('ExecutionMonitor rendered successfully');
  },
};
