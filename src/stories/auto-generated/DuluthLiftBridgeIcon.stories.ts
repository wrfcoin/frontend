import type { Meta, StoryObj } from '@storybook/react';
import DuluthLiftBridgeIcon from '../../CrossChain/DuluthLiftBridgeIcon.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof DuluthLiftBridgeIcon> = {
  title: 'Components/CrossChain/DuluthLiftBridgeIcon',
  component: DuluthLiftBridgeIcon,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# DuluthLiftBridgeIcon

Component from the CrossChain category.

- **Props**: 0
- **Complexity**: low
- **Lines**: 34
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
    devLog('DuluthLiftBridgeIcon rendered successfully');
  },
};
