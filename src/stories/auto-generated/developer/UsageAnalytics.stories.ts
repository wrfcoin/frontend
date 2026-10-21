import type { Meta, StoryObj } from '@storybook/react';
import UsageAnalytics from '../../components/developer/UsageAnalytics.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof UsageAnalytics> = {
  title: 'developer/UsageAnalytics',
  component: UsageAnalytics,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for UsageAnalytics component from developer.',
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
    devLog('UsageAnalytics rendered successfully');
  },
};
