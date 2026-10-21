import type { Meta, StoryObj } from '@storybook/react';
import SettingsPage from '../../components/Settings/SettingsPage.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof SettingsPage> = {
  title: 'Settings/SettingsPage',
  component: SettingsPage,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for SettingsPage component from Settings.',
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
    devLog('SettingsPage rendered successfully');
  },
};
