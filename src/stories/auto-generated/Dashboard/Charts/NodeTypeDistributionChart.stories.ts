import type { Meta, StoryObj } from '@storybook/react';
import NodeTypeDistributionChart from '../../components/Dashboard/Charts/NodeTypeDistributionChart.jsx';
import { devLog } from '../../../../utils/logger';

const meta: Meta<typeof NodeTypeDistributionChart> = {
  title: 'Dashboard/Charts/NodeTypeDistributionChart',
  component: NodeTypeDistributionChart,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for NodeTypeDistributionChart component from Dashboard/Charts.',
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
    devLog('NodeTypeDistributionChart rendered successfully');
  },
};
