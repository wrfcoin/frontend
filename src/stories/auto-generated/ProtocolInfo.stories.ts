import type { Meta, StoryObj } from '@storybook/react';
import ProtocolInfo from '../../Communication/ProtocolInfo.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof ProtocolInfo> = {
  title: 'Components/Communication/ProtocolInfo',
  component: ProtocolInfo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# ProtocolInfo

Component from the Communication category.

- **Props**: 0
- **Complexity**: medium
- **Lines**: 237
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    // No props detected
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
  play: async ({ canvasElement }) => {
    devLog('ProtocolInfo rendered successfully');
  },
};
