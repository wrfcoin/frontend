import type { Meta, StoryObj } from '@storybook/react';
import DuluthLiftBridgeIcon from '../../components/CrossChain/DuluthLiftBridgeIcon.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof DuluthLiftBridgeIcon> = {
  title: 'CrossChain/DuluthLiftBridgeIcon',
  component: DuluthLiftBridgeIcon,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for DuluthLiftBridgeIcon component from CrossChain.',
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
    devLog('DuluthLiftBridgeIcon rendered successfully');
  },
};
