import type { Meta, StoryObj } from '@storybook/react';
import BlockchainInfo from '../../Dashboard/BlockchainInfo.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof BlockchainInfo> = {
  title: 'Components/Dashboard/BlockchainInfo',
  component: BlockchainInfo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# BlockchainInfo

Component from the Dashboard category.

- **Props**: 0
- **Complexity**: low
- **Lines**: 120
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
    devLog('BlockchainInfo rendered successfully');
  },
};
