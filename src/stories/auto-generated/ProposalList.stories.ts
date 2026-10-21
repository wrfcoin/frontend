import type { Meta, StoryObj } from '@storybook/react';
import ProposalList from '../../Governance/ProposalList.jsx';

const meta: Meta<typeof ProposalList> = {
  title: 'Components/Governance/ProposalList',
  component: ProposalList,
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
