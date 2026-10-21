import type { Meta, StoryObj } from '@storybook/react';
import CrossChainRewardsCard from '../../components/Dashboard/Cards/CrossChainRewardsCard.jsx';
import { devLog } from '../../../../utils/logger';

const meta: Meta<typeof CrossChainRewardsCard> = {
  title: 'Dashboard/Cards/CrossChainRewardsCard',
  component: CrossChainRewardsCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for CrossChainRewardsCard component from Dashboard/Cards.',
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
    devLog('CrossChainRewardsCard rendered successfully');
  },
};
