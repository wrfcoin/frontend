import type { Meta, StoryObj } from '@storybook/react';
import SystemResourcesChart from '../../Dashboard/Charts/SystemResourcesChart.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof SystemResourcesChart> = {
  title: 'Components/Dashboard/Charts/SystemResourcesChart',
  component: SystemResourcesChart,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# SystemResourcesChart

Component from the Dashboard/Charts category.

- **Props**: 0
- **Complexity**: medium
- **Lines**: 161
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
    devLog('SystemResourcesChart rendered successfully');
  },
};
