import type { Meta, StoryObj } from '@storybook/react';
import ModuleController from '../../components/Settings/ModuleController.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof ModuleController> = {
  title: 'Settings/ModuleController',
  component: ModuleController,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for ModuleController component from Settings.',
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
    devLog('ModuleController rendered successfully');
  },
};
