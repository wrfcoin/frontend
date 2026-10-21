import type { Meta, StoryObj } from '@storybook/react';
import ComputationalNFTProposal from '../../Governance/ComputationalNFTProposal.jsx';

const meta: Meta<typeof ComputationalNFTProposal> = {
  title: 'Components/Governance/ComputationalNFTProposal',
  component: ComputationalNFTProposal,
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
