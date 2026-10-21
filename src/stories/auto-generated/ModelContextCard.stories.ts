import type { Meta, StoryObj } from '@storybook/react';
import ModelContextCard from '../../Integrations/ModelContextCard.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof ModelContextCard> = {
  title: 'Components/Integrations/ModelContextCard',
  component: ModelContextCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# ModelContextCard

Component from the Integrations category.

- **Props**: 0
- **Complexity**: medium
- **Lines**: 86
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
    devLog('ModelContextCard rendered successfully');
  },
};
