import type { Meta, StoryObj } from '@storybook/react';
import DeviceManager from '../../components/IoTeX/DeviceManager.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof DeviceManager> = {
  title: 'IoTeX/DeviceManager',
  component: DeviceManager,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for DeviceManager component from IoTeX.',
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
    devLog('DeviceManager rendered successfully');
  },
};
