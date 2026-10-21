import type { Meta, StoryObj } from '@storybook/react';
import ValidatorStats from '../../components/Validator/ValidatorStats.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof ValidatorStats> = {
  title: 'Validator/ValidatorStats',
  component: ValidatorStats,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for ValidatorStats component from Validator.',
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
    devLog('ValidatorStats rendered successfully');
  },
};
