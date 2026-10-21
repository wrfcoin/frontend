import type { Meta, StoryObj } from '@storybook/react';
import ComputingPowerCard from '../../Dashboard/Cards/ComputingPowerCard.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof ComputingPowerCard> = {
  title: 'Components/Dashboard/Cards/ComputingPowerCard',
  component: ComputingPowerCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# ComputingPowerCard

Component from the Dashboard/Cards category.

- **Props**: 0
- **Complexity**: low
- **Lines**: 80
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
    devLog('ComputingPowerCard rendered successfully');
  },
};
