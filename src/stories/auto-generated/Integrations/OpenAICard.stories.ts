import type { Meta, StoryObj } from '@storybook/react';
import OpenAICard from '../../components/Integrations/OpenAICard.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof OpenAICard> = {
  title: 'Integrations/OpenAICard',
  component: OpenAICard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for OpenAICard component from Integrations.',
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
    devLog('OpenAICard rendered successfully');
  },
};
