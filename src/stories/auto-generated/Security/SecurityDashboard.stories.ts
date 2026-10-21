import type { Meta, StoryObj } from '@storybook/react';
import SecurityDashboard from '../../components/Security/SecurityDashboard.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof SecurityDashboard> = {
  title: 'Security/SecurityDashboard',
  component: SecurityDashboard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for SecurityDashboard component from Security.',
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
    devLog('SecurityDashboard rendered successfully');
  },
};
