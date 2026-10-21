import type { Meta, StoryObj } from '@storybook/react';
import MarketData from '../../Dashboard/MarketData.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof MarketData> = {
  title: 'Components/Dashboard/MarketData',
  component: MarketData,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# MarketData

Component from the Dashboard category.

- **Props**: 0
- **Complexity**: low
- **Lines**: 46
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
    devLog('MarketData rendered successfully');
  },
};
