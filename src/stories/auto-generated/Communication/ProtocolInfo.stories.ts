import type { Meta, StoryObj } from '@storybook/react';
import ProtocolInfo from '../../components/Communication/ProtocolInfo.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof ProtocolInfo> = {
  title: 'Communication/ProtocolInfo',
  component: ProtocolInfo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for ProtocolInfo component from Communication.',
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
    devLog('ProtocolInfo rendered successfully');
  },
};
