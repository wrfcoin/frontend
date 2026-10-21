import type { Meta, StoryObj } from '@storybook/react';
import FileStorageDistributionChart from '../../components/Dashboard/Charts/FileStorageDistributionChart.jsx';
import { devLog } from '../../../../utils/logger';

const meta: Meta<typeof FileStorageDistributionChart> = {
  title: 'Dashboard/Charts/FileStorageDistributionChart',
  component: FileStorageDistributionChart,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for FileStorageDistributionChart component from Dashboard/Charts.',
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
    devLog('FileStorageDistributionChart rendered successfully');
  },
};
