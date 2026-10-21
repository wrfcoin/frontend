import type { Meta, StoryObj } from '@storybook/react';
import iExecDashboard from '../../components/iExec/iExecDashboard.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof iExecDashboard> = {
  title: 'iExec/iExecDashboard',
  component: iExecDashboard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for iExecDashboard component from iExec.',
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
    devLog('iExecDashboard rendered successfully');
  },
};
