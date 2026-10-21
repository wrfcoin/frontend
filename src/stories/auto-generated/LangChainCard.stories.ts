import type { Meta, StoryObj } from '@storybook/react';
import LangChainCard from '../../Integrations/AI/LangChainCard.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof LangChainCard> = {
  title: 'Components/Integrations/AI/LangChainCard',
  component: LangChainCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# LangChainCard

Component from the Integrations/AI category.

- **Props**: 0
- **Complexity**: medium
- **Lines**: 151
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
    devLog('LangChainCard rendered successfully');
  },
};
