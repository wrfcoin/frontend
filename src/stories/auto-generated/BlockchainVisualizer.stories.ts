import type { Meta, StoryObj } from '@storybook/react';
import BlockchainVisualizer from '../../Explorer/BlockchainVisualizer.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof BlockchainVisualizer> = {
  title: 'Components/Explorer/BlockchainVisualizer',
  component: BlockchainVisualizer,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# BlockchainVisualizer

Component from the Explorer category.

- **Props**: 0
- **Complexity**: medium
- **Lines**: 111
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
    devLog('BlockchainVisualizer rendered successfully');
  },
};
