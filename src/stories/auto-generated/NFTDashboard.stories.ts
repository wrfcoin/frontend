import type { Meta, StoryObj } from '@storybook/react';
import NFTDashboard from '../../Dashboard/NFTDashboard.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof NFTDashboard> = {
  title: 'Components/Dashboard/NFTDashboard',
  component: NFTDashboard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# NFTDashboard

Component from the Dashboard category.

- **Props**: 0
- **Complexity**: medium
- **Lines**: 175
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
    devLog('NFTDashboard rendered successfully');
  },
};
