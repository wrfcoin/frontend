import type { Meta, StoryObj } from '@storybook/react';
import CrossChainChart from '../../Dashboard/Charts/CrossChainChart.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof CrossChainChart> = {
  title: 'Components/Dashboard/Charts/CrossChainChart',
  component: CrossChainChart,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# CrossChainChart

Component from the Dashboard/Charts category.

- **Props**: 0
- **Complexity**: medium
- **Lines**: 135
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
    devLog('CrossChainChart rendered successfully');
  },
};
