import type { Meta, StoryObj } from '@storybook/react';
import ApiKeyManager from '../../components/developer/ApiKeyManager.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof ApiKeyManager> = {
  title: 'developer/ApiKeyManager',
  component: ApiKeyManager,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for ApiKeyManager component from developer.',
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
    devLog('ApiKeyManager rendered successfully');
  },
};
