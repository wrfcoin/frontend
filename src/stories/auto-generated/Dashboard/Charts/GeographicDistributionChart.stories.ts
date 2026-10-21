import type { Meta, StoryObj } from '@storybook/react';
import GeographicDistributionChart from '../../components/Dashboard/Charts/GeographicDistributionChart.jsx';
import { devLog } from '../../../../utils/logger';

const meta: Meta<typeof GeographicDistributionChart> = {
  title: 'Dashboard/Charts/GeographicDistributionChart',
  component: GeographicDistributionChart,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for GeographicDistributionChart component from Dashboard/Charts.',
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
    devLog('GeographicDistributionChart rendered successfully');
  },
};
