import type { Meta, StoryObj } from '@storybook/react';
import EnhancedBridgePage from '../../components/CrossChain/EnhancedBridgePage.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof EnhancedBridgePage> = {
  title: 'CrossChain/EnhancedBridgePage',
  component: EnhancedBridgePage,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for EnhancedBridgePage component from CrossChain.',
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
    devLog('EnhancedBridgePage rendered successfully');
  },
};
