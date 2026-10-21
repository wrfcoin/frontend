import type { Meta, StoryObj } from '@storybook/react';
import CreateProposal from '../../Governance/CreateProposal.jsx';

const meta: Meta<typeof CreateProposal> = {
  title: 'Components/Governance/CreateProposal',
  component: CreateProposal,
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
