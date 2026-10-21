import type { Meta, StoryObj } from '@storybook/react';
import NftForm from '../../components/CreateNft/NftForm.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof NftForm> = {
  title: 'CreateNft/NftForm',
  component: NftForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Auto-generated story for NftForm component from CreateNft.',
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
    devLog('NftForm rendered successfully');
  },
};
