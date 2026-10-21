import type { Meta, StoryObj } from '@storybook/react';
import ProposalDetail from '../../Governance/ProposalDetail.jsx';

const meta: Meta<typeof ProposalDetail> = {
  title: 'Components/Governance/ProposalDetail',
  component: ProposalDetail,
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
