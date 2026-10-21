import type { Meta, StoryObj } from '@storybook/react';
import GolemDashboard from '../../components/Golem/GolemDashboard.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof GolemDashboard> = {
  title: 'Golem/GolemDashboard',
  component: GolemDashboard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for GolemDashboard component from Golem.',
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
    devLog('GolemDashboard rendered successfully');
  },
};
