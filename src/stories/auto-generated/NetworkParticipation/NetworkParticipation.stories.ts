import type { Meta, StoryObj } from '@storybook/react';
import NetworkParticipation from '../../components/NetworkParticipation/NetworkParticipation.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof NetworkParticipation> = {
  title: 'NetworkParticipation/NetworkParticipation',
  component: NetworkParticipation,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for NetworkParticipation component from NetworkParticipation.',
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
    devLog('NetworkParticipation rendered successfully');
  },
};
