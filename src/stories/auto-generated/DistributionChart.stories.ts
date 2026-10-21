import type { Meta, StoryObj } from '@storybook/react';
import DistributionChart from '../../Dashboard/Charts/DistributionChart.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof DistributionChart> = {
  title: 'Components/Dashboard/Charts/DistributionChart',
  component: DistributionChart,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# DistributionChart

Component from the Dashboard/Charts category.

- **Props**: 0
- **Complexity**: medium
- **Lines**: 150
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
    devLog('DistributionChart rendered successfully');
  },
};
