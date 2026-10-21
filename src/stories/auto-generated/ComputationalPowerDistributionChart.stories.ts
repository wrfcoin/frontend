import type { Meta, StoryObj } from '@storybook/react';
import ComputationalPowerDistributionChart from '../../Dashboard/Charts/ComputationalPowerDistributionChart.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof ComputationalPowerDistributionChart> = {
  title: 'Components/Dashboard/Charts/ComputationalPowerDistributionChart',
  component: ComputationalPowerDistributionChart,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# ComputationalPowerDistributionChart

Component from the Dashboard/Charts category.

- **Props**: 0
- **Complexity**: low
- **Lines**: 117
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    // No props detected
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
  play: async ({ canvasElement }) => {
    devLog('ComputationalPowerDistributionChart rendered successfully');
  },
};
