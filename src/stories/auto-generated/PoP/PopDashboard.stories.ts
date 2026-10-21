import type { Meta, StoryObj } from '@storybook/react';
import PopDashboard from '../../components/PoP/PopDashboard.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof PopDashboard> = {
  title: 'PoP/PopDashboard',
  component: PopDashboard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Auto-generated story for PopDashboard component from PoP.',
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
    devLog('PopDashboard rendered successfully');
  },
};
