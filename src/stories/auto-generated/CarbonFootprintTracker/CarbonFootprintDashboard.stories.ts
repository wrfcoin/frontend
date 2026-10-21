import type { Meta, StoryObj } from '@storybook/react';
import CarbonFootprintDashboard from '../../components/CarbonFootprintTracker/CarbonFootprintDashboard.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof CarbonFootprintDashboard> = {
  title: 'CarbonFootprintTracker/CarbonFootprintDashboard',
  component: CarbonFootprintDashboard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for CarbonFootprintDashboard component from CarbonFootprintTracker.',
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
    devLog('CarbonFootprintDashboard rendered successfully');
  },
};
