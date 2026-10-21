import type { Meta, StoryObj } from '@storybook/react';
import ConnectionStatus from '../../components/Debug/ConnectionStatus.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof ConnectionStatus> = {
  title: 'Debug/ConnectionStatus',
  component: ConnectionStatus,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Auto-generated story for ConnectionStatus component from Debug.',
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
    devLog('ConnectionStatus rendered successfully');
  },
};
