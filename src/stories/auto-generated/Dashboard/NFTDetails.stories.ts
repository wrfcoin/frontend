import type { Meta, StoryObj } from '@storybook/react';
import NFTDetails from '../../components/Dashboard/NFTDetails.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof NFTDetails> = {
  title: 'Dashboard/NFTDetails',
  component: NFTDetails,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for NFTDetails component from Dashboard.',
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
    devLog('NFTDetails rendered successfully');
  },
};
