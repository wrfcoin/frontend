import type { Meta, StoryObj } from '@storybook/react';
import CrossChainChart from '../../components/Dashboard/Charts/CrossChainChart.jsx';
import { devLog } from '../../../../utils/logger';

const meta: Meta<typeof CrossChainChart> = {
  title: 'Dashboard/Charts/CrossChainChart',
  component: CrossChainChart,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for CrossChainChart component from Dashboard/Charts.',
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
    devLog('CrossChainChart rendered successfully');
  },
};
