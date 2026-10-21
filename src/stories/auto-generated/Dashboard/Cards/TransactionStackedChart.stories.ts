import type { Meta, StoryObj } from '@storybook/react';
import TransactionStackedChart from '../../components/Dashboard/Cards/TransactionStackedChart.jsx';
import { devLog } from '../../../../utils/logger';

const meta: Meta<typeof TransactionStackedChart> = {
  title: 'Dashboard/Cards/TransactionStackedChart',
  component: TransactionStackedChart,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for TransactionStackedChart component from Dashboard/Cards.',
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
    devLog('TransactionStackedChart rendered successfully');
  },
};
