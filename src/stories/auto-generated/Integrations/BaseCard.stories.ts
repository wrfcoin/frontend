import type { Meta, StoryObj } from '@storybook/react';
import BaseCard from '../../components/Integrations/BaseCard.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof BaseCard> = {
  title: 'Integrations/BaseCard',
  component: BaseCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for BaseCard component from Integrations.',
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
    devLog('BaseCard rendered successfully');
  },
};
