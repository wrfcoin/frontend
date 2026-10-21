import type { Meta, StoryObj } from '@storybook/react';
import ErrorBoundary from '../../common/ErrorBoundary.jsx';

const meta: Meta<typeof ErrorBoundary> = {
  title: 'Components/Common/ErrorBoundary',
  component: ErrorBoundary,
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
