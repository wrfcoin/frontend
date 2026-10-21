import type { Meta, StoryObj } from '@storybook/react';
import EnhancedCreateProposal from '../../components/Governance/EnhancedCreateProposal.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof EnhancedCreateProposal> = {
  title: 'Governance/EnhancedCreateProposal',
  component: EnhancedCreateProposal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for EnhancedCreateProposal component from Governance.',
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
    devLog('EnhancedCreateProposal rendered successfully');
  },
};
