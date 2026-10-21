import type { Meta, StoryObj } from '@storybook/react';
import BlockchainSecurityPanel from '../../Communication/BlockchainSecurityPanel.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof BlockchainSecurityPanel> = {
  title: 'Components/Communication/BlockchainSecurityPanel',
  component: BlockchainSecurityPanel,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# BlockchainSecurityPanel

Component from the Communication category.

- **Props**: 0
- **Complexity**: medium
- **Lines**: 214
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    // No props detected
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
  play: async ({ canvasElement }) => {
    devLog('BlockchainSecurityPanel rendered successfully');
  },
};
