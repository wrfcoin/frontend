import type { Meta, StoryObj } from '@storybook/react';
import NFTGallery from '../../components/nft/NFTGallery.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof NFTGallery> = {
  title: 'nft/NFTGallery',
  component: NFTGallery,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Auto-generated story for NFTGallery component from nft.',
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
    devLog('NFTGallery rendered successfully');
  },
};
