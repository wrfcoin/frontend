import type { Meta, StoryObj } from '@storybook/react';
import ProgressiveLoader from '../../components/Loading/ProgressiveLoader.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof ProgressiveLoader> = {
  title: 'Loading/ProgressiveLoader',
  component: ProgressiveLoader,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for ProgressiveLoader component from Loading.',
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
    devLog('ProgressiveLoader rendered successfully');
  },
};
