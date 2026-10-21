import type { Meta, StoryObj } from '@storybook/react';
import GolemCard from '../../components/Integrations/GolemCard.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof GolemCard> = {
  title: 'Integrations/GolemCard',
  component: GolemCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for GolemCard component from Integrations.',
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
    devLog('GolemCard rendered successfully');
  },
};
