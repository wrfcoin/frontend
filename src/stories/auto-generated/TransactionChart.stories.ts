import type { Meta, StoryObj } from '@storybook/react';
import TransactionChart from '../../Dashboard/Charts/TransactionChart.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof TransactionChart> = {
  title: 'Components/Dashboard/Charts/TransactionChart',
  component: TransactionChart,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# TransactionChart

Component from the Dashboard/Charts category.

- **Props**: 0
- **Complexity**: medium
- **Lines**: 184
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
    devLog('TransactionChart rendered successfully');
  },
};
