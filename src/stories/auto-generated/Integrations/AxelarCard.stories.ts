import type { Meta, StoryObj } from '@storybook/react';
import AxelarCard from '../../components/Integrations/AxelarCard.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof AxelarCard> = {
  title: 'Integrations/AxelarCard',
  component: AxelarCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for AxelarCard component from Integrations.',
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
    devLog('AxelarCard rendered successfully');
  },
};
