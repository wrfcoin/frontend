import type { Meta, StoryObj } from '@storybook/react';
import SystemResourcesChart from '../../components/Dashboard/Charts/SystemResourcesChart.jsx';
import { devLog } from '../../../../utils/logger';

const meta: Meta<typeof SystemResourcesChart> = {
  title: 'Dashboard/Charts/SystemResourcesChart',
  component: SystemResourcesChart,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for SystemResourcesChart component from Dashboard/Charts.',
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
    devLog('SystemResourcesChart rendered successfully');
  },
};
