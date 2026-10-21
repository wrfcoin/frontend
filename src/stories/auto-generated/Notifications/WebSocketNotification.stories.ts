import type { Meta, StoryObj } from '@storybook/react';
import WebSocketNotification from '../../components/Notifications/WebSocketNotification.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof WebSocketNotification> = {
  title: 'Notifications/WebSocketNotification',
  component: WebSocketNotification,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for WebSocketNotification component from Notifications.',
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
    devLog('WebSocketNotification rendered successfully');
  },
};
