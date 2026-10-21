import type { Meta, StoryObj } from '@storybook/react';
import InfoIcon from '../../components/common/InfoIcon.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof InfoIcon> = {
  title: 'common/InfoIcon',
  component: InfoIcon,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Auto-generated story for InfoIcon component from common.',
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
    devLog('InfoIcon rendered successfully');
  },
};
