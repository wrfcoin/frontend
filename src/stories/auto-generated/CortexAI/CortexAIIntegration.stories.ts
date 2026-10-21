import type { Meta, StoryObj } from '@storybook/react';
import CortexAIIntegration from '../../components/CortexAI/CortexAIIntegration.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof CortexAIIntegration> = {
  title: 'CortexAI/CortexAIIntegration',
  component: CortexAIIntegration,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for CortexAIIntegration component from CortexAI.',
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
    devLog('CortexAIIntegration rendered successfully');
  },
};
