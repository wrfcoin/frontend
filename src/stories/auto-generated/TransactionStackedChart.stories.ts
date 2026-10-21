import type { Meta, StoryObj } from '@storybook/react';
import TransactionStackedChart from '../../Dashboard/Cards/TransactionStackedChart.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof TransactionStackedChart> = {
  title: 'Components/Dashboard/Cards/TransactionStackedChart',
  component: TransactionStackedChart,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# TransactionStackedChart

Component from the Dashboard/Cards category.

- **Props**: 0
- **Complexity**: low
- **Lines**: 131
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
    devLog('TransactionStackedChart rendered successfully');
  },
};
