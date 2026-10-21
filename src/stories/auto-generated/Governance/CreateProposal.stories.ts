import type { Meta, StoryObj } from '@storybook/react';
import CreateProposal from '../../components/Governance/CreateProposal.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof CreateProposal> = {
  title: 'Governance/CreateProposal',
  component: CreateProposal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for CreateProposal component from Governance.',
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
    devLog('CreateProposal rendered successfully');
  },
};
