import type { Meta, StoryObj } from '@storybook/react';
import SecureMessagingHub from '../../components/Communication/SecureMessagingHub.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof SecureMessagingHub> = {
  title: 'Communication/SecureMessagingHub',
  component: SecureMessagingHub,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for SecureMessagingHub component from Communication.',
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
    devLog('SecureMessagingHub rendered successfully');
  },
};
