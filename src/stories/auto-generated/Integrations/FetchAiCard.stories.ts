import type { Meta, StoryObj } from '@storybook/react';
import FetchAiCard from '../../components/Integrations/FetchAiCard.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof FetchAiCard> = {
  title: 'Integrations/FetchAiCard',
  component: FetchAiCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for FetchAiCard component from Integrations.',
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
    devLog('FetchAiCard rendered successfully');
  },
};
