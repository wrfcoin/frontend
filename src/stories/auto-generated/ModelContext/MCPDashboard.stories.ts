import type { Meta, StoryObj } from '@storybook/react';
import MCPDashboard from '../../components/ModelContext/MCPDashboard.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof MCPDashboard> = {
  title: 'ModelContext/MCPDashboard',
  component: MCPDashboard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for MCPDashboard component from ModelContext.',
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
    devLog('MCPDashboard rendered successfully');
  },
};
