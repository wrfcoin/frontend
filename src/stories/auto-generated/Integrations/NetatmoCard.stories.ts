import type { Meta, StoryObj } from '@storybook/react';
import NetatmoCard from '../../components/Integrations/NetatmoCard.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof NetatmoCard> = {
  title: 'Integrations/NetatmoCard',
  component: NetatmoCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for NetatmoCard component from Integrations.',
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
    devLog('NetatmoCard rendered successfully');
  },
};
