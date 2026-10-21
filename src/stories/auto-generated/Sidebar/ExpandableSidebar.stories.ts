import type { Meta, StoryObj } from '@storybook/react';
import ExpandableSidebar from '../../components/Sidebar/ExpandableSidebar.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof ExpandableSidebar> = {
  title: 'Sidebar/ExpandableSidebar',
  component: ExpandableSidebar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for ExpandableSidebar component from Sidebar.',
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
    devLog('ExpandableSidebar rendered successfully');
  },
};
