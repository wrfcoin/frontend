import type { Meta, StoryObj } from '@storybook/react';
import SensorCommunityPage from '../../components/SensorCommunity/SensorCommunityPage.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof SensorCommunityPage> = {
  title: 'SensorCommunity/SensorCommunityPage',
  component: SensorCommunityPage,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for SensorCommunityPage component from SensorCommunity.',
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
    devLog('SensorCommunityPage rendered successfully');
  },
};
