import type { Meta, StoryObj } from '@storybook/react';
import SearchSidebar from '../../components/Search/SearchSidebar.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof SearchSidebar> = {
  title: 'Search/SearchSidebar',
  component: SearchSidebar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for SearchSidebar component from Search.',
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
    devLog('SearchSidebar rendered successfully');
  },
};
