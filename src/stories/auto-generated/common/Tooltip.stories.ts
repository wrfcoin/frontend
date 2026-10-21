import type { Meta, StoryObj } from '@storybook/react';
import Tooltip from '../../components/common/Tooltip.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof Tooltip> = {
  title: 'common/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Auto-generated story for Tooltip component from common.',
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
    devLog('Tooltip rendered successfully');
  },
};
