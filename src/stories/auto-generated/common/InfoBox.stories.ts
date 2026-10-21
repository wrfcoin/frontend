import type { Meta, StoryObj } from '@storybook/react';
import InfoBox from '../../components/common/InfoBox.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof InfoBox> = {
  title: 'common/InfoBox',
  component: InfoBox,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Auto-generated story for InfoBox component from common.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    // Auto-generated argTypes - customize as needed
    type: {
      control: 'text',
      description: 'type prop (required)',
    },
    title: {
      control: 'text',
      description: 'title prop (required)',
    },
    content: {
      control: 'text',
      description: 'content prop (required)',
    },
    dismissible: {
      control: 'boolean',
      description: 'dismissible prop (required)',
    },
    bordered: {
      control: 'boolean',
      description: 'bordered prop (required)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    type: 'type',
    title: 'Sample title',
    content: 'content',
    dismissible: false,
    bordered: false,
  },
};

export const Interactive: Story = {
  args: {
    type: 'type',
    title: 'Sample title',
    content: 'content',
    dismissible: false,
    bordered: false,
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    // Add interaction tests here
    devLog('InfoBox rendered successfully');
  },
};
