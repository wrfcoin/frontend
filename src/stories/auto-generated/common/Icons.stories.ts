import type { Meta, StoryObj } from '@storybook/react';
import Icons from '../../components/common/Icons.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof Icons> = {
  title: 'common/Icons',
  component: Icons,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Auto-generated story for Icons component from common.',
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
    devLog('Icons rendered successfully');
  },
};
