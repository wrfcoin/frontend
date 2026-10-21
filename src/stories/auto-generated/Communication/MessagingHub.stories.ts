import type { Meta, StoryObj } from '@storybook/react';
import MessagingHub from '../../components/Communication/MessagingHub.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof MessagingHub> = {
  title: 'Communication/MessagingHub',
  component: MessagingHub,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for MessagingHub component from Communication.',
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
    devLog('MessagingHub rendered successfully');
  },
};
