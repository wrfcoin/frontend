import type { Meta, StoryObj } from '@storybook/react';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof StatusBadge> = {
  title: 'common/StatusBadge',
  component: StatusBadge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for StatusBadge component from common.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    // Auto-generated argTypes - customize as needed
    status: {
      control: 'text',
      description: 'status prop (required)',
    },
    size: {
      control: 'text',
      description: 'size prop (required)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    status: 'Sample status',
    size: 'size',
  },
};

export const Interactive: Story = {
  args: {
    status: 'Sample status',
    size: 'size',
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    // Add interaction tests here
    devLog('StatusBadge rendered successfully');
  },
};
