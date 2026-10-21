import type { Meta, StoryObj } from '@storybook/react';
import BridgeAnalytics from '../../CrossChain/BridgeAnalytics.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof BridgeAnalytics> = {
  title: 'Components/CrossChain/BridgeAnalytics',
  component: BridgeAnalytics,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# BridgeAnalytics

Component from the CrossChain category.

- **Props**: 0
- **Complexity**: medium
- **Lines**: 323
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
    devLog('BridgeAnalytics rendered successfully');
  },
};
