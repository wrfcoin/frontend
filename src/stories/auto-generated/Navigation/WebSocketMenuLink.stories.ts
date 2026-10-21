import type { Meta, StoryObj } from '@storybook/react';
import WebSocketMenuLink from '../../components/Navigation/WebSocketMenuLink.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof WebSocketMenuLink> = {
  title: 'Navigation/WebSocketMenuLink',
  component: WebSocketMenuLink,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for WebSocketMenuLink component from Navigation.',
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
    devLog('WebSocketMenuLink rendered successfully');
  },
};
