import type { Meta, StoryObj } from '@storybook/react';
import CrossChainRewardsCard from '../../Dashboard/Cards/CrossChainRewardsCard.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof CrossChainRewardsCard> = {
  title: 'Components/Dashboard/Cards/CrossChainRewardsCard',
  component: CrossChainRewardsCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# CrossChainRewardsCard

Component from the Dashboard/Cards category.

- **Props**: 0
- **Complexity**: medium
- **Lines**: 227
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
    devLog('CrossChainRewardsCard rendered successfully');
  },
};
