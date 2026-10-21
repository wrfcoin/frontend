import type { Meta, StoryObj } from '@storybook/react';
import FoundationGovernanceVoting from '../../components/Governance/FoundationGovernanceVoting.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof FoundationGovernanceVoting> = {
  title: 'Governance/FoundationGovernanceVoting',
  component: FoundationGovernanceVoting,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for FoundationGovernanceVoting component from Governance.',
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
    devLog('FoundationGovernanceVoting rendered successfully');
  },
};
