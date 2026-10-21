import type { Meta, StoryObj } from '@storybook/react';
import BrowseNFTTab from '../../components/nft/BrowseNFTTab.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof BrowseNFTTab> = {
  title: 'NFT/BrowseNFTTab',
  component: BrowseNFTTab,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Auto-generated story for BrowseNFTTab component from NFT.',
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
    devLog('BrowseNFTTab rendered successfully');
  },
};
