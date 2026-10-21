import type { Meta, StoryObj } from '@storybook/react';
import UserPreferencesPage from '../../components/Settings/UserPreferencesPage.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof UserPreferencesPage> = {
  title: 'Settings/UserPreferencesPage',
  component: UserPreferencesPage,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for UserPreferencesPage component from Settings.',
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
    devLog('UserPreferencesPage rendered successfully');
  },
};
