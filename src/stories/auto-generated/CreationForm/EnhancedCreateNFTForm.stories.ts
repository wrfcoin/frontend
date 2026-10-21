import type { Meta, StoryObj } from '@storybook/react';
import EnhancedCreateNFTForm from '../../components/CreationForm/EnhancedCreateNFTForm.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof EnhancedCreateNFTForm> = {
  title: 'CreationForm/EnhancedCreateNFTForm',
  component: EnhancedCreateNFTForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for EnhancedCreateNFTForm component from CreationForm.',
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
    devLog('EnhancedCreateNFTForm rendered successfully');
  },
};
