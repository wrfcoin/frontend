import type { Meta, StoryObj } from '@storybook/react';
import MetricsPanel from '../../components/Dashboard/MetricsPanel.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof MetricsPanel> = {
  title: 'Dashboard/MetricsPanel',
  component: MetricsPanel,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for MetricsPanel component from Dashboard.',
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
    devLog('MetricsPanel rendered successfully');
  },
};
