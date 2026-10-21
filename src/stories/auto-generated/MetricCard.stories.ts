import type { Meta, StoryObj } from '@storybook/react';
import MetricCard from '../../Dashboard/Cards/MetricCard.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof MetricCard> = {
  title: 'Components/Dashboard/Cards/MetricCard',
  component: MetricCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# MetricCard

Component from the Dashboard/Cards category.

- **Props**: 0
- **Complexity**: low
- **Lines**: 111
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
    devLog('MetricCard rendered successfully');
  },
};
