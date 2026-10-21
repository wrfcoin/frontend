import type { Meta, StoryObj } from '@storybook/react';
import CarbonFootprintDashboard from '../../CarbonFootprintTracker/CarbonFootprintDashboard.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof CarbonFootprintDashboard> = {
  title: 'Components/CarbonFootprintTracker/CarbonFootprintDashboard',
  component: CarbonFootprintDashboard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# CarbonFootprintDashboard

Component from the CarbonFootprintTracker category.

- **Props**: 0
- **Complexity**: medium
- **Lines**: 285
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
    devLog('CarbonFootprintDashboard rendered successfully');
  },
};
