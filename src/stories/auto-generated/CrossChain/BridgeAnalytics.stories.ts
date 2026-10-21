import type { Meta, StoryObj } from '@storybook/react';
import BridgeAnalytics from '../../components/CrossChain/BridgeAnalytics.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof BridgeAnalytics> = {
  title: 'CrossChain/BridgeAnalytics',
  component: BridgeAnalytics,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for BridgeAnalytics component from CrossChain.',
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
    devLog('BridgeAnalytics rendered successfully');
  },
};
