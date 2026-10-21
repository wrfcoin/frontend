import type { Meta, StoryObj } from '@storybook/react';
import StandardsNav from '../../components/Standards/StandardsNav.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof StandardsNav> = {
  title: 'Standards/StandardsNav',
  component: StandardsNav,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for StandardsNav component from Standards.',
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
    devLog('StandardsNav rendered successfully');
  },
};
