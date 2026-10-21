import type { Meta, StoryObj } from '@storybook/react';
import WikiDocs from '../../components/Resources/WikiDocs.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof WikiDocs> = {
  title: 'Resources/WikiDocs',
  component: WikiDocs,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for WikiDocs component from Resources.',
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
    devLog('WikiDocs rendered successfully');
  },
};
