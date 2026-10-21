import type { Meta, StoryObj } from '@storybook/react';
import WebSocketDemo from '../../components/WebSocket/WebSocketDemo.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof WebSocketDemo> = {
  title: 'WebSocket/WebSocketDemo',
  component: WebSocketDemo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for WebSocketDemo component from WebSocket.',
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
    devLog('WebSocketDemo rendered successfully');
  },
};
