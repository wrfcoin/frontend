import type { Meta, StoryObj } from '@storybook/react';
import LayerZeroCard from '../../Integrations/LayerZeroCard.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof LayerZeroCard> = {
  title: 'Components/Integrations/LayerZeroCard',
  component: LayerZeroCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# LayerZeroCard

Component from the Integrations category.

- **Props**: 0
- **Complexity**: medium
- **Lines**: 322
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
    devLog('LayerZeroCard rendered successfully');
  },
};
