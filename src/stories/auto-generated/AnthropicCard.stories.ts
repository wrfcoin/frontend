import type { Meta, StoryObj } from '@storybook/react';
import AnthropicCard from '../../Integrations/AnthropicCard.jsx';

const meta: Meta<typeof AnthropicCard> = {
  title: 'Components/Integrations/AnthropicCard',
  component: AnthropicCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // No props detected
  },
};
