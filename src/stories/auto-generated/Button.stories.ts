import type { Meta, StoryObj } from '@storybook/react';
import Button from '../../common/Button.jsx';

const meta: Meta<typeof Button> = {
  title: 'Components/Common/Button',
  component: Button,
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
