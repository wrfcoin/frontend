import type { Meta, StoryObj } from '@storybook/react';
import CosmosCard from '../../Integrations/CosmosCard.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof CosmosCard> = {
  title: 'Components/Integrations/CosmosCard',
  component: CosmosCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# CosmosCard

Component from the Integrations category.

- **Props**: 0
- **Complexity**: medium
- **Lines**: 306
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
    devLog('CosmosCard rendered successfully');
  },
};
