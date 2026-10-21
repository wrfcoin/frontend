import type { Meta, StoryObj } from '@storybook/react';
import SearchResults from '../../components/Search/SearchResults.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof SearchResults> = {
  title: 'Search/SearchResults',
  component: SearchResults,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for SearchResults component from Search.',
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
    devLog('SearchResults rendered successfully');
  },
};
