import type { Meta, StoryObj } from '@storybook/react';
import BittensorCard from '../../Integrations/BittensorCard.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof BittensorCard> = {
  title: 'Components/Integrations/BittensorCard',
  component: BittensorCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# BittensorCard

Component from the Integrations category.

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
    devLog('BittensorCard rendered successfully');
  },
};
