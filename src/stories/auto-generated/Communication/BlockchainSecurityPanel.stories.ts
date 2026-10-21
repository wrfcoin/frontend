import type { Meta, StoryObj } from '@storybook/react';
import BlockchainSecurityPanel from '../../components/Communication/BlockchainSecurityPanel.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof BlockchainSecurityPanel> = {
  title: 'Communication/BlockchainSecurityPanel',
  component: BlockchainSecurityPanel,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for BlockchainSecurityPanel component from Communication.',
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
    devLog('BlockchainSecurityPanel rendered successfully');
  },
};
