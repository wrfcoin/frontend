import type { Meta, StoryObj } from '@storybook/react';
import LeaderboardDashboard from '../../components/Gamification/LeaderboardDashboard.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof LeaderboardDashboard> = {
  title: 'Gamification/LeaderboardDashboard',
  component: LeaderboardDashboard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for LeaderboardDashboard component from Gamification.',
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
    devLog('LeaderboardDashboard rendered successfully');
  },
};
