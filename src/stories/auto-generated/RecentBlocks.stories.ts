import type { Meta, StoryObj } from '@storybook/react';
import RecentBlocks from '../../Dashboard/RecentBlocks.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof RecentBlocks> = {
  title: 'Components/Dashboard/RecentBlocks',
  component: RecentBlocks,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# RecentBlocks

Component from the Dashboard category.

- **Props**: 0
- **Complexity**: low
- **Lines**: 67
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
    devLog('RecentBlocks rendered successfully');
  },
};
