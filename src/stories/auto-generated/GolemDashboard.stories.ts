import type { Meta, StoryObj } from '@storybook/react';
import GolemDashboard from '../../Golem/GolemDashboard.jsx';

const meta: Meta<typeof GolemDashboard> = {
  title: 'Components/Golem/GolemDashboard',
  component: GolemDashboard,
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
