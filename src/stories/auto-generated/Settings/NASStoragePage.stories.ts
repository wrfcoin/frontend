import type { Meta, StoryObj } from '@storybook/react';
import NASStoragePage from '../../components/Settings/NASStoragePage.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof NASStoragePage> = {
  title: 'Settings/NASStoragePage',
  component: NASStoragePage,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for NASStoragePage component from Settings.',
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
    devLog('NASStoragePage rendered successfully');
  },
};
