import type { Meta, StoryObj } from '@storybook/react';
import GraphProtocolCard from '../../Integrations/GraphProtocolCard.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof GraphProtocolCard> = {
  title: 'Components/Integrations/GraphProtocolCard',
  component: GraphProtocolCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# GraphProtocolCard

Component from the Integrations category.

- **Props**: 0
- **Complexity**: medium
- **Lines**: 299
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
    devLog('GraphProtocolCard rendered successfully');
  },
};
