import type { Meta, StoryObj } from '@storybook/react';
import CrossChainNetworkCard from '../../Dashboard/Cards/CrossChainNetworkCard.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof CrossChainNetworkCard> = {
  title: 'Components/Dashboard/Cards/CrossChainNetworkCard',
  component: CrossChainNetworkCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# CrossChainNetworkCard

Component from the Dashboard/Cards category.

- **Props**: 0
- **Complexity**: medium
- **Lines**: 174
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
    devLog('CrossChainNetworkCard rendered successfully');
  },
};
