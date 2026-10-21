import type { Meta, StoryObj } from '@storybook/react';
import ComputationalPowerDistributionChart from '../../components/Dashboard/Charts/ComputationalPowerDistributionChart.jsx';
import { devLog } from '../../../../utils/logger';

const meta: Meta<typeof ComputationalPowerDistributionChart> = {
  title: 'Dashboard/Charts/ComputationalPowerDistributionChart',
  component: ComputationalPowerDistributionChart,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for ComputationalPowerDistributionChart component from Dashboard/Charts.',
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
    devLog('ComputationalPowerDistributionChart rendered successfully');
  },
};
