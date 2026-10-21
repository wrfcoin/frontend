import type { Meta, StoryObj } from '@storybook/react';
import DebugPage from '../../Debug/DebugPage.jsx';

const meta: Meta<typeof DebugPage> = {
  title: 'Components/Debug/DebugPage',
  component: DebugPage,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // No props detected
  },
};
