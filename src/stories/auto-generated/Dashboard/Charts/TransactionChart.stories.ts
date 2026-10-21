import type { Meta, StoryObj } from '@storybook/react';
import TransactionChart from '../../components/Dashboard/Charts/TransactionChart.jsx';
import { devLog } from '../../../../utils/logger';

const meta: Meta<typeof TransactionChart> = {
  title: 'Dashboard/Charts/TransactionChart',
  component: TransactionChart,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for TransactionChart component from Dashboard/Charts.',
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
    devLog('TransactionChart rendered successfully');
  },
};
