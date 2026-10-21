import type { Meta, StoryObj } from '@storybook/react';
import ExampleProposals from '../../Governance/ExampleProposals.jsx';

const meta: Meta<typeof ExampleProposals> = {
  title: 'Components/Governance/ExampleProposals',
  component: ExampleProposals,
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
