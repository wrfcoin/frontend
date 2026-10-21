import type { Meta, StoryObj } from '@storybook/react';
import ComputationalNFTProposal from '../../components/Governance/ComputationalNFTProposal.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof ComputationalNFTProposal> = {
  title: 'Governance/ComputationalNFTProposal',
  component: ComputationalNFTProposal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for ComputationalNFTProposal component from Governance.',
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
    devLog('ComputationalNFTProposal rendered successfully');
  },
};
