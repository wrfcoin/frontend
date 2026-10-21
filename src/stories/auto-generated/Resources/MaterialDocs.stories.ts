import type { Meta, StoryObj } from '@storybook/react';
import MaterialDocs from '../../components/Resources/MaterialDocs.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof MaterialDocs> = {
  title: 'Resources/MaterialDocs',
  component: MaterialDocs,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for MaterialDocs component from Resources.',
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
    devLog('MaterialDocs rendered successfully');
  },
};
