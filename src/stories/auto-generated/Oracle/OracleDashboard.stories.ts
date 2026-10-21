import type { Meta, StoryObj } from '@storybook/react';
import OracleDashboard from '../../components/Oracle/OracleDashboard.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof OracleDashboard> = {
  title: 'Oracle/OracleDashboard',
  component: OracleDashboard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for OracleDashboard component from Oracle.',
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
    devLog('OracleDashboard rendered successfully');
  },
};
