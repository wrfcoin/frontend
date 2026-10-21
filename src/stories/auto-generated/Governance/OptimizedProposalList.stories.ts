import type { Meta, StoryObj } from '@storybook/react';
import OptimizedProposalList from '../../components/Governance/OptimizedProposalList.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof OptimizedProposalList> = {
  title: 'Governance/OptimizedProposalList',
  component: OptimizedProposalList,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for OptimizedProposalList component from Governance.',
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
    devLog('OptimizedProposalList rendered successfully');
  },
};
