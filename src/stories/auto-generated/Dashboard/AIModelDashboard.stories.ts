import type { Meta, StoryObj } from '@storybook/react';
import AIModelDashboard from '../../components/Dashboard/AIModelDashboard.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof AIModelDashboard> = {
  title: 'Dashboard/AIModelDashboard',
  component: AIModelDashboard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for AIModelDashboard component from Dashboard.',
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
    devLog('AIModelDashboard rendered successfully');
  },
};
