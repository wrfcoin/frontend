import type { Meta, StoryObj } from '@storybook/react';
import TransactionList from '../../Explorer/TransactionList.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof TransactionList> = {
  title: 'Components/Explorer/TransactionList',
  component: TransactionList,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# TransactionList

Component from the Explorer category.

- **Props**: 0
- **Complexity**: low
- **Lines**: 84
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
    devLog('TransactionList rendered successfully');
  },
};
