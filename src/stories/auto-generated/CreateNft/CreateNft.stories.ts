import type { Meta, StoryObj } from '@storybook/react';
import CreateNft from '../../components/CreateNft/CreateNft.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof CreateNft> = {
  title: 'CreateNft/CreateNft',
  component: CreateNft,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for CreateNft component from CreateNft.',
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
    devLog('CreateNft rendered successfully');
  },
};
