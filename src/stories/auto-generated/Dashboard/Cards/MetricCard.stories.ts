import type { Meta, StoryObj } from '@storybook/react';
import MetricCard from '../../components/Dashboard/Cards/MetricCard.jsx';
import { devLog } from '../../../../utils/logger';

const meta: Meta<typeof MetricCard> = {
  title: 'Dashboard/Cards/MetricCard',
  component: MetricCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for MetricCard component from Dashboard/Cards.',
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
    devLog('MetricCard rendered successfully');
  },
};
