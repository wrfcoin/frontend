import type { Meta, StoryObj } from '@storybook/react';
import MCPContextSelector from '../../components/ModelContext/MCPContextSelector.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof MCPContextSelector> = {
  title: 'ModelContext/MCPContextSelector',
  component: MCPContextSelector,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for MCPContextSelector component from ModelContext.',
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
    devLog('MCPContextSelector rendered successfully');
  },
};
