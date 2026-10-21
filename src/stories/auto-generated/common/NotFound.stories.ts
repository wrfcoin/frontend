import type { Meta, StoryObj } from '@storybook/react';
import NotFound from '../../components/common/NotFound.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof NotFound> = {
  title: 'common/NotFound',
  component: NotFound,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Auto-generated story for NotFound component from common.',
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
    devLog('NotFound rendered successfully');
  },
};
