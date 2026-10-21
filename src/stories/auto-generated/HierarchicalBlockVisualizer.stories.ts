import type { Meta, StoryObj } from '@storybook/react';
import HierarchicalBlockVisualizer from '../../Explorer/HierarchicalBlockVisualizer.jsx';

const meta: Meta<typeof HierarchicalBlockVisualizer> = {
  title: 'Components/Explorer/HierarchicalBlockVisualizer',
  component: HierarchicalBlockVisualizer,
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
