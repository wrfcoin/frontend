import type { Meta, StoryObj } from '@storybook/react';
import LangChainIntegrationDetails from '../../components/Integrations/AI/LangChainIntegrationDetails.jsx';
import { devLog } from '../../../../utils/logger';

const meta: Meta<typeof LangChainIntegrationDetails> = {
  title: 'Integrations/AI/LangChainIntegrationDetails',
  component: LangChainIntegrationDetails,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for LangChainIntegrationDetails component from Integrations/AI.',
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
    devLog('LangChainIntegrationDetails rendered successfully');
  },
};
