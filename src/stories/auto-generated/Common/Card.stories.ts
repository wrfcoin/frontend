import type { Meta, StoryObj } from '@storybook/react';
import Card from '../../components/common/Card.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof Card> = {
  title: 'Common/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Auto-generated story for Card component from Common.',
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
    devLog('Card rendered successfully');
  },
};
