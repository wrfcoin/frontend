import type { Meta, StoryObj } from '@storybook/react';
import AchievementsBadges from '../../components/Gamification/AchievementsBadges.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof AchievementsBadges> = {
  title: 'Gamification/AchievementsBadges',
  component: AchievementsBadges,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for AchievementsBadges component from Gamification.',
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
    devLog('AchievementsBadges rendered successfully');
  },
};
