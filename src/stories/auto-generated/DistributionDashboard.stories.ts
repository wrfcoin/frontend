import type { Meta, StoryObj } from '@storybook/react';
import DistributionDashboard from '../../Dashboard/DistributionDashboard.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof DistributionDashboard> = {
  title: 'Components/Dashboard/DistributionDashboard',
  component: DistributionDashboard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# DistributionDashboard

Component from the Dashboard category.

- **Props**: 0
- **Complexity**: medium
- **Lines**: 120
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    // No props detected
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
  play: async ({ canvasElement }) => {
    devLog('DistributionDashboard rendered successfully');
  },
};
