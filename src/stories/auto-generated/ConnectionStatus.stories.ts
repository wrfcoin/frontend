import type { Meta, StoryObj } from '@storybook/react';
import ConnectionStatus from '../../Debug/ConnectionStatus.jsx';

const meta: Meta<typeof ConnectionStatus> = {
  title: 'Components/Debug/ConnectionStatus',
  component: ConnectionStatus,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // No props detected
  },
};
