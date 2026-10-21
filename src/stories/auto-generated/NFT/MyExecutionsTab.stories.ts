import type { Meta, StoryObj } from '@storybook/react';
import MyExecutionsTab from '../../components/nft/MyExecutionsTab.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof MyExecutionsTab> = {
  title: 'NFT/MyExecutionsTab',
  component: MyExecutionsTab,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for MyExecutionsTab component from NFT.',
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
    devLog('MyExecutionsTab rendered successfully');
  },
};
