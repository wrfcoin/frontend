import type { Meta, StoryObj } from '@storybook/react';
import NFTShowcase from '../../components/ComputationalNFT/NFTShowcase.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof NFTShowcase> = {
  title: 'ComputationalNFT/NFTShowcase',
  component: NFTShowcase,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for NFTShowcase component from ComputationalNFT.',
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
    devLog('NFTShowcase rendered successfully');
  },
};
