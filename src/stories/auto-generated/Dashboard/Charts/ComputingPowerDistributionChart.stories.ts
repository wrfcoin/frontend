import type { Meta, StoryObj } from '@storybook/react';
import ComputingPowerDistributionChart from '../../components/Dashboard/Charts/NftDistributionChart.jsx';
import { devLog } from '../../../../utils/logger';

const meta: Meta<typeof ComputingPowerDistributionChart> = {
  title: 'Dashboard/Charts/ComputingPowerDistributionChart',
  component: ComputingPowerDistributionChart,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for ComputingPowerDistributionChart component from Dashboard/Charts.',
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
    devLog('ComputingPowerDistributionChart rendered successfully');
  },
};
