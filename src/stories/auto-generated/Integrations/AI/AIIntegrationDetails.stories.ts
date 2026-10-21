import type { Meta, StoryObj } from '@storybook/react';
import AIIntegrationDetails from '../../components/Integrations/AI/AIIntegrationDetails.jsx';
import { devLog } from '../../../../utils/logger';

const meta: Meta<typeof AIIntegrationDetails> = {
  title: 'Integrations/AI/AIIntegrationDetails',
  component: AIIntegrationDetails,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for AIIntegrationDetails component from Integrations/AI.',
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
    devLog('AIIntegrationDetails rendered successfully');
  },
};
