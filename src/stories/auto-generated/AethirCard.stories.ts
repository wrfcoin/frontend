import type { Meta, StoryObj } from '@storybook/react';
import AethirCard from '../../Integrations/AethirCard.jsx';

const meta: Meta<typeof AethirCard> = {
  title: 'Components/Integrations/AethirCard',
  component: AethirCard,
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
