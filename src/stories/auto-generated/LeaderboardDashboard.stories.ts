import type { Meta, StoryObj } from '@storybook/react';
import LeaderboardDashboard from '../../Gamification/LeaderboardDashboard.jsx';

const meta: Meta<typeof LeaderboardDashboard> = {
  title: 'Components/Gamification/LeaderboardDashboard',
  component: LeaderboardDashboard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // No props detected
  },
};
