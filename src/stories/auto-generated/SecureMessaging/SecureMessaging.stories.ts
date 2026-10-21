import type { Meta, StoryObj } from '@storybook/react';
import SecureMessaging from '../../components/SecureMessaging/SecureMessaging.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof SecureMessaging> = {
  title: 'SecureMessaging/SecureMessaging',
  component: SecureMessaging,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for SecureMessaging component from SecureMessaging.',
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
    devLog('SecureMessaging rendered successfully');
  },
};
