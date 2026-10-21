import type { Meta, StoryObj } from '@storybook/react';
import WorkflowIntegration from '../../components/ComputationalNFT/WorkflowIntegration.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof WorkflowIntegration> = {
  title: 'ComputationalNFT/WorkflowIntegration',
  component: WorkflowIntegration,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for WorkflowIntegration component from ComputationalNFT.',
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
    devLog('WorkflowIntegration rendered successfully');
  },
};
