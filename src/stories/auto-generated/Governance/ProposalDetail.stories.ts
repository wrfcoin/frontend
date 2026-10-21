import type { Meta, StoryObj } from '@storybook/react';
import ProposalDetail from '../../components/Governance/ProposalDetail.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof ProposalDetail> = {
  title: 'Governance/ProposalDetail',
  component: ProposalDetail,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for ProposalDetail component from Governance.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    // Auto-generated argTypes - customize as needed
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // No props detected
  },
};

export const Interactive: Story = {
  args: {
    // No props detected
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    // Add interaction tests here
    devLog('ProposalDetail rendered successfully');
  },
};
