import type { Meta, StoryObj } from '@storybook/react';
import AchievementsBadges from '../../Gamification/AchievementsBadges.jsx';

const meta: Meta<typeof AchievementsBadges> = {
  title: 'Components/Gamification/AchievementsBadges',
  component: AchievementsBadges,
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
