import type { Meta, StoryObj } from '@storybook/react';
import AnthropicCard from '../../components/Integrations/AnthropicCard.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof AnthropicCard> = {
  title: 'Integrations/AnthropicCard',
  component: AnthropicCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for AnthropicCard component from Integrations.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    // Auto-generated argTypes - customize as needed
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
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    // Add interaction tests here
    devLog('AnthropicCard rendered successfully');
  },
};
