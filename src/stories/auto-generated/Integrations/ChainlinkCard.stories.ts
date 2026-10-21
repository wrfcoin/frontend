import type { Meta, StoryObj } from '@storybook/react';
import ChainlinkCard from '../../components/Integrations/ChainlinkCard.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof ChainlinkCard> = {
  title: 'Integrations/ChainlinkCard',
  component: ChainlinkCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for ChainlinkCard component from Integrations.',
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
    devLog('ChainlinkCard rendered successfully');
  },
};
