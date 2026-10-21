import type { Meta, StoryObj } from '@storybook/react';
import GamificationDashboard from '../../Gamification/GamificationDashboard.jsx';

const meta: Meta<typeof GamificationDashboard> = {
  title: 'Components/Gamification/GamificationDashboard',
  component: GamificationDashboard,
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
