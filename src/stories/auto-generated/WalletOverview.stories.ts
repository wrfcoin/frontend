import type { Meta, StoryObj } from '@storybook/react';
import WalletOverview from '../../Dashboard/WalletOverview.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof WalletOverview> = {
  title: 'Components/Dashboard/WalletOverview',
  component: WalletOverview,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# WalletOverview

Component from the Dashboard category.

- **Props**: 0
- **Complexity**: medium
- **Lines**: 168
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
    devLog('WalletOverview rendered successfully');
  },
};
