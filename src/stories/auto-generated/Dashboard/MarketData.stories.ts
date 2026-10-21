import type { Meta, StoryObj } from '@storybook/react';
import MarketData from '../../components/Dashboard/MarketData.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof MarketData> = {
  title: 'Dashboard/MarketData',
  component: MarketData,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for MarketData component from Dashboard.',
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
    devLog('MarketData rendered successfully');
  },
};
