import type { Meta, StoryObj } from '@storybook/react';
import RealTimeBridgeStatus from '../../CrossChain/RealTimeBridgeStatus.jsx';

const meta: Meta<typeof RealTimeBridgeStatus> = {
  title: 'Components/CrossChain/RealTimeBridgeStatus',
  component: RealTimeBridgeStatus,
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
