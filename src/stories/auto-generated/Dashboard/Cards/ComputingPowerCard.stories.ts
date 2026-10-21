import type { Meta, StoryObj } from '@storybook/react';
import ComputingPowerCard from '../../components/Dashboard/Cards/ComputingPowerCard.jsx';
import { devLog } from '../../../../utils/logger';

const meta: Meta<typeof ComputingPowerCard> = {
  title: 'Dashboard/Cards/ComputingPowerCard',
  component: ComputingPowerCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for ComputingPowerCard component from Dashboard/Cards.',
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
    devLog('ComputingPowerCard rendered successfully');
  },
};
