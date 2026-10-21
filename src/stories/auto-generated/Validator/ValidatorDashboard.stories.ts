import type { Meta, StoryObj } from '@storybook/react';
import ValidatorDashboard from '../../components/Validator/ValidatorDashboard.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof ValidatorDashboard> = {
  title: 'Validator/ValidatorDashboard',
  component: ValidatorDashboard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for ValidatorDashboard component from Validator.',
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
    devLog('ValidatorDashboard rendered successfully');
  },
};
