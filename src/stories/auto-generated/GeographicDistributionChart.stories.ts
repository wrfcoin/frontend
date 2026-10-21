import type { Meta, StoryObj } from '@storybook/react';
import GeographicDistributionChart from '../../Dashboard/Charts/GeographicDistributionChart.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof GeographicDistributionChart> = {
  title: 'Components/Dashboard/Charts/GeographicDistributionChart',
  component: GeographicDistributionChart,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# GeographicDistributionChart

Component from the Dashboard/Charts category.

- **Props**: 0
- **Complexity**: low
- **Lines**: 122
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
    devLog('GeographicDistributionChart rendered successfully');
  },
};
