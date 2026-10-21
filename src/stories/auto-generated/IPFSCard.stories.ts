import type { Meta, StoryObj } from '@storybook/react';
import IPFSCard from '../../Integrations/IPFSCard.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof IPFSCard> = {
  title: 'Components/Integrations/IPFSCard',
  component: IPFSCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# IPFSCard

Component from the Integrations category.

- **Props**: 0
- **Complexity**: medium
- **Lines**: 259
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
    devLog('IPFSCard rendered successfully');
  },
};
