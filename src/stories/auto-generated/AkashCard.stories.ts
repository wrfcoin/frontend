import type { Meta, StoryObj } from '@storybook/react';
import AkashCard from '../../Integrations/AkashCard.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof AkashCard> = {
  title: 'Components/Integrations/AkashCard',
  component: AkashCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# AkashCard

Component from the Integrations category.

- **Props**: 0
- **Complexity**: medium
- **Lines**: 121
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
    devLog('AkashCard rendered successfully');
  },
};
