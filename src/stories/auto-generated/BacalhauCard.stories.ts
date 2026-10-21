import type { Meta, StoryObj } from '@storybook/react';
import BacalhauCard from '../../Integrations/BacalhauCard.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof BacalhauCard> = {
  title: 'Components/Integrations/BacalhauCard',
  component: BacalhauCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# BacalhauCard

Component from the Integrations category.

- **Props**: 0
- **Complexity**: medium
- **Lines**: 178
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
    devLog('BacalhauCard rendered successfully');
  },
};
