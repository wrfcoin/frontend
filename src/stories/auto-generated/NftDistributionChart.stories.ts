import type { Meta, StoryObj } from '@storybook/react';
import NftDistributionChart from '../../Dashboard/Charts/NftDistributionChart.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof NftDistributionChart> = {
  title: 'Components/Dashboard/Charts/NftDistributionChart',
  component: NftDistributionChart,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# NftDistributionChart

Component from the Dashboard/Charts category.

- **Props**: 0
- **Complexity**: medium
- **Lines**: 180
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
    devLog('NftDistributionChart rendered successfully');
  },
};
