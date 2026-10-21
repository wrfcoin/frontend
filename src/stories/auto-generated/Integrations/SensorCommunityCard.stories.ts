import type { Meta, StoryObj } from '@storybook/react';
import SensorCommunityCard from '../../components/Integrations/SensorCommunityCard.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof SensorCommunityCard> = {
  title: 'Integrations/SensorCommunityCard',
  component: SensorCommunityCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for SensorCommunityCard component from Integrations.',
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
    devLog('SensorCommunityCard rendered successfully');
  },
};
