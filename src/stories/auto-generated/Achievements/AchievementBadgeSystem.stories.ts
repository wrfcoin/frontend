import type { Meta, StoryObj } from '@storybook/react';
import AchievementBadgeSystem from '../../components/Achievements/AchievementBadgeSystem.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof AchievementBadgeSystem> = {
  title: 'Achievements/AchievementBadgeSystem',
  component: AchievementBadgeSystem,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for AchievementBadgeSystem component from Achievements.',
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
    devLog('AchievementBadgeSystem rendered successfully');
  },
};
