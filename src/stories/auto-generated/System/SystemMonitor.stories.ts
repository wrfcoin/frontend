import type { Meta, StoryObj } from '@storybook/react';
import SystemMonitor from '../../components/System/SystemMonitor.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof SystemMonitor> = {
  title: 'System/SystemMonitor',
  component: SystemMonitor,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for SystemMonitor component from System.',
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
    devLog('SystemMonitor rendered successfully');
  },
};
