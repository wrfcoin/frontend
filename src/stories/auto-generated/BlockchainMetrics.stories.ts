import type { Meta, StoryObj } from '@storybook/react';
import BlockchainMetrics from '../../Dashboard/BlockchainMetrics.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof BlockchainMetrics> = {
  title: 'Components/Dashboard/BlockchainMetrics',
  component: BlockchainMetrics,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# BlockchainMetrics

Component from the Dashboard category.

- **Props**: 0
- **Complexity**: low
- **Lines**: 79
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    // No props detected
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
  play: async ({ canvasElement }) => {
    devLog('BlockchainMetrics rendered successfully');
  },
};
