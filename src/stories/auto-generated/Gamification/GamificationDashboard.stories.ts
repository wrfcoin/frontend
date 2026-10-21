import type { Meta, StoryObj } from '@storybook/react';
import GamificationDashboard from '../../components/Gamification/GamificationDashboard.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof GamificationDashboard> = {
  title: 'Gamification/GamificationDashboard',
  component: GamificationDashboard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for GamificationDashboard component from Gamification.',
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
    devLog('GamificationDashboard rendered successfully');
  },
};
