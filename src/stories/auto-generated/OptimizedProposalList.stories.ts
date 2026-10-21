import type { Meta, StoryObj } from '@storybook/react';
import OptimizedProposalList from '../../Governance/OptimizedProposalList.jsx';

const meta: Meta<typeof OptimizedProposalList> = {
  title: 'Components/Governance/OptimizedProposalList',
  component: OptimizedProposalList,
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
