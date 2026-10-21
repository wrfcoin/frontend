import type { Meta, StoryObj } from '@storybook/react';
import ProposalList from '../../components/Governance/ProposalList.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof ProposalList> = {
  title: 'Governance/ProposalList',
  component: ProposalList,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for ProposalList component from Governance.',
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
    devLog('ProposalList rendered successfully');
  },
};
