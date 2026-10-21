import type { Meta, StoryObj } from '@storybook/react';
import LayerZeroCard from '../../components/Integrations/LayerZeroCard.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof LayerZeroCard> = {
  title: 'Integrations/LayerZeroCard',
  component: LayerZeroCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for LayerZeroCard component from Integrations.',
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
    devLog('LayerZeroCard rendered successfully');
  },
};
