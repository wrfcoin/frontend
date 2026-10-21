import type { Meta, StoryObj } from '@storybook/react';
import NodeTypeDistributionChart from '../../Dashboard/Charts/NodeTypeDistributionChart.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof NodeTypeDistributionChart> = {
  title: 'Components/Dashboard/Charts/NodeTypeDistributionChart',
  component: NodeTypeDistributionChart,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# NodeTypeDistributionChart

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
    devLog('NodeTypeDistributionChart rendered successfully');
  },
};
