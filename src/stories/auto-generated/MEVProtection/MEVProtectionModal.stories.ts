import type { Meta, StoryObj } from '@storybook/react';
import MEVProtectionModal from '../../components/MEVProtection/MEVProtectionModal.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof MEVProtectionModal> = {
  title: 'MEVProtection/MEVProtectionModal',
  component: MEVProtectionModal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for MEVProtectionModal component from MEVProtection.',
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
    devLog('MEVProtectionModal rendered successfully');
  },
};
