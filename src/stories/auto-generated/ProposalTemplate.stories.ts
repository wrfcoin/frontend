import type { Meta, StoryObj } from '@storybook/react';
import ProposalTemplate from '../../Governance/ProposalTemplate.jsx';

const meta: Meta<typeof ProposalTemplate> = {
  title: 'Components/Governance/ProposalTemplate',
  component: ProposalTemplate,
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
