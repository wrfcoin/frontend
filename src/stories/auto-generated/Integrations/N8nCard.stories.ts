import type { Meta, StoryObj } from '@storybook/react';
import N8nCard from '../../components/Integrations/N8nCard.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof N8nCard> = {
  title: 'Integrations/N8nCard',
  component: N8nCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for N8nCard component from Integrations.',
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
    devLog('N8nCard rendered successfully');
  },
};
