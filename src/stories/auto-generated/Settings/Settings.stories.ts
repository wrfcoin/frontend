import type { Meta, StoryObj } from '@storybook/react';
import Settings from '../../components/Settings/Settings.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof Settings> = {
  title: 'Settings/Settings',
  component: Settings,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Auto-generated story for Settings component from Settings.',
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
    devLog('Settings rendered successfully');
  },
};
