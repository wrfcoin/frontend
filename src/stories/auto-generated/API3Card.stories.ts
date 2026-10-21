import type { Meta, StoryObj } from '@storybook/react';
import API3Card from '../../Integrations/API3Card.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof API3Card> = {
  title: 'Components/Integrations/API3Card',
  component: API3Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# API3Card

Component from the Integrations category.

- **Props**: 0
- **Complexity**: medium
- **Lines**: 301
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
    devLog('API3Card rendered successfully');
  },
};
