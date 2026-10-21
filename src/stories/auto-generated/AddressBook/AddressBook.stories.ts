import type { Meta, StoryObj } from '@storybook/react';
import AddressBook from '../../components/AddressBook/AddressBook.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof AddressBook> = {
  title: 'AddressBook/AddressBook',
  component: AddressBook,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for AddressBook component from AddressBook.',
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
    devLog('AddressBook rendered successfully');
  },
};
