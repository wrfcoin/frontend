import type { Meta, StoryObj } from '@storybook/react';
import GeminiCard from '../../components/Integrations/GeminiCard.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof GeminiCard> = {
  title: 'Integrations/GeminiCard',
  component: GeminiCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for GeminiCard component from Integrations.',
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
    devLog('GeminiCard rendered successfully');
  },
};
