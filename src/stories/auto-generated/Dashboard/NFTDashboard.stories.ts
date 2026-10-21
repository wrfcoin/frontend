import type { Meta, StoryObj } from '@storybook/react';
import NFTDashboard from '../../components/Dashboard/NFTDashboard.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof NFTDashboard> = {
  title: 'Dashboard/NFTDashboard',
  component: NFTDashboard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for NFTDashboard component from Dashboard.',
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
    devLog('NFTDashboard rendered successfully');
  },
};
