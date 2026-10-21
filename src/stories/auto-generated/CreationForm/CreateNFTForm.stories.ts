import type { Meta, StoryObj } from '@storybook/react';
import CreateNFTForm from '../../components/CreationForm/CreateNFTForm.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof CreateNFTForm> = {
  title: 'CreationForm/CreateNFTForm',
  component: CreateNFTForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for CreateNFTForm component from CreationForm.',
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
    devLog('CreateNFTForm rendered successfully');
  },
};
