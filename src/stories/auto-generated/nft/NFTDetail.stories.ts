import type { Meta, StoryObj } from '@storybook/react';
import NFTDetail from '../../components/nft/NFTDetail.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof NFTDetail> = {
  title: 'nft/NFTDetail',
  component: NFTDetail,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Auto-generated story for NFTDetail component from nft.',
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
    devLog('NFTDetail rendered successfully');
  },
};
