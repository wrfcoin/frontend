import type { Meta, StoryObj } from '@storybook/react';
import ChainlinkCard from '../../Integrations/ChainlinkCard.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof ChainlinkCard> = {
  title: 'Components/Integrations/ChainlinkCard',
  component: ChainlinkCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# ChainlinkCard

Component from the Integrations category.

- **Props**: 0
- **Complexity**: medium
- **Lines**: 125
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
    devLog('ChainlinkCard rendered successfully');
  },
};
