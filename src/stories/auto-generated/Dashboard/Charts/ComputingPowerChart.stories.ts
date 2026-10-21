import type { Meta, StoryObj } from '@storybook/react';
import ComputingPowerChart from '../../components/Dashboard/Charts/ComputingPowerChart.jsx';
import { devLog } from '../../../../utils/logger';

const meta: Meta<typeof ComputingPowerChart> = {
  title: 'Dashboard/Charts/ComputingPowerChart',
  component: ComputingPowerChart,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for ComputingPowerChart component from Dashboard/Charts.',
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
    devLog('ComputingPowerChart rendered successfully');
  },
};
