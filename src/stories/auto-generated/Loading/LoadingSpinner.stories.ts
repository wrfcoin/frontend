import type { Meta, StoryObj } from '@storybook/react';
import LoadingSpinner from '../../components/Loading/LoadingSpinner.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof LoadingSpinner> = {
  title: 'Loading/LoadingSpinner',
  component: LoadingSpinner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for LoadingSpinner component from Loading.',
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
    devLog('LoadingSpinner rendered successfully');
  },
};
