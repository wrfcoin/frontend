import type { Meta, StoryObj } from '@storybook/react';
import UnifiedNFTDashboard from '../../components/nft/UnifiedNFTDashboard.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof UnifiedNFTDashboard> = {
  title: 'NFT/UnifiedNFTDashboard',
  component: UnifiedNFTDashboard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for UnifiedNFTDashboard component from NFT.',
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
    devLog('UnifiedNFTDashboard rendered successfully');
  },
};
