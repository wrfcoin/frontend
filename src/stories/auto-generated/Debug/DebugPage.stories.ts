import type { Meta, StoryObj } from '@storybook/react';
import DebugPage from '../../components/Debug/DebugPage.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof DebugPage> = {
  title: 'Debug/DebugPage',
  component: DebugPage,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Auto-generated story for DebugPage component from Debug.',
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
    devLog('DebugPage rendered successfully');
  },
};
