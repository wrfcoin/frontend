import type { Meta, StoryObj } from '@storybook/react';
import LuftdatenDashboard from '../../components/Luftdaten/LuftdatenDashboard.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof LuftdatenDashboard> = {
  title: 'Luftdaten/LuftdatenDashboard',
  component: LuftdatenDashboard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for LuftdatenDashboard component from Luftdaten.',
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
    devLog('LuftdatenDashboard rendered successfully');
  },
};
