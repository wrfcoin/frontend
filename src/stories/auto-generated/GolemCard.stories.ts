import type { Meta, StoryObj } from '@storybook/react';
import GolemCard from '../../Integrations/GolemCard.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof GolemCard> = {
  title: 'Components/Integrations/GolemCard',
  component: GolemCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# GolemCard

Component from the Integrations category.

- **Props**: 0
- **Complexity**: medium
- **Lines**: 203
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
    devLog('GolemCard rendered successfully');
  },
};
