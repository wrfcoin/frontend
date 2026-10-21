import type { Meta, StoryObj } from '@storybook/react';
import BlockchainMetrics from '../../components/Dashboard/BlockchainMetrics.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof BlockchainMetrics> = {
  title: 'Dashboard/BlockchainMetrics',
  component: BlockchainMetrics,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for BlockchainMetrics component from Dashboard.',
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
    devLog('BlockchainMetrics rendered successfully');
  },
};
