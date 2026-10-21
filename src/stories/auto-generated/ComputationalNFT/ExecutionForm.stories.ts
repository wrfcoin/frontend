import type { Meta, StoryObj } from '@storybook/react';
import ExecutionForm from '../../components/ComputationalNFT/ExecutionForm.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof ExecutionForm> = {
  title: 'ComputationalNFT/ExecutionForm',
  component: ExecutionForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for ExecutionForm component from ComputationalNFT.',
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
    devLog('ExecutionForm rendered successfully');
  },
};
