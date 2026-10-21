import type { Meta, StoryObj } from '@storybook/react';
import Button from '../../components/common/Button.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof Button> = {
  title: 'Common/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Auto-generated story for Button component from Common.',
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
    devLog('Button rendered successfully');
  },
};
