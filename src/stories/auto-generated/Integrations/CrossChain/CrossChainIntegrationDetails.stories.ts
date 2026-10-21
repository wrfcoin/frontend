import type { Meta, StoryObj } from '@storybook/react';
import CrossChainIntegrationDetails from '../../components/Integrations/CrossChain/CrossChainIntegrationDetails.jsx';
import { devLog } from '../../../../utils/logger';

const meta: Meta<typeof CrossChainIntegrationDetails> = {
  title: 'Integrations/CrossChain/CrossChainIntegrationDetails',
  component: CrossChainIntegrationDetails,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for CrossChainIntegrationDetails component from Integrations/CrossChain.',
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
    devLog('CrossChainIntegrationDetails rendered successfully');
  },
};
