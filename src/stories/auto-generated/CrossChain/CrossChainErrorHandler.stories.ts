import type { Meta, StoryObj } from '@storybook/react';
import CrossChainErrorHandler from '../../components/CrossChain/CrossChainErrorHandler.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof CrossChainErrorHandler> = {
  title: 'CrossChain/CrossChainErrorHandler',
  component: CrossChainErrorHandler,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for CrossChainErrorHandler component from CrossChain.',
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
    devLog('CrossChainErrorHandler rendered successfully');
  },
};
